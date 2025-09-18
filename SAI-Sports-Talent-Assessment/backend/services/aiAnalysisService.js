const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the AI analysis scripts
const AI_SCRIPTS_PATH = path.join(__dirname);

/**
 * AI Analysis Service
 * Integrates with Python AI analysis scripts for exercise counting
 */

class AIAnalysisService {
  constructor() {
    this.supportedTypes = {
      'shuttle-run': 'shuttle_run.py',
      'sit-ups': 'situp_counter.py', 
      'vertical-jump': 'vertical_jump.py',
      'push-ups': 'pushup.py'
    };
  }

  /**
   * Analyze video using appropriate AI script
   * @param {string} videoPath - Path to the video file
   * @param {string} assessmentType - Type of assessment
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeVideo(videoPath, assessmentType) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported(assessmentType)) {
        reject(new Error(`Unsupported assessment type: ${assessmentType}`));
        return;
      }

      // Check if video exists
      if (!fs.existsSync(videoPath)) {
        reject(new Error(`Video file not found: ${videoPath}`));
        return;
      }

      const wrapperPath = path.join(__dirname, 'ai_analysis_wrapper.py');
      
      // Check if wrapper exists
      if (!fs.existsSync(wrapperPath)) {
        reject(new Error(`AI analysis wrapper not found: ${wrapperPath}`));
        return;
      }

      console.log(`Starting AI analysis for ${assessmentType}`);
      console.log(`Video: ${videoPath}`);
      console.log(`Wrapper: ${wrapperPath}`);

      // Spawn Python process with wrapper and reduced timeout (1 minute for faster processing)
      const pythonProcess = spawn('python', [wrapperPath, videoPath, assessmentType], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      // Capture output
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`AI Analysis stdout: ${data.toString()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`AI Analysis stderr: ${data.toString()}`);
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        console.log(`AI Analysis process exited with code ${code}`);
        
        if (code === 0) {
          try {
            // Ensure we have valid JSON output
            const trimmedOutput = stdout.trim();
            if (!trimmedOutput) {
              reject(new Error('AI analysis returned empty output'));
              return;
            }
            
            const result = JSON.parse(trimmedOutput);
            const processedResult = this.processAnalysisResult(result, assessmentType);
            resolve(processedResult);
          } catch (parseError) {
            console.error('Error parsing AI analysis output:', parseError);
            console.error('Raw output:', stdout);
            reject(new Error(`Failed to parse AI analysis results: ${parseError.message}`));
          }
        } else {
          reject(new Error(`AI analysis failed with exit code ${code}. Error: ${stderr}`));
        }
      });

      // Handle process errors
      pythonProcess.on('error', (error) => {
        console.error('AI Analysis process error:', error);
        reject(new Error(`Failed to start AI analysis: ${error.message}`));
      });

      // Set timeout (1 minute for faster processing)
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('AI analysis timeout after 1 minute'));
      }, 1 * 60 * 1000);
    });
  }

  /**
   * Process analysis result from Python wrapper
   * @param {Object} result - Result from Python wrapper
   * @param {string} assessmentType - Type of assessment
   * @returns {Object} Processed analysis results
   */
  processAnalysisResult(result, assessmentType) {
    // Handle error cases
    if (result.error) {
      return {
        aiRepCount: 0,
        aiTechniqueScore: 0.1,
        aiNotes: `AI analysis failed: ${result.error}`,
        processingTime: 0,
        error: result.error
      };
    }

    const repCount = result.rep_count || 0;
    const additionalMetrics = {};

    // Extract additional metrics for specific assessment types
    if (assessmentType === 'vertical-jump') {
      additionalMetrics.jumpHeights = result.jump_heights || [];
      additionalMetrics.averageHeight = result.average_height || 0;
    }

    // Calculate technique score based on rep count and assessment type
    const techniqueScore = this.calculateTechniqueScore(repCount, assessmentType);

    // Generate detailed notes based on results
    let notes = this.generateAnalysisNotes(repCount, assessmentType, additionalMetrics);
    
    // Add specific information based on assessment type
    if (result.up_threshold !== undefined && result.down_threshold !== undefined) {
      notes += ` Thresholds - Up: ${result.up_threshold.toFixed(1)}, Down: ${result.down_threshold.toFixed(1)}`;
    }
    
    if (result.warmup_frames !== undefined) {
      notes += ` Warmup: ${result.warmup_frames} frames`;
    }

    return {
      aiRepCount: repCount,
      aiTechniqueScore: techniqueScore,
      aiNotes: notes,
      processingTime: Date.now(), // Will be updated with actual processing time
      additionalMetrics,
      error: null
    };
  }

  /**
   * Calculate technique score based on rep count and assessment type
   * @param {number} repCount - Number of repetitions detected
   * @param {string} assessmentType - Type of assessment
   * @returns {number} Technique score (0-1)
   */
  calculateTechniqueScore(repCount, assessmentType) {
    // Base scores for different assessment types
    const baseScores = {
      'shuttle-run': 0.7,
      'sit-ups': 0.8,
      'vertical-jump': 0.75,
      'push-ups': 0.8
    };

    let baseScore = baseScores[assessmentType] || 0.7;
    
    // Adjust score based on rep count
    if (repCount === 0) {
      return 0.1; // Very low score for no reps detected
    } else if (repCount < 5) {
      return baseScore * 0.6; // Low score for very few reps
    } else if (repCount < 10) {
      return baseScore * 0.8; // Good score for moderate reps
    } else if (repCount < 20) {
      return Math.min(baseScore * 1.0, 1.0); // High score for many reps (capped at 1.0)
    } else {
      return Math.min(baseScore * 1.2, 1.0); // Excellent score for many reps (capped at 1.0)
    }
  }

  /**
   * Generate analysis notes based on results
   * @param {number} repCount - Number of repetitions detected
   * @param {string} assessmentType - Type of assessment
   * @param {Object} additionalMetrics - Additional metrics from analysis
   * @returns {string} Analysis notes
   */
  generateAnalysisNotes(repCount, assessmentType, additionalMetrics = {}) {
    const typeNames = {
      'shuttle-run': 'shuttle run',
      'sit-ups': 'sit-ups',
      'vertical-jump': 'vertical jump',
      'push-ups': 'push-ups'
    };

    const typeName = typeNames[assessmentType] || assessmentType;
    let notes = `AI detected ${repCount} ${typeName} repetitions. `;

    if (repCount === 0) {
      notes += 'No clear repetitions detected. Please ensure proper form and lighting.';
    } else if (repCount < 5) {
      notes += 'Low repetition count detected. Consider improving technique or duration.';
    } else if (repCount < 10) {
      notes += 'Good repetition count. Technique appears consistent.';
    } else if (repCount < 20) {
      notes += 'Excellent repetition count. Strong performance detected.';
    } else {
      notes += 'Outstanding repetition count. Exceptional performance detected.';
    }

    // Add specific notes for vertical jump
    if (assessmentType === 'vertical-jump' && additionalMetrics.averageHeight) {
      notes += ` Average jump height: ${additionalMetrics.averageHeight.toFixed(1)} pixels.`;
    }

    return notes;
  }

  /**
   * Get supported assessment types
   * @returns {Array} List of supported assessment types
   */
  getSupportedTypes() {
    return Object.keys(this.supportedTypes);
  }

  /**
   * Check if assessment type is supported
   * @param {string} assessmentType - Type to check
   * @returns {boolean} Whether the type is supported
   */
  isSupported(assessmentType) {
    return assessmentType in this.supportedTypes;
  }
}

module.exports = new AIAnalysisService();