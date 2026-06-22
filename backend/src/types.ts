export interface Song {
  id: string;
  title: string;
  artist: string;
  artistDescription: string;
  songDescription: string;
  country: string;
  language: string;
  genre: string;
  subgenre: string;
  /** null when the track is a standalone single */
  albumName: string | null;
  /** "album" | "ep" | "single" | null */
  albumType: string | null;
  albumDescription: string | null;
  year: number | null;
  spotifyTrackId: string | null;
  spotifyUrl: string | null;
  artistImageUrl: string | null;
  albumImageUrl: string | null;
  /** community average on a 0–10 scale, null when nobody has rated yet */
  ratingAverage: number | null;
  ratingCount: number;
}

export type PaymentStatus = "pending" | "paid" | "expired" | "failed";

export interface Payment {
  id: string;
  amountCents: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  songId: string | null;
  createdAt: string;
  paidAt: string | null;
}
