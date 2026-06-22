import type { Payment, Song, Stats } from "./types";

const BASE = import.meta.env.VITE_API_BASE ?? "";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = res.statusText;
    }
    throw new Error(`${res.status} ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  stats: () => req<Stats>("/api/stats"),
  createPayment: () => req<{ payment: Payment }>("/api/payments", { method: "POST" }),
  confirmPayment: (id: string) =>
    req<{ payment: Payment; song: Song | null }>(`/api/payments/${id}/confirm`, {
      method: "POST",
    }),
  failPayment: (id: string) =>
    req<{ payment: Payment }>(`/api/payments/${id}/fail`, { method: "POST" }),
  recommendation: (paymentId: string) =>
    req<{ song: Song }>(`/api/recommendation/${paymentId}`),
  rateSong: (id: string, value: number) =>
    req<{ average: number; count: number }>(`/api/songs/${id}/rate`, {
      method: "POST",
      body: JSON.stringify({ value }),
    }),
};
