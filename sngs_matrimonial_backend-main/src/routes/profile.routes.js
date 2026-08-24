const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { verifyAnyToken } = require('../middleware/verifyAnyToken.middleware');
const profileController = require('../controllers/profile.controller');

const router = express.Router();

// Middleware to prevent caching on all profile routes
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('ETag', 'false');
  res.set('Last-Modified', new Date().toUTCString());
  next();
});

/**
 * GET /api/profiles/discover
 * Get profiles to discover based on preferences
 */
router.get('/discover', verifyToken, profileController.discoverProfiles);

/**
 * GET /api/profiles/liked
 * Get all liked profiles
 */
router.get('/liked', verifyToken, profileController.getLikedProfiles);

/**
 * GET /api/profiles/me/view
 * Get current user's profile as others see it
 */
router.get('/me/view', verifyToken, profileController.getMyProfile);

/**
 * PUT /api/profiles/update
 * Update current user's profile
 */
router.put('/update', verifyToken, profileController.updateProfile);

/**
 * POST /api/profiles/:id/like
 * Like a profile
 */
router.post('/:id/like', verifyToken, profileController.likeProfile);

/**
 * POST /api/profiles/:id/unlike
 * Unlike a profile
 */
router.post('/:id/unlike', verifyToken, profileController.unlikeProfile);

/**
 * GET /api/profiles/:id/horoscope/download
 * Download horoscope document
 */
router.get('/:id/horoscope/download', verifyAnyToken, profileController.downloadHoroscope);

/**
 * GET /api/profiles/:id
 * Get specific profile
 */
router.get('/:id', verifyToken, profileController.getProfile);

module.exports = router;
