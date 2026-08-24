'use client';

import { useEffect } from 'react';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export default function AdminLoginLayout({ children }) {
  // Initialize auth store on mount, but don't require authentication for this layout
  useEffect(() => {
    useAdminAuthStore.getState().initializeAuth();
  }, []);

  return children;
}
