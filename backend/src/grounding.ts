/**
 * Free fact-grounding for the description generator (RAG).
 *
 * Before asking the model to write liner notes we gather genuinely true facts
 * about the artist (and, when possible, the song) from open, credential-free
 * sources — Wikipedia and MusicBrainz — and hand them to the model. The prompt
 * then instructs the model to ground specific claims in these facts and to fall
 * back to genre/region/era truths otherwise. This sharply improves accuracy and
 * surfaces real niche facts even on weak free models.
 *
 * Everything is best-effort: any source can fail or return nothing and we still
 * return whatever we found (or null). All requests go through the throttled
 * `getJson` helper so we stay polite to each host.
 */
import { getJson } from "./sources/http.js";

export interface FactInput {
  title: string;
  artist: string;
  country: string;
  year: number | null;
}

export interface Grounding {
  /** Compact, model-ready facts block. */
  text: string;
  /** Years mentioned in the facts — used by the verification pass. */
  years: number[];
  sources: string[];
}

const MUSIC_WORDS =
  /\b(musician|singer|songwriter|composer|rapper|band|group|duo|ensemble|vocalist|guitarist|drummer|percussionist|pianist|producer|dj|orchestra|choir|music|recording artist)\b/i;
// Titles that look like things other than a person/act we should reject.
const BAD_TITLE =
  /\b(award|awards|festival|prize|chart|genre|province|district|region|city|album chart|discography|chronology)\b/i;

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .split(/[^a-z0-9\u00c0-\u024f]+/i)
    .filter((t) => t.length >= 3);
}

/** Does `haystack` contain a meaningful chunk of the artist name? */
function mentionsArtist(haystack: string, artist: string): boolean {
  const hay = haystack.toLowerCase();
  const tokens = nameTokens(artist);
  if (!tokens.length) return false;
  const hits = tokens.filter((t) => hay.includes(t)).length;
  return hits / tokens.length >= 0.5;
}

function yearsIn(text: string): number[] {
  const out = new Set<number>();
  for (const m of text.matchAll(/\b(1[89]\d{2}|20\d{2})\b/g)) out.add(Number(m[1]));
  return [...out];
}

interface WikiSearch {
  query?: { search?: { title: string }[] };
}
interface WikiSummary {
  type?: string;
  title?: string;
  description?: string;
  extract?: string;
}

async function wikipediaSummary(query: string): Promise<WikiSummary | null> {
  const searchUrl =
    "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch=" +
    encodeURIComponent(query);
  const search = await getJson<WikiSearch>(searchUrl);
  const title = search.query?.search?.[0]?.title;
  if (!title) return null;
  const sum = await getJson<WikiSummary>(
    "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title),
  );
  return sum;
}

async function wikipediaArtist(artist: string, country: string): Promise<string | null> {
  try {
    const sum = await wikipediaSummary(`${artist} ${country} musician`.trim());
    if (!sum || sum.type === "disambiguation") return null;
    const blurb = (sum.extract ?? "").trim();
    const title = sum.title ?? "";
    if (!blurb) return null;
    if (BAD_TITLE.test(title)) return null;
    // Must look musical AND actually be about this artist.
    const musical = MUSIC_WORDS.test(blurb) || MUSIC_WORDS.test(sum.description ?? "");
    if (!musical) return null;
    if (!mentionsArtist(`${title} ${blurb}`, artist)) return null;
    return blurb.slice(0, 600);
  } catch {
    return null;
  }
}

async function wikipediaSong(title: string, artist: string): Promise<string | null> {
  try {
    const sum = await wikipediaSummary(`${title} ${artist} song`);
    if (!sum || sum.type === "disambiguation") return null;
    const blurb = (sum.extract ?? "").trim();
    if (!blurb) return null;
    if (!/\b(song|single|track|album|recording)\b/i.test(blurb)) return null;
    if (!mentionsArtist(blurb, artist)) return null;
    return blurb.slice(0, 500);
  } catch {
    return null;
  }
}

interface MbArtist {
  artists?: {
    name: string;
    score: number;
    type?: string;
    country?: string;
    disambiguation?: string;
    area?: { name?: string };
    "life-span"?: { begin?: string };
    tags?: { name: string; count: number }[];
  }[];
}

async function musicbrainzArtist(artist: string): Promise<string | null> {
  try {
    const url =
      "https://musicbrainz.org/ws/2/artist/?fmt=json&limit=3&query=" +
      encodeURIComponent(`artist:"${artist}"`);
    const data = await getJson<MbArtist>(url);
    const top = (data.artists ?? []).find((a) => a.score >= 90 && mentionsArtist(a.name, artist));
    if (!top) return null;
    const bits: string[] = [];
    if (top.type) bits.push(top.type === "Person" ? "solo artist" : top.type.toLowerCase());
    const area = top.area?.name ?? top.country;
    if (area) bits.push(`from ${area}`);
    const begin = top["life-span"]?.begin;
    if (begin) {
      const y = begin.slice(0, 4);
      bits.push(top.type === "Group" ? `active since ${y}` : `born/active from ${y}`);
    }
    if (top.disambiguation) bits.push(top.disambiguation);
    const tags = (top.tags ?? [])
      .filter((t) => t.count > 0)
      .slice(0, 6)
      .map((t) => t.name);
    if (tags.length) bits.push(`tags: ${tags.join(", ")}`);
    return bits.length ? bits.join("; ") : null;
  } catch {
    return null;
  }
}

/**
 * Gather verified facts for a song/artist. Returns null when nothing
 * trustworthy was found (caller then relies on genre/region/era truths only).
 */
export async function gatherGrounding(input: FactInput): Promise<Grounding | null> {
  if (!input.artist) return null;
  const lines: string[] = [];
  const sources: string[] = [];

  const [wikiArtist, mbArtist, wikiSong] = await Promise.all([
    wikipediaArtist(input.artist, input.country),
    musicbrainzArtist(input.artist),
    wikipediaSong(input.title, input.artist),
  ]);

  if (wikiArtist) {
    lines.push(`- Artist (Wikipedia): ${wikiArtist}`);
    sources.push("wikipedia");
  }
  if (mbArtist) {
    lines.push(`- Artist (MusicBrainz): ${mbArtist}`);
    sources.push("musicbrainz");
  }
  if (wikiSong) {
    lines.push(`- Song (Wikipedia): ${wikiSong}`);
    if (!sources.includes("wikipedia")) sources.push("wikipedia");
  }

  if (!lines.length) return null;
  const text = lines.join("\n");
  return { text, years: yearsIn(text), sources };
}
