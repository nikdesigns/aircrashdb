// components/HeroStats.tsx
'use client';

import React, { useEffect, useState } from 'react';

type StatsResp = {
  totalReports: number;
  countries: number;
  reportsThisMonth: number;
  latestAdded: number;
  topOperators: { operator: string; count: number }[];
};

export default function HeroStats() {
  const [stats, setStats] = useState<StatsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/stats')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json?.error) {
          setErr(json.error);
          setStats(null);
        } else {
          setStats(json as StatsResp);
          setErr(null);
        }
      })
      .catch((e) => {
        console.error('HeroStats fetch error', e);
        if (mounted) setErr('Failed to load stats');
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="animate-pulse grid grid-cols-3 gap-4">
          <div className="h-12 rounded bg-slate-100" />
          <div className="h-12 rounded bg-slate-100" />
          <div className="h-12 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (err || !stats) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
        Unable to load stats.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-4 items-center justify-between">
        <StatCard
          label="Reports archived"
          value={stats.totalReports.toLocaleString()}
          icon={IconArchive}
        />
        <StatCard
          label="Countries"
          value={stats.countries.toString()}
          icon={IconGlobe}
        />
        <StatCard
          label="Added this month"
          value={stats.reportsThisMonth.toString()}
          icon={IconCalendar}
        />
      </div>
      <div className="mt-3 text-xs text-slate-500">
        Updated just now —{' '}
        <span className="font-medium">
          {stats.topOperators.length
            ? `${stats.topOperators[0].operator} +`
            : ''}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-slate-50 p-2">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-slate-500">{label}</div>
          <div className="text-lg font-semibold text-slate-900 truncate">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple inline SVG icons
const IconArchive = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <rect x="3" y="3" width="18" height="4" rx="1" />
    <path d="M21 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7" />
    <path d="M10 11h4" />
  </svg>
);
const IconGlobe = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M2 12h20M12 2c2.5 4 2.5 12 0 20M12 2C9.5 6 9.5 18 12 22" />
  </svg>
);
const IconCalendar = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
