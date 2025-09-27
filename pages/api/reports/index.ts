// pages/api/reports/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import ReportModel from '@/models/Report';
import sanitizeHtml from 'sanitize-html';

type Data = {
  reports?: any[];
  page?: number;
  limit?: number;
  total?: number;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    await dbConnect();
  } catch (err) {
    console.error('DB connect error', err);
    return res.status(500).json({ error: 'DB connection error' });
  }

  try {
    if (req.method === 'GET') {
      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.max(
        1,
        parseInt((req.query.limit as string) || '20', 10)
      );
      const skip = (page - 1) * limit;
      const total = await ReportModel.countDocuments({});
      const docs = await ReportModel.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      const reports = (docs || []).map((d: any) => ({
        id: d._id?.toString() ?? '',
        title: d.title ?? '',
        type: d.type ?? undefined,
        date: d.date ?? undefined,
        summary: d.summary ?? undefined,
        site: d.site ?? undefined,
        aircraft: d.aircraft ?? undefined,
        operator: d.operator ?? undefined,
        fatalities:
          typeof d.fatalities !== 'undefined' ? d.fatalities : undefined,
        injuries: typeof d.injuries !== 'undefined' ? d.injuries : undefined,
        survivors: typeof d.survivors !== 'undefined' ? d.survivors : undefined,
        origin: d.origin ?? undefined,
        destination: d.destination ?? undefined,
        thumbnail: d.thumbnail ?? undefined,
        images: d.images ?? undefined,
        content: d.content ?? undefined,
      }));
      return res.status(200).json({ reports, page, limit, total });
    }

    if (req.method === 'POST') {
      // sanitize content field and permit thumbnail/images arrays
      const payload = req.body || {};
      const safeContent =
        typeof payload.content === 'string'
          ? sanitizeHtml(payload.content, {
              allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                'img',
                'h1',
                'h2',
                'h3',
                'figure',
                'figcaption',
              ]),
              allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
              },
              allowedSchemesByTag: {
                img: ['http', 'https', 'data'],
              },
            })
          : undefined;

      const toInsert: any = {
        title: payload.title,
        type: payload.type,
        date: payload.date,
        summary: payload.summary,
        site: payload.site,
        aircraft: payload.aircraft,
        operator: payload.operator,
        fatalities:
          typeof payload.fatalities === 'number'
            ? payload.fatalities
            : undefined,
        injuries:
          typeof payload.injuries === 'number' ? payload.injuries : undefined,
        survivors:
          typeof payload.survivors === 'number' ? payload.survivors : undefined,
        origin: payload.origin,
        destination: payload.destination,
        thumbnail: payload.thumbnail,
        images: Array.isArray(payload.images)
          ? payload.images
          : payload.images
            ? [payload.images]
            : [],
        content: safeContent,
      };

      const created = await ReportModel.create(toInsert);
      return res.status(201).json(created);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error('API /api/reports error:', err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
