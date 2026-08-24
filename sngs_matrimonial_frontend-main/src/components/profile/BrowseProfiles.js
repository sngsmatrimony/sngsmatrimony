'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import ProfileCard from './ProfileCard';

export default function BrowseProfiles() {
  const router = useRouter();
  const { membership } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['browseProfiles'],
    queryFn: async () => {
      const [profilesRes, likedRes] = await Promise.all([
        client.get('/api/profiles/discover'),
        client.get('/api/profiles/liked'),
      ]);

      const profiles = profilesRes.data.data || [];
      const likedIds = likedRes.data.data?.map((p) => p._id) || [];

      return { profiles, likedIds };
    },
    onError: (err) => {
      console.error('Error fetching profiles:', err);
      if (err.response?.data?.requiresMembership) {
        toastError(err.response.data.message);
        router.push('/membership/purchase');
      } else if (err.response?.data?.requiresCredits) {
        toastError(err.response.data.message);
        router.push('/membership/purchase');
      } else {
        toastError('Failed to load profiles');
      }
    }
  });

  // Use React Query cache directly - it's updated by useLikeMutation optimistic updates
  const profilesData = data?.profiles || [];
  const likedIdsData = data?.likedIds || [];

  // Use Set for O(1) lookup instead of O(n) array.includes()
  const likedIdsSet = useMemo(() => new Set(likedIdsData), [likedIdsData]); 

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary mx-auto mb-4" />
          <p className="font-maven text-secondary">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (!profilesData || profilesData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-maven text-lg text-secondary mb-4">
            No profiles found matching your preferences
          </p>
          <p className="font-telex text-sm text-gray-500">
            Try adjusting your search preferences
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-viga text-3xl text-secondary">
            Browse Profiles
          </h2>
        </div>

        {/* Grid of profile cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profilesData.map((profile) => (
            <ProfileCard
              key={profile._id}
              profile={profile}
              isLiked={likedIdsSet.has(profile._id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
