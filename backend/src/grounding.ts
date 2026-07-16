/**
 * Free fact-grounding for the description generator (RAG).
 *
 * Before asking the model to write liner notes we gather genuinely true facts
 * about the artist, the song, and (when known) the album from open,
 * credential-free sources — Wikipedia, MusicBrainz and Wikidata — and hand them
 * to the model. The prompt then instructs the model to ground specific claims
 * in these facts and to fall back to genre/region/era truths otherwise. This
 * sharply improves accuracy and surfaces real niche facts even on weak models.
 *
 * We gather deliberately broadly ("as much information as possible first"):
 *   - Wikipedia: the lead section (plain text, generously sized) for the artist,
 *     the song and the album — not just the one-line summary.
 *   - MusicBrainz: the artist (type / area / active years / tags) AND the
 *     specific recording (first-release year, ISRC, guest credits, producer and
 *     performer relations).
 *   - Wikidata: structured claims about the artist — genres, record labels,
 *     awards received, band members, instruments, inception/birth year and
 *     place / country of origin.
 *
 * Everything is best-effort: any source can fail or return nothing and we still
 * return whatever we found (or null). All requests go through the throttled
 * `getJson` helper so we stay polite to each host.
 */
import { getJson } from "./sources/http.js";
import { COUNTRIES } from "./sources/refdata.js";

export interface FactInput {
  title: string;
  artist: string;
  country: string;
  year: number | null;
  albumName?: string | null;
  albumType?: string | null;
}

export interface Grounding {
  /** Compact, model-ready facts block. */
  text: string;
  /** Years mentioned in the facts — used by the verification pass. */
  years: number[];
  /**
   * Proper-noun facts (collaborators, labels, awards, members). The
   * verification pass uses these to detect awards/collaborators the model
   * invented that aren't backed by any researched fact.
   */
  entities: string[];
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

function normCountry(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^(the|republic of|democratic republic of)\s+/g, "")
    .replace(/\bcabo\b/g, "cape")
    .replace(/[^a-z]+/g, "")
    .trim();
}
const CODE_TO_NAME = new Map(COUNTRIES.map((c) => [c.code.toUpperCase(), normCountry(c.name)]));
const NAME_TO_CODE = new Map(COUNTRIES.map((c) => [normCountry(c.name), c.code.toUpperCase()]));

/**
 * Guard against same-name artists from a different country (e.g. a Cape Verdean
 * "Maria Alice" vs the Portuguese fado singer). Returns false only when both the
 * song's country and the candidate's country are known and clearly differ; when
 * the candidate has no country info we can't disprove it, so we allow it.
 */
function countryConsistent(songCountry: string, mbCode?: string, mbArea?: string): boolean {
  if (!songCountry) return true;
  const wantCode = NAME_TO_CODE.get(normCountry(songCountry));
  const wantName = normCountry(songCountry);
  if (mbCode) {
    const code = mbCode.toUpperCase();
    if (wantCode) return code === wantCode;
    const nm = CODE_TO_NAME.get(code);
    return nm ? nm === wantName : true;
  }
  if (mbArea) {
    const area = normCountry(mbArea);
    // Area may be a city/region rather than a country; only reject on a clear
    // country-vs-country mismatch.
    if (NAME_TO_CODE.has(area)) return area === wantName;
    return true;
  }
  return true;
}

function yearsIn(text: string): number[] {
  const out = new Set<number>();
  for (const m of text.matchAll(/\b(1[89]\d{2}|20\d{2})\b/g)) out.add(Number(m[1]));
  return [...out];
}

// --- Wikipedia --------------------------------------------------------------

interface WikiSearch {
  query?: { search?: { title: string }[] };
}
interface WikiSummary {
  type?: string;
  title?: string;
  description?: string;
  extract?: string;
}
interface WikiExtractQuery {
  query?: { pages?: Record<string, { title?: string; extract?: string; missing?: string }> };
}

async function wikipediaSearchTitle(query: string): Promise<string | null> {
  const searchUrl =
    "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch=" +
    encodeURIComponent(query);
  const search = await getJson<WikiSearch>(searchUrl);
  return search.query?.search?.[0]?.title ?? null;
}

async function wikipediaSummaryOf(title: string): Promise<WikiSummary | null> {
  return getJson<WikiSummary>(
    "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title),
  );
}

