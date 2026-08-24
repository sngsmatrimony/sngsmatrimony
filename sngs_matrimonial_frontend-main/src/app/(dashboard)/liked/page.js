'use client';

import LikedProfiles from '@/components/profile/LikedProfiles';
import ApprovalGuard from '@/components/guards/ApprovalGuard';

export default function LikedPage() {
  return (
    <ApprovalGuard>
      <LikedProfiles />
    </ApprovalGuard>
  );
}
