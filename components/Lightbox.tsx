// components/Lightbox.tsx
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';

type ImgItem = string | { url: string; caption?: string };

type Props = {
  images: ImgItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(index, images.length - 1))
  );
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // normalize item -> { url, caption }
  const getItem = (i: number) => {
    const it = images[Math.max(0, Math.min(i, images.length - 1))];
    if (typeof it === 'string') return { url: it, caption: undefined };
    return { url: it.url, caption: it.caption };
  };

  useEffect(() => {
    setCurrentIndex(Math.max(0, Math.min(index, images.length - 1)));
    setIsLoaded(false);
  }, [index, images]);

  // key handlers + manage scroll lock + focus trap
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    }
    document.addEventListener('keydown', onKey);
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // focus trap: focus first focusable element in modal after mount
    setTimeout(() => {
      modalRef.current
        ?.querySelector<HTMLElement>(
          'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
        )
        ?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      // restore focus
      try {
        previouslyFocused.current?.focus();
      } catch {}
    };
  }, []); // mount only

  // focus trap handler
  useEffect(() => {
    function onFocus(e: FocusEvent) {
      if (!modalRef.current) return;
      if (modalRef.current.contains(e.target as Node)) return;
      // redirect focus back to modal
      e.preventDefault();
      modalRef.current
        .querySelector<HTMLElement>(
          'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
        )
        ?.focus();
    }
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, []);

  const item = getItem(currentIndex);
  const src = item?.url ?? '';

  function handlePrev() {
    const nextIndex = currentIndex <= 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(nextIndex);
    setIsLoaded(false);
    onPrev?.();
    emitOpenAnalytics(nextIndex);
  }
  function handleNext() {
    const nextIndex = currentIndex >= images.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(nextIndex);
    setIsLoaded(false);
    onNext?.();
    emitOpenAnalytics(nextIndex);
  }

  function emitOpenAnalytics(idx: number) {
    const payload = { index: idx, url: getItem(idx).url, ts: Date.now() };
    // app-level hook (optional)
    try {
      (window as any).__aircrash_analytics?.(payload);
    } catch (err) {
      console.debug('analytics hook error', err);
    }
    // custom event for other listeners
    window.dispatchEvent(
      new CustomEvent('aircrash:imageOpen', { detail: payload })
    );
    console.debug('[aircrash] imageOpen', payload);
  }

  // download helper
  async function downloadCurrent() {
    try {
      const url = src;
      // open in new tab which triggers browser download options, or fetch blob to force download
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('download failed', err);
    }
  }

  async function copyCurrentUrl() {
    try {
      await navigator.clipboard.writeText(src);
      // small visual feedback (could be replaced with toast)
      console.debug('copied to clipboard', src);
    } catch (err) {
      console.error('copy failed', err);
    }
  }

  // If document not ready, do not render (server-side safety)
  if (typeof window === 'undefined') return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer: ${currentIndex + 1} of ${images.length}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[1200px] max-h-[90vh] rounded outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          aria-label="Close lightbox"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 rounded-full bg-white/90 p-2 text-slate-800 shadow"
        >
          ✕
        </button>

        {/* Prev */}
        <button
          aria-label="Previous image"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-3 top-1/2 z-40 hidden sm:inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-slate-800 shadow"
        >
          ‹
        </button>

        {/* Next */}
        <button
          aria-label="Next image"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-3 top-1/2 z-40 hidden sm:inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-slate-800 shadow"
        >
          ›
        </button>

        {/* Image container - explicit size so next/image fill works */}
        <div
          className="w-full mx-auto bg-black/0 rounded overflow-hidden flex items-center justify-center"
          style={{ height: '80vh', position: 'relative' }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <svg
                className="animate-spin h-10 w-10 text-white/90"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
            </div>
          )}

          {/* main optimized image */}
          <Image
            src={src}
            alt={item.caption ?? `Image ${currentIndex + 1}`}
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 1200px) 100vw, 1200px"
            priority
            onLoadingComplete={() => setIsLoaded(true)}
            onError={(e) => {
              console.error('[Lightbox] next/image error', e);
              setIsLoaded(true); // remove spinner; fallback <img> would be used via onError in dev
            }}
          />
        </div>

        {/* caption + footer */}
        <div className="mt-3 flex flex-col gap-2 text-sm text-slate-200">
          {item.caption && (
            <div className="text-center text-white/90">{item.caption}</div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60">
              {currentIndex + 1} / {images.length}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadCurrent();
                }}
                className="rounded bg-white/10 px-3 py-1 text-sm text-white/90 hover:bg-white/20"
                aria-label="Download image"
              >
                Download
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyCurrentUrl();
                }}
                className="rounded bg-white/10 px-3 py-1 text-sm text-white/90 hover:bg-white/20"
                aria-label="Copy image URL"
              >
                Copy link
              </button>

              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-white/10 px-3 py-1 text-sm text-white/90 hover:bg-white/20"
              >
                Open original
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
