// pages/api/reports.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type Report = {
  id: string;
  type: string;
  date: string;
  summary?: string;
  site?: string;
  aircraft?: string;
  operator?: string;
  fatalities?: number;
  injuries?: number;
  survivors?: number;
  origin?: string;
  destination?: string;
};

/* Mock dataset — extend as you like */
const MOCK_REPORTS: Report[] = [
  {
    id: 'demo-report',
    type: 'Accident',
    date: '2020-01-01',
    summary:
      'During initial climb the aircraft experienced an uncommanded roll; crew returned and landed safely. Actuator jam found.',
    site: 'Springfield Intl Airport',
    aircraft: 'Boeing 737-800',
    operator: 'Example Air',
    fatalities: 0,
    injuries: 3,
    survivors: 145,
    origin: 'Springfield (SGF)',
    destination: 'Metro City (MCO)',
  },
  {
    id: 'xyz-2018',
    type: 'Serious incident',
    date: '2018-07-11',
    summary:
      'Runway excursion on landing after heavy rain. Recommendations for runway friction monitoring.',
    site: 'Heathrow (LHR)',
    aircraft: 'Airbus A320',
    operator: 'Sample Airways',
    fatalities: 0,
    injuries: 2,
    survivors: 160,
    origin: 'Dublin (DUB)',
    destination: 'London (LHR)',
  },
  {
    id: 'lost-2021',
    type: 'Disappearance',
    date: '2021-05-19',
    summary:
      'Aircraft lost from radar during a night crossing; wreckage not found in initial search.',
    site: 'North Sea corridor',
    aircraft: 'Commuter turboprop',
    operator: 'Regional Connect',
    fatalities: 14,
    injuries: 0,
    survivors: 0,
    origin: 'Island A (ISA)',
    destination: 'Mainland B (MNB)',
  },
  // duplicate a few entries to simulate more data:
  {
    id: 'n001',
    type: 'Accident',
    date: '2005-03-12',
    summary: 'Mid-air collision during training flight.',
    site: 'Training Area',
    aircraft: 'Cessna 152',
    operator: 'Training Co',
    fatalities: 2,
    injuries: 0,
    survivors: 0,
    origin: 'Base A',
    destination: 'Base A',
  },
  {
    id: 'n002',
    type: 'Accident',
    date: '2012-09-05',
    summary: 'Controlled flight into terrain in poor weather.',
    site: 'Mountain region',
    aircraft: 'Beechcraft King Air',
    operator: 'Regional Connect',
    fatalities: 8,
    injuries: 0,
    survivors: 0,
    origin: 'City X',
    destination: 'City Y',
  },
  // add more if you want...
];

function matchesQuery(r: Report, q: string) {
  const low = q.toLowerCase();
  return [
    r.id,
    r.type,
    r.summary,
    r.site,
    r.aircraft,
    r.operator,
    r.origin,
    r.destination,
  ]
    .filter(Boolean)
    .some((f) => (f as string).toLowerCase().includes(low));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 10)));
  const offset = Math.max(0, Number(req.query.offset ?? 0));

  let results = MOCK_REPORTS.slice();

  if (q) {
    results = results.filter((r) => matchesQuery(r, q));
  }

  const total = results.length;
  const slice = results.slice(offset, offset + limit);

  // small artificial delay for realistic feel (set to 0 in production)
  const delay = Number(process.env.MOCK_DELAY_MS ?? 150);

  setTimeout(() => {
    res.status(200).json({ total, results: slice });
  }, delay);
}
