/**
 * Spotify ingestion + resolve pipeline.
 *
 * Uses the Spotify Web API "Client Credentials" flow (no user login needed).
 * Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the environment.
 *
 *   npm run ingest -- --resolve            # fill spotify ids for the curated seed songs
 *   npm run ingest -- --catalog            # build the large diverse catalog (default target 10000)
 *   npm run ingest -- --catalog --target 10000
 *
 * Spotify does not expose an artist's country, so `country` is derived from the
 * search market for country-specific queries and the artist's Spotify genres are
 * used for genre/subgenre. Descriptions are generated from the available metadata.
 */
import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import { GENRE_QUERIES, MARKETS, COUNTRY_QUERIES } from "./ingestSeeds.js";
import { readCandidates } from "./sources/index.js";
import type { Candidate } from "./sources/types.js";
import { readCatalog, writeCatalog, type CatalogSong } from "./catalogStore.js";
import {
  describeSong,
  describeArtist,
  describeAlbum,
  type DescInput,
} from "./sources/context.js";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET. Get them at https://developer.spotify.com/dashboard",
  );
  process.exit(1);
}

let token = "";
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (token && Date.now() < tokenExpiry - 30_000) return token;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`token error ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  token = json.access_token;
  tokenExpiry = Date.now() + json.expires_in * 1000;
  return token;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Minimum gap between requests so we don't hammer the API into a long ban.
// Tunable via SPOTIFY_MIN_GAP_MS; defaults to a conservative 250ms (~4 req/s).
const MIN_GAP_MS = Number(process.env.SPOTIFY_MIN_GAP_MS ?? 250);
// If Spotify hands back a retry-after longer than this, abort instead of
// sleeping (a dev-mode app can get banned for ~24h).
const MAX_RETRY_AFTER_S = 60;
let lastCall = 0;

export class RateLimitedError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(
      `Spotify rate-limited; retry-after ~${retryAfterSeconds}s ` +
        `(~${Math.round(retryAfterSeconds / 3600)}h). Try again later.`,
    );
    this.name = "RateLimitedError";
  }
}

async function spotify(path: string): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const gap = lastCall + MIN_GAP_MS - Date.now();
    if (gap > 0) await sleep(gap);
    lastCall = Date.now();

    const t = await getToken();
    const res = await fetch(`https://api.spotify.com/v1${path}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 429) {
      const retry = Number(res.headers.get("retry-after") ?? "2");
      if (retry > MAX_RETRY_AFTER_S) throw new RateLimitedError(retry);
      await sleep((retry + 1) * 1000);
      continue;
    }
    if (res.status === 401) {
      token = "";
      continue;
    }
    if (!res.ok) throw new Error(`spotify ${path} -> ${res.status}: ${await res.text()}`);
    return res.json();
  }
  throw new Error(`spotify ${path} failed after retries`);
}

interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}
interface SpotifyArtist {
  id: string;
  name: string;
  genres?: string[];
  images?: SpotifyImage[];
}
interface SpotifyTrack {
  id: string;
  name: string;
  external_urls: { spotify: string };
  artists: { id: string; name: string }[];
  album: {
    name: string;
    album_type: string;
    release_date: string;
    images?: SpotifyImage[];
  };
}

function pickImage(images: SpotifyImage[] | undefined): string | null {
  if (!images || !images.length) return null;
  // prefer a medium image (~300px) for the card, fall back to the first
  const medium = images.find((i) => (i.width ?? 0) >= 200 && (i.width ?? 0) <= 400);
  return (medium ?? images[0]).url;
}

// Some apps reject the documented max (limit=50) with "Invalid limit"; this is
// auto-lowered the first time that happens and reused for later calls.
let searchCap = 50;

