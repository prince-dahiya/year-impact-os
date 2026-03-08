import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RunMapProps {
  route: [number, number][];
  height?: string;
}

export function RunMap({ route, height = '200px' }: RunMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || route.length < 2) return;

    // Clean up previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const latLngs = route.map(([lat, lng]) => L.latLng(lat, lng));

    // Draw route polyline
    const polyline = L.polyline(latLngs, {
      color: 'hsl(155, 100%, 45%)',
      weight: 4,
      opacity: 0.9,
      smoothFactor: 1,
    }).addTo(map);

    // Start marker
    L.circleMarker(latLngs[0], {
      radius: 6,
      fillColor: 'hsl(155, 100%, 45%)',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map);

    // End marker
    L.circleMarker(latLngs[latLngs.length - 1], {
      radius: 6,
      fillColor: 'hsl(0, 72%, 51%)',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [20, 20] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [route]);

  if (route.length < 2) {
    return (
      <div
        className="rounded-xl bg-secondary/40 flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        No route data available
      </div>
    );
  }

  return <div ref={mapRef} className="rounded-xl overflow-hidden" style={{ height }} />;
}
