'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Lock } from 'lucide-react';
import { useLandingStore } from '@/store/landingStore';
import { useAuthStore } from '@/store/authStore';
import { useLikeMutation } from '@/hooks/useLikeMutation';
import { toastInfo } from '@/lib/toast';

function ProfileCard({ profile, isLiked = false }) {
  // All hooks must be called before any early returns
  const router = useRouter();
  const { membership } = useAuthStore();
  const { setSelectedChatUserId } = useLandingStore();
  const { toggleLike, isLoading } = useLikeMutation();
  const [isHovered, setIsHovered] = useState(false);

  // Check if user has no membership or expired/no credits (bypassed in promotional mode)
  const isPromotional = process.env.NEXT_PUBLIC_PROMOTIONAL_MODE === 'true';
  const hasNoMembership = isPromotional ? false : (!membership?.isActive || membership?.isExpired || membership?.credits <= 0);

  // Define callbacks before early return (React hooks rule)
  const handleLike = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // Guard against invalid profile
    if (!profile?._id) return;

    // Prevent double-clicks while loading
    if (isLoading) return;

    // Use the mutation hook - it handles optimistic updates, rollback, and cache sync
    toggleLike(profile._id, profile, isLiked);
  }, [isLoading, profile, isLiked, toggleLike]);

  const handleChat = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?._id) return;
    setSelectedChatUserId(profile._id);
    router.push('/messages');
  }, [profile, setSelectedChatUserId, router]);

  const handleCardClick = useCallback((e) => {
    if (hasNoMembership) {
      e.preventDefault();
      e.stopPropagation();
      toastInfo('Get membership to view full profiles');
    }
    // If has membership, let Link handle navigation naturally
  }, [hasNoMembership]);

  // Validate profile data (after hooks)
  if (!profile || !profile._id || profile._id === 'undefined' || profile._id === 'null') {
    return null;
  }

  // Helper function to route external image URLs through proxy to avoid CORS issues
  const getProxiedImageUrl = (url) => {
    if (!url) return null;
    // Check if URL is from S3 or Supabase (external sources)
    if (url.includes('amazonaws.com') || url.includes('supabase.co')) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Get profile picture URL
  const rawProfileImageUrl =
    profile?.profilePicture?.url || '/images/default-profile.png';

  const profileImageUrl = getProxiedImageUrl(rawProfileImageUrl) || '/images/default-profile.png';

  // Get profile picture as background
  const profilePictureBackground = {
    backgroundImage: `url(${profileImageUrl})`,
    backgroundColor: '#e5e7eb' // fallback gray
  };

  return (
    <Link
      href={`/profiles/${profile._id}`}
      onClick={handleCardClick}
      aria-disabled={hasNoMembership}
      className={hasNoMembership ? 'cursor-not-allowed' : ''}
    >
      <div
        className={`relative h-96 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
          hasNoMembership
            ? 'cursor-not-allowed opacity-90 hover:opacity-100 hover:shadow-lg'
            : 'cursor-pointer hover:shadow-2xl'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Profile Picture Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 hover:scale-105"
        style={profilePictureBackground}
      />

      {/* Dark overlay on hover */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isHovered ? 'opacity-60' : 'opacity-0'
        }`}
      />

      {/* Gradient overlay at bottom for text readability */}
      {!isHovered && (
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-black via-black/60 to-transparent z-10" />
      )}

      {/* Status Badges */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {hasNoMembership && (
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-xl animate-pulse">
            <Lock className="w-4 h-4" />
          </div>
        )}

      </div>

      {/* Profile Info - Always visible when not hovered */}
      {!isHovered && (
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10 text-white space-y-1">
          <p className="font-telex text-sm text-gray-200">
            {profile.dateOfBirth
              ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'DOB not available'}
          </p>
          {profile.nakshatra && (
            <p className="font-telex text-sm text-gray-300">
              {profile.nakshatra}
            </p>
          )}
        </div>
      )}

      {/* Hover Action Buttons Only */}
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center gap-6 z-20">
          {/* Chat Button */}
          <button
            onClick={handleChat}
            className="transition-all duration-200 hover:scale-110 rounded-full p-2"
            aria-label="Send message"
            title="Send message"
          >
            <MessageCircle
              size={40}
              className="stroke-white fill-none transition-all duration-200"
            />
          </button>

          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`transition-all duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            aria-label="Like profile"
          >
            <Heart
              size={40}
              className={`${
                isLiked
                  ? 'fill-red-500 stroke-red-500'
                  : 'stroke-white fill-none'
              } transition-all duration-200`}
            />
          </button>
        </div>
      )}

      </div>
    </Link>
  );
}

// Memoize to prevent unnecessary re-renders when parent state changes
export default memo(ProfileCard);
