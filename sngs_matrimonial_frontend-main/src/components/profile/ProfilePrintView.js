'use client';

import { forwardRef } from 'react';

// Color constants for inline styles (html2canvas doesn't support oklab colors from Tailwind v4)
const COLORS = {
  secondary: '#000000',
  secondary70: 'rgba(0, 0, 0, 0.7)',
  secondary80: 'rgba(0, 0, 0, 0.8)',
  secondary60: 'rgba(0, 0, 0, 0.6)',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray700: '#000000',
};

/**
 * Reusable InfoCard component for print view
 * data-section attribute helps the PDF generator identify sections for page breaks
 */
const InfoCard = ({ title, children }) => (
  <div
    data-section="true"
    style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
    }}
  >
    <h3
      style={{
        fontFamily: 'Viga, sans-serif',
        fontSize: '14px',
        color: COLORS.secondary,
        marginBottom: '12px',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '8px',
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

/**
 * Reusable InfoField component for print view
 */
const InfoField = ({ label, value }) => {
  if (!value) return null;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        borderBottom: '1px solid #F3F4F6',
      }}
    >
      <span
        style={{
          fontFamily: 'Telex, sans-serif',
          color: COLORS.secondary70,
          fontSize: '13px',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'Maven Pro, sans-serif',
          color: COLORS.secondary,
          fontWeight: 500,
          fontSize: '13px',
          textAlign: 'right',
          maxWidth: '60%',
        }}
      >
        {value}
      </span>
    </div>
  );
};

/**
 * Convert 24-hour format to 12-hour AM/PM format
 */
