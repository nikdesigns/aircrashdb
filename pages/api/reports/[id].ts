// pages/api/reports/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query as { id: string };

  try {
    if (req.method === 'GET') {
      const report = await prisma.report.findUnique({
        where: { id },
      });
      if (!report) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(report);
    }

    if (req.method === 'PUT') {
      // update
      const body = req.body;
      const updated = await prisma.report.update({
        where: { id },
        data: body,
      });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      await prisma.report.delete({ where: { id } });
      return res.status(204).end();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} not allowed`);
  } catch (err: any) {
    console.error('report id handler error', err);
    return res.status(500).json({ error: err?.message ?? 'server error' });
  }
}
