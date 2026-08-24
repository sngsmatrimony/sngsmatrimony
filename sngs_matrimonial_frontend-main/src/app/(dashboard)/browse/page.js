'use client';

import BrowseProfiles from '@/components/profile/BrowseProfiles';
import ApprovalGuard from '@/components/guards/ApprovalGuard';

export default function BrowsePage() {
  return (
    <ApprovalGuard>
      <BrowseProfiles />
    </ApprovalGuard>
  );
}
