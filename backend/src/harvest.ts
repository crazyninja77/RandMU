/**
 * Harvest CLI — collect diverse song/artist candidates from open sources
 * (MusicBrainz + Wikidata + optional Reddit) and write them to
 * backend/data/candidates.ndjson. No Spotify needed; resolving candidates into
 * playable songs happens later via `npm run ingest -- --catalog`.
 *
 *   npm run harvest                 # default sizes (~targets a big diverse pool)
 *   npm run harvest -- --max-artists 4000 --recordings 6
 */
import { harvestAll, writeCandidates, readCandidates, type HarvestOptions } from "./sources/index.js";

function numArg(flag: string, dflt: number): number {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? Number(process.argv[i + 1]) || dflt : dflt;
}

function summarise(label: string, values: string[]): void {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v || "(none)", (counts.get(v || "(none)") ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  console.log(`  ${label}: ${counts.size} distinct`);
  console.log("    " + top.map(([k, n]) => `${k}:${n}`).join("  "));
}

async function main() {
  const opts: HarvestOptions = {
    artistsPerCountry: numArg("--artists-per-country", 12),
    artistsPerGenre: numArg("--artists-per-genre", 12),
    recordingsPerArtist: numArg("--recordings", 6),
    maxArtists: numArg("--max-artists", 4000),
    wdArtistsPerGenre: numArg("--wd-per-genre", 40),
    wdMaxGenres: numArg("--wd-max-genres", 0) || undefined,
    redditPostsPerSub: numArg("--reddit-posts", 100),
    log: (m) => console.log(m),
  };
  console.log("Harvest options:", opts);

  const candidates = await harvestAll(opts);
  writeCandidates(candidates);

  console.log(`\nWrote ${candidates.length} candidates.`);
  summarise("countries", candidates.map((c) => c.country));
  summarise("genres", candidates.map((c) => c.genre));
  summarise("languages", candidates.map((c) => c.language));
  summarise("sources", candidates.map((c) => c.source));
  const withTitle = candidates.filter((c) => c.title).length;
  console.log(`  with song title: ${withTitle} / ${candidates.length}`);
  // sanity re-read
  console.log(`  re-read file: ${readCandidates().length} rows`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
