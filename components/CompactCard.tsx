// components/CompactCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export type Report = {
  id: string | null;
  title: string | null;
  type?: string | null;
  date?: string | null;
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
  images?: string[] | null;
  content?: string | null;
};

/* Minimal icons (same visual color via tailwind classes in usage) */
const Icon = {
  site: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="9" strokeWidth="1.25" />
    </svg>
  ),
  aircraft: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M2 16l20-5-20-5v4l14 1-14 1v4z"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  operator: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.25" />
      <path d="M7 10h10M7 14h7" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  ),
  fatalities: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="8" r="3.2" strokeWidth="1.25" />
      <path d="M5 21c0-4 14-4 14 0" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  ),
  injuries: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.25" />
      <path d="M12 8v8M8 12h8" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  ),
  survivors: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="8" r="3.2" strokeWidth="1.25" />
      <path d="M2 21c0-5 20-5 20 0" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  ),
  origin: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12 2v20M2 12h20" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  ),
  destination: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M2 12h20M12 2v20" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  ),
};

function getBadgeClass(type?: string | null) {
  if (!type) return 'bg-slate-100 text-slate-700';
  switch (type.toLowerCase()) {
    case 'accident':
      return 'bg-red-100 text-red-700';
    case 'disappearance':
      return 'bg-purple-100 text-purple-700';
    case 'incident':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function CompactCard({ r }: { r: Report }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-transform hover:-translate-y-1">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
          {r.thumbnail ? (
            <Image
              src={r.thumbnail}
              alt={String(r.title ?? 'thumbnail')}
              width={320}
              height={200}
              sizes="(max-width: 640px) 150px, 320px"
              className="object-cover"
            />
          ) : (
            <div className="text-xs text-slate-500 px-2">No image</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/reports/${String(r.id ?? '')}`}
                className="hover:underline"
              >
                <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
                  {r.title ?? '—'}
                </h3>
              </Link>
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                {r.summary ?? ''}
              </p>
            </div>

            <div className="text-sm text-slate-500 whitespace-nowrap">
              {r.date ?? '—'}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div className="flex items-center gap-2">
              <Icon.site className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-[10px] text-slate-400">Site</div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {r.site ?? '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Icon.aircraft className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-[10px] text-slate-400">Aircraft</div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {r.aircraft ?? '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Icon.operator className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-[10px] text-slate-400">Operator</div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {r.operator ?? '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Icon.fatalities className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-[10px] text-slate-400">Fatalities</div>
                <div className="text-xs font-medium text-slate-800">
                  {r.fatalities ?? '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Icon.injuries className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-[10px] text-slate-400">Injuries</div>
                <div className="text-xs font-medium text-slate-800">
                  {r.injuries ?? '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Icon.survivors className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-[10px] text-slate-400">Survivors</div>
                <div className="text-xs font-medium text-slate-800">
                  {r.survivors ?? '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Icon.origin className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-[10px] text-slate-400">Origin</div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {r.origin ?? '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Icon.destination className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-[10px] text-slate-400">Destination</div>
                <div className="text-xs font-medium text-slate-800 truncate">
                  {r.destination ?? '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
