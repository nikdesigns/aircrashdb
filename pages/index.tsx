// pages/index.tsx
import React, { useState } from 'react';
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
  damage?: string | null; // <-- added
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

/* ----------------------
   CompactCard (clickable)
   ---------------------- */
function CompactCard({ r }: { r: Report }) {
  const href = `/reports/${r.slug ?? r.id}`;

  return (
    <Link
      href={href}
      className="block group"
      aria-label={`Open report ${r.title ?? ''}`}
    >
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

                {/* two-line clamp for summary */}
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

/* ----------------------
   Page
   ---------------------- */
export default function HomePage({
  initialReports,
}: {
  initialReports: Report[];
}) {
  const [reports] = useState<Report[]>(initialReports);

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

        <section className="grid gap-6">
          {reports.map((r) => (
            <CompactCard key={r.id} r={r} />
          ))}
        </section>
      </main>
    </>
  );
}

/* ----------------------
   Server-side data (safe serialization)
   ---------------------- */
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
      damage: d.damage ?? null, // <-- include damage so the card can show it
    }));

    return { props: { initialReports } };
  } catch (err) {
    console.error('index getServerSideProps error', err);
    return { props: { initialReports: [] } };
  }
};
