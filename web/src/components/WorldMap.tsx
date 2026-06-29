import { useEffect, useState } from "react";
import { api, type CountryStat } from "../api";
import { useI18n } from "../i18n";
import { CENTROIDS } from "./centroids";

// Equirectangular projection: lon/lat → SVG x/y
const MAP_W = 900;
const MAP_H = 450;
function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * MAP_W;
  const y = ((90 - lat) / 180) * MAP_H;
  return [x, y];
}

function interpolateColor(t: number): string {
  // Purple (cold) → magenta → coral (hot)
  const r = Math.round(120 + t * 135);
  const g = Math.round(80 - t * 40);
  const b = Math.round(220 - t * 120);
  return `rgb(${r},${g},${b})`;
}

export function WorldMap() {
  const { t } = useI18n();
  const [data, setData] = useState<CountryStat[] | null>(null);
  const [hovered, setHovered] = useState<CountryStat | null>(null);

  useEffect(() => {
    api.countries().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;

  const maxCount = Math.max(...data.map((d) => d.count));
  const totalCountries = data.length;
  const totalSongs = data.reduce((s, d) => s + d.count, 0);

  const dots = data
    .map((d) => {
      const centroid = CENTROIDS[d.country];
      if (!centroid) return null;
      const [x, y] = project(centroid[0], centroid[1]);
      const norm = Math.log(d.count + 1) / Math.log(maxCount + 1);
      const r = 3 + norm * 9;
      return { ...d, x, y, r, norm };
    })
    .filter(Boolean) as Array<CountryStat & { x: number; y: number; r: number; norm: number }>;

  return (
    <section className="world-map-section">
      <h2>{t("map.title")}</h2>
      <p className="map-subtitle">
        {t("map.subtitle", { countries: totalCountries, songs: totalSongs })}
      </p>

      <div className="map-container">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="world-map-svg"
          aria-label={t("map.ariaLabel")}
        >
          {/* Faint grid lines for geographic context */}
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = ((90 - lat) / 180) * MAP_H;
            return (
              <line
                key={`lat-${lat}`}
                x1={0} y1={y} x2={MAP_W} y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={0.5}
              />
            );
          })}
          {[-120, -60, 0, 60, 120].map((lon) => {
            const x = ((lon + 180) / 360) * MAP_W;
            return (
              <line
                key={`lon-${lon}`}
                x1={x} y1={0} x2={x} y2={MAP_H}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={0.5}
              />
            );
          })}

          {/* Country dots */}
          {dots.map((d) => (
            <circle
              key={d.country}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={interpolateColor(d.norm)}
              opacity={0.85}
              className="map-dot"
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{`${d.country}: ${d.count} ${d.count === 1 ? "song" : "songs"}`}</title>
            </circle>
          ))}
        </svg>

        {hovered && (
          <div className="map-tooltip">
            <strong>{hovered.country}</strong>
            <span>{hovered.count} {hovered.count === 1 ? "song" : "songs"}</span>
          </div>
        )}
      </div>
    </section>
  );
}
