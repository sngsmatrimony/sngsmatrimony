'use client';

import ChatLayout from '@/components/chat/ChatLayout';
import { useLandingStore } from '@/store/landingStore';
import ApprovalGuard from '@/components/guards/ApprovalGuard';

export default function MessagesPage() {
  const { selectedChatUserId } = useLandingStore();

  return (
    <ApprovalGuard>
      <ChatLayout initialUserId={selectedChatUserId} />
    </ApprovalGuard>
  );
}
