// components/ReportActions.tsx
import React, { useEffect, useState } from 'react';

export default function ReportActions({
  id,
  title,
  url,
}: {
  id: string;
  title?: string | null;
  url?: string;
}) {
  const bookmarkKey = `acdb:bookmark:${id}`;
  const likesKey = `acdb:likes:${id}`;

  // Server-safe initial states (do NOT read localStorage here)
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [likes, setLikes] = useState<number>(0);

  // mounted flag (useful if you want to render client-only UI)
  const [mounted, setMounted] = useState(false);

  // Read localStorage only after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window !== 'undefined') {
        const b = Boolean(localStorage.getItem(bookmarkKey));
        setBookmarked(b);
        const n = Number(localStorage.getItem(likesKey)) || 0;
        setLikes(n);
      }
    } catch (err) {
      // ignore
      console.error('ReportActions localStorage read error', err);
    }
    // listen to storage events to sync across tabs
    function onStorage(e: StorageEvent) {
      if (e.key === bookmarkKey) {
        try {
          setBookmarked(Boolean(localStorage.getItem(bookmarkKey)));
        } catch {}
      }
      if (e.key === likesKey) {
        try {
          setLikes(Number(localStorage.getItem(likesKey)) || 0);
        } catch {}
      }
    }
    if (typeof window !== 'undefined')
      window.addEventListener('storage', onStorage);
    return () => {
      if (typeof window !== 'undefined')
        window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function toggleBookmark() {
    try {
      if (typeof window === 'undefined') return;
      if (bookmarked) {
        localStorage.removeItem(bookmarkKey);
        setBookmarked(false);
      } else {
        localStorage.setItem(
          bookmarkKey,
          JSON.stringify({ id, title, url, createdAt: Date.now() })
        );
        setBookmarked(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function addLike() {
    try {
      if (typeof window === 'undefined') return;
      const n = (Number(localStorage.getItem(likesKey)) || 0) + 1;
      localStorage.setItem(likesKey, String(n));
      setLikes(n);
    } catch (err) {
      console.error(err);
    }
  }

  async function copyCitation() {
    const citation = `${title || 'Report'} — ${url || (typeof window !== 'undefined' ? window.location.href : '')}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(citation);
        // non-blocking toast
        const el = document.createElement('div');
        el.textContent = 'Citation copied';
        el.className =
          'fixed bottom-6 right-6 rounded bg-slate-900 text-white px-3 py-2 text-sm shadow';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1800);
      } else {
        // fallback alert
        alert('Citation copied to clipboard (fallback).');
      }
    } catch {
      alert('Copied');
    }
  }

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <button
        onClick={toggleBookmark}
        className={`rounded px-3 py-1 text-sm ${bookmarked ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}
        aria-pressed={bookmarked}
      >
        {bookmarked ? 'Bookmarked' : 'Bookmark'}
      </button>

      <button
        onClick={addLike}
        className="rounded px-3 py-1 text-sm bg-slate-50"
        aria-label="Like report"
      >
        👍 Like{' '}
        {/* render likes (initially 0 on server; updated on client after mount) */}
        <span className="ml-2 text-slate-600 text-sm">({likes})</span>
      </button>

      <button
        onClick={copyCitation}
        className="rounded px-3 py-1 text-sm bg-slate-50"
      >
        Copy citation
      </button>

      <button
        onClick={() => {
          if (typeof navigator !== 'undefined' && (navigator as any).share) {
            (navigator as any)
              .share({
                title: title || 'Report',
                url:
                  url ||
                  (typeof window !== 'undefined' ? window.location.href : ''),
              })
              .catch(() => {});
          } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard
              .writeText(
                url ||
                  (typeof window !== 'undefined' ? window.location.href : '')
              )
              .then(() => {
                const el = document.createElement('div');
                el.textContent = 'URL copied';
                el.className =
                  'fixed bottom-6 right-6 rounded bg-slate-900 text-white px-3 py-2 text-sm shadow';
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 1400);
              });
          } else {
            alert('Share not supported');
          }
        }}
        className="rounded px-3 py-1 text-sm bg-slate-50"
      >
        Share
      </button>
    </div>
  );
}
