const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const adminController = require('../controllers/admin.controller');

/**
 * GET /api/settings/contact-info
 * Public endpoint - get contact information for display in headers
 */
router.get('/contact-info', settingsController.getContactInfo);

/**
 * GET /api/settings/how-it-works
 * Public endpoint - get How It Works section content for homepage
 */
router.get('/how-it-works', adminController.getHowItWorksContent);

/**
 * GET /api/settings/hero-content
 * Public endpoint - get Hero section content for homepage
 */
router.get('/hero-content', adminController.getHeroContent);

module.exports = router;
