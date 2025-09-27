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

const GeoSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
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
    geo: GeoSchema,
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

    // indexing/admin
    tags: { type: [String], default: [] },
    references: { type: [ReferenceSchema], default: [] },
    author: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    relatedReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],

    // audit
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// text index for search
ReportSchema.index(
  { title: 'text', summary: 'text', content: 'text' },
  { weights: { title: 10, summary: 5, content: 1 } }
);
// optionally geo index if you populate geo
ReportSchema.index({ geo: '2dsphere' });

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);
