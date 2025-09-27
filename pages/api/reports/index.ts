// pages/api/reports/index.ts
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

    if (req.method === 'GET') {
      const {
        page = '1',
        limit = '12',
        q,
        type,
        operator,
        dateFrom,
        dateTo,
        tag,
      } = req.query;

      const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
      const pageSize = Math.min(100, parseInt(String(limit), 10) || 12);
      const skip = (pageNum - 1) * pageSize;

      const filter: any = { status: { $ne: 'deleted' } };

      if (q && typeof q === 'string') {
        filter.$text = { $search: q };
      }

      if (type && typeof type === 'string' && type !== '') filter.type = type;
      if (operator && typeof operator === 'string' && operator !== '')
        filter.operator = operator;
      if (tag && typeof tag === 'string' && tag !== '') filter.tags = tag;

      if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom && typeof dateFrom === 'string')
          filter.date.$gte = new Date(dateFrom);
        if (dateTo && typeof dateTo === 'string')
          filter.date.$lte = new Date(dateTo);
      }

      const total = await Report.countDocuments(filter);
      let query = Report.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize);
      // if text search, add score sort
      if (filter.$text) {
        query = Report.find(filter, { score: { $meta: 'textScore' } }).sort({
          score: { $meta: 'textScore' },
          date: -1,
        });
      }
      const docs = await query.lean();

      const reports = (docs || []).map((d: any) => ({
        id: d._id?.toString() ?? null,
        slug: d.slug ?? null,
        title: d.title ?? null,
        type: d.type ?? null,
        date: d.date ?? null,
        summary: d.summary ?? null,
        site: d.site ?? null,
        aircraft: d.aircraft ?? null,
        operator: d.operator ?? null,
        fatalities: typeof d.fatalities !== 'undefined' ? d.fatalities : null,
        injuries: typeof d.injuries !== 'undefined' ? d.injuries : null,
        survivors: typeof d.survivors !== 'undefined' ? d.survivors : null,
        origin: d.origin ?? null,
        destination: d.destination ?? null,
        thumbnail: d.thumbnail ?? null,
        images: Array.isArray(d.images)
          ? d.images.map((it: any) => ({
              url: it.url ?? '',
              caption: it.caption ?? '',
            }))
          : [],
        tags: Array.isArray(d.tags) ? d.tags : [],
      }));

      res.setHeader(
        'Cache-Control',
        'public, max-age=10, s-maxage=10, stale-while-revalidate=30'
      );
      return res.status(200).json({ reports, total });
    }

    if (req.method === 'POST') {
      // create new report (admin-only)
      try {
        verifyAdmin(req);
      } catch (err: any) {
        return res
          .status(401)
          .json({ error: err?.message || 'Not authenticated' });
      }

      const payload = req.body ?? {};
      // normalize images if provided as strings
      if (Array.isArray(payload.images)) {
        payload.images = payload.images.map((it: any) =>
          typeof it === 'string'
            ? { url: it, caption: '' }
            : { url: it.url ?? '', caption: it.caption ?? '' }
        );
      }
      // set slug if not present
      if (!payload.slug && payload.title) {
        const base = payload.title
          .toString()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 80);
        payload.slug = base + '-' + Math.random().toString(36).slice(2, 8);
      }

      const created = await Report.create(payload);
      return res.status(201).json({ id: created._id, _id: created._id });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end();
  } catch (err: any) {
    console.error('api/reports/index error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
