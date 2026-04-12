'use client';

import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';

type RoutePoint = {
  name: string;
  coords: [number, number];
};

type DisruptionLeafletMapProps = {
  primaryRoute: RoutePoint[];
  reroutedRoute: RoutePoint[];
};

export default function DisruptionLeafletMap({
  primaryRoute,
  reroutedRoute,
}: DisruptionLeafletMapProps) {
  const fallbackCenter: [number, number] = reroutedRoute[0]?.coords ?? [22.5937, 78.9629];

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={5}
      scrollWheelZoom={false}
      className="h-full w-full rounded-[1.5rem]"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {primaryRoute.length > 1 && (
        <Polyline
          positions={primaryRoute.map((point) => point.coords)}
          pathOptions={{ color: '#EF4444', dashArray: '8 8', weight: 4, opacity: 0.7 }}
        />
      )}

      {reroutedRoute.length > 1 && (
        <Polyline
          positions={reroutedRoute.map((point) => point.coords)}
          pathOptions={{ color: '#7C3AED', weight: 5, opacity: 0.9 }}
        />
      )}

      {reroutedRoute.map((point, index) => (
        <CircleMarker
          key={`${point.name}-${index}`}
          center={point.coords}
          radius={8}
          pathOptions={{
            color: '#F5F3FF',
            weight: 2,
            fillColor: index === 0 ? '#C084FC' : '#7C3AED',
            fillOpacity: 1,
          }}
        >
          <Popup>
            <div className="text-sm font-semibold text-[#2d3339]">{point.name}</div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
