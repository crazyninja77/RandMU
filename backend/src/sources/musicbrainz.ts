/**
 * MusicBrainz harvester — the primary structured source.
 *
 * MusicBrainz gives authoritative `country` (artist area) and `tags` (genres),
 * so candidates carry real metadata instead of guesses. We pull artists per
 * country and per genre tag, then a handful of recordings (song titles) each.
 *
 * Rate limit: MusicBrainz asks for <=1 request/second (enforced in http.ts).
 */
import { getJson } from "./http.js";
import { COUNTRIES, COUNTRY_BY_CODE, GENRE_TAGS, type CountryRef } from "./refdata.js";
import type { Candidate } from "./types.js";

const MB = "https://musicbrainz.org/ws/2";

interface MBArtist {
  id: string;
  name: string;
  country?: string;
  area?: { name: string };
  tags?: { name: string; count: number }[];
  type?: string;
}
interface MBRecording {
  id: string;
  title: string;
  "first-release-date"?: string;
  video?: boolean;
}

function pickLanguage(country: CountryRef | undefined, idx: number): string {
  if (!country || !country.languages.length) return "";
  return country.languages[idx % country.languages.length];
}

function topTag(a: MBArtist, fallback: string): string {
  const tags = (a.tags ?? []).filter((t) => t.count > 0).sort((x, y) => y.count - x.count);
  return tags[0]?.name ?? fallback;
}

async function searchArtists(query: string, limit: number): Promise<MBArtist[]> {
  const url = `${MB}/artist?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`;
  const json = await getJson<{ artists?: MBArtist[] }>(url);
  return json.artists ?? [];
}

async function getRecordings(mbid: string, limit: number): Promise<MBRecording[]> {
  const url = `${MB}/recording?artist=${mbid}&fmt=json&limit=${limit}&inc=`;
  const json = await getJson<{ recordings?: MBRecording[] }>(url);
  return json.recordings ?? [];
}

/** Distinct, studio-ish titles (drop obvious live/remix/karaoke dupes). */
function cleanTitles(recordings: MBRecording[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of recordings) {
    if (r.video) continue;
    const title = r.title?.trim();
    if (!title) continue;
    if (/\b(live|remix|karaoke|instrumental|version|edit|mix|demo|reprise)\b/i.test(title)) continue;
    const norm = title.toLowerCase().replace(/\([^)]*\)/g, "").trim();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(title);
    if (out.length >= max) break;
  }
  return out;
}

export interface MBOptions {
  artistsPerCountry: number;
  artistsPerGenre: number;
  recordingsPerArtist: number;
  maxArtists: number;
  log?: (msg: string) => void;
}

export async function harvestMusicBrainz(opts: MBOptions): Promise<Candidate[]> {
  const log = opts.log ?? (() => {});
  const candidates: Candidate[] = [];
  const processedArtists = new Set<string>();

  // Build a queue of (query, contextCountryCode, contextGenre) artist searches.
  type Search = { query: string; countryCode?: string; genre?: string; limit: number };
  const searches: Search[] = [];
  for (const c of COUNTRIES) {
    searches.push({ query: `country:${c.code}`, countryCode: c.code, limit: opts.artistsPerCountry });
  }
  for (const g of GENRE_TAGS) {
    searches.push({ query: `tag:${g}`, genre: g, limit: opts.artistsPerGenre });
  }

  let done = 0;
  for (const s of searches) {
    if (processedArtists.size >= opts.maxArtists) break;
    done++;
    let artists: MBArtist[] = [];
    try {
      artists = await searchArtists(s.query, s.limit);
    } catch (e) {
      log(`  MB search failed (${s.query}): ${(e as Error).message}`);
      continue;
    }
    for (const a of artists) {
      if (processedArtists.size >= opts.maxArtists) break;
      if (processedArtists.has(a.id)) continue;
      // Resolve country: prefer the search context, else the artist's own area.
      const code = s.countryCode ?? a.country ?? "";
      const country = COUNTRY_BY_CODE.get(code);
      // Genre tag context for country-searches comes from the artist's own tags.
      const genre = s.genre ?? topTag(a, "");
      processedArtists.add(a.id);

      let recordings: MBRecording[] = [];
      try {
        recordings = await getRecordings(a.id, Math.max(12, opts.recordingsPerArtist * 3));
      } catch (e) {
        continue;
      }
      const titles = cleanTitles(recordings, opts.recordingsPerArtist);
      titles.forEach((title, i) => {
        candidates.push({
          artist: a.name,
          title,
          country: country?.name ?? (a.area?.name ?? ""),
          countryCode: code,
          language: pickLanguage(country, i),
          genre,
          source: "musicbrainz",
        });
      });
    }
    if (done % 10 === 0) {
      log(`  MB: ${done}/${searches.length} searches, ${processedArtists.size} artists, ${candidates.length} candidates`);
    }
  }
  log(`MusicBrainz done: ${candidates.length} candidates from ${processedArtists.size} artists.`);
  return candidates;
}
