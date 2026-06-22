import { COUNTRIES } from "./sources/refdata.js";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Display name -> ISO 3166-1 alpha-2, seeded from the harvest reference data.
const NAME_TO_CODE = new Map<string, string>();
for (const c of COUNTRIES) NAME_TO_CODE.set(norm(c.name), c.code);

// Extra aliases for names that appear in the curated seed data or that differ
// from the reference spelling. These cover countries not in COUNTRIES (e.g. the
// US/UK) and common shorthands.
const ALIASES: Record<string, string> = {
  usa: "US",
  "united states": "US",
  "united states of america": "US",
  america: "US",
  uk: "GB",
  "united kingdom": "GB",
  "great britain": "GB",
  britain: "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  canada: "CA",
  korea: "KR",
  "south korea": "KR",
  "ivory coast": "CI",
  "cote divoire": "CI",
  "democratic republic of the congo": "CD",
  "dr congo": "CD",
  "republic of the congo": "CG",
  "cape verde": "CV",
  "cabo verde": "CV",
  russia: "RU",
  "russian federation": "RU",
  "the netherlands": "NL",
  holland: "NL",
};
for (const [name, code] of Object.entries(ALIASES)) NAME_TO_CODE.set(norm(name), code);

/**
 * Resolve a free-form country label to an ISO 3166-1 alpha-2 code, or null if it
 * can't be matched. Handles compound seed labels like "USA (Hawaii)",
 * "Sri Lanka / UK" or "Colombia / South Africa" by taking the first named
 * country.
 */
export function countryNameToCode(country: string | null | undefined): string | null {
  if (!country) return null;
  // Take the primary country from compound labels: split on "/", "(", ",".
  const primary = country.split(/[/(,]/)[0];
  const key = norm(primary);
  if (!key) return null;
  return NAME_TO_CODE.get(key) ?? null;
}
