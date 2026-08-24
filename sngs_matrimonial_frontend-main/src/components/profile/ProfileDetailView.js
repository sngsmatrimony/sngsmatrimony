'use client';

import { useEffect, useState, useCallback } from 'react';
import { Heart, MessageCircle, MapPin, Briefcase, Book, Users, FileText, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLandingStore } from '@/store/landingStore';
import { useLikeMutation } from '@/hooks/useLikeMutation';
import Header from '@/components/layout/Header';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import { useProfilePdf } from '@/hooks/useProfilePdf';
import ProfilePrintView from '@/components/profile/ProfilePrintView';

// Information Card Component
const InfoCard = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow ${className}`}>
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={24} className="text-primary" />}
      <h3 className="font-viga text-xl text-secondary">{title}</h3>
    </div>
    {children}
  </div>
);

// Info Field Component
const InfoField = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={16} className="text-secondary/60" />}
      <span className="font-telex text-secondary/70 text-sm">{label}</span>
    </div>
    <span className="font-maven text-secondary font-medium">{value || '—'}</span>
  </div>
);

// Download handler for horoscope with authentication
const handleDownloadHoroscope = async (userId) => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');

    if (!token) {
      toastError('Authentication required. Please log in.');
      return;
    }

    // Fetch file with authentication header
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/profiles/${userId}/horoscope/download`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      toastError(error.message || 'Failed to download horoscope');
      return;
    }

    // Get filename from Content-Disposition header or extract from URL
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);

    let filename;
    if (filenameMatch) {
      // Use filename from Content-Disposition header
      filename = filenameMatch[1];
    } else {
      // Fallback: Extract extension from URL
      const url = response.url;
      const urlExtension = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
      const safeExtension = urlExtension || 'pdf';
      filename = `horoscope.${safeExtension}`;
    }

    // Convert response to blob
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Download error:', error);
    toastError('Failed to download horoscope document');
  }
};

