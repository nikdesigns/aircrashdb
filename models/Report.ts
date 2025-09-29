// models/Report.ts
import mongoose from 'mongoose';

const ImgSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: '' },
    credit: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    title: { type: String, default: '' },
    type: { type: String, default: '' }, // pdf, doc, image
    caption: { type: String, default: '' },
  },
  { _id: false }
);

const SafetyRecommendationSchema = new mongoose.Schema(
  {
    body: { type: String, required: true },
    issuedTo: { type: String, default: '' },
    status: { type: String, default: 'open' }, // open / closed / in-progress
  },
  { _id: false }
);

const ReferenceSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    publisher: String,
    date: Date,
  },
  { _id: false }
);

// GeoJSON Point for 2dsphere index
const GeoJSONPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },
  { _id: false }
);

const ReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true, unique: true, sparse: true },
    status: {
      type: String,
      default: 'draft',
      enum: ['published', 'draft', 'archived', 'deleted', 'review'],
    },
    type: { type: String, index: true },
    date: { type: Date, index: true },

    // flight & routing
    flightNumber: { type: String, default: '' },
    callsign: { type: String, default: '' },
    aircraft: { type: String, default: '' },
    registration: { type: String, default: '' },
    operator: { type: String, index: true, default: '' },
    origin: { type: String, default: '' },
    destination: { type: String, default: '' },
    route: { type: String, default: '' },

    // casualties/outcome
    fatalities: { type: Number, default: null },
    injuries: { type: Number, default: null },
    survivors: { type: Number, default: null },
    damage: { type: String, default: '' },
    investigationStatus: { type: String, default: '' },

    // location
    site: { type: String, default: '' },
    geo: { type: GeoJSONPointSchema, default: null },
    region: { type: String, default: '' },

    // narrative + media
    summary: { type: String, default: '' },
    content: { type: String, default: '' },
    contentHighlights: { type: [String], default: [] },

    thumbnail: { type: String, default: '' },
    images: { type: [ImgSchema], default: [] },
    attachments: { type: [AttachmentSchema], default: [] },
    videos: { type: [String], default: [] },
    externalLinks: { type: [String], default: [] },

    // structured facts
    phaseOfFlight: { type: String, default: '' },
    probableCause: { type: String, default: '' },
    contributingFactors: { type: [String], default: [] },
    safetyRecommendations: { type: [SafetyRecommendationSchema], default: [] },
    investigationBodies: { type: [String], default: [] },
    reportDocument: { type: String, default: '' },

    // extended fields (flexible)
    aircraftDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    passengerBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
    casualtyDetails: { type: [mongoose.Schema.Types.Mixed], default: [] },
    eyewitnesses: { type: [mongoose.Schema.Types.Mixed], default: [] },
    weather: { type: mongoose.Schema.Types.Mixed, default: null },
    NOTAMs: { type: [String], default: [] },
    emergencyResponse: { type: mongoose.Schema.Types.Mixed, default: null },

    // indexing/admin
    tags: { type: [String], default: [] },
    references: { type: [ReferenceSchema], default: [] },
    author: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    relatedReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],

    // editorial / seo
    editors: { type: [String], default: [] },
    publishedBy: { type: String, default: '' },
    publishedAt: { type: Date, default: null },
    embargoDate: { type: Date, default: null },
    seo: { type: mongoose.Schema.Types.Mixed, default: null },

    // misc
    isFeatured: { type: Boolean, default: false },
    severityScore: { type: Number, default: null },
    readingTimeMin: { type: Number, default: null },
    readingLevel: { type: String, default: null },
    accessibilityTags: { type: [String], default: [] },
    legalNotes: { type: String, default: '' },

    // audit
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// text index
ReportSchema.index(
  { title: 'text', summary: 'text', content: 'text' },
  { weights: { title: 10, summary: 5, content: 1 } }
);

// geo 2dsphere
ReportSchema.index({ geo: '2dsphere' });

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);
