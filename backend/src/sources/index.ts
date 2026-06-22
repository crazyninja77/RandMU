/**
 * Source aggregator: runs every enabled harvester, merges + de-duplicates the
 * candidates, and writes them to a committed NDJSON file so the (Spotify)
 * resolve step can run separately/later without re-scraping.
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { harvestMusicBrainz } from "./musicbrainz.js";
import { harvestWikidata } from "./wikidata.js";
import { harvestReddit } from "./reddit.js";
import { candidateKey, type Candidate } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const CANDIDATES_PATH = join(__dirname, "..", "..", "data", "candidates.ndjson");

export interface HarvestOptions {
  // MusicBrainz
  artistsPerCountry: number;
  artistsPerGenre: number;
  recordingsPerArtist: number;
  maxArtists: number;
  // Wikidata
  wdArtistsPerGenre: number;
  wdMaxGenres?: number;
  // Reddit
  redditPostsPerSub: number;
  log?: (msg: string) => void;
}

export function dedupe(candidates: Candidate[]): Candidate[] {
  const byKey = new Map<string, Candidate>();
  for (const c of candidates) {
    if (!c.artist) continue;
    const key = candidateKey(c);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, c);
      continue;
    }
    // Prefer the richer record (one that has a country / language / genre).
    const score = (x: Candidate) => (x.country ? 1 : 0) + (x.language ? 1 : 0) + (x.genre ? 1 : 0);
    if (score(c) > score(existing)) byKey.set(key, c);
  }
  return [...byKey.values()];
}

export async function harvestAll(opts: HarvestOptions): Promise<Candidate[]> {
  const log = opts.log ?? ((m: string) => console.log(m));
  const all: Candidate[] = [];

  log("== MusicBrainz ==");
  all.push(
    ...(await harvestMusicBrainz({
      artistsPerCountry: opts.artistsPerCountry,
      artistsPerGenre: opts.artistsPerGenre,
      recordingsPerArtist: opts.recordingsPerArtist,
      maxArtists: opts.maxArtists,
      log,
    })),
  );

  log("== Wikidata ==");
  all.push(
    ...(await harvestWikidata({
      artistsPerGenre: opts.wdArtistsPerGenre,
      maxGenres: opts.wdMaxGenres,
      log,
    })),
  );

  log("== Reddit ==");
  all.push(...(await harvestReddit({ postsPerSub: opts.redditPostsPerSub, log })));

  const deduped = dedupe(all);
  log(`Merged ${all.length} raw -> ${deduped.length} unique candidates.`);
  return deduped;
}

export function writeCandidates(candidates: Candidate[]): void {
  mkdirSync(dirname(CANDIDATES_PATH), { recursive: true });
  const body = candidates.map((c) => JSON.stringify(c)).join("\n") + "\n";
  writeFileSync(CANDIDATES_PATH, body, "utf8");
}

export function readCandidates(): Candidate[] {
  if (!existsSync(CANDIDATES_PATH)) return [];
  return readFileSync(CANDIDATES_PATH, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Candidate);
}
