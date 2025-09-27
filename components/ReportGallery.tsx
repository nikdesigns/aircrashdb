// components/ReportGallery.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import Lightbox from './Lightbox';

type ImgItem = string | { url: string; caption?: string };

function tinySvgDataUrl(w = 16, h = 12, color = '#ddd') {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><rect width='100%' height='100%' fill='${color}' /></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export default function ReportGallery({ images }: { images: ImgItem[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) return null;

  // normalize array to objects
  const normalized: { url: string; caption?: string }[] = images.map((it) =>
    typeof it === 'string' ? { url: it } : it
  );

  const visible = normalized.slice(0, 6);

  function openAt(i: number) {
    const safe = Math.max(0, Math.min(i, normalized.length - 1));
    const payload = { index: safe, url: normalized[safe]?.url, ts: Date.now() };
    // analytics hook
    try {
      (window as any).__aircrash_analytics?.(payload);
    } catch {}
    window.dispatchEvent(
      new CustomEvent('aircrash:imageOpen', { detail: payload })
    );
    console.debug('[ReportGallery] openAt', payload);

    setIndex(safe);
    setOpen(true);
  }

  function onPrev() {
    setIndex((i) => (i <= 0 ? normalized.length - 1 : i - 1));
  }

  function onNext() {
    setIndex((i) => (i >= normalized.length - 1 ? 0 : i + 1));
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visible.map((it, i) => (
          <button
            key={it.url + i}
            onClick={() => openAt(i)}
            className="block rounded overflow-hidden bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label={`Open image ${i + 1}`}
          >
            <div className="relative w-full h-40">
              <Image
                src={it.url}
                alt={it.caption ?? `Image ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                placeholder="blur"
                blurDataURL={tinySvgDataUrl(16, 10)}
              />
            </div>
          </button>
        ))}
        {normalized.length > visible.length && (
          <button
            onClick={() => openAt(visible.length)}
            className="flex items-center justify-center rounded border-2 border-dashed border-slate-200 p-3 text-sm text-slate-500"
          >
            +{normalized.length - visible.length} more
          </button>
        )}
      </div>

      {open && (
        <Lightbox
          images={normalized}
          index={index}
          onClose={() => setOpen(false)}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </>
  );
}
