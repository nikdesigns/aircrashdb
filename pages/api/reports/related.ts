// pages/api/reports/related.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import ReportModel from '@/models/Report';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

/**
 * Returns related reports by operator and/or tags.
 * Query parameters:
 *  - operator: string (optional) -- match operator case-insensitively (prefix)
 *  - tags: comma-separated list (optional) -- match any
 *  - exclude: id to exclude (optional)
 *  - limit: number (optional)
 *
 * Response:
 *  { reports: [...], total: number, limit, operator, tags }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const q: any = {};
    const { operator, tags, exclude } = req.query;

    if (operator && typeof operator === 'string' && operator.trim()) {
      // prefix match (case-insensitive)
      q.operator = { $regex: `^${operator.trim()}`, $options: 'i' };
    }

    if (tags && typeof tags === 'string' && tags.trim()) {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length) q.tags = { $in: tagList };
    }

    if (exclude && typeof exclude === 'string' && exclude.trim()) {
      // try to treat as ObjectId string or plain id - exclude that document
      q._id = { $ne: exclude };
    }

    const limitRaw = Number(req.query.limit ?? DEFAULT_LIMIT);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(1, limitRaw), MAX_LIMIT)
      : DEFAULT_LIMIT;

    // projection: keep it small and consistent with other list endpoints
    const projection = {
      title: 1,
      slug: 1,
      date: 1,
      type: 1,
      operator: 1,
      thumbnail: 1,
      summary: 1,
      site: 1,
      region: 1,
    };

    const docs = await ReportModel.find(q)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .select(projection)
      .lean();

    return res.status(200).json({
      reports: docs,
      count: docs.length,
      limit,
      operator: operator ?? null,
      tags: tags ?? null,
    });
  } catch (err: any) {
    console.error('GET /api/reports/related error', err);
    return res.status(500).json({ error: err?.message ?? 'Server error' });
  }
}
