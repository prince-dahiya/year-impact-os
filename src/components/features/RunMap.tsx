import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RunMapProps {
  route: [number, number][];
  height?: string;
  isLive?: boolean;
  heading?: number | null;
}

function createArrowIcon(heading: number) {
  const rotation = heading || 0;
  return L.divIcon({
    className: 'direction-arrow-icon',
    html: `<div style="
      width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        width: 32px; height: 32px; border-radius: 50%;
        background: radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.08) 70%, transparent 100%);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          width: 16px; height: 16px; background: #3b82f6; border-radius: 50%;
          border: 3px solid #fff; box-shadow: 0 0 8px rgba(59,130,246,0.6);
        "></div>
      </div>
      <div style="
        position: absolute; top: -6px; left: 50%; transform: translateX(-50%) rotate(${rotation}deg);
        width: 0; height: 0;
        border-left: 6px solid transparent; border-right: 6px solid transparent;
        border-bottom: 12px solid #3b82f6;
        filter: drop-shadow(0 0 2px rgba(59,130,246,0.5));
      "></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function createPulseIcon() {
  return L.divIcon({
    className: 'pulse-marker-icon',
    html: `<div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute; width: 36px; height: 36px; border-radius: 50%;
        background: rgba(59,130,246,0.15);
        animation: pulse-ring 1.5s ease-out infinite;
      "></div>
      <div style="
        width: 16px; height: 16px; background: #3b82f6; border-radius: 50%;
        border: 3px solid #fff; box-shadow: 0 0 8px rgba(59,130,246,0.6);
        position: relative; z-index: 2;
      "></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export function RunMap({ route, height = '200px', isLive = false, heading = null }: RunMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const liveMarkerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // For live mode, show map even with just 1 point
    if (isLive && route.length === 0) return;
    if (!isLive && route.length < 2) return;

    // If live and map already exists, just update
    if (isLive && mapInstanceRef.current) {
      const latLngs = route.map(([lat, lng]) => L.latLng(lat, lng));
      const lastPoint = latLngs[latLngs.length - 1];

      // Update or create polyline
      if (latLngs.length >= 2) {
        if (polylineRef.current) {
          polylineRef.current.setLatLngs(latLngs);
        } else {
          polylineRef.current = L.polyline(latLngs, {
            color: 'hsl(155, 100%, 45%)',
            weight: 4,
            opacity: 0.9,
            smoothFactor: 0,
          }).addTo(mapInstanceRef.current);

          // Add start marker
          if (!startMarkerRef.current) {
            startMarkerRef.current = L.circleMarker(latLngs[0], {
              radius: 6,
              fillColor: 'hsl(155, 100%, 45%)',
              color: '#fff',
              weight: 2,
              fillOpacity: 1,
            }).addTo(mapInstanceRef.current);
          }
        }
      }

      // Update live position marker with direction arrow
      if (liveMarkerRef.current) {
        liveMarkerRef.current.setLatLng(lastPoint);
        if (heading !== null) {
          liveMarkerRef.current.setIcon(createArrowIcon(heading));
        }
      } else {
        liveMarkerRef.current = L.marker(lastPoint, {
          icon: heading !== null ? createArrowIcon(heading) : createPulseIcon(),
          zIndexOffset: 1000,
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
      startMarkerRef.current = null;
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

    if (isLive) {
      const lastPoint = latLngs[latLngs.length - 1];

      if (latLngs.length >= 2) {
        // Draw route polyline
        polylineRef.current = L.polyline(latLngs, {
          color: 'hsl(155, 100%, 45%)',
          weight: 4,
          opacity: 0.9,
          smoothFactor: 0,
        }).addTo(map);

        // Start marker
        startMarkerRef.current = L.circleMarker(latLngs[0], {
          radius: 6,
          fillColor: 'hsl(155, 100%, 45%)',
          color: '#fff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map);
      }

      // Live position marker with direction
      liveMarkerRef.current = L.marker(lastPoint, {
        icon: heading !== null ? createArrowIcon(heading) : createPulseIcon(),
        zIndexOffset: 1000,
      }).addTo(map);

      map.setView(lastPoint, 17);
    } else {
      // Static route display
      const polyline = L.polyline(latLngs, {
        color: 'hsl(155, 100%, 45%)',
        weight: 4,
        opacity: 0.9,
        smoothFactor: 0,
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

      // End marker
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
        startMarkerRef.current = null;
      }
    };
  }, [route, isLive, heading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add pulse animation CSS
  useEffect(() => {
    const styleId = 'run-map-pulse-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        .direction-arrow-icon, .pulse-marker-icon {
          background: transparent !important;
          border: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!isLive && route.length < 2) {
    return (
      <div
        className="rounded-xl bg-secondary/40 flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        No route data available
      </div>
    );
  }

  if (isLive && route.length === 0) {
    return (
      <div
        className="rounded-xl bg-secondary/40 flex items-center justify-center text-xs text-muted-foreground gap-2"
        style={{ height }}
      >
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Acquiring GPS position...
      </div>
    );
  }

  return <div ref={mapRef} className="rounded-xl overflow-hidden" style={{ height }} />;
}
