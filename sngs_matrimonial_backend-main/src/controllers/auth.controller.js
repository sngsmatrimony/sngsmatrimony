const User = require('../models/User');
const s3Service = require('../services/s3.service');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const registrationOTPStore = require('../services/registrationOtp.service');
const { validationResult } = require('express-validator');

/**
 * Register a new user (5-step signup flow)
 * POST /api/auth/register
 * Step 1: Basic Details (name, email, password, DOB, mother tongue)
 * Step 2: Personal & Religious (gender, height, religion, marital status, etc.)
 * Step 3: Location & Addresses (country, state, city, residential & native addresses, professional details)
 * Step 4: Family & Additional (father/mother info, weight, blood group, residential status)
 * Step 5: Profile Picture (profile picture upload)
 */
exports.register = async (req, res, next) => {
  try {
    console.log('[auth.controller] Register request received');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('[auth.controller] Validation failed');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      // Step 1
      fullName,
      email,
      password,
      dateOfBirth,
      timeOfBirth,
      motherTongue,
      mobileNumber,
      alternateMobileNumber,
      // Step 2
      gender,
      seekingGender,
      height,
      physicalStatus,
      maritalStatus,
      religion,
      caste,
      shuddhaJathakam,
      doshamTypes,
      nakshatra,
      raasi,
      languagesKnown,
      placeOfBirth,
      complexion,
      // Step 3 - Location
      country,
      state,
      city,
      // Step 3 - Addresses (NEW)
      presentResidentialAddress,
      nativePlaceAddress,
      // Step 3 continued - Professional
      education,
      employmentType,
      occupation,
      annualIncome,
      professionalAdditionalInfo,
      // Step 4 (NEW - Family & Additional)
      weight,
      bloodGroup,
      fatherName,
      fatherOccupation,
      motherName,
      motherOccupation,
      residentialStatus,
      diet,
      // Step 5 - Family & About
      familyStatus,
      // Optional
      ageFrom,
      ageTo,
      profileAbout,
      interests,
      profileBanner,
      // Verification
      verificationToken,
    } = req.body;

    // Check if email was verified with OTP and verification token is valid
    const otpData = registrationOTPStore.getOTP(email);

    // Verify using the token (more reliable than just checking verified flag)
    if (!verificationToken || !otpData || otpData.verificationToken !== verificationToken) {
      console.error('[auth.controller] Email verification failed for', email, {
        tokenProvided: !!verificationToken,
        otpDataExists: !!otpData,
        tokenMatches: otpData?.verificationToken === verificationToken
      });
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify with OTP before registering.',
      });
    }

    // Check if verification token has expired
    if (otpData.verificationTokenExpiry && new Date() > otpData.verificationTokenExpiry) {
      registrationOTPStore.delete(email);
      return res.status(403).json({
        success: false,
        message: 'Verification token expired. Please verify your email again.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Check if mobile number already exists (only if provided)
    if (mobileNumber) {
      const existingMobile = await User.findOne({ mobileNumber });
      if (existingMobile) {
        return res.status(409).json({
          success: false,
          message: 'Mobile number already registered',
        });
      }
    }

    // Validate income structure (frontend sends pre-parsed data: {currency, min, max, displayText})
    if (!annualIncome?.currency ||
        typeof annualIncome?.min !== 'number' ||
        typeof annualIncome?.max !== 'number' ||
        !annualIncome?.displayText) {
      return res.status(400).json({
        success: false,
        message: 'Invalid income data. Must include currency, min, max, and displayText',
      });
    }

    // Validate ranges
    if (annualIncome.min < 0 || annualIncome.max < annualIncome.min) {
      return res.status(400).json({
        success: false,
        message: 'Invalid income range. Max must be greater than or equal to min',
      });
    }

    // Create new user with conditional logic
    const user = new User({
      fullName,
      email,
      password,
      dateOfBirth,
      timeOfBirth: timeOfBirth || null,
      motherTongue,
      mobileNumber: mobileNumber || '', // Mobile is now optional
      alternateMobileNumber: alternateMobileNumber || '',
      mobileVerified: false, // Mobile is no longer verified via registration
      emailVerified: true, // Set to true since we verified with OTP
      emailVerifiedAt: new Date(),
      languagesKnown: languagesKnown || [],
      placeOfBirth: placeOfBirth || '',
      complexion: complexion || '',
      gender,
      seekingGender,
      height,
      physicalStatus,
      maritalStatus,
      religion,
      // Conditional fields - only set if applicable
      caste: religion === 'Hindu' ? (caste || '') : '',
      shuddhaJathakam: religion === 'Hindu' ? (shuddhaJathakam || '') : '',
      doshamTypes: shuddhaJathakam === 'No' ? (doshamTypes || []) : [],
      nakshatra: nakshatra || null,
      raasi: raasi || null,
      // Location
      country,
      state: country === 'India' ? (state || '') : '',
      city: city || '',
      // Addresses (optional)
      presentResidentialAddress: presentResidentialAddress || {
        street: '',
        area: '',
        landmark: '',
        pincode: '',
        city: '',
        state: '',
      },
      nativePlaceAddress: nativePlaceAddress || {
        street: '',
        area: '',
        landmark: '',
        pincode: '',
        city: '',
        state: '',
      },
      // Professional
      education,
      employmentType,
      occupation,
      annualIncome: {
        currency: annualIncome.currency,
        min: annualIncome.min,
        max: annualIncome.max,
        displayText: annualIncome.displayText,
      },
      professionalAdditionalInfo: professionalAdditionalInfo || '',
      // Family & About
      familyStatus,
      // New Optional Fields (Step 4 - Family & Additional Details)
      weight: weight ? parseInt(weight, 10) : null,
      bloodGroup: bloodGroup || '',
      diet: diet || '',
      fatherName: fatherName || '',
      fatherOccupation: fatherOccupation || '',
      motherName: motherName || '',
      motherOccupation: motherOccupation || '',
      residentialStatus: residentialStatus || '',
      // Other Optional fields with defaults
      ageFrom: ageFrom || 18,
      ageTo: ageTo || 90,
      profileAbout: profileAbout || '',
      interests: interests || [],
      // Profile Banner
      profileBanner: profileBanner || {
        bannerType: 'color',
        bannerColor: '#FFB3BA',
      },
      // Account Status
      isActive: true,
    });

    await user.save();
    console.log('[auth.controller] User registered successfully:', user._id);

    // Clean up OTP data from temporary storage
    registrationOTPStore.delete(email);

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('[auth.controller] Registration error:', error);
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile picture (mandatory)
 * POST /api/auth/upload-profile-picture
 */
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const user = await User.findById(req.user.id);
    const photoUrl = req.file.location;

    // Delete old profile picture from S3 if it exists
    if (user.profilePicture?.url) {
      const oldKey = s3Service.extractKeyFromUrl(user.profilePicture.url);
      if (oldKey) {
        await s3Service.deleteFile(oldKey);
      }
    }

    // Update profile picture
    user.profilePicture = {
      url: photoUrl,
      uploadedAt: new Date(),
    };

    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureUrl: photoUrl,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set profile banner color
 * POST /api/auth/set-profile-banner-color
 */
exports.setProfileBannerColor = async (req, res, next) => {
  try {
    const { color } = req.body;

    if (!color) {
      return res.status(400).json({
        success: false,
        message: 'Color is required',
      });
    }

    const validColors = [
      '#FFB3BA', // Pastel Rose
      '#FFFFBA', // Pastel Vanilla
      '#BAE1FF', // Pastel Sky
      '#BAFFC9', // Pastel Mint
      '#E0BBE4', // Pastel Lilac
      '#FFDFD3', // Pastel Coral
      '#D4F1F4', // Pastel Cyan
      '#F8B4D8', // Pastel Mauve
      '#C7CEEA', // Pastel Periwinkle
      '#FFEAA7', // Pastel Butter
    ];

    if (!validColors.includes(color)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid color',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update profile banner
    user.profileBanner = {
      bannerType: 'color',
      bannerColor: color,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile banner color updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload gallery photo
 * POST /api/auth/upload-photo
 */
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    // Check photo limit
    const user = await User.findById(req.user.id);
    if (user.gallery.photos.length >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 photos allowed',
      });
    }

    // multer-s3 provides location (URL) directly in req.file
    const photoUrl = req.file.location;

    // Save photo URL to user gallery
    user.gallery.photos.push({
      url: photoUrl,
      uploadedAt: new Date(),
    });

    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: photoUrl,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete gallery photo
 * DELETE /api/auth/photo/:index
 */
exports.deletePhoto = async (req, res, next) => {
  try {
    const { index } = req.params;

    const user = await User.findById(req.user.id);

    if (index < 0 || index >= user.gallery.photos.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo index',
      });
    }

    const photo = user.gallery.photos[index];

    // Delete from S3
    const key = s3Service.extractKeyFromUrl(photo.url);
    if (key) {
      await s3Service.deleteFile(key);
    }

    // Remove from user gallery
    user.gallery.photos.splice(index, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload horoscope document
 * POST /api/auth/upload-horoscope-document
 */
exports.uploadHoroscopeDocument = async (req, res, next) => {
  try {
    console.log('[Upload] Received horoscope upload request');
    console.log('[Upload] req.file:', req.file);
    console.log('[Upload] req.body:', req.body);
    console.log('[Upload] Content-Type:', req.headers['content-type']);
    
    if (!req.file) {
      console.log('[Upload] ERROR: No file provided');
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    // Fetch the full user document to ensure all required fields are present
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete old horoscope document from S3 if exists
    if (user.horoscopeDocument?.url) {
      const oldKey = s3Service.extractKeyFromUrl(user.horoscopeDocument.url);
      if (oldKey) {
        await s3Service.deleteFile(oldKey);
      }
    }

    // Determine file type
    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

    // Update user with new horoscope document
    user.horoscopeDocument = {
      url: req.file.location,
      fileType: fileType,
      uploadedAt: new Date(),
    };

    await user.save({ validateModifiedOnly: true });

    console.log('[Upload] Horoscope uploaded successfully:', user.horoscopeDocument);

    res.status(200).json({
      success: true,
      message: 'Horoscope document uploaded successfully',
      horoscopeDocument: user.horoscopeDocument,
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    next(error);
  }
};

/**
 * Delete horoscope document
 * DELETE /api/auth/horoscope-document
 */
exports.deleteHoroscopeDocument = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.horoscopeDocument?.url) {
      return res.status(404).json({
        success: false,
        message: 'No horoscope document found',
      });
    }

    // Delete from S3
    const fileKey = s3Service.extractKeyFromUrl(user.horoscopeDocument.url);
    if (fileKey) {
      await s3Service.deleteFile(fileKey);
    }

    // Remove from database
    user.horoscopeDocument = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Horoscope document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send OTP for password reset
 * POST /api/auth/forgot-password/send-otp
 */
exports.sendPasswordResetOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    let user = await User.findOne({
      email: email.toLowerCase()
    }).select('+passwordResetOTP +passwordResetOTPExpiry +passwordResetAttempts +passwordResetLastAttempt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate and send OTP
    const otp = otpService.generateOTP();
    const hashedOTP = otpService.hashOTP(otp);

    try {
      // Send OTP via email
      await emailService.sendPasswordResetOtpEmail(email, otp);
    } catch (error) {
      console.error('[auth.controller] OTP send error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    // Save hashed OTP and expiry
    user.passwordResetOTP = hashedOTP;
    user.passwordResetOTPExpiry = otpService.getExpiryTime(5); // 5 minutes
    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email address',
      expiresIn: '5 minutes'
    });
  } catch (error) {
    console.error('[auth.controller] Send OTP error:', error);
    next(error);
  }
};

/**
 * Verify OTP for password reset
 * POST /api/auth/forgot-password/verify-otp
 */
exports.verifyPasswordResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select('+passwordResetOTP +passwordResetOTPExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Check if OTP exists
    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (new Date() > user.passwordResetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Verify OTP
    const isValid = otpService.verifyOTP(otp, user.passwordResetOTP);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.'
    });
  } catch (error) {
    console.error('[auth.controller] Verify OTP error:', error);
    next(error);
  }
};

/**
 * Reset password with OTP
 * POST /api/auth/forgot-password/reset
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select('+password +passwordResetOTP +passwordResetOTPExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Verify OTP one more time before reset
    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    if (new Date() > user.passwordResetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    const isValid = otpService.verifyOTP(otp, user.passwordResetOTP);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Reset password
    user.password = newPassword; // Will be hashed by pre-save hook
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpiry = undefined;
    user.passwordResetAttempts = 0;
    user.passwordResetLastAttempt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    console.error('[auth.controller] Reset password error:', error);
    next(error);
  }
};

/**
 * Check if email is available for registration
 * POST /api/auth/register/check-email
 */
exports.checkEmailUniqueness = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if email is already registered in database
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        available: false
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email is available',
      available: true
    });
  } catch (error) {
    console.error('[auth.controller] Check email uniqueness error:', error);
    next(error);
  }
};

/**
 * Send OTP for registration verification (via email)
 * POST /api/auth/register/send-otp
 */
exports.sendRegistrationOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate OTP for email mode
    const otp = otpService.generateOTP('email');
    const hashedOTP = otpService.hashOTP(otp);

    try {
      // Send OTP via email (uses Resend provider)
      const result = await otpService.sendEmailOTP(normalizedEmail, otp);

      // Store hashed OTP in temporary storage
      const expiry = otpService.getExpiryTime(5); // 5 minutes
      registrationOTPStore.setOTP(normalizedEmail, hashedOTP, expiry);

      res.status(200).json({
        success: true,
        message: result.demo
          ? 'OTP generated (check console in demo mode)'
          : 'OTP sent to your email',
        expiresIn: '5 minutes',
        // Include OTP in response for demo mode
        ...(result.demo && { otp }),
      });
    } catch (error) {
      console.error('[auth.controller] Send registration OTP error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  } catch (error) {
    console.error('[auth.controller] Send registration OTP error:', error);
    next(error);
  }
};

/**
 * Verify OTP for registration (via email)
 * POST /api/auth/register/verify-otp
 */
exports.verifyRegistrationOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Get OTP data from temporary storage
    const otpData = registrationOTPStore.getOTP(normalizedEmail);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (new Date() > otpData.expiry) {
      registrationOTPStore.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Verify OTP
    const isValid = otpService.verifyOTP(otp, otpData.otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Mark email as verified
    registrationOTPStore.markVerified(normalizedEmail);

    // Generate a verification token that the frontend must send back during registration
    // This ensures the verification wasn't lost if server restarted or due to other issues
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Store the verification token separately
    registrationOTPStore.setVerificationToken(
      normalizedEmail,
      verificationToken,
      new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can proceed with registration.',
      verificationToken: verificationToken,
      email: normalizedEmail
    });
  } catch (error) {
    console.error('[auth.controller] Verify registration OTP error:', error);
    next(error);
  }
};

/**
 * Change password for authenticated user
 * POST /api/auth/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user with password field (select: false by default)
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[auth.controller] Change password error:', error);
    next(error);
  }
};

/**
 * POST /api/auth/deactivate-account
 * Deactivate account (temporary suspension)
 */
exports.deactivateAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    // Get user with password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Deactivate account
    user.isActive = false;
    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully. Contact support to reactivate.',
    });
  } catch (error) {
    console.error('[auth.controller] Deactivate account error:', error);
    next(error);
  }
};

/**
 * DELETE /api/auth/delete-account
 * Delete account permanently (soft delete with grace period)
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    // Get user with password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Soft delete: Set isActive to false and add deletedAt timestamp
    user.isActive = false;
    user.deletedAt = new Date();
    user.updatedAt = Date.now();
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully. Your data will be permanently removed in 30 days.',
    });
  } catch (error) {
    console.error('[auth.controller] Delete account error:', error);
    next(error);
  }
};

