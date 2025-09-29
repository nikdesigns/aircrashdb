// pages/reports/[id].tsx
import React, { useCallback, useMemo, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { GetServerSideProps } from 'next';
import ReportModel from '@/models/Report';
import { dbConnect } from '@/lib/mongodb';

import ReportTOC from '@/components/ReportTOC';
import Timeline from '@/components/Timeline';
import RelatedReports from '@/components/RelatedReports';
import Lightbox from '@/components/Lightbox';
import { formatDateDeterministic as fmtDate } from '@/utils/formatDate';

type ImgItem = { url: string | null; caption?: string; credit?: string };
type Attachment = {
  url: string;
  title?: string;
  type?: string;
  caption?: string;
};
type SafetyRec = { body: string; issuedTo?: string; status?: string };

type TimelineItem = { time?: string; title: string; detail?: string };

type ReportForClient = {
  id: string;
  slug?: string | null;
  title?: string | null;
  date?: string | null;
  dateFormatted?: string | null;
  type?: string | null;
  status?: string | null;
  summary?: string | null;
  content?: string | null;
  thumbnail?: string | null;
  images?: ImgItem[] | null;
  attachments?: Attachment[] | null;
  reportDocument?: string | null;
  flightNumber?: string | null;
  aircraft?: string | null;
  registration?: string | null;
  operator?: string | null;
  origin?: string | null;
  destination?: string | null;
  site?: string | null;
  region?: string | null;
  geo?: { lat?: number | null; lng?: number | null } | null;
  fatalities?: number | null;
  injuries?: number | null;
  survivors?: number | null;
  damage?: string | null;
  investigationStatus?: string | null;
  safetyRecommendations?: SafetyRec[] | null;
  tags?: string[] | null;
  investigationBodies?: string[] | null;
  contributingFactors?: string[] | null;
  timeline?: TimelineItem[] | null;
  probableCause?: string | null;
  // extended fields:
  weather?: any;
  aircraftDetails?: any;
  eyewitnesses?: any[];
};

export default function ReportDetailPage({
  report,
}: {
  report: ReportForClient | null;
}) {
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  }, []);

  if (!report) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Report not found</h1>
        <p className="mt-2 text-slate-600">
          The requested report does not exist or has been removed.
        </p>
      </main>
    );
  }

  const images = report.images ?? [];

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: report.title || 'Air crash report',
      description: (report.summary || '').slice(0, 200),
      image: report.thumbnail
        ? [report.thumbnail]
        : images
            .filter(Boolean)
            .map((i) => i.url)
            .filter(Boolean),
      datePublished: report.date || undefined,
      author: {
        '@type': 'Organization',
        name: report.operator || 'AirCrashDB',
      },
      publisher: { '@type': 'Organization', name: 'AirCrashDB' },
    }),
    [report, images]
  );

  const hasGeo = !!(
    report.geo &&
    typeof report.geo.lat === 'number' &&
    typeof report.geo.lng === 'number'
  );

  const mapsLink = hasGeo
    ? `https://www.openstreetmap.org/?mlat=${report.geo!.lat}&mlon=${report.geo!.lng}#map=12/${report.geo!.lat}/${report.geo!.lng}`
    : null;

  const timeline = report.timeline ?? [];

  return (
    <>
      <Head>
        <title>
          {(report.title ? `${report.title} — ` : '') + 'AirCrashDB'}
        </title>
        <meta
          name="description"
          content={report.summary ?? 'Air crash investigation report'}
        />
        {report.thumbnail && (
          <meta property="og:image" content={report.thumbnail} />
        )}
        <meta
          property="og:title"
          content={report.title ?? 'AirCrashDB report'}
        />
        <meta property="og:description" content={report.summary ?? ''} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <article className="mb-8">
          <div className="rounded-xl bg-white border border-slate-100 p-6 shadow-sm">
            <div className="md:flex md:items-start md:gap-6">
              <div className="md:w-3/5">
                {report.thumbnail ? (
                  <Image
                    src={report.thumbnail}
                    alt={report.title ?? 'thumbnail'}
                    width={1200}
                    height={630}
                    className="w-full h-auto object-cover rounded"
                  />
                ) : (
                  <div className="h-48 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                    No image
                  </div>
                )}

                <div className="mt-4 text-sm text-slate-500 flex items-center gap-3 flex-wrap">
                  <div>
                    {report.dateFormatted ??
                      (report.date ? fmtDate(report.date) : '—')}
                  </div>
                  <div>·</div>
                  <div className="inline-flex items-center gap-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        (report.type || '').toLowerCase().includes('accident')
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {report.type ?? '—'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {report.operator ?? ''}
                    </span>
                  </div>
                </div>

                {report.summary && (
                  <p className="mt-3 text-slate-700">{report.summary}</p>
                )}
              </div>

              <aside className="mt-4 md:mt-0 md:w-2/5">
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Quick facts
                  </h2>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                    <div>
                      <div className="text-xs text-slate-400">Flight</div>
                      <div className="font-medium">
                        {report.flightNumber ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Aircraft</div>
                      <div className="font-medium">
                        {report.aircraft ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Registration</div>
                      <div className="font-medium">
                        {report.registration ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Phase</div>
                      <div className="font-medium">
                        {report.investigationStatus ?? '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Origin</div>
                      <div className="font-medium">{report.origin ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Destination</div>
                      <div className="font-medium">
                        {report.destination ?? '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Site</div>
                      <div className="font-medium">{report.site ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Region</div>
                      <div className="font-medium">{report.region ?? '—'}</div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Fatalities</div>
                      <div className="font-medium">
                        {report.fatalities ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Injuries</div>
                      <div className="font-medium">
                        {report.injuries ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Survivors</div>
                      <div className="font-medium">
                        {report.survivors ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Damage</div>
                      <div className="font-medium">{report.damage ?? '—'}</div>
                    </div>
                  </div>

                  {report.tags && report.tags.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-slate-400">Tags</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {report.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </article>

        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-2 space-y-6">
            <section id="report-content" className="prose max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: report.content || '<p>No full content available.</p>',
                }}
              />
            </section>

            {/* Gallery */}
            {images.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-3">Gallery</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <button
                      key={String(img.url) + i}
                      onClick={() => openLightbox(i)}
                      className="rounded overflow-hidden bg-slate-50 focus:outline-none"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url ?? ''}
                        alt={img.caption ?? `Image ${i + 1}`}
                        className="w-full h-36 object-cover"
                      />
                      {img.caption && (
                        <div className="p-2 text-xs text-slate-600">
                          {img.caption}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Attachments */}
            {report.attachments && report.attachments.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                <div className="space-y-2">
                  {report.attachments.map((a, i) => (
                    <div
                      key={a.url + i}
                      className="flex items-center justify-between gap-3 rounded border p-3 bg-white"
                    >
                      <div>
                        <div className="font-medium text-slate-800">
                          {a.title || `Attachment ${i + 1}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {a.type || ''} {a.caption ? `· ${a.caption}` : ''}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border px-3 py-1 text-sm"
                        >
                          Open
                        </a>
                        <a
                          href={a.url}
                          download
                          className="rounded border px-3 py-1 text-sm"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Official PDF */}
            {report.reportDocument && (
              <section>
                <h3 className="text-lg font-semibold mb-3">
                  Official report (preview)
                </h3>
                <div className="rounded border overflow-hidden">
                  <iframe
                    src={report.reportDocument}
                    className="w-full h-[560px]"
                    title="Official report PDF"
                  />
                </div>
              </section>
            )}

            {/* Safety recommendations */}
            {report.safetyRecommendations &&
              report.safetyRecommendations.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-3">
                    Safety recommendations
                  </h3>
                  <div className="space-y-3">
                    {report.safetyRecommendations.map((r, i) => (
                      <div key={i} className="rounded border p-3 bg-white">
                        <div className="font-medium text-slate-800">
                          {r.body}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {r.issuedTo ? `Issued to ${r.issuedTo}` : ''}
                          {r.status ? ` · ${r.status}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {/* Beautiful vertical timeline (new) */}
            {timeline && timeline.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>

                <div className="relative">
                  {/* vertical line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 hidden sm:block" />
                  <ul className="space-y-6">
                    {timeline.map((t, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                            {i + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-500">
                            {t.time ?? ''}
                          </div>
                          <div className="mt-1 font-semibold text-slate-800">
                            {t.title}
                          </div>
                          {t.detail && (
                            <div className="mt-1 text-sm text-slate-700">
                              {t.detail}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* extended */}
            {report.weather && (
              <section>
                <h3 className="text-lg font-semibold mb-3">Weather</h3>
                <pre className="rounded border p-3 bg-white text-sm overflow-auto">
                  {JSON.stringify(report.weather, null, 2)}
                </pre>
              </section>
            )}

            {report.aircraftDetails && (
              <section>
                <h3 className="text-lg font-semibold mb-3">Aircraft details</h3>
                <pre className="rounded border p-3 bg-white text-sm overflow-auto">
                  {JSON.stringify(report.aircraftDetails, null, 2)}
                </pre>
              </section>
            )}

            {report.eyewitnesses && report.eyewitnesses.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-3">Eyewitnesses</h3>
                <ul className="list-disc pl-5">
                  {report.eyewitnesses.map((e, i) => (
                    <li key={i} className="text-sm text-slate-700">
                      {typeof e === 'string' ? e : JSON.stringify(e)}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR (sticky) */}
          <aside className="md:col-span-1 space-y-6">
            <div className="rounded-md border border-slate-100 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-800">
                Investigation
              </h4>
              <div className="mt-2 text-sm text-slate-600">
                {report.investigationStatus ?? '—'}
              </div>

              {report.dateFormatted && (
                <div className="mt-3 text-xs text-slate-400">
                  Published:{' '}
                  <span className="text-slate-700">{report.dateFormatted}</span>
                </div>
              )}

              {report.investigationBodies &&
                report.investigationBodies.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-slate-400">Bodies</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {report.investigationBodies.map((b) => (
                        <span
                          key={b}
                          className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {report.contributingFactors &&
                report.contributingFactors.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-slate-400">
                      Contributing factors
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {report.contributingFactors.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {hasGeo && (
                <div className="mt-3">
                  <div className="text-xs text-slate-400">Coordinates</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Lat {report.geo!.lat}, Lng {report.geo!.lng}
                  </div>
                  {mapsLink && (
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm rounded border px-3 py-1"
                    >
                      View on map
                    </a>
                  )}
                </div>
              )}

              {report.reportDocument && (
                <div className="mt-3">
                  <div className="text-xs text-slate-400">Official report</div>
                  <div className="mt-2 flex gap-2">
                    <a
                      href={report.reportDocument}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border px-3 py-1 text-sm"
                    >
                      Open
                    </a>
                    <a
                      href={report.reportDocument}
                      download
                      className="rounded border px-3 py-1 text-sm"
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}
            </div>

            <ReportTOC rootId="report-content" />
            <div className="rounded-md border border-slate-100 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-800">Timeline</h4>
              <div className="mt-3">
                <Timeline items={report.timeline ?? []} compact />
              </div>
            </div>

            <div className="rounded-md border border-slate-100 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-800">Related</h4>
              <div className="mt-3">
                <RelatedReports
                  operator={report.operator}
                  tags={report.tags}
                  currentId={report.id}
                />
              </div>
            </div>
          </aside>
        </div>

        {isLightboxOpen && images.length > 0 && (
          <Lightbox
            images={images as any}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </main>
    </>
  );
}

/* ---------------------------
   getServerSideProps
--------------------------- */
function isLikelyObjectId(s: string) {
  return /^[0-9a-fA-F]{24}$/.test(s);
}
function safeDateToIso(d: any) {
  if (!d) return null;
  const date = new Date(d);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

/**
 * Normalize timeline stored in different shapes:
 * - array of objects { time, title, detail }
 * - JSON stringified array
 * - array of strings -> try split
 */
function normalizeTimeline(raw: any): TimelineItem[] {
  if (!raw) return [];
  // If string that seems like JSON
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return normalizeTimeline(parsed);
    } catch {
      // fallback: split into lines
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      return lines.map((l) => ({ title: l }));
    }
  }
  if (Array.isArray(raw)) {
    return raw
      .map((it) => {
        if (!it) return null;
        if (typeof it === 'string') {
          return { title: it };
        }
        // if object with keys
        const time = it.time ?? it.t ?? it.timestamp ?? '';
        const title =
          it.title ??
          it.headline ??
          it.event ??
          (typeof it === 'object' && it[0] ? String(it[0]) : '');
        const detail = it.detail ?? it.description ?? it.desc ?? it.body ?? '';
        if (!title && !detail && !time) return null;
        return {
          time: String(time || '').trim(),
          title: String(title || '').trim(),
          detail: String(detail || '').trim(),
        };
      })
      .filter(Boolean) as TimelineItem[];
  }
  // unknown shape
  return [];
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    await dbConnect();
    const param = ctx.params?.id as string | undefined;
    if (!param) return { notFound: true };

    let doc: any = null;
    if (isLikelyObjectId(param)) doc = await ReportModel.findById(param).lean();
    if (!doc) doc = await ReportModel.findOne({ slug: param }).lean();
    if (!doc) return { notFound: true };

    const isoDate = safeDateToIso(doc.date ?? doc.createdAt);

    // PRECOMPUTE a server-side, human formatted date string to avoid
    // server/client locale differences (prevents hydration mismatch)
    const dateFormatted = isoDate
      ? new Date(isoDate).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null;

    // robust geo handling:
    let geo = null;
    if (doc.geo) {
      // If GeoJSON like: { type: 'Point', coordinates: [lng, lat] }
      if (doc.geo.coordinates && Array.isArray(doc.geo.coordinates)) {
        const lng = doc.geo.coordinates[0];
        const lat = doc.geo.coordinates[1];
        geo = {
          lat: typeof lat === 'number' ? lat : null,
          lng: typeof lng === 'number' ? lng : null,
        };
      } else if (
        typeof doc.geo.lat !== 'undefined' ||
        typeof doc.geo.lng !== 'undefined'
      ) {
        geo = { lat: doc.geo.lat ?? null, lng: doc.geo.lng ?? null };
      } else {
        geo = null;
      }
    }

    const rawTimeline = doc.timeline ?? null;
    const timeline = normalizeTimeline(rawTimeline);

    const report: ReportForClient = {
      id: doc._id?.toString(),
      slug: doc.slug ?? null,
      title: doc.title ?? null,
      date: isoDate,
      dateFormatted,
      type: doc.type ?? null,
      status: doc.status ?? null,
      summary: doc.summary ?? null,
      content: doc.content ?? null,
      thumbnail: doc.thumbnail ?? null,
      images: Array.isArray(doc.images)
        ? doc.images.map((i: any) => ({
            url: i.url ?? null,
            caption: i.caption ?? '',
            credit: i.credit ?? '',
          }))
        : [],
      attachments: Array.isArray(doc.attachments)
        ? doc.attachments.map((a: any) => ({
            url: a.url,
            title: a.title ?? '',
            type: a.type ?? '',
            caption: a.caption ?? '',
          }))
        : [],
      reportDocument: doc.reportDocument ?? null,
      flightNumber: doc.flightNumber ?? null,
      aircraft: doc.aircraft ?? null,
      registration: doc.registration ?? null,
      operator: doc.operator ?? null,
      origin: doc.origin ?? null,
      destination: doc.destination ?? null,
      site: doc.site ?? null,
      region: doc.region ?? null,
      geo,
      fatalities:
        typeof doc.fatalities !== 'undefined' && doc.fatalities !== null
          ? doc.fatalities
          : null,
      injuries:
        typeof doc.injuries !== 'undefined' && doc.injuries !== null
          ? doc.injuries
          : null,
      survivors:
        typeof doc.survivors !== 'undefined' && doc.survivors !== null
          ? doc.survivors
          : null,
      damage: doc.damage ?? null,
      investigationStatus: doc.investigationStatus ?? null,
      safetyRecommendations: Array.isArray(doc.safetyRecommendations)
        ? doc.safetyRecommendations.map((r: any) => ({
            body: r.body ?? '',
            issuedTo: r.issuedTo ?? '',
            status: r.status ?? '',
          }))
        : [],
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      investigationBodies: Array.isArray(doc.investigationBodies)
        ? doc.investigationBodies
        : [],
      contributingFactors: Array.isArray(doc.contributingFactors)
        ? doc.contributingFactors
        : [],
      timeline,
      probableCause: doc.probableCause ?? null,
      // extended fields
      weather: doc.weather ?? null,
      aircraftDetails: doc.aircraftDetails ?? null,
      eyewitnesses: doc.eyewitnesses ?? [],
    };

    return { props: { report } };
  } catch (err) {
    console.error('reports/[id] getServerSideProps error', err);
    return { notFound: true };
  }
};
