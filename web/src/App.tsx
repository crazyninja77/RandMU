import { useEffect, useState } from "react";
import { api } from "./api";
import type { Payment, Song, Stats } from "./types";
import { IdealModal } from "./components/IdealModal";
import { SongCard } from "./components/SongCard";
import { useI18n, type Lang } from "./i18n";

type View =
  | { kind: "idle" }
  | { kind: "paying"; payment: Payment }
  | { kind: "revealing" }
  | { kind: "result"; song: Song };

function LangToggle() {
  const { lang, setLang } = useI18n();
  const langs: Lang[] = ["en", "nl"];
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      {langs.map((l) => (
        <button
          key={l}
          className={`lang-btn${lang === l ? " active" : ""}`}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [view, setView] = useState<View>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => setStats(null));
  }, []);

  const price = stats ? `€${(stats.priceCents / 100).toFixed(2).replace(".", ",")}` : "€0,10";

  async function startPurchase() {
    setError(null);
    try {
      const { payment } = await api.createPayment();
      setView({ kind: "paying", payment });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function onPaid(song: Song | null) {
    if (!song) {
      setError(t("error.nosong"));
      setView({ kind: "idle" });
      return;
    }
    setView({ kind: "revealing" });
    setTimeout(() => setView({ kind: "result", song }), 600);
  }

  return (
    <div className="page">
      <header className="site-header">
        <div className="header-left">
          <LangToggle />
          <div className="brand">
            Rand<span className="brand-accent">MU</span>
          </div>
        </div>
        <nav className="stats-bar">
          {stats && (
            <>
              <span>{stats.total.toLocaleString()} {t("stats.songs")}</span>
              <span>{stats.countries} {t("stats.countries")}</span>
              <span>{stats.genres} {t("stats.genres")}</span>
              <span>{stats.languages} {t("stats.languages")}</span>
            </>
          )}
        </nav>
      </header>

      <main className="main">
        {view.kind === "idle" && (
          <section className="hero">
            <h1>
              {t("hero.title.pre")}
              <em>{t("hero.title.em")}</em>
              {t("hero.title.post")}
            </h1>
            <p className="lede">{t("hero.lede", { price })}</p>
            <button className="btn btn-primary big" onClick={startPurchase}>
              {t("hero.cta", { price })}
            </button>
            <p className="paywith">{t("hero.paywith")}</p>
            {error && <p className="error">{error}</p>}
          </section>
        )}

        {view.kind === "paying" && (
          <IdealModal
            payment={view.payment}
            onPaid={onPaid}
            onCancel={() => setView({ kind: "idle" })}
          />
        )}

        {view.kind === "revealing" && (
          <section className="hero">
            <div className="spinner" />
            <p className="lede">{t("reveal.drawing")}</p>
          </section>
        )}

        {view.kind === "result" && (
          <SongCard song={view.song} onAgain={startPurchase} />
        )}
      </main>

      <footer className="site-footer">
        <span>{t("footer.text", { price })}</span>
      </footer>
    </div>
  );
}
