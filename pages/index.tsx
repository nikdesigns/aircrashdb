// pages/index.tsx
import Link from 'next/link';
import HeroStats from '@/components/HeroStats';
import { Label } from '@/components/Label'; // adjust path if needed
import { Icon } from '@/components/Icons'; // adjust path if needed
import { getBadgeClass } from '@/lib/utils'; // adjust path if needed
import React from 'react';

// Mock data (replace with real DB/API call)
const reports = [
  {
    id: '1',
    title: 'Flight A123 disappearance',
    type: 'Disappearance',
    date: '2024-03-08',
    summary:
      'A scheduled international passenger flight from Kuala Lumpur to Beijing disappeared over the South China Sea.',
    site: 'Indian Ocean',
    aircraft: 'Boeing 777',
    operator: 'Airline A',
    fatalities: '239',
    injuries: '0',
    survivors: '0',
    origin: 'Kuala Lumpur',
    destination: 'Beijing',
  },
  {
    id: '2',
    title: 'Flight B456 accident',
    type: 'Accident',
    date: '2025-01-15',
    summary:
      'A Boeing 737 overshot the runway, resulting in serious damage and casualties.',
    site: 'USA',
    aircraft: 'Airbus A320',
    operator: 'Airline B',
    fatalities: '12',
    injuries: '30',
    survivors: '100',
    origin: 'New York',
    destination: 'Chicago',
  },
  {
    id: '3',
    title: 'Flight C789 incident',
    type: 'Incident',
    date: '2025-09-10',
    summary: 'A mid-air event caused an emergency diversion.',
    site: 'Atlantic',
    aircraft: 'Boeing 737',
    operator: 'Airline C',
    fatalities: '0',
    injuries: '5',
    survivors: '150',
    origin: 'London',
    destination: 'Toronto',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">AirCrashDB</h1>
        <p className="mt-2 text-slate-600">
          A free archive of air crash investigation reports.
        </p>
      </header>

      {/* Hero Stats */}
      <div className="mb-8">
        <HeroStats />
      </div>

      {/* Reports List */}
      <div className="grid gap-6">
        {reports.map((r) => (
          <article
            key={r.id}
            className="rounded border border-slate-200 bg-white p-4 shadow-sm"
          >
            {/* Title + Badge + Date */}
            <div className="flex items-start gap-3 sm:items-center sm:gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/reports/${r.id}`}
                    className="text-base font-semibold text-slate-900 leading-tight min-w-0 hover:underline"
                  >
                    {/* Fallback clamp via inline styles if Tailwind plugin missing */}
                    <span
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {r.title}
                    </span>
                  </Link>

                  <span
                    className={`ml-1 shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${getBadgeClass(
                      r.type
                    )}`}
                  >
                    {r.type}
                  </span>
                </div>
              </div>

              {(() => {
                const d = new Date(r.date);
                const iso = Number.isFinite(d.getTime())
                  ? d.toISOString()
                  : undefined;
                return (
                  <time
                    className="text-sm text-slate-500 shrink-0"
                    dateTime={iso}
                  >
                    {r.date}
                  </time>
                );
              })()}
            </div>

            {/* Summary */}
            <p
              className="mt-0 mb-2 text-xs text-slate-700"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {r.summary}
            </p>

            {/* Metadata grid */}
            <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 text-xs">
              <Label icon={Icon.site} label="Site" value={r.site} />
              <Label icon={Icon.aircraft} label="Aircraft" value={r.aircraft} />
              <Label icon={Icon.operator} label="Operator" value={r.operator} />
              <Label
                icon={Icon.fatalities}
                label="Fatalities"
                value={r.fatalities}
              />
              <Label icon={Icon.injuries} label="Injuries" value={r.injuries} />
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
          </article>
        ))}
      </div>
    </main>
  );
}
