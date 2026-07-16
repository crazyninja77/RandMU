import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DEMO_MODE, getStats, getCountryStats, rateSong, getSongById } from "./library.js";
import { ensureSongDescribed } from "./descriptions.js";
import { initLlm, llmStatus } from "./llm.js";
import { startDescriptionWorker } from "./worker.js";
import {
  PRICE_CENTS,
  createPayment,
  confirmPayment,
  failPayment,
  getPayment,
  getPaymentSong,
} from "./payments.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/stats", (_req, res) => {
  res.json({ ...getStats(), priceCents: PRICE_CENTS });
});

app.get("/api/countries", (_req, res) => {
  res.json(getCountryStats());
});

// Create a pending iDEAL payment for one recommendation.
app.post("/api/payments", (_req, res) => {
  const payment = createPayment();
  res.status(201).json({ payment });
});

app.get("/api/payments/:id", (req, res) => {
  const payment = getPayment(req.params.id);
  if (!payment) return res.status(404).json({ error: "payment_not_found" });
  const song = payment.status === "paid" ? getPaymentSong(payment.id) : null;
  res.json({ payment, song });
});

// Mock the iDEAL bank approving the payment.
app.post("/api/payments/:id/confirm", (req, res) => {
  const payment = confirmPayment(req.params.id);
  if (!payment) return res.status(404).json({ error: "payment_not_found" });
  const song = getPaymentSong(payment.id);
  res.json({ payment, song });
});

// Mock the user cancelling at the bank.
app.post("/api/payments/:id/fail", (req, res) => {
  const payment = failPayment(req.params.id);
  if (!payment) return res.status(404).json({ error: "payment_not_found" });
  res.json({ payment });
});

// Rate a song (0–10). Returns the new community average + count.
app.post("/api/songs/:id/rate", (req, res) => {
  const value = Number(req.body?.value);
  if (!Number.isFinite(value) || value < 0 || value > 10) {
    return res.status(400).json({ error: "invalid_value" });
  }
  if (!getSongById(req.params.id)) {
    return res.status(404).json({ error: "song_not_found" });
  }
  const result = rateSong(req.params.id, value);
  res.json(result);
});

app.get("/api/recommendation/:paymentId", async (req, res) => {
  const song = getPaymentSong(req.params.paymentId);
  if (!song) return res.status(402).json({ error: "payment_required" });
  // Generate + cache unique liner notes for this song on first reveal.
  const described = await ensureSongDescribed(song);
  res.json({ song: described });
});

// In production, serve the pre-built frontend from ../web/dist.
const STATIC_DIR = join(__dirname, "..", "..", "web", "dist");
if (existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  // SPA fallback: any non-API route serves index.html.
  app.get("*", (_req, res) => {
    res.sendFile(join(STATIC_DIR, "index.html"));
  });
}

const PORT = Number(process.env.PORT ?? 4000);

async function main(): Promise<void> {
  // Probe the local model so llmStatus/availability reflect it.
  await initLlm();
  app.listen(PORT, () => {
    const stats = getStats();
    console.log(`RandMU backend on http://localhost:${PORT}`);
    const llm = llmStatus();
    console.log(
      llm.available
        ? `LLM descriptions: ${llm.provider ?? "local"} (${llm.model})`
        : "LLM descriptions: disabled (no API key) — using templated text",
    );
    console.log(
      `Library: ${stats.total} songs · ${stats.countries} countries · ${stats.genres} genres · ${stats.languages} languages`,
    );
    if (DEMO_MODE) console.log("Catalogue mode: demo (LLM-described songs only)");
    // Pre-generate descriptions in the background so reveals become instant.
    startDescriptionWorker();
  });
}

void main();
