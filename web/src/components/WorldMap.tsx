import { useEffect, useState } from "react";
import { api, type CountryStat } from "../api";
import { useI18n } from "../i18n";

// Country name → [longitude, latitude] centroids for an equirectangular projection.
// Covers the countries most likely to appear in the RandMU catalogue.
const CENTROIDS: Record<string, [number, number]> = {
  "Afghanistan": [67.7, 33.9], "Albania": [20.2, 41.2], "Algeria": [3.0, 28.0],
  "Angola": [17.5, -12.5], "Argentina": [-64.0, -34.0], "Armenia": [44.5, 40.2],
  "Australia": [133.8, -25.3], "Austria": [14.6, 47.5], "Azerbaijan": [49.9, 40.4],
  "Bahrain": [50.6, 26.0], "Bangladesh": [90.4, 23.7], "Belarus": [27.9, 53.7],
  "Belgium": [4.5, 50.8], "Benin": [2.3, 9.3], "Bermuda": [-64.8, 32.3],
  "Bhutan": [90.4, 27.5], "Bolivia": [-65.0, -17.0], "Bosnia and Herzegovina": [17.7, 43.9],
  "Botswana": [24.7, -22.3], "Brazil": [-51.9, -14.2], "Brunei": [114.7, 4.5],
  "Bulgaria": [25.5, 42.7], "Burkina Faso": [-1.6, 12.4], "Burundi": [29.9, -3.4],
  "Cambodia": [105.0, 12.6], "Cameroon": [12.4, 6.0], "Canada": [-106.3, 56.1],
  "Cape Verde": [-23.6, 16.0], "Cabo Verde": [-23.6, 16.0],
  "Central African Republic": [20.9, 6.6], "Chad": [18.7, 15.5],
  "Chile": [-71.5, -35.7], "China": [104.2, 35.9], "Colombia": [-74.3, 4.6],
  "Comoros": [43.9, -12.2], "Congo": [15.8, -0.2],
  "Democratic Republic of the Congo": [21.8, -4.0],
  "Costa Rica": [-84.0, 10.0], "Croatia": [15.2, 45.1],
  "Cuba": [-77.8, 21.5], "Cyprus": [33.4, 35.1], "Czech Republic": [15.5, 49.8],
  "Czechia": [15.5, 49.8],
  "Denmark": [9.5, 56.3], "Djibouti": [43.1, 11.6],
  "Dominican Republic": [-70.2, 18.7],
  "Ecuador": [-78.2, -1.8], "Egypt": [30.8, 26.8], "El Salvador": [-88.9, 13.8],
  "Equatorial Guinea": [10.3, 1.7], "Eritrea": [39.8, 15.2],
  "Estonia": [25.0, 58.6], "Eswatini": [31.5, -26.5], "Ethiopia": [40.5, 9.1],
  "Fiji": [179.4, -16.6], "Finland": [25.7, 61.9], "France": [2.2, 46.2],
  "Gabon": [11.6, -0.8], "Gambia": [-15.3, 13.4], "Georgia": [43.4, 42.3],
  "Germany": [10.5, 51.2], "Ghana": [-1.0, 7.9], "Greece": [21.8, 39.1],
  "Guatemala": [-90.2, 15.8], "Guinea": [-9.7, 9.9], "Guinea-Bissau": [-15.2, 12.0],
  "Guyana": [-58.9, 5.0], "Haiti": [-72.3, 19.0], "Honduras": [-86.2, 15.2],
  "Hungary": [19.5, 47.2], "Iceland": [-19.0, 65.0], "India": [78.0, 21.0],
  "Indonesia": [113.9, -0.8], "Iran": [53.7, 32.4], "Iraq": [43.7, 33.2],
  "Ireland": [-8.2, 53.4], "Israel": [34.9, 31.0], "Italy": [12.6, 41.9],
  "Ivory Coast": [-5.5, 7.5], "Côte d'Ivoire": [-5.5, 7.5],
  "Jamaica": [-77.3, 18.1], "Japan": [138.3, 36.2],
  "Jordan": [36.2, 30.6], "Kazakhstan": [66.9, 48.0], "Kenya": [37.9, -0.0],
  "Kosovo": [20.9, 42.6], "Kuwait": [47.5, 29.3],
  "Kyrgyzstan": [74.8, 41.2], "Laos": [102.5, 19.9], "Latvia": [24.6, 56.9],
  "Lebanon": [35.9, 33.9], "Lesotho": [28.2, -29.6], "Liberia": [-9.4, 6.4],
  "Libya": [17.2, 26.3], "Lithuania": [23.9, 55.2], "Luxembourg": [6.1, 49.8],
  "Madagascar": [46.9, -18.8], "Malawi": [34.3, -13.3], "Malaysia": [101.7, 4.2],
  "Maldives": [73.2, 3.2], "Mali": [-4.0, 17.6], "Malta": [14.4, 35.9],
  "Mauritania": [-10.9, 21.0], "Mauritius": [57.6, -20.3],
  "Mexico": [-102.6, 23.6], "Moldova": [28.4, 47.4], "Mongolia": [103.8, 46.9],
  "Montenegro": [19.4, 42.7], "Morocco": [-7.1, 31.8], "Mozambique": [35.5, -18.7],
  "Myanmar": [96.0, 19.8], "Namibia": [18.5, -22.6], "Nepal": [84.1, 28.4],
  "Netherlands": [5.3, 52.1], "New Zealand": [174.9, -40.9],
  "Nicaragua": [-85.2, 12.9], "Niger": [8.1, 17.6], "Nigeria": [8.7, 9.1],
  "North Korea": [127.5, 40.3], "North Macedonia": [21.7, 41.5],
  "Norway": [8.5, 60.5], "Oman": [55.9, 21.5],
  "Pakistan": [69.3, 30.4], "Palestine": [35.2, 31.9], "Panama": [-80.8, 8.5],
  "Papua New Guinea": [143.9, -6.3], "Paraguay": [-58.4, -23.4],
  "Peru": [-75.0, -9.2], "Philippines": [121.8, 12.9], "Poland": [19.1, 51.9],
  "Portugal": [-8.2, 39.4], "Puerto Rico": [-66.6, 18.2], "Qatar": [51.2, 25.4],
  "Romania": [24.9, 46.0], "Russia": [105.3, 61.5], "Rwanda": [29.9, -1.9],
  "Samoa": [-172.1, -13.8], "Saudi Arabia": [45.1, 23.9],
  "Senegal": [-14.5, 14.5], "Serbia": [21.0, 44.0], "Sierra Leone": [-11.8, 8.5],
  "Singapore": [103.8, 1.4], "Slovakia": [19.7, 48.7], "Slovenia": [14.6, 46.2],
  "Somalia": [46.2, 5.2], "South Africa": [22.9, -30.6],
  "South Korea": [128.0, 35.9], "South Sudan": [31.3, 6.9],
  "Spain": [-3.7, 40.5], "Sri Lanka": [80.8, 7.9], "Sudan": [30.2, 12.9],
  "Suriname": [-56.0, 4.0], "Sweden": [18.6, 60.1], "Switzerland": [8.2, 46.8],
  "Syria": [38.9, 35.0], "Taiwan": [121.0, 23.7], "Tajikistan": [71.3, 38.9],
  "Tanzania": [34.9, -6.4], "Thailand": [100.5, 15.9], "Togo": [1.2, 8.6],
  "Tonga": [-175.2, -21.2], "Trinidad and Tobago": [-61.2, 10.7],
  "Tunisia": [9.5, 33.9], "Turkey": [35.2, 39.0], "Turkmenistan": [59.6, 38.9],
  "Uganda": [32.3, 1.4], "Ukraine": [31.2, 48.4],
  "United Arab Emirates": [53.8, 23.4], "United Kingdom": [-3.4, 55.4],
  "United States": [-95.7, 37.1], "Uruguay": [-55.8, -32.5],
  "Uzbekistan": [64.6, 41.4], "Venezuela": [-66.6, 6.4],
  "Vietnam": [108.3, 14.1], "Yemen": [48.5, 15.6],
  "Zambia": [27.8, -13.1], "Zimbabwe": [29.2, -19.0],
  // Aliases and common variations
  "Türkiye": [35.2, 39.0], "Korea": [128.0, 35.9],
  "Republic of Korea": [128.0, 35.9],
  "Réunion": [55.5, -21.1], "Martinique": [-61.0, 14.6],
  "Guadeloupe": [-61.6, 16.3], "French Guiana": [-53.1, 3.9],
};

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
