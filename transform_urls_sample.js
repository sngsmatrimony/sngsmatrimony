const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend_env.txt') });

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
      const path = url.replace(awsPattern, '');
      return `${SUPABASE_BASE}/${path}`;
    }
  }

  return url;
}

// Transform user document
function transformUserDocument(user) {
  const transformed = { ...user };

  // Transform profilePicture
  if (transformed.profilePicture && transformed.profilePicture.url) {
    transformed.profilePicture.url = mapAwsToSupabase(transformed.profilePicture.url);
  }

  // Transform gallery photos
  if (transformed.gallery && Array.isArray(transformed.gallery.photos)) {
    transformed.gallery.photos = transformed.gallery.photos.map((photo) => ({
      ...photo,
      url: mapAwsToSupabase(photo.url),
    }));
  }

  // Transform horoscopeDocument
  if (transformed.horoscopeDocument && transformed.horoscopeDocument.url) {
    transformed.horoscopeDocument.url = mapAwsToSupabase(transformed.horoscopeDocument.url);
  }

  return transformed;
}

// Test with sample data
const sampleUser = {
  fullName: 'Saurabh Manoharan',
  profilePicture: {
    url: 'https://sngs-matrimonial-prod.s3.ap-south-1.amazonaws.com/photos/6975ab1b3a5f569e57656cb4/1769319206693-fbbcefd84705f48f.jpeg',
    uploadedAt: new Date('2026-01-29T18:27:37.414Z')
  },
  horoscopeDocument: {
    uploadedAt: new Date('2026-01-25T05:33:15.965Z')
  },
  gallery: {
    photos: [
      {
        url: 'https://sngs-matrimonial-prod.s3.ap-south-1.amazonaws.com/photos/6975ab1b3a5f569e57656cb4/1769319376496-6769973a063d64b1.jpeg',
        uploadedAt: new Date('2026-01-25T05:36:16.596Z'),
        _id: 'ObjectId("6975abd03a5f569e57656d0b")'
      }
    ]
  }
};

console.log('=== TRANSFORMATION TEST ===\n');
console.log('BEFORE:');
console.log('profilePicture.url:', sampleUser.profilePicture.url);
console.log('gallery.photos[0].url:', sampleUser.gallery.photos[0].url);

const transformed = transformUserDocument(sampleUser);

console.log('\nAFTER:');
console.log('profilePicture.url:', transformed.profilePicture.url);
console.log('gallery.photos[0].url:', transformed.gallery.photos[0].url);

console.log('\n=== URL MAPPING VERIFICATION ===');
console.log('AWS pattern preserved path:');
console.log('  photos/6975ab1b3a5f569e57656cb4/1769319206693-fbbcefd84705f48f.jpeg');
console.log('Supabase new URL:');
console.log('  ' + transformed.profilePicture.url.split('/storage/v1/object/public/media/')[1]);
