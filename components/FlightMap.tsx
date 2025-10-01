// components/FlightMap.tsx
import React, { useEffect, useRef } from 'react';

/**
 * Client-only Leaflet map to avoid react-leaflet peer dependency issues.
 * - Adds leaflet CSS dynamically if missing.
 * - Creates a simple map instance and draws marker(s) and polyline if path provided.
 *
 * Props:
 *  - crashSite?: { lat: number; lng: number }
 *  - path?: Array<{ lat: number; lng: number }>
 */
export default function FlightMap({
  crashSite,
  path,
}: {
  crashSite?: { lat: number; lng: number } | undefined;
  path?: { lat: number; lng: number }[] | undefined;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  useEffect(() => {
    // Ensure this runs only in browser
    if (typeof window === 'undefined') return;
    // Lazy load leaflet
    let mounted = true;
    (async () => {
      const L = await import('leaflet');
      leafletRef.current = L;

      // add css if missing
      const id = 'leaflet-css';
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      if (!mounted) return;
      if (!ref.current) return;

      try {
        // avoid recreating map
        if (!mapRef.current) {
          mapRef.current = L.map(ref.current, {
            center: [0, 0],
            zoom: 2,
            attributionControl: false,
            zoomControl: true,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(mapRef.current);
        }

        // clear overlays
        mapRef.current.eachLayer((layer: any) => {
          // preserve tile layer by checking for _url property
          if (!(layer && (layer as any)._url)) {
            try {
              mapRef.current.removeLayer(layer);
            } catch {}
          }
        });

        const points: [number, number][] = [];

        if (Array.isArray(path) && path.length > 0) {
          for (const p of path) {
            if (
              p &&
              typeof p.lat === 'number' &&
              Number.isFinite(p.lat) &&
              typeof p.lng === 'number' &&
              Number.isFinite(p.lng)
            ) {
              points.push([p.lat, p.lng]);
            }
          }
        }

        // If crashSite provided and not already in points, include it
        if (
          crashSite &&
          typeof crashSite.lat === 'number' &&
          Number.isFinite(crashSite.lat) &&
          typeof crashSite.lng === 'number' &&
          Number.isFinite(crashSite.lng)
        ) {
          // add marker
          const crashMarker = L.circleMarker([crashSite.lat, crashSite.lng], {
            radius: 6,
            color: '#e11d48',
            fillColor: '#fca5a5',
            weight: 2,
            fillOpacity: 1,
          }).addTo(mapRef.current);
          crashMarker.bindPopup('Crash site').openPopup();

          // if no points yet, center to crash
          if (points.length === 0) {
            points.push([crashSite.lat, crashSite.lng]);
          } else {
            // ensure crash is included if not
            const exists = points.some(
              (pt) => pt[0] === crashSite.lat && pt[1] === crashSite.lng
            );
            if (!exists) {
              // put crash site in middle if we already have route endpoints
              const mid = Math.floor(points.length / 2);
              points.splice(mid, 0, [crashSite.lat, crashSite.lng]);
            }
          }
        }

        // draw polyline if we have at least 2 points
        if (points.length >= 2) {
          const poly = L.polyline(points, {
            color: '#2563eb',
            weight: 3,
          }).addTo(mapRef.current);

          // add small markers for endpoints if present
          const first = points[0];
          const last = points[points.length - 1];
          L.marker(first).addTo(mapRef.current);
          L.marker(last).addTo(mapRef.current);

          // fit bounds
          const bounds = L.latLngBounds(points as any);
          mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        } else if (points.length === 1) {
          mapRef.current.setView(points[0], 8);
        } else {
          // default view
          mapRef.current.setView([0, 0], 2);
        }
      } catch (err) {
        // ignore map drawing errors
        // console.error('FlightMap init', err);
      }
    })();

    return () => {
      mounted = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    };
  }, [crashSite, path]);

  // simple placeholder server-side to keep layout
  return (
    <div className="w-full h-full rounded">
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