async function searchTracks(query: string, market: string, limit = 50, offset = 0) {
  const q = encodeURIComponent(query);
  for (;;) {
    const effective = Math.min(limit, searchCap);
    try {
      const json = await spotify(
        `/search?q=${q}&type=track&market=${market}&limit=${effective}&offset=${offset}`,
      );
      return (json.tracks?.items ?? []) as SpotifyTrack[];
    } catch (e) {
      if (/invalid limit/i.test(String(e)) && effective > 1) {
        searchCap = Math.max(1, Math.floor(effective / 2));
        console.log(`  (search limit too high; lowering to ${searchCap})`);
        continue;
      }
      throw e;
    }
  }
}

const artistCache = new Map<string, SpotifyArtist>();
// The batch /artists endpoint is forbidden for some apps, so fetch singly.
async function getArtists(ids: string[]): Promise<Map<string, SpotifyArtist>> {
  const missing = ids.filter((id) => !artistCache.has(id));
  for (const id of missing) {
    try {
      const a = (await spotify(`/artists/${id}`)) as SpotifyArtist;
      if (a && a.id) artistCache.set(a.id, a);
    } catch {
      // skip artists we can't fetch; genre/image just stay empty
    }
  }
  return artistCache;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function deriveGenre(genres: string[]): { genre: string; subgenre: string } {
  if (!genres.length) return { genre: "World", subgenre: "" };
  const subgenre = titleCase(genres[0]);
  // pick a broad bucket from the most specific tag
  const all = genres.join(" ");
  const buckets: [RegExp, string][] = [
    [/jazz/, "Jazz"],
    [/hip hop|rap|drill|trap/, "Hip-Hop"],
    [/classical|opera|baroque/, "Classical"],
    [/folk|traditional|roots/, "Folk"],
    [/metal|punk|rock/, "Rock"],
    [/house|techno|electro|edm|trance|dance/, "Electronic"],
    [/salsa|cumbia|reggaeton|bachata|latin|samba|bossa|tango/, "Latin"],
    [/afro|amapiano|highlife|soukous|mbalax|raï|rai/, "African"],
    [/pop|k-pop|j-pop/, "Pop"],
    [/r&b|soul|funk/, "Soul/R&B"],
    [/reggae|dancehall|ska/, "Reggae"],
  ];
  for (const [re, label] of buckets) if (re.test(all)) return { genre: label, subgenre };
  return { genre: "World", subgenre };
}

/**
 * Build the rich, multi-paragraph descriptions for a resolved track. `genreTag`
 * is the raw harvested tag (e.g. "ethio-jazz") which carries the best story;
 * for the search-based catalog path it can be empty and we fall back to the
 * Spotify artist genres.
 */
function makeDescriptions(
  t: SpotifyTrack,
  opts: {
    country: string;
    countryCode: string;
    language: string;
    genreTag: string;
    genreBucket: string;
    subgenre: string;
    artistGenres: string[];
  },
): { artistDescription: string; songDescription: string; albumDescription: string | null } {
  const input: DescInput = {
    title: t.name,
    artistName: t.artists[0]?.name ?? "the artist",
    country: opts.country,
    countryCode: opts.countryCode,
    language: opts.language,
    genreTag: opts.genreTag,
    genreBucket: opts.genreBucket,
    subgenre: opts.subgenre,
    artistGenres: opts.artistGenres,
    albumName: t.album.album_type === "single" ? null : t.album.name,
    albumType: t.album.album_type,
    year: t.album.release_date ? Number(t.album.release_date.slice(0, 4)) || null : null,
    featured: t.artists.slice(1).map((a) => a.name),
  };
  return {
    artistDescription: describeArtist(input),
    songDescription: describeSong(input),
    albumDescription: describeAlbum(input),
  };
}

const upsert = db.prepare(`
  INSERT INTO songs (
    id, title, artist, artist_description, song_description,
    country, language, genre, subgenre,
    album_name, album_type, album_description, year,
    spotify_track_id, spotify_url, artist_image_url, album_image_url
  ) VALUES (
    @id, @title, @artist, @artistDescription, @songDescription,
    @country, @language, @genre, @subgenre,
    @albumName, @albumType, @albumDescription, @year,
    @spotifyTrackId, @spotifyUrl, @artistImageUrl, @albumImageUrl
  )
  ON CONFLICT(spotify_track_id) DO NOTHING
`);

function existingTrackIds(): Set<string> {
  const rows = db
    .prepare("SELECT spotify_track_id AS id FROM songs WHERE spotify_track_id IS NOT NULL")
    .all() as { id: string }[];
  return new Set(rows.map((r) => r.id));
}

async function resolveSeed() {
  const rows = db
    .prepare("SELECT id, title, artist FROM songs WHERE spotify_track_id IS NULL")
    .all() as { id: string; title: string; artist: string }[];
  console.log(`Resolving ${rows.length} seed songs against Spotify...`);
  let resolved = 0;
  const update = db.prepare(
    `UPDATE songs SET spotify_track_id = ?, spotify_url = ?,
       artist_image_url = ?, album_image_url = ? WHERE id = ?`,
  );
  for (const row of rows) {
    try {
      const cleanArtist = row.artist.split(/ [—-] |&|ft\.|feat\./i)[0].trim();
      const results = await searchTracks(`${row.title} ${cleanArtist}`, "US", 5);
      const hit = results[0];
      if (hit) {
        let artistImage: string | null = null;
        const artistId = hit.artists[0]?.id;
        if (artistId) {
          await getArtists([artistId]);
          artistImage = pickImage(artistCache.get(artistId)?.images);
        }
        update.run(
          hit.id,
          hit.external_urls.spotify,
          artistImage,
          pickImage(hit.album.images),
          row.id,
        );
        resolved++;
      }
    } catch (e) {
      console.warn(`  failed for ${row.artist} - ${row.title}: ${(e as Error).message}`);
    }
  }
  console.log(`Resolved ${resolved}/${rows.length} seed songs.`);
}

function normName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Find the Spotify track(s) for a harvested candidate. */
async function resolveCandidateTracks(
  cand: Candidate,
  tracksPerArtist: number,
): Promise<SpotifyTrack[]> {
  const market = cand.countryCode || "US";
  const query = cand.title ? `${cand.title} ${cand.artist}` : `artist:"${cand.artist}"`;
  let hits: SpotifyTrack[];
  try {
    hits = await searchTracks(query, market, 10);
  } catch (e) {
    if (e instanceof RateLimitedError) throw e;
    // bad/unsupported market code etc. -> retry against a global market
    hits = await searchTracks(query, "US", 10);
  }
  const want = normName(cand.artist);
  const matches = hits.filter((h) => {
    const got = normName(h.artists[0]?.name ?? "");
    return got === want || got.includes(want) || want.includes(got);
  });
  const pool = matches.length ? matches : cand.title ? hits.slice(0, 1) : [];
  // de-dupe by track title so we don't store the same song many times
  const out: SpotifyTrack[] = [];
  const seenTitles = new Set<string>();
  for (const t of pool) {
    const key = normName(t.name);
    if (!key || seenTitles.has(key)) continue;
    seenTitles.add(key);
    out.push(t);
    if (out.length >= (cand.title ? 1 : tracksPerArtist)) break;
  }
  return out;
}

async function buildCatalogSong(t: SpotifyTrack, cand: Candidate): Promise<CatalogSong> {
  const primaryId = t.artists[0]?.id;
  let artistGenres: string[] = [];
  let artistImage: string | null = null;
  if (primaryId) {
    await getArtists([primaryId]);
    const a = artistCache.get(primaryId);
    artistGenres = a?.genres ?? [];
    artistImage = pickImage(a?.images);
  }
  const genres = [cand.genre, ...artistGenres].filter(Boolean);
  const { genre, subgenre } = deriveGenre(genres);
  const country = cand.country;
  const desc = makeDescriptions(t, {
    country,
    countryCode: cand.countryCode,
    language: cand.language,
    genreTag: cand.genre,
    genreBucket: genre,
    subgenre,
    artistGenres,
  });
  return {
    id: randomUUID(),
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    artistDescription: desc.artistDescription,
    songDescription: desc.songDescription,
    country,
    language: cand.language,
    genre,
    subgenre,
    albumName: t.album.album_type === "single" ? null : t.album.name,
    albumType: t.album.album_type,
    albumDescription: desc.albumDescription,
    year: t.album.release_date ? Number(t.album.release_date.slice(0, 4)) || null : null,
    spotifyTrackId: t.id,
    spotifyUrl: t.external_urls.spotify,
    artistImageUrl: artistImage,
    albumImageUrl: pickImage(t.album.images),
  };
}

/**
 * Round-robin candidates across countries so that any partial resolve (e.g. one
 * that stops early on a rate-limit) still spans the full diversity of the pool
 * instead of exhausting the first few countries. Within each country, candidates
 * that already carry a song title are tried first (higher match rate).
 */
function interleaveByCountry(candidates: Candidate[]): Candidate[] {
  const groups = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const key = c.countryCode || c.country || "??";
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(c);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => (b.title ? 1 : 0) - (a.title ? 1 : 0));
  }
  const buckets = [...groups.values()];
  const out: Candidate[] = [];
  for (let i = 0; out.length < candidates.length; i++) {
    for (const bucket of buckets) if (i < bucket.length) out.push(bucket[i]);
  }
  return out;
}

