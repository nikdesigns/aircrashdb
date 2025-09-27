// scripts/migrate_reports.js
/**
 * Usage:
 *   node scripts/migrate_reports.js
 *
 * Make sure you have NODE_ENV and MONGODB_URI present or set in .env
 */
const mongoose = require('mongoose');
const slugify = require('slugify');
const Report =
  require('../models/Report').default || require('../models/Report');

const MONGODB_URI =
  process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in env. Aborting.');
  process.exit(1);
}

async function connect() {
  return mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

function makeSlug(title) {
  const base = slugify(String(title || 'report'), {
    lower: true,
    strict: true,
  }).slice(0, 80);
  return base || 'report';
}

(async () => {
  try {
    await connect();
    console.log('Connected to DB');

    const batchSize = 200;
    let skip = 0;
    let updated = 0;
    let total = await Report.countDocuments({});
    console.log('Total docs:', total);

    while (skip < total) {
      const docs = await Report.find({}).skip(skip).limit(batchSize).lean();
      if (!docs || docs.length === 0) break;

      for (const doc of docs) {
        const changes = {};
        // images: convert if they're strings
        if (
          Array.isArray(doc.images) &&
          doc.images.length > 0 &&
          typeof doc.images[0] === 'string'
        ) {
          changes.images = doc.images.map((u) => ({
            url: u,
            caption: '',
            credit: '',
            order: 0,
          }));
        }

        // if no thumbnail but images exist, set thumbnail to first image url
        if (
          (!doc.thumbnail || doc.thumbnail === '') &&
          Array.isArray(changes.images ? changes.images : doc.images) &&
          (changes.images || doc.images).length > 0
        ) {
          const imgs = changes.images || doc.images;
          if (imgs && imgs.length > 0 && imgs[0].url) {
            changes.thumbnail = imgs[0].url;
          }
        }

        // slug: create if missing
        if (!doc.slug || doc.slug === '') {
          let s = makeSlug(doc.title || doc._id);
          // ensure uniqueness
          const exists = await Report.findOne({ slug: s }).select('_id').lean();
          if (exists) s = `${s}-${String(doc._id).slice(-6)}`;
          changes.slug = s;
        }

        // apply changes if any
        if (Object.keys(changes).length > 0) {
          await Report.updateOne({ _id: doc._id }, { $set: changes });
          updated++;
          if (updated % 50 === 0) console.log('Updated', updated);
        }
      }

      skip += docs.length;
    }

    console.log('Migration finished. Updated docs:', updated);
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(2);
  }
})();
