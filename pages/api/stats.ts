// pages/api/stats.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type Report = {
  id: string;
  title?: string;
  date?: string; // ISO-ish
  country?: string; // ISO2 code if available
  operator?: string;
  [k: string]: any;
};

type StatsResp = {
  totalReports: number;
  countries: number;
  reportsThisMonth: number;
  latestAdded: number;
  topOperators: { operator: string; count: number }[];
};

function loadReports(): Report[] {
  // prefer data/reports.json (dev can copy sample to that path)
  const base = process.cwd();
  const primary = path.join(base, 'data', 'reports.json');
  const sample = path.join(base, 'data', 'reports.sample.json');

  let filePath = undefined;
  if (fs.existsSync(primary)) filePath = primary;
  else if (fs.existsSync(sample)) filePath = sample;
  else return []; // no data

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Report[];
    return [];
  } catch (err) {
    console.error('stats: failed to read/parse reports file', err);
    return [];
  }
}

function computeStats(reports: Report[]): StatsResp {
  const total = reports.length;

  const countrySet = new Set<string>();
  const operatorCounts: Record<string, number> = {};

  const now = new Date();
  const currentMonth = now.getUTCMonth(); // 0-11
  const currentYear = now.getUTCFullYear();

  let reportsThisMonth = 0;

  for (const r of reports) {
    if (r.country) countrySet.add(String(r.country).toUpperCase());
    if (r.operator) {
      const op = String(r.operator);
      operatorCounts[op] = (operatorCounts[op] || 0) + 1;
    }

    if (r.date) {
      const d = new Date(r.date);
      if (!isNaN(d.getTime())) {
        if (
          d.getUTCFullYear() === currentYear &&
          d.getUTCMonth() === currentMonth
        ) {
          reportsThisMonth++;
        }
      }
    }
  }

  // top operators
  const topOperators = Object.entries(operatorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([operator, count]) => ({ operator, count }));

  return {
    totalReports: total,
    countries: countrySet.size,
    reportsThisMonth,
    latestAdded: Date.now(),
    topOperators,
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResp | { error: string }>
) {
  try {
    const reports = loadReports();
    if (reports.length === 0) {
      // fallback demo numbers
      const demo: StatsResp = {
        totalReports: 1234,
        countries: 87,
        reportsThisMonth: 2,
        latestAdded: Date.now(),
        topOperators: [{ operator: 'DemoAir', count: 12 }],
      };
      return res.status(200).json(demo);
    }
    const stats = computeStats(reports);
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=30'
    );
    return res.status(200).json(stats);
  } catch (err: any) {
    console.error('stats handler error', err?.message ?? err);
    return res.status(500).json({ error: 'failed to compute stats' });
  }
}
