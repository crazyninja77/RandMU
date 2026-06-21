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
    spotify_url TEXT,
    artist_image_url TEXT,
    album_image_url TEXT,
    rating_sum REAL NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0
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

// Lightweight migrations for databases created before a column existed.
const songCols = new Set(
  (db.prepare("PRAGMA table_info(songs)").all() as { name: string }[]).map((c) => c.name),
);
for (const [col, ddl] of [
  ["artist_image_url", "ALTER TABLE songs ADD COLUMN artist_image_url TEXT"],
  ["album_image_url", "ALTER TABLE songs ADD COLUMN album_image_url TEXT"],
  ["rating_sum", "ALTER TABLE songs ADD COLUMN rating_sum REAL NOT NULL DEFAULT 0"],
  ["rating_count", "ALTER TABLE songs ADD COLUMN rating_count INTEGER NOT NULL DEFAULT 0"],
] as const) {
  if (!songCols.has(col)) db.exec(ddl);
}
