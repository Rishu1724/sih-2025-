/**
 * Firebase Constants
 * 
 * This file contains all Firebase-related constants used throughout the application.
 */

// Firebase Collection Names
export const COLLECTIONS = {
  ATHLETES: 'athletes',
  ASSESSMENTS: 'assessments',
  USERS: 'users'
};

// Firebase Error Codes
export const FIREBASE_ERRORS = {
  PERMISSION_DENIED: 'permission-denied',
  NOT_FOUND: 'not-found',
  ALREADY_EXISTS: 'already-exists',
  INVALID_ARGUMENT: 'invalid-argument',
  UNAUTHENTICATED: 'unauthenticated',
  NETWORK_ERROR: 'unavailable'
};

// Default query limits
export const QUERY_LIMITS = {
  RECENT_ACTIVITIES: 5,
  ASSESSMENT_LIST: 50,
  ATHLETE_LIST: 100
};

export default {
  COLLECTIONS,
  FIREBASE_ERRORS,
  QUERY_LIMITS
};