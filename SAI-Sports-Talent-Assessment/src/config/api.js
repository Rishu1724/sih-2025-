// API Configuration for React Native App
import { Platform } from 'react-native';

// Get backend URL based on platform
const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  } else {
    // For mobile, try to get IP from environment or use common defaults
    // Updated to use your actual IP address
    const mobileIP = process.env.MOBILE_BACKEND_IP || 'http://192.168.13.90:3001';
    
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

// Function to test connectivity to a specific URL with multiple attempts
const testUrlConnectivity = async (url, timeout = 3000) => {
  try {
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${url}${API_CONFIG.ENDPOINTS.HEALTH}`, {
      signal: controller.signal,
      method: 'GET',
      headers: API_CONFIG.HEADERS
    });
    
    clearTimeout(abortTimeout);
    return response.ok;
  } catch (error) {
    console.log(`Connectivity test failed for ${url}:`, error.message);
    return false;
  }
};

// Function to find the first working API URL
const findWorkingApiUrl = async () => {
  // Try the primary URL first
  const primaryUrl = getBackendUrl();
  if (await testUrlConnectivity(primaryUrl, 2000)) {
    return primaryUrl;
  }
  
  // Try other common local IPs
  for (const ip of API_CONFIG.LOCAL_IPS) {
    if (ip !== primaryUrl && await testUrlConnectivity(ip, 1500)) {
      return ip;
    }
  }
  
  // If none work, return the primary URL as fallback
  return primaryUrl;
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
    
    // User Dashboard
    USER_DASHBOARD_STATS: '/api/user-dashboard/stats',
    USER_DASHBOARD_SETTINGS: '/api/user-dashboard/settings',
    
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
  TIMEOUT: 8000, // Reduced from 10000 to 8000ms
  
  // Default headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Common local IP addresses to try (prioritized for faster connection)
  LOCAL_IPS: [
    'http://192.168.13.90:3001', // Your actual IP address
    'http://192.168.1.114:3001', // Primary IP (fallback)
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

// Improved function to test API connectivity with multiple attempts and fallbacks
export const testApiConnectivity = async () => {
  try {
    // First try with the current configured URL
    const currentUrl = API_CONFIG.BASE_URL;
    console.log('Testing API connectivity with current URL:', currentUrl);
    
    if (await testUrlConnectivity(currentUrl, 3000)) {
      console.log('API connectivity test successful with current URL');
      return true;
    }
    
    // If that fails, try to find a working URL
    console.log('Current URL failed, searching for working API URL...');
    const workingUrl = await findWorkingApiUrl();
    
    // Update the API config if we found a different working URL
    if (workingUrl !== currentUrl) {
      console.log('Found working API URL:', workingUrl);
      // Note: We can't modify the exported constant, but we can return the working URL
    }
    
    // Test the working URL
    const isReachable = await testUrlConnectivity(workingUrl, 3000);
    console.log('API connectivity test result with working URL:', isReachable);
    return isReachable;
  } catch (error) {
    console.log('API connectivity test failed:', error.message);
    return false;
  }
};

export default API_CONFIG;