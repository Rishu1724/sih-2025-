import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../constants/firebase';
import { getAthletes, getAssessments } from './FirebaseService';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * User Dashboard Service for handling user-specific dashboard statistics
 */

// Local storage keys
const USER_DASHBOARD_STATS_KEY = 'userDashboardStats_';
const USER_DASHBOARD_SETTINGS_KEY = 'userDashboardSettings_';

/**
 * Get or create user dashboard statistics
 * @param {string} userId - Firebase user ID
 * @param {string} userEmail - User email for identification
 * @returns {Promise<Object>} User dashboard statistics
 */
export const getUserDashboardStats = async (userId, userEmail) => {
  try {
    // First try to get stats from API
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_DASHBOARD_STATS}/${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Cache the result locally
          await AsyncStorage.setItem(USER_DASHBOARD_STATS_KEY + userId, JSON.stringify(result.data));
          return result.data;
        }
      }
    } catch (apiError) {
      console.log('API fetch failed for user stats, falling back to local cache:', apiError.message);
    }
    
    // Try to get from local cache first
    try {
      const cachedStats = await AsyncStorage.getItem(USER_DASHBOARD_STATS_KEY + userId);
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }
    } catch (cacheError) {
      console.log('Local cache fetch failed:', cacheError.message);
    }
    
    // Fallback to Firebase
    const userStatsRef = doc(db, 'userDashboardStats', userId);
    const userStatsSnap = await getDoc(userStatsRef);
    
    if (userStatsSnap.exists()) {
      const stats = { id: userStatsSnap.id, ...userStatsSnap.data() };
      // Cache the result locally
      await AsyncStorage.setItem(USER_DASHBOARD_STATS_KEY + userId, JSON.stringify(stats));
      return stats;
    } else {
      // Create new user stats with default values
      const defaultStats = {
        userId,
        userEmail,
        totalAthletes: 0,
        totalAssessments: 0,
        pendingEvaluations: 0,
        completedToday: 0,
        lastUpdated: new Date().toISOString(),
        // Personalized settings
        personalized: true,
        overviewType: 'personal' // 'personal' or 'global'
      };
      
      await setDoc(userStatsRef, defaultStats);
      // Cache the result locally
      await AsyncStorage.setItem(USER_DASHBOARD_STATS_KEY + userId, JSON.stringify(defaultStats));
      return defaultStats;
    }
  } catch (error) {
    console.error('Error getting user dashboard stats:', error);
    
    // Try to get from local cache as last resort
    try {
      const cachedStats = await AsyncStorage.getItem(USER_DASHBOARD_STATS_KEY + userId);
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }
    } catch (cacheError) {
      console.log('Local cache fetch failed:', cacheError.message);
    }
    
    // Return default stats if there's an error
    const defaultStats = {
      userId,
      userEmail,
      totalAthletes: 0,
      totalAssessments: 0,
      pendingEvaluations: 0,
      completedToday: 0,
      lastUpdated: new Date().toISOString(),
      personalized: true,
      overviewType: 'personal'
    };
    
    // Cache the default stats locally
    await AsyncStorage.setItem(USER_DASHBOARD_STATS_KEY + userId, JSON.stringify(defaultStats));
    return defaultStats;
  }
};

/**
 * Update user dashboard statistics
 * @param {string} userId - Firebase user ID
 * @param {Object} stats - Statistics to update
 * @returns {Promise<Object>} Update result
 */
export const updateUserDashboardStats = async (userId, stats) => {
  try {
    // Try to update stats via API first
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_DASHBOARD_STATS}/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stats)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Cache the result locally
          await AsyncStorage.setItem(USER_DASHBOARD_STATS_KEY + userId, JSON.stringify(result.data || stats));
          return result;
        }
      }
    } catch (apiError) {
      console.log('API update failed for user stats, falling back to Firebase:', apiError.message);
    }
    
    // Fallback to Firebase
    const userStatsRef = doc(db, 'userDashboardStats', userId);
    const updatedStats = {
      ...stats,
      lastUpdated: new Date().toISOString()
    };
    
    await updateDoc(userStatsRef, updatedStats);
    // Cache the result locally
    await AsyncStorage.setItem(USER_DASHBOARD_STATS_KEY + userId, JSON.stringify(updatedStats));
    return { success: true, data: updatedStats };
  } catch (error) {
    console.error('Error updating user dashboard stats:', error);
    
    // Even if Firebase fails, cache locally
    try {
      const updatedStats = {
        ...stats,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(USER_DASHBOARD_STATS_KEY + userId, JSON.stringify(updatedStats));
      return { success: true, data: updatedStats };
    } catch (cacheError) {
      console.log('Failed to cache stats locally:', cacheError.message);
    }
    
    throw new Error('Failed to update user dashboard stats: ' + error.message);
  }
};

/**
 * Calculate and update user-specific dashboard statistics
 * @param {string} userId - Firebase user ID
 * @param {string} userEmail - User email
 * @returns {Promise<Object>} Updated statistics
 */
