'use client';

import { useState, useRef, useCallback } from 'react';
import { toastSuccess, toastError, toastInfo } from '@/lib/toast';

/**
 * Custom hook for generating profile PDF downloads
 * Uses dynamic import to load PDF libraries only when needed
 * @returns {Object} - { printRef, isGenerating, downloadPDF }
 */
export const useProfilePdf = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef(null);

  const downloadPDF = useCallback(async (fullName, horoscopeDocument = null) => {
    console.log('[PDF Hook] downloadPDF called with:', { fullName, horoscopeDocument });

    if (!printRef.current) {
      toastError('Unable to generate PDF. Please try again.');
      return;
    }

    if (isGenerating) {
      toastInfo('PDF generation already in progress...');
      return;
    }

    setIsGenerating(true);

    // Show appropriate message based on whether horoscope will be included
    if (horoscopeDocument?.url) {
      toastInfo('Generating PDF with horoscope... This may take a few seconds.');
    } else {
      toastInfo('Generating PDF... This may take a few seconds.');
    }

    try {
      // Dynamic import to reduce initial bundle size
      const { generateProfilePDF } = await import('@/lib/pdf/profilePdfGenerator');

      // Pass horoscope data to the generator
      const horoscopeData = horoscopeDocument?.url ? {
        url: horoscopeDocument.url,
        fileType: horoscopeDocument.fileType,
      } : null;

      console.log('[PDF Hook] horoscopeData to pass:', horoscopeData);

      await generateProfilePDF(printRef.current, fullName, horoscopeData);

      if (horoscopeData) {
        toastSuccess('Profile PDF with horoscope downloaded successfully!');
      } else {
        toastSuccess('Profile PDF downloaded successfully!');
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      toastError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating]);

  return {
    printRef,
    isGenerating,
    downloadPDF,
  };
};

export default useProfilePdf;
