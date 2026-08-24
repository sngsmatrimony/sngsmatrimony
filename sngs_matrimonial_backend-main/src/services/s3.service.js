const { S3Client, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'media';
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const createSupabaseClient = () => createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: WebSocket } }
);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'sngs-matrimonial';

const generateUniqueFileName = (originalName, userId, type = 'photos') => {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName).toLowerCase();
  return `${type}/${userId}/${timestamp}-${randomId}${extension}`;
};

const isImageFile = (file) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png'];
  return allowedMimeTypes.includes(file.mimetype);
};

const photoFileFilter = (req, file, cb) => {
  if (isImageFile(file)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG) are allowed'), false);
  }
};

const isDocumentFile = (file) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  return allowedMimeTypes.includes(file.mimetype);
};

const documentFileFilter = (req, file, cb) => {
  if (isDocumentFile(file)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF or image files are allowed for horoscope documents'), false);
  }
};

const createSupabaseUploadMiddleware = ({ folder, fileFilter, maxFileSize }) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: maxFileSize },
  });

  return {
    single(fieldName) {
      return (req, res, next) => {
        upload.single(fieldName)(req, res, async (error) => {
          if (error) return next(error);
          if (!req.file) return next();

          try {
            const userId = req.user?.id || 'anonymous';
            const fileName = generateUniqueFileName(req.file.originalname, userId, folder);
            const supabase = createSupabaseClient();

            const { error: uploadError } = await supabase.storage
              .from(SUPABASE_BUCKET)
              .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true,
              });

            if (uploadError) {
              throw uploadError;
            }

            const publicUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_BUCKET}/${fileName}`;
            req.file.location = publicUrl;
            req.file.url = publicUrl;
            req.file.key = fileName;
            next();
          } catch (uploadError) {
            next(uploadError);
          }
        });
      };
    },
  };
};

const photoUpload = USE_SUPABASE
  ? createSupabaseUploadMiddleware({
      folder: 'photos',
      fileFilter: photoFileFilter,
      maxFileSize: 10 * 1024 * 1024,
    })
  : multer({
      storage: multerS3({
        s3: s3Client,
        bucket: BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
          const fileName = generateUniqueFileName(file.originalname, req.user.id, 'photos');
          cb(null, fileName);
        },
        metadata: (req, file, cb) => {
          cb(null, {
            userId: req.user.id,
            uploadedAt: new Date().toISOString(),
            originalName: file.originalname,
          });
        },
      }),
      fileFilter: photoFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    });

const documentUpload = USE_SUPABASE
  ? createSupabaseUploadMiddleware({
      folder: 'documents',
      fileFilter: documentFileFilter,
      maxFileSize: 5 * 1024 * 1024,
    })
  : multer({
      storage: multerS3({
        s3: s3Client,
        bucket: BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
          const fileName = generateUniqueFileName(file.originalname, req.user.id, 'documents');
          cb(null, fileName);
        },
        metadata: (req, file, cb) => {
          cb(null, {
            userId: req.user.id,
            uploadedAt: new Date().toISOString(),
            originalName: file.originalname,
            documentType: 'horoscope',
          });
        },
      }),
      fileFilter: documentFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    });

const deleteFile = async (fileKey) => {
  try {
    if (USE_SUPABASE) {
      const supabase = createSupabaseClient();
      const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([fileKey]);
      if (error) throw error;
      return true;
    }

    const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
    await s3Client.send(command);
    return true;
  } catch (error) {
    const provider = USE_SUPABASE ? 'Supabase' : 'S3';
    console.error(`Error deleting file from ${provider}:`, error);
    throw new Error(`Failed to delete file from ${provider}`);
  }
};

const getPublicUrl = (fileKey) => {
  if (USE_SUPABASE) {
    return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_BUCKET}/${fileKey}`;
  }

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileKey}`;
};

const extractKeyFromUrl = (url) => {
  if (!url) return null;

  if (USE_SUPABASE) {
    const base = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_BUCKET}/`;
    if (url.startsWith(base)) {
      return decodeURIComponent(url.substring(base.length));
    }
    return null;
  }

  const bucketUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/`;
  if (url.startsWith(bucketUrl)) {
    return url.substring(bucketUrl.length);
  }
  return null;
};

const downloadFileFromS3 = async (fileKey) => {
  try {
    if (USE_SUPABASE) {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download(fileKey);
      if (error) throw error;
      return data;
    }

    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
    const response = await s3Client.send(command);
    return response.Body;
  } catch (error) {
    const provider = USE_SUPABASE ? 'Supabase' : 'S3';
    console.error(`Error downloading file from ${provider}:`, error);
    throw new Error(`Failed to download file from ${provider}`);
  }
};

module.exports = {
  s3Client,
  photoUpload,
  documentUpload,
  deleteFile,
  getPublicUrl,
  extractKeyFromUrl,
  downloadFileFromS3,
  generateUniqueFileName,
  isImageFile,
  isDocumentFile,
  BUCKET_NAME,
  USE_SUPABASE,
  SUPABASE_BUCKET,
};
