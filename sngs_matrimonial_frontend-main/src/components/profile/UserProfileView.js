'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLandingStore } from '@/store/landingStore';
import { useAuthStore } from '@/store/authStore';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import EditProfileForm from './EditProfileForm';
import { Pencil, Briefcase, Users, FileText, AlertTriangle, RefreshCw } from 'lucide-react';

// Info Card Component
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
const InfoField = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="font-telex text-secondary/70 text-sm">{label}</span>
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

// Rejection Action Card Component
const RejectionActionCard = ({ reason, onEditProfile }) => (
  <div className="max-w-4xl mx-auto mb-6">
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-viga text-xl text-red-800 mb-2">
            Profile Update Required
          </h3>
          <p className="font-maven text-red-700 mb-4">
            Your profile was not approved. Please review the feedback below and update your profile. Once updated, your profile will be automatically resubmitted for review.
          </p>

          {reason && (
            <div className="bg-white rounded-lg p-4 border border-red-200 mb-4">
              <p className="font-telex text-red-800 text-sm font-medium mb-1">
                Admin Feedback:
              </p>
              <p className="font-maven text-gray-700">{reason}</p>
            </div>
          )}

          <Button
            onClick={onEditProfile}
            className="bg-red-600 hover:bg-red-700 text-white font-telex gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile Now
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export default function UserProfileView() {
  const { userProfile, setUserProfile, isLoading, setIsLoading } =
    useLandingStore();
  const { user, isRejected, getLatestRejectionReason } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(false);

  // Get rejection info
  const userIsRejected = isRejected();
  const rejectionReason = getLatestRejectionReason();

  /* Refactored to use useQuery */
  const { data: profileData, isLoading: isQueryLoading, error, refetch } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await client.get('/api/profiles/me/view');
      // console.log('Profile data received:', response.data.data);
      const data = response.data.data;
      // Sync with store
      setUserProfile(data);
      return data;
    },
    onError: (err) => {
      console.error('Error fetching user profile:', err);
      toastError('Failed to load your profile');
    }
  });

  const displayProfile = profileData || userProfile;  

  if (isQueryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary mx-auto mb-4" />
          <p className="font-maven text-secondary">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!displayProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-maven text-lg text-secondary">
            Unable to load profile
          </p>
        </div>
      </div>
    );
  }

  // Show edit form when in edit mode
  if (isEditMode) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <EditProfileForm
            userProfile={userProfile}
            user={user}
            onCancel={() => setIsEditMode(false)}
            onSuccess={() => {
              setIsEditMode(false);
              refetch();
            }}
          />
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
    backgroundColor: displayProfile?.profileBanner?.bannerColor || '#FFB3BA'
  };

  const profileImageUrl = getProxiedImageUrl(displayProfile?.profilePicture?.url);

  console.log('Using profile image URL:', profileImageUrl);

  return (
    <div className="px-4 md:px-8 py-8">
      {/* Rejection Action Card - Show for rejected users */}
      {userIsRejected && (
        <RejectionActionCard
          reason={rejectionReason}
          onEditProfile={() => setIsEditMode(true)}
        />
      )}

      {/* Profile Banner with Edit Button */}
      <div
        className="w-full h-64 bg-cover bg-center rounded-t-2xl relative mb-8 shadow-lg"
        style={bannerStyle}
      >
        <Button
          onClick={() => setIsEditMode(true)}
          className="absolute top-4 right-4 bg-primary hover:bg-accent text-black font-maven text-base gap-2"
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Header - Overlapped */}
      <div className="max-w-4xl mx-auto -mt-16 relative z-10 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Profile Picture */}
          <div className="relative w-40 h-40 rounded-2xl border-4 border-white overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={user?.fullName || 'Profile'}
                fill
                className="object-cover"
                sizes="160px"
                unoptimized
              />
            ) : (
              <div className="text-center text-gray-400 font-maven text-sm">
                No Photo
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 pt-4">
            <h1 className="font-viga text-4xl text-secondary mb-2">
              {user?.fullName}
            </h1>
            <p className="font-telex text-secondary mb-4">
              Age: {user?.age} • Gender: {user?.gender[0].toUpperCase() + user?.gender.slice(1)}
            </p>

            {/* About Myself */}
            {user?.profileAbout && (
              <div className="mb-6">
                <h3 className="font-viga text-lg text-secondary mb-2">
                  About
                </h3>
                <p className="font-maven text-gray-700 leading-relaxed">{user.profileAbout}</p>
              </div>
            )}

            {/* Seeking Preferences */}
            {(user?.seekingGender || user?.ageFrom || user?.ageTo) && (
              <p className="font-telex text-sm text-secondary/70">
                Seeking: <span className="font-maven text-secondary">{user?.seekingGender}</span> |
                Age: <span className="font-maven text-secondary">{user?.ageFrom}-{user?.ageTo}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information Cards */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Contact Information Card */}
        {(user?.mobileNumber || user?.alternateMobileNumber) && (
          <InfoCard
            title="📞 Contact Information"
            className="mb-6"
          >
            {user?.mobileNumber && (
              <InfoField label="Mobile Number" value={`+91 ${user.mobileNumber}`} />
            )}
            {user?.alternateMobileNumber && (
              <InfoField label="Alternate Mobile" value={`+91 ${user.alternateMobileNumber}`} />
            )}
          </InfoCard>
        )}

        {/* Personal Details Card */}
        {(user?.religion || user?.caste || user?.motherTongue || user?.maritalStatus || user?.height || user?.physicalStatus || user?.weight || user?.bloodGroup || user?.familyStatus || user?.diet || user?.complexion || user?.placeOfBirth) && (
          <InfoCard
            title="💑 Personal Details"
            className="mb-6"
          >
            {user?.religion && <InfoField label="Religion" value={user.religion} />}
            {user?.motherTongue && <InfoField label="Mother Tongue" value={user.motherTongue} />}
            {user?.caste && <InfoField label="Caste" value={user.caste} />}
            {user?.maritalStatus && <InfoField label="Marital Status" value={user.maritalStatus} />}
            {user?.height && <InfoField label="Height" value={user.height} />}
            {user?.weight && <InfoField label="Weight" value={`${user.weight} kg`} />}
            {user?.physicalStatus && <InfoField label="Physical Status" value={user.physicalStatus} />}
            {user?.bloodGroup && <InfoField label="Blood Group" value={user.bloodGroup} />}
            {user?.complexion && <InfoField label="Complexion" value={user.complexion} />}
            {user?.diet && <InfoField label="Diet" value={user.diet} />}
            {user?.placeOfBirth && <InfoField label="Place of Birth" value={user.placeOfBirth} />}
            {user?.familyStatus && <InfoField label="Family Status" value={user.familyStatus} />}
            {user?.isDivorcee && <InfoField label="Marital Status" value="Divorced" />}
          </InfoCard>
        )}

        {/* Languages Known Card */}
        {user?.languagesKnown && user.languagesKnown.length > 0 && (
          <InfoCard title="🗣️ Languages Known" className="mb-6">
            <div className="flex flex-wrap gap-2">
              {user.languagesKnown.map((language, idx) => (
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
        {(user?.dateOfBirth || user?.timeOfBirth || user?.nakshatra || user?.raasi || user?.shuddhaJathakam || user?.doshamTypes || displayProfile?.horoscopeDocument?.url) && (
          <InfoCard
            title="💫 Birth Details"
            className="mb-6"
          >
            {user?.dateOfBirth && (
              <InfoField
                label="Date of Birth"
                value={new Date(user.dateOfBirth).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              />
            )}
            {user?.timeOfBirth && (
              <InfoField
                label="Time of Birth"
                value={formatTimeToAMPM(user.timeOfBirth)}
              />
            )}
            {user?.nakshatra && <InfoField label="Star" value={user.nakshatra} />}
            {user?.raasi && <InfoField label="Raasi" value={user.raasi} />}
            {user?.shuddhaJathakam && <InfoField label="Shuddha Jathakam" value={user.shuddhaJathakam} />}
            {user?.doshamTypes && user.doshamTypes.length > 0 && (
              <div className="py-2 border-b border-gray-100">
                <span className="font-telex text-secondary/70 text-sm block mb-2">Dosham</span>
                <div className="flex flex-wrap gap-2">
                  {user.doshamTypes.map((dosham, idx) => (
                    <span key={idx} className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                      {dosham}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {displayProfile?.horoscopeDocument?.url && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="font-telex text-secondary/70 text-sm">Horoscope Document</span>
                <div className="flex gap-3">
                  <a
                    href={displayProfile.horoscopeDocument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary font-maven text-sm underline"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDownloadHoroscope(user?.id)}
                    className="text-secondary font-maven text-sm underline cursor-pointer bg-transparent border-0 p-0 hover:text-secondary/80"
                  >
                    Download
                  </button>
                </div>
              </div>
            )}
          </InfoCard>
        )}

        {/* Professional Information Card */}
        {(user?.education || user?.employmentType || user?.occupation || user?.annualIncome || user?.professionalAdditionalInfo) && (
          <InfoCard
            title="💼 Professional"
            icon={Briefcase}
            className="mb-6"
          >
            <InfoField label="Education" value={user?.education} />
            <InfoField label="Employment Type" value={user?.employmentType} />
            <InfoField label="Occupation" value={user?.occupation} />
            {user?.annualIncome && (
              <InfoField
                label="Annual Income"
                value={user.annualIncome.displayText || `${user.annualIncome.currency} ${user.annualIncome.amount}`}
              />
            )}
            {user?.professionalAdditionalInfo && (
              <div className="py-3 border-b border-gray-100 last:border-0">
                <span className="font-telex text-secondary/70 text-sm block mb-2">Additional Information</span>
                <p className="font-maven text-secondary whitespace-pre-line">{user.professionalAdditionalInfo}</p>
              </div>
            )}
          </InfoCard>
        )}

        {/* Family Details Card */}
        {(user?.fatherName || user?.fatherOccupation || user?.motherName || user?.motherOccupation) && (
          <InfoCard
            title="👨‍👩‍👧‍👦 Family Details"
            icon={Users}
            className="mb-6"
          >
            {user?.fatherName && <InfoField label="Father's Name" value={user.fatherName} />}
            {user?.fatherOccupation && <InfoField label="Father's Occupation" value={user.fatherOccupation} />}
            {user?.motherName && <InfoField label="Mother's Name" value={user.motherName} />}
            {user?.motherOccupation && <InfoField label="Mother's Occupation" value={user.motherOccupation} />}
          </InfoCard>
        )}

        {/* Address Information Card */}
        {(user?.residentialStatus || (displayProfile?.presentResidentialAddress && Object.values(displayProfile.presentResidentialAddress).some(v => v)) ||
          (displayProfile?.nativePlaceAddress && Object.values(displayProfile.nativePlaceAddress).some(v => v))) && (
          <InfoCard
            title="📍 Address Information"
            className="mb-6"
          >
            {user?.residentialStatus && <InfoField label="Residential Status" value={user.residentialStatus} />}
            {displayProfile?.presentResidentialAddress && Object.values(displayProfile.presentResidentialAddress).some(v => v) && (
              <div className="py-3 border-b border-gray-100">
                <span className="font-telex text-secondary/70 text-sm block mb-2">Present Residential Address</span>
                <span className="font-maven text-secondary">
                  {[
                    displayProfile.presentResidentialAddress.street,
                    displayProfile.presentResidentialAddress.area,
                    displayProfile.presentResidentialAddress.landmark,
                    displayProfile.presentResidentialAddress.city,
                    displayProfile.presentResidentialAddress.state,
                    displayProfile.presentResidentialAddress.country,
                    displayProfile.presentResidentialAddress.pincode,
                  ].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
            )}
            {displayProfile?.nativePlaceAddress && Object.values(displayProfile.nativePlaceAddress).some(v => v) && (
              <div className="py-3">
                <span className="font-telex text-secondary/70 text-sm block mb-2">Native Place Address</span>
                <span className="font-maven text-secondary">
                  {[
                    displayProfile.nativePlaceAddress.street,
                    displayProfile.nativePlaceAddress.area,
                    displayProfile.nativePlaceAddress.landmark,
                    displayProfile.nativePlaceAddress.city,
                    displayProfile.nativePlaceAddress.state,
                    displayProfile.nativePlaceAddress.country,
                    displayProfile.nativePlaceAddress.pincode,
                  ].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
            )}
          </InfoCard>
        )}

        {/* Interests Section */}
        {displayProfile?.interests && displayProfile.interests.length > 0 && (
          <InfoCard
            title="⭐ Interests"
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2">
              {displayProfile.interests.map((interest, idx) => (
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
        {displayProfile?.gallery?.photos && displayProfile.gallery.photos.length > 0 && (
          <div className="mb-8">
            <h3 className="font-viga text-2xl text-secondary flex items-center gap-2 mb-4">
              📸 Photos ({displayProfile.gallery.photos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayProfile.gallery.photos.map((photo, idx) => (
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

      {/* Footer spacing */}
      <div className="h-16" />
    </div>
  );
}

