import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.RANDMU_DB_PATH ?? join(__dirname, "..", "randmu.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    artist_description TEXT NOT NULL DEFAULT '',
    song_description TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT '',
    genre TEXT NOT NULL DEFAULT '',
    subgenre TEXT NOT NULL DEFAULT '',
    album_name TEXT,
    album_type TEXT,
    album_description TEXT,
    year INTEGER,
    spotify_track_id TEXT,
    spotify_url TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    method TEXT NOT NULL DEFAULT 'ideal',
    status TEXT NOT NULL DEFAULT 'pending',
    song_id TEXT,
    created_at TEXT NOT NULL,
    paid_at TEXT,
    FOREIGN KEY (song_id) REFERENCES songs(id)
  );

  CREATE INDEX IF NOT EXISTS idx_songs_country ON songs(country);
  CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_songs_spotify ON songs(spotify_track_id);
`);
