const { validationResult } = require('express-validator');

/**
 * Utility function to validate user age from date of birth
 * @param {Date|String} dateOfBirth - The user's date of birth
 * @returns {Object} - { isValid: boolean, age: number, error?: string }
 */
exports.validateUserAge = (dateOfBirth) => {
  try {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 18 || age > 90) {
      return {
        isValid: false,
        age,
        error: 'Age must be between 18 and 90 years',
      };
    }

    return { isValid: true, age };
  } catch (error) {
    return { isValid: false, error: 'Invalid date format' };
  }
};

/**
 * Middleware to check validation results
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  next();
};

/**
 * Centralized error handler
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map(error => error.message)
      .join(', ');

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired',
    });
  }

  // File upload errors
  if (err.message && err.message.includes('S3')) {
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      details: err.message,
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};
