/**
 * Wikidata harvester (open APIs, no credentials).
 *
 * Strategy (kept cheap so SPARQL doesn't time out):
 *   1. resolve a genre name to its Wikidata entity QID via wbsearchentities
 *   2. query performers whose genre (P136) is that QID, plus their country of
 *      origin (P495) / citizenship (P27)
 *
 * Yields artist-level candidates (no song title); titles come from the Spotify
 * resolve step (artist top tracks).
 */
import { getJson } from "./http.js";
import { COUNTRIES, GENRE_TAGS } from "./refdata.js";
import type { Candidate } from "./types.js";

const SPARQL = "https://query.wikidata.org/sparql";
const WD_API = "https://www.wikidata.org/w/api.php";

const NAME_TO_COUNTRY = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c]));
const ALIASES: Record<string, string> = {
  "people's republic of china": "china",
  "republic of korea": "south korea",
  "democratic republic of the congo": "dr congo",
  "republic of the congo": "congo",
  "ivory coast": "côte d'ivoire",
  "czech republic": "czechia",
  "russian federation": "russia",
  "united republic of tanzania": "tanzania",
};

function matchCountry(label: string | undefined): { name: string; code: string; language: string } {
  if (!label) return { name: "", code: "", language: "" };
  const key = label.trim().toLowerCase();
  const ref = NAME_TO_COUNTRY.get(ALIASES[key] ?? key) ?? NAME_TO_COUNTRY.get(key);
  if (!ref) return { name: label, code: "", language: "" };
  return { name: ref.name, code: ref.code, language: ref.languages[0] ?? "" };
}

interface WbSearch {
  search: { id: string; label?: string; description?: string }[];
}

async function genreQid(genre: string): Promise<string | null> {
  const url =
    `${WD_API}?action=wbsearchentities&search=${encodeURIComponent(genre)}` +
    `&language=en&type=item&limit=5&format=json&origin=*`;
  const json = await getJson<WbSearch>(url);
  // prefer a hit whose description mentions music/genre
  const hit =
    json.search.find((s) => /music|genre|style/i.test(s.description ?? "")) ?? json.search[0];
  return hit?.id ?? null;
}

interface SparqlResult {
  results: { bindings: Record<string, { value: string }>[] };
}

function buildQuery(qid: string, limit: number): string {
  return `SELECT DISTINCT ?artistLabel ?countryLabel WHERE {
  ?artist wdt:P136 wd:${qid} .
  VALUES ?type { wd:Q5 wd:Q215380 wd:Q2088357 }
  ?artist wdt:P31 ?type .
  OPTIONAL { ?artist wdt:P495 ?c1 . }
  OPTIONAL { ?artist wdt:P27 ?c2 . }
  BIND(COALESCE(?c1, ?c2) AS ?country)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT ${limit}`;
}

async function queryGenre(genre: string, limit: number): Promise<Candidate[]> {
  const qid = await genreQid(genre);
  if (!qid) return [];
  const url = `${SPARQL}?query=${encodeURIComponent(buildQuery(qid, limit))}&format=json`;
  const json = await getJson<SparqlResult>(url);
  const out: Candidate[] = [];
  for (const b of json.results?.bindings ?? []) {
    const name = b.artistLabel?.value?.trim();
    if (!name || /^Q\d+$/.test(name)) continue;
    const c = matchCountry(b.countryLabel?.value);
    out.push({
      artist: name,
      title: null,
      country: c.name,
      countryCode: c.code,
      language: c.language,
      genre,
      source: "wikidata",
    });
  }
  return out;
}

export interface WDOptions {
  artistsPerGenre: number;
  maxGenres?: number;
  log?: (msg: string) => void;
}

export async function harvestWikidata(opts: WDOptions): Promise<Candidate[]> {
  const log = opts.log ?? (() => {});
  const candidates: Candidate[] = [];
  const genres = opts.maxGenres ? GENRE_TAGS.slice(0, opts.maxGenres) : GENRE_TAGS;
  let done = 0;
  for (const g of genres) {
    done++;
    try {
      candidates.push(...(await queryGenre(g, opts.artistsPerGenre)));
    } catch (e) {
      log(`  WD query failed (${g}): ${(e as Error).message}`);
    }
    if (done % 20 === 0) {
      log(`  WD: ${done}/${genres.length} genres, ${candidates.length} candidates`);
    }
  }
  log(`Wikidata done: ${candidates.length} candidates.`);
  return candidates;
}
