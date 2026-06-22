import { useEffect, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";

const MIN = 0;
const MAX = 10;

function pct(value: number): number {
  return ((value - MIN) / (MAX - MIN)) * 100;
}

type Stored = { you: number };

export function RatingSlider({
  songId,
  initialAverage,
  initialCount,
}: {
  songId: string;
  initialAverage: number | null;
  initialCount: number;
}) {
  const { t } = useI18n();
  const storageKey = `randmu_rating_${songId}`;

  const [value, setValue] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    you: number;
    average: number;
    count: number;
  } | null>(null);

  // Restore a prior rating for this song (same song can be drawn again).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const stored = JSON.parse(raw) as Stored;
        setResult({
          you: stored.you,
          average: initialAverage ?? stored.you,
          count: initialCount,
        });
      }
    } catch {
      /* ignore */
    }
  }, [storageKey, initialAverage, initialCount]);

  async function submit(rating: number) {
    if (submitting || result) return;
    setSubmitting(true);
    setError(null);
    try {
      const { average, count } = await api.rateSong(songId, rating);
      setResult({ you: rating, average, count });
      localStorage.setItem(storageKey, JSON.stringify({ you: rating } satisfies Stored));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="desc-block rate-block">
      <h3>{t("rate.title")}</h3>

      {result ? (
        <>
          <div className="rate-track rate-track-result" aria-hidden="true">
            <div className="rate-fill" style={{ width: `${pct(result.average)}%` }} />
            <div className="rate-marker rate-marker-you" style={{ left: `${pct(result.you)}%` }}>
              <span className="rate-bubble rate-bubble-you">
                {t("rate.you")} {result.you.toFixed(1)}
              </span>
            </div>
            <div className="rate-marker rate-marker-avg" style={{ left: `${pct(result.average)}%` }}>
              <span className="rate-bubble rate-bubble-avg">
                {t("rate.average")} {result.average.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="rate-scale">
            <span>{MIN}</span>
            <span>{MAX}</span>
          </div>
          <p className="rate-summary">
            {t("rate.thanks")} · {t("rate.count", { count: result.count })}
          </p>
        </>
      ) : (
        <>
          <p className="rate-help">{t("rate.help")}</p>
          <div className="rate-input-row">
            <input
              type="range"
              className="rate-input"
              min={MIN}
              max={MAX}
              step={0.1}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              onPointerUp={(e) => submit(Number((e.target as HTMLInputElement).value))}
              onKeyUp={(e) => submit(Number((e.target as HTMLInputElement).value))}
              disabled={submitting}
              aria-label={t("rate.title")}
            />
            <output className="rate-value">{value.toFixed(1)}</output>
          </div>
          <div className="rate-scale">
            <span>{MIN}</span>
            <span>{MAX}</span>
          </div>
          {error && <p className="error">{error}</p>}
        </>
      )}
    </div>
  );
}
