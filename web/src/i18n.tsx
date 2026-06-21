import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "nl";

type Dict = Record<string, string>;

const EN: Dict = {
  "stats.songs": "songs",
  "stats.countries": "countries",
  "stats.genres": "genres",
  "stats.languages": "languages",
  "hero.title.pre": "One random song from ",
  "hero.title.em": "everywhere",
  "hero.title.post": ".",
  "hero.lede":
    "A highly specialised library of music from around the world — far from the Western mainstream. Pay {price} and we surprise you with one song: its country, language, genre, the artist's story, and a snippet to play.",
  "hero.cta": "Surprise me · {price}",
  "hero.paywith": "Pay with iDEAL",
  "ideal.amount": "Amount",
  "ideal.note": "Mock payment — no real money is charged.",
  "ideal.chooseBank": "Choose your bank",
  "ideal.failed": "Payment failed",
  "ideal.confirming": "Confirming at {bank}…",
  "ideal.pay": "Pay {amount} with {bank}",
  "ideal.cancel": "Cancel",
  "reveal.drawing": "Drawing your song…",
  "error.nosong": "Payment succeeded but no song could be drawn. Is the library seeded?",
  "card.aboutSong": "About the song",
  "card.aboutArtist": "About {artist}",
  "card.album": "Album",
  "card.ep": "EP",
  "card.openSpotify": "Open in Spotify ↗",
  "card.again": "Get another song · {price}",
  "rate.title": "Rate this song",
  "rate.help": "Slide to your score, then see what everyone else thinks.",
  "rate.submit": "Submit my rating",
  "rate.you": "You",
  "rate.average": "Average",
  "rate.count": "{count} ratings",
  "rate.thanks": "Thanks for rating!",
  "footer.text": "RandMU — a song for {price}. Payments are mocked for now.",
};

const NL: Dict = {
  "stats.songs": "nummers",
  "stats.countries": "landen",
  "stats.genres": "genres",
  "stats.languages": "talen",
  "hero.title.pre": "Eén willekeurig nummer van ",
  "hero.title.em": "overal",
  "hero.title.post": ".",
  "hero.lede":
    "Een zeer gespecialiseerde muziekbibliotheek van over de hele wereld — ver van de westerse mainstream. Betaal {price} en wij verrassen je met één nummer: het land, de taal, het genre, het verhaal van de artiest en een fragment om te luisteren.",
  "hero.cta": "Verras me · {price}",
  "hero.paywith": "Betaal met iDEAL",
  "ideal.amount": "Bedrag",
  "ideal.note": "Nagebootste betaling — er wordt geen echt geld afgeschreven.",
  "ideal.chooseBank": "Kies je bank",
  "ideal.failed": "Betaling mislukt",
  "ideal.confirming": "Bevestigen bij {bank}…",
  "ideal.pay": "Betaal {amount} met {bank}",
  "ideal.cancel": "Annuleren",
  "reveal.drawing": "Je nummer wordt getrokken…",
  "error.nosong": "Betaling geslaagd, maar er kon geen nummer worden getrokken. Is de bibliotheek gevuld?",
  "card.aboutSong": "Over het nummer",
  "card.aboutArtist": "Over {artist}",
  "card.album": "Album",
  "card.ep": "EP",
  "card.openSpotify": "Open in Spotify ↗",
  "card.again": "Nog een nummer · {price}",
  "rate.title": "Beoordeel dit nummer",
  "rate.help": "Schuif naar jouw cijfer en zie wat de rest vindt.",
  "rate.submit": "Mijn beoordeling versturen",
  "rate.you": "Jij",
  "rate.average": "Gemiddeld",
  "rate.count": "{count} beoordelingen",
  "rate.thanks": "Bedankt voor je beoordeling!",
  "footer.text": "RandMU — een nummer voor {price}. Betalingen zijn voorlopig nagebootst.",
};

const DICTS: Record<Lang, Dict> = { en: EN, nl: NL };

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = "randmu_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "nl" || saved === "en" ? saved : "en";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      format(DICTS[lang][key] ?? DICTS.en[key] ?? key, vars),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