/** Resolve the harvested candidate pool into playable songs + persist catalog. */
async function resolveCandidates(target: number, tracksPerArtist: number) {
  const candidates = interleaveByCountry(readCandidates());
  if (!candidates.length) {
    console.log("No candidates found. Run `npm run harvest` first.");
    return;
  }
  console.log(`Resolving ${candidates.length} harvested candidates (target ${target})...`);

  // Resume from any previously persisted catalog.
  const bySpotify = new Map<string, CatalogSong>();
  for (const s of readCatalog()) bySpotify.set(s.spotifyTrackId, s);
  for (const s of bySpotify.values()) upsert.run(s);
  const startCount = bySpotify.size;

  // Track which candidates are already covered so a resumed run never spends its
  // scarce request budget re-searching artists/titles we have already resolved.
  const resolvedArtists = new Set<string>();
  const resolvedArtistTitle = new Set<string>();
  const markResolved = (s: CatalogSong) => {
    const a = normName(s.artist.split(",")[0] ?? "");
    resolvedArtists.add(a);
    resolvedArtistTitle.add(`${a}|${normName(s.title)}`);
  };
  for (const s of bySpotify.values()) markResolved(s);

  let processed = 0;
  let added = 0;
  let skipped = 0;
  const flush = () => writeCatalog([...bySpotify.values()]);
  try {
    for (const cand of candidates) {
      if (target && bySpotify.size >= target) break;
      const a = normName(cand.artist);
      const covered = cand.title
        ? resolvedArtistTitle.has(`${a}|${normName(cand.title)}`)
        : resolvedArtists.has(a);
      if (covered) {
        skipped++;
        continue;
      }
      processed++;
      let tracks: SpotifyTrack[] = [];
      try {
        tracks = await resolveCandidateTracks(cand, tracksPerArtist);
      } catch (e) {
        if (e instanceof RateLimitedError) throw e;
        continue;
      }
      for (const t of tracks) {
        if (!t.id || bySpotify.has(t.id)) continue;
        const row = await buildCatalogSong(t, cand);
        bySpotify.set(t.id, row);
        markResolved(row);
        upsert.run(row);
        added++;
      }
      if (processed % 200 === 0) {
        flush();
        console.log(`  ${processed}/${candidates.length} candidates, ${bySpotify.size} songs`);
      }
    }
  } finally {
    flush();
  }
  console.log(
    `Resolve done. Added ${added} (was ${startCount}, skipped ${skipped} already-covered); ` +
      `catalog now ${bySpotify.size} songs.`,
  );
}

