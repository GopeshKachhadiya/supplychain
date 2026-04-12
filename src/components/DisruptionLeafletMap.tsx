'use client';

import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type RoutePoint = {
  name: string;
  coords: [number, number];
};

type DisruptionLeafletMapProps = {
  primaryRoute: RoutePoint[];
  reroutedRoute: RoutePoint[];
  primaryRoadCoords: [number, number][];
  reroutedRoadCoords: [number, number][];
};

/**
 * Inner component: auto-fits the map whenever road coords change.
 * Must live inside MapContainer so it can call useMap().
 */
function AutoFit({
  primaryRoadCoords,
  reroutedRoadCoords,
  primaryRoute,
  reroutedRoute,
}: {
  primaryRoadCoords: [number, number][];
  reroutedRoadCoords: [number, number][];
  primaryRoute: RoutePoint[];
  reroutedRoute: RoutePoint[];
}) {
  const map = useMap();

  useEffect(() => {
    // Prefer real road coords; fall back to waypoint coords
    const pts: [number, number][] = [
      ...(primaryRoadCoords.length > 1 ? primaryRoadCoords : primaryRoute.map((p) => p.coords)),
      ...(reroutedRoadCoords.length > 1 ? reroutedRoadCoords : reroutedRoute.map((p) => p.coords)),
    ];
    if (pts.length > 1) {
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [primaryRoadCoords, reroutedRoadCoords, primaryRoute, reroutedRoute, map]);

  return null;
}

export default function DisruptionLeafletMap({
  primaryRoute,
  reroutedRoute,
  primaryRoadCoords,
  reroutedRoadCoords,
}: DisruptionLeafletMapProps) {
  // Initial center — India centroid as safe fallback
  const center: [number, number] = primaryRoute[0]?.coords ?? [22.5937, 78.9629];

  // Use real road geometry if available, otherwise fall back to straight waypoints
  const primaryPositions: [number, number][] =
    primaryRoadCoords.length > 1
      ? primaryRoadCoords
      : primaryRoute.map((p) => p.coords);

  const reroutedPositions: [number, number][] =
    reroutedRoadCoords.length > 1
      ? reroutedRoadCoords
      : reroutedRoute.map((p) => p.coords);

  return (
    <MapContainer
      center={center}
      zoom={5}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Google Maps-style road tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-fit bounds whenever road coords update */}
      <AutoFit
        primaryRoadCoords={primaryRoadCoords}
        reroutedRoadCoords={reroutedRoadCoords}
        primaryRoute={primaryRoute}
        reroutedRoute={reroutedRoute}
      />

      {/* ── Blocked / Primary route — red dashed road path ── */}
      {primaryPositions.length > 1 && (
        <>
          {/* White underline for contrast (like Google Maps) */}
          <Polyline
            positions={primaryPositions}
            pathOptions={{ color: '#fff', weight: 7, opacity: 0.6 }}
          />
          <Polyline
            positions={primaryPositions}
            pathOptions={{ color: '#EF4444', dashArray: '12 8', weight: 4, opacity: 0.9 }}
          />
        </>
      )}

      {/* ── AI Recovery route — solid purple road path ── */}
      {reroutedPositions.length > 1 && (
        <>
          {/* White underline for contrast */}
          <Polyline
            positions={reroutedPositions}
            pathOptions={{ color: '#fff', weight: 9, opacity: 0.5 }}
          />
          <Polyline
            positions={reroutedPositions}
            pathOptions={{ color: '#7C3AED', weight: 5, opacity: 1 }}
          />
        </>
      )}

      {/* ── Primary route stop markers (blocked) ── */}
      {primaryRoute.map((point, index) => (
        <CircleMarker
          key={`primary-${index}`}
          center={point.coords}
          radius={7}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#EF4444', fillOpacity: 1 }}
        >
          <Popup>
            <div className="text-sm font-semibold text-[#2d3339]">
              🚫 {point.name}
              <div className="text-xs text-red-500 mt-1 font-normal">Blocked Route</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* ── AI Rerouted path markers ── */}
      {reroutedRoute.map((point, index) => {
        const isOrigin = index === 0;
        const isDestination = index === reroutedRoute.length - 1;
        return (
          <CircleMarker
            key={`rerouted-${index}`}
            center={point.coords}
            radius={isOrigin || isDestination ? 11 : 8}
            pathOptions={{
              color: '#fff',
              weight: 2.5,
              fillColor: isOrigin ? '#C084FC' : isDestination ? '#4C1D95' : '#7C3AED',
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="text-sm font-semibold text-[#2d3339]">
                {isOrigin ? '🟣 Origin: ' : isDestination ? '🏁 Destination: ' : '📍 Via: '}
                {point.name}
                <div className="text-xs text-purple-600 mt-1 font-normal">AI Recovery Route</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
