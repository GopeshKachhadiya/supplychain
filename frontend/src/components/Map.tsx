'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet + React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  pathCoords: [number, number][];
  roadCoords: [number, number][];
  warehouses: {[key: string]: {name: string, coords: [number, number]}};
  route: string[];
}

function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function Map({ pathCoords, roadCoords, warehouses, route }: MapProps) {
  const bounds = L.latLngBounds(pathCoords.length > 0 ? pathCoords : [[20.5937, 78.9629]]);
  
  return (
    <MapContainer 
      center={[22.5, 78.5]} 
      zoom={5} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; Google Maps'
        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
      />
      
      {roadCoords.length > 0 && (
        <Polyline 
          positions={roadCoords} 
          pathOptions={{ color: '#4285F4', weight: 5, opacity: 0.8 }} 
        />
      )}

      {route.map((whId, idx) => {
        const wh = warehouses[whId];
        if (!wh) return null;
        
        const isStart = idx === 0;
        const isEnd = idx === route.length - 1 && route.length > 1;

        return (
          <Marker 
            key={`${whId}-${idx}`} 
            position={wh.coords}
          >
            <Popup>
              <strong>{isStart ? 'START: ' : isEnd ? 'END: ' : `Stop ${idx}: `}{whId}</strong>
              <br />{wh.name}
            </Popup>
          </Marker>
        );
      })}

      {pathCoords.length > 0 && <ChangeView bounds={bounds} />}
    </MapContainer>
  );
}
