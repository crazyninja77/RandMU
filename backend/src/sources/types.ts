/** A raw song/artist candidate harvested from an open data source. */
export interface Candidate {
  artist: string;
  /** Song title, when the source provides one (MusicBrainz recordings do). */
  title: string | null;
  /** Display country name (e.g. "Mali"). */
  country: string;
  /** ISO 3166-1 alpha-2 code, used later as the Spotify market. */
  countryCode: string;
  language: string;
  genre: string;
  /** Where this candidate came from: "musicbrainz" | "wikipedia" | "reddit". */
  source: string;
}

/** Stable de-dupe key for a candidate. */
export function candidateKey(c: Candidate): string {
  const a = c.artist.trim().toLowerCase();
  const t = (c.title ?? "").trim().toLowerCase();
  return `${a}::${t}`;
}
