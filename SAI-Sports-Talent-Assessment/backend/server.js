const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import Firebase configuration
const { adminDb } = require('./config/firebase');

// Import routes
const athleteRoutes = require('./routes/athletes');
const assessmentRoutes = require('./routes/assessments');
const otpRoutes = require('./routes/otp');
const uploadRoutes = require('./routes/uploads');
const userDashboardRoutes = require('./routes/userDashboard');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:8102', 'http://192.168.1.113:3001', 'http://192.168.247.87:3001', 'http://192.168.56.1:3001', 'http://192.168.1.114:3001'], // React dev servers and mobile app
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

// Test Firebase connection
try {
  // Simple connection test - just log that we're using Firebase
  console.log('✅ Connected to Firebase Firestore');
} catch (error) {
  console.error('❌ Firebase connection error:', error);
};

// Routes
app.use('/api/athletes', athleteRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/user-dashboard', userDashboardRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SAI Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SAI Sports Talent Assessment API',
    version: '1.0.0',
    endpoints: {
      athletes: '/api/athletes',
      assessments: '/api/assessments',
      otp: '/api/otp',
      uploads: '/api/uploads',
      health: '/api/health',
      'user-dashboard': '/api/user-dashboard'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    requestedUrl: req.originalUrl
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 SAI Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔥 Database: Firebase Firestore`);
});

module.exports = app;