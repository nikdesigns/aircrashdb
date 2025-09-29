// pages/api/reports/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import ReportModel from '@/models/Report';
import mongoose from 'mongoose';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

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

function normalizePayload(body: any) {
  const p: any = {
    title: body.title ?? '',
    slug: body.slug ?? undefined,
    status: body.status ?? 'draft',
    type: body.type ?? '',
    date: body.date ? new Date(body.date) : undefined,

    flightNumber: body.flightNumber ?? '',
    callsign: body.callsign ?? '',
    aircraft: body.aircraft ?? '',
    registration: body.registration ?? '',
    operator: body.operator ?? '',
    origin: body.origin ?? '',
    destination: body.destination ?? '',
    route: body.route ?? '',

    fatalities:
      typeof body.fatalities !== 'undefined' && body.fatalities !== ''
        ? Number(body.fatalities)
        : undefined,
    injuries:
      typeof body.injuries !== 'undefined' && body.injuries !== ''
        ? Number(body.injuries)
        : undefined,
    survivors:
      typeof body.survivors !== 'undefined' && body.survivors !== ''
        ? Number(body.survivors)
        : undefined,
    damage: body.damage ?? '',
    investigationStatus: body.investigationStatus ?? '',

    site: body.site ?? '',
    // geo will be normalized below
    geo: null,
    region: body.region ?? '',

    summary: body.summary ?? '',
    content: body.content ?? '',
    contentHighlights: Array.isArray(body.contentHighlights)
      ? body.contentHighlights
      : [],

    thumbnail: body.thumbnail ?? '',
    images: Array.isArray(body.images)
      ? body.images.map((i: any) => ({
          url: i.url ?? '',
          caption: i.caption ?? '',
          credit: i.credit ?? '',
          order: i.order ?? 0,
        }))
      : [],
    attachments: Array.isArray(body.attachments)
      ? body.attachments.map((a: any) => ({
          url: a.url ?? '',
          title: a.title ?? '',
          type: a.type ?? '',
          caption: a.caption ?? '',
        }))
      : [],
    videos: Array.isArray(body.videos) ? body.videos : [],
    externalLinks: Array.isArray(body.externalLinks) ? body.externalLinks : [],

    phaseOfFlight: body.phaseOfFlight ?? '',
    probableCause: body.probableCause ?? '',
    contributingFactors: Array.isArray(body.contributingFactors)
      ? body.contributingFactors
      : [],
    safetyRecommendations: Array.isArray(body.safetyRecommendations)
      ? body.safetyRecommendations.map((r: any) => ({
          body: r.body ?? '',
          issuedTo: r.issuedTo ?? '',
          status: r.status ?? 'open',
        }))
      : [],

    investigationBodies: Array.isArray(body.investigationBodies)
      ? body.investigationBodies
      : [],
    reportDocument: body.reportDocument ?? '',
    tags: Array.isArray(body.tags) ? body.tags : [],
    references: Array.isArray(body.references) ? body.references : [],
    author: body.author ?? '',
    verified: !!body.verified,
    views: typeof body.views === 'number' ? body.views : 0,
    relatedReports: Array.isArray(body.relatedReports)
      ? body.relatedReports
      : [],

    aircraftDetails: body.aircraftDetails ?? null,
    passengerBreakdown: body.passengerBreakdown ?? null,
    casualtyDetails: Array.isArray(body.casualtyDetails)
      ? body.casualtyDetails
      : [],
    eyewitnesses: Array.isArray(body.eyewitnesses) ? body.eyewitnesses : [],
    weather: body.weather ?? null,
    NOTAMs: Array.isArray(body.NOTAMs) ? body.NOTAMs : [],
    emergencyResponse: body.emergencyResponse ?? null,

    editors: Array.isArray(body.editors) ? body.editors : [],
    publishedBy: body.publishedBy ?? '',
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
    embargoDate: body.embargoDate ? new Date(body.embargoDate) : undefined,
    seo: body.seo ?? null,

    isFeatured: !!body.isFeatured,
    severityScore:
      typeof body.severityScore !== 'undefined'
        ? Number(body.severityScore)
        : undefined,
    readingTimeMin:
      typeof body.readingTimeMin !== 'undefined'
        ? Number(body.readingTimeMin)
        : undefined,
    readingLevel: body.readingLevel ?? null,
    accessibilityTags: Array.isArray(body.accessibilityTags)
      ? body.accessibilityTags
      : [],
    legalNotes: body.legalNotes ?? '',
  };

  // attach normalized timeline if present
  const normalizedTimeline = normalizeTimeline(body.timeline);
  if (typeof normalizedTimeline !== 'undefined')
    p.timeline = normalizedTimeline;

  // attach normalized geo if present; if undefined => leave null (explicit)
  const normalizedGeo = normalizeGeo(body.geo);
  if (typeof normalizedGeo !== 'undefined') p.geo = normalizedGeo;

  return p;
}

function buildListQuery(qs: NextApiRequest['query']) {
  const q: any = {};

  if (qs.operator)
    q.operator = { $regex: `^${String(qs.operator)}`, $options: 'i' };
  if (qs.status) q.status = String(qs.status);
  if (qs.type) q.type = String(qs.type);
  if (qs.tags) {
    const tags = String(qs.tags)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (tags.length) q.tags = { $in: tags };
  }
  if (qs.search) q.$text = { $search: String(qs.search).trim() };
  if (qs.dateFrom || qs.dateTo) {
    q.date = {};
    if (qs.dateFrom) q.date.$gte = new Date(String(qs.dateFrom));
    if (qs.dateTo) q.date.$lte = new Date(String(qs.dateTo));
  }

  return q;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();
  const method = req.method ?? 'GET';

  if (method === 'GET') {
    try {
      const limitRaw = Number(req.query.limit ?? DEFAULT_LIMIT);
      const pageRaw = Number(req.query.page ?? 1);
      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(1, limitRaw), MAX_LIMIT)
        : DEFAULT_LIMIT;
      const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
      const skip = (page - 1) * limit;

      const query = buildListQuery(req.query);
      const total = await ReportModel.countDocuments(query);

      // *** Extended projection so front-end list/search returns summary + other fields ***
      const projection = {
        title: 1,
        slug: 1,
        date: 1,
        status: 1,
        type: 1,
        operator: 1,
        thumbnail: 1,
        fatalities: 1,
        injuries: 1,
        survivors: 1,
        region: 1,
        site: 1,
        aircraft: 1,
        registration: 1,
        origin: 1,
        destination: 1,
        summary: 1,
        damage: 1,
        createdAt: 1,
      };

      const docs = await ReportModel.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(projection)
        .lean();

      return res.status(200).json({ reports: docs, total, page, limit });
    } catch (err: any) {
      console.error('GET /api/reports error', err);
      return res.status(500).json({ error: err?.message ?? 'List failed' });
    }
  }

  if (method === 'POST') {
    try {
      const payload = normalizePayload(req.body);

      // ensure slug uniqueness
      if (payload.slug) {
        const existing = await ReportModel.findOne({
          slug: payload.slug,
        }).lean();
        if (existing) {
          payload.slug = `${payload.slug}-${new mongoose.Types.ObjectId()
            .toString()
            .slice(-6)}`;
        }
      }

      const doc = await ReportModel.create(payload);
      return res.status(201).json({ id: doc._id, _id: doc._id });
    } catch (err: any) {
      console.error('POST /api/reports error', err);
      return res.status(500).json({ error: err?.message ?? 'Create failed' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
