const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend_env.txt') });
require('dotenv').config();

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'media';

if (!uri) {
  throw new Error('Missing MONGODB_URI or DATABASE_URL in backend_env.txt');
}

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL in backend_env.txt');
}

const supabaseBase = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${supabaseBucket}`;

function mapAwsToSupabase(url) {
  if (!url || !url.includes('amazonaws.com')) return url;

  const replacements = [
    'https://sngs-matrimonial-prod.s3.ap-south-1.amazonaws.com/',
    'https://sngs-matrimonial.s3.ap-south-1.amazonaws.com/',
    'https://sngs-matrimonial-prod.s3.amazonaws.com/',
    'https://sngs-matrimonial.s3.amazonaws.com/',
  ];

  for (const oldBase of replacements) {
    if (url.startsWith(oldBase)) {
      return url.replace(oldBase, `${supabaseBase}/`);
    }
  }

  return url;
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db();
  const users = db.collection('users');

  const targetName = 'Saurabh Manoharan';
  const user = await users.findOne({ fullName: targetName });

  if (!user) {
    console.log(`User not found: ${targetName}`);
    await client.close();
    return;
  }

  console.log('Before:');
  console.log('profilePicture:', user.profilePicture?.url || 'N/A');
  console.log('galleryCount:', user.gallery?.photos?.length || 0);
  console.log('horoscopeDocument:', user.horoscopeDocument?.url || 'N/A');

  const updatedProfilePicture = user.profilePicture?.url ? mapAwsToSupabase(user.profilePicture.url) : user.profilePicture;
  const updatedGallery = Array.isArray(user.gallery?.photos)
    ? user.gallery.photos.map((photo) => ({
        ...photo,
        url: photo?.url ? mapAwsToSupabase(photo.url) : photo.url,
      }))
    : user.gallery;

  const updatedHoroscope = user.horoscopeDocument?.url
    ? { ...user.horoscopeDocument, url: mapAwsToSupabase(user.horoscopeDocument.url) }
    : user.horoscopeDocument;

  const result = await users.updateOne(
    { _id: user._id },
    {
      $set: {
        profilePicture: updatedProfilePicture,
        gallery: updatedGallery,
        horoscopeDocument: updatedHoroscope,
      },
    }
  );

  console.log('\nUpdate result:', result.modifiedCount);
  console.log('After:');
  console.log('profilePicture:', updatedProfilePicture || 'N/A');
  console.log('galleryCount:', updatedGallery?.photos?.length || 0);
  console.log('horoscopeDocument:', updatedHoroscope?.url || 'N/A');

  await client.close();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
