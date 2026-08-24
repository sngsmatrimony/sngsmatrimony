'use client';

import { useState, useEffect } from 'react';
import { LogOut, User, Heart, Compass, MessageCircle, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLandingStore } from '@/store/landingStore';
import HelpButton from '@/components/layout/HelpButton';
import ApprovalStatusBanner from '@/components/layout/ApprovalStatusBanner';
import { SocketProvider } from '@/contexts/SocketContext';

export default function UserLayout({ children }) {
  const { user, logout, initializeAuth, token, membership, canAccessFullApp } = useAuthStore();
  const { setActiveTab } = useLandingStore(); // Keep updating store for backward compatibility if needed, or remove later

  // Check if user can access full app features
  const hasFullAccess = canAccessFullApp();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initTimeout, setInitTimeout] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };
    init();
  }, [initializeAuth]);

  // Timeout safety net: redirect to login if init takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn('[Dashboard] Auth init timeout - redirecting to login');
        setInitTimeout(true);
        router.push('/login');
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timeout);
  }, [isInitialized, router]);

  useEffect(() => {
    if (isInitialized && !token) {
      router.push('/login');
    }
  }, [isInitialized, token, router]);

  // Sync pathname to activeTab for store consistency if needed elsewhere
  useEffect(() => {
    if (pathname.includes('/browse')) setActiveTab('browse');
    else if (pathname.includes('/liked')) setActiveTab('liked');
    else if (pathname.includes('/messages')) setActiveTab('messages');
    else if (pathname.includes('/profile')) setActiveTab('profile');
    else if (pathname.includes('/settings')) setActiveTab('settings');
  }, [pathname, setActiveTab]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`);

  // PROMOTIONAL: Credits and membership display commented out during promotional period
  // const userCredits = membership?.credits ?? user?.membership?.credits ?? 0;
  // const showCredits = userCredits > 0 && !pathname.includes('/settings');
  // const showGetMembership = !showCredits && user && !pathname.includes('/settings');

  // Show loader while initializing (unless timeout reached)
  if ((!isInitialized && !initTimeout) || !token) {
     return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-primary animate-spin"></div>
          <p className="font-maven text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <Image
              src="/logo.jpeg"
              alt="SNGS Matrimonial Logo"
              width={48}
              height={48}
              className="h-12 w-auto"
              style={{ width: 'auto', height: 'auto' }}
            />
            <h1 className="font-viga text-2xl text-accent hidden sm:block">
              SNGS Matrimonial
            </h1>
          </Link>

          {/* Welcome Message and Credits */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-maven text-gray-600">Welcome,</span>
              <span className="font-viga text-secondary">{user?.fullName}</span>
            </div>
            {/* PROMOTIONAL: Credits display and Get Membership button commented out during promotional period
            {showCredits && (
              <div className="flex items-center bg-primary/10 px-3 py-1.5 rounded-full">
                <span className="font-telex text-sm font-semibold text-secondary">
                  {userCredits} {userCredits === 1 ? 'Credit' : 'Credits'}
                </span>
              </div>
            )}
            {showGetMembership && (
              <Link
                href="/membership/purchase"
                className="bg-primary hover:bg-primary/90 px-4 py-1.5 rounded-full font-telex text-sm font-semibold text-black transition-colors"
              >
                Get Membership
              </Link>
            )}
            */}
          </div>

          {/* PROMOTIONAL: Mobile credits and Get Membership commented out during promotional period
          {showCredits && (
            <div className="flex md:hidden items-center bg-primary/10 px-2 py-1 rounded-full mr-2">
              <span className="font-telex text-xs font-semibold text-secondary">{userCredits} {userCredits === 1 ? 'Credit' : 'Credits'}</span>
            </div>
          )}
          {showGetMembership && (
            <Link
              href="/membership/purchase"
              className="flex md:hidden bg-primary hover:bg-primary/90 px-3 py-1 rounded-full font-telex text-xs font-semibold text-black transition-colors mr-2"
            >
              Get Membership
            </Link>
          )}
          */}

          {/* Help Button */}
          <HelpButton />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-telex"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-black border-b border-gray-900 pt-2 fixed top-16 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 overflow-x-auto">
            {/* Browse Tab - Requires approval */}
            {hasFullAccess && (
              <Link
                href="/browse"
                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive('/browse')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white hover:text-gray-300'
                }`}
              >
                <Compass size={20} />
                <span className="hidden sm:inline">Browse</span>
              </Link>
            )}

            {/* Liked Tab - Requires approval */}
            {hasFullAccess && (
              <Link
                href="/liked"
                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive('/liked')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white hover:text-gray-300'
                }`}
              >
                <Heart size={20} />
                <span className="hidden sm:inline">Liked</span>
              </Link>
            )}

            {/* Messages Tab - Requires approval */}
            {hasFullAccess && (
              <Link
                href="/messages"
                className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive('/messages')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white hover:text-gray-300'
                }`}
              >
                <MessageCircle size={20} />
                <span className="hidden sm:inline">Messages</span>
              </Link>
            )}

            {/* Profile Tab - Always visible */}
            <Link
              href="/profile"
              className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive('/profile')
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white hover:text-gray-300'
              }`}
            >
              <User size={20} />
              <span className="hidden sm:inline">My Profile</span>
            </Link>

             {/* Settings Tab - Always visible */}
            <Link
              href="/settings"
              className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive('/settings')
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white hover:text-gray-300'
              }`}
            >
              <Settings size={20} />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white pt-32">
        <ApprovalStatusBanner />
        <SocketProvider>
          {children}
        </SocketProvider>
      </div>
    </div>
  );
}
