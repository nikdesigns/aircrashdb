// pages/reports/[id].tsx
import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import ReportGallery from '@/components/ReportGallery';
import { dbConnect } from '@/lib/mongodb';
import ReportModel from '@/models/Report';

type ImgItem = { url: string; caption?: string };

/**
 * Shape returned to page props
 */
type ReportPageProps = {
  report: {
    id: string;
    title?: string | null;
    date?: string | null;
    type?: string | null;
    summary?: string | null;
    site?: string | null;
    aircraft?: string | null;
    operator?: string | null;
    origin?: string | null;
    destination?: string | null;
    fatalities?: number | null;
    injuries?: number | null;
    survivors?: number | null;
    thumbnail?: string | null;
    images?: ImgItem[] | null;
    content?: string | null;
  } | null;
  prev?: { id: string; title?: string | null } | null;
  next?: { id: string; title?: string | null } | null;
};

export default function ReportDetailPage({
  report,
  prev,
  next,
}: ReportPageProps) {
  if (!report) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Report not found</h1>
          <p className="mt-3 text-sm text-slate-600">
            This report could not be found or has been removed.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="rounded bg-indigo-600 px-4 py-2 text-white"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // destructure
  const {
    id,
    title,
    date,
    type,
    summary,
    thumbnail,
    images: imgItems,
    content,
    aircraft,
    operator,
    site,
    origin,
    destination,
    fatalities,
    injuries,
    survivors,
  } = report;

  // ensure images is an array of objects {url, caption?}
  const images: ImgItem[] = Array.isArray(imgItems)
    ? imgItems.map((it) =>
        typeof it === 'string'
          ? { url: it }
          : { url: it?.url ?? '', caption: it?.caption }
      )
    : [];

  const metaTitle = title ? `${title} — AirCrashDB` : 'Report — AirCrashDB';
  const metaDescription =
    summary ?? (content ? content.replace(/<[^>]+>/g, '').slice(0, 160) : '');

  // Breadcrumb JSON-LD (simple)
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_SITE_URL ?? '',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Reports',
        item: (process.env.NEXT_PUBLIC_SITE_URL ?? '') + '/reports',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title ?? 'Report',
        item: (process.env.NEXT_PUBLIC_SITE_URL ?? '') + '/reports/' + id,
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        {metaDescription && (
          <meta name="description" content={metaDescription} />
        )}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={metaTitle} />
        {metaDescription && (
          <meta property="og:description" content={metaDescription} />
        )}
        {thumbnail && <meta property="og:image" content={thumbnail} />}
        <meta
          name="twitter:card"
          content={thumbnail ? 'summary_large_image' : 'summary'}
        />
        {thumbnail && <meta name="twitter:image" content={thumbnail} />}

        {/* Preload hero thumbnail to help LCP */}
        {thumbnail && <link rel="preload" as="image" href={thumbnail} />}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
      </Head>

      <main className="mx-auto max-w-[900px] px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
          <Link href="/">Home</Link> <span className="mx-2">/</span>{' '}
          <Link href="/reports">Reports</Link> <span className="mx-2">/</span>{' '}
          <span aria-current="page" className="text-slate-700">
            {title ?? 'Report'}
          </span>
        </nav>

        <div className="mb-6">
          <div className="flex items-start gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-extrabold leading-tight">{title}</h1>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="text-sm text-slate-500">{date ?? '—'}</div>
                <div
                  className={`text-xs font-semibold rounded px-2 py-0.5 ${type ? (type.toLowerCase() === 'accident' ? 'bg-red-100 text-red-700' : type.toLowerCase() === 'incident' ? 'bg-yellow-100 text-yellow-700' : type.toLowerCase() === 'disappearance' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700') : 'bg-slate-100 text-slate-700'}`}
                >
                  {type ?? '—'}
                </div>
                {operator && (
                  <div className="text-sm text-slate-600">· {operator}</div>
                )}
              </div>

              {summary && <p className="mt-4 text-slate-700">{summary}</p>}
            </div>

            <div className="w-48 h-32 flex-shrink-0 rounded overflow-hidden bg-slate-100">
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt={String(title ?? 'thumbnail')}
                  width={480}
                  height={320}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  No image
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded border p-3 bg-white">
            <div className="text-[10px] text-slate-400">Aircraft</div>
            <div className="text-sm font-medium text-slate-800">
              {aircraft ?? '—'}
            </div>
          </div>

          <div className="rounded border p-3 bg-white">
            <div className="text-[10px] text-slate-400">Site</div>
            <div className="text-sm font-medium text-slate-800">
              {site ?? '—'}
            </div>
          </div>

          <div className="rounded border p-3 bg-white">
            <div className="text-[10px] text-slate-400">Route</div>
            <div className="text-sm font-medium text-slate-800">
              {(origin ? origin + ' → ' : '') + (destination ?? '') || '—'}
            </div>
          </div>
        </div>

        <div className="mb-8 flex gap-4">
          <div className="rounded border p-3 bg-white text-sm">
            <div className="text-[10px] text-slate-400">Fatalities</div>
            <div className="text-lg font-semibold text-slate-800">
              {fatalities ?? '—'}
            </div>
          </div>
          <div className="rounded border p-3 bg-white text-sm">
            <div className="text-[10px] text-slate-400">Injuries</div>
            <div className="text-lg font-semibold text-slate-800">
              {injuries ?? '—'}
            </div>
          </div>
          <div className="rounded border p-3 bg-white text-sm">
            <div className="text-[10px] text-slate-400">Survivors</div>
            <div className="text-lg font-semibold text-slate-800">
              {survivors ?? '—'}
            </div>
          </div>
        </div>

        {images && images.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Gallery</h2>
            <ReportGallery images={images} />
          </section>
        )}

        <article className="prose max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: content ?? '<p>No full content.</p>',
            }}
          />
        </article>

        <div className="mt-8 flex items-center justify-between gap-4">
          {prev ? (
            <Link
              href={`/reports/${prev.id}`}
              className="flex items-center gap-3 text-sm"
            >
              ← <span className="font-medium">{prev.title ?? 'Previous'}</span>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              href={`/reports/${next.id}`}
              className="flex items-center gap-3 text-sm ml-auto"
            >
              <span className="font-medium">{next.title ?? 'Next'}</span> →
            </Link>
          ) : (
            <div />
          )}
        </div>

        <div className="mt-8">
          <Link
            href="/admin"
            className="text-sm text-slate-500 hover:underline"
          >
            Edit report (admin)
          </Link>
        </div>
      </main>
    </>
  );
}

