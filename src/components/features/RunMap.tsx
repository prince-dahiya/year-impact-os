import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RunMapProps {
  route: [number, number][];
  height?: string;
  isLive?: boolean;
}

export function RunMap({ route, height = '200px', isLive = false }: RunMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const liveMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!mapRef.current || route.length < 2) return;

    // If live and map already exists, just update
    if (isLive && mapInstanceRef.current && polylineRef.current) {
      const latLngs = route.map(([lat, lng]) => L.latLng(lat, lng));
      polylineRef.current.setLatLngs(latLngs);

      const lastPoint = latLngs[latLngs.length - 1];
      if (liveMarkerRef.current) {
        liveMarkerRef.current.setLatLng(lastPoint);
      } else {
        liveMarkerRef.current = L.circleMarker(lastPoint, {
          radius: 8,
          fillColor: '#3b82f6',
          color: '#fff',
          weight: 3,
          fillOpacity: 1,
          className: 'live-pulse',
        }).addTo(mapInstanceRef.current);
      }

      mapInstanceRef.current.panTo(lastPoint, { animate: true, duration: 0.5 });
      return;
    }

    // Clean up previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      polylineRef.current = null;
      liveMarkerRef.current = null;
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
    polylineRef.current = polyline;

    // Start marker
    L.circleMarker(latLngs[0], {
      radius: 6,
      fillColor: 'hsl(155, 100%, 45%)',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map);

    if (isLive) {
      // Live position marker (pulsing blue dot)
      const lastPoint = latLngs[latLngs.length - 1];
      liveMarkerRef.current = L.circleMarker(lastPoint, {
        radius: 8,
        fillColor: '#3b82f6',
        color: '#fff',
        weight: 3,
        fillOpacity: 1,
      }).addTo(map);
      map.setView(lastPoint, 16);
    } else {
      // End marker for completed runs
      L.circleMarker(latLngs[latLngs.length - 1], {
        radius: 6,
        fillColor: 'hsl(0, 72%, 51%)',
        color: '#fff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    }

    return () => {
      if (!isLive && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        polylineRef.current = null;
        liveMarkerRef.current = null;
      }
    };
  }, [route, isLive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (route.length < 2) {
    return (
      <div
        className="rounded-xl bg-secondary/40 flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        {isLive ? 'Waiting for GPS signal...' : 'No route data available'}
      </div>
    );
  }

  return <div ref={mapRef} className="rounded-xl overflow-hidden" style={{ height }} />;
}
