const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { photoUpload, documentUpload } = require('../services/s3.service');

const router = express.Router();

/**
 * POST /api/auth/register/check-email
 * Check if email is available for registration
 * Public endpoint (no authentication required)
 */
router.post(
  '/register/check-email',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email address'),
  ],
  handleValidationErrors,
  authController.checkEmailUniqueness
);

/**
 * POST /api/auth/register/send-otp
 * Send OTP to email for registration verification
 * Public endpoint (no authentication required)
 */
router.post(
  '/register/send-otp',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email address'),
  ],
  handleValidationErrors,
  authController.sendRegistrationOTP
);

/**
 * POST /api/auth/register/verify-otp
 * Verify OTP for registration
 * Public endpoint (no authentication required)
 */
router.post(
  '/register/verify-otp',
  [
    body('email')
      .trim()
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
  authController.verifyRegistrationOTP
);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  [
    // Step 1 - Basic Details
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 2 characters'),

    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format'),

    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and numbers'),

    body('dateOfBirth')
      .notEmpty()
      .withMessage('Date of birth is required')
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value) => {
        const dob = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 18 || age > 90) {
          throw new Error('Age must be between 18 and 90 years');
        }
        return true;
      }),

    body('timeOfBirth')
      .optional({ checkFalsy: true })
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid time format. Please use HH:mm format (24-hour)'),

    body('motherTongue')
      .notEmpty()
      .withMessage('Mother tongue is required')
      .trim(),

    body('mobileNumber')
      .trim()
      .notEmpty()
      .withMessage('Mobile number is required')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please enter a valid 10-digit mobile number'),

    body('alternateMobileNumber')
      .optional({ checkFalsy: true })
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please enter a valid 10-digit alternate mobile number'),

    body('languagesKnown')
      .optional({ checkFalsy: true })
      .isArray()
      .withMessage('Languages known must be an array')
      .custom((arr) => arr.length <= 10)
      .withMessage('Maximum 10 languages allowed'),

    body('placeOfBirth')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Place of birth must be at most 100 characters'),

    body('complexion')
      .optional({ checkFalsy: true })
      .isIn(['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Dark', 'Very Dark'])
      .withMessage('Invalid complexion value'),

    // Step 2 - Personal Details
    body('gender')
      .notEmpty()
      .withMessage('Gender is required')
      .isIn(['male', 'female'])
      .withMessage('Invalid gender value'),

    body('seekingGender')
      .notEmpty()
      .withMessage('Seeking gender is required')
      .isIn(['male', 'female'])
      .withMessage('Invalid seeking gender value'),

    body('height')
      .notEmpty()
      .withMessage('Height is required'),

    body('physicalStatus')
      .notEmpty()
      .withMessage('Physical status is required')
      .isIn(['Normal', 'Physically Challenged'])
      .withMessage('Invalid physical status'),

    body('maritalStatus')
      .notEmpty()
      .withMessage('Marital status is required')
      .isIn(['Never Married', 'Widowed', 'Awaiting Divorce', 'Divorced'])
      .withMessage('Invalid marital status'),

    body('religion')
      .notEmpty()
      .withMessage('Religion is required')
      .isIn([
        'Hindu',
        'Muslim - Shia',
        'Muslim - Sunni',
        'Muslim - Others',
        'Christian',
        'Sikh',
        'Jain - Digambar',
        'Jain - Swetambar',
        'Jain - Others',
        'Parsi',
        'Buddhist',
        'Jewish',
        'Inter-Religion',
      ])
      .withMessage('Invalid religion'),

    body('caste')
      .if(body('religion').equals('Hindu'))
      .notEmpty()
      .withMessage('Caste is required for Hindu religion'),

    body('shuddhaJathakam')
      .if(body('religion').equals('Hindu'))
      .notEmpty()
      .isIn(['Yes', 'No', "Don't Know"])
      .withMessage('Shuddha Jathakam selection is required for Hindu'),

    body('doshamTypes')
      .if(body('shuddhaJathakam').equals('No'))
      .isArray()
      .withMessage('Dosham types must be an array'),

    body('nakshatra')
      .trim()
      .notEmpty()
      .withMessage('Nakshatra is required')
      .isIn([
        'Aswathi',
        'Bharani',
        'Karthika',
        'Rohini',
        'Makayiram',
        'Thiruvathira',
        'Punartham',
        'Pooyam',
        'Ayilyam',
        'Makam',
        'Pooram',
        'Uthram',
        'Atham',
        'Chithira',
        'Chothy',
        'Vishakham',
        'Anizham',
        'Thrikketta',
        'Moolam',
        'Pooradam',
        'Uthradam',
        'Thiruvonam',
        'Avittam',
        'Chathayam',
        'Pooruruttathi',
        'Uthrattathi',
        'Revathi',
      ])
      .withMessage('Invalid nakshatra value'),

    body('raasi')
      .optional({ checkFalsy: true })
      .isIn([
        'Mesham',
        'Vrushabham',
        'Mithunam',
        'Karkatakam',
        'Simham',
        'Kanni',
        'Tulam',
        'Vrishchikam',
        'Dhanus',
        'Makaram',
        'Kumbam',
        'Meenam',
      ])
      .withMessage('Invalid raasi value'),

    // Step 3 - Location & Professional
    body('country')
      .notEmpty()
      .withMessage('Country is required'),

    body('state')
      .if(body('country').equals('India'))
      .notEmpty()
      .withMessage('State is required for India'),

    body('city')
      .optional()
      .trim(),

    body('education')
      .notEmpty()
      .withMessage('Education is required'),

    body('employmentType')
      .notEmpty()
      .withMessage('Employment type is required')
      .isIn([
        'Salaried - Private',
        'Salaried - Government',
        'Self Employed',
        'Business',
        'Defense',
        'Not Working',
      ])
      .withMessage('Invalid employment type'),

    body('occupation')
      .notEmpty()
      .withMessage('Occupation is required'),

    body('annualIncome.currency')
      .notEmpty()
      .withMessage('Currency is required')
      .isIn(['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'Others'])
      .withMessage('Invalid currency'),

    body('annualIncome.min')
      .optional()
      .isNumeric()
      .withMessage('Minimum income must be a number'),

    body('annualIncome.max')
      .optional()
      .isNumeric()
      .withMessage('Maximum income must be a number'),

    body('annualIncome.displayText')
      .optional()
      .isString()
      .withMessage('Income display text must be a string'),

    body('professionalAdditionalInfo')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Professional additional info must be at most 500 characters'),

    body('diet')
      .optional({ checkFalsy: true })
      .isIn(['Vegetarian', 'Non-Vegetarian', 'Eggetarian'])
      .withMessage('Invalid diet value'),

    // Step 4 - Additional Details
    body('fatherName')
      .trim()
      .notEmpty()
      .withMessage("Father's name is required")
      .isLength({ max: 100 })
      .withMessage("Father's name must be at most 100 characters"),

    body('fatherOccupation')
      .optional()
      .trim(),

    body('motherName')
      .trim()
      .notEmpty()
      .withMessage("Mother's name is required")
      .isLength({ max: 100 })
      .withMessage("Mother's name must be at most 100 characters"),

    body('motherOccupation')
      .optional()
      .trim(),

    body('familyStatus')
      .notEmpty()
      .withMessage('Family status is required')
      .isIn(['Middle Class', 'Upper Middle Class', 'Rich / Affluent'])
      .withMessage('Invalid family status'),

    body('profileAbout')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Profile about must be at most 1000 characters'),

    body('interests')
      .optional()
      .isArray()
      .withMessage('Interests must be an array'),

    body('ageFrom')
      .optional()
      .isInt({ min: 18, max: 90 })
      .withMessage('Age from must be between 18 and 90'),

    body('ageTo')
      .optional()
      .isInt({ min: 18, max: 90 })
      .withMessage('Age to must be between 18 and 90'),

    // Profile Banner
    body('profileBanner.bannerType')
      .optional()
      .equals('color')
      .withMessage('Banner type must be color'),

    body('profileBanner.bannerColor')
      .optional()
      .isIn([
        '#FFB3BA',
        '#FFFFBA',
        '#BAE1FF',
        '#BAFFC9',
        '#E0BBE4',
        '#FFDFD3',
        '#D4F1F4',
        '#F8B4D8',
        '#C7CEEA',
        '#FFEAA7',
      ])
      .withMessage('Invalid banner color'),
  ],
  handleValidationErrors,
  authController.register
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format'),

    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  handleValidationErrors,
  authController.login
);

