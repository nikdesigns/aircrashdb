// pages/api/reports/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Report from '@/models/Report';
import sanitizeHtml from 'sanitize-html';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (!id || typeof id !== 'string')
    return res.status(400).json({ error: 'Missing id' });

  try {
    await dbConnect();
  } catch (err) {
    console.error('DB connect error', err);
    return res.status(500).json({ error: 'DB connection error' });
  }

  try {
    if (req.method === 'GET') {
      const doc = await Report.findById(id).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(doc);
    }

    if (req.method === 'PUT') {
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
              allowedSchemesByTag: { img: ['http', 'https', 'data'] },
            })
          : undefined;

      const update: any = {
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
            : payload.fatalities === ''
              ? undefined
              : payload.fatalities,
        injuries:
          typeof payload.injuries === 'number'
            ? payload.injuries
            : payload.injuries === ''
              ? undefined
              : payload.injuries,
        survivors:
          typeof payload.survivors === 'number'
            ? payload.survivors
            : payload.survivors === ''
              ? undefined
              : payload.survivors,
        origin: payload.origin,
        destination: payload.destination,
        thumbnail: payload.thumbnail,
        images: Array.isArray(payload.images)
          ? payload.images
          : payload.images
            ? [payload.images]
            : [],
      };

      if (safeContent !== undefined) update.content = safeContent;

      const updated = await Report.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      }).lean();
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const deleted = await Report.findByIdAndDelete(id).lean();
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error('/api/reports/[id] error', err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
