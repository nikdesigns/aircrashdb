// pages/api/reports/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

type ReportInput = {
  title: string;
  type?: string;
  date?: string;
  country?: string;
  summary?: string;
  site?: string;
  aircraft?: string;
  operator?: string;
  fatalities?: number | null;
  injuries?: number | null;
  survivors?: number | null;
  origin?: string;
  destination?: string;
  pdf_url?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // pagination + search
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Number(req.query.limit) || 20);
      const q = (req.query.q as string) || '';
      const sort = (req.query.sort as string) || 'createdAt';
      const order: 'asc' | 'desc' =
        (req.query.order as 'asc' | 'desc') || 'desc';

      const where = q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { summary: { contains: q, mode: 'insensitive' } },
              { site: { contains: q, mode: 'insensitive' } },
              { operator: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {};

      const [total, items] = await Promise.all([
        prisma.report.count({ where }),
        prisma.report.findMany({
          where,
          orderBy: { [sort]: order },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      return res.status(200).json({
        total,
        page,
        limit,
        items,
      });
    } else if (req.method === 'POST') {
      const body = req.body as ReportInput;
      if (!body || !body.title) {
        return res.status(400).json({ error: 'Missing title' });
      }

      const created = await prisma.report.create({
        data: {
          title: body.title,
          type: body.type,
          date: body.date,
          country: body.country,
          summary: body.summary,
          site: body.site,
          aircraft: body.aircraft,
          operator: body.operator,
          fatalities: body.fatalities ?? null,
          injuries: body.injuries ?? null,
          survivors: body.survivors ?? null,
          origin: body.origin,
          destination: body.destination,
          pdf_url: body.pdf_url,
        },
      });

      return res.status(201).json(created);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} not allowed`);
    }
  } catch (err: any) {
    console.error('reports API error', err);
    return res.status(500).json({ error: err?.message ?? 'server error' });
  }
}
