import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import {
  fetchHoroscopeDocument,
  isPdfDocument,
  blobToBase64,
  blobToArrayBuffer,
  getImageDimensions,
} from './horoscopeUtils';

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - (MARGIN_MM * 2);
const PAGE_CONTENT_HEIGHT_MM = A4_HEIGHT_MM - (MARGIN_MM * 2);
const HEADER_HEIGHT_MM = 18; // Space for two-row header including margin below

/**
 * Formats current date as "24 Jan 2026"
 */
const formatHeaderDate = () => {
  return new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Draws the page header with branding, date, profile name and page numbers
 * @param {jsPDF} pdf - The jsPDF instance
 * @param {string} fullName - The profile's full name
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 */
const drawPageHeader = (pdf, fullName, currentPage, totalPages) => {
  // Row 1: SNGS Matrimonial | Generated date
  const row1Y = 7;

  // Left: SNGS Matrimonial (bold)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0); // Black
  pdf.text('SNGS Matrimonial', MARGIN_MM, row1Y);

  // Right: Generated date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const dateText = `Generated: ${formatHeaderDate()}`;
  const dateTextWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, A4_WIDTH_MM - MARGIN_MM - dateTextWidth, row1Y);

  // Row 2: Full name | Page X of Y
  const row2Y = 13;

  // Left: Full name (bold)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(fullName || 'Profile', MARGIN_MM, row2Y);

  // Right: Page X of Y
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const pageText = `Page ${currentPage} of ${totalPages}`;
  const pageTextWidth = pdf.getTextWidth(pageText);
  pdf.text(pageText, A4_WIDTH_MM - MARGIN_MM - pageTextWidth, row2Y);

  // Bottom border line
  pdf.setDrawColor(229, 231, 235); // #E5E7EB gray-200
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN_MM, row2Y + 3, A4_WIDTH_MM - MARGIN_MM, row2Y + 3);
};

/**
 * Converts an image URL to base64 using the backend proxy to avoid CORS issues
 * @param {string} url - The image URL to convert
 * @returns {Promise<string|null>} - Base64 data URL or null if failed
 */
const imageToBase64ViaProxy = async (url) => {
  // Skip if already base64 or no URL
  if (!url || url.startsWith('data:')) {
    return url;
  }

  // Skip local/relative URLs - they don't need proxy
  if (url.startsWith('/') || url.startsWith('blob:')) {
    return url;
  }

  try {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      console.warn('Image proxy failed for:', url, response.status);
      return null;
    }

    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => {
        console.warn('FileReader failed for:', url);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to convert image via proxy:', url, error);
    return null;
  }
};

/**
 * Converts all images in an element to base64 via proxy to avoid CORS issues
 * Handles both <img> elements and CSS background-image properties
 * @param {HTMLElement} element - The element containing images
 * @returns {Promise<void>}
 */
const convertImagesToBase64 = async (element) => {
  // Handle <img> elements
  const images = element.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(async (img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const base64 = await imageToBase64ViaProxy(src);
        if (base64) {
          img.src = base64;
        }
      }
    })
  );

  // Handle elements with background-image
  const allElements = element.querySelectorAll('*');
  await Promise.all(
    Array.from(allElements).map(async (el) => {
      const bgImage = el.style.backgroundImage;
      if (bgImage && bgImage.startsWith('url(')) {
        // Extract URL from url("...") or url('...') or url(...)
        const urlMatch = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/);
        if (urlMatch && urlMatch[1] && !urlMatch[1].startsWith('data:')) {
          const base64 = await imageToBase64ViaProxy(urlMatch[1]);
          if (base64) {
            el.style.backgroundImage = `url(${base64})`;
          }
        }
      }
    })
  );

  // Wait for browser to update
  await new Promise(resolve => setTimeout(resolve, 200));
};

/**
 * Adds a horoscope image as a new page in the PDF
 * @param {jsPDF} pdf - The jsPDF instance
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} fullName - Profile name for header
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 */
const addHoroscopeImagePage = async (pdf, imageBase64, fullName, currentPage, totalPages) => {
  pdf.addPage();

  // Draw header for horoscope page
  drawPageHeader(pdf, fullName, currentPage, totalPages);

  // Add "Horoscope" title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Horoscope Document', MARGIN_MM, MARGIN_MM + HEADER_HEIGHT_MM + 5);

  // Calculate available space for image
  const contentStartY = MARGIN_MM + HEADER_HEIGHT_MM + 15;
  const availableWidth = CONTENT_WIDTH_MM;
  const availableHeight = PAGE_CONTENT_HEIGHT_MM - HEADER_HEIGHT_MM - 15;

  // Determine image format from base64 header
  let imgFormat = 'JPEG';
  if (imageBase64.includes('data:image/png')) {
    imgFormat = 'PNG';
  }

  try {
    // Get actual image dimensions to maintain aspect ratio
    const dimensions = await getImageDimensions(imageBase64);

    // Calculate scaled dimensions maintaining aspect ratio
    const aspectRatio = dimensions.width / dimensions.height;
    let imgWidth = availableWidth;
    let imgHeight = imgWidth / aspectRatio;

    // If height exceeds available space, scale by height instead
    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = imgHeight * aspectRatio;
    }

    // Center the image horizontally
    const xOffset = MARGIN_MM + (availableWidth - imgWidth) / 2;

    pdf.addImage(imageBase64, imgFormat, xOffset, contentStartY, imgWidth, imgHeight);
  } catch (error) {
    console.error('Failed to add horoscope image to PDF:', error);
    // Add error message instead
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Horoscope image could not be loaded.', MARGIN_MM, contentStartY + 10);
  }
};