// Convert 24-hour format (HH:mm) to 12-hour format with AM/PM
const formatTimeToAMPM = (time24) => {
  if (!time24) return null;
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function ProfileDetailView({ profileId }) {
  const router = useRouter();
  const { setSelectedChatUserId } = useLandingStore();
  const { toggleLike, isLoading: isLikeLoading } = useLikeMutation();
  const { printRef, isGenerating, downloadPDF } = useProfilePdf();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  const fetchProfile = useCallback(async () => {
    // Validate profileId before making API call
    if (!profileId || profileId === 'undefined' || profileId === 'null') {
      console.error('Invalid profile ID:', profileId);
      toastError('Invalid profile ID');
      router.push('/');
      return;
    }

    setIsLoading(true);
    try {
      const response = await client.get(`/api/profiles/${profileId}`);
      setProfile(response.data.data);
      // Check if profile is already liked
      setLiked(response.data.data?.isLiked || false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toastError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [profileId, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLike = () => {
    // Use the mutation hook - handles API call, cache updates, and toast notifications
    toggleLike(profileId, profile, liked);
    // Update local state for immediate UI feedback
    setLiked(!liked);
  };

  const handleChat = () => {
    setSelectedChatUserId(profileId);
    router.push('/messages');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary mx-auto mb-4" />
          <p className="font-maven text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-maven text-lg text-secondary mb-4">
            Unable to load profile
          </p>
          <Link href="/" className="text-primary hover:text-accent">
            Go back home
          </Link>
        </div>
      </div>
    );
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

  // Get banner style
  const bannerStyle = {
    backgroundColor: profile?.profileBanner?.bannerColor || '#FFB3BA'
  };

  const profileImageUrl = getProxiedImageUrl(profile?.profilePicture?.url);

  return (
    <div className="min-h-screen bg-white">
      <Header showLogout={true} />
      {/* Profile Banner with overlay buttons */}
      <div
        className="w-full h-64 bg-cover bg-center relative"
        style={bannerStyle}
      >
        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-4 left-4 bg-black/70 hover:bg-black text-white rounded-full p-2 transition-all duration-200 flex items-center justify-center z-40"
          aria-label="Go back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-40">
          {/* Chat Button */}
          <button
            onClick={handleChat}
            className="bg-white/90 hover:bg-white rounded-full p-2 transition-all duration-200 flex items-center justify-center hover:scale-110"
            aria-label="Send message"
            title="Send message"
          >
            <MessageCircle
              size={28}
              className="stroke-secondary fill-none transition-all duration-200"
            />
          </button>

          {/* Download PDF Button */}
          <button
            onClick={() => downloadPDF(profile?.fullName, profile?.horoscopeDocument)}
            disabled={isGenerating}
            className={`bg-white/90 hover:bg-white rounded-full p-2 transition-all duration-200 flex items-center justify-center ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            aria-label="Download profile PDF"
            title="Download profile as PDF"
          >
            {isGenerating ? (
              <Loader2 size={28} className="stroke-secondary animate-spin" />
            ) : (
              <Download size={28} className="stroke-secondary" />
            )}
          </button>

          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLikeLoading}
            className={`bg-white/90 hover:bg-white rounded-full p-2 transition-all duration-200 flex items-center justify-center ${
              isLikeLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            aria-label="Like profile"
          >
            <Heart
              size={28}
              className={`${
                liked
                  ? 'fill-red-500 stroke-red-500'
                  : 'stroke-secondary fill-none'
              } transition-all duration-200`}
            />
          </button>
        </div>
      </div>

      {/* Profile Header - Overlapped */}
      <div className="px-4 md:px-8">
        <div className="max-w-4xl mx-auto -mt-16 relative z-10 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Picture */}
            <div className="relative w-40 h-40 rounded-2xl border-4 border-white overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
              {profileImageUrl ? (
                <Image
                  src={profileImageUrl}
                  alt={profile?.fullName || 'Profile'}
                  fill
                  className="object-cover"
                  sizes="160px"
                  unoptimized
                />
              ) : (
                <div className="text-center text-gray-400 font-maven text-sm">No Image</div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 pt-4">
              <h1 className="font-viga text-4xl text-secondary mb-2">
                {profile?.fullName}
              </h1>
              <p className="font-telex text-secondary mb-4">
                Age: {profile?.age} • Gender: {profile?.gender[0].toUpperCase() + profile?.gender.slice(1)}
              </p>

              {/* About Myself */}
              {profile?.profileAbout && (
                <div className="mb-6">
                  <h3 className="font-viga text-lg text-secondary mb-2">
                    About
                  </h3>
                  <p className="font-maven text-gray-700 leading-relaxed">{profile.profileAbout}</p>
                </div>
              )}

              {/* Seeking Preferences */}
              {(profile?.seekingGender || profile?.ageFrom || profile?.ageTo) && (
                <p className="font-telex text-sm text-secondary/70">
                  Seeking: <span className="font-maven text-secondary">{profile?.seekingGender}</span> |
                  Age: <span className="font-maven text-secondary">{profile?.ageFrom}-{profile?.ageTo}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information Cards */}
        <div className="max-w-4xl mx-auto">
          {/* Contact Information Card */}
          {(profile?.mobileNumber || profile?.alternateMobileNumber) && (
            <InfoCard title="Contact Information" className="mb-6">
              {profile?.mobileNumber && (
                <InfoField label="Mobile Number" value={`+91 ${profile.mobileNumber}`} />
              )}
              {profile?.alternateMobileNumber && (
                <InfoField label="Alternate Mobile Number" value={`+91 ${profile.alternateMobileNumber}`} />
              )}
            </InfoCard>
          )}

          {/* Personal Details Card */}
          {(profile?.motherTongue || profile?.height || profile?.physicalStatus || profile?.maritalStatus || profile?.complexion || profile?.diet || profile?.weight || profile?.bloodGroup || profile?.familyStatus) && (
            <InfoCard title="💑 Personal Details" className="mb-6">
              <InfoField label="Mother Tongue" value={profile?.motherTongue} />
              <InfoField label="Height" value={profile?.height} />
              <InfoField label="Weight" value={profile?.weight ? `${profile.weight} kg` : null} />
              <InfoField label="Physical Status" value={profile?.physicalStatus} />
              <InfoField label="Blood Group" value={profile?.bloodGroup} />
              <InfoField label="Marital Status" value={profile?.maritalStatus} />
              {profile?.complexion && <InfoField label="Complexion" value={profile.complexion} />}
              {profile?.diet && <InfoField label="Diet" value={profile.diet} />}
              {profile?.familyStatus && <InfoField label="Family Status" value={profile.familyStatus} />}
            </InfoCard>
          )}

          {/* Languages Known Card */}
          {profile?.languagesKnown && profile.languagesKnown.length > 0 && (
            <InfoCard title="🗣️ Languages Known" className="mb-6">
              <div className="flex flex-wrap gap-2">
                {profile.languagesKnown.map((language, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-800 font-maven text-sm px-3 py-1 rounded-full"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </InfoCard>
          )}

          {/* Birth Details Card */}
          {(profile?.dateOfBirth || profile?.timeOfBirth || profile?.placeOfBirth || profile?.nakshatra || profile?.raasi || profile?.shuddhaJathakam || profile?.doshamTypes) && (
            <InfoCard title="💫 Birth Details" className="mb-6">
              {profile?.dateOfBirth && (
                <InfoField
                  label="Date of Birth"
                  value={new Date(profile.dateOfBirth).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                />
              )}
              {profile?.timeOfBirth && (
                <InfoField
                  label="Time of Birth"
                  value={formatTimeToAMPM(profile.timeOfBirth)}
                />
              )}
              {profile?.nakshatra && <InfoField label="Star" value={profile.nakshatra} />}
              {profile?.raasi && <InfoField label="Raasi" value={profile.raasi} />}
              {profile?.shuddhaJathakam && <InfoField label="Shuddha Jathakam" value={profile.shuddhaJathakam} />}
              {profile?.doshamTypes && profile.doshamTypes.length > 0 && (
                <div className="py-2 border-b border-gray-100">
                  <span className="font-telex text-secondary/70 text-sm block mb-2">Dosham</span>
                  <div className="flex flex-wrap gap-2">
                    {profile.doshamTypes.map((dosham, idx) => (
                      <span key={idx} className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                        {dosham}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile?.placeOfBirth && <InfoField label="Place of Birth" value={profile.placeOfBirth} />}
              {profile?.horoscopeDocument?.url && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="font-telex text-secondary/70 text-sm">Horoscope Document</span>
                  <div className="flex gap-3">
                    <a
                      href={profile.horoscopeDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary font-maven text-sm underline"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDownloadHoroscope(profileId)}
                      className="text-secondary font-maven text-sm underline cursor-pointer bg-transparent border-0 p-0 hover:text-secondary/80"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </InfoCard>
          )}

          {/* Religion & Location Card */}
          {(profile?.religion || profile?.caste || profile?.country || profile?.state || profile?.city) && (
            <InfoCard title="🙏 Religion & Location" icon={MapPin} className="mb-6">
              <InfoField label="Religion" value={profile?.religion} />
              {profile?.caste && <InfoField label="Caste" value={profile.caste} />}
            </InfoCard>
          )}

          {/* Professional Information Card */}
          {(profile?.education || profile?.employmentType || profile?.occupation || profile?.annualIncome || profile?.professionalAdditionalInfo) && (
            <InfoCard title="💼 Professional" icon={Briefcase} className="mb-6">
              <InfoField label="Education" value={profile?.education} />
              <InfoField label="Employment Type" value={profile?.employmentType} />
              <InfoField label="Occupation" value={profile?.occupation} />
              {profile?.annualIncome && (
                <InfoField
                  label="Annual Income"
                  value={profile.annualIncome.displayText || `${profile.annualIncome.currency} ${profile.annualIncome.min?.toLocaleString()}-${profile.annualIncome.max?.toLocaleString()}`}
                />
              )}
              {profile?.professionalAdditionalInfo && (
                <div className="py-3 border-b border-gray-100 last:border-0">
                  <span className="font-telex text-secondary/70 text-sm block mb-2">Additional Information</span>
                  <p className="font-maven text-secondary whitespace-pre-line">{profile.professionalAdditionalInfo}</p>
                </div>
              )}
            </InfoCard>
          )}

          {/* Address Information Card */}
          {(profile?.residentialStatus || (profile?.presentResidentialAddress && Object.values(profile.presentResidentialAddress).some(v => v)) ||
            (profile?.nativePlaceAddress && Object.values(profile.nativePlaceAddress).some(v => v))) && (
            <InfoCard title="📍 Address Information" className="mb-6">
              {profile?.residentialStatus && <InfoField label="Residential Status" value={profile.residentialStatus} />}
              {profile?.presentResidentialAddress && Object.values(profile.presentResidentialAddress).some(v => v) && (
                <div className="py-3 border-b border-gray-100">
                  <span className="font-telex text-secondary/70 text-sm block mb-2">Present Residential Address</span>
                  <span className="font-maven text-secondary">
                    {[
                      profile.presentResidentialAddress.street,
                      profile.presentResidentialAddress.area,
                      profile.presentResidentialAddress.landmark,
                      profile.presentResidentialAddress.city,
                      profile.presentResidentialAddress.state,
                      profile.presentResidentialAddress.country,
                      profile.presentResidentialAddress.pincode,
                    ].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              )}
              {profile?.nativePlaceAddress && Object.values(profile.nativePlaceAddress).some(v => v) && (
                <div className="py-3">
                  <span className="font-telex text-secondary/70 text-sm block mb-2">Native Place Address</span>
                  <span className="font-maven text-secondary">
                    {[
                      profile.nativePlaceAddress.street,
                      profile.nativePlaceAddress.area,
                      profile.nativePlaceAddress.landmark,
                      profile.nativePlaceAddress.city,
                      profile.nativePlaceAddress.state,
                      profile.nativePlaceAddress.country,
                      profile.nativePlaceAddress.pincode,
                    ].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              )}
            </InfoCard>
          )}

          {/* Family Details Card */}
          {(profile?.fatherName || profile?.fatherOccupation || profile?.motherName || profile?.motherOccupation) && (
            <InfoCard title="👨‍👩‍👧‍👦 Family Details" icon={Users} className="mb-6">
              {profile?.fatherName && <InfoField label="Father's Name" value={profile.fatherName} />}
              {profile?.fatherOccupation && <InfoField label="Father's Occupation" value={profile.fatherOccupation} />}
              {profile?.motherName && <InfoField label="Mother's Name" value={profile.motherName} />}
              {profile?.motherOccupation && <InfoField label="Mother's Occupation" value={profile.motherOccupation} />}
            </InfoCard>
          )}

          {/* Interests Section */}
          {profile?.interests && profile.interests.length > 0 && (
            <InfoCard title="⭐ Interests" className="mb-6">
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="bg-primary text-black font-telex text-sm px-4 py-2 rounded-full hover:bg-accent transition-colors"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </InfoCard>
          )}

          {/* Photos Gallery */}
          {profile?.gallery?.photos && profile.gallery.photos.length > 0 && (
            <div className="mb-8">
              <h3 className="font-viga text-2xl text-secondary mb-4 flex items-center gap-2">
                📸 Photos ({profile.gallery.photos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.gallery.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 hover:shadow-lg transition-shadow group"
                  >
                    <Image
                      src={getProxiedImageUrl(photo.url)}
                      alt={`Photo ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer spacing */}
      <div className="h-16" />

      {/* Hidden PDF Print Container - positioned off-screen */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '794px',
        }}
        aria-hidden="true"
      >
        <ProfilePrintView ref={printRef} profile={profile} />
      </div>
    </div>
  );
}
