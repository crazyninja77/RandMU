import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import { getRandomSong, getSongById } from "./library.js";
import type { Payment, PaymentStatus } from "./types.js";

export const PRICE_CENTS = 10;

interface PaymentRow {
  id: string;
  amount_cents: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  song_id: string | null;
  created_at: string;
  paid_at: string | null;
}

function rowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    amountCents: row.amount_cents,
    currency: row.currency,
    method: row.method,
    status: row.status,
    songId: row.song_id,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

export function createPayment(): Payment {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO payments (id, amount_cents, currency, method, status, created_at)
     VALUES (?, ?, 'EUR', 'ideal', 'pending', ?)`,
  ).run(id, PRICE_CENTS, now);
  return getPayment(id)!;
}

export function getPayment(id: string): Payment | null {
  const row = db.prepare("SELECT * FROM payments WHERE id = ?").get(id) as
    | PaymentRow
    | undefined;
  return row ? rowToPayment(row) : null;
}

/** Mock the iDEAL bank confirming the payment, then reserve a random song. */
export function confirmPayment(id: string): Payment | null {
  const payment = getPayment(id);
  if (!payment) return null;
  if (payment.status === "paid") return payment;
  if (payment.status !== "pending") return payment;

  const song = getRandomSong();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE payments SET status = 'paid', paid_at = ?, song_id = ? WHERE id = ?",
  ).run(now, song ? song.id : null, id);
  return getPayment(id);
}

export function failPayment(id: string): Payment | null {
  const payment = getPayment(id);
  if (!payment) return null;
  if (payment.status === "pending") {
    db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(id);
  }
  return getPayment(id);
}

export function getPaymentSong(id: string) {
  const payment = getPayment(id);
  if (!payment || payment.status !== "paid" || !payment.songId) return null;
  return getSongById(payment.songId);
}
