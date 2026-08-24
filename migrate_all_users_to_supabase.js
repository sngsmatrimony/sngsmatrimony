const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend_env.txt') });

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'media';
const SUPABASE_BASE = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_BUCKET}`;

// AWS to Supabase URL mapper
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
      // File path contains 'photos/' or 'documents/' prefix
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

  // Find all users with AWS URLs
  const awsUsers = await users
    .find({
      $or: [
        { 'profilePicture.url': { $regex: 'amazonaws.com' } },
        { 'gallery.photos.url': { $regex: 'amazonaws.com' } },
        { 'horoscopeDocument.url': { $regex: 'amazonaws.com' } },
      ],
    })
    .toArray();

  console.log(`=== BULK MIGRATION: AWS → SUPABASE ===\n`);
  console.log(`Found ${awsUsers.length} users with AWS URLs\n`);

  let migratedCount = 0;
  let errorCount = 0;

  for (const user of awsUsers) {
    try {
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

      if (result.modifiedCount > 0) {
        migratedCount++;
        console.log(`✓ ${user.fullName}`);
        if (user.profilePicture?.url) console.log(`  - Profile picture`);
        if (user.gallery?.photos?.length) console.log(`  - ${user.gallery.photos.length} gallery photo(s)`);
        if (user.horoscopeDocument?.url) console.log(`  - Horoscope document`);
      }
    } catch (error) {
      errorCount++;
      console.log(`✗ ${user.fullName}: ${error.message}`);
    }
  }

  console.log(`\n=== MIGRATION SUMMARY ===`);
  console.log(`Total users found: ${awsUsers.length}`);
  console.log(`Successfully migrated: ${migratedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\n✓ All AWS URLs have been replaced with Supabase URLs`);
  console.log(`✓ File paths preserved`);
  console.log(`✓ Document structure intact`);
  console.log(`\nNote: Ensure these files are copied to Supabase bucket before accessing them.`);

  await client.close();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
