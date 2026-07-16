import type { Song } from "./types.js";
import { getSongById, setSongDescriptions } from "./library.js";
import { generateDescriptions, llmAvailable, llmStatus, type GenerateOptions } from "./llm.js";
import { gatherGrounding } from "./grounding.js";
import { descriptionKey, recordDescription } from "./descriptionStore.js";

// De-duplicate concurrent generations for the same song so two simultaneous
// reveals of the same track only trigger one model call.
const inflight = new Map<string, Promise<Song>>();

function needsGeneration(song: Song): boolean {
  return song.descriptionSource !== "curated" && song.descriptionSource !== "llm";
}

/**
 * Generate, verify, cache (DB) and persist (overlay) model-written descriptions
 * for a song. Returns the upgraded Song, or the original if generation failed.
 * Shared by the live reveal path and the background pre-generation worker.
 */
export async function describeSong(song: Song, opts: GenerateOptions = {}): Promise<Song> {
  const grounding = await gatherGrounding({
    title: song.title,
    artist: song.artist,
    country: song.country,
    year: song.year,
    albumName: song.albumName,
    albumType: song.albumType,
  });
  const generated = await generateDescriptions(
    {
      title: song.title,
      artist: song.artist,
      country: song.country,
      language: song.language,
      genre: song.genre,
      subgenre: song.subgenre,
      albumName: song.albumName,
      albumType: song.albumType,
      year: song.year,
    },
    grounding,
    opts,
  );
  if (!generated) return song;
  setSongDescriptions(song.id, generated);
  recordDescription({
    key: descriptionKey({ spotifyTrackId: song.spotifyTrackId, artist: song.artist, title: song.title }),
    songDescription: generated.songDescription,
    artistDescription: generated.artistDescription,
    albumDescription: generated.albumDescription,
    model: generated.model ?? llmStatus().model ?? "unknown",
    generatedAt: new Date().toISOString(),
  });
  return getSongById(song.id) ?? { ...song, ...generated, descriptionSource: "llm" };
}

/**
 * Ensure a song has rich, model-written descriptions, generating and caching
 * them on first reveal. Falls back to the song's existing (templated) text if no
 * model is configured or generation fails — callers always get a usable Song.
 */
export async function ensureSongDescribed(song: Song): Promise<Song> {
  if (!needsGeneration(song) || !llmAvailable()) return song;

  const existing = inflight.get(song.id);
  if (existing) return existing;

  const task = describeSong(song).finally(() => inflight.delete(song.id));
  inflight.set(song.id, task);
  return task;
}
