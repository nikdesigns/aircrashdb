// pages/index.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import CompactCard, { Report as ReportType } from '@/components/CompactCard';
import HeroStats from '@/components/HeroStats';
import { dbConnect } from '@/lib/mongodb';
import ReportModel from '@/models/Report';
import { GetServerSideProps } from 'next';

type Props = {
  initialReports: ReportType[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
};

export default function HomePage({
  initialReports,
  initialTotal,
  initialPage,
  pageSize,
}: Props) {
  const [reports, setReports] = useState<ReportType[]>(initialReports);
  const [page, setPage] = useState<number>(initialPage);
  const [total, setTotal] = useState<number>(initialTotal);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const allLoaded = reports.length >= total;

  const loadMore = async () => {
    if (loading || allLoaded) return;
    setLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/reports?page=${nextPage}&limit=${pageSize}`
      );
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      if (data.reports && Array.isArray(data.reports)) {
        setReports((prev) => [...prev, ...data.reports]);
        setPage(nextPage);
        if (typeof data.total === 'number') setTotal(data.total);
      } else {
        throw new Error('Invalid response shape');
      }
    } catch (err: any) {
      console.error('loadMore error', err);
      setError(err?.message ?? 'Error loading more reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>AirCrashDB — Archive of air crash investigation reports</title>
        <meta
          name="description"
          content="AirCrashDB — searchable archive of air crash investigation reports, incidents and summaries with dates, aircraft, operator and outcomes."
        />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">AirCrashDB</h1>
          <p className="mt-2 text-slate-600 max-w-prose">
            A free archive of air crash investigation reports.
          </p>
        </header>

        <div className="mb-8">
          <HeroStats />
        </div>

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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm shadow-sm hover:shadow-md transition disabled:opacity-60"
              aria-label="Load more reports"
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

/**
 * getServerSideProps - returns first page of reports and total count
 * Important: convert undefined -> null so Next.js can serialize props
 */
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    await dbConnect();

    const pageSize = 6;
    const page = 1;
    const skip = 0;

    const total = await ReportModel.countDocuments({});

    const docs = await ReportModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const initialReports: ReportType[] = (docs || []).map((d: any) => ({
      id: d._id?.toString() ?? null,
      title: d.title ?? null,
      type: d.type ?? null,
      date: d.date ?? null,
      summary: d.summary ?? null,
      site: d.site ?? null,
      aircraft: d.aircraft ?? null,
      operator: d.operator ?? null,
      fatalities: typeof d.fatalities !== 'undefined' ? d.fatalities : null,
      injuries: typeof d.injuries !== 'undefined' ? d.injuries : null,
      survivors: typeof d.survivors !== 'undefined' ? d.survivors : null,
      origin: d.origin ?? null,
      destination: d.destination ?? null,
      thumbnail: d.thumbnail ?? null,
      images: Array.isArray(d.images) ? d.images : null,
      content: d.content ?? null,
    }));

    return {
      props: {
        initialReports,
        initialTotal: total,
        initialPage: page,
        pageSize,
      },
    };
  } catch (err) {
    console.error('getServerSideProps error fetching reports:', err);
    return {
      props: {
        initialReports: [],
        initialTotal: 0,
        initialPage: 1,
        pageSize: 6,
      },
    };
  }
};
