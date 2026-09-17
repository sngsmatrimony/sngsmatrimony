const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
require('dotenv').config({ path: path.resolve(__dirname, '../../backend_env.txt') });
require('dotenv').config();

global.WebSocket = WebSocket;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'media';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend_env.txt');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket },
});

const baseDir = path.resolve(__dirname, '../../scripts/missing_user_aws_media/manual_push/photos');

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

async function main() {
  if (!fs.existsSync(baseDir)) {
    throw new Error(`Missing folder: ${baseDir}`);
  }

  const userDirs = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  let uploaded = 0;
  let failed = 0;

  for (const userId of userDirs) {
    const userFolder = path.join(baseDir, userId);
    const files = fs.readdirSync(userFolder).filter((file) => {
      const fullPath = path.join(userFolder, file);
      return fs.statSync(fullPath).isFile();
    });

    for (const file of files) {
      const source = path.join(userFolder, file);
      const storageKey = `photos/${userId}/${file}`;
      const buffer = fs.readFileSync(source);
      const contentType = getContentType(file);

      const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(storageKey, buffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        console.error('UPLOAD_FAIL', storageKey, error.message);
        failed += 1;
      } else {
        console.log('UPLOADED', storageKey);
        uploaded += 1;
      }
    }
  }

  console.log(`TOTAL_UPLOADED=${uploaded}`);
  console.log(`TOTAL_FAILED=${failed}`);
}

main().catch((error) => {
  console.error('Fatal:', error);
  process.exit(1);
});
