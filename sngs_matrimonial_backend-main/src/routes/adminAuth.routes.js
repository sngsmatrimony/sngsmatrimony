const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuth.controller');
const { verifyAdminToken } = require('../middleware/adminAuth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

/**
 * POST /api/admin-auth/login
 * Admin login
 */
router.post('/login', adminAuthController.loginAdmin);

/**
 * POST /api/admin-auth/change-password
 * Change password for authenticated admin (protected)
 */
router.post(
  '/change-password',
  verifyAdminToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),

    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and numbers'),
  ],
  handleValidationErrors,
  adminAuthController.changePassword
);

/**
 * GET /api/admin-auth/me
 * Get current admin (protected)
 */
router.get('/me', verifyAdminToken, adminAuthController.getCurrentAdmin);

/**
 * POST /api/admin-auth/forgot-password/send-otp
 * Send OTP to admin's email for password reset
 * Public endpoint (no authentication required)
 */
router.post(
  '/forgot-password/send-otp',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email address'),
  ],
  handleValidationErrors,
  adminAuthController.sendPasswordResetOTP
);

/**
 * POST /api/admin-auth/forgot-password/verify-otp
 * Verify OTP for admin password reset
 * Public endpoint (no authentication required)
 */
router.post(
  '/forgot-password/verify-otp',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email address'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
  ],
  handleValidationErrors,
  adminAuthController.verifyPasswordResetOTP
);

/**
 * POST /api/admin-auth/forgot-password/reset
 * Reset admin password with OTP verification
 * Public endpoint (no authentication required)
 */
router.post(
  '/forgot-password/reset',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email address'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and numbers'),
  ],
  handleValidationErrors,
  adminAuthController.resetPassword
);

module.exports = router;
