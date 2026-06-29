import { CENTROIDS } from "./centroids";

const W = 300;
const H = 180;
const PADDING = 30;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * 900;
  const y = ((90 - lat) / 180) * 450;
  return [x, y];
}

export function CountryMiniMap({ country }: { country: string }) {
  const target = CENTROIDS[country];
  if (!target) return null;

  const [cx, cy] = project(target[0], target[1]);

  // Determine a view window centered on the target country
  const scale = 3;
  const viewW = W * scale;
  const viewH = H * scale;
  const vx = cx - viewW / 2;
  const vy = cy - viewH / 2;

  // Collect nearby context dots
  const dots: { name: string; x: number; y: number; isTarget: boolean }[] = [];
  for (const [name, coords] of Object.entries(CENTROIDS)) {
    const [px, py] = project(coords[0], coords[1]);
    if (px >= vx - PADDING && px <= vx + viewW + PADDING && py >= vy - PADDING && py <= vy + viewH + PADDING) {
      dots.push({ name, x: px, y: py, isTarget: name === country });
    }
  }

  return (
    <div className="country-minimap">
      <svg viewBox={`${vx} ${vy} ${viewW} ${viewH}`} className="minimap-svg">
        {/* Grid lines for context */}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = ((90 - lat) / 180) * 450;
          return (
            <line
              key={`lat-${lat}`}
              x1={vx} y1={y} x2={vx + viewW} y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1.5}
            />
          );
        })}
        {Array.from({ length: 7 }, (_, i) => -180 + i * 60).map((lon) => {
          const x = ((lon + 180) / 360) * 900;
          return (
            <line
              key={`lon-${lon}`}
              x1={x} y1={vy} x2={x} y2={vy + viewH}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Context dots (other countries) */}
        {dots.filter((d) => !d.isTarget).map((d) => (
          <circle
            key={d.name}
            cx={d.x}
            cy={d.y}
            r={4}
            fill="rgba(124, 92, 255, 0.3)"
          />
        ))}

        {/* Target country: pulsing ring + bright dot */}
        <circle cx={cx} cy={cy} r={18} fill="none" stroke="rgba(255, 92, 168, 0.3)" strokeWidth={2} className="minimap-pulse" />
        <circle cx={cx} cy={cy} r={8} fill="#ff5ca8" />

        {/* Country label */}
        <text
          x={cx}
          y={cy - 24}
          textAnchor="middle"
          fill="white"
          fontSize={14}
          fontWeight={700}
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
        >
          {country}
        </text>
      </svg>
    </div>
  );
}