/**
 * POST /api/auth/change-password
 * Change password for authenticated user (protected)
 */
router.post(
  '/change-password',
  verifyToken,
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
  authController.changePassword
);

/**
 * GET /api/auth/me
 * Get current user (protected)
 */
router.get('/me', verifyToken, authController.getCurrentUser);

/**
 * POST /api/auth/upload-profile-picture
 * Upload mandatory profile picture (protected)
 * Uses multer-s3 with automatic S3 upload
 */
router.post(
  '/upload-profile-picture',
  verifyToken,
  photoUpload.single('photo'),
  authController.uploadProfilePicture
);

/**
 * POST /api/auth/set-profile-banner-color
 * Set profile banner color (protected)
 */
router.post(
  '/set-profile-banner-color',
  verifyToken,
  [
    body('color')
      .notEmpty()
      .withMessage('Color is required')
      .isIn([
        '#FFB3BA',
        '#FFFFBA',
        '#BAE1FF',
        '#BAFFC9',
        '#E0BBE4',
        '#FFDFD3',
        '#D4F1F4',
        '#F8B4D8',
        '#C7CEEA',
        '#FFEAA7',
      ])
      .withMessage('Invalid color value'),
  ],
  handleValidationErrors,
  authController.setProfileBannerColor
);

/**
 * POST /api/auth/upload-photo
 * Upload gallery photo (protected)
 * Uses multer-s3 with automatic S3 upload
 */
