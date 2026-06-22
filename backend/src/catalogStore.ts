/**
 * On-disk store for the resolved Spotify catalogue.
 *
 * The big harvested+resolved library is written to a gzipped NDJSON file under
 * backend/data so it persists in git and is reloaded by `npm run seed` (the
 * SQLite DB itself is gitignored and rebuilt). The 51 hand-curated seed songs
 * are NOT stored here — they always come from seedData.ts.
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const CATALOG_PATH = join(__dirname, "..", "data", "catalog.ndjson.gz");

/** Shape matches the `songs` table columns (camelCase), used by the upsert. */
export interface CatalogSong {
  id: string;
  title: string;
  artist: string;
  artistDescription: string;
  songDescription: string;
  country: string;
  language: string;
  genre: string;
  subgenre: string;
  albumName: string | null;
  albumType: string | null;
  albumDescription: string | null;
  year: number | null;
  spotifyTrackId: string;
  spotifyUrl: string;
  artistImageUrl: string | null;
  albumImageUrl: string | null;
}

export function readCatalog(): CatalogSong[] {
  if (!existsSync(CATALOG_PATH)) return [];
  const buf = gunzipSync(readFileSync(CATALOG_PATH));
  return buf
    .toString("utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as CatalogSong);
}

export function writeCatalog(songs: CatalogSong[]): void {
  mkdirSync(dirname(CATALOG_PATH), { recursive: true });
  const body = songs.map((s) => JSON.stringify(s)).join("\n") + "\n";
  writeFileSync(CATALOG_PATH, gzipSync(Buffer.from(body, "utf8")));
}