/**
 * Merges an external PDF with the generated profile PDF using pdf-lib
 * @param {jsPDF} profilePdf - The generated profile PDF (jsPDF instance)
 * @param {ArrayBuffer} horoscopePdfBuffer - The horoscope PDF as ArrayBuffer
 * @returns {Promise<Uint8Array>} - Merged PDF as Uint8Array
 */
const mergeWithHoroscopePdf = async (profilePdf, horoscopePdfBuffer) => {
  try {
    // Get the profile PDF as ArrayBuffer
    const profilePdfArrayBuffer = profilePdf.output('arraybuffer');

    // Load both PDFs using pdf-lib
    const profileDoc = await PDFDocument.load(profilePdfArrayBuffer);
    const horoscopeDoc = await PDFDocument.load(horoscopePdfBuffer);

    // Get all pages from horoscope PDF
    const horoscopePages = await profileDoc.copyPages(
      horoscopeDoc,
      horoscopeDoc.getPageIndices()
    );

    // Add each horoscope page to the profile PDF
    horoscopePages.forEach((page) => {
      profileDoc.addPage(page);
    });

    // Return the merged PDF as Uint8Array
    return await profileDoc.save();
  } catch (error) {
    console.error('Failed to merge PDFs:', error);
    // Return original profile PDF if merge fails
    return new Uint8Array(profilePdf.output('arraybuffer'));
  }
};

/**
 * Adds padding to prevent sections from being cut at page boundaries
 * Works with top-level children of the container to handle nested grid layouts
 * @param {HTMLElement} element - The element to modify
 */
const addPageBreakPadding = (element) => {
  // Calculate page height in pixels
  // 794px width corresponds to A4 width (190mm content area)
  const elementWidth = 794;
  const pxPerMm = elementWidth / CONTENT_WIDTH_MM;
  const pageHeightPx = (PAGE_CONTENT_HEIGHT_MM - HEADER_HEIGHT_MM) * pxPerMm;

  // Get all top-level children (these are the main sections that flow vertically)
  const children = Array.from(element.children);

  // Run multiple passes since adding margin shifts subsequent sections
  for (let pass = 0; pass < 3; pass++) {
    let cumulativeHeight = 0;

    for (const child of children) {
      const childHeight = child.offsetHeight;

      // Calculate where the next page boundary is
      const currentPage = Math.floor(cumulativeHeight / pageHeightPx);
      const currentPageEnd = (currentPage + 1) * pageHeightPx;

      // Check if this child would be cut across the page boundary
      const wouldBeCut = cumulativeHeight + childHeight > currentPageEnd && cumulativeHeight < currentPageEnd;

      // If child would be cut and is small enough to fit on one page
      if (wouldBeCut && childHeight < pageHeightPx * 0.85) {
        // Add padding to push to next page
        const paddingNeeded = currentPageEnd - cumulativeHeight + 10;
        const currentMargin = parseInt(child.style.marginTop) || 0;
        child.style.marginTop = `${currentMargin + paddingNeeded}px`;
        cumulativeHeight = currentPageEnd + paddingNeeded + childHeight;
      } else {
        cumulativeHeight += childHeight;
      }
    }
  }
};

/**
 * Generates a PDF from a profile element
 * @param {HTMLElement} element - The DOM element to capture
 * @param {string} fullName - The profile's full name for filename
 * @param {Object} horoscopeData - Optional horoscope document data { url, fileType }
 * @returns {Promise<{ success: boolean }>}
 */
