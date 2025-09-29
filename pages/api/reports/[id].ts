// pages/api/reports/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import ReportModel from '@/models/Report';
import mongoose from 'mongoose';

/**
 * Normalize timeline payload into an array of { time?, title, detail? }
 * Accepts:
 *  - array of objects
 *  - array of strings
 *  - JSON string (array)
 *  - newline-separated string
 */
function normalizeTimeline(raw: any) {
  if (typeof raw === 'undefined' || raw === null) return undefined;
  if (typeof raw === 'string') {
    // try JSON parse
    try {
      const parsed = JSON.parse(raw);
      return normalizeTimeline(parsed);
    } catch {
      // fallback: newline separated items
      const lines = raw
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter(Boolean);
      return lines.map((l: string) => ({ title: l }));
    }
  }

  if (Array.isArray(raw)) {
    return raw
      .map((it: any) => {
        if (!it) return null;
        if (typeof it === 'string') return { title: it };
        const time = it.time ?? it.t ?? it.timestamp ?? '';
        const title =
          it.title ?? it.headline ?? it.event ?? it.name ?? it[0] ?? '';
        const detail =
          it.detail ?? it.description ?? it.desc ?? it.body ?? it.note ?? '';
        if (!title && !detail && !time) return null;
        return {
          time: time ? String(time) : '',
          title: String(title || '').trim(),
          detail: String(detail || '').trim(),
        };
      })
      .filter(Boolean);
  }

  // unknown shape
  return undefined;
}

/**
 * Normalize geo payload.
 * Accepts GeoJSON { type:'Point', coordinates:[lng,lat] } or { lat, lng }.
 * Returns:
 *  - GeoJSON Point when valid,
 *  - null when explicit null provided,
 *  - undefined when no actionable data provided.
 */
function normalizeGeo(raw: any) {
  if (typeof raw === 'undefined' || raw === null) return undefined;

  // If already GeoJSON-like and valid
  if (
    raw.type &&
    typeof raw.type === 'string' &&
    Array.isArray(raw.coordinates) &&
    raw.coordinates.length >= 2 &&
    typeof raw.coordinates[0] === 'number' &&
    typeof raw.coordinates[1] === 'number'
  ) {
    return { type: raw.type, coordinates: raw.coordinates };
  }

  // support flat lat/lng
  const lat = raw.lat ?? raw.latitude ?? raw.lat_deg ?? null;
  const lng = raw.lng ?? raw.lon ?? raw.longitude ?? null;
  const latNum = lat === '' || lat === null ? null : Number(lat);
  const lngNum = lng === '' || lng === null ? null : Number(lng);

  if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
    return { type: 'Point', coordinates: [lngNum, latNum] };
  }

  // explicit null => clear geo
  if (lat === null && lng === null) return null;

  // nothing to do
  return undefined;
}

function normalizeUpdate(body: any) {
  // allow timeline & geo (and others)
  const allowed = [
    'title',
    'slug',
    'status',
    'type',
    'date',
    'flightNumber',
    'callsign',
    'aircraft',
    'registration',
    'operator',
    'origin',
    'destination',
    'route',
    'fatalities',
    'injuries',
    'survivors',
    'damage',
    'investigationStatus',
    'site',
    'geo',
    'region',
    'summary',
    'content',
    'contentHighlights',
    'thumbnail',
    'images',
    'attachments',
    'videos',
    'externalLinks',
    'phaseOfFlight',
    'probableCause',
    'contributingFactors',
    'safetyRecommendations',
    'investigationBodies',
    'reportDocument',
    'tags',
    'references',
    'author',
    'verified',
    'views',
    'relatedReports',
    'aircraftDetails',
    'passengerBreakdown',
    'casualtyDetails',
    'eyewitnesses',
    'weather',
    'NOTAMs',
    'emergencyResponse',
    'editors',
    'publishedBy',
    'publishedAt',
    'embargoDate',
    'seo',
    'isFeatured',
    'severityScore',
    'readingTimeMin',
    'readingLevel',
    'accessibilityTags',
    'legalNotes',
    'timeline', // <-- ensure timeline allowed
  ];

  const out: any = {};
  for (const k of allowed) {
    if (typeof body[k] !== 'undefined') {
      if (k === 'date' || k === 'publishedAt' || k === 'embargoDate') {
        out[k] = body[k] ? new Date(body[k]) : null;
      } else if (k === 'timeline') {
        const normalized = normalizeTimeline(body[k]);
        // only set if normalized is defined (undefined => don't touch)
        if (typeof normalized !== 'undefined') out[k] = normalized;
      } else if (k === 'geo') {
        const normalized = normalizeGeo(body[k]);
        // if normalized is undefined it means nothing actionable -> skip
        if (typeof normalized !== 'undefined') out[k] = normalized;
      } else {
        out[k] = body[k];
      }
    }
  }
  return out;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const method = req.method ?? 'GET';

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Missing id' });
  }

  await dbConnect();

  try {
    if (method === 'GET') {
      let doc = null;
      if (/^[0-9a-fA-F]{24}$/.test(id))
        doc = await ReportModel.findById(id).lean();
      if (!doc) doc = await ReportModel.findOne({ slug: id }).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(doc);
    }

    if (method === 'PUT') {
      const update = normalizeUpdate(req.body);

      // ensure slug uniqueness when changing
      if (update.slug) {
        const exists = await ReportModel.findOne({
          slug: update.slug,
          _id: { $ne: id },
        }).lean();
        if (exists) {
          update.slug = `${update.slug}-${new mongoose.Types.ObjectId()
            .toString()
            .slice(-6)}`;
        }
      }

      const doc = await ReportModel.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, runValidators: true }
      ).lean();

      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(doc);
    }

    if (method === 'DELETE') {
      const doc = await ReportModel.findByIdAndDelete(id).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error(`${method} /api/reports/${id} error`, err);
    return res.status(500).json({ error: err?.message ?? 'Server error' });
  }
}
