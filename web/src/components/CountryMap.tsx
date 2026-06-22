import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { geoBounds, geoCentroid, geoMercator } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldData from "world-atlas/countries-110m.json";
import { ISO2_TO_NUMERIC } from "../lib/isoNumeric";

interface CountryProps {
  name: string;
}

const WIDTH = 440;
const HEIGHT = 300;
// At this scale a geoMercator map spans ~2π·scale ≈ WIDTH pixels of longitude,
// so the un-zoomed world roughly fills the viewport. We reuse the same numbers
// to estimate how much to zoom for a given country below.
const SCALE = 70;
// Show the country surrounded by a generous margin of its neighbours.
const PADDING = 3;

const GEO = feature(
  worldData,
  worldData.objects.countries as GeometryCollection<CountryProps>,
) as FeatureCollection<Geometry, CountryProps>;

function fitFor(target: Feature<Geometry, CountryProps>): {
  center: [number, number];
  zoom: number;
} {
  const center = geoCentroid(target) as [number, number];
  const [[west, south], [east, north]] = geoBounds(target);
  const lonSpan = east - west;
  const latSpan = north - south;

  let zoom: number;
  if (lonSpan <= 0 || lonSpan > 170 || latSpan > 90) {
    // Antimeridian-spanning or continent-sized country (e.g. Russia): a modest
    // fixed zoom keeps the whole landmass on screen.
    zoom = 1.6;
  } else {
    const proj = geoMercator().scale(SCALE).translate([WIDTH / 2, HEIGHT / 2]);
    const topLeft = proj([west, north]);
    const bottomRight = proj([east, south]);
    if (!topLeft || !bottomRight) {
      zoom = 2;
    } else {
      const pxW = Math.max(Math.abs(bottomRight[0] - topLeft[0]), 1);
      const pxH = Math.max(Math.abs(bottomRight[1] - topLeft[1]), 1);
      zoom = Math.min(WIDTH / (pxW * PADDING), HEIGHT / (pxH * PADDING));
    }
  }
  return { center, zoom: Math.max(1.4, Math.min(zoom, 16)) };
}

/** True when the country has a polygon in the 110m dataset (microstates don't). */
export function hasCountryGeometry(code: string | null): boolean {
  if (!code) return false;
  const numeric = ISO2_TO_NUMERIC[code.toUpperCase()];
  return !!numeric && GEO.features.some((f) => String(f.id) === numeric);
}

export function CountryMap({
  code,
  country,
}: {
  code: string | null;
  country: string;
}) {
  const numeric = code ? ISO2_TO_NUMERIC[code.toUpperCase()] : undefined;
  const target = useMemo(
    () => (numeric ? GEO.features.find((f) => String(f.id) === numeric) : undefined),
    [numeric],
  );
  const fit = useMemo(() => (target ? fitFor(target) : null), [target]);

  if (!numeric || !target || !fit) return null;

  return (
    <figure className="country-map" aria-label={`Map highlighting ${country}`}>
      <ComposableMap
        projection="geoMercator"
        width={WIDTH}
        height={HEIGHT}
        projectionConfig={{ scale: SCALE }}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup
          center={fit.center}
          zoom={fit.zoom}
          minZoom={1}
          maxZoom={16}
          disableZooming
        >
          <Geographies geography={GEO}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isTarget = String(geo.id) === numeric;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isTarget ? "var(--accent)" : "#241f4d"}
                    stroke="#0d0b1a"
                    strokeWidth={0.6 / fit.zoom}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        fill: isTarget ? "var(--accent)" : "#2e2858",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
          <Marker coordinates={fit.center}>
            <circle
              r={3.6 / fit.zoom}
              fill="var(--accent-2)"
              stroke="#fff"
              strokeWidth={1 / fit.zoom}
            />
          </Marker>
        </ZoomableGroup>
      </ComposableMap>
    </figure>
  );
}
