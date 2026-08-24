/**
 * Horoscope document utilities for PDF generation
 * Handles fetching, type detection, and processing of horoscope documents
 */

/**
 * Fetches a horoscope document via the proxy (to avoid CORS issues)
 * @param {string} url - The horoscope document URL
 * @returns {Promise<{ blob: Blob, contentType: string } | null>}
 */
export const fetchHoroscopeDocument = async (url) => {
  console.log('[Horoscope] fetchHoroscopeDocument called with:', url);

  if (!url) {
    console.log('[Horoscope] No URL provided, returning null');
    return null;
  }

  try {
    // Use the document-proxy API route for horoscope files
    const proxyUrl = `/api/document-proxy?url=${encodeURIComponent(url)}`;
    console.log('[Horoscope] Fetching via proxy:', proxyUrl);

    const response = await fetch(proxyUrl);
    console.log('[Horoscope] Proxy response status:', response.status);

    if (!response.ok) {
      console.warn('[Horoscope] Failed to fetch horoscope document:', response.status);
      return null;
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || '';
    console.log('[Horoscope] Fetch success:', { contentType, blobSize: blob.size });

    return { blob, contentType };
  } catch (error) {
    console.error('[Horoscope] Error fetching horoscope document:', error);
    return null;
  }
};

/**
 * Determines if a file is a PDF based on content type, file extension, and backend-provided type
 * @param {string} contentType - MIME type
 * @param {string} url - File URL
 * @param {string} fileType - Backend-provided file type ('pdf' | 'image')
 * @returns {boolean}
 */
export const isPdfDocument = (contentType, url, fileType) => {
  // Trust the backend-provided fileType first (if it exists)
  if (fileType === 'pdf') return true;
  if (fileType === 'image') return false;

  // Check content type
  if (contentType?.includes('application/pdf')) return true;
  if (contentType?.includes('image/')) return false;

  // Parse URL for extension (handle S3 signed URLs with query params)
  if (url) {
    // Remove query params before checking extension
    const urlPath = url.split('?')[0].toLowerCase();
    if (urlPath.endsWith('.pdf')) return true;
    if (urlPath.match(/\.(jpg|jpeg|png|gif|webp)$/)) return false;
  }

  // Default to false (treat as image) since images are more common for horoscopes
  return false;
};

/**
 * Converts a blob to a base64 data URL
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>}
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Converts a blob to ArrayBuffer
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<ArrayBuffer>}
 */
export const blobToArrayBuffer = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

/**
 * Gets image dimensions from a base64 data URL
 * @param {string} base64 - The base64 image data URL
 * @returns {Promise<{ width: number, height: number }>}
 */
export const getImageDimensions = (base64) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = base64;
  });
};
