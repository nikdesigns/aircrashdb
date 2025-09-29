// components/Lightbox.tsx
import React, { useEffect } from 'react';

type Img = { url?: string | null; caption?: string; credit?: string };

export default function Lightbox({
  images,
  startIndex = 0,
  onClose,
}: {
  images: Img[];
  startIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = React.useState(startIndex || 0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight')
        setIndex((i) => Math.min(images.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  if (!images || !images.length) return null;

  const img = images[index] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-w-5xl w-full rounded bg-black">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white bg-black/40 rounded px-3 py-1"
          >
            Close
          </button>
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded px-3 py-1"
          >
            ‹
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded px-3 py-1"
          >
            ›
          </button>

          <div className="flex items-center justify-center min-h-[60vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url ?? ''}
              alt={img.caption ?? ''}
              className="max-h-[80vh] object-contain mx-auto"
            />
          </div>

          {(img.caption || img.credit) && (
            <div className="p-3 text-sm text-white bg-black/60">
              <div>{img.caption}</div>
              {img.credit && (
                <div className="text-xs text-slate-300 mt-1">
                  Credit: {img.credit}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
