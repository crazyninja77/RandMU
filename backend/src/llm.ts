/**
 * Provider-agnostic LLM client used to write unique, story-driven descriptions
 * for a song the moment it is revealed. Generation is lazy (only for songs that
 * don't already have curated or model-written prose) and the result is cached in
 * the database, so each song costs at most one call.
 *
 * No SDK dependency — we call the HTTP APIs directly via fetch. The provider is
 * auto-detected from whichever key is present (Anthropic preferred, then OpenAI)
 * and can be overridden with LLM_PROVIDER / LLM_MODEL.
 */

export interface DescribeInput {
  title: string;
  artist: string;
  country: string;
  language: string;
  genre: string;
  subgenre: string;
  albumName: string | null;
  albumType: string | null;
  year: number | null;
}

export interface GeneratedDescriptions {
  songDescription: string;
  artistDescription: string;
  albumDescription: string | null;
}

/** Researched facts to ground the model in (see grounding.ts). */
export interface Grounding {
  text: string;
  years: number[];
}

type Provider = "openai" | "openrouter" | "anthropic";

// OpenRouter keys (sk-or-...) are OpenAI-compatible but hit a different host, so
// we detect them even when supplied via OPENAI_API_KEY.
function isOpenRouterKey(key: string | undefined): boolean {
  return !!key && key.startsWith("sk-or-");
}

function resolveProvider(): Provider | null {
  const forced = process.env.LLM_PROVIDER?.toLowerCase();
  if (forced === "openrouter" && process.env.OPENAI_API_KEY) return "openrouter";
  if (forced === "openai" && process.env.OPENAI_API_KEY)
    return isOpenRouterKey(process.env.OPENAI_API_KEY) ? "openrouter" : "openai";
  if (forced === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY)
    return isOpenRouterKey(process.env.OPENAI_API_KEY) ? "openrouter" : "openai";
  return null;
}

// --- Local model (Ollama) fallback -----------------------------------------
// A small model running on the box generates descriptions for free, with no API
// key and no rate limits. It is used as a last resort when no remote provider is
// configured or when every remote (free) model fails. Probed once at startup.
const OLLAMA_HOST = (process.env.OLLAMA_HOST ?? "http://localhost:11434").replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:3b-instruct";
let ollamaReady = false;

export async function initLlm(): Promise<void> {
  if (process.env.OLLAMA_DISABLED === "1") return;
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return;
    const data = (await res.json()) as { models?: { name: string }[] };
    ollamaReady = Array.isArray(data.models) && data.models.length > 0;
    if (ollamaReady) console.log(`[llm] local Ollama available at ${OLLAMA_HOST} (${OLLAMA_MODEL})`);
  } catch {
    ollamaReady = false;
  }
}

export function ollamaAvailable(): boolean {
  return ollamaReady;
}

export function llmAvailable(): boolean {
  return resolveProvider() !== null || ollamaReady;
}

export function llmStatus(): { available: boolean; provider: Provider | null; model: string | null } {
  const provider = resolveProvider();
  if (provider) return { available: true, provider, model: modelFor(provider) };
  if (ollamaReady) return { available: true, provider: null, model: `ollama:${OLLAMA_MODEL}` };
  return { available: false, provider: null, model: null };
}

// Default free OpenRouter models, tried in order. Free models are individually
// rate-limited upstream, so we fall through to the next one on a 429.
const OPENROUTER_FREE_MODELS = [
  "openai/gpt-oss-120b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

function modelsFor(provider: Provider): string[] {
  if (process.env.LLM_MODEL) {
    return process.env.LLM_MODEL.split(",").map((m) => m.trim()).filter(Boolean);
  }
  if (provider === "anthropic") return ["claude-3-5-sonnet-latest"];
  if (provider === "openrouter") return OPENROUTER_FREE_MODELS;
  return ["gpt-4o"];
}

function modelFor(provider: Provider): string {
  return modelsFor(provider)[0];
}

// Free models are slow (often 20-30s) so allow a generous budget; the reveal UI
// shows a "drawing your song" spinner during it. The local Ollama fallback gets
// its own (separate) budget so a remote timeout can't abort it.
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 60000);
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 60000);
// Cap output so we don't reserve a model's full completion budget (which some
// gateways pre-bill against the account balance). 1500 comfortably fits 3
// blurbs plus any reasoning preamble free models emit, so the JSON isn't
// truncated mid-object (which would make it unparseable and waste the call).
const MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS ?? 1500);