router.post(
  '/upload-photo',
  verifyToken,
  photoUpload.single('photo'),
  authController.uploadPhoto
);

/**
 * DELETE /api/auth/photo/:index
 * Delete profile photo (protected)
 */
router.delete(
  '/photo/:index',
  verifyToken,
  authController.deletePhoto
);

/**
 * POST /api/auth/upload-horoscope-document
 * Upload horoscope document (PDF or image) (protected)
 */
router.post(
  '/upload-horoscope-document',
  verifyToken,
  documentUpload.single('document'),
  authController.uploadHoroscopeDocument
);

/**
 * DELETE /api/auth/horoscope-document
 * Delete horoscope document (protected)
 */
router.delete(
  '/horoscope-document',
  verifyToken,
  authController.deleteHoroscopeDocument
);

/**
 * POST /api/auth/forgot-password/send-otp
 * Send OTP to user's email for password reset
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
  authController.sendPasswordResetOTP
);

/**
 * POST /api/auth/forgot-password/verify-otp
 * Verify OTP for password reset
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
  authController.verifyPasswordResetOTP
);

/**
 * POST /api/auth/forgot-password/reset
 * Reset password with OTP verification
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
  authController.resetPassword
);

/**
 * POST /api/auth/deactivate-account
 * Deactivate user account (temporary suspension) - protected
 */
router.post(
  '/deactivate-account',
  verifyToken,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required for account deactivation'),
  ],
  handleValidationErrors,
  authController.deactivateAccount
);

/**
 * DELETE /api/auth/delete-account
 * Delete user account permanently - protected
 */
router.delete(
  '/delete-account',
  verifyToken,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required for account deletion'),
  ],
  handleValidationErrors,
  authController.deleteAccount
);

module.exports = router;
