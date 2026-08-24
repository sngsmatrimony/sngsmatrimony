'use client';

import { useState } from 'react';
import { Clock, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError } from '@/lib/toast';

export default function ApprovalStatusBanner() {
  const { isPending, isRejected, getLatestRejectionReason, refreshUser } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const user = await refreshUser();
      if (user?.approvalStatus === 'approved') {
        toastSuccess('Your profile has been approved! You now have full access.');
        window.location.reload();
      } else if (user?.approvalStatus === 'pending') {
        toastSuccess('Status checked. Your profile is still under review.');
      } else if (user?.approvalStatus === 'rejected') {
        toastError('Your profile requires updates. Please review the feedback below.');
      }
    } catch {
      toastError('Failed to check status. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Don't show banner if approved
  if (!isPending() && !isRejected()) {
    return null;
  }

  const rejectionReason = getLatestRejectionReason();

  // Pending status banner
  if (isPending()) {
    return (
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-viga text-amber-800 text-sm sm:text-base">
                  Profile Under Review
                </p>
                <p className="font-maven text-amber-700 text-xs sm:text-sm mt-1">
                  Your profile is being reviewed by our team. You can access your Profile and Settings while we verify your information.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800 font-telex whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Check Status'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Rejected status banner
  if (isRejected()) {
    return (
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-viga text-red-800 text-sm sm:text-base">
                    Action Required
                  </p>
                  <p className="font-maven text-red-700 text-xs sm:text-sm mt-1">
                    Your profile needs updates before it can be approved. Please review the feedback and edit your profile.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800 font-telex whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Checking...' : 'Recheck'}
              </Button>
            </div>

            {rejectionReason && (
              <div className="ml-8 p-3 bg-red-100 rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-telex text-red-800 text-xs font-medium mb-1">
                      Admin Feedback:
                    </p>
                    <p className="font-maven text-red-700 text-sm">
                      {rejectionReason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
