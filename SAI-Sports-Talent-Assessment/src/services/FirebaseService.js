import { collection, addDoc, getDocs, getDoc, doc, query, where, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../constants/firebase';

/**
 * Firebase Service for handling Firestore operations
 */

/**
 * Create a new athlete
 * @param {Object} athleteData - Athlete data to store
 * @returns {Promise<Object>} Document reference
 */
export const createAthlete = async (athleteData) => {
  try {
    // Optimized athlete creation without excessive logging
    const docRef = await addDoc(collection(db, COLLECTIONS.ATHLETES), {
      ...athleteData,
      // Use serverTimestamp for better consistency
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating athlete:', error);
    throw new Error('Failed to create athlete: ' + error.message);
  }
};

/**
 * Get all athletes
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of athletes
 */
export const getAthletes = async (filters = {}) => {
  try {
    let q = collection(db, COLLECTIONS.ATHLETES);
    
    // Apply filters if provided
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.sport) {
      q = query(q, where('sport', '==', filters.sport));
    }
    if (filters.ageGroup) {
      q = query(q, where('ageGroup', '==', filters.ageGroup));
    }
    
    // Order by creation date
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const athletes = [];
    
    querySnapshot.forEach((doc) => {
      athletes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return athletes;
  } catch (error) {
    console.error('Error getting athletes:', error);
    throw new Error('Failed to get athletes');
  }
};

/**
 * Get a specific athlete by ID
 * @param {string} athleteId - Athlete ID
 * @returns {Promise<Object|null>} Athlete data or null
 */
export const getAthlete = async (athleteId) => {
  try {
    const athleteRef = doc(db, COLLECTIONS.ATHLETES, athleteId);
    const athleteSnap = await getDoc(athleteRef);
    
    if (athleteSnap.exists()) {
      return { id: athleteSnap.id, ...athleteSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting athlete:', error);
    throw new Error('Failed to get athlete');
  }
};

/**
 * Update an athlete
 * @param {string} athleteId - Athlete ID
 * @param {Object} athleteData - Data to update
 * @returns {Promise<Object>} Update result
 */
export const updateAthlete = async (athleteId, athleteData) => {
  try {
    const athleteRef = doc(db, COLLECTIONS.ATHLETES, athleteId);
    await updateDoc(athleteRef, {
      ...athleteData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating athlete:', error);
    throw new Error('Failed to update athlete');
  }
};

/**
 * Create a new assessment
 * @param {Object} assessmentData - Assessment data to store
 * @returns {Promise<Object>} Document reference
 */
export const createAssessment = async (assessmentData) => {
  try {
    // Ensure the assessment has the proper structure for recent activities and history
    const assessmentWithDefaults = {
      status: 'Processing', // Default status
      submissionDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...assessmentData
    };
    
    // Remove any undefined or null values that might cause issues
    Object.keys(assessmentWithDefaults).forEach(key => {
      if (assessmentWithDefaults[key] === undefined || assessmentWithDefaults[key] === null) {
        delete assessmentWithDefaults[key];
      }
    });
    
    // Ensure video metadata is properly structured
    if (assessmentWithDefaults.videoMetadata) {
      assessmentWithDefaults.videoFile = assessmentWithDefaults.videoMetadata;
      delete assessmentWithDefaults.videoMetadata;
    }
    
    const docRef = await addDoc(collection(db, COLLECTIONS.ASSESSMENTS), assessmentWithDefaults);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw new Error('Failed to create assessment: ' + error.message);
  }
};

/**
 * Get assessments
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of assessments
 */
export const getAssessments = async (filters = {}) => {
  try {
    let q = collection(db, COLLECTIONS.ASSESSMENTS);
    
    // Apply filters
    if (filters.athleteId) {
      q = query(q, where('athleteId', '==', filters.athleteId));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    // Order by creation date (newest first for recent activities)
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const assessments = [];
    
    querySnapshot.forEach((doc) => {
      assessments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return assessments;
  } catch (error) {
    console.error('Error getting assessments:', error);
    throw new Error('Failed to get assessments');
  }
};

/**
 * Get a specific assessment by ID
 * @param {string} assessmentId - Assessment ID
 * @returns {Promise<Object|null>} Assessment data or null
 */
export const getAssessment = async (assessmentId) => {
  try {
    const assessmentRef = doc(db, COLLECTIONS.ASSESSMENTS, assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);
    
    if (assessmentSnap.exists()) {
      return { id: assessmentSnap.id, ...assessmentSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting assessment:', error);
    throw new Error('Failed to get assessment');
  }
};

/**
 * Update an assessment
 * @param {string} assessmentId - Assessment ID
 * @param {Object} assessmentData - Data to update
 * @returns {Promise<Object>} Update result
 */
export const updateAssessment = async (assessmentId, assessmentData) => {
  try {
    const assessmentRef = doc(db, COLLECTIONS.ASSESSMENTS, assessmentId);
    await updateDoc(assessmentRef, {
      ...assessmentData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating assessment:', error);
    throw new Error('Failed to update assessment');
  }
};

export default {
  createAthlete,
  getAthletes,
  getAthlete,
  updateAthlete,
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment
};