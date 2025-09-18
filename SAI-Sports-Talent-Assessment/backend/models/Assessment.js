const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  athleteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete',
    required: true
  },
  assessmentType: {
    type: String,
    required: true,
    enum: ['sit-ups', 'push-ups', 'vertical-jump', 'sprint', 'endurance']
  },
  videoUrl: {
    type: String,
    required: true // For now, will store placeholder string
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Evaluated'],
    default: 'Pending'
  },
  // Mock AI processing results
  aiAnalysis: {
    aiRepCount: { type: Number, default: 0 },
    aiTechniqueScore: { type: Number, default: 0 }, // 0-1 scale
    aiNotes: { type: String, default: '' },
    processingTime: { type: Number, default: 0 } // in seconds
  },
  // Official evaluation
  evaluation: {
    score: { type: Number, min: 0, max: 100 },
    evaluatorNotes: { type: String, default: '' },
    evaluatedBy: { type: String, default: '' },
    evaluationDate: { type: Date }
  },
  // Metadata
  metadata: {
    deviceInfo: { type: String, default: '' },
    duration: { type: Number, default: 0 }, // video duration in seconds
    fileSize: { type: Number, default: 0 } // in bytes
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
assessmentSchema.index({ athleteId: 1 });
assessmentSchema.index({ assessmentType: 1 });
assessmentSchema.index({ status: 1 });
assessmentSchema.index({ submissionDate: -1 });

module.exports = mongoose.model('Assessment', assessmentSchema);