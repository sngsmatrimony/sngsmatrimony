'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { toastError, toastSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import ProfileDetailView from '@/components/profile/ProfileDetailView';

export default function ProfileViewPage() {
  const router = useRouter();
  const params = useParams();
  const { membership, refreshMembership } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creditsDeducted, setCreditsDeducted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [params.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await client.get(`/api/profiles/${params.id}`);
      setProfile(response.data.data);
      setCreditsDeducted(response.data.data.creditsDeducted || false);

      if (response.data.data.creditsDeducted && process.env.NEXT_PUBLIC_PROMOTIONAL_MODE !== 'true') {
        await refreshMembership();
        toastSuccess('1 credit deducted for viewing this profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);

      if (error.response?.data?.requiresCredits) {
        setError('insufficient-credits');
        toastError(error.response.data.message || 'Insufficient credits to view this profile');
        setTimeout(() => {
          router.push('/membership/purchase');
        }, 1500);
      } else if (error.response?.data?.requiresMembership) {
        setError('no-membership');
        toastError(error.response.data.message || 'Membership required to view profiles');
        setTimeout(() => {
          router.push('/membership/purchase');
        }, 1500);
      } else if (error.response?.status === 404) {
        setError('not-found');
        toastError('Profile not found');
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        setError('fetch-error');
        toastError('Failed to load profile');
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="font-maven text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="font-maven text-lg text-secondary mb-6">
            {error === 'not-found' && 'Profile not found'}
            {error === 'insufficient-credits' && 'You do not have enough credits'}
            {error === 'no-membership' && 'You need an active membership'}
            {!error && 'Failed to load profile'}
          </p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="font-telex"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileDetailView profileId={params.id} />
      </div>
    </div>
  );
}
