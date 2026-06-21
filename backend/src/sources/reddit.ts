/**
 * Reddit harvester (optional).
 *
 * Reddit blocks unauthenticated datacenter traffic, so this needs an app-only
 * OAuth token. Provide REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET (create a
 * "script"/"web app" at https://www.reddit.com/prefs/apps). If they are absent
 * this source is skipped gracefully.
 *
 * We read top posts from curated global-music subreddits and parse the common
 * "Artist - Title [genre] (year)" submission format into candidates.
 */
import { getJson, USER_AGENT } from "./http.js";
import type { Candidate } from "./types.js";

const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

// Subreddits skewed toward diverse / non-Western / regional music.
const SUBREDDITS: { sub: string; genre: string; country: string }[] = [
  { sub: "listentothis", genre: "", country: "" },
  { sub: "worldmusic", genre: "world", country: "" },
  { sub: "AfricanMusic", genre: "african", country: "" },
  { sub: "afrobeats", genre: "afrobeats", country: "Nigeria" },
  { sub: "Ethiopiques", genre: "ethio-jazz", country: "Ethiopia" },
  { sub: "arabicmusic", genre: "arabic", country: "" },
  { sub: "turkishmusic", genre: "turkish", country: "Turkey" },
  { sub: "persian_music", genre: "iranian pop", country: "Iran" },
  { sub: "indianmusic", genre: "indian", country: "India" },
  { sub: "bollywoodmusic", genre: "bollywood", country: "India" },
  { sub: "citypop", genre: "city pop", country: "Japan" },
  { sub: "japanesemusic", genre: "j-pop", country: "Japan" },
  { sub: "kpop", genre: "k-pop", country: "South Korea" },
  { sub: "Cpop", genre: "mandopop", country: "China" },
  { sub: "thaimusic", genre: "thai", country: "Thailand" },
  { sub: "indonesia", genre: "dangdut", country: "Indonesia" },
  { sub: "vietnam", genre: "vietnamese pop", country: "Vietnam" },
  { sub: "latinmusic", genre: "latin", country: "" },
  { sub: "cumbia", genre: "cumbia", country: "" },
  { sub: "brasil", genre: "mpb", country: "Brazil" },
  { sub: "Tropicalia", genre: "tropicalia", country: "Brazil" },
  { sub: "reggae", genre: "reggae", country: "Jamaica" },
  { sub: "Fado", genre: "fado", country: "Portugal" },
  { sub: "flamenco", genre: "flamenco", country: "Spain" },
  { sub: "balkanmusic", genre: "balkan brass", country: "" },
  { sub: "greekmusic", genre: "laïko", country: "Greece" },
  { sub: "klezmer", genre: "klezmer", country: "" },
  { sub: "GypsyJazz", genre: "gypsy jazz", country: "" },
];

interface RedditChild {
  data: { title: string; over_18?: boolean; stickied?: boolean };
}

async function getToken(): Promise<string> {
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`reddit token ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

/** Parse "Artist - Title [genre] (year)" -> { artist, title }. */
export function parseSubmission(title: string): { artist: string; title: string } | null {
  // strip trailing bracketed/parenthesised tags
  let t = title.replace(/\s*[\[(][^\])]*[\])]\s*$/g, "").trim();
  // remove a leading "FRESH"/"[Fresh]" style prefix
  t = t.replace(/^\s*\[?\s*fresh\s*\]?\s*[:-]?\s*/i, "").trim();
  const m = t.split(/\s+[–—-]{1,2}\s+/);
  if (m.length < 2) return null;
  const artist = m[0].trim();
  const songTitle = m.slice(1).join(" - ").replace(/\s*[\[(][^\])]*[\])]\s*$/g, "").trim();
  if (!artist || !songTitle || artist.length > 80 || songTitle.length > 120) return null;
  return { artist, title: songTitle };
}

export interface RedditOptions {
  postsPerSub: number;
  log?: (msg: string) => void;
}

export function redditEnabled(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

export async function harvestReddit(opts: RedditOptions): Promise<Candidate[]> {
  const log = opts.log ?? (() => {});
  if (!redditEnabled()) {
    log("Reddit skipped (set REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET to enable).");
    return [];
  }
  const token = await getToken();
  const candidates: Candidate[] = [];
  for (const s of SUBREDDITS) {
    const url = `https://oauth.reddit.com/r/${s.sub}/top?t=all&limit=${opts.postsPerSub}`;
    let json: { data?: { children?: RedditChild[] } };
    try {
      json = await getJson(url, { Authorization: `Bearer ${token}` });
    } catch (e) {
      log(`  reddit r/${s.sub} failed: ${(e as Error).message}`);
      continue;
    }
    for (const child of json.data?.children ?? []) {
      if (child.data.over_18 || child.data.stickied) continue;
      const parsed = parseSubmission(child.data.title);
      if (!parsed) continue;
      candidates.push({
        artist: parsed.artist,
        title: parsed.title,
        country: s.country,
        countryCode: "",
        language: "",
        genre: s.genre,
        source: "reddit",
      });
    }
  }
  log(`Reddit done: ${candidates.length} candidates.`);
  return candidates;
}
