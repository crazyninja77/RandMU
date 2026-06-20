import { useEffect, useState } from "react";
import { api } from "./api";
import type { Payment, Song, Stats } from "./types";
import { IdealModal } from "./components/IdealModal";
import { SongCard } from "./components/SongCard";

type View =
  | { kind: "idle" }
  | { kind: "paying"; payment: Payment }
  | { kind: "revealing" }
  | { kind: "result"; song: Song };

export default function App() {
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
      setError("Payment succeeded but no song could be drawn. Is the library seeded?");
      setView({ kind: "idle" });
      return;
    }
    setView({ kind: "revealing" });
    setTimeout(() => setView({ kind: "result", song }), 600);
  }

  return (
    <div className="page">
      <header className="site-header">
        <div className="brand">
          Rand<span className="brand-accent">MU</span>
        </div>
        <nav className="stats-bar">
          {stats && (
            <>
              <span>{stats.total.toLocaleString()} songs</span>
              <span>{stats.countries} countries</span>
              <span>{stats.genres} genres</span>
              <span>{stats.languages} languages</span>
            </>
          )}
        </nav>
      </header>

      <main className="main">
        {view.kind === "idle" && (
          <section className="hero">
            <h1>
              One random song from <em>everywhere</em>.
            </h1>
            <p className="lede">
              A highly specialised library of music from around the world — far from the
              Western mainstream. Pay {price} and we surprise you with one song: its country,
              language, genre, the artist's story, and a snippet to play.
            </p>
            <button className="btn btn-primary big" onClick={startPurchase}>
              Surprise me · {price}
            </button>
            <p className="paywith">Pay with iDEAL</p>
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
            <p className="lede">Drawing your song…</p>
          </section>
        )}

        {view.kind === "result" && (
          <SongCard song={view.song} onAgain={startPurchase} />
        )}
      </main>

      <footer className="site-footer">
        <span>RandMU — a song for {price}. Payments are mocked for now.</span>
      </footer>
    </div>
  );
}
