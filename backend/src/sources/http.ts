/**
 * Small throttled HTTP/JSON helper shared by the open-data harvesters.
 *
 * Each host gets its own minimum gap between requests so we respect the
 * published rate limits (MusicBrainz asks for <=1 req/sec; Wikipedia is more
 * generous but we stay polite). Includes basic retry/backoff on 429/503.
 */

export const USER_AGENT =
  process.env.RANDMU_USER_AGENT ??
  "RandMU/0.1 (diverse music discovery; +https://github.com/crazyninja77/RandMU)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// minimum gap (ms) per host
const HOST_GAP: Record<string, number> = {
  "musicbrainz.org": 1300,
  "query.wikidata.org": 1500,
  "www.wikidata.org": 300,
  "en.wikipedia.org": 250,
  "oauth.reddit.com": 700,
  "www.reddit.com": 1500,
};
const DEFAULT_GAP = 500;

const lastCallByHost = new Map<string, number>();

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

async function throttle(host: string): Promise<void> {
  const gap = HOST_GAP[host] ?? DEFAULT_GAP;
  const last = lastCallByHost.get(host) ?? 0;
  const wait = last + gap - Date.now();
  if (wait > 0) await sleep(wait);
  lastCallByHost.set(host, Date.now());
}

export async function getJson<T = any>(
  url: string,
  headers: Record<string, string> = {},
): Promise<T> {
  const host = hostOf(url);
  for (let attempt = 0; attempt < 5; attempt++) {
    await throttle(host);
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers },
      });
    } catch (e) {
      // transient network error: back off and retry
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if (res.status === 429 || res.status === 503) {
      const retry = Number(res.headers.get("retry-after") ?? `${attempt + 1}`);
      await sleep(Math.min(retry, 30) * 1000 + 500);
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`GET ${url} -> ${res.status}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }
  throw new Error(`GET ${url} failed after retries`);
}
