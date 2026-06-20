import express from "express";
import cors from "cors";
import { getStats } from "./library.js";
import {
  PRICE_CENTS,
  createPayment,
  confirmPayment,
  failPayment,
  getPayment,
  getPaymentSong,
} from "./payments.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/stats", (_req, res) => {
  res.json({ ...getStats(), priceCents: PRICE_CENTS });
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

app.get("/api/recommendation/:paymentId", (req, res) => {
  const song = getPaymentSong(req.params.paymentId);
  if (!song) return res.status(402).json({ error: "payment_required" });
  res.json({ song });
});

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  const stats = getStats();
  console.log(`RandMU backend on http://localhost:${PORT}`);
  console.log(
    `Library: ${stats.total} songs · ${stats.countries} countries · ${stats.genres} genres · ${stats.languages} languages`,
  );
});
