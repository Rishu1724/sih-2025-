/**
 * Network Utilities for handling connectivity issues
 */

import { API_CONFIG } from '../config/api';

/**
 * Test network connectivity to backend with faster timeout
 * @returns {Promise<{success: boolean, baseUrl: string}>}
 */
export const testNetworkConnectivity = async () => {
  // Try the current BASE_URL first with a shorter timeout
  const urlsToTry = [
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`,
    ...API_CONFIG.LOCAL_IPS.map(ip => `${ip}${API_CONFIG.ENDPOINTS.HEALTH}`)
  ];
  
  // Add a simple timeout-based check for faster failure on mobile
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => resolve({ success: false, baseUrl: API_CONFIG.BASE_URL }), 1000); // Reduced from 1500 to 1000ms
  });
  
  // Create network test promises with shorter timeouts
  const networkTestPromises = urlsToTry.map(async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500); // Reduced from 1000 to 500ms
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const newBaseUrl = url.replace(API_CONFIG.ENDPOINTS.HEALTH, '');
        return { success: true, baseUrl: newBaseUrl };
      }
      return null;
    } catch (error) {
      return null;
    }
  });
  
  // Race network tests against timeout
  try {
    const results = await Promise.race([
      Promise.all(networkTestPromises),
      timeoutPromise
    ]);
    
    // Check if any test succeeded
    if (Array.isArray(results)) {
      const successfulResult = results.find(result => result && result.success);
      if (successfulResult) {
        return successfulResult;
      }
    }
    
    return { success: false, baseUrl: API_CONFIG.BASE_URL };
  } catch (error) {
    return { success: false, baseUrl: API_CONFIG.BASE_URL };
  }
};

/**
 * Make a network request with fallback and faster timeout
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const makeNetworkRequest = async (endpoint, options = {}) => {
  // First test connectivity
  const { success, baseUrl } = await testNetworkConnectivity();
  
  if (!success) {
    throw new Error('Network request failed: No connection to backend');
  }
  
  // Update the base URL if needed
  const originalBaseUrl = API_CONFIG.BASE_URL;
  if (baseUrl !== originalBaseUrl) {
    API_CONFIG.BASE_URL = baseUrl;
  }
  
  // Make the request
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000); // Reduced from 15000 to 10000ms
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export default {
  testNetworkConnectivity,
  makeNetworkRequest
};