const SYSTEM_PROMPT =
  "You are a knowledgeable world-music journalist writing liner notes for RandMU, " +
  "a discovery app that surfaces diverse, largely non-Western music. You write vivid, " +
  "specific, factually careful prose.";

function userPrompt(i: DescribeInput, grounding?: Grounding | null): string {
  const meta = {
    title: i.title,
    artist: i.artist,
    country: i.country || null,
    language: i.language || null,
    genre: i.genre || null,
    subgenre: i.subgenre || null,
    album: i.albumName,
    albumType: i.albumType,
    year: i.year,
  };
  const facts = grounding?.text
    ? [
        "",
        "Verified facts (researched from Wikipedia/MusicBrainz). Use ONLY these for any",
        "specific claim (dates, origin, career stage, collaborators). Do NOT contradict",
        "them and do NOT introduce other specific facts beyond them or the metadata:",
        grounding.text,
      ]
    : [];
  return [
    "Write liner notes for this specific track. Return ONLY a JSON object with keys",
    '"songDescription", "artistDescription", and "albumDescription".',
    "",
    "Track metadata:",
    JSON.stringify(meta, null, 2),
    ...facts,
    "",
    "Requirements:",
    "- songDescription (2 short paragraphs, ~70-120 words total): what the track sounds like",
    "  (instrumentation, rhythm, mood), any genuinely interesting/niche facts about THIS song,",
    "  where it sits in the artist's career, and why it matters.",
    "- artistDescription (2 short paragraphs, ~70-120 words total): who the artist is, their",
    "  significance, their style and their place and era.",
    '- albumDescription (1 short paragraph, ~40-70 words) about the album/EP and this track\'s',
    '  place on it. If albumType is "single" or there is no album, set albumDescription to null.',
    "",
    "Accuracy rules (critical):",
    "- Only state specific facts (dates, chart positions, awards, collaborators, biographical",
    "  events) if you are confident they are true for THIS exact artist and song.",
    "- If you do not actually recognise this artist or song, DO NOT invent facts. Instead write",
    "  authoritatively and truthfully about the genre, the country/region, the language and the",
    "  era — real statements about the tradition the music belongs to.",
    "- Never fabricate. Do not hedge with words like 'likely', 'probably', or 'may have'.",
    "- Do not mention AI, metadata, or that information is limited. Write as polished liner notes,",
    "  plain prose, no markdown headings.",
  ].join("\n");
}

function extractJson(text: string): GeneratedDescriptions | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const song = typeof obj.songDescription === "string" ? obj.songDescription.trim() : "";
  const artist = typeof obj.artistDescription === "string" ? obj.artistDescription.trim() : "";
  if (!song || !artist) return null;
  const album =
    typeof obj.albumDescription === "string" && obj.albumDescription.trim()
      ? obj.albumDescription.trim()
      : null;
  return { songDescription: song, artistDescription: artist, albumDescription: album };
}

// OpenAI and OpenRouter share the same chat-completions request shape.
async function callOpenAICompatible(
  provider: "openai" | "openrouter",
  input: DescribeInput,
  grounding: Grounding | null,
  signal: AbortSignal,
): Promise<GeneratedDescriptions | null> {
  const url =
    provider === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://github.com/crazyninja77/RandMU";
    headers["X-Title"] = "RandMU";
  }
  // Try each configured model in turn; free models are often rate-limited (429)
  // individually, so falling through keeps generation reliable.
  for (const model of modelsFor(provider)) {
    const res = await fetch(url, {
      method: "POST",
      signal,
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt(input, grounding) },
        ],
      }),
    });
    if (!res.ok) {
      console.warn(`[llm] ${provider}/${model} ${res.status}: ${(await res.text()).slice(0, 160)}`);
      continue;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = extractJson(data.choices?.[0]?.message?.content ?? "");
    if (parsed) return parsed;
    console.warn(`[llm] ${provider}/${model}: response was not valid JSON, trying next`);
  }
  return null;
}

