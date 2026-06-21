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

async function spotify(path: string): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const t = await getToken();
    const res = await fetch(`https://api.spotify.com/v1${path}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 429) {
      const retry = Number(res.headers.get("retry-after") ?? "2");
      await new Promise((r) => setTimeout(r, (retry + 1) * 1000));
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

async function searchTracks(query: string, market: string, limit = 50, offset = 0) {
  const q = encodeURIComponent(query);
  const json = await spotify(
    `/search?q=${q}&type=track&market=${market}&limit=${limit}&offset=${offset}`,
  );
  return (json.tracks?.items ?? []) as SpotifyTrack[];
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

function describeSong(t: SpotifyTrack, country: string, genre: string, subgenre: string) {
  const year = t.album.release_date?.slice(0, 4);
  const where = country ? ` from ${country}` : "";
  const style = subgenre || genre;
  const artistName = t.artists[0]?.name ?? "the artist";
  const albumBit =
    t.album.album_type === "single"
      ? "It was released as a standalone single"
      : `It appears on the ${t.album.album_type} \"${t.album.name}\"`;
  const others =
    t.artists.length > 1
      ? ` It features ${t.artists.slice(1).map((a) => a.name).join(", ")}.`
      : "";
  return (
    `\"${t.name}\" is a ${style} track by ${artistName}${where}. ` +
    `${albumBit}${year ? ` (${year})` : ""}, and is part of RandMU's deliberately diverse, ` +
    `non-Western-centric library.${others}`
  );
}

function describeArtist(name: string, country: string, genres: string[]) {
  const where = country ? ` from ${country}` : "";
  const styles = genres.slice(0, 3).map(titleCase).join(", ");
  if (styles) {
    return (
      `${name} is an artist${where} whose music spans ${styles}. ` +
      `They are part of a global music landscape that RandMU surfaces beyond the Western mainstream, ` +
      `representing the sounds and traditions of their region.`
    );
  }
  return (
    `${name} is an artist${where} featured in RandMU's worldwide library, ` +
    `chosen to broaden listeners beyond the Western mainstream.`
  );
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
      return {
        id: randomUUID(),
        title: t.name,
        artist: t.artists.map((a) => a.name).join(", "),
        artistDescription: describeArtist(t.artists[0]?.name ?? "", country, genres),
        songDescription: describeSong(t, country, genre, subgenre),
        country,
        language: "",
        genre,
        subgenre,
        albumName: t.album.album_type === "single" ? null : t.album.name,
        albumType: t.album.album_type,
        albumDescription: null,
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

  if (args.includes("--resolve") || args.length === 0) await resolveSeed();
  if (args.includes("--catalog")) await buildCatalog(target);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
