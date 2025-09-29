// pages/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { dbConnect } from '@/lib/mongodb';
import ReportModel from '@/models/Report';
import HeroStats from '@/components/HeroStats';
import { formatDateDeterministic as fmtDate } from '@/utils/formatDate';

type Report = {
  id: string;
  slug?: string | null;
  title?: string | null;
  type?: string | null;
  date?: string | null; // ISO string
  summary?: string | null;
  site?: string | null;
  aircraft?: string | null;
  operator?: string | null;
  fatalities?: number | null;
  injuries?: number | null;
  survivors?: number | null;
  origin?: string | null;
  destination?: string | null;
  thumbnail?: string | null;
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

/* CompactCard */
function CompactCard({ r }: { r: Report }) {
  const href = `/reports/${r.slug ?? r.id}`;
  return (
    <Link
      href={href}
      className="block group"
      aria-label={`Open report ${r.title ?? ''}`}
    >
      <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-lg transition-shadow duration-200">
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

                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {r.summary ?? ''}
                </p>
              </div>

              <div className="text-sm text-slate-500 whitespace-nowrap text-right">
                <div>{fmtDate(r.date)}</div>
                <div
                  className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-semibold ${getBadgeClass(r.type)}`}
                >
                  {r.type ?? '—'}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 text-xs text-slate-700">
              <div>
                <div className="text-[10px] text-slate-400">Site</div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {r.site ?? '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Aircraft</div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {r.aircraft ?? '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Operator</div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {r.operator ?? '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Fatalities</div>
                <div className="text-xs font-medium text-slate-800">
                  {r.fatalities ?? '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Injuries</div>
                <div className="text-xs font-medium text-slate-800">
                  {r.injuries ?? '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Survivors</div>
                <div className="text-xs font-medium text-slate-800">
                  {r.survivors ?? '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Origin</div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {r.origin ?? '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Destination</div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {r.destination ?? '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Damage</div>
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
}

/* Icons */
function IconSearch({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
function IconClose({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function IconFilter({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 3H2l8.5 9.5V21l3-1.5V12.5L22 3z" />
    </svg>
  );
}

/* Page */
export default function HomePage({
  initialReports,
}: {
  initialReports: Report[];
}) {
  // state
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('');
  const [operator, setOperator] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [limit, setLimit] = useState<number>(50);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // debounce key
  const debouncedMs = 350;
  const fetchKey = useMemo(
    () => ({ search, type, operator, dateFrom, dateTo, limit }),
    [search, type, operator, dateFrom, dateTo, limit]
  );

  useEffect(() => {
    // if default, use initial reports
    const isDefault =
      !search && !type && !operator && !dateFrom && !dateTo && limit === 50;
    if (isDefault) {
      setReports(initialReports);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: any = null;
    let controller: AbortController | null = null;

    setLoading(true);
    setError(null);

    timer = setTimeout(async () => {
      try {
        controller = new AbortController();
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (type) params.set('type', type);
        if (operator) params.set('operator', operator);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (limit) params.set('limit', String(limit));

        const res = await fetch(`/api/reports?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Failed to load: ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;
        const docs = Array.isArray(json.reports) ? json.reports : [];
        const normalized: Report[] = docs.map((d: any) => ({
          id: d._id?.toString?.() ?? d.id ?? '',
          slug: d.slug ?? null,
          title: d.title ?? null,
          type: d.type ?? null,
          date: d.date ? new Date(d.date).toISOString() : null,
          summary: d.summary ?? null,
          site: d.site ?? null,
          aircraft: d.aircraft ?? null,
          operator: d.operator ?? null,
          fatalities:
            typeof d.fatalities !== 'undefined' && d.fatalities !== null
              ? d.fatalities
              : null,
          injuries:
            typeof d.injuries !== 'undefined' && d.injuries !== null
              ? d.injuries
              : null,
          survivors:
            typeof d.survivors !== 'undefined' && d.survivors !== null
              ? d.survivors
              : null,
          origin: d.origin ?? null,
          destination: d.destination ?? null,
          thumbnail: d.thumbnail ?? null,
          damage: d.damage ?? null,
        }));
        setReports(normalized);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Filter fetch error', err);
        if (!cancelled) setError(err?.message ?? 'Failed to fetch');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, debouncedMs);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (controller) controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  function resetFilters() {
    setSearch('');
    setType('');
    setOperator('');
    setDateFrom('');
    setDateTo('');
    setLimit(50);
    setReports(initialReports);
    setError(null);
  }

  const activeFilters = useMemo(() => {
    const items: { key: string; label: string }[] = [];
    if (search) items.push({ key: 'search', label: `Search: "${search}"` });
    if (type) items.push({ key: 'type', label: type });
    if (operator) items.push({ key: 'operator', label: operator });
    if (dateFrom) items.push({ key: 'from', label: `From ${dateFrom}` });
    if (dateTo) items.push({ key: 'to', label: `To ${dateTo}` });
    return items;
  }, [search, type, operator, dateFrom, dateTo]);

  return (
    <>
      <Head>
        <title>AirCrashDB — Archive of air crash investigation reports</title>
        <meta
          name="description"
          content="AirCrashDB — a searchable archive of air crash investigation reports, incidents and summaries."
        />
      </Head>

      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            AirCrashDB
          </h1>
          <p className="mt-2 text-slate-600 max-w-prose">
            A free archive of air crash investigation reports.
          </p>
        </header>

        <div className="mb-6">
          <HeroStats />
        </div>

        {/* Sleek filter card */}
        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 shadow-inner w-full">
                <div className="text-slate-400 mr-3">
                  <IconSearch />
                </div>
                <input
                  className="bg-transparent outline-none w-full text-sm md:text-base"
                  placeholder="Search title, summary, or full text..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {(search || type || operator || dateFrom || dateTo) && (
                  <button
                    onClick={resetFilters}
                    title="Clear filters"
                    className="ml-2 rounded-full p-1 hover:bg-slate-100"
                  >
                    <IconClose />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                className="hidden md:inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-white hover:shadow-xs"
                aria-pressed={advancedOpen}
              >
                <IconFilter /> Advanced
              </button>

              <select
                value={String(limit)}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-md border px-3 py-2 text-sm bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <div className="md:hidden">
                <button
                  onClick={() => setAdvancedOpen((v) => !v)}
                  className="rounded-md border px-3 py-2 text-sm bg-white"
                  aria-expanded={advancedOpen}
                >
                  Filters
                </button>
              </div>
            </div>
          </div>

          {/* Advanced filters (multi-line) */}
          <div
            className={`mt-4 grid gap-3 transition-all duration-200 ${advancedOpen ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-4 md:max-h-0 md:opacity-0 md:overflow-hidden'}`}
          >
            {/* Operator */}
            <div className="col-span-1">
              <label className="block text-xs text-slate-500 mb-1">
                Operator
              </label>
              <input
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="e.g. British Airways"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            {/* Type */}
            <div className="col-span-1">
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="accident">Accident</option>
                <option value="incident">Incident</option>
                <option value="disappearance">Disappearance</option>
              </select>
            </div>

            {/* Date from */}
            <div className="col-span-1">
              <label className="block text-xs text-slate-500 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            {/* Date to */}
            <div className="col-span-1">
              <label className="block text-xs text-slate-500 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Active filter pills */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {activeFilters.length === 0 ? (
              <div className="text-xs text-slate-400">
                No filters — showing latest
              </div>
            ) : (
              activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                >
                  <span>{f.label}</span>
                  <button
                    onClick={() => {
                      if (f.key === 'search') setSearch('');
                      if (f.key === 'type') setType('');
                      if (f.key === 'operator') setOperator('');
                      if (f.key === 'from') setDateFrom('');
                      if (f.key === 'to') setDateTo('');
                    }}
                    className="p-1 rounded hover:bg-slate-200"
                    aria-label={`Remove ${f.label}`}
                  >
                    <IconClose />
                  </button>
                </span>
              ))
            )}

            <div className="ml-auto flex items-center gap-3 text-sm text-slate-500">
              <div className="text-xs">Results:</div>
              <div className="font-medium text-slate-700">{reports.length}</div>

              {loading && (
                <div className="text-xs text-slate-400">Loading…</div>
              )}
              {error && (
                <div className="text-xs text-rose-600">Error: {error}</div>
              )}
            </div>
          </div>
        </div>

        <section className="grid gap-6">
          {reports.length === 0 ? (
            <div className="p-6 rounded border text-slate-600">
              No reports found.
            </div>
          ) : (
            reports.map((r) => <CompactCard key={r.id} r={r} />)
          )}
        </section>
      </main>
    </>
  );
}

/* Server-side */
function safeDateToIso(d: any) {
  if (!d) return null;
  const date = new Date(d);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    await dbConnect();

    const docs = await ReportModel.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const initialReports: Report[] = (docs || []).map((d: any) => ({
      id: d._id?.toString() ?? '',
      slug: d.slug ?? null,
      title: d.title ?? null,
      type: d.type ?? null,
      date: safeDateToIso(d.date ?? d.createdAt),
      summary: d.summary ?? null,
      site: d.site ?? null,
      aircraft: d.aircraft ?? null,
      operator: d.operator ?? null,
      fatalities:
        typeof d.fatalities !== 'undefined' && d.fatalities !== null
          ? d.fatalities
          : null,
      injuries:
        typeof d.injuries !== 'undefined' && d.injuries !== null
          ? d.injuries
          : null,
      survivors:
        typeof d.survivors !== 'undefined' && d.survivors !== null
          ? d.survivors
          : null,
      origin: d.origin ?? null,
      destination: d.destination ?? null,
      thumbnail: d.thumbnail ?? null,
      damage: d.damage ?? null,
    }));

    return { props: { initialReports } };
  } catch (err) {
    console.error('index getServerSideProps error', err);
    return { props: { initialReports: [] } };
  }
};
