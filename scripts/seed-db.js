// scripts/seed-db.js
// Usage: node scripts/seed-db.js
// Make sure .env.local (or env) has MONGODB_URI set.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in environment. Aborting.');
  process.exit(1);
}

// Use same schema/model code as models/Report.ts to ensure compatibility
const ReportSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

const Report =
  mongoose.models?.Report || mongoose.model('Report', ReportSchema);

const seedData = [
  {
    title: 'Flight A123 disappearance',
    type: 'Disappearance',
    date: '2014-03-08',
    summary:
      'A scheduled international passenger flight from Kuala Lumpur to Beijing disappeared over the South China Sea.',
    site: 'Indian Ocean',
    aircraft: 'Boeing 777',
    operator: 'Airline A',
    fatalities: 239,
    injuries: 0,
    survivors: 0,
    origin: 'Kuala Lumpur',
    destination: 'Beijing',
  },
  {
    title: 'Flight B456 accident',
    type: 'Accident',
    date: '2025-01-15',
    summary:
      'A Boeing 737 overshot the runway, resulting in serious damage and casualties.',
    site: 'Mangalore, India',
    aircraft: 'Boeing 737-800',
    operator: 'Air India Express',
    fatalities: 158,
    injuries: 8,
    survivors: 8,
    origin: 'Dubai',
    destination: 'Mangalore',
  },
  {
    title: 'Flight C789 incident',
    type: 'Incident',
    date: '2025-09-10',
    summary: 'A mid-air event caused an emergency diversion.',
    site: 'Atlantic',
    aircraft: 'Boeing 737',
    operator: 'Airline C',
    fatalities: 0,
    injuries: 5,
    survivors: 150,
    origin: 'London',
    destination: 'Toronto',
  },
  {
    title: 'Flight D101 runway excursion',
    type: 'Accident',
    date: '2023-07-22',
    summary: 'Runway excursion on landing due to hydroplaning.',
    site: 'Jakarta',
    aircraft: 'Airbus A320',
    operator: 'Airline D',
    fatalities: 0,
    injuries: 12,
    survivors: 150,
    origin: 'Singapore',
    destination: 'Jakarta',
  },
  {
    title: 'Flight E202 bird strike',
    type: 'Incident',
    date: '2022-11-03',
    summary: 'Multiple bird strikes on takeoff causing engine damage.',
    site: 'Cape Town',
    aircraft: 'Boeing 737',
    operator: 'Airline E',
    fatalities: 0,
    injuries: 0,
    survivors: 180,
    origin: 'Cape Town',
    destination: 'Johannesburg',
  },
  {
    title: 'Flight F303 tailstrike on departure',
    type: 'Incident',
    date: '2021-05-18',
    summary: 'Tailstrike during rotation; aircraft returned and inspected.',
    site: 'Sydney',
    aircraft: 'Airbus A330',
    operator: 'Airline F',
    fatalities: 0,
    injuries: 0,
    survivors: 250,
    origin: 'Sydney',
    destination: 'Melbourne',
  },
];

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected. Clearing existing reports collection (if any)...');
    await Report.deleteMany({});

    console.log(`Inserting ${seedData.length} reports...`);
    const inserted = await Report.insertMany(seedData, { ordered: true });
    console.log(`Inserted ${inserted.length} reports.`);

    console.log('Done. Closing connection.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
