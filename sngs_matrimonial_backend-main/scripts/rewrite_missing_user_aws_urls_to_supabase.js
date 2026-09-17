const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../backend_env.txt') });
require('dotenv').config();

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'media';

if (!uri) throw new Error('Missing MONGODB_URI or DATABASE_URL');
if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL in backend_env.txt');

const base = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_BUCKET}`;

function mapAwsToSupabase(url) {
  if (!url || typeof url !== 'string') return url;
  const awsPatterns = [
    'https://sngs-matrimonial-prod.s3.ap-south-1.amazonaws.com/',
    'https://sngs-matrimonial.s3.ap-south-1.amazonaws.com/',
    'https://sngs-matrimonial-prod.s3.amazonaws.com/',
    'https://sngs-matrimonial.s3.amazonaws.com/',
  ];

  for (const prefix of awsPatterns) {
    if (url.startsWith(prefix)) {
      const relative = url.replace(prefix, '');
      return `${base}/${relative}`;
    }
  }

  return url;
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const users = db.collection('users');

  const names = [
    'Ashmithra A',
    'Monisha Prabhakaran',
    'Nithya Surendran',
    'Sujith Surendran Damodharan',
  ];

  let updated = 0;
  let skipped = 0;

  for (const fullName of names) {
    let user = await users.findOne({ fullName });
    if (!user) {
      const fuzzy = await users.findOne({
        fullName: new RegExp(fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      });
      if (!fuzzy) {
        console.log(`SKIP user not found: ${fullName}`);
        skipped++;
        continue;
      }
      console.log(`Matched fuzzy: ${fullName} -> ${fuzzy.fullName}`);
      user = fuzzy;
    }

    const profilePicture = user.profilePicture?.url
      ? { ...user.profilePicture, url: mapAwsToSupabase(user.profilePicture.url) }
      : user.profilePicture;

    const gallery = user.gallery?.photos
      ? {
          ...user.gallery,
          photos: user.gallery.photos.map((photo) => ({
            ...photo,
            url: photo?.url ? mapAwsToSupabase(photo.url) : photo.url,
          })),
        }
      : user.gallery;

    const result = await users.updateOne(
      { _id: user._id },
      {
        $set: {
          profilePicture,
          gallery,
        },
      }
    );

    if (result.modifiedCount > 0) {
      updated++;
      console.log(`UPDATED ${user.fullName}`);
    } else {
      console.log(`NO_CHANGE ${user.fullName}`);
    }
  }

  console.log(`TOTAL_UPDATED=${updated}`);
  console.log(`TOTAL_SKIPPED=${skipped}`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
