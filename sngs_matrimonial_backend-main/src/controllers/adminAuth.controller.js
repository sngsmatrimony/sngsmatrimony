const Admin = require('../models/Admin');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');

/**
 * POST /api/admin-auth/login
 * Admin login (separate from user login)
 */
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find admin and include password
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await admin.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = admin.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: admin.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin-auth/me
 * Get current admin
 */
exports.getCurrentAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.status(200).json({
      success: true,
      admin: admin.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send OTP for admin password reset
 * POST /api/admin-auth/forgot-password/send-otp
 */
exports.sendPasswordResetOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select(
      '+passwordResetOTP +passwordResetOTPExpiry +passwordResetAttempts +passwordResetLastAttempt'
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No admin account found with this email address'
      });
    }

    // Generate and send OTP
    const otp = otpService.generateOTP();
    const hashedOTP = otpService.hashOTP(otp);

    try {
      // Send OTP via email
      await emailService.sendPasswordResetOtpEmail(email, otp);
    } catch (error) {
      console.error('[adminAuth.controller] OTP send error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    // Save hashed OTP and expiry
    admin.passwordResetOTP = hashedOTP;
    admin.passwordResetOTPExpiry = otpService.getExpiryTime(5); // 5 minutes
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email address',
      expiresIn: '5 minutes'
    });
  } catch (error) {
    console.error('[adminAuth.controller] Send OTP error:', error);
    next(error);
  }
};

/**
 * Verify OTP for admin password reset
 * POST /api/admin-auth/forgot-password/verify-otp
 */
exports.verifyPasswordResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select(
      '+passwordResetOTP +passwordResetOTPExpiry'
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No admin account found with this email address'
      });
    }

    // Check if OTP exists
    if (!admin.passwordResetOTP || !admin.passwordResetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (new Date() > admin.passwordResetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Verify OTP
    const isValid = otpService.verifyOTP(otp, admin.passwordResetOTP);
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
    console.error('[adminAuth.controller] Verify OTP error:', error);
    next(error);
  }
};

/**
 * Reset admin password with OTP
 * POST /api/admin-auth/forgot-password/reset
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select(
      '+password +passwordResetOTP +passwordResetOTPExpiry'
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No admin account found with this email address'
      });
    }

    // Verify OTP one more time before reset
    if (!admin.passwordResetOTP || !admin.passwordResetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    if (new Date() > admin.passwordResetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    const isValid = otpService.verifyOTP(otp, admin.passwordResetOTP);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Reset password
    admin.password = newPassword; // Will be hashed by pre-save hook
    admin.passwordResetOTP = undefined;
    admin.passwordResetOTPExpiry = undefined;
    admin.passwordResetAttempts = 0;
    admin.passwordResetLastAttempt = undefined;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    console.error('[adminAuth.controller] Reset password error:', error);
    next(error);
  }
};

/**
 * Change password for authenticated admin
 * POST /api/admin-auth/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id; // Note: uses req.admin from verifyAdminToken

    // Find admin with password field (select: false by default)
    const admin = await Admin.findById(adminId).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Verify current password
    const isPasswordValid = await admin.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Check if new password is same as current
    const isSamePassword = await admin.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[adminAuth.controller] Change password error:', error);
    next(error);
  }
};
