// pages/api/reports/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Report from '@/models/Report';
import { verifyAdmin } from '@/lib/serverAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await dbConnect();
    const { id } = req.query as { id?: string };
    if (!id) return res.status(400).json({ error: 'Missing id' });

    if (req.method === 'GET') {
      const doc = await Report.findById(id).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(doc);
    }

    // protect mutating routes
    if (req.method === 'PUT' || req.method === 'DELETE') {
      try {
        verifyAdmin(req);
      } catch (err: any) {
        return res
          .status(401)
          .json({ error: err?.message ?? 'Not authenticated' });
      }
    }

    if (req.method === 'PUT') {
      const payload = req.body ?? {};
      if (Array.isArray(payload.images)) {
        payload.images = payload.images.map((it: any) =>
          typeof it === 'string'
            ? { url: it, caption: '' }
            : { url: it.url ?? '', caption: it.caption ?? '' }
        );
      }
      payload.updatedAt = new Date();
      const updated = await Report.findByIdAndUpdate(id, payload, {
        new: true,
      }).lean();
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      // soft-delete or hard-delete? We'll hard-delete here; change as needed
      const deleted = await Report.findByIdAndDelete(id).lean();
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end();
  } catch (err: any) {
    console.error('api/reports/[id] error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
