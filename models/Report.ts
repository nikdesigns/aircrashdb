// models/Report.ts
import mongoose, { Schema, Document, models } from 'mongoose';

export interface IReport extends Document {
  title: string;
  type?: string;
  date?: string;
  summary?: string;
  site?: string;
  aircraft?: string;
  operator?: string;
  fatalities?: number;
  injuries?: number;
  survivors?: number;
  origin?: string;
  destination?: string;
}

const ReportSchema = new Schema<IReport>(
  {
    title: { type: String, required: true },
    type: String,
    date: String,
    summary: String,
    site: String,
    aircraft: String,
    operator: String,
    fatalities: Number,
    injuries: Number,
    survivors: Number,
    origin: String,
    destination: String,
    thumbnail: String, // URL to single thumbnail
    images: [String], // optional gallery
    content: String, // WYSIWYG HTML
  },
  { timestamps: true }
);

export default models.Report || mongoose.model<IReport>('Report', ReportSchema);
