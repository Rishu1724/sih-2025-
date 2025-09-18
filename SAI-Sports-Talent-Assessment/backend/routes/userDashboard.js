const express = require('express');
const router = express.Router();
const { adminDb } = require('../config/firebase');

// GET /api/user-dashboard/stats/:userId - Get user-specific dashboard statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Get user dashboard stats from Firestore
    const userStatsRef = adminDb.collection('userDashboardStats').doc(userId);
    const userStatsSnap = await userStatsRef.get();
    
    if (userStatsSnap.exists) {
      const stats = { id: userStatsSnap.id, ...userStatsSnap.data() };
      return res.json({
        success: true,
        data: stats
      });
    } else {
      // Return default stats if user stats don't exist
      const defaultStats = {
        userId,
        totalAthletes: 0,
        totalAssessments: 0,
        pendingEvaluations: 0,
        completedToday: 0,
        lastUpdated: new Date().toISOString(),
        personalized: true,
        overviewType: 'personal'
      };
      
      return res.json({
        success: true,
        data: defaultStats
      });
    }
  } catch (error) {
    console.error('Error fetching user dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user dashboard stats',
      error: error.message
    });
  }
});

// POST /api/user-dashboard/stats/:userId - Update user-specific dashboard statistics
router.post('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const statsData = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Update user dashboard stats in Firestore
    const userStatsRef = adminDb.collection('userDashboardStats').doc(userId);
    const updatedStats = {
      ...statsData,
      lastUpdated: new Date().toISOString()
    };
    
    await userStatsRef.set(updatedStats, { merge: true });
    
    res.json({
      success: true,
      message: 'User dashboard stats updated successfully',
      data: updatedStats
    });
  } catch (error) {
    console.error('Error updating user dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user dashboard stats',
      error: error.message
    });
  }
});

// GET /api/user-dashboard/settings/:userId - Get user dashboard settings
router.get('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Get user dashboard settings from Firestore
    const userSettingsRef = adminDb.collection('userDashboardSettings').doc(userId);
    const userSettingsSnap = await userSettingsRef.get();
    
    if (userSettingsSnap.exists) {
      const settings = { id: userSettingsSnap.id, ...userSettingsSnap.data() };
      return res.json({
        success: true,
        data: settings
      });
    } else {
      // Return default settings if user settings don't exist
      const defaultSettings = {
        userId,
        overviewType: 'personal', // 'personal' or 'global'
        showPersonalizedStats: true,
        lastUpdated: new Date().toISOString()
      };
      
      return res.json({
        success: true,
        data: defaultSettings
      });
    }
  } catch (error) {
    console.error('Error fetching user dashboard settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user dashboard settings',
      error: error.message
    });
  }
});

// POST /api/user-dashboard/settings/:userId - Update user dashboard settings
router.post('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const settingsData = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Update user dashboard settings in Firestore
    const userSettingsRef = adminDb.collection('userDashboardSettings').doc(userId);
    const updatedSettings = {
      ...settingsData,
      lastUpdated: new Date().toISOString()
    };
    
    await userSettingsRef.set(updatedSettings, { merge: true });
    
    res.json({
      success: true,
      message: 'User dashboard settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating user dashboard settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user dashboard settings',
      error: error.message
    });
  }
});

module.exports = router;