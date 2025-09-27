// pages/search.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Label } from '@/components/Label'; // ✅ named import

type Report = {
  id: string;
  type: string;
  date: string;
  summary?: string;
  site?: string;
  aircraft?: string;
  operator?: string;
  fatalities?: number;
  injuries?: number;
  survivors?: number;
  origin?: string;
  destination?: string;
};

const PAGE_LIMIT = 10;

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const [mounted, setMounted] = useState(false);
  const query = mounted && typeof q === 'string' ? q.trim() : '';

  const [results, setResults] = useState<Report[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setOffset(0);
    setResults([]);
    setTotal(null);
  }, [query]);

  useEffect(() => {
    if (!mounted) return;
    const controller = new AbortController();
    async function fetchResults() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        params.set('limit', String(PAGE_LIMIT));
        params.set('offset', String(offset));

        const res = await fetch(`/api/reports?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = await res.json();
        setResults((prev) =>
          offset === 0 ? json.results : prev.concat(json.results)
        );
        setTotal(json.total);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message ?? 'Fetch error');
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
    return () => controller.abort();
  }, [query, offset, mounted]);

  const canLoadMore = total === null ? false : offset + PAGE_LIMIT < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Search results</h1>
        <p className="text-sm text-slate-600 mt-1">
          {!mounted ? (
            'Loading query…'
          ) : query ? (
            <>
              Showing results for <span className="font-medium">{query}</span>
            </>
          ) : (
            'Showing all reports'
          )}
        </p>
      </div>

      <main className="space-y-4">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Error: {error}
          </div>
        )}

        {loading && results.length === 0 && (
          <div className="rounded border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
            Loading…
          </div>
        )}

        {results.length === 0 && !loading && !error && (
          <div className="rounded border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
            No results
            {query ? (
              <>
                {' '}
                for <strong>{query}</strong>
              </>
            ) : (
              ''
            )}
            .
          </div>
        )}

        <div className="space-y-4">
          {results.map((r) => (
            <article
              key={r.id}
              className="rounded border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${getBadgeClass(r.type)}`}
                >
                  {r.type}
                </div>
                <span className="text-sm text-slate-500">{r.date}</span>
              </div>

              <p className="mt-2 text-xs text-slate-700 line-clamp-2">
                {r.summary}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 text-xs">
                <Label icon={Icon.site} label="Site" value={r.site} />
                <Label
                  icon={Icon.aircraft}
                  label="Aircraft"
                  value={r.aircraft}
                />
                <Label
                  icon={Icon.operator}
                  label="Operator"
                  value={r.operator}
                />
                <Label
                  icon={Icon.fatalities}
                  label="Fatalities"
                  value={r.fatalities}
                />
                <Label
                  icon={Icon.injuries}
                  label="Injuries"
                  value={r.injuries}
                />
                <Label
                  icon={Icon.survivors}
                  label="Survivors"
                  value={r.survivors}
                />
                <Label icon={Icon.origin} label="Origin" value={r.origin} />
                <Label
                  icon={Icon.destination}
                  label="Destination"
                  value={r.destination}
                />
              </div>

              <div className="mt-4 flex justify-end">
                <Link
                  href={`/reports/${r.id}`}
                  className="rounded bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100"
                >
                  Read
                </Link>
              </div>
            </article>
          ))}
        </div>

        {canLoadMore && (
          <div className="text-center">
            <button
              onClick={() => setOffset((o) => o + PAGE_LIMIT)}
              disabled={loading}
              className="rounded bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200"
            >
              {loading ? 'Loading…' : 'Show more'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function getBadgeClass(type?: string) {
  const lower = (type || '').toLowerCase();
  if (lower === 'accident') return 'bg-red-100 text-red-700';
  if (lower === 'serious incident') return 'bg-orange-100 text-orange-700';
  if (lower === 'disappearance') return 'bg-gray-200 text-gray-700';
  return 'bg-blue-100 text-blue-700';
}

const Icon = {
  site: (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24">
      <path
        d="M12 2C8 5 5 8 5 11c0 5 7 11 7 11s7-6 7-11c0-3-3-6-7-9z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  aircraft: (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24">
      <path
        d="M2 12h6l4-3 4 3h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 3v5M8 21l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  operator: (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24">
      <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 21c1.5-4 5-6 7-6s5.5 2 7 6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  fatalities: (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 4v8l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  injuries: (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24">
      <path d="M3 12h18M12 3v18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  survivors: (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 22a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  origin: (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24">
      <path
        d="M2 12h7l3 6 3-12 7 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  destination: (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24">
      <path
        d="M21 3l-6 18-3-6-6 3 15-15z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};
