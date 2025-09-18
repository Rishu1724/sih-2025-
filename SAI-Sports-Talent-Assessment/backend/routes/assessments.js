const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminDb, storage } = require('../config/firebase');
const {
  createAssessment,
  getAssessments,
  updateAssessment,
  createTestResult
} = require('../services/firestoreService');
const aiAnalysisService = require('../services/aiAnalysisService');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { generateBlockchainHash, generateTransactionId } = require('../services/BlockchainService');

// Configure multer for video uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads/temp');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `assessment-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// Firestore collections - initialize them as functions to avoid import issues
const getAssessmentsCollection = () => adminDb.collection('assessments');
const getAthletesCollection = () => adminDb.collection('athletes');

// Real AI processing function
const processAIAnalysis = async (videoPath, assessmentType) => {
  try {
    console.log(`Starting AI analysis for ${assessmentType} with video: ${videoPath}`);
    
    if (!aiAnalysisService.isSupported(assessmentType)) {
      console.log(`Assessment type ${assessmentType} not supported by AI, using mock data`);
      return {
        aiRepCount: Math.floor(Math.random() * 20) + 10,
        aiTechniqueScore: Math.random() * 0.3 + 0.7,
        aiNotes: `Mock analysis for ${assessmentType}. AI analysis not available for this exercise type.`,
        processingTime: 2.5
      };
    }

    const startTime = Date.now();
    const result = await aiAnalysisService.analyzeVideo(videoPath, assessmentType);
    const processingTime = (Date.now() - startTime) / 1000;
    
    result.processingTime = processingTime;
    console.log(`AI analysis completed in ${processingTime.toFixed(2)}s:`, result);
    
    return result;
  } catch (error) {
    console.error('AI analysis error:', error);
    // Return fallback data if AI analysis fails
    return {
      aiRepCount: 0,
      aiTechniqueScore: 0.1,
      aiNotes: `AI analysis failed: ${error.message}. Please review manually.`,
      processingTime: 0,
      error: error.message
    };
  }
};

