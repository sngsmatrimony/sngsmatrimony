/**
 * Console OTP Provider
 * Logs OTP to console for development/testing
 * Logs are shown in server terminal
 */

exports.send = async (mobileNumber, otp) => {
  console.log('='.repeat(60));
  console.log('[OTP SERVICE] OTP Request');
  console.log(`[OTP SERVICE] Mobile Number: ${mobileNumber}`);
  console.log(`[OTP SERVICE] OTP Code: ${otp}`);
  console.log(`[OTP SERVICE] Validity: 5 minutes`);
  console.log(`[OTP SERVICE] Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  return {
    success: true,
    provider: 'console',
    message: 'OTP logged to console'
  };
};
