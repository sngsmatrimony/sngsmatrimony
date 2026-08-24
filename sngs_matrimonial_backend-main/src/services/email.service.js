const { Resend } = require('resend');

/**
 * Email Service - Resend Provider
 * Handles email delivery for OTP verification and other communications
 */
class EmailService {
  constructor() {
    // Initialize Resend client only if API key exists
    this.resend = process.env.RESEND_API_KEY
      ? new Resend(process.env.RESEND_API_KEY)
      : null;

    // Default sender email
    this.fromEmail = process.env.FROM_EMAIL || 'SNGS Matrimonial <noreply@sngsmatrimonial.com>';

    // Demo mode flag (when no API key is configured)
    this.isDemo = !process.env.RESEND_API_KEY;

    // Frontend URL for links
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Check if email service is configured
   * @returns {boolean} True if Resend API key is set
   */
  isConfigured() {
    return !this.isDemo && this.resend !== null;
  }

  /**
   * Send OTP verification email
   * @param {string} email - Recipient email address
   * @param {string} otp - One-time password code
   * @returns {Promise<object>} Email send result
   */
  async sendOtpEmail(email, otp) {
    try {
      if (this.isDemo || !this.resend) {
        console.log('[Email Service] Demo mode - OTP email would be sent');
        console.log('[Email Service] To:', email);
        console.log('[Email Service] OTP:', otp);
        console.log('[Email Service] Valid for 5 minutes');
        return { success: true, demo: true, otp };
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify Your Email - SNGS Matrimonial',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <!-- Header -->
              <div style="text-align: center; padding: 30px 0;">
                <h1 style="color: #FF9B00; font-size: 28px; margin: 0;">SNGS Matrimonial</h1>
              </div>

              <!-- Content Box -->
              <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <h2 style="color: #333; margin-top: 0; font-size: 24px; text-align: center;">
                  Verify Your Email
                </h2>

                <p style="color: #555; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                  Use the following verification code to complete your registration:
                </p>

                <!-- OTP Box -->
                <div style="background-color: #FFF8E7; border: 2px dashed #FFE100; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #333;">
                    ${otp}
                  </span>
                </div>

                <!-- Warning Box -->
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 25px; border-radius: 0 8px 8px 0;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>Security Notice:</strong> This code expires in 5 minutes. Do not share it with anyone.
                  </p>
                </div>

                <p style="color: #888; font-size: 13px; text-align: center; margin-top: 25px;">
                  If you didn't request this verification code, please ignore this email.
                </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} SNGS Matrimonial. All rights reserved.</p>
                <p style="margin: 5px 0;">This is an automated message. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('[Email Service] Resend API error:', error);
        throw new Error(`Failed to send OTP email: ${error.message}`);
      }

      console.log('[Email Service] OTP email sent successfully to:', email);
      return { success: true, data };
    } catch (error) {
      console.error('[Email Service] Error sending OTP email:', error);
      // Fallback to demo mode on failure
      console.log('[Email Service] Fallback - OTP:', otp);
      return { success: true, demo: true, fallback: true, otp };
    }
  }