export const generateProfilePDF = async (element, fullName, horoscopeData = null) => {
  if (!element) {
    throw new Error('No element provided for PDF generation');
  }

  let clone = null;

  try {
    // Clone the element so we don't modify the original
    clone = element.cloneNode(true);

    // Position clone off-screen but keep it visible so html2canvas can capture it
    // Note: visibility: hidden causes html2canvas to render nothing
    clone.style.cssText = `
      position: absolute !important;
      left: -9999px !important;
      top: 0 !important;
      width: 794px !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: none !important;
    `;

    document.body.appendChild(clone);

    // Convert all images to base64 via proxy to avoid CORS issues
    await convertImagesToBase64(clone);

    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Add page break padding to prevent sections from being cut
    addPageBreakPadding(clone);

    // Wait for layout to settle after adding padding
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture the element as canvas with high quality settings
    // Note: useCORS is not needed since images are now base64
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher quality (2x resolution)
      backgroundColor: '#FFFFFF',
      logging: false,
      imageTimeout: 30000, // 30 seconds timeout for images
      windowWidth: 794, // Match the print view width
      onclone: (clonedDoc) => {
        // Ensure all fonts are loaded in the cloned document
        const clonedElement = clonedDoc.body.querySelector('[data-pdf-content]') || clonedDoc.body.firstElementChild;
        if (clonedElement) {
          clonedElement.style.fontSmooth = 'always';
        }
      },
    });

    // Remove the clone
    if (clone && clone.parentNode) {
      document.body.removeChild(clone);
      clone = null;
    }

    // Calculate dimensions using constants
    const imgWidth = CONTENT_WIDTH_MM;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Calculate content area per page (accounting for header)
    const contentHeightPerPage = PAGE_CONTENT_HEIGHT_MM - HEADER_HEIGHT_MM;

    // Calculate content height in pixels for slicing
    const contentHeightPx = (contentHeightPerPage * canvas.width) / imgWidth;

    // Calculate total pages needed
    const totalPages = Math.ceil(canvas.height / contentHeightPx);

    // Add pages with headers and sliced content
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      if (currentPage > 1) {
        pdf.addPage();
      }

      // Draw header first (before content so it's not covered)
      drawPageHeader(pdf, fullName, currentPage, totalPages);

      // Calculate source slice coordinates in pixels
      const sourceY = (currentPage - 1) * contentHeightPx;
      const sliceHeight = Math.min(contentHeightPx, canvas.height - sourceY);

      // Create a new canvas for this page's content slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext('2d');

      // Draw the slice from source canvas
      ctx.drawImage(
        canvas,
        0, sourceY,                    // source x, y
        canvas.width, sliceHeight,     // source width, height
        0, 0,                          // dest x, y
        canvas.width, sliceHeight      // dest width, height
      );

      // Convert slice to image data
      const sliceImgData = pageCanvas.toDataURL('image/jpeg', 0.92);

      // Calculate slice dimensions in mm
      const sliceHeightMm = (sliceHeight * imgWidth) / canvas.width;

      // Add sliced image below header
      const contentStartY = MARGIN_MM + HEADER_HEIGHT_MM;
      pdf.addImage(sliceImgData, 'JPEG', MARGIN_MM, contentStartY, imgWidth, sliceHeightMm);
    }

    // Handle horoscope document if available
    if (horoscopeData?.url) {
      console.log('[PDF] Processing horoscope:', { url: horoscopeData.url, fileType: horoscopeData.fileType });

      try {
        const docResult = await fetchHoroscopeDocument(horoscopeData.url);
        console.log('[PDF] Horoscope fetch result:', docResult ? 'success' : 'null');

        if (docResult) {
          const { blob, contentType } = docResult;
          console.log('[PDF] Horoscope details:', { contentType, blobSize: blob.size });

          const isPdf = isPdfDocument(contentType, horoscopeData.url, horoscopeData.fileType);
          console.log('[PDF] Is PDF document:', isPdf);

          if (isPdf) {
            // Merge horoscope PDF with profile PDF
            console.log('[PDF] Merging horoscope PDF with profile PDF');
            const horoscopeBuffer = await blobToArrayBuffer(blob);
            const mergedPdfBytes = await mergeWithHoroscopePdf(pdf, horoscopeBuffer);
            console.log('[PDF] PDF merge complete, merged size:', mergedPdfBytes.length);

            // Create blob and trigger download
            const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const downloadUrl = URL.createObjectURL(mergedBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = formatPdfFilename(fullName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            return { success: true };
          } else {
            // Add horoscope image as a new page
            console.log('[PDF] Adding horoscope image as new page');
            const imageBase64 = await blobToBase64(blob);
            await addHoroscopeImagePage(pdf, imageBase64, fullName, totalPages + 1, totalPages + 1);
            console.log('[PDF] Horoscope image page added successfully');
          }
        } else {
          console.warn('[PDF] Horoscope fetch returned null - document may not exist or failed to load');
        }
      } catch (horoscopeError) {
        console.error('[PDF] Failed to add horoscope to PDF:', horoscopeError);
        // Continue with profile-only PDF
      }
    } else {
      console.log('[PDF] No horoscope document to include');
    }

    // Generate filename: replace spaces with underscores, add suffix
    const filename = formatPdfFilename(fullName);

    // Trigger download
    pdf.save(filename);

    return { success: true };
  } catch (error) {
    // Clean up clone on error
    if (clone && clone.parentNode) {
      document.body.removeChild(clone);
    }
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};

/**
 * Formats the PDF filename according to spec
 * @param {string} fullName - The full name of the profile
 * @returns {string} - Formatted filename
 */
export const formatPdfFilename = (fullName) => {
  if (!fullName) {
    return 'profile.pdf';
  }
  // Replace spaces with underscores, remove special characters, add suffix
  const sanitizedName = fullName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '');
  return `${sanitizedName}_profile.pdf`;
};