const formatTimeToAMPM = (time24) => {
  if (!time24) return null;
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Format address object into string
 */
const formatAddress = (address) => {
  if (!address) return null;
  const parts = [
    address.street,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.country,
    address.pincode,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
};

/**
 * ProfilePrintView - Print-optimized profile view for PDF generation
 * Uses inline styles instead of Tailwind color classes to avoid oklab() parsing errors
 * Removes decorative backgrounds for print-friendliness
 */
const ProfilePrintView = forwardRef(({ profile }, ref) => {
  if (!profile) return null;

  // Helper function to route external image URLs through proxy to avoid CORS issues
  const getProxiedImageUrl = (url) => {
    if (!url) return null;
    // Check if URL is from S3 or Supabase (external sources)
    if (url.includes('amazonaws.com') || url.includes('supabase.co')) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const profileImageUrl = getProxiedImageUrl(profile?.profilePicture?.url);

  return (
    <div
      ref={ref}
      style={{
        backgroundColor: '#FFFFFF',
        width: '794px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header is drawn programmatically in PDF generator for each page */}

      {/* Profile Header Section */}
      <div
        data-section="true"
        style={{
          padding: '16px 24px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          {/* Profile Picture */}
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '12px',
              border: '4px solid #FFFFFF',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              backgroundColor: '#F3F4F6',
              flexShrink: 0,
            }}
          >
            {profileImageUrl ? (
              <div
                role="img"
                aria-label={profile?.fullName || 'Profile'}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${profileImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.gray400,
                  fontSize: '12px',
                }}
              >
                No Image
              </div>
            )}
          </div>

          {/* Name and Basic Info */}
          <div style={{ paddingBottom: '8px' }}>
            <h1
              style={{
                fontFamily: 'Viga, sans-serif',
                fontSize: '24px',
                color: COLORS.secondary,
                margin: 0,
              }}
            >
              {profile?.fullName}
            </h1>
            <p
              style={{
                fontFamily: 'Telex, sans-serif',
                color: COLORS.secondary80,
                fontSize: '14px',
                margin: '4px 0 0 0',
              }}
            >
              Age: {profile?.age} | Gender:{' '}
              {profile?.gender?.[0].toUpperCase() + profile?.gender?.slice(1)}
            </p>
            {(profile?.seekingGender || profile?.ageFrom || profile?.ageTo) && (
              <p
                style={{
                  fontFamily: 'Telex, sans-serif',
                  fontSize: '12px',
                  color: COLORS.secondary60,
                  marginTop: '4px',
                }}
              >
                Seeking: {profile?.seekingGender} | Age: {profile?.ageFrom}-{profile?.ageTo}
              </p>
            )}
          </div>
        </div>

        {/* About Section - No background color for print */}
        {profile?.profileAbout && (
          <div
            style={{
              marginTop: '16px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <h4
              style={{
                fontFamily: 'Viga, sans-serif',
                fontSize: '14px',
                color: COLORS.secondary,
                marginBottom: '4px',
              }}
            >
              About
            </h4>
            <p
              style={{
                fontFamily: 'Maven Pro, sans-serif',
                color: COLORS.gray700,
                fontSize: '14px',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {profile.profileAbout}
            </p>
          </div>
        )}
      </div>

      {/* Content Grid - Two Column Layout */}
      <div
        style={{
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
      >
        {/* Left Column */}
        <div>
          {/* Contact Information */}
          {(profile?.mobileNumber || profile?.alternateMobileNumber) && (
            <InfoCard title="Contact Information">
              <InfoField label="Mobile" value={profile?.mobileNumber ? `+91 ${profile.mobileNumber}` : null} />
              <InfoField label="Alternate" value={profile?.alternateMobileNumber ? `+91 ${profile.alternateMobileNumber}` : null} />
            </InfoCard>
          )}

          {/* Personal Details */}
          <InfoCard title="Personal Details">
            <InfoField label="Mother Tongue" value={profile?.motherTongue} />
            <InfoField label="Height" value={profile?.height} />
            <InfoField label="Weight" value={profile?.weight ? `${profile.weight} kg` : null} />
            <InfoField label="Physical Status" value={profile?.physicalStatus} />
            <InfoField label="Blood Group" value={profile?.bloodGroup} />
            <InfoField label="Marital Status" value={profile?.maritalStatus} />
            <InfoField label="Complexion" value={profile?.complexion} />
            <InfoField label="Diet" value={profile?.diet} />
            <InfoField label="Family Status" value={profile?.familyStatus} />
          </InfoCard>

          {/* Birth Details */}
          <InfoCard title="Birth Details">
            <InfoField
              label="Date of Birth"
              value={
                profile?.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : null
              }
            />
            <InfoField label="Time of Birth" value={formatTimeToAMPM(profile?.timeOfBirth)} />
            <InfoField label="Place of Birth" value={profile?.placeOfBirth} />
            <InfoField label="Star (Nakshatra)" value={profile?.nakshatra} />
            <InfoField label="Raasi" value={profile?.raasi} />
            <InfoField label="Shuddha Jathakam" value={profile?.shuddhaJathakam} />
            {profile?.doshamTypes && profile.doshamTypes.length > 0 && (
              <div style={{ padding: '6px 0' }}>
                <span
                  style={{
                    fontFamily: 'Telex, sans-serif',
                    color: COLORS.secondary70,
                    fontSize: '14px',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Dosham
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {profile.doshamTypes.map((dosham, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '12px',
                        border: '1px solid #E5E7EB',
                        color: COLORS.secondary,
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {dosham}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </InfoCard>
        </div>

        {/* Right Column */}
        <div>
          {/* Religion & Caste */}
          <InfoCard title="Religion & Location">
            <InfoField label="Religion" value={profile?.religion} />
            <InfoField label="Caste" value={profile?.caste} />
          </InfoCard>

          {/* Professional Details */}
          <InfoCard title="Professional">
            <InfoField label="Education" value={profile?.education} />
            <InfoField label="Employment" value={profile?.employmentType} />
            <InfoField label="Occupation" value={profile?.occupation} />
            <InfoField
              label="Annual Income"
              value={
                profile?.annualIncome?.displayText ||
                (profile?.annualIncome
                  ? `${profile.annualIncome.currency} ${profile.annualIncome.min?.toLocaleString()}-${profile.annualIncome.max?.toLocaleString()}`
                  : null)
              }
            />
            {profile?.professionalAdditionalInfo && (
              <div style={{ padding: '6px 0' }}>
                <span
                  style={{
                    fontFamily: 'Telex, sans-serif',
                    color: COLORS.secondary70,
                    fontSize: '14px',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Additional Info
                </span>
                <p
                  style={{
                    fontFamily: 'Maven Pro, sans-serif',
                    color: COLORS.secondary,
                    fontSize: '14px',
                    margin: 0,
                  }}
                >
                  {profile.professionalAdditionalInfo}
                </p>
              </div>
            )}
          </InfoCard>

          {/* Family Details */}
          <InfoCard title="Family Details">
            <InfoField label="Father's Name" value={profile?.fatherName} />
            <InfoField label="Father's Occupation" value={profile?.fatherOccupation} />
            <InfoField label="Mother's Name" value={profile?.motherName} />
            <InfoField label="Mother's Occupation" value={profile?.motherOccupation} />
          </InfoCard>

          {/* Address Information */}
          {(profile?.residentialStatus ||
            formatAddress(profile?.presentResidentialAddress) ||
            formatAddress(profile?.nativePlaceAddress)) && (
            <InfoCard title="Address">
              <InfoField label="Residential Status" value={profile?.residentialStatus} />
              {formatAddress(profile?.presentResidentialAddress) && (
                <div style={{ padding: '6px 0' }}>
                  <span
                    style={{
                      fontFamily: 'Telex, sans-serif',
                      color: COLORS.secondary70,
                      fontSize: '12px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Present Address
                  </span>
                  <span
                    style={{
                      fontFamily: 'Maven Pro, sans-serif',
                      color: COLORS.secondary,
                      fontSize: '12px',
                    }}
                  >
                    {formatAddress(profile.presentResidentialAddress)}
                  </span>
                </div>
              )}
              {formatAddress(profile?.nativePlaceAddress) && (
                <div style={{ padding: '6px 0' }}>
                  <span
                    style={{
                      fontFamily: 'Telex, sans-serif',
                      color: COLORS.secondary70,
                      fontSize: '12px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Native Place
                  </span>
                  <span
                    style={{
                      fontFamily: 'Maven Pro, sans-serif',
                      color: COLORS.secondary,
                      fontSize: '12px',
                    }}
                  >
                    {formatAddress(profile.nativePlaceAddress)}
                  </span>
                </div>
              )}
            </InfoCard>
          )}
        </div>
      </div>

      {/* Full Width Sections */}
      <div style={{ padding: '0 24px', marginTop: '16px' }}>
        {/* Languages Known - Comma-separated text */}
        {profile?.languagesKnown && profile.languagesKnown.length > 0 && (
          <InfoCard title="Languages Known">
            <p
              style={{
                fontFamily: 'Maven Pro, sans-serif',
                color: COLORS.gray700,
                fontSize: '13px',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {profile.languagesKnown.join(', ')}
            </p>
          </InfoCard>
        )}

        {/* Interests - Comma-separated text */}
        {profile?.interests && profile.interests.length > 0 && (
          <InfoCard title="Interests">
            <p
              style={{
                fontFamily: 'Maven Pro, sans-serif',
                color: COLORS.secondary,
                fontSize: '13px',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {profile.interests.join(', ')}
            </p>
          </InfoCard>
        )}
      </div>

      {/* Gallery Photos - Limited to 8 for PDF size */}
      {profile?.gallery?.photos && profile.gallery.photos.length > 0 && (
        <div
          data-section="true"
          style={{
            padding: '0 24px',
            marginTop: '16px',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              fontFamily: 'Viga, sans-serif',
              fontSize: '14px',
              color: COLORS.secondary,
              marginBottom: '12px',
            }}
          >
            Photos ({Math.min(profile.gallery.photos.length, 8)} of {profile.gallery.photos.length})
          </h3>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {profile.gallery.photos.slice(0, 8).map((photo, idx) => (
              <div
                key={idx}
                role="img"
                aria-label={`Photo ${idx + 1}`}
                style={{
                  width: '175px',
                  height: '175px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB',
                  flexShrink: 0,
                  backgroundImage: `url(${getProxiedImageUrl(photo.url)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#F3F4F6',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          marginTop: '16px',
        }}
      >
        <p
          style={{
            fontFamily: 'Telex, sans-serif',
            fontSize: '12px',
            color: COLORS.secondary60,
            textAlign: 'center',
            margin: 0,
          }}
        >
          This profile is generated from SNGS Matrimonial. For more details, visit our platform.
        </p>
      </div>
    </div>
  );
});

ProfilePrintView.displayName = 'ProfilePrintView';

export default ProfilePrintView;
