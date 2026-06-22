import type { Song } from "./types.js";
import { getSongById, setSongDescriptions } from "./library.js";
import { generateDescriptions, llmAvailable } from "./llm.js";

// De-duplicate concurrent generations for the same song so two simultaneous
// reveals of the same track only trigger one model call.
const inflight = new Map<string, Promise<Song>>();

function needsGeneration(song: Song): boolean {
  return song.descriptionSource !== "curated" && song.descriptionSource !== "llm";
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

  const task = (async (): Promise<Song> => {
    const generated = await generateDescriptions({
      title: song.title,
      artist: song.artist,
      country: song.country,
      language: song.language,
      genre: song.genre,
      subgenre: song.subgenre,
      albumName: song.albumName,
      albumType: song.albumType,
      year: song.year,
    });
    if (!generated) return song;
    setSongDescriptions(song.id, generated);
    return getSongById(song.id) ?? { ...song, ...generated, descriptionSource: "llm" };
  })().finally(() => inflight.delete(song.id));

  inflight.set(song.id, task);
  return task;
}