// POST /api/assessments/submit - Submit an assessment with video upload and AI analysis
router.post('/submit', upload.single('video'), async (req, res) => {
  try {
    const { sportCategory, assessmentType, metadata } = req.body;
    const assessmentsCollection = getAssessmentsCollection();

    // Validation
    if (!sportCategory || !assessmentType) {
      return res.status(400).json({
        success: false,
        message: 'sportCategory and assessmentType are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required'
      });
    }

    const videoPath = req.file.path;
    console.log(`Video uploaded to: ${videoPath}`);

    // Generate blockchain identifiers
    const blockchainHash = generateBlockchainHash();
    const transactionId = generateTransactionId();

    // Try Firebase Storage first, fallback to local storage
    let videoUrl;
    let assessmentId;
    let assessment;
    
    try {
      // Upload video to Firebase Storage
      const { ref: storageRef, uploadBytes, getDownloadURL } = require('firebase/storage');
      const { getStorage } = require('firebase/storage');
      const storage = getStorage();
      
      const videoRef = storageRef(storage, `videos/${req.file.filename}`);
      const videoBuffer = fs.readFileSync(req.file.path);
      
      console.log('Uploading video to Firebase Storage...');
      await uploadBytes(videoRef, videoBuffer);
      videoUrl = await getDownloadURL(videoRef);
      console.log('✅ Video uploaded to Firebase Storage:', videoUrl);
      
      // Create assessment document
      const assessmentData = {
        sportCategory,
        assessmentType,
        videoUrl,
        videoFileName: req.file.filename,
        videoSize: req.file.size,
        videoMimeType: req.file.mimetype,
        videoPath: videoPath, // Store local path for AI processing
        submissionDate: new Date().toISOString(),
        status: 'Processing',
        aiAnalysis: {
          aiRepCount: 0,
          aiTechniqueScore: 0,
          aiNotes: 'AI analysis in progress...',
          processingTime: 0
        },
        evaluation: {
          score: null,
          evaluatorNotes: '',
          evaluatedBy: '',
          evaluationDate: null
        },
        metadata: metadata ? JSON.parse(metadata) : {},
        // Add blockchain data
        blockchainHash,
        transactionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store assessment data in Firebase Firestore
      const docRef = await adminDb.collection('assessments').add(assessmentData);
      assessmentId = docRef.id;
      assessment = { id: assessmentId, ...assessmentData };
      console.log('✅ Assessment stored in Firebase Firestore:', assessmentId);
      
    } catch (firebaseError) {
      console.warn('Firebase storage failed, using local storage:', firebaseError.message);
      
      // Fallback to local storage
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
             videoUrl = `http://192.168.1.114:3001/uploads/temp/${req.file.filename}`;
      
      // Create assessment document
      const assessmentData = {
        sportCategory,
        assessmentType,
        videoUrl,
        videoFileName: req.file.filename,
        videoSize: req.file.size,
        videoMimeType: req.file.mimetype,
        videoPath: videoPath, // Store local path for AI processing
        submissionDate: new Date().toISOString(),
        status: 'Processing',
        aiAnalysis: {
          aiRepCount: 0,
          aiTechniqueScore: 0,
          aiNotes: 'AI analysis in progress...',
          processingTime: 0
        },
        evaluation: {
          score: null,
          evaluatorNotes: '',
          evaluatedBy: '',
          evaluationDate: null
        },
        metadata: metadata ? JSON.parse(metadata) : {},
        // Add blockchain data
        blockchainHash,
        transactionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      assessment = { id: localId, ...assessmentData };
      
      // Store video locally
      const localVideoPath = path.join(__dirname, '../../uploads/temp', req.file.filename);
      fs.copyFileSync(req.file.path, localVideoPath);
      
      // Store assessment data locally
      const localDataPath = path.join(__dirname, '../../uploads/temp/assessments.json');
      
      let localAssessments = [];
      if (fs.existsSync(localDataPath)) {
        const existingData = fs.readFileSync(localDataPath, 'utf8');
        localAssessments = JSON.parse(existingData);
      }
      
      localAssessments.push(assessment);
      fs.writeFileSync(localDataPath, JSON.stringify(localAssessments, null, 2));
      console.log('Assessment stored locally:', assessment.id);
      assessmentId = localId;
    }

    // Start AI processing (asynchronous)
    processAIAnalysis(videoPath, assessmentType)
      .then(async (aiAnalysis) => {
        // Update assessment with AI results
        try {
          if (assessment.id.startsWith('local_')) {
            // Update local storage
            const localDataPath = path.join(__dirname, '../../uploads/temp/assessments.json');
            if (fs.existsSync(localDataPath)) {
              const localAssessments = JSON.parse(fs.readFileSync(localDataPath, 'utf8'));
              const index = localAssessments.findIndex(a => a.id === assessment.id);
              if (index !== -1) {
                localAssessments[index] = {
                  ...localAssessments[index],
                  aiAnalysis,
                  status: 'Pending',
                  updatedAt: new Date().toISOString()
                };
                fs.writeFileSync(localDataPath, JSON.stringify(localAssessments, null, 2));
              }
            }
          } else {
            // Update Firebase
            await adminDb.collection('assessments').doc(assessment.id).update({
              aiAnalysis,
              status: 'Pending',
              updatedAt: new Date().toISOString()
            });
          }
          console.log(`AI processing completed for assessment ${assessment.id}:`, aiAnalysis);
        } catch (updateError) {
          console.error('Failed to update assessment with AI results:', updateError);
        }
        
        // Clean up temporary video file after processing
        try {
          fs.unlinkSync(videoPath);
          console.log(`Cleaned up temporary file: ${videoPath}`);
        } catch (cleanupError) {
          console.error('Error cleaning up temporary file:', cleanupError);
        }
      })
      .catch(async (error) => {
        console.error('AI processing error:', error);
        // Update assessment with error status
        try {
          if (assessment.id.startsWith('local_')) {
            // Update local storage
            const localDataPath = path.join(__dirname, '../../uploads/temp/assessments.json');
            if (fs.existsSync(localDataPath)) {
              const localAssessments = JSON.parse(fs.readFileSync(localDataPath, 'utf8'));
              const index = localAssessments.findIndex(a => a.id === assessment.id);
              if (index !== -1) {
                localAssessments[index] = {
                  ...localAssessments[index],
                  status: 'Failed',
                  aiAnalysis: {
                    aiRepCount: 0,
                    aiTechniqueScore: 0,
                    aiNotes: `AI analysis failed: ${error.message}`,
                    processingTime: 0,
                    error: error.message
                  },
                  updatedAt: new Date().toISOString()
                };
                fs.writeFileSync(localDataPath, JSON.stringify(localAssessments, null, 2));
              }
            }
          } else {
            // Update Firebase
            await adminDb.collection('assessments').doc(assessment.id).update({
              status: 'Failed',
              aiAnalysis: {
                aiRepCount: 0,
                aiTechniqueScore: 0,
                aiNotes: `AI analysis failed: ${error.message}`,
                processingTime: 0,
                error: error.message
              },
              updatedAt: new Date().toISOString()
            });
          }
        } catch (updateError) {
          console.error('Failed to update assessment with error status:', updateError);
        }
      });

    res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully! Video and data stored. AI processing started.',
      data: {
        id: assessment.id,
        sportCategory: assessment.sportCategory,
        assessmentType: assessment.assessmentType,
        status: assessment.status,
        videoUrl: assessment.videoUrl,
        submissionDate: assessment.submissionDate,
        // Include blockchain data in response
        blockchainHash: assessment.blockchainHash,
        transactionId: assessment.transactionId
      }
    });

  } catch (error) {
    console.error('Assessment submission error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file after error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during assessment submission',
      error: error.message
    });
  }
});

