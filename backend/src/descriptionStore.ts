/**
 * Durable overlay of generated descriptions.
 *
 * Model-written descriptions are cached in the SQLite DB, but that DB is
 * gitignored and rebuilt by `npm run seed`. To make a generated description a
 * one-time cost *ever* (surviving restarts, redeploys and fresh clones), we also
 * append it to a committed plain-NDJSON overlay keyed by a stable song key.
 *
 * `seed.ts` applies this overlay on top of the catalogue so previously generated
 * songs come back as 'llm' without re-calling any model.
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, existsSync, readFileSync, appendFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DESCRIPTIONS_PATH = join(__dirname, "..", "data", "descriptions.ndjson");

export interface StoredDescription {
  key: string;
  songDescription: string;
  artistDescription: string;
  albumDescription: string | null;
  model: string;
  generatedAt: string;
}

/** Stable key for a song: prefer the Spotify track id, else artist|title. */
export function descriptionKey(opts: {
  spotifyTrackId?: string | null;
  artist: string;
  title: string;
}): string {
  if (opts.spotifyTrackId) return `sp:${opts.spotifyTrackId}`;
  const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/\s+/g, " ").trim();
  return `at:${norm(opts.artist)}|${norm(opts.title)}`;
}

/** Load the overlay as a map (last write wins for a given key). */
export function loadDescriptionOverlay(): Map<string, StoredDescription> {
  const map = new Map<string, StoredDescription>();
  if (!existsSync(DESCRIPTIONS_PATH)) return map;
  for (const line of readFileSync(DESCRIPTIONS_PATH, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const d = JSON.parse(line) as StoredDescription;
      if (d.key) map.set(d.key, d);
    } catch {
      // skip malformed line
    }
  }
  return map;
}

/** Append one generated description to the overlay file. */
export function recordDescription(d: StoredDescription): void {
  mkdirSync(dirname(DESCRIPTIONS_PATH), { recursive: true });
  appendFileSync(DESCRIPTIONS_PATH, JSON.stringify(d) + "\n");
}