/** Plain-text lead section for a page, generously sized (not the one-liner). */
async function wikipediaLead(title: string, maxChars: number): Promise<string | null> {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1" +
    "&prop=extracts&explaintext=1&exintro=1&exsectionformat=plain&titles=" +
    encodeURIComponent(title);
  const data = await getJson<WikiExtractQuery>(url);
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined || !page.extract) return null;
  const text = page.extract.replace(/\s+\n/g, "\n").trim();
  return text ? text.slice(0, maxChars) : null;
}

async function wikipediaArtist(artist: string, country: string): Promise<string | null> {
  try {
    const title = await wikipediaSearchTitle(`${artist} ${country} musician`.trim());
    if (!title || BAD_TITLE.test(title)) return null;
    const sum = await wikipediaSummaryOf(title);
    if (!sum || sum.type === "disambiguation") return null;
    const musical = MUSIC_WORDS.test(sum.extract ?? "") || MUSIC_WORDS.test(sum.description ?? "");
    if (!musical) return null;
    if (!mentionsArtist(`${sum.title ?? title} ${sum.extract ?? ""}`, artist)) return null;
    // Prefer the fuller lead section; fall back to the summary extract.
    const lead = await wikipediaLead(title, 1400);
    return (lead ?? sum.extract ?? "").trim().slice(0, 1400) || null;
  } catch {
    return null;
  }
}

async function wikipediaSong(title: string, artist: string): Promise<string | null> {
  try {
    const pageTitle = await wikipediaSearchTitle(`${title} ${artist} song`);
    if (!pageTitle) return null;
    const sum = await wikipediaSummaryOf(pageTitle);
    if (!sum || sum.type === "disambiguation") return null;
    const blurb = (sum.extract ?? "").trim();
    if (!blurb || !/\b(song|single|track|album|recording)\b/i.test(blurb)) return null;
    if (!mentionsArtist(blurb, artist)) return null;
    const lead = await wikipediaLead(pageTitle, 900);
    return (lead ?? blurb).trim().slice(0, 900) || null;
  } catch {
    return null;
  }
}

async function wikipediaAlbum(album: string, artist: string): Promise<string | null> {
  try {
    const pageTitle = await wikipediaSearchTitle(`${album} ${artist} album`);
    if (!pageTitle) return null;
    const sum = await wikipediaSummaryOf(pageTitle);
    if (!sum || sum.type === "disambiguation") return null;
    const blurb = (sum.extract ?? "").trim();
    if (!blurb || !/\b(album|EP|record|LP|release)\b/i.test(blurb)) return null;
    if (!mentionsArtist(blurb, artist)) return null;
    const lead = await wikipediaLead(pageTitle, 700);
    return (lead ?? blurb).trim().slice(0, 700) || null;
  } catch {
    return null;
  }
}

// --- MusicBrainz ------------------------------------------------------------