async function buildCatalog(target: number) {
  const seen = existingTrackIds();
  const insertMany = db.transaction((items: any[]) => {
    for (const it of items) upsert.run(it);
  });

  // Spread queries across markets so the same genre yields different local tracks.
  type Job = { query: string; market: string; country: string };
  const jobs: Job[] = [];
  for (const m of MARKETS) {
    for (const g of GENRE_QUERIES) jobs.push({ query: g, market: m, country: "" });
  }
  for (const cq of COUNTRY_QUERIES) {
    jobs.push({ query: cq.query, market: cq.market, country: cq.country });
  }
  // shuffle for diversity as we approach the target
  for (let i = jobs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [jobs[i], jobs[j]] = [jobs[j], jobs[i]];
  }

  let added = 0;
  for (const job of jobs) {
    if (seen.size >= target) break;
    let tracks: SpotifyTrack[] = [];
    try {
      tracks = await searchTracks(job.query, job.market, 50, 0);
    } catch (e) {
      if (e instanceof RateLimitedError) throw e;
      console.warn(`  search failed (${job.query}/${job.market}): ${(e as Error).message}`);
      continue;
    }
    const fresh = tracks.filter((t) => t.id && !seen.has(t.id));
    if (!fresh.length) continue;

    const artistIds = [...new Set(fresh.map((t) => t.artists[0]?.id).filter(Boolean))];
    await getArtists(artistIds);

    const rows = fresh.map((t) => {
      const artist = artistCache.get(t.artists[0]?.id);
      const genres = artist?.genres ?? [];
      const { genre, subgenre } = deriveGenre(genres);
      const country = job.country;
      seen.add(t.id);
      const desc = makeDescriptions(t, {
        country,
        countryCode: job.market,
        language: "",
        genreTag: "",
        genreBucket: genre,
        subgenre,
        artistGenres: genres,
      });
      return {
        id: randomUUID(),
        title: t.name,
        artist: t.artists.map((a) => a.name).join(", "),
        artistDescription: desc.artistDescription,
        songDescription: desc.songDescription,
        country,
        language: "",
        genre,
        subgenre,
        albumName: t.album.album_type === "single" ? null : t.album.name,
        albumType: t.album.album_type,
        albumDescription: desc.albumDescription,
        year: t.album.release_date ? Number(t.album.release_date.slice(0, 4)) || null : null,
        spotifyTrackId: t.id,
        spotifyUrl: t.external_urls.spotify,
        artistImageUrl: pickImage(artist?.images),
        albumImageUrl: pickImage(t.album.images),
      };
    });
    insertMany(rows);
    added += rows.length;
    if (added % 500 < rows.length) console.log(`  catalog: ${seen.size} tracks...`);
  }
  console.log(`Catalog build done. Added ${added}. Library now ~${seen.size} Spotify tracks.`);
}

async function main() {
  const args = process.argv.slice(2);
  const targetIdx = args.indexOf("--target");
  const target = targetIdx >= 0 ? Number(args[targetIdx + 1]) : 10000;

  const tpaIdx = args.indexOf("--tracks-per-artist");
  const tracksPerArtist = tpaIdx >= 0 ? Number(args[tpaIdx + 1]) || 3 : 3;

  if (args.includes("--resolve") || args.length === 0) await resolveSeed();
  if (args.includes("--from-candidates")) await resolveCandidates(target, tracksPerArtist);
  if (args.includes("--catalog")) await buildCatalog(target);
  console.log("Done.");
}

main().catch((e) => {
  if (e instanceof RateLimitedError) {
    console.error(`\n${e.message}`);
    console.error("Already-ingested songs are saved; re-run this command later to continue.");
    process.exit(2);
  }
  console.error(e);
  process.exit(1);
});