export const calculateAndUpdateUserStats = async (userId, userEmail) => {
  try {
    // Get all athletes and assessments (in a real app, you might filter by user)
    const athletes = await getAthletes();
    const assessments = await getAssessments();
    
    // Calculate statistics
    const totalAthletes = athletes.length;
    const totalAssessments = assessments.length;
    const pendingEvaluations = assessments.filter(a => 
      a.status === 'Pending' || a.status === 'Processing'
    ).length;
    
    const today = new Date().toDateString();
    const completedToday = assessments.filter(a => 
      new Date(a.submissionDate || a.createdAt?.toDate?.() || a.createdAt).toDateString() === today
    ).length;
    
    // Prepare stats object
    const stats = {
      userId,
      userEmail,
      totalAthletes,
      totalAssessments,
      pendingEvaluations,
      completedToday
    };
    
    // Update user stats
    await updateUserDashboardStats(userId, stats);
    
    return stats;
  } catch (error) {
    console.error('Error calculating user stats:', error);
    throw new Error('Failed to calculate user statistics: ' + error.message);
  }
};

/**
 * Get personalized dashboard view settings
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} User dashboard settings
 */
export const getUserDashboardSettings = async (userId) => {
  try {
    // First try to get settings from API
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_DASHBOARD_SETTINGS}/${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Cache the result locally
          await AsyncStorage.setItem(USER_DASHBOARD_SETTINGS_KEY + userId, JSON.stringify(result.data));
          return result.data;
        }
      }
    } catch (apiError) {
      console.log('API fetch failed for user settings, falling back to local cache:', apiError.message);
    }
    
    // Try to get from local cache first
    try {
      const cachedSettings = await AsyncStorage.getItem(USER_DASHBOARD_SETTINGS_KEY + userId);
      if (cachedSettings) {
        return JSON.parse(cachedSettings);
      }
    } catch (cacheError) {
      console.log('Local cache fetch failed:', cacheError.message);
    }
    
    // Fallback to Firebase
    const userSettingsRef = doc(db, 'userDashboardSettings', userId);
    const userSettingsSnap = await getDoc(userSettingsRef);
    
    if (userSettingsSnap.exists()) {
      const settings = { id: userSettingsSnap.id, ...userSettingsSnap.data() };
      // Cache the result locally
      await AsyncStorage.setItem(USER_DASHBOARD_SETTINGS_KEY + userId, JSON.stringify(settings));
      return settings;
    } else {
      // Create default settings
      const defaultSettings = {
        userId,
        overviewType: 'personal', // 'personal' or 'global'
        showPersonalizedStats: true,
        lastUpdated: new Date().toISOString()
      };
      
      await setDoc(userSettingsRef, defaultSettings);
      // Cache the result locally
      await AsyncStorage.setItem(USER_DASHBOARD_SETTINGS_KEY + userId, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error getting user dashboard settings:', error);
    
    // Try to get from local cache as last resort
    try {
      const cachedSettings = await AsyncStorage.getItem(USER_DASHBOARD_SETTINGS_KEY + userId);
      if (cachedSettings) {
        return JSON.parse(cachedSettings);
      }
    } catch (cacheError) {
      console.log('Local cache fetch failed:', cacheError.message);
    }
    
    // Return default settings
    const defaultSettings = {
      userId,
      overviewType: 'personal',
      showPersonalizedStats: true,
      lastUpdated: new Date().toISOString()
    };
    
    // Cache the default settings locally
    await AsyncStorage.setItem(USER_DASHBOARD_SETTINGS_KEY + userId, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
};

/**
 * Update user dashboard settings
 * @param {string} userId - Firebase user ID
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Update result
 */
export const updateUserDashboardSettings = async (userId, settings) => {
  try {
    // Try to update settings via API first
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_DASHBOARD_SETTINGS}/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Cache the result locally
          await AsyncStorage.setItem(USER_DASHBOARD_SETTINGS_KEY + userId, JSON.stringify(result.data || settings));
          return result;
        }
      }
    } catch (apiError) {
      console.log('API update failed for user settings, falling back to Firebase:', apiError.message);
    }
    
    // Fallback to Firebase
    const userSettingsRef = doc(db, 'userDashboardSettings', userId);
    const updatedSettings = {
      ...settings,
      lastUpdated: new Date().toISOString()
    };
    
    await updateDoc(userSettingsRef, updatedSettings);
    // Cache the result locally
    await AsyncStorage.setItem(USER_DASHBOARD_SETTINGS_KEY + userId, JSON.stringify(updatedSettings));
    return { success: true, data: updatedSettings };
  } catch (error) {
    console.error('Error updating user dashboard settings:', error);
    
    // Even if Firebase fails, cache locally
    try {
      const updatedSettings = {
        ...settings,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(USER_DASHBOARD_SETTINGS_KEY + userId, JSON.stringify(updatedSettings));
      return { success: true, data: updatedSettings };
    } catch (cacheError) {
      console.log('Failed to cache settings locally:', cacheError.message);
    }
    
    throw new Error('Failed to update user dashboard settings: ' + error.message);
  }
};

export default {
  getUserDashboardStats,
  updateUserDashboardStats,
  calculateAndUpdateUserStats,
  getUserDashboardSettings,
  updateUserDashboardSettings
};