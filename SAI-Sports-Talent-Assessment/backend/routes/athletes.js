const express = require('express');
const router = express.Router();
const { adminDb } = require('../config/firebase');
const { 
  createAthlete, 
  getAthletes, 
  getAthlete, 
  updateAthlete 
} = require('../services/firestoreService');
const { 
  uploadProfilePhoto, 
  uploadDocument, 
  deleteFile 
} = require('../services/storageService');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Firestore collections - initialize them as functions to avoid import issues
const getAthletesCollection = () => adminDb.collection('athletes');
const getAssessmentsCollection = () => adminDb.collection('assessments');

// POST /api/athletes/register - Register a new athlete
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, email, age, state, district, uid, sport, height, weight, phoneNumber } = req.body;

    // Validation
    if (!name || !email || !age || !state || !district) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, age, state, and district are required'
      });
    }

    // Check if athlete already exists
    const existingAthletes = await getAthletes({ email });
    if (existingAthletes && existingAthletes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Athlete with this email already exists'
      });
    }

    // Handle profile photo upload if provided
    let profilePhotoURL = null;
    if (req.file) {
      try {
        const photoResult = await uploadProfilePhoto(req.file, uid || 'anonymous');
        profilePhotoURL = photoResult.downloadURL;
      } catch (photoError) {
        console.warn('Profile photo upload failed:', photoError);
        // Continue without photo
      }
    }

    // Calculate age and age group
    const ageNum = parseInt(age);
    let ageGroup = 'Senior';
    if (ageNum <= 12) {
      ageGroup = 'Under-12';
    } else if (ageNum <= 15) {
      ageGroup = 'Under-15';
    } else if (ageNum <= 18) {
      ageGroup = 'Under-18';
    }

    // Create athlete data
    const athleteData = {
      name,
      email,
      age: ageNum,
      state,
      district,
      uid: uid || null,
      sport: sport || 'General',
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      phoneNumber: phoneNumber || null,
      ageGroup,
      profilePhotoURL,
      registrationDate: new Date().toISOString(),
      bestScores: {
        'sit-ups': 0,
        'push-ups': 0,
        'vertical-jump': 0,
        'sprint': 0,
        'endurance': 0
      },
      averageScore: 0,
      totalAssessments: 0,
      achievements: [],
      status: 'active'
    };

    // Create athlete using Firestore service
    const result = await createAthlete(athleteData);
    const athlete = { id: result.id, ...athleteData };

    res.status(201).json({
      success: true,
      message: 'Athlete registered successfully',
      data: athlete
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// GET /api/athletes - Fetch all athletes with their scores for ranking
router.get('/', async (req, res) => {
  try {
    const { status, sport, ageGroup, state, district } = req.query;
    
    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (sport) filters.sport = sport;
    if (ageGroup) filters.ageGroup = ageGroup;
    if (state) filters.state = state;
    if (district) filters.district = district;

    // Get athletes using Firestore service
    const athletes = await getAthletes(filters);

    // Sort by average score in descending order
    athletes.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));

    res.json({
      success: true,
      data: athletes,
      count: athletes.length
    });

  } catch (error) {
    console.error('Fetch athletes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching athletes',
      error: error.message
    });
  }
});

// GET /api/athletes/:id - Get specific athlete details
router.get('/:id', async (req, res) => {
  try {
    const athleteId = req.params.id;
    
    // Get athlete using Firestore service
    const athlete = await getAthlete(athleteId);
    
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    res.json({
      success: true,
      data: athlete
    });

  } catch (error) {
    console.error('Fetch athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching athlete',
      error: error.message
    });
  }
});

// PUT /api/athletes/:id - Update athlete details
router.put('/:id', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, age, state, district, sport, height, weight, phoneNumber } = req.body;
    const athleteId = req.params.id;

    // Check if athlete exists
    const existingAthlete = await getAthlete(athleteId);
    if (!existingAthlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (age) updateData.age = parseInt(age);
    if (state) updateData.state = state;
    if (district) updateData.district = district;
    if (sport) updateData.sport = sport;
    if (height) updateData.height = parseFloat(height);
    if (weight) updateData.weight = parseFloat(weight);
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    // Handle profile photo upload if provided
    if (req.file) {
      try {
        // Delete old photo if exists
        if (existingAthlete.profilePhotoURL) {
          await deleteFile(existingAthlete.profilePhotoURL);
        }
        
        // Upload new photo
        const photoResult = await uploadProfilePhoto(req.file, existingAthlete.uid || athleteId);
        updateData.profilePhotoURL = photoResult.downloadURL;
      } catch (photoError) {
        console.warn('Profile photo upload failed:', photoError);
        // Continue without photo update
      }
    }

    // Update age group if age changed
    if (age) {
      const ageNum = parseInt(age);
      if (ageNum <= 12) {
        updateData.ageGroup = 'Under-12';
      } else if (ageNum <= 15) {
        updateData.ageGroup = 'Under-15';
      } else if (ageNum <= 18) {
        updateData.ageGroup = 'Under-18';
      } else {
        updateData.ageGroup = 'Senior';
      }
    }

    // Update athlete using Firestore service
    await updateAthlete(athleteId, updateData);

    // Get updated athlete data
    const updatedAthlete = await getAthlete(athleteId);

    res.json({
      success: true,
      message: 'Athlete updated successfully',
      data: updatedAthlete
    });

  } catch (error) {
    console.error('Update athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating athlete',
      error: error.message
    });
  }
});

module.exports = router;