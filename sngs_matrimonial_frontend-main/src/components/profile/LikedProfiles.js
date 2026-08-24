'use client';

import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import ProfileCard from './ProfileCard';

export default function LikedProfiles() {
  const { data: likedProfilesData, isLoading, error } = useQuery({
    queryKey: ['likedProfiles'],
    queryFn: async () => {
      const response = await client.get('/api/profiles/liked');
      return response.data.data || [];
    },
    onError: (err) => {
      console.error('Error fetching liked profiles:', err);
      toastError('Failed to load liked profiles');
    }
  });

  // Use React Query cache directly - it's updated by useLikeMutation optimistic updates
  const displayProfiles = likedProfilesData || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary mx-auto mb-4" />
          <p className="font-maven text-secondary">Loading liked profiles...</p>
        </div>
      </div>
    );
  }

  if (!displayProfiles || displayProfiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-maven text-lg text-secondary mb-2">
            No liked profiles yet
          </p>
          <p className="font-telex text-sm text-gray-500">
            Start liking profiles to save them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-viga text-3xl mb-2 text-secondary">
          Liked Profiles
        </h2>
        <p className="font-telex text-sm text-gray-500 mb-8">
          {displayProfiles.length} profile{displayProfiles.length !== 1 ? 's' : ''}
        </p>

        {/* Grid of liked profile cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProfiles.map((profile) => (
            <ProfileCard
              key={profile._id}
              profile={profile}
              isLiked={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