// GET /api/assessments - Fetch all assessments for dashboard
router.get('/', async (req, res) => {
  try {
    const { status, assessmentType, page = 1, limit = 20 } = req.query;
    
    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (assessmentType) filters.assessmentType = assessmentType;

    let assessments = [];
    
    // For now, always use local storage since we're storing assessments there
    const fs = require('fs');
    const path = require('path');
    const localDataPath = path.join(__dirname, '../../uploads/temp/assessments.json');
    
    console.log('Looking for local file at:', localDataPath);
    console.log('File exists:', fs.existsSync(localDataPath));
    
    if (fs.existsSync(localDataPath)) {
      const localData = fs.readFileSync(localDataPath, 'utf8');
      console.log('Local file content length:', localData.length);
      assessments = JSON.parse(localData);
      console.log('✅ Parsed local assessments:', assessments.length);
      
      // Apply filters
      if (status) {
        assessments = assessments.filter(a => a.status === status);
      }
      if (assessmentType) {
        assessments = assessments.filter(a => a.assessmentType === assessmentType);
      }
    } else {
      console.log('❌ Local assessments file not found');
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedAssessments = assessments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedAssessments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(assessments.length / parseInt(limit)),
        count: paginatedAssessments.length,
        totalRecords: assessments.length
      }
    });

  } catch (error) {
    console.error('Fetch assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessments',
      error: error.message
    });
  }
});

// PUT /api/assessments/:id/evaluate - Evaluate an assessment
router.put('/:id/evaluate', async (req, res) => {
  try {
    const { score, evaluatorNotes, evaluatedBy } = req.body;
    const assessmentId = req.params.id;
    const assessmentsCollection = getAssessmentsCollection();
    const athletesCollection = getAthletesCollection();

    // Validation
    if (score === undefined || score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        message: 'Score must be between 0 and 100'
      });
    }

    // Find assessment
    const assessmentDoc = await assessmentsCollection.doc(assessmentId).get();
    if (!assessmentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessmentData = assessmentDoc.data();

    // Update assessment with evaluation
    const evaluationData = {
      score: parseInt(score),
      evaluatorNotes: evaluatorNotes || '',
      evaluatedBy: evaluatedBy || 'SAI Official',
      evaluationDate: new Date().toISOString()
    };

    await assessmentsCollection.doc(assessmentId).update({
      evaluation: evaluationData,
      status: 'Evaluated',
      updatedAt: new Date().toISOString()
    });

    // Update athlete's best scores
    if (assessmentData.athleteId) {
      const athleteDoc = await athletesCollection.doc(assessmentData.athleteId).get();
      if (athleteDoc.exists) {
        const athleteData = athleteDoc.data();
        const assessmentType = assessmentData.assessmentType;
        
        if (score > (athleteData.bestScores[assessmentType] || 0)) {
          const updatedBestScores = {
            ...athleteData.bestScores,
            [assessmentType]: parseInt(score)
          };
          
          // Recalculate average score
          const scores = Object.values(updatedBestScores).filter(s => s > 0);
          const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
          
          await athletesCollection.doc(assessmentData.athleteId).update({
            bestScores: updatedBestScores,
            averageScore,
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    // Get updated assessment
    const updatedDoc = await assessmentsCollection.doc(assessmentId).get();
    const updatedAssessment = { id: updatedDoc.id, ...updatedDoc.data() };

    res.json({
      success: true,
      message: 'Assessment evaluated successfully',
      data: updatedAssessment
    });

  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during evaluation',
      error: error.message
    });
  }
});

// GET /api/assessments/:id - Get specific assessment details
router.get('/:id', async (req, res) => {
  try {
    const assessmentsCollection = getAssessmentsCollection();
    const athletesCollection = getAthletesCollection();
    const doc = await assessmentsCollection.doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessmentData = { id: doc.id, ...doc.data() };
    
    // Get athlete data
    if (assessmentData.athleteId) {
      const athleteDoc = await athletesCollection.doc(assessmentData.athleteId).get();
      if (athleteDoc.exists) {
        assessmentData.athleteId = {
          id: athleteDoc.id,
          ...athleteDoc.data()
        };
      }
    }

    res.json({
      success: true,
      data: assessmentData
    });

  } catch (error) {
    console.error('Fetch assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessment',
      error: error.message
    });
  }
});

// GET /api/assessments/:id/ai-analysis - Get AI analysis results for an assessment
router.get('/:id/ai-analysis', async (req, res) => {
  try {
    const assessmentsCollection = getAssessmentsCollection();
    const doc = await assessmentsCollection.doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessmentData = doc.data();
    
    if (!assessmentData.aiAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'AI analysis not available for this assessment'
      });
    }

    res.json({
      success: true,
      data: {
        assessmentId: req.params.id,
        assessmentType: assessmentData.assessmentType,
        status: assessmentData.status,
        aiAnalysis: assessmentData.aiAnalysis,
        submissionDate: assessmentData.submissionDate,
        updatedAt: assessmentData.updatedAt
      }
    });

  } catch (error) {
    console.error('Fetch AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching AI analysis',
      error: error.message
    });
  }
});

