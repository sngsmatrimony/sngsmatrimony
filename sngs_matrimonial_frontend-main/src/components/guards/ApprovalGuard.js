'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toastWarning } from '@/lib/toast';

/**
 * ApprovalGuard - Protects routes that require approved status
 * Redirects unapproved users to /profile with a toast notification
 */
export default function ApprovalGuard({ children }) {
  const { canAccessFullApp, isPending, isRejected, user } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for user data to be loaded
    if (!user) {
      return;
    }

    const hasAccess = canAccessFullApp();

    if (!hasAccess) {
      // Show appropriate message based on status
      if (isPending()) {
        toastWarning('Your profile is under review. You can access this feature once approved.');
      } else if (isRejected()) {
        toastWarning('Please update your profile to regain access to this feature.');
      } else {
        toastWarning('Access restricted. Please complete your profile verification.');
      }

      // Redirect to profile page
      router.replace('/profile');
    } else {
      setIsChecking(false);
    }
  }, [user, canAccessFullApp, isPending, isRejected, router]);

  // Show loading spinner while checking access
  if (isChecking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-primary animate-spin"></div>
          <p className="font-maven text-secondary text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
