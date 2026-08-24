const mongoose = require('mongoose');
const User = require('../models/User');
const { validateUserAge } = require('../middleware/validation.middleware');
const { downloadFileFromS3, extractKeyFromUrl } = require('../services/s3.service');

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth
 * @returns {number} Age in years
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

/**
 * GET /api/profiles/discover
 * Get profiles to browse based on user preferences
 */
exports.discoverProfiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentUser = await User.findById(userId)
      .select('membership seekingGender gender ageFrom ageTo')
      .lean(); // Return plain JS object for faster read

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find users based on current user's preferences
    const filterQuery = {
      _id: { $ne: userId }, // Exclude current user
      isActive: true, // Only show active profiles
      gender: currentUser.seekingGender, // Match seeking gender
      seekingGender: currentUser.gender, // They should be seeking current user's gender
      ageFrom: { $lte: currentUser.ageTo }, // Age preference match
      ageTo: { $gte: currentUser.ageFrom },
      profilePicture: { $exists: true, $ne: null }, // Must have profile picture
    };

    const profiles = await User.find(filterQuery)
      .select(
        'fullName age dateOfBirth timeOfBirth gender seekingGender motherTongue height physicalStatus ' +
        'maritalStatus religion caste nakshatra education employmentType occupation annualIncome ' +
        'familyStatus profileAbout interests profilePicture profileBanner gallery likedBy horoscopeDocument'
      )
      .limit(20)
      .lean(); // Return plain JS objects for faster read


    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles,
      membershipInfo: {
        credits: currentUser.membership.credits,
        expiryDate: currentUser.membership.expiryDate,
      },
    });
  } catch (error) {
    console.error('Error discovering profiles:', error);
    res.status(500).json({ message: 'Error fetching profiles' });
  }
};

/**
 * GET /api/profiles/liked
 * Get all profiles liked by current user
 */
exports.getLikedProfiles = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate({
        path: 'likedProfiles',
        select:
          'fullName age dateOfBirth timeOfBirth gender seekingGender motherTongue height physicalStatus ' +
          'maritalStatus religion caste nakshatra education employmentType occupation annualIncome ' +
          'familyStatus profileAbout interests profilePicture profileBanner gallery horoscopeDocument',
      })
      .lean(); // Return plain JS object for faster read

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      count: user.likedProfiles?.length || 0,
      data: user.likedProfiles || [],
    });
  } catch (error) {
    console.error('Error fetching liked profiles:', error);
    res.status(500).json({ message: 'Error fetching liked profiles' });
  }
};

/**
 * POST /api/profiles/:id/like
 * Like a profile
 */
exports.likeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.id;

    if (userId === profileId) {
      return res.status(400).json({ message: 'Cannot like your own profile' });
    }

    // Check if profile exists and is active
    const profile = await User.findById(profileId);
    if (!profile || !profile.isActive) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check if current user exists
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already liked - only if likedProfiles is an array
    if (Array.isArray(currentUser.likedProfiles) &&
        currentUser.likedProfiles.some(id => id.toString() === profileId)) {
      return res.status(400).json({ message: 'Already liked this profile' });
    }

    // Use updateOne to avoid full document validation
    await User.updateOne(
      { _id: userId },
      { $addToSet: { likedProfiles: profileId } }
    );

    await User.updateOne(
      { _id: profileId },
      { $addToSet: { likedBy: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'Profile liked successfully',
    });
  } catch (error) {
    console.error('Error liking profile:', error.message);
    res.status(500).json({ message: 'Error liking profile' });
  }
};

/**
 * POST /api/profiles/:id/unlike
 * Unlike a profile
 */
exports.unlikeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.id;

    // Check if both users exist
    const currentUser = await User.findById(userId);
    const profile = await User.findById(profileId);

    if (!currentUser || !profile) {
      return res.status(404).json({ message: 'User or profile not found' });
    }

    // Use updateOne with $pull operator to avoid full document validation
    // $pull removes the element from the array regardless of its position
    await User.updateOne(
      { _id: userId },
      { $pull: { likedProfiles: profileId } }
    );

    await User.updateOne(
      { _id: profileId },
      { $pull: { likedBy: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'Profile unliked successfully',
    });
  } catch (error) {
    console.error('Error unliking profile:', error.message);
    res.status(500).json({ message: 'Error unliking profile' });
  }
};

