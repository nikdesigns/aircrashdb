// components/FlightMap.tsx
import React, { useMemo } from 'react';

type LatLng = { lat: number; lng: number };

export default function FlightMap({
  crashSite,
  path,
  className = '',
}: {
  crashSite?: LatLng | undefined;
  path?: LatLng[] | undefined;
  className?: string;
}) {
  // Clean up coords
  const coords = (path ?? []).filter(
    (p) =>
      p &&
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng) &&
      !Number.isNaN(p.lat) &&
      !Number.isNaN(p.lng)
  );

  const crash =
    crashSite &&
    Number.isFinite(crashSite.lat) &&
    Number.isFinite(crashSite.lng)
      ? crashSite
      : undefined;

  const bbox = useMemo(() => {
    const all = [...coords];
    if (crash) all.push(crash);
    if (!all.length) return null;
    const lats = all.map((c) => c.lat);
    const lngs = all.map((c) => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    // pad so markers aren’t on the edge
    const pad = 0.3;
    return {
      minLat: minLat - pad,
      maxLat: maxLat + pad,
      minLng: minLng - pad,
      maxLng: maxLng + pad,
    };
  }, [coords, crash]);

  if (!bbox) {
    return (
      <div className="rounded border border-slate-100 bg-slate-50 flex items-center justify-center text-sm text-slate-500 p-4">
        No location data available
      </div>
    );
  }

  const marker = crash ? `&marker=${crash.lat},${crash.lng}` : '';
  const iframeUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}&layer=mapnik${marker}`;

  return (
    <div className={`w-full h-full ${className}`}>
      <iframe
        src={iframeUrl}
        className="w-full h-full border-0 rounded"
        title="Flight map"
      />
    </div>
  );
}
