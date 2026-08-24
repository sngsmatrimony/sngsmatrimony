const { MongoClient } = require('mongodb');
const path = require('path');

const backendEnvPath = path.resolve(__dirname, 'backend_env.txt');
require('dotenv').config({ path: backendEnvPath });
require('dotenv').config();

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!uri) {
  console.error('Missing MONGODB_URI or DATABASE_URL in environment variables.');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');

    const docs = await users.find(
      {
        $or: [
          { 'profilePicture.url': { $regex: 'amazonaws.com|s3.amazonaws.com' } },
          { 'gallery.photos.url': { $regex: 'amazonaws.com|s3.amazonaws.com' } },
          { 'horoscopeDocument.url': { $regex: 'amazonaws.com|s3.amazonaws.com' } },
        ],
      },
      {
        projection: {
          _id: 1,
          fullName: 1,
          email: 1,
          profilePicture: 1,
          gallery: 1,
          horoscopeDocument: 1,
        },
      }
    ).toArray();

    console.log(`Found ${docs.length} users with AWS-hosted media URLs\n`);

    for (const user of docs) {
      const awsUrls = [];

      if (user.profilePicture?.url && /amazonaws\.com|s3\.amazonaws\.com/.test(user.profilePicture.url)) {
        awsUrls.push({ field: 'profilePicture', url: user.profilePicture.url });
      }

      if (Array.isArray(user.gallery?.photos)) {
        for (const photo of user.gallery.photos) {
          if (photo?.url && /amazonaws\.com|s3\.amazonaws\.com/.test(photo.url)) {
            awsUrls.push({ field: 'gallery', url: photo.url });
          }
        }
      }

      if (user.horoscopeDocument?.url && /amazonaws\.com|s3\.amazonaws\.com/.test(user.horoscopeDocument.url)) {
        awsUrls.push({ field: 'horoscopeDocument', url: user.horoscopeDocument.url });
      }

      if (awsUrls.length) {
        console.log(`User: ${user.fullName || user.email || String(user._id)}`);
        for (const item of awsUrls) {
          console.log(`  - ${item.field}: ${item.url}`);
        }
        console.log('');
      }
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
