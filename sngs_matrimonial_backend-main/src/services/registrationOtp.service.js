/**
 * Registration OTP Service
 * Temporary in-memory storage for OTP verification during user registration
 * Since users don't exist in the database yet, we store OTP data in memory
 * with automatic cleanup to prevent memory leaks
 *
 * NOTE: Uses email as the key (changed from mobileNumber for email OTP verification)
 */
class RegistrationOTPStore {
  constructor() {
    this.store = new Map();
    this.startCleanupInterval();
  }

  /**
   * Store OTP for an email address
   * @param {string} email - Email address
   * @param {string} hashedOTP - SHA-256 hashed OTP
   * @param {Date} expiry - OTP expiry timestamp
   */
  setOTP(email, hashedOTP, expiry) {
    const normalizedEmail = email.toLowerCase().trim();
    this.store.set(normalizedEmail, {
      otp: hashedOTP,
      expiry,
      verified: false,
      createdAt: new Date()
    });
  }

  /**
   * Get OTP data for an email address
   * @param {string} email - Email address
   * @returns {Object|undefined} OTP data or undefined if not found
   */
  getOTP(email) {
    const normalizedEmail = email.toLowerCase().trim();
    return this.store.get(normalizedEmail);
  }

  /**
   * Mark email as verified
   * @param {string} email - Email address
   */
  markVerified(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const data = this.store.get(normalizedEmail);
    if (data) {
      data.verified = true;
      data.verifiedAt = new Date();
      this.store.set(normalizedEmail, data);
    }
  }

  /**
   * Set verification token for an email after OTP verification
   * @param {string} email - Email address
   * @param {string} token - Verification token
   * @param {Date} expiry - Token expiry timestamp
   */
  setVerificationToken(email, token, expiry) {
    const normalizedEmail = email.toLowerCase().trim();
    const data = this.store.get(normalizedEmail);
    if (data) {
      data.verificationToken = token;
      data.verificationTokenExpiry = expiry;
      this.store.set(normalizedEmail, data);
    }
  }

  /**
   * Check if email has been verified
   * @param {string} email - Email address
   * @returns {boolean} True if verified, false otherwise
   */
  isVerified(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const data = this.store.get(normalizedEmail);
    return data && data.verified === true;
  }

  /**
   * Delete OTP data for an email (cleanup after registration)
   * @param {string} email - Email address
   */
  delete(email) {
    const normalizedEmail = email.toLowerCase().trim();
    this.store.delete(normalizedEmail);
  }

  /**
   * Start automatic cleanup interval
   * Removes expired OTP data every 10 minutes
   * Prevents memory leaks from abandoned registrations
   */
  startCleanupInterval() {
    setInterval(() => {
      const now = new Date();
      let deletedCount = 0;

      for (const [email, data] of this.store.entries()) {
        // Remove if created more than 15 minutes ago (OTP expires at 5 min + buffer)
        if (now - data.createdAt > 15 * 60 * 1000) {
          this.store.delete(email);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(
          `[Registration OTP] Cleaned up ${deletedCount} expired OTP entries`
        );
      }
    }, 10 * 60 * 1000); // Run every 10 minutes
  }

  /**
   * Get current store size (for debugging/monitoring)
   * @returns {number} Number of entries in store
   */
  getStoreSize() {
    return this.store.size;
  }
}

module.exports = new RegistrationOTPStore();
