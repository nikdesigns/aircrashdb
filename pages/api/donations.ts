// pages/api/donations.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const TOP_DONORS = [
  { id: 'd1', name: 'Asha', amount: 50 },
  { id: 'd2', name: 'M. Singh', amount: 25 },
  { id: 'd3', name: 'Jordan', amount: 20 },
  { id: 'd4', name: 'Paula', amount: 10 },
  { id: 'd5', name: 'Lee', amount: 5 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=120'
  );
  res.status(200).json({ top: TOP_DONORS });
}
