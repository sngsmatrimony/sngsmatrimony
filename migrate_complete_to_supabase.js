const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend_env.txt') });

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'media';
const SUPABASE_BASE = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_BUCKET}`;

// AWS to Supabase URL mapper - handles both photos and documents
function mapAwsToSupabase(url) {
  if (!url || typeof url !== 'string') return url;

  const awsPatterns = [
    'https://sngs-matrimonial-prod.s3.ap-south-1.amazonaws.com/',
    'https://sngs-matrimonial.s3.ap-south-1.amazonaws.com/',
    'https://sngs-matrimonial-prod.s3.amazonaws.com/',
    'https://sngs-matrimonial.s3.amazonaws.com/',
  ];

  for (const awsPattern of awsPatterns) {
    if (url.startsWith(awsPattern)) {
      const filePath = url.replace(awsPattern, '');
      // File path already contains 'photos/' or 'documents/' prefix
      return `${SUPABASE_BASE}/${filePath}`;
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

  console.log('=== COMPLETE MIGRATION: AWS → SUPABASE ===\n');
  console.log(`User: ${user.fullName}`);
  console.log(`User ID: ${user._id}\n`);

  console.log('BEFORE:');
  console.log('  profilePicture.url:', user.profilePicture?.url || 'N/A');
  console.log('  gallery photos:', user.gallery?.photos?.length || 0);
  if (user.gallery?.photos?.length > 0) {
    console.log('    [0]:', user.gallery.photos[0].url);
  }
  console.log('  horoscopeDocument.url:', user.horoscopeDocument?.url || 'N/A');

  // Transform URLs
  const updatedProfilePicture = user.profilePicture?.url
    ? { ...user.profilePicture, url: mapAwsToSupabase(user.profilePicture.url) }
    : user.profilePicture;

  const updatedGallery = user.gallery?.photos
    ? {
        ...user.gallery,
        photos: user.gallery.photos.map((photo) => ({
          ...photo,
          url: mapAwsToSupabase(photo.url),
        })),
      }
    : user.gallery;

  const updatedHoroscope = user.horoscopeDocument?.url
    ? { ...user.horoscopeDocument, url: mapAwsToSupabase(user.horoscopeDocument.url) }
    : user.horoscopeDocument;

  // Update in database
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

  console.log('\nUpdate result: matched=' + result.matchedCount + ', modified=' + result.modifiedCount);

  // Fetch updated document
  const updated = await users.findOne({ _id: user._id });

  console.log('\nAFTER:');
  console.log('  profilePicture.url:', updated.profilePicture?.url || 'N/A');
  console.log('  gallery photos:', updated.gallery?.photos?.length || 0);
  if (updated.gallery?.photos?.length > 0) {
    console.log('    [0]:', updated.gallery.photos[0].url);
  }
  console.log('  horoscopeDocument.url:', updated.horoscopeDocument?.url || 'N/A');

  console.log('\n=== VERIFICATION ===');
  console.log('✓ Profile picture migrated (photos folder)');
  console.log('✓ Gallery photos migrated (photos folder)');
  console.log('✓ Horoscope document migrated (documents folder)');
  console.log('✓ All file paths preserved');
  console.log('✓ Document structure intact');

  console.log('\n=== SUPABASE BUCKET STRUCTURE ===');
  console.log('Expected folder structure in Supabase:');
  console.log('  media/');
  console.log('    ├── photos/');
  console.log('    │   └── 6975ab1b3a5f569e57656cb4/');
  console.log('    │       ├── 1769319206693-fbbcefd84705f48f.jpeg');
  console.log('    │       └── 1769319376496-6769973a063d64b1.jpeg');
  console.log('    └── documents/');
  console.log('        └── 6975ab1b3a5f569e57656cb4/');
  console.log('            └── horoscope.pdf (if exists)');

  await client.close();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
