const { db } = require('../config/firebase');
const { collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = require('firebase/firestore');

// Collections
const COLLECTIONS = {
  USERS: 'users',
  ATHLETES: 'athletes',
  ASSESSMENTS: 'assessments',
  TEST_RESULTS: 'testResults',
  VIDEOS: 'videos',
  ACHIEVEMENTS: 'achievements',
  NOTIFICATIONS: 'notifications'
};

// User Profile Functions
const createUser = async (userData) => {
  try {
    const userRef = collection(db, COLLECTIONS.USERS);
    const docRef = await addDoc(userRef, {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user profile');
  }
};

const getUser = async (userId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to get user profile');
  }
};

const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user profile');
  }
};

// Athlete Functions
const createAthlete = async (athleteData) => {
  try {
    const athleteRef = collection(db, COLLECTIONS.ATHLETES);
    const docRef = await addDoc(athleteRef, {
      ...athleteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating athlete:', error);
    throw new Error('Failed to create athlete profile');
  }
};

const getAthletes = async (filters = {}) => {
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

const getAthlete = async (athleteId) => {
  try {
    const athleteRef = doc(db, COLLECTIONS.ATHLETES, athleteId);
    const athleteSnap = await getDoc(athleteRef);
    
    if (athleteSnap.exists()) {
      return { id: athleteSnap.id, ...athleteSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting athlete:', error);
    throw new Error('Failed to get athlete profile');
  }
};

const updateAthlete = async (athleteId, athleteData) => {
  try {
    const athleteRef = doc(db, COLLECTIONS.ATHLETES, athleteId);
    await updateDoc(athleteRef, {
      ...athleteData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating athlete:', error);
    throw new Error('Failed to update athlete profile');
  }
};

// Assessment Functions
const createAssessment = async (assessmentData) => {
  try {
    const assessmentRef = collection(db, COLLECTIONS.ASSESSMENTS);
    const docRef = await addDoc(assessmentRef, {
      ...assessmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw new Error('Failed to create assessment');
  }
};

const getAssessments = async (filters = {}) => {
  try {
    let q = collection(db, COLLECTIONS.ASSESSMENTS);
    
    // Apply filters
    if (filters.athleteId) {
      q = query(q, where('athleteId', '==', filters.athleteId));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.assessorId) {
      q = query(q, where('assessorId', '==', filters.assessorId));
    }
    
    // Order by creation date
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

const updateAssessment = async (assessmentId, assessmentData) => {
  try {
    const assessmentRef = doc(db, COLLECTIONS.ASSESSMENTS, assessmentId);
    await updateDoc(assessmentRef, {
      ...assessmentData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating assessment:', error);
    throw new Error('Failed to update assessment');
  }
};

// Test Results Functions
const createTestResult = async (testResultData) => {
  try {
    const testResultRef = collection(db, COLLECTIONS.TEST_RESULTS);
    const docRef = await addDoc(testResultRef, {
      ...testResultData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating test result:', error);
    throw new Error('Failed to create test result');
  }
};

const getTestResults = async (filters = {}) => {
  try {
    let q = collection(db, COLLECTIONS.TEST_RESULTS);
    
    // Apply filters
    if (filters.athleteId) {
      q = query(q, where('athleteId', '==', filters.athleteId));
    }
    if (filters.testType) {
      q = query(q, where('testType', '==', filters.testType));
    }
    if (filters.assessmentId) {
      q = query(q, where('assessmentId', '==', filters.assessmentId));
    }
    
    // Order by creation date
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const testResults = [];
    
    querySnapshot.forEach((doc) => {
      testResults.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return testResults;
  } catch (error) {
    console.error('Error getting test results:', error);
    throw new Error('Failed to get test results');
  }
};

// Video Storage Functions
const createVideoRecord = async (videoData) => {
  try {
    const videoRef = collection(db, COLLECTIONS.VIDEOS);
    const docRef = await addDoc(videoRef, {
      ...videoData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'uploaded'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating video record:', error);
    throw new Error('Failed to create video record');
  }
};

const getVideos = async (filters = {}) => {
  try {
    let q = collection(db, COLLECTIONS.VIDEOS);
    
    // Apply filters
    if (filters.athleteId) {
      q = query(q, where('athleteId', '==', filters.athleteId));
    }
    if (filters.testType) {
      q = query(q, where('testType', '==', filters.testType));
    }
    if (filters.assessmentId) {
      q = query(q, where('assessmentId', '==', filters.assessmentId));
    }
    
    // Order by creation date
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const videos = [];
    
    querySnapshot.forEach((doc) => {
      videos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return videos;
  } catch (error) {
    console.error('Error getting videos:', error);
    throw new Error('Failed to get videos');
  }
};

// Achievement Functions
const createAchievement = async (achievementData) => {
  try {
    const achievementRef = collection(db, COLLECTIONS.ACHIEVEMENTS);
    const docRef = await addDoc(achievementRef, {
      ...achievementData,
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating achievement:', error);
    throw new Error('Failed to create achievement');
  }
};

const getAchievements = async (athleteId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ACHIEVEMENTS),
      where('athleteId', '==', athleteId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const achievements = [];
    
    querySnapshot.forEach((doc) => {
      achievements.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return achievements;
  } catch (error) {
    console.error('Error getting achievements:', error);
    throw new Error('Failed to get achievements');
  }
};

// Notification Functions
const createNotification = async (notificationData) => {
  try {
    const notificationRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const docRef = await addDoc(notificationRef, {
      ...notificationData,
      createdAt: new Date().toISOString(),
      read: false
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
};

const getNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw new Error('Failed to get notifications');
  }
};

module.exports = {
  COLLECTIONS,
  // User functions
  createUser,
  getUser,
  updateUser,
  // Athlete functions
  createAthlete,
  getAthletes,
  getAthlete,
  updateAthlete,
  // Assessment functions
  createAssessment,
  getAssessments,
  updateAssessment,
  // Test result functions
  createTestResult,
  getTestResults,
  // Video functions
  createVideoRecord,
  getVideos,
  // Achievement functions
  createAchievement,
  getAchievements,
  // Notification functions
  createNotification,
  getNotifications
};