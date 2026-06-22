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

type Provider = "openai" | "anthropic";

function resolveProvider(): Provider | null {
  const forced = process.env.LLM_PROVIDER?.toLowerCase();
  if (forced === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (forced === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export function llmAvailable(): boolean {
  return resolveProvider() !== null;
}

export function llmStatus(): { available: boolean; provider: Provider | null; model: string | null } {
  const provider = resolveProvider();
  return { available: provider !== null, provider, model: provider ? modelFor(provider) : null };
}

function modelFor(provider: Provider): string {
  if (process.env.LLM_MODEL) return process.env.LLM_MODEL;
  return provider === "anthropic" ? "claude-3-5-sonnet-latest" : "gpt-4o";
}

const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 30000);

const SYSTEM_PROMPT =
  "You are a knowledgeable world-music journalist writing liner notes for RandMU, " +
  "a discovery app that surfaces diverse, largely non-Western music. You write vivid, " +
  "specific, factually careful prose.";

function userPrompt(i: DescribeInput): string {
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
  return [
    "Write liner notes for this specific track. Return ONLY a JSON object with keys",
    '"songDescription", "artistDescription", and "albumDescription".',
    "",
    "Track metadata:",
    JSON.stringify(meta, null, 2),
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

async function callOpenAI(input: DescribeInput, signal: AbortSignal): Promise<GeneratedDescriptions | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelFor("openai"),
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(input) },
      ],
    }),
  });
  if (!res.ok) {
    console.warn(`[llm] OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return null;
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  return content ? extractJson(content) : null;
}

async function callAnthropic(input: DescribeInput, signal: AbortSignal): Promise<GeneratedDescriptions | null> {
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
      max_tokens: 1024,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt(input) }],
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

/**
 * Generate descriptions for a song. Returns null on any failure (missing key,
 * timeout, bad response) so callers can fall back to the existing text.
 */
export async function generateDescriptions(input: DescribeInput): Promise<GeneratedDescriptions | null> {
  const provider = resolveProvider();
  if (!provider) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return provider === "anthropic"
      ? await callAnthropic(input, controller.signal)
      : await callOpenAI(input, controller.signal);
  } catch (e) {
    console.warn(`[llm] generation failed: ${(e as Error).message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
