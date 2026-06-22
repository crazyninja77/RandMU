/**
 * Broad regional umbrellas keyed by ISO 3166-1 alpha-2 code. Used as a
 * meaningful fallback "genre" when neither a Spotify genre nor a harvested
 * style maps to a specific musical bucket — far more informative than the old
 * catch-all "World" label.
 */

const REGIONS: Record<string, string[]> = {
  African: [
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG",
    "CD", "CI", "DJ", "EG", "GQ", "ER", "ET", "GA", "GM", "GH", "GN", "GW",
    "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA",
    "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "SZ",
    "TZ", "TG", "TN", "UG", "ZM", "ZW",
  ],
  "Middle Eastern": [
    "BH", "IR", "IQ", "IL", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY",
    "TR", "AE", "YE",
  ],
  Asian: [
    "AF", "AM", "AZ", "BD", "BT", "GE", "IN", "KZ", "KG", "MV", "MN", "NP",
    "PK", "LK", "TJ", "TM", "UZ", "BN", "KH", "CN", "HK", "ID", "JP", "LA",
    "MO", "MY", "MM", "KP", "PH", "SG", "KR", "TW", "TH", "TL", "VN",
  ],
  European: [
    "AL", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI",
    "FR", "DE", "GR", "HU", "IS", "IT", "XK", "LV", "LT", "MK", "MT", "MD",
    "ME", "NL", "NO", "PL", "PT", "RO", "RU", "RS", "SK", "SI", "ES", "SE",
    "CH", "UA", "GB", "IE",
  ],
  Caribbean: ["CU", "DO", "HT", "JM", "PR", "TT"],
  Latin: [
    "AR", "BO", "BR", "CL", "CO", "CR", "EC", "SV", "GT", "HN", "MX", "NI",
    "PA", "PY", "PE", "UY", "VE",
  ],
  Pacific: ["AU", "FJ", "NC", "NZ", "PG", "WS", "TO", "VU"],
  "North American": ["US", "CA"],
};

const REGION_BY_CODE: Record<string, string> = {};
for (const [region, codes] of Object.entries(REGIONS)) {
  for (const code of codes) REGION_BY_CODE[code] = region;
}

/** Broad region label for an ISO alpha-2 code, or null when unknown. */
export function regionForCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return REGION_BY_CODE[code.toUpperCase()] ?? null;
}
