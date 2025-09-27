// pages/index.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import HeroStats from '@/components/HeroStats';
import { GetServerSideProps } from 'next';
import { dbConnect } from '@/lib/mongodb';
import ReportModel from '@/models/Report';

/* ----------------------
   Types
   ---------------------- */
export type Report = {
  id: string | null;
  slug?: string | null;
  title?: string | null;
  type?: string | null;
  date?: string | null; // ISO string (serialized)
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
  images?: { url: string | null; caption?: string }[] | null;
  content?: string | null;
};

/* ----------------------
   CompactCard component
   (keeps styling consistent and self-contained)
   ---------------------- */
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

function CompactCard({ r }: { r: Report }) {
  return (
    <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-28 h-20 flex-shrink-0 rounded overflow-hidden bg-slate-50">
          {r.thumbnail ? (
            // next/image requires remotePatterns in next.config.js for external hosts
            <Image
              src={r.thumbnail}
              alt={String(r.title ?? 'thumbnail')}
              width={280}
              height={160}
              className="object-cover"
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
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {r.title ?? '—'}
              </h3>
              <p className="mt-1 text-xs text-slate-500 truncate">
                {r.summary ?? ''}
              </p>
            </div>

            <div className="text-sm text-slate-500 whitespace-nowrap">
              <div>{r.date ?? '—'}</div>
              <div
                className={`${getBadgeClass(r.type)} mt-2 inline-block rounded px-2 py-0.5 text-xs font-semibold`}
              >
                {r.type ?? '—'}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="text-[10px] text-slate-400">Site</div>
              <div className="text-xs font-medium text-slate-800 truncate">
                {r.site ?? '—'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-[10px] text-slate-400">Aircraft</div>
              <div className="text-xs font-medium text-slate-800 truncate">
                {r.aircraft ?? '—'}
              </div>
            </div>

            <div className="flex items-center gap-2">
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

            <div />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ----------------------
   Debounce hook
   ---------------------- */
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/* ----------------------
   Page component
   ---------------------- */
type Props = {
  initialReports: Report[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  availableTypes: string[];
  availableOperators: string[];
};

export default function HomePage({
  initialReports,
  initialTotal,
  initialPage,
  pageSize,
  availableTypes,
  availableOperators,
}: Props) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [page, setPage] = useState<number>(initialPage);
  const [total, setTotal] = useState<number>(initialTotal);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [type, setType] = useState<string | ''>('');
  const [operator, setOperator] = useState<string | ''>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const debouncedQ = useDebouncedValue(q, 350);
  const allLoaded = reports.length >= total;

  function buildQuery(params: Record<string, any>) {
    const s = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && typeof v !== 'undefined')
        s.set(k, String(v));
    });
    return s.toString();
  }

  async function fetchReports(opts: { page?: number; append?: boolean } = {}) {
    const pageToLoad = opts.page ?? 1;
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery({
        page: pageToLoad,
        limit: pageSize,
        q: debouncedQ,
        type,
        operator,
        dateFrom,
        dateTo,
      });
      const res = await fetch(`/api/reports?${qs}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      if (!data || !Array.isArray(data.reports))
        throw new Error('Invalid response');
      setReports((prev) =>
        opts.append ? [...prev, ...data.reports] : data.reports
      );
      setTotal(data.total ?? 0);
      setPage(pageToLoad);
    } catch (err: any) {
      console.error('fetchReports', err);
      setError(err?.message ?? 'Error loading reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports({ page: 1, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, type, operator, dateFrom, dateTo]);

  const loadMore = async () => {
    if (loading || allLoaded) return;
    await fetchReports({ page: page + 1, append: true });
  };

  return (
    <>
      <Head>
        <title>AirCrashDB — Archive of air crash investigation reports</title>
        <meta
          name="description"
          content="AirCrashDB — searchable archive of air crash investigation reports, incidents and summaries."
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

        {/* Filter card — slate palette */}
        <div className="mb-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <label htmlFor="search" className="sr-only">
                Search reports
              </label>
              <div className="relative flex-1">
                <input
                  id="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title or summary..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
                  aria-label="Search reports"
                />
                {q && (
                  <button
                    onClick={() => setQ('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs rounded px-2 py-1 hover:bg-slate-100"
                    aria-label="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <div className="text-xs text-slate-500">Filters</div>
                <button
                  onClick={() => {
                    setQ('');
                    setType('');
                    setOperator('');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="rounded-md bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-2 sm:mt-0 flex gap-2 flex-wrap">
              <button
                onClick={() => setType('')}
                className={`text-xs px-3 py-1 rounded-full ${type === '' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}
                aria-pressed={type === ''}
                title="All types"
              >
                All
              </button>
              {availableTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setType((prev) => (prev === t ? '' : t))}
                  className={`text-xs px-3 py-1 rounded-full ${type === t ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}
                  aria-pressed={type === t}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="col-span-1 sm:col-span-1">
              <label className="block text-xs text-slate-500 mb-1">
                Operator
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">All operators</option>
                {availableOperators.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 sm:col-span-2 flex gap-2 items-center">
              <div className="w-1/2">
                <label className="block text-xs text-slate-500 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-xs text-slate-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <section className="grid gap-6">
          {reports.map((r) => (
            <CompactCard key={String(r.id)} r={r} />
          ))}
        </section>

        <div className="mt-8 flex flex-col items-center gap-3">
          {error && <div className="text-sm text-rose-600">{error}</div>}
          {!allLoaded ? (
            <button
              onClick={loadMore}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white text-sm shadow-sm disabled:opacity-60"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          ) : (
            <div className="text-sm text-slate-500">
              All reports loaded ({total})
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/* ----------------------
   getServerSideProps (safe serialization)
   ---------------------- */
function safeDateToString(d: any) {
  if (!d) return null;
  const date = new Date(d);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    await dbConnect();

    const pageSize = 12;
    const page = 1;
    const skip = 0;

    const total = await ReportModel.countDocuments({});
    const docs = await ReportModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const initialReports: Report[] = (docs || []).map((d: any) => ({
      id: d._id?.toString() ?? null,
      slug: d.slug ?? null,
      title: d.title ?? null,
      type: d.type ?? null,
      date: safeDateToString(d.date ?? d.createdAt),
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
      images: Array.isArray(d.images)
        ? d.images.map((it: any) =>
            typeof it === 'string'
              ? { url: it, caption: '' }
              : { url: it?.url ?? null, caption: it?.caption ?? '' }
          )
        : [],
      content: d.content ?? null,
    }));

    const types = await ReportModel.distinct('type').then((arr: any) =>
      (arr || []).filter(Boolean)
    );
    const operators = await ReportModel.distinct('operator').then((arr: any) =>
      (arr || []).filter(Boolean)
    );

    return {
      props: {
        initialReports,
        initialTotal: total ?? 0,
        initialPage: page,
        pageSize,
        availableTypes: types,
        availableOperators: operators,
      },
    };
  } catch (err) {
    console.error('getServerSideProps error', err);
    return {
      props: {
        initialReports: [],
        initialTotal: 0,
        initialPage: 1,
        pageSize: 12,
        availableTypes: [],
        availableOperators: [],
      },
    };
  }
};
