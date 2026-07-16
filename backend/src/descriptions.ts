import type { Song } from "./types.js";
import { getSongById, setSongDescriptions } from "./library.js";
import { generateDescriptions, llmAvailable, llmStatus, type GenerateOptions } from "./llm.js";
import { gatherGrounding } from "./grounding.js";
import { getAudioFeatures, describeAudioFeatures } from "./spotifyAudio.js";
import {
  descriptionKey,
  localizedKey,
  loadDescriptionOverlay,
  recordDescription,
  type StoredDescription,
} from "./descriptionStore.js";

// De-duplicate concurrent generations for the same song so two simultaneous
// reveals of the same track only trigger one model call.
const inflight = new Map<string, Promise<Song>>();

function needsGeneration(song: Song): boolean {
  return song.descriptionSource !== "curated" && song.descriptionSource !== "llm";
}

// Lazily-loaded cache of already-generated non-English descriptions, keyed by
// localizedKey. English lives in the DB + base overlay; other locales are only
// ever served from the overlay / this cache (never written to the song rows).
let localeCache: Map<string, StoredDescription> | null = null;
function localeOverlay(): Map<string, StoredDescription> {
  if (!localeCache) localeCache = loadDescriptionOverlay();
  return localeCache;
}

function withDescriptions(song: Song, d: StoredDescription): Song {
  return {
    ...song,
    songDescription: d.songDescription,
    artistDescription: d.artistDescription,
    albumDescription: d.albumDescription,
    descriptionSource: "llm",
  };
}

/**
 * Ensure a song's descriptions are available in `lang`. English is the base
 * path (generated + stored on the song). For other locales we translate the
 * liner notes with the model on first request and cache them in the durable
 * overlay, falling back to the song's English text if generation isn't possible.
 */
async function describeSongLocalized(song: Song, lang: string): Promise<Song> {
  const baseKey = descriptionKey({
    spotifyTrackId: song.spotifyTrackId,
    artist: song.artist,
    title: song.title,
  });
  const key = localizedKey(baseKey, lang);
  const cached = localeOverlay().get(key);
  if (cached) return withDescriptions(song, cached);

  const [grounding, audio] = await Promise.all([
    gatherGrounding({
      title: song.title,
      artist: song.artist,
      country: song.country,
      year: song.year,
      albumName: song.albumName,
      albumType: song.albumType,
    }),
    getAudioFeatures(song.spotifyTrackId),
  ]);
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
      acousticProfile: audio ? describeAudioFeatures(audio) : null,
      lang,
    },
    grounding,
  );
  if (!generated) return song;
  const stored: StoredDescription = {
    key,
    songDescription: generated.songDescription,
    artistDescription: generated.artistDescription,
    albumDescription: generated.albumDescription,
    model: generated.model ?? llmStatus().model ?? "unknown",
    generatedAt: new Date().toISOString(),
    lang,
  };
  localeOverlay().set(key, stored);
  recordDescription(stored);
  return withDescriptions(song, stored);
}

/**
 * Generate, verify, cache (DB) and persist (overlay) model-written descriptions
 * for a song. Returns the upgraded Song, or the original if generation failed.
 * Shared by the live reveal path and the background pre-generation worker.
 */
export async function describeSong(song: Song, opts: GenerateOptions = {}): Promise<Song> {
  const [grounding, audio] = await Promise.all([
    gatherGrounding({
      title: song.title,
      artist: song.artist,
      country: song.country,
      year: song.year,
      albumName: song.albumName,
      albumType: song.albumType,
    }),
    getAudioFeatures(song.spotifyTrackId),
  ]);
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
      acousticProfile: audio ? describeAudioFeatures(audio) : null,
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
export async function ensureSongDescribed(song: Song, lang = "en"): Promise<Song> {
  // Non-English reveals: translate the liner notes on demand (cached), falling
  // back to the English text below if no model is available.
  if (lang !== "en" && llmAvailable()) {
    const localeKeyId = `${lang}:${song.id}`;
    const existing = inflight.get(localeKeyId);
    if (existing) return existing;
    const task = describeSongLocalized(song, lang).finally(() => inflight.delete(localeKeyId));
    inflight.set(localeKeyId, task);
    return task;
  }

  if (!needsGeneration(song) || !llmAvailable()) return song;

  const existing = inflight.get(song.id);
  if (existing) return existing;

  const task = describeSong(song).finally(() => inflight.delete(song.id));
  inflight.set(song.id, task);
  return task;
}