/**
 * Pre-generate paths for most recent reports.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    await dbConnect();
    const docs = await ReportModel.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .select('_id')
      .lean();
    const paths = (docs || []).map((d: any) => ({
      params: { id: d._id?.toString() },
    }));
    return { paths, fallback: 'blocking' };
  } catch (err) {
    console.error('getStaticPaths error', err);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  try {
    await dbConnect();
    const { id } = ctx.params ?? {};
    if (!id || typeof id !== 'string')
      return { notFound: true, revalidate: 60 };

    const doc = await ReportModel.findById(id).lean();
    if (!doc) return { notFound: true, revalidate: 60 };

    // find prev (newer) and next (older) by createdAt
    const prevDoc = await ReportModel.findOne({
      createdAt: { $gt: doc.createdAt },
    })
      .sort({ createdAt: 1 })
      .select('_id title')
      .lean();
    const nextDoc = await ReportModel.findOne({
      createdAt: { $lt: doc.createdAt },
    })
      .sort({ createdAt: -1 })
      .select('_id title')
      .lean();

    const report = {
      id: doc._id?.toString() ?? '',
      title: doc.title ?? null,
      date: doc.date ?? null,
      type: doc.type ?? null,
      summary: doc.summary ?? null,
      site: doc.site ?? null,
      aircraft: doc.aircraft ?? null,
      operator: doc.operator ?? null,
      origin: doc.origin ?? null,
      destination: doc.destination ?? null,
      fatalities: typeof doc.fatalities !== 'undefined' ? doc.fatalities : null,
      injuries: typeof doc.injuries !== 'undefined' ? doc.injuries : null,
      survivors: typeof doc.survivors !== 'undefined' ? doc.survivors : null,
      thumbnail: doc.thumbnail ?? null,
      // normalize stored image shapes: accept strings or objects
      images: Array.isArray(doc.images)
        ? doc.images.map((it: any) =>
            typeof it === 'string'
              ? { url: it }
              : { url: it?.url ?? '', caption: it?.caption ?? undefined }
          )
        : null,
      content: doc.content ?? null,
    };

    const prev = prevDoc
      ? { id: prevDoc._id?.toString() ?? '', title: prevDoc.title ?? null }
      : null;
    const next = nextDoc
      ? { id: nextDoc._id?.toString() ?? '', title: nextDoc.title ?? null }
      : null;

    return { props: { report, prev, next }, revalidate: 60 };
  } catch (err) {
    console.error('getStaticProps error', err);
    return { notFound: true, revalidate: 60 };
  }
};