// POST /api/assessments/:id/process-ai - Process assessment with AI analysis
router.post('/:id/process-ai', async (req, res) => {
  try {
    const assessmentsCollection = getAssessmentsCollection();
    const doc = await assessmentsCollection.doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessmentData = doc.data();
    
    // Check if assessment type is supported
    const supportedTypes = ['sit-ups', 'push-ups', 'vertical-jump', 'shuttle-run'];
    if (!supportedTypes.includes(assessmentData.assessmentType)) {
      return res.status(400).json({
        success: false,
        message: `AI analysis is not supported for ${assessmentData.assessmentType} assessments`
      });
    }

    // Check if video file exists
    if (!assessmentData.videoPath || !fs.existsSync(assessmentData.videoPath)) {
      return res.status(400).json({
        success: false,
        message: 'Video file not found for processing'
      });
    }

    // Update status to processing
    await assessmentsCollection.doc(req.params.id).update({
      status: 'Processing',
      aiAnalysis: {
        aiRepCount: 0,
        aiTechniqueScore: 0,
        aiNotes: 'AI analysis in progress...',
        processingTime: 0
      },
      updatedAt: new Date().toISOString()
    });

    // Start AI processing
    processAIAnalysis(assessmentData.videoPath, assessmentData.assessmentType)
      .then(async (aiAnalysis) => {
        await assessmentsCollection.doc(req.params.id).update({
          aiAnalysis,
          status: 'Evaluated',
          updatedAt: new Date().toISOString()
        });
        console.log(`AI processing completed for assessment ${req.params.id}`);
      })
      .catch(async (error) => {
        console.error('AI processing error:', error);
        await assessmentsCollection.doc(req.params.id).update({
          status: 'Failed',
          aiAnalysis: {
            aiRepCount: 0,
            aiTechniqueScore: 0,
            aiNotes: `AI processing failed: ${error.message}`,
            processingTime: 0,
            error: error.message
          },
          updatedAt: new Date().toISOString()
        });
      });

    res.json({
      success: true,
      message: 'AI processing started',
      data: {
        assessmentId: req.params.id,
        status: 'Processing'
      }
    });

  } catch (error) {
    console.error('Process assessment with AI error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during AI processing',
      error: error.message
    });
  }
});

// POST /api/assessments/:id/reprocess - Reprocess assessment with AI analysis
router.post('/:id/reprocess', async (req, res) => {
  try {
    const assessmentsCollection = getAssessmentsCollection();
    const doc = await assessmentsCollection.doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const assessmentData = doc.data();
    
    if (!assessmentData.videoPath || !fs.existsSync(assessmentData.videoPath)) {
      return res.status(400).json({
        success: false,
        message: 'Video file not found for reprocessing'
      });
    }

    // Update status to processing
    await assessmentsCollection.doc(req.params.id).update({
      status: 'Processing',
      aiAnalysis: {
        aiRepCount: 0,
        aiTechniqueScore: 0,
        aiNotes: 'AI analysis in progress...',
        processingTime: 0
      },
      updatedAt: new Date().toISOString()
    });

    // Start AI processing
    processAIAnalysis(assessmentData.videoPath, assessmentData.assessmentType)
      .then(async (aiAnalysis) => {
        await assessmentsCollection.doc(req.params.id).update({
          aiAnalysis,
          status: 'Pending',
          updatedAt: new Date().toISOString()
        });
        console.log(`AI reprocessing completed for assessment ${req.params.id}`);
      })
      .catch(error => {
        console.error('AI reprocessing error:', error);
        assessmentsCollection.doc(req.params.id).update({
          status: 'Failed',
          aiAnalysis: {
            aiRepCount: 0,
            aiTechniqueScore: 0,
            aiNotes: `AI reprocessing failed: ${error.message}`,
            processingTime: 0,
            error: error.message
          },
          updatedAt: new Date().toISOString()
        });
      });

    res.json({
      success: true,
      message: 'AI reprocessing started',
      data: {
        assessmentId: req.params.id,
        status: 'Processing'
      }
    });

  } catch (error) {
    console.error('Reprocess assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during reprocessing',
      error: error.message
    });
  }
});

module.exports = router;