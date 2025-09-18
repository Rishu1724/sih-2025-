const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  uploadAssessmentVideo, 
  uploadDocument,
  deleteFile,
  listAssessmentVideos,
  listUserFiles,
  getStorageStats
} = require('../services/storageService');
const {
  createVideoRecord,
  getVideos,
  createTestResult,
  getTestResults
} = require('../services/firestoreService');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
});

// POST /api/uploads/video - Upload assessment video
router.post('/video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const { athleteId, testType, assessmentId, userId, duration, description } = req.body;

    // Validate required fields
    if (!athleteId || !testType || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Athlete ID, test type, and user ID are required'
      });
    }

    // Upload video to Firebase Storage
    const uploadResult = await uploadAssessmentVideo(req.file, {
      athleteId,
      testType,
      assessmentId: assessmentId || '',
      userId
    });

    // Create video record in Firestore
    const videoData = {
      athleteId,
      testType,
      assessmentId: assessmentId || null,
      userId,
      filename: uploadResult.filename,
      downloadURL: uploadResult.downloadURL,
      size: uploadResult.size,
      mimeType: uploadResult.mimeType,
      duration: duration ? parseInt(duration) : null,
      description: description || '',
      uploadDate: new Date().toISOString()
    };

    const videoRecord = await createVideoRecord(videoData);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        videoId: videoRecord.id,
        downloadURL: uploadResult.downloadURL,
        filename: uploadResult.filename,
        size: uploadResult.size
      }
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video',
      error: error.message
    });
  }
});

// POST /api/uploads/document - Upload document
router.post('/document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    const { userId, type, description } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Upload document to Firebase Storage
    const uploadResult = await uploadDocument(req.file, {
      userId,
      type: type || 'general',
      description: description || ''
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        downloadURL: uploadResult.downloadURL,
        filename: uploadResult.filename,
        size: uploadResult.size
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// GET /api/uploads/videos/:athleteId - Get all videos for an athlete
router.get('/videos/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { testType, assessmentId } = req.query;

    // Build filters
    const filters = { athleteId };
    if (testType) filters.testType = testType;
    if (assessmentId) filters.assessmentId = assessmentId;

    // Get videos from Firestore
    const videos = await getVideos(filters);

    res.json({
      success: true,
      data: videos,
      count: videos.length
    });

  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get videos',
      error: error.message
    });
  }
});

// GET /api/uploads/files/:userId - Get all files for a user
router.get('/files/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { folder } = req.query;

    // Get files from Firebase Storage
    const result = await listUserFiles(userId, folder);

    res.json({
      success: true,
      data: result.files,
      count: result.files.length
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get files',
      error: error.message
    });
  }
});

// GET /api/uploads/stats/:userId - Get storage statistics for a user
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get storage statistics
    const result = await getStorageStats(userId);

    res.json({
      success: true,
      data: result.stats
    });

  } catch (error) {
    console.error('Get storage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get storage statistics',
      error: error.message
    });
  }
});

// DELETE /api/uploads/file - Delete a file
router.delete('/file', async (req, res) => {
  try {
    const { fileURL } = req.body;

    if (!fileURL) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    // Delete file from Firebase Storage
    const result = await deleteFile(fileURL);

    res.json({
      success: result.success,
      message: result.message
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

// POST /api/uploads/test-result - Store test result with video reference
router.post('/test-result', async (req, res) => {
  try {
    const {
      athleteId,
      assessmentId,
      testType,
      videoId,
      videoURL,
      score,
      metrics,
      notes,
      evaluatorId
    } = req.body;

    // Validate required fields
    if (!athleteId || !testType || !score) {
      return res.status(400).json({
        success: false,
        message: 'Athlete ID, test type, and score are required'
      });
    }

    // Create test result data
    const testResultData = {
      athleteId,
      assessmentId: assessmentId || null,
      testType,
      videoId: videoId || null,
      videoURL: videoURL || null,
      score: parseFloat(score),
      metrics: metrics || {},
      notes: notes || '',
      evaluatorId: evaluatorId || null,
      evaluationDate: new Date().toISOString()
    };

    // Create test result in Firestore
    const result = await createTestResult(testResultData);

    res.status(201).json({
      success: true,
      message: 'Test result saved successfully',
      data: {
        testResultId: result.id,
        ...testResultData
      }
    });

  } catch (error) {
    console.error('Save test result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save test result',
      error: error.message
    });
  }
});

// GET /api/uploads/test-results/:athleteId - Get test results for an athlete
router.get('/test-results/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { testType, assessmentId } = req.query;

    // Build filters
    const filters = { athleteId };
    if (testType) filters.testType = testType;
    if (assessmentId) filters.assessmentId = assessmentId;

    // Get test results from Firestore
    const testResults = await getTestResults(filters);

    res.json({
      success: true,
      data: testResults,
      count: testResults.length
    });

  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test results',
      error: error.message
    });
  }
});

module.exports = router;