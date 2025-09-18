const mongoose = require('mongoose');

const athleteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 10,
    max: 50
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  // Store best scores for quick ranking queries
  bestScores: {
    'sit-ups': { type: Number, default: 0 },
    'push-ups': { type: Number, default: 0 },
    'vertical-jump': { type: Number, default: 0 },
    'sprint': { type: Number, default: 0 },
    'endurance': { type: Number, default: 0 }
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
athleteSchema.index({ email: 1 });
athleteSchema.index({ averageScore: -1 });

module.exports = mongoose.model('Athlete', athleteSchema);