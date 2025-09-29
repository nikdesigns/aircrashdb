// pages/search.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { formatDateDeterministic as fmtDate } from '@/utils/formatDate';

type ReportRow = {
  _id?: string;
  id?: string;
  slug?: string | null;
  title?: string | null;
  date?: string | null;
  summary?: string | null;
  thumbnail?: string | null;
  type?: string | null;
  operator?: string | null;
  site?: string | null;
  aircraft?: string | null;
  origin?: string | null;
  destination?: string | null;
  fatalities?: number | null;
  injuries?: number | null;
  survivors?: number | null;
  damage?: string | null;
};

function getBadgeClass(type?: string) {
  if (!type) return 'bg-slate-100 text-slate-700';
  switch (type.toLowerCase()) {
    case 'accident':
      return 'bg-rose-100 text-rose-700';
    case 'disappearance':
      return 'bg-violet-100 text-violet-700';
    case 'incident':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function SearchPage() {
  const router = useRouter();
  // Use only the nav-provided query param (no local search input rendered here)
  const qParam =
    typeof router.query.q === 'string' ? router.query.q.trim() : '';

  const [results, setResults] = useState<ReportRow[]>([]); // always array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(50);

  useEffect(() => {
    // If no query, clear results and don't fetch
    if (!qParam) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const encoded = encodeURIComponent(qParam);
        const res = await fetch(
          `/api/reports?search=${encoded}&limit=${limit}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Search failed: ${res.status}`);
        }
        const json = await res.json();
        if (!mounted) return;
        const list = Array.isArray(json.reports) ? json.reports : [];
        setResults(list);
      } catch (err: any) {
        if (!mounted) return;
        console.error('search error', err);
        setError(err?.message ?? 'Search failed');
        setResults([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [qParam, limit]);

  return (
    <>
      <Head>
        <title>Search — AirCrashDB</title>
      </Head>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Search results</h1>
          <p className="text-sm text-slate-500 mt-1">
            Results for: <span className="font-medium">{qParam || '—'}</span>
          </p>
        </header>

        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="text-sm text-slate-600">
            {loading
              ? 'Searching…'
              : error
                ? `Error: ${error}`
                : `Results: ${results.length}`}
          </div>

          {/* optional limit selector — remove if you don't want it */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Per page</label>
            <select
              value={String(limit)}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-md border px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* No results state */}
        {Array.isArray(results) &&
          results.length === 0 &&
          !loading &&
          !error && (
            <div className="rounded border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
              No results
              {qParam ? (
                <div className="mt-2">
                  No reports found matching “{qParam}”.
                </div>
              ) : (
                <div className="mt-2">
                  Use the search box in the navigation to search the archive.
                </div>
              )}
            </div>
          )}

        {/* Results list */}
        {Array.isArray(results) && results.length > 0 && (
          <div className="grid gap-4">
            {results.map((r) => {
              const id = r._id ?? r.id;
              const href = `/reports/${r.slug ?? id}`;
              return (
                <Link key={String(id)} href={href} className="block group">
                  <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
                    <div className="flex items-start gap-4">
                      <div className="w-28 h-20 flex-shrink-0 rounded overflow-hidden bg-slate-50">
                        {r.thumbnail ? (
                          <Image
                            src={r.thumbnail}
                            alt={r.title ?? 'thumbnail'}
                            width={560}
                            height={320}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-base font-semibold text-slate-900 truncate group-hover:underline">
                              {r.title ?? '—'}
                            </h3>

                            <p
                              className="mt-1 text-xs text-slate-500"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {r.summary ?? ''}
                            </p>
                          </div>

                          <div className="text-sm text-slate-500 whitespace-nowrap text-right">
                            <div>{r.date ? fmtDate(r.date) : '—'}</div>
                            <div
                              className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-semibold ${getBadgeClass(
                                r.type
                              )}`}
                            >
                              {r.type ?? '—'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 text-xs text-slate-700">
                          <div>
                            <div className="text-[10px] text-slate-400">
                              Site
                            </div>
                            <div className="text-xs font-medium text-slate-800 truncate">
                              {r.site ?? '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-slate-400">
                              Aircraft
                            </div>
                            <div className="text-xs font-medium text-slate-800 truncate">
                              {r.aircraft ?? '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-slate-400">
                              Operator
                            </div>
                            <div className="text-xs font-medium text-slate-800 truncate">
                              {r.operator ?? '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-slate-400">
                              Fatalities
                            </div>
                            <div className="text-xs font-medium text-slate-800">
                              {typeof r.fatalities === 'number'
                                ? r.fatalities
                                : '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-slate-400">
                              Injuries
                            </div>
                            <div className="text-xs font-medium text-slate-800">
                              {typeof r.injuries === 'number'
                                ? r.injuries
                                : '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-slate-400">
                              Survivors
                            </div>
                            <div className="text-xs font-medium text-slate-800">
                              {typeof r.survivors === 'number'
                                ? r.survivors
                                : '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-slate-400">
                              Origin
                            </div>
                            <div className="text-xs font-medium text-slate-800 truncate">
                              {r.origin ?? '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-slate-400">
                              Destination
                            </div>
                            <div className="text-xs font-medium text-slate-800 truncate">
                              {r.destination ?? '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-slate-400">
                              Damage
                            </div>
                            <div className="text-xs font-medium text-slate-800 truncate">
                              {r.damage ?? '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