interface MbArtistSearch {
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

async function musicbrainzArtist(artist: string, country: string): Promise<string | null> {
  try {
    const url =
      "https://musicbrainz.org/ws/2/artist/?fmt=json&limit=5&query=" +
      encodeURIComponent(`artist:"${artist}"`);
    const data = await getJson<MbArtistSearch>(url);
    const top = (data.artists ?? []).find(
      (a) =>
        a.score >= 90 &&
        mentionsArtist(a.name, artist) &&
        countryConsistent(country, a.country, a.area?.name),
    );
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

interface MbRecordingSearch {
  recordings?: {
    id: string;
    score: number;
    title: string;
    "first-release-date"?: string;
    "artist-credit"?: { name: string; joinphrase?: string; artist?: { name: string } }[];
  }[];
}
interface MbRecordingDetail {
  "first-release-date"?: string;
  isrcs?: string[];
  "artist-credit"?: { name: string; artist?: { name: string } }[];
  relations?: {
    type: string;
    artist?: { name: string };
    attributes?: string[];
  }[];
}

interface RecordingFacts {
  text: string;
  years: number[];
  entities: string[];
}

async function musicbrainzRecording(
  title: string,
  artist: string,
): Promise<RecordingFacts | null> {
  try {
    const url =
      "https://musicbrainz.org/ws/2/recording/?fmt=json&limit=5&query=" +
      encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
    const search = await getJson<MbRecordingSearch>(url);
    const hit = (search.recordings ?? []).find(
      (r) =>
        r.score >= 90 &&
        (r["artist-credit"] ?? []).some((c) =>
          mentionsArtist(c.artist?.name ?? c.name ?? "", artist),
        ),
    );
    if (!hit) return null;

    const detail = await getJson<MbRecordingDetail>(
      `https://musicbrainz.org/ws/2/recording/${hit.id}?fmt=json&inc=artist-credits+isrcs+artist-rels`,
    );

    const bits: string[] = [];
    const entities: string[] = [];
    const years: number[] = [];

    const firstDate = detail["first-release-date"] || hit["first-release-date"];
    if (firstDate) {
      const y = Number(firstDate.slice(0, 4));
      if (y) {
        years.push(y);
        bits.push(`first released ${firstDate.length >= 7 ? firstDate : y}`);
      }
    }

    const credited = (detail["artist-credit"] ?? [])
      .map((c) => c.artist?.name ?? c.name)
      .filter(Boolean) as string[];
    const guests = credited.filter((n) => !mentionsArtist(n, artist));
    if (guests.length) {
      bits.push(`credited artists: ${credited.join(", ")}`);
      entities.push(...guests);
    }

    const byType = new Map<string, Set<string>>();
    for (const rel of detail.relations ?? []) {
      const name = rel.artist?.name;
      if (!name) continue;
      const label =
        rel.type === "instrument"
          ? `instruments${rel.attributes?.length ? ` (${rel.attributes.join(", ")})` : ""}`
          : rel.type;
      if (!byType.has(label)) byType.set(label, new Set());
      byType.get(label)!.add(name);
      entities.push(name);
    }
    for (const [type, names] of byType) {
      bits.push(`${type}: ${[...names].join(", ")}`);
    }

    if (detail.isrcs?.length) bits.push(`ISRC ${detail.isrcs[0]}`);

    if (!bits.length) return null;
    return { text: bits.join("; "), years, entities };
  } catch {
    return null;
  }
}

// --- Wikidata ---------------------------------------------------------------

interface WdSearch {
  search?: { id: string; label?: string; description?: string }[];
}
interface WdEntities {
  entities?: Record<
    string,
    {
      labels?: Record<string, { value: string }>;
      descriptions?: Record<string, { value: string }>;
      claims?: Record<string, WdClaim[]>;
    }
  >;
}
interface WdClaim {
  mainsnak?: {
    datavalue?: {
      type: string;
      value: { id?: string; time?: string } | string;
    };
  };
}

// Properties we harvest from the artist entity.
const WD_PROPS: Record<string, string> = {
  P136: "genres",
  P264: "record label",
  P166: "awards",
  P527: "members",
  P463: "member of",
  P1303: "instruments",
  P495: "country of origin",
};
const WD_YEAR_PROPS: Record<string, string> = {
  P571: "formed",
  P569: "born",
};

function claimIds(claims: WdClaim[] | undefined): string[] {
  if (!claims) return [];
  const out: string[] = [];
  for (const c of claims) {
    const v = c.mainsnak?.datavalue?.value;
    if (v && typeof v === "object" && v.id) out.push(v.id);
  }
  return out;
}

function claimYears(claims: WdClaim[] | undefined): number[] {
  if (!claims) return [];
  const out: number[] = [];
  for (const c of claims) {
    const v = c.mainsnak?.datavalue?.value;
    if (v && typeof v === "object" && v.time) {
      const y = Number(v.time.replace(/^[+]/, "").slice(0, 4));
      if (y) out.push(y);
    }
  }
  return out;
}

async function wikidataArtist(artist: string, country: string): Promise<RecordingFacts | null> {
  try {
    const searchUrl =
      "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*" +
      "&language=en&type=item&limit=5&search=" +
      encodeURIComponent(artist);
    const search = await getJson<WdSearch>(searchUrl);
    const hit =
      (search.search ?? []).find((s) => MUSIC_WORDS.test(s.description ?? "")) ??
      (search.search ?? [])[0];
    if (!hit?.id) return null;

    const entUrl =
      "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*" +
      `&props=claims|descriptions&languages=en&ids=${hit.id}`;
    const entData = await getJson<WdEntities>(entUrl);
    const ent = entData.entities?.[hit.id];
    if (!ent) return null;
    const desc = ent.descriptions?.en?.value ?? "";
    // Reject clearly non-musical entities (e.g. a footballer of the same name).
    if (desc && !MUSIC_WORDS.test(desc) && !/\b(pop|rock|jazz|hip hop|singer)\b/i.test(desc)) {
      // allow through only if search hit itself looked musical
      if (!MUSIC_WORDS.test(hit.description ?? "")) return null;
    }

    const claims = ent.claims ?? {};
    // Country-of-origin / citizenship consistency check when available.
    const originIds = [...claimIds(claims.P495), ...claimIds(claims.P27)];

    // Collect referenced QIDs to resolve to labels in one batch.
    const idsByProp: Record<string, string[]> = {};
    const allIds = new Set<string>();
    for (const prop of Object.keys(WD_PROPS)) {
      const ids = claimIds(claims[prop]).slice(0, 6);
      if (ids.length) {
        idsByProp[prop] = ids;
        ids.forEach((id) => allIds.add(id));
      }
    }
    originIds.forEach((id) => allIds.add(id));

    const labelMap = new Map<string, string>();
    if (allIds.size) {
      const ids = [...allIds].slice(0, 50).join("|");
      const labelData = await getJson<WdEntities>(
        "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*" +
          `&props=labels&languages=en&ids=${ids}`,
      );
      for (const [qid, e] of Object.entries(labelData.entities ?? {})) {
        const v = e.labels?.en?.value;
        if (v) labelMap.set(qid, v);
      }
    }

    // Country consistency: if we know the song's country and the entity's
    // origin/citizenship resolves to a clearly different country, reject.
    if (country && originIds.length) {
      const originNames = originIds.map((id) => normCountry(labelMap.get(id) ?? "")).filter(Boolean);
      const want = normCountry(country);
      if (originNames.length && !originNames.some((n) => n === want)) {
        // Only reject when the wanted country is itself a known country name.
        if (NAME_TO_CODE.has(want)) return null;
      }
    }

    const bits: string[] = [];
    const entities: string[] = [];
    for (const [prop, label] of Object.entries(WD_PROPS)) {
      const names = [
        ...new Set(
          (idsByProp[prop] ?? [])
            .map((id) => labelMap.get(id))
            .filter((v): v is string => Boolean(v)),
        ),
      ];
      if (names.length) {
        bits.push(`${label}: ${names.join(", ")}`);
        if (prop === "P166" || prop === "P264" || prop === "P527") entities.push(...names);
      }
    }

    const years: number[] = [];
    for (const [prop, label] of Object.entries(WD_YEAR_PROPS)) {
      const ys = claimYears(claims[prop]);
      if (ys.length) {
        years.push(...ys);
        bits.push(`${label} ${ys[0]}`);
      }
    }

    if (!bits.length) return null;
    return { text: bits.join("; "), years, entities };
  } catch {
    return null;
  }
}

/**
 * Gather verified facts for a song/artist/album. Returns null when nothing
 * trustworthy was found (caller then relies on genre/region/era truths only).
 */
export async function gatherGrounding(input: FactInput): Promise<Grounding | null> {
  if (!input.artist) return null;
  const lines: string[] = [];
  const sources: string[] = [];
  const entities: string[] = [];

  const hasAlbum = Boolean(input.albumName && input.albumType !== "single");

  const [wikiArtist, mbArtist, wikiSong, mbRecording, wdArtist, wikiAlbum] = await Promise.all([
    wikipediaArtist(input.artist, input.country),
    musicbrainzArtist(input.artist, input.country),
    wikipediaSong(input.title, input.artist),
    musicbrainzRecording(input.title, input.artist),
    wikidataArtist(input.artist, input.country),
    hasAlbum ? wikipediaAlbum(input.albumName as string, input.artist) : Promise.resolve(null),
  ]);

  if (wikiArtist) {
    lines.push(`- Artist (Wikipedia): ${wikiArtist}`);
    sources.push("wikipedia");
  }
  if (mbArtist) {
    lines.push(`- Artist (MusicBrainz): ${mbArtist}`);
    sources.push("musicbrainz");
  }
  if (wdArtist) {
    lines.push(`- Artist (Wikidata): ${wdArtist.text}`);
    entities.push(...wdArtist.entities);
    sources.push("wikidata");
  }
  if (wikiSong) {
    lines.push(`- Song (Wikipedia): ${wikiSong}`);
    if (!sources.includes("wikipedia")) sources.push("wikipedia");
  }
  if (mbRecording) {
    lines.push(`- Recording (MusicBrainz): ${mbRecording.text}`);
    entities.push(...mbRecording.entities);
    if (!sources.includes("musicbrainz")) sources.push("musicbrainz");
  }
  if (wikiAlbum) {
    lines.push(`- Album (Wikipedia): ${wikiAlbum}`);
    if (!sources.includes("wikipedia")) sources.push("wikipedia");
  }

  if (!lines.length) return null;
  const text = lines.join("\n");
  const years = new Set<number>(yearsIn(text));
  for (const y of wdArtist?.years ?? []) years.add(y);
  for (const y of mbRecording?.years ?? []) years.add(y);
  return {
    text,
    years: [...years],
    entities: [...new Set(entities)],
    sources,
  };
}