/**
 * GET /api/profiles/:id
 * Get a specific profile (WITH CREDIT CHECK AND DEDUCTION)
 */
exports.getProfile = async (req, res) => {
  try {
    const profileId = req.params.id;
    const userId = req.user?.id; // Get current user ID if authenticated

    // Validate profileId
    if (!profileId || profileId === 'undefined' || profileId === 'null') {
      return res.status(400).json({ message: 'Invalid profile ID' });
    }

    // Check if user has active membership and credits
    const currentUser = await User.findById(userId).select('membership viewedProfiles');

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clean up any corrupted viewedProfiles data (profileId as "undefined" or invalid)
    const validViewedProfiles = currentUser.viewedProfiles.filter(
      (view) => view.profileId && view.profileId.toString() !== 'undefined' && view.profileId.toString() !== 'null'
    );
    
    // Update if we found corrupted data
    if (validViewedProfiles.length !== currentUser.viewedProfiles.length) {
      currentUser.viewedProfiles = validViewedProfiles;
      await currentUser.save({ validateModifiedOnly: true });
    }

    // Check if profile has been viewed before
    const hasViewedBefore = currentUser.viewedProfiles.some(
      (view) => view.profileId.toString() === profileId
    );

    // If NOT viewed before, check membership and credits (unless promotional mode)
    if (!hasViewedBefore) {
      const isPromotional = process.env.PROMOTIONAL_MODE === 'true';

      if (!isPromotional) {
        // Check if membership is active
        if (!currentUser.membership.isActive) {
          return res.status(403).json({
            message: 'Active membership required to view profiles',
            requiresMembership: true,
          });
        }

        // Check if membership has expired (null expiryDate means unlimited validity)
        if (currentUser.membership.expiryDate && new Date(currentUser.membership.expiryDate) < new Date()) {
          return res.status(403).json({
            message: 'Your membership has expired. Please renew to view profiles.',
            requiresMembership: true,
            isExpired: true,
          });
        }

        // Check if user has credits
        if (currentUser.membership.credits <= 0) {
          return res.status(403).json({
            message: 'Insufficient credits. Please purchase more credits to view profiles.',
            requiresCredits: true,
          });
        }

        // Deduct 1 credit
        currentUser.membership.credits -= 1;
      }

      // Track viewed profiles regardless of mode (useful analytics)
      currentUser.viewedProfiles.push({
        profileId,
        viewedAt: Date.now(),
      });

      await currentUser.save({ validateModifiedOnly: true });
    }

    // Select all profile fields including contact information
    const selectFields =
      'fullName age dateOfBirth timeOfBirth gender seekingGender ' +
      'motherTongue height physicalStatus maritalStatus ' +
      'religion caste shuddhaJathakam doshamTypes nakshatra raasi country state city ' +
      'education employmentType occupation annualIncome ' +
      'familyStatus fatherName fatherOccupation motherName motherOccupation ' +
      'weight bloodGroup residentialStatus ' +
      'presentResidentialAddress nativePlaceAddress ' +
      'profileAbout interests ' +
      'ageFrom ageTo ' +
      'profilePicture profileBanner gallery horoscopeDocument ' +
      'likedBy createdAt isActive ' +
      'mobileNumber alternateMobileNumber';

    // Fetch the profile
    const profile = await User.findById(profileId)
      .select(selectFields);

    if (!profile || !profile.isActive) {
      // Refund credit and remove view tracking if profile not found or inactive
      if (!hasViewedBefore) {
        if (process.env.PROMOTIONAL_MODE !== 'true') {
          currentUser.membership.credits += 1;
        }
        currentUser.viewedProfiles = currentUser.viewedProfiles.filter(
          (view) => view.profileId.toString() !== profileId
        );
        await currentUser.save();
      }
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check if current user has liked this profile
    const isLiked = userId
      ? profile.likedBy && Array.isArray(profile.likedBy)
        ? profile.likedBy.some((id) => id.toString() === userId)
        : false
      : false;

    res.status(200).json({
      success: true,
      data: {
        ...profile.toObject({ virtuals: true }),
        isLiked,
        creditsDeducted: process.env.PROMOTIONAL_MODE === 'true' ? false : !hasViewedBefore,
        remainingCredits: currentUser.membership.credits,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

/**
 * GET /api/profiles/me/view
 * Get current user's profile as others see it
 */
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await User.findById(userId)
      .select(
        // Basic Information
        'fullName age dateOfBirth timeOfBirth gender seekingGender ' +

        // Personal Details
        'motherTongue height physicalStatus maritalStatus ' +

        // Religion & Location
        'religion caste shuddhaJathakam doshamTypes nakshatra raasi country state city ' +

        // Professional Details
        'education employmentType occupation annualIncome ' +

        // Family Details
        'familyStatus fatherName fatherOccupation motherName motherOccupation ' +

        // Physical & Residential Details
        'weight bloodGroup residentialStatus ' +

        // Address Information
        'presentResidentialAddress nativePlaceAddress ' +

        // About & Interests
        'profileAbout interests ' +

        // Preference Information
        'ageFrom ageTo ' +

        // Media
        'profilePicture profileBanner gallery horoscopeDocument ' +

        // Metadata
        'likedBy createdAt'
      );

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json({
      success: true,
      data: profile.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

/**
 * PUT /api/profiles/update
 * Update current user's profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update all provided fields
    const allowedFields = [
      'gender', 'seekingGender', 'dateOfBirth', 'timeOfBirth', 'motherTongue', 'height', 'physicalStatus',
      'maritalStatus', 'religion', 'caste', 'shuddhaJathakam', 'doshamTypes', 'nakshatra', 'raasi',
      'country', 'state', 'city', 'education', 'employmentType', 'occupation', 'annualIncome',
      'familyStatus', 'ageFrom', 'ageTo', 'profileAbout', 'interests',
      'presentResidentialAddress', 'nativePlaceAddress',
      'weight', 'bloodGroup', 'fatherName', 'fatherOccupation',
      'motherName', 'motherOccupation', 'residentialStatus',
      // REMOVED: 'mobileNumber', 'alternateMobileNumber', 'sngsMembershipNumber'
      // These fields are set during registration and should not be editable via profile update
      'languagesKnown', 'placeOfBirth', 'complexion', 'diet', 'professionalAdditionalInfo'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'dateOfBirth') {
          // Validate age when updating dateOfBirth
          const ageValidation = validateUserAge(updates[field]);
          if (!ageValidation.isValid) {
            return res.status(400).json({
              success: false,
              message: ageValidation.error,
            });
          }
          user[field] = updates[field];
        } else if (field === 'timeOfBirth') {
          // Validate time format
          const timeFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (updates[field] && !timeFormat.test(updates[field])) {
            return res.status(400).json({
              success: false,
              message: 'Invalid time format. Please use HH:mm format (24-hour)',
            });
          }
          user[field] = updates[field] || null;
        } else if (field === 'weight') {
          user[field] = updates[field] ? parseInt(updates[field], 10) : null;
        } else if (field === 'mobileNumber') {
          // Validate mobile number format
          if (updates[field] && !/^[6-9]\d{9}$/.test(updates[field])) {
            return res.status(400).json({
              success: false,
              message: 'Please enter a valid 10-digit mobile number',
            });
          }
          // Check if mobile number is being changed and if it already exists
          if (updates[field] && updates[field] !== user.mobileNumber) {
            const existingMobile = await User.findOne({
              mobileNumber: updates[field],
              _id: { $ne: userId }
            });
            if (existingMobile) {
              return res.status(400).json({
                success: false,
                message: 'Mobile number already in use',
              });
            }
          }
          user[field] = updates[field];
        } else if (field === 'alternateMobileNumber') {
          // Validate alternate mobile number format
          if (updates[field] && !/^[6-9]\d{9}$/.test(updates[field])) {
            return res.status(400).json({
              success: false,
              message: 'Please enter a valid 10-digit alternate mobile number',
            });
          }
          user[field] = updates[field] || '';
        } else if (field === 'ageFrom' || field === 'ageTo') {
          user[field] = parseInt(updates[field]);
        } else if (field === 'annualIncome') {
          // Frontend sends pre-parsed income data: {currency, min, max, displayText}
          // Validate structure
          if (!updates[field]?.currency ||
              typeof updates[field]?.min !== 'number' ||
              typeof updates[field]?.max !== 'number' ||
              !updates[field]?.displayText) {
            return res.status(400).json({
              success: false,
              message: 'Invalid income data. Must include currency, min, max, and displayText',
            });
          }

          // Validate ranges
          if (updates[field].min < 0 || updates[field].max < updates[field].min) {
            return res.status(400).json({
              success: false,
              message: 'Invalid income range. Max must be greater than or equal to min',
            });
          }

          // Structure is already correct from frontend, just assign it
          user[field] = {
            currency: updates[field].currency,
            min: updates[field].min,
            max: updates[field].max,
            displayText: updates[field].displayText,
          };
        } else {
          user[field] = updates[field];
        }
      }
    }

    // Conditional logic: Clear religion-specific fields
    if (updates.religion && updates.religion !== 'Hindu') {
      user.caste = '';
      user.shuddhaJathakam = '';
      user.doshamTypes = [];
      user.nakshatra = null;
      user.raasi = null;
    }

    // Conditional logic: Clear state if not India
    if (updates.country && updates.country !== 'India') {
      user.state = '';
    }

    // Auto-resubmit: If user is rejected, reset to pending for re-review
    if (user.approvalStatus === 'rejected') {
      user.approvalStatus = 'pending';

      // Initialize approvalHistory if it doesn't exist
      if (!user.approvalHistory) {
        user.approvalHistory = [];
      }

      user.approvalHistory.push({
        status: 'pending',
        reason: 'Profile resubmitted after rejection',
        adminId: null,
        adminEmail: null,
        actionAt: new Date(),
      });
    }

    // Skip Mongoose schema validation since we've already validated individual fields above
    // This allows users to update profiles even if their user document has missing required fields
    await user.save({ validateBeforeSave: false });

    // Determine success message based on whether profile was resubmitted
    const wasResubmitted = user.approvalHistory?.some(
      (h) => h.reason === 'Profile resubmitted after rejection' &&
             new Date(h.actionAt).getTime() > Date.now() - 5000 // Within last 5 seconds
    );

    res.status(200).json({
      success: true,
      message: wasResubmitted
        ? 'Profile updated and resubmitted for approval'
        : 'Profile updated successfully',
      data: user.toJSON(),
      resubmittedForApproval: wasResubmitted,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
    });
  }
};

/**
 * GET /api/profiles/:id/horoscope/download
 * Download horoscope document
 */
exports.downloadHoroscope = async (req, res) => {
  try {
    const { id: profileId } = req.params;
    const currentUserId = req.user.id;

    // Fetch the profile
    const profile = await User.findById(profileId);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check if horoscope document exists
    if (!profile.horoscopeDocument?.url) {
      return res.status(404).json({ message: 'Horoscope document not found' });
    }

    // Skip credit check for admins or own profile
    const isAdmin = req.userType === 'admin';
    const isOwnProfile = profileId === currentUserId;

    if (!isAdmin && !isOwnProfile) {
      // Only check credits for non-admin users viewing other profiles
      const currentUser = await User.findById(currentUserId);

      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user has already viewed this profile (liked or previously viewed)
      const alreadyViewed = currentUser.likedProfiles?.includes(profileId);

      if (process.env.PROMOTIONAL_MODE !== 'true') {
        if (!alreadyViewed && currentUser.membership.credits < 1) {
          return res.status(403).json({
            message: 'Insufficient credits. You need at least 1 credit to download this horoscope.'
          });
        }
      }
    }

    // Extract S3 key from URL
    const fileKey = extractKeyFromUrl(profile.horoscopeDocument.url);

    if (!fileKey) {
      return res.status(500).json({ message: 'Invalid horoscope document URL' });
    }

    // Download file from S3
    const fileStream = await downloadFileFromS3(fileKey);

    // Extract actual file extension from S3 URL
    const urlPath = profile.horoscopeDocument.url;
    const fileExtension = urlPath.substring(urlPath.lastIndexOf('.') + 1).toLowerCase();

    // Fallback to 'pdf' if no extension found
    const safeExtension = fileExtension || 'pdf';

    // Generate filename with correct extension
    const filename = `horoscope_${profile.fullName?.replace(/\s+/g, '_') || 'document'}.${safeExtension}`;

    // Map extension to proper MIME type
    const contentTypeMap = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    const contentType = contentTypeMap[safeExtension] || 'application/octet-stream';

    // Set response headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream file to response
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading horoscope:', error);
    res.status(500).json({ message: 'Failed to download horoscope document' });
  }
};
