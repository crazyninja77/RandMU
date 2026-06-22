import { db } from "./db.js";
import type { Song } from "./types.js";

interface SongRow {
  id: string;
  title: string;
  artist: string;
  artist_description: string;
  song_description: string;
  country: string;
  language: string;
  genre: string;
  subgenre: string;
  album_name: string | null;
  album_type: string | null;
  album_description: string | null;
  year: number | null;
  spotify_track_id: string | null;
  spotify_url: string | null;
  artist_image_url: string | null;
  album_image_url: string | null;
  rating_sum: number;
  rating_count: number;
  description_source: string;
}

function rowToSong(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    artistDescription: row.artist_description,
    songDescription: row.song_description,
    country: row.country,
    language: row.language,
    genre: row.genre,
    subgenre: row.subgenre,
    albumName: row.album_name,
    albumType: row.album_type,
    albumDescription: row.album_description,
    year: row.year,
    spotifyTrackId: row.spotify_track_id,
    spotifyUrl: row.spotify_url,
    artistImageUrl: row.artist_image_url,
    albumImageUrl: row.album_image_url,
    ratingAverage: row.rating_count > 0 ? row.rating_sum / row.rating_count : null,
    ratingCount: row.rating_count,
    descriptionSource: row.description_source,
  };
}

export interface SongDescriptions {
  songDescription: string;
  artistDescription: string;
  albumDescription: string | null;
}

/** Persist model-written descriptions for a song and mark its source as 'llm'. */
export function setSongDescriptions(id: string, d: SongDescriptions): void {
  db.prepare(
    `UPDATE songs SET song_description = ?, artist_description = ?,
       album_description = ?, description_source = 'llm' WHERE id = ?`,
  ).run(d.songDescription, d.artistDescription, d.albumDescription, id);
}

export interface RatingResult {
  average: number;
  count: number;
}

/**
 * Record a 0–10 rating for a song and return the new community average + count.
 * Returns null if the song does not exist.
 */
export function rateSong(id: string, value: number): RatingResult | null {
  const clamped = Math.max(0, Math.min(10, value));
  const info = db
    .prepare(
      "UPDATE songs SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE id = ?",
    )
    .run(clamped, id);
  if (info.changes === 0) return null;
  const row = db
    .prepare("SELECT rating_sum AS s, rating_count AS c FROM songs WHERE id = ?")
    .get(id) as { s: number; c: number };
  return { average: row.s / row.c, count: row.c };
}

/**
 * Give every un-rated song a believable community-rating baseline so the
 * "what others rated" comparison always has something to show. Idempotent:
 * only touches rows that have no ratings yet.
 */
export function seedRatingBaselines(): number {
  const ids = (
    db.prepare("SELECT id FROM songs WHERE rating_count = 0").all() as { id: string }[]
  ).map((r) => r.id);
  const update = db.prepare("UPDATE songs SET rating_sum = ?, rating_count = ? WHERE id = ?");
  const run = db.transaction((rows: string[]) => {
    for (const id of rows) {
      const count = 12 + Math.floor(Math.random() * 240);
      const avg = 5.4 + Math.random() * 3.2; // 5.4 – 8.6
      update.run(Number((avg * count).toFixed(2)), count, id);
    }
  });
  run(ids);
  return ids.length;
}

export function getRandomSong(): Song | null {
  const row = db
    .prepare("SELECT * FROM songs ORDER BY RANDOM() LIMIT 1")
    .get() as SongRow | undefined;
  return row ? rowToSong(row) : null;
}

export function getSongById(id: string): Song | null {
  const row = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as
    | SongRow
    | undefined;
  return row ? rowToSong(row) : null;
}

export function getStats() {
  const total = (db.prepare("SELECT COUNT(*) AS c FROM songs").get() as { c: number }).c;
  const countries = (
    db.prepare("SELECT COUNT(DISTINCT country) AS c FROM songs WHERE country != ''").get() as {
      c: number;
    }
  ).c;
  const genres = (
    db.prepare("SELECT COUNT(DISTINCT genre) AS c FROM songs WHERE genre != ''").get() as {
      c: number;
    }
  ).c;
  const languages = (
    db.prepare("SELECT COUNT(DISTINCT language) AS c FROM songs WHERE language != ''").get() as {
      c: number;
    }
  ).c;
  return { total, countries, genres, languages };
}
