'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SocketProvider, useSocket } from '@/contexts/SocketContext';
import Header from '@/components/layout/Header';
import ChatLayout from '@/components/chat/ChatLayout';

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuthStore();
  const { isConnected } = useSocket();

  // Get userId from URL params if provided
  const userIdFromParams = searchParams.get('userId');

  if (authLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-medium" style={{ fontFamily: 'Maven Pro' }}>
            Loading chat...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive mb-4" style={{ fontFamily: 'Maven Pro' }}>
            Not authenticated
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md"
            style={{ fontFamily: 'Telex' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header showLogout={true} />
      <div className="flex-1 overflow-hidden">
        <ChatLayout initialUserId={userIdFromParams} />
      </div>
    </div>
  );
}

/**
 * Wrapper component that provides socket context for the standalone /chat page
 */
function ChatPageWithSocket() {
  return (
    <SocketProvider>
      <ChatPageContent />
    </SocketProvider>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-screen bg-white">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-medium" style={{ fontFamily: 'Maven Pro' }}>
              Loading chat...
            </p>
          </div>
        </div>
      }
    >
      <ChatPageWithSocket />
    </Suspense>
  );
}
