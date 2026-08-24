'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { toastSuccess, toastError } from '@/lib/toast';

/**
 * Custom hook for like/unlike mutations with optimistic updates.
 * Keeps Browse page, Liked page, and Profile Detail page in sync instantly.
 *
 * Uses React Query as the single source of truth - no Zustand for like state.
 */
export function useLikeMutation() {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async ({ profileId, profile }) => {
      await client.post(`/api/profiles/${profileId}/like`);
      return { profileId, profile };
    },
    onMutate: async ({ profileId, profile }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['likedProfiles'] });
      await queryClient.cancelQueries({ queryKey: ['browseProfiles'] });

      // Snapshot the previous values for rollback
      const previousLikedProfiles = queryClient.getQueryData(['likedProfiles']);
      const previousBrowseProfiles = queryClient.getQueryData(['browseProfiles']);

      // Optimistically update likedProfiles cache
      queryClient.setQueryData(['likedProfiles'], (old) => {
        if (!old) return [profile];
        // Check if already exists to avoid duplicates
        if (old.some(p => p._id === profileId)) return old;
        return [...old, profile];
      });

      // Optimistically update browseProfiles cache (update likedIds)
      queryClient.setQueryData(['browseProfiles'], (old) => {
        if (!old) return old;
        const newLikedIds = old.likedIds?.includes(profileId)
          ? old.likedIds
          : [...(old.likedIds || []), profileId];
        return { ...old, likedIds: newLikedIds };
      });

      return { previousLikedProfiles, previousBrowseProfiles };
    },
    onError: (err, { profileId }, context) => {
      // Rollback on error
      if (context?.previousLikedProfiles !== undefined) {
        queryClient.setQueryData(['likedProfiles'], context.previousLikedProfiles);
      }
      if (context?.previousBrowseProfiles !== undefined) {
        queryClient.setQueryData(['browseProfiles'], context.previousBrowseProfiles);
      }
      toastError(err.response?.data?.message || 'Error liking profile');
    },
    onSuccess: () => {
      toastSuccess('Profile liked!');
    },
    onSettled: () => {
      // Always refetch to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: ['likedProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['browseProfiles'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async ({ profileId }) => {
      await client.post(`/api/profiles/${profileId}/unlike`);
      return { profileId };
    },
    onMutate: async ({ profileId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['likedProfiles'] });
      await queryClient.cancelQueries({ queryKey: ['browseProfiles'] });

      // Snapshot previous values
      const previousLikedProfiles = queryClient.getQueryData(['likedProfiles']);
      const previousBrowseProfiles = queryClient.getQueryData(['browseProfiles']);

      // Optimistically remove from likedProfiles cache
      queryClient.setQueryData(['likedProfiles'], (old) => {
        if (!old) return old;
        return old.filter(p => p._id !== profileId);
      });

      // Optimistically update browseProfiles cache (remove from likedIds)
      queryClient.setQueryData(['browseProfiles'], (old) => {
        if (!old) return old;
        const newLikedIds = old.likedIds?.filter(id => id !== profileId) || [];
        return { ...old, likedIds: newLikedIds };
      });

      return { previousLikedProfiles, previousBrowseProfiles };
    },
    onError: (err, { profileId }, context) => {
      // Rollback on error
      if (context?.previousLikedProfiles !== undefined) {
        queryClient.setQueryData(['likedProfiles'], context.previousLikedProfiles);
      }
      if (context?.previousBrowseProfiles !== undefined) {
        queryClient.setQueryData(['browseProfiles'], context.previousBrowseProfiles);
      }
      toastError(err.response?.data?.message || 'Error removing like');
    },
    onSuccess: () => {
      toastSuccess('Profile removed from likes');
    },
    onSettled: () => {
      // Always refetch to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: ['likedProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['browseProfiles'] });
    },
  });

  /**
   * Toggle like status for a profile
   * @param {string} profileId - The profile ID to like/unlike
   * @param {object} profile - The full profile object (needed for adding to liked list)
   * @param {boolean} isCurrentlyLiked - Whether the profile is currently liked
   */
  const toggleLike = (profileId, profile, isCurrentlyLiked) => {
    if (isCurrentlyLiked) {
      unlikeMutation.mutate({ profileId });
    } else {
      likeMutation.mutate({ profileId, profile });
    }
  };

  /**
   * Check if a profile is liked using React Query cache
   * @param {string} profileId - The profile ID to check
   * @returns {boolean} - Whether the profile is liked
   */
  const isProfileLiked = (profileId) => {
    // First check browseProfiles cache (has likedIds array)
    const browseData = queryClient.getQueryData(['browseProfiles']);
    if (browseData?.likedIds?.includes(profileId)) {
      return true;
    }

    // Then check likedProfiles cache
    const likedData = queryClient.getQueryData(['likedProfiles']);
    if (likedData?.some(p => p._id === profileId)) {
      return true;
    }

    return false;
  };

  return {
    likeMutation,
    unlikeMutation,
    toggleLike,
    isProfileLiked,
    isLiking: likeMutation.isPending,
    isUnliking: unlikeMutation.isPending,
    isLoading: likeMutation.isPending || unlikeMutation.isPending,
  };
}