// Local Ollama exposes an OpenAI-compatible endpoint at /v1/chat/completions.
async function callOllama(
  input: DescribeInput,
  grounding: Grounding | null,
  signal: AbortSignal,
): Promise<GeneratedDescriptions | null> {
  const res = await fetch(`${OLLAMA_HOST}/v1/chat/completions`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      temperature: 0.7,
      max_tokens: MAX_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(input, grounding) },
      ],
    }),
  });
  if (!res.ok) {
    console.warn(`[llm] ollama ${res.status}: ${(await res.text()).slice(0, 160)}`);
    return null;
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return extractJson(data.choices?.[0]?.message?.content ?? "");
}

async function callAnthropic(
  input: DescribeInput,
  grounding: Grounding | null,
  signal: AbortSignal,
): Promise<GeneratedDescriptions | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelFor("anthropic"),
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt(input, grounding) }],
    }),
  });
  if (!res.ok) {
    console.warn(`[llm] Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return null;
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const content = data.content?.find((b) => b.type === "text")?.text;
  return content ? extractJson(content) : null;
}

// --- Verification pass ------------------------------------------------------
// Weak models occasionally invent precise dates. We drop any sentence asserting
// a specific year that isn't backed by the song's metadata or the grounded
// facts. Decade references (e.g. "1970s") are left untouched.
function stripUnsupportedYears(text: string, allowed: Set<number>): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => {
    const ys = [...s.matchAll(/\b(1[89]\d{2}|20\d{2})\b(?!s)/g)].map((m) => Number(m[1]));
    return ys.every((y) => allowed.has(y));
  });
  return kept.join(" ").trim();
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function verify(
  gen: GeneratedDescriptions,
  input: DescribeInput,
  grounding: Grounding | null,
): GeneratedDescriptions | null {
  const allowed = new Set<number>(grounding?.years ?? []);
  if (input.year) allowed.add(input.year);
  const songDescription = stripUnsupportedYears(gen.songDescription, allowed);
  const artistDescription = stripUnsupportedYears(gen.artistDescription, allowed);
  // If stripping gutted the prose, treat as a failed generation (caller falls
  // back to template; the background worker will retry later).
  if (wordCount(songDescription) < 30 || wordCount(artistDescription) < 25) return null;
  const albumDescription = gen.albumDescription
    ? stripUnsupportedYears(gen.albumDescription, allowed) || null
    : null;
  return { songDescription, artistDescription, albumDescription };
}

/**
 * Generate descriptions for a song. Tries the configured remote provider first
 * (free models, with fall-through), then the local Ollama model as a last
 * resort. Output is grounded in researched facts and run through a verification
 * pass. Returns null on any failure so callers can fall back to existing text.
 */
export interface GenerateOptions {
  /**
   * Try the local model first (fast, free, unlimited) before the remote
   * provider. Used by the background worker for throughput; live reveals leave
   * this off so they get the higher-quality remote model when it's reachable.
   */
  preferLocal?: boolean;
}

export async function generateDescriptions(
  input: DescribeInput,
  grounding?: Grounding | null,
  opts: GenerateOptions = {},
): Promise<GeneratedDescriptions | null> {
  const provider = resolveProvider();
  if (!provider && !ollamaReady) return null;
  const facts = grounding ?? null;

  // Each phase gets its own abort budget so a remote timeout never starves the
  // local fallback.
  async function withTimeout(
    ms: number,
    fn: (signal: AbortSignal) => Promise<GeneratedDescriptions | null>,
  ): Promise<GeneratedDescriptions | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fn(controller.signal);
    } catch (e) {
      console.warn(`[llm] generation phase failed: ${(e as Error).message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  const remote = (): Promise<GeneratedDescriptions | null> => {
    if (provider === "anthropic")
      return withTimeout(TIMEOUT_MS, (s) => callAnthropic(input, facts, s));
    if (provider)
      return withTimeout(TIMEOUT_MS, (s) => callOpenAICompatible(provider, input, facts, s));
    return Promise.resolve(null);
  };
  const local = (): Promise<GeneratedDescriptions | null> =>
    ollamaReady ? withTimeout(OLLAMA_TIMEOUT_MS, (s) => callOllama(input, facts, s)) : Promise.resolve(null);

  const order = opts.preferLocal ? [local, remote] : [remote, local];
  let raw: GeneratedDescriptions | null = null;
  for (const attempt of order) {
    raw = await attempt();
    if (raw) break;
  }
  if (!raw) return null;
  return verify(raw, input, facts);
}
