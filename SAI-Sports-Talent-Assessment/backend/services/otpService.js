const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

class OTPService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
      },
      // Add security options for development
      tls: {
        rejectUnauthorized: false // For development only
      }
    });
    
    // In-memory storage for OTPs (in production, use Redis or database)
    this.otpStorage = new Map();
    
    // OTP expiry time (5 minutes)
    this.OTP_EXPIRY_TIME = 5 * 60 * 1000;
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP with expiry
  storeOTP(email, otp) {
    const expiryTime = Date.now() + this.OTP_EXPIRY_TIME;
    this.otpStorage.set(email, {
      otp: otp,
      expiryTime: expiryTime,
      attempts: 0
    });
    
    // Clean up expired OTPs after some time
    setTimeout(() => {
      this.otpStorage.delete(email);
    }, this.OTP_EXPIRY_TIME + 60000); // Extra minute for cleanup
  }

  // Send OTP via email
  async sendOTP(email, purpose = 'login') {
    try {
      const otp = this.generateOTP();
      
      // Store OTP
      this.storeOTP(email, otp);
      
      // For development: If email credentials are not configured, just log the OTP
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || 
          process.env.EMAIL_USER === 'your_gmail@gmail.com') {
        console.log('📧 Development Mode: OTP for', email, 'is:', otp);
        console.log('⚠️ Configure EMAIL_USER and EMAIL_PASSWORD in .env to send real emails');
        console.log('🔗 For Gmail, you need to enable 2FA and create an App Password');
        
        return {
          success: true,
          message: 'OTP generated successfully (Development Mode - Check console)',
          expiryTime: Date.now() + this.OTP_EXPIRY_TIME,
          developmentOTP: otp // Only for development
        };
      }
      
      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `SAI Sports - Your ${purpose} OTP`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <h1 style="color: #1976d2; margin: 0;">SAI Sports Talent Assessment</h1>
            </div>
            <div style="padding: 30px; background-color: white;">
              <h2 style="color: #333; margin-bottom: 20px;">Your ${purpose.toUpperCase()} OTP</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                Hello! You requested a verification code for your SAI Sports account.
              </p>
              <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
                <h1 style="color: #1976d2; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
              </div>
              <p style="color: #666; font-size: 14px; line-height: 1.5;">
                <strong>Important:</strong>
                <br>• This code is valid for 5 minutes only
                <br>• Do not share this code with anyone
                <br>• If you didn't request this code, please ignore this email
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <p style="color: #999; font-size: 12px;">
                  This is an automated email from SAI Sports Talent Assessment System.
                  <br>Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `
      };
      
      // Send email
      await this.transporter.sendMail(mailOptions);
      
      console.log(`OTP sent successfully to ${email} for ${purpose}`);
      return {
        success: true,
        message: 'OTP sent successfully',
        expiryTime: Date.now() + this.OTP_EXPIRY_TIME
      };
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      // If email sending fails, still return the OTP for development
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        const otp = this.generateOTP();
        this.storeOTP(email, otp);
        console.log('📧 Email service not configured. Development OTP for', email, 'is:', otp);
        
        return {
          success: true,
          message: 'OTP generated (Development Mode - Check console)',
          expiryTime: Date.now() + this.OTP_EXPIRY_TIME,
          developmentOTP: otp
        };
      }
      
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  // Verify OTP
  verifyOTP(email, providedOTP) {
    try {
      const storedData = this.otpStorage.get(email);
      
      if (!storedData) {
        return {
          success: false,
          message: 'No OTP found or OTP has expired. Please request a new one.'
        };
      }
      
      // Check if OTP has expired
      if (Date.now() > storedData.expiryTime) {
        this.otpStorage.delete(email);
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        };
      }
      
      // Check attempt limit (max 3 attempts)
      if (storedData.attempts >= 3) {
        this.otpStorage.delete(email);
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.'
        };
      }
      
      // Verify OTP
      if (storedData.otp === providedOTP.toString()) {
        // OTP is correct, remove from storage
        this.otpStorage.delete(email);
        return {
          success: true,
          message: 'OTP verified successfully'
        };
      } else {
        // Increment attempt count
        storedData.attempts += 1;
        this.otpStorage.set(email, storedData);
        
        const remainingAttempts = 3 - storedData.attempts;
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
        };
      }
      
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('Failed to verify OTP. Please try again.');
    }
  }

  // Check if OTP is required for email
  isOTPRequired(email) {
    // For now, require OTP for all emails
    // You can add logic here to determine when OTP is required
    return true;
  }

  // Get OTP status for an email
  getOTPStatus(email) {
    const storedData = this.otpStorage.get(email);
    
    if (!storedData) {
      return {
        exists: false,
        message: 'No OTP found'
      };
    }
    
    const timeRemaining = storedData.expiryTime - Date.now();
    
    if (timeRemaining <= 0) {
      this.otpStorage.delete(email);
      return {
        exists: false,
        message: 'OTP has expired'
      };
    }
    
    return {
      exists: true,
      expiryTime: storedData.expiryTime,
      timeRemaining: Math.ceil(timeRemaining / 1000), // in seconds
      attempts: storedData.attempts
    };
  }
}

module.exports = new OTPService();