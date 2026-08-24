const axios = require('axios');

/**
 * 2Factor SMS Provider
 * Sends OTP via 2Factor India SMS service
 * API Documentation: https://2factor.in/docs
 */

const TWO_FACTOR_API_URL = 'https://2factor.in/API/R1/';
const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;
const TWO_FACTOR_SENDER_ID = process.env.TWO_FACTOR_SENDER_ID || 'SNGSMT'; // DLT approved sender ID
const TWO_FACTOR_TEMPLATE_NAME = process.env.TWO_FACTOR_TEMPLATE_NAME || 'Verify Mobile'; // Template name
const TWO_FACTOR_TEMPLATE_CTID = process.env.TWO_FACTOR_TEMPLATE_CTID; // DLT Content Template ID (CT Id) - optional

if (!TWO_FACTOR_API_KEY) {
  console.warn('[2Factor Provider] Warning: TWO_FACTOR_API_KEY not configured');
}
if (!TWO_FACTOR_TEMPLATE_CTID) {
  console.warn('[2Factor Provider] Note: TWO_FACTOR_TEMPLATE_CTID not configured. SMS will be sent without template ID (optional parameter).');
}

/**
 * Send OTP via 2Factor SMS
 * @param {string} mobileNumber - 10-digit Indian mobile number (without +91)
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<object>} Response with success status and message ID
 */
exports.send = async (mobileNumber, otp) => {
  try {
    // Validate inputs
    if (!TWO_FACTOR_API_KEY) {
      throw new Error('TWO_FACTOR_API_KEY not configured in environment variables');
    }

    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      throw new Error('Invalid Indian mobile number format');
    }

    // Build the OTP message using the DLT-approved template format
    // Template: "XXXX is your OTP for verification on SNGS Matrimonial"
    const message = `${otp} is your OTP for verification on SNGS Matrimonial`;

    // Prepare form data for R1 API with DLT-approved template
    const params = new URLSearchParams();
    params.append('module', 'TRANS_SMS');
    params.append('apikey', TWO_FACTOR_API_KEY);
    params.append('to', `91${mobileNumber}`); // Phone number with country code
    params.append('from', TWO_FACTOR_SENDER_ID); // DLT approved sender ID
    params.append('msg', message); // DLT approved message text
    params.append('templatename', TWO_FACTOR_TEMPLATE_NAME); // Template name (required)

    // Add CTID if available (optional parameter)
    if (TWO_FACTOR_TEMPLATE_CTID) {
      params.append('ctid', TWO_FACTOR_TEMPLATE_CTID); // DLT Content Template ID
    }

    // Send request to 2Factor R1 API
    const ctidInfo = TWO_FACTOR_TEMPLATE_CTID ? `(CT ID: ${TWO_FACTOR_TEMPLATE_CTID})` : '(no CT ID)';
    console.log(`[2Factor Provider] Sending OTP to 91${mobileNumber} ${ctidInfo}`);
    console.log(TWO_FACTOR_API_URL, params.toString());

    const response = await axios.post(TWO_FACTOR_API_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000 // 10 second timeout
    });

    // Log the full response for debugging
    console.log('[2Factor Provider] API Response:', JSON.stringify(response.data));

    // Check response status
    if (response.data && response.data.Status === 'Success') {
      console.log(`[2Factor Provider] OTP sent successfully. Message ID: ${response.data.Details}`);

      return {
        success: true,
        provider: '2factor',
        messageId: response.data.Details,
        rawResponse: response.data
      };
    } else {
      // API returned non-success status
      const errorDetails = response.data?.Details || 'Unknown error';
      console.error(`[2Factor Provider] API returned error: ${errorDetails}`);

      throw new Error(`2Factor API error: ${errorDetails}`);
    }
  } catch (error) {
    // Handle different error types
    if (error.response) {
      // HTTP error response from 2Factor API
      console.error('[2Factor Provider] HTTP Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
      throw new Error(`2Factor API HTTP error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('[2Factor Provider] Network Error - No response received:', error.message);
      throw new Error('Failed to connect to 2Factor API - Network error');
    } else {
      // Other errors (validation, configuration, etc.)
      console.error('[2Factor Provider] Error sending OTP:', error.message);
      throw new Error(`Failed to send OTP via 2Factor: ${error.message}`);
    }
  }
};

/**
 * Health check for 2Factor provider
 * @returns {boolean} True if provider is configured
 */
exports.isConfigured = () => {
  return !!TWO_FACTOR_API_KEY;
};
