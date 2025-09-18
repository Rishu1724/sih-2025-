// API Configuration for React Native App
import { Platform } from 'react-native';

// Get backend URL based on platform
const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  } else {
    // For mobile, try to get IP from environment or use common defaults
    const mobileIP = process.env.MOBILE_BACKEND_IP || 'http://192.168.1.114:3001';
    
    // Try to detect if we're in development or production
    if (__DEV__) {
      // In development, try common local IPs
      return mobileIP;
    } else {
      // In production, you might want to use a different URL
      return mobileIP;
    }
  }
};

export const API_CONFIG = {
  BASE_URL: getBackendUrl(),
  ENDPOINTS: {
    // Authentication
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    
    // Athletes
    ATHLETES: '/api/athletes',
    ATHLETE_REGISTER: '/api/athletes/register',
    
    // Assessments
    ASSESSMENTS: '/api/assessments',
    ASSESSMENT_SUBMIT: '/api/assessments/submit',
    ASSESSMENT_AI_ANALYSIS: '/api/assessments',
    ASSESSMENT_REPROCESS: '/api/assessments',
    ASSESSMENT_PROCESS_AI: '/api/assessments', // New endpoint for AI processing
    
    // OTP
    OTP_SEND: '/api/otp/send-otp',
    OTP_VERIFY: '/api/otp/verify-otp',
    OTP_RESEND: '/api/otp/resend-otp',
    
    // Uploads
    UPLOADS: '/api/uploads',
    
    // Health check
    HEALTH: '/api/health',
  },
  
  // Request timeout - reduced for faster failure
  TIMEOUT: 15000,
  
  // Default headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Common local IP addresses to try
  LOCAL_IPS: [
    'http://192.168.1.114:3001',
    'http://192.168.0.100:3001',
    'http://192.168.1.100:3001',
    'http://10.0.0.100:3001',
    'http://172.20.10.1:3001',
    'http://10.0.2.2:3001', // Android emulator
    'http://localhost:3001',
    // Additional common IPs
    'http://192.168.1.1:3001',
    'http://192.168.0.1:3001',
    'http://10.0.0.1:3001'
  ]
};

// Function to test API connectivity
export const testApiConnectivity = async (baseUrl = API_CONFIG.BASE_URL) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${baseUrl}${API_CONFIG.ENDPOINTS.HEALTH}`, {
      signal: controller.signal,
      method: 'GET',
      headers: API_CONFIG.HEADERS
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    console.log('API connectivity test failed:', error.message);
    return false;
  }
};

export default API_CONFIG;