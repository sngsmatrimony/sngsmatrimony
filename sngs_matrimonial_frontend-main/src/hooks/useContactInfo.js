'use client';

import { useQuery } from '@tanstack/react-query';
import client from '@/lib/api/client';

export function useContactInfo() {
  return useQuery({
    queryKey: ['contactInfo'],
    queryFn: async () => {
      const response = await client.get('/api/settings/contact-info');
      return response.data.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 24 * 60 * 60 * 1000, // 24 hour cache retention
    retry: 2,
    // Defaults if fetch fails
    placeholderData: {
      contactEmail: 'info@sngsmatrimonial.com',
      contactMobile: '9876543210',
    },
  });
}
