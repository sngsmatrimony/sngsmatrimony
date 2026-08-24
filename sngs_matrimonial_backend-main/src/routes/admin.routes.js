const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/adminAuth.middleware');
const adminController = require('../controllers/admin.controller');
const { photoUpload, documentUpload } = require('../services/s3.service');

/**
 * Middleware to set req.user from route params for admin uploads
 * This allows reusing S3 upload configurations that expect req.user.id
 */
const setUserFromParams = (req, res, next) => {
  if (req.params.id) {
    req.user = { id: req.params.id };
  }
  next();
};

// All routes require admin token authentication
router.use(verifyAdminToken);

// ==================== User Management Routes ====================

/**
 * GET /api/admin/users
 * Get all users with pagination, search, and filters
 */
router.get('/users', adminController.getAllUsers);

/**
 * GET /api/admin/users/pending-count
 * Get count of pending approvals for dashboard widget
 * NOTE: Must be before /users/:id to avoid route conflicts
 */
router.get('/users/pending-count', adminController.getPendingApprovalCount);

/**
 * GET /api/admin/users/:id
 * Get specific user details
 */
router.get('/users/:id', adminController.getUserById);

/**
 * PUT /api/admin/users/:id
 * Update user profile
 */
router.put('/users/:id', adminController.updateUser);

/**
 * PUT /api/admin/users/:id/deactivate
 * Deactivate user (soft delete)
 */
router.put('/users/:id/deactivate', adminController.deactivateUser);

/**
 * PUT /api/admin/users/:id/activate
 * Reactivate user
 */
router.put('/users/:id/activate', adminController.activateUser);

/**
 * PUT /api/admin/users/:id/approve
 * Approve a user registration
 */
router.put('/users/:id/approve', adminController.approveUser);

/**
 * PUT /api/admin/users/:id/reject
 * Reject a user registration (requires reason in body)
 */
router.put('/users/:id/reject', adminController.rejectUser);

/**
 * DELETE /api/admin/users/:id
 * Permanently delete user (hard delete)
 */
router.delete('/users/:id', adminController.deleteUser);

// ==================== Analytics Routes ====================

/**
 * GET /api/admin/analytics/overview
 * Get dashboard analytics
 */
router.get('/analytics/overview', adminController.getDashboardAnalytics);

/**
 * GET /api/admin/analytics/demographics
 * Get user demographics
 */
router.get('/analytics/demographics', adminController.getDemographics);

// ==================== Settings Routes ====================

/**
 * PUT /api/admin/settings/contact-info
 * Update contact information
 */
router.put('/settings/contact-info', adminController.updateContactInfo);

/**
 * GET /api/admin/how-it-works
 * Get How It Works section content
 */
router.get('/how-it-works', adminController.getHowItWorksContent);

/**
 * PUT /api/admin/how-it-works
 * Update How It Works section content
 */
router.put('/how-it-works', adminController.updateHowItWorksContent);

/**
 * GET /api/admin/hero-content
 * Get Hero section content
 */
router.get('/hero-content', adminController.getHeroContent);

/**
 * PUT /api/admin/hero-content
 * Update Hero section content
 */
router.put('/hero-content', adminController.updateHeroContent);

// ==================== Admin Management Routes ====================

/**
 * GET /api/admin/admins
 * Get all admins
 */
router.get('/admins', adminController.getAllAdmins);

/**
 * POST /api/admin/admins
 * Create new admin
 */
router.post('/admins', adminController.createAdmin);

// ==================== Membership Plan Management Routes ====================

/**
 * GET /api/admin/membership-plans
 * Get all membership plans
 */
router.get('/membership-plans', adminController.getAllMembershipPlans);

/**
 * POST /api/admin/membership-plans
 * Create new membership plan
 */
router.post('/membership-plans', adminController.createMembershipPlan);

/**
 * PUT /api/admin/membership-plans/:id
 * Update membership plan
 */
router.put('/membership-plans/:id', adminController.updateMembershipPlan);

/**
 * DELETE /api/admin/membership-plans/:id
 * Delete membership plan
 */
router.delete('/membership-plans/:id', adminController.deleteMembershipPlan);

/**
 * GET /api/admin/transactions
 * Get all transactions with filters
 */
router.get('/transactions', adminController.getAllTransactions);

// ==================== Admin Media Upload Routes ====================

/**
 * POST /api/admin/users/:id/upload-profile-picture
 * Upload profile picture for a specific user (admin)
 */
router.post(
  '/users/:id/upload-profile-picture',
  setUserFromParams,
  photoUpload.single('photo'),
  adminController.uploadUserProfilePicture
);

/**
 * POST /api/admin/users/:id/upload-photo
 * Upload gallery photo for a specific user (admin)
 */
router.post(
  '/users/:id/upload-photo',
  setUserFromParams,
  photoUpload.single('photo'),
  adminController.uploadUserPhoto
);

/**
 * DELETE /api/admin/users/:id/photos/:photoIndex
 * Delete gallery photo for a specific user (admin)
 */
router.delete(
  '/users/:id/photos/:photoIndex',
  adminController.deleteUserPhoto
);

/**
 * POST /api/admin/users/:id/upload-horoscope
 * Upload horoscope document for a specific user (admin)
 */
router.post(
  '/users/:id/upload-horoscope',
  setUserFromParams,
  documentUpload.single('document'),
  adminController.uploadUserHoroscope
);

/**
 * DELETE /api/admin/users/:id/horoscope
 * Delete horoscope document for a specific user (admin)
 */
router.delete(
  '/users/:id/horoscope',
  adminController.deleteUserHoroscope
);

module.exports = router;
