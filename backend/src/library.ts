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
  };
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
