const crypto = require('crypto');
const smsProvider = require('./otp/2factor.provider');
const emailService = require('./email.service');

/**
 * OTP Service - Handles OTP generation, hashing, verification, and delivery
 * Supports both SMS (2Factor) and Email (Resend) delivery methods
 */
class OTPService {
  /**
   * Check if running in development mode
   * @returns {boolean}
   */
  isDevelopment() {
    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Generate 6-digit OTP
   * In development mode (NODE_ENV !== 'production' AND service not configured), returns hardcoded 000000
   * In production mode, throws error if service not configured
   * @param {string} mode - 'email' or 'sms' (default: 'email')
   * @returns {string} 6-digit OTP
   */
  generateOTP(mode = 'email') {
    // For email mode, check if email service is configured
    if (mode === 'email') {
      if (!emailService.isConfigured()) {
        if (this.isDevelopment()) {
          return '000000';
        }
        throw new Error('Email service not configured for production');
      }
      return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // For SMS mode (legacy), check 2Factor configuration
    if (!smsProvider.isConfigured()) {
      if (this.isDevelopment()) {
        return '000000';
      }
      throw new Error('SMS service not configured for production');
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash OTP using SHA-256
   * @param {string} otp - Plain OTP code
   * @returns {string} SHA-256 hash of OTP
   */
  hashOTP(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Verify OTP by comparing hashes
   * @param {string} inputOTP - User-entered OTP
   * @param {string} hashedOTP - Stored hashed OTP
   * @returns {boolean} True if OTP matches
   */
  verifyOTP(inputOTP, hashedOTP) {
    const hashedInput = this.hashOTP(inputOTP);
    return hashedInput === hashedOTP;
  }

  /**
   * Send OTP via SMS
   * In development mode (NODE_ENV !== 'production' AND 2Factor not configured): Returns success without sending SMS
   * In production mode: Sends via 2Factor provider or throws error if not configured
   * @param {string} mobileNumber - 10-digit mobile number
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<object>} SMS provider response or development mode response
   */
  async sendOTP(mobileNumber, otp) {
    try {
      // Development mode: return OTP response without sending SMS
      if (!smsProvider.isConfigured()) {
        if (this.isDevelopment()) {
          return {
            success: true,
            provider: 'development',
            message: 'Development mode - OTP is 000000',
            mobileNumber: mobileNumber,
          };
        }
        throw new Error('SMS service not configured for production');
      }

      // Production mode: send via 2Factor provider
      return await smsProvider.send(mobileNumber, otp);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send OTP via Email
   * In development mode (NODE_ENV !== 'production' AND Resend not configured): Returns success without sending email
   * In production mode: Sends via Resend provider or throws error if not configured
   * @param {string} email - Email address
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<object>} Email provider response or development mode response
   */
  async sendEmailOTP(email, otp) {
    try {
      // Development mode: return OTP response without sending email
      if (!emailService.isConfigured()) {
        if (this.isDevelopment()) {
          return {
            success: true,
            provider: 'development',
            message: 'Development mode - OTP is 000000',
            email: email,
          };
        }
        throw new Error('Email service not configured for production');
      }

      // Production mode: send via email service
      return await emailService.sendOtpEmail(email, otp);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate OTP expiry time
   * @param {number} minutes - Validity period in minutes (default: 5)
   * @returns {Date} Expiry timestamp
   */
  getExpiryTime(minutes = 5) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}

module.exports = new OTPService();
