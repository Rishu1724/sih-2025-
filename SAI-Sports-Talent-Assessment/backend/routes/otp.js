const express = require('express');
const router = express.Router();
const otpService = require('../services/otpService');
const admin = require('firebase-admin');

// Send OTP to email
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'login' } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Check if email exists in Firebase (optional - you might want to allow OTP for any email)
    try {
      await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // For development, we'll allow OTP even if user not found
        console.warn(`User with email ${email} not found in Firebase, but allowing OTP for development`);
      } else {
        console.error('Firebase auth error:', error);
        // Don't block OTP for other Firebase errors in development
      }
    }
    
    // Check if OTP was recently sent (rate limiting)
    const existingOTP = otpService.getOTPStatus(email);
    if (existingOTP.exists && existingOTP.timeRemaining > 240) { // Don't allow new OTP if less than 1 minute passed
      return res.status(429).json({
        success: false,
        message: `Please wait ${existingOTP.timeRemaining} seconds before requesting a new OTP`
      });
    }
    
    // Send OTP
    const result = await otpService.sendOTP(email, purpose);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiryTime: result.expiryTime
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.'
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be a 6-digit number'
      });
    }
    
    // Verify OTP
    const result = otpService.verifyOTP(email, otp);
    
    if (result.success) {
      // Generate a temporary token for successful OTP verification
      // This token can be used for a short time to complete the authentication
      const tempToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      
      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        tempToken: tempToken // This can be used for completing the login process
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP. Please try again.'
    });
  }
});

// Get OTP status
router.get('/otp-status/:email', (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const status = otpService.getOTPStatus(email);
    
    res.status(200).json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('Get OTP status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OTP status'
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, purpose = 'login' } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Rate limiting: check if enough time has passed since last OTP
    const existingOTP = otpService.getOTPStatus(email);
    if (existingOTP.exists && existingOTP.timeRemaining > 240) { // Must wait at least 1 minute
      return res.status(429).json({
        success: false,
        message: `Please wait ${Math.ceil(existingOTP.timeRemaining)} seconds before requesting a new OTP`
      });
    }
    
    // Send new OTP
    const result = await otpService.sendOTP(email, purpose);
    
    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully to your email',
      expiryTime: result.expiryTime
    });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend OTP. Please try again.'
    });
  }
});

module.exports = router;