/**
 * Network Test Utility
 * Utility to test network connectivity and diagnose issues
 */

import { API_CONFIG } from '../config/api';

/**
 * Test network connectivity to backend
 * @returns {Promise<Object>} Connection test results
 */
export const testNetworkConnectivity = async () => {
  const results = {
    success: false,
    message: '',
    testedUrls: [],
    workingUrl: null
  };

  // List of URLs to test
  const urlsToTry = [
    `${API_CONFIG.BASE_URL}/api/health`,
    'http://192.168.1.114:3001/api/health',
    'http://localhost:3001/api/health',
    'http://10.0.2.2:3001/api/health'
  ];

  for (const url of urlsToTry) {
    try {
      results.testedUrls.push(url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        results.success = true;
        results.workingUrl = url;
        results.message = `Successfully connected to ${url}`;
        return results;
      }
    } catch (error) {
      console.log(`Failed to connect to ${url}:`, error.message);
      continue;
    }
  }
  
  results.message = 'Unable to connect to any backend server. Please check your network connection and ensure the backend is running.';
  return results;
};

/**
 * Test Firebase connectivity
 * @returns {Promise<Object>} Firebase test results
 */
export const testFirebaseConnectivity = async () => {
  try {
    // Import Firebase services
    const { getAthletes } = require('../services/FirebaseService');
    
    // Try to fetch a small amount of data
    const athletes = await getAthletes();
    
    return {
      success: true,
      message: `Successfully connected to Firebase. Found ${athletes.length} athletes.`,
      athleteCount: athletes.length
    };
  } catch (error) {
    return {
      success: false,
      message: `Firebase connection failed: ${error.message}`,
      error: error
    };
  }
};

export default {
  testNetworkConnectivity,
  testFirebaseConnectivity
};