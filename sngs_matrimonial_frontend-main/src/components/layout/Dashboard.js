'use client';

import { useState, useEffect } from 'react';
import { LogOut, User, Heart, Compass, MessageCircle, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLandingStore } from '@/store/landingStore';
import useChatStore from '@/store/chatStore';
import BrowseProfiles from '@/components/profile/BrowseProfiles';
import LikedProfiles from '@/components/profile/LikedProfiles';
import UserProfileView from '@/components/profile/UserProfileView';
import ChatLayout from '@/components/chat/ChatLayout';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { activeTab, setActiveTab, selectedChatUserId } = useLandingStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSettingsClick = () => {
    setActiveTab('settings');
    router.push('/profiles/settings');
  };

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

          {/* Welcome Message */}
          <div className="hidden md:flex items-center gap-2">
            <span className="font-maven text-gray-600">Welcome,</span>
            <span className="font-viga text-secondary">{user?.fullName}</span>
          </div>

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
            {/* Browse Tab */}
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'browse'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white hover:text-gray-300'
              }`}
            >
              <Compass size={20} />
              <span className="hidden sm:inline">Browse</span>
            </button>

            {/* Liked Tab */}
            <button
              onClick={() => setActiveTab('liked')}
              className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'liked'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white hover:text-gray-300'
              }`}
            >
              <Heart size={20} />
              <span className="hidden sm:inline">Liked</span>
            </button>

            {/* Messages Tab */}
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'messages'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white hover:text-gray-300'
              }`}
            >
              <MessageCircle size={20} />
              <span className="hidden sm:inline">Messages</span>
            </button>

            {/* Profile Tab */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white hover:text-gray-300'
              }`}
            >
              <User size={20} />
              <span className="hidden sm:inline">My Profile</span>
            </button>

            {/* Settings Tab */}
            <button
              onClick={handleSettingsClick}
              className={`py-4 font-telex font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white hover:text-gray-300'
              }`}
            >
              <Settings size={20} />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white pt-32">
        {activeTab === 'browse' && <BrowseProfiles />}
        {activeTab === 'liked' && <LikedProfiles />}
        {activeTab === 'messages' && <ChatLayout initialUserId={selectedChatUserId} />}
        {activeTab === 'profile' && <UserProfileView />}
      </div>
    </div>
  );
}
