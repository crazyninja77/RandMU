/**
 * Background pre-generation worker.
 *
 * Slowly walks the catalogue and generates (grounded, verified) descriptions for
 * songs still on templated text, so that over time every song is upgraded to
 * unique 'llm' prose and reveals become instant — without ever hammering the
 * free model providers.
 *
 * Pacing: one song at a time, a gentle base delay between songs, and exponential
 * backoff when generation fails (which usually means every free model is briefly
 * rate-limited). Fully best-effort; it never throws into the server.
 */
import { getNextTemplateSong, countBySource } from "./library.js";
import { describeSong } from "./descriptions.js";
import { llmAvailable } from "./llm.js";

const BASE_DELAY_MS = Number(process.env.WORKER_DELAY_MS ?? 12_000);
const MAX_BACKOFF_MS = Number(process.env.WORKER_MAX_BACKOFF_MS ?? 5 * 60_000);
// When the whole catalogue is described, idle-poll for new template rows.
const IDLE_RESCAN_MS = Number(process.env.WORKER_IDLE_MS ?? 10 * 60_000);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let started = false;

export function startDescriptionWorker(): void {
  if (started) return;
  if (process.env.DESCRIPTION_WORKER === "off") {
    console.log("[worker] disabled (DESCRIPTION_WORKER=off)");
    return;
  }
  if (!llmAvailable()) {
    console.log("[worker] no model available — not starting");
    return;
  }
  started = true;
  const counts = countBySource();
  console.log(
    `[worker] starting; ${counts.template ?? 0} songs to describe, ${counts.llm ?? 0} already done`,
  );
  void loop();
}

async function loop(): Promise<void> {
  let backoff = BASE_DELAY_MS;
  // Give the server a moment to settle before the first call.
  await sleep(5_000);
  for (;;) {
    const song = getNextTemplateSong();
    if (!song) {
      await sleep(IDLE_RESCAN_MS);
      continue;
    }
    let ok = false;
    try {
      // Prefer the fast local model for bulk fill; falls back to remote.
      const result = await describeSong(song, { preferLocal: true });
      ok = result.descriptionSource === "llm";
    } catch (e) {
      console.warn(`[worker] error on "${song.title}": ${(e as Error).message}`);
    }
    if (ok) {
      const done = countBySource().llm ?? 0;
      console.log(`[worker] described "${song.title}" — ${song.artist} (${done} total)`);
      backoff = BASE_DELAY_MS;
      await sleep(BASE_DELAY_MS);
    } else {
      // Likely rate-limited across all providers; ease off, then retry.
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      console.log(`[worker] generation unavailable, backing off ${Math.round(backoff / 1000)}s`);
      await sleep(backoff);
    }
  }
}
