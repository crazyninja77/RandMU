/**
 * Best-effort Spotify audio-features lookup for the description generator.
 *
 * Given a Spotify track id we fetch the track's acoustic fingerprint (tempo,
 * energy, danceability, etc.) and turn it into a short, human-readable phrase
 * the model can use to describe what the track actually *sounds* like, instead
 * of guessing from genre stereotypes.
 *
 * This is entirely best-effort and isolated:
 *   - no credentials -> disabled.
 *   - Spotify deprecated /audio-features for some newer apps (403) and dev-mode
 *     apps can be rate-limit banned (429). Any non-200 simply yields null and
 *     the caller carries on without acoustic detail.
 *   - results are cached in-memory per track id so a re-reveal costs nothing.
 */

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const ENABLED = process.env.SPOTIFY_AUDIO_FEATURES !== "off";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MIN_GAP_MS = Number(process.env.SPOTIFY_MIN_GAP_MS ?? 250);
let lastCall = 0;

let token = "";
let tokenExpiry = 0;
// Once Spotify tells us the endpoint is gone (403) or we're banned for a long
// time (429 retry-after), stop trying for the rest of the process.
let disabledUntil = 0;

export interface AudioFeatures {
  tempo: number;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  mode: number;
  key: number;
}

async function getToken(): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  if (token && Date.now() < tokenExpiry - 30_000) return token;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token: string; expires_in: number };
    token = json.access_token;
    tokenExpiry = Date.now() + json.expires_in * 1000;
    return token;
  } catch {
    return null;
  }
}

const cache = new Map<string, AudioFeatures | null>();

export function audioFeaturesEnabled(): boolean {
  return ENABLED && Boolean(CLIENT_ID && CLIENT_SECRET);
}

export async function getAudioFeatures(trackId: string | null): Promise<AudioFeatures | null> {
  if (!trackId || !audioFeaturesEnabled()) return null;
  if (Date.now() < disabledUntil) return null;
  if (cache.has(trackId)) return cache.get(trackId) ?? null;

  const t = await getToken();
  if (!t) return null;

  const gap = lastCall + MIN_GAP_MS - Date.now();
  if (gap > 0) await sleep(gap);
  lastCall = Date.now();

  try {
    const res = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 403 || res.status === 404) {
      // Endpoint unavailable for this app — don't hammer it again.
      disabledUntil = Date.now() + 60 * 60_000;
      return null;
    }
    if (res.status === 429) {
      const retry = Number(res.headers.get("retry-after") ?? "60");
      disabledUntil = Date.now() + Math.min(retry, 86_400) * 1000;
      return null;
    }
    if (!res.ok) return null;
    const f = (await res.json()) as Partial<AudioFeatures> & { tempo?: number };
    if (typeof f.tempo !== "number") return null;
    const feats: AudioFeatures = {
      tempo: f.tempo,
      energy: f.energy ?? 0,
      danceability: f.danceability ?? 0,
      valence: f.valence ?? 0,
      acousticness: f.acousticness ?? 0,
      instrumentalness: f.instrumentalness ?? 0,
      speechiness: f.speechiness ?? 0,
      mode: f.mode ?? 1,
      key: f.key ?? -1,
    };
    cache.set(trackId, feats);
    return feats;
  } catch {
    return null;
  }
}

const PITCH = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

/** Turn raw features into a compact, model-ready descriptive phrase. */
export function describeAudioFeatures(f: AudioFeatures): string {
  const bits: string[] = [];
  const bpm = Math.round(f.tempo);
  if (bpm > 0) {
    const pace =
      bpm < 76 ? "slow" : bpm < 108 ? "mid-tempo" : bpm < 140 ? "up-tempo" : "fast";
    bits.push(`${pace} (~${bpm} BPM)`);
  }
  const hl = (v: number, lo: string, hi: string, mid?: string) =>
    v >= 0.66 ? hi : v <= 0.33 ? lo : mid ?? "";
  const energy = hl(f.energy, "low-energy", "high-energy", "moderately energetic");
  if (energy) bits.push(energy);
  const dance = hl(f.danceability, "not very danceable", "highly danceable");
  if (dance) bits.push(dance);
  const mood = hl(f.valence, "melancholy/serious in mood", "bright/upbeat in mood");
  if (mood) bits.push(mood);
  if (f.acousticness >= 0.6) bits.push("largely acoustic");
  else if (f.acousticness <= 0.2) bits.push("electric/electronic-leaning");
  if (f.instrumentalness >= 0.6) bits.push("mostly instrumental");
  if (f.speechiness >= 0.5) bits.push("speech-heavy/rap-like delivery");
  if (f.key >= 0 && f.key <= 11) {
    bits.push(`in ${PITCH[f.key]} ${f.mode === 0 ? "minor" : "major"}`);
  }
  return bits.join(", ");
}