  /**
   * Send password reset OTP email
   * @param {string} email - Recipient email address
   * @param {string} otp - One-time password code for password reset
   * @returns {Promise<object>} Email send result
   */
  async sendPasswordResetOtpEmail(email, otp) {
    try {
      if (this.isDemo || !this.resend) {
        console.log('[Email Service] Demo mode - Password reset OTP email would be sent');
        console.log('[Email Service] To:', email);
        console.log('[Email Service] OTP:', otp);
        console.log('[Email Service] Valid for 5 minutes');
        return { success: true, demo: true, otp };
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset Your Password - SNGS Matrimonial',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <!-- Header -->
              <div style="text-align: center; padding: 30px 0;">
                <h1 style="color: #FF9B00; font-size: 28px; margin: 0;">SNGS Matrimonial</h1>
              </div>

              <!-- Content Box -->
              <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <h2 style="color: #333; margin-top: 0; font-size: 24px; text-align: center;">
                  Reset Your Password
                </h2>

                <p style="color: #555; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                  Use the following verification code to reset your password:
                </p>

                <!-- OTP Box -->
                <div style="background-color: #FFF8E7; border: 2px dashed #FFE100; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #333;">
                    ${otp}
                  </span>
                </div>

                <!-- Warning Box -->
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 25px; border-radius: 0 8px 8px 0;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>Security Notice:</strong> This code expires in 5 minutes. Do not share it with anyone.
                  </p>
                </div>

                <p style="color: #888; font-size: 13px; text-align: center; margin-top: 25px;">
                  If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} SNGS Matrimonial. All rights reserved.</p>
                <p style="margin: 5px 0;">This is an automated message. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('[Email Service] Resend API error:', error);
        throw new Error(`Failed to send password reset OTP email: ${error.message}`);
      }

      console.log('[Email Service] Password reset OTP email sent successfully to:', email);
      return { success: true, data };
    } catch (error) {
      console.error('[Email Service] Error sending password reset OTP email:', error);
      // Fallback to demo mode on failure
      console.log('[Email Service] Fallback - OTP:', otp);
      return { success: true, demo: true, fallback: true, otp };
    }
  }

  /**
   * Send welcome email after successful registration
   * @param {string} email - Recipient email address
   * @param {string} fullName - User's full name
   * @returns {Promise<object>} Email send result
   */
  async sendWelcomeEmail(email, fullName) {
    try {
      if (this.isDemo || !this.resend) {
        console.log('[Email Service] Demo mode - Welcome email would be sent to:', email);
        return { success: true, demo: true };
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to SNGS Matrimonial!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <!-- Header -->
              <div style="text-align: center; padding: 30px 0;">
                <h1 style="color: #FF9B00; font-size: 28px; margin: 0;">SNGS Matrimonial</h1>
              </div>

              <!-- Content Box -->
              <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <h2 style="color: #333; margin-top: 0; font-size: 24px;">
                  Welcome, ${fullName}!
                </h2>

                <p style="color: #555; line-height: 1.6;">
                  Thank you for joining SNGS Matrimonial. Your account has been created successfully.
                </p>

                <p style="color: #555; line-height: 1.6;">
                  You can now explore profiles and find your perfect match.
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${this.frontendUrl}/dashboard"
                     style="background-color: #FFE100; color: #333; padding: 15px 35px;
                            text-decoration: none; border-radius: 8px; display: inline-block;
                            font-weight: 600; font-size: 16px;">
                    Explore Profiles
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} SNGS Matrimonial. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('[Email Service] Welcome email error:', error);
        throw new Error(`Failed to send welcome email: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('[Email Service] Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send approval notification email
   * @param {string} email - Recipient email address
   * @param {string} fullName - User's full name
   * @returns {Promise<object>} Email send result
   */
  async sendApprovalEmail(email, fullName) {
    try {
      if (this.isDemo || !this.resend) {
        console.log('[Email Service] Demo mode - Approval email would be sent to:', email);
        return { success: true, demo: true };
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Your Profile Has Been Approved - SNGS Matrimonial',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <!-- Header -->
              <div style="text-align: center; padding: 30px 0;">
                <h1 style="color: #FF9B00; font-size: 28px; margin: 0;">SNGS Matrimonial</h1>
              </div>

              <!-- Content Box -->
              <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <!-- Success Icon -->
                <div style="text-align: center; margin-bottom: 20px;">
                  <div style="display: inline-block; background-color: #7CEA9C; border-radius: 50%; width: 60px; height: 60px; line-height: 60px;">
                    <span style="font-size: 32px; color: #fff;">&#10003;</span>
                  </div>
                </div>

                <h2 style="color: #333; margin-top: 0; font-size: 24px; text-align: center;">
                  Congratulations, ${fullName}!
                </h2>

                <p style="color: #555; line-height: 1.6; text-align: center; margin-bottom: 20px;">
                  Great news! Your profile on SNGS Matrimonial has been reviewed and approved by our team.
                </p>

                <p style="color: #555; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                  You can now explore profiles and connect with potential matches. We wish you all the best in your journey to find your life partner.
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${this.frontendUrl}/dashboard"
                     style="background-color: #FFE100; color: #333; padding: 15px 35px;
                            text-decoration: none; border-radius: 8px; display: inline-block;
                            font-weight: 600; font-size: 16px;">
                    Start Exploring Profiles
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} SNGS Matrimonial. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('[Email Service] Approval email error:', error);
        throw new Error(`Failed to send approval email: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('[Email Service] Error sending approval email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send rejection notification email
   * @param {string} email - Recipient email address
   * @param {string} fullName - User's full name
   * @param {string} reason - Rejection reason from admin
   * @returns {Promise<object>} Email send result
   */
  async sendRejectionEmail(email, fullName, reason) {
    try {
      if (this.isDemo || !this.resend) {
        console.log('[Email Service] Demo mode - Rejection email would be sent to:', email);
        console.log('[Email Service] Rejection reason:', reason);
        return { success: true, demo: true };
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Profile Review Update - SNGS Matrimonial',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <!-- Header -->
              <div style="text-align: center; padding: 30px 0;">
                <h1 style="color: #FF9B00; font-size: 28px; margin: 0;">SNGS Matrimonial</h1>
              </div>

              <!-- Content Box -->
              <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <h2 style="color: #333; margin-top: 0; font-size: 24px;">
                  Hello ${fullName},
                </h2>

                <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                  Thank you for registering with SNGS Matrimonial. After reviewing your profile, we regret to inform you that we are unable to approve it at this time.
                </p>

                <!-- Reason Box -->
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>Reason:</strong>
                  </p>
                  <p style="color: #856404; margin: 10px 0 0 0; font-size: 14px;">
                    ${reason}
                  </p>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                  If you believe this was an error or would like to update your profile information, please feel free to contact our support team or update your profile and request a re-review.
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${this.frontendUrl}/profile/edit"
                     style="background-color: #546A76; color: #fff; padding: 15px 35px;
                            text-decoration: none; border-radius: 8px; display: inline-block;
                            font-weight: 600; font-size: 16px;">
                    Update My Profile
                  </a>
                </div>

                <p style="color: #888; font-size: 13px; text-align: center; margin-top: 25px;">
                  For any queries, please contact us at support@sngsmatrimonial.com
                </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} SNGS Matrimonial. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('[Email Service] Rejection email error:', error);
        throw new Error(`Failed to send rejection email: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('[Email Service] Error sending rejection email:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
