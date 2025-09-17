# SAI Sports Talent Assessment System

A comprehensive mobile application for managing athlete registration, video submission, performance evaluation, and blockchain-verified assessments with Firebase Firestore integration.

## Table of Contents
- [System Overview](#system-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Blockchain Integration](#blockchain-integration)
- [Development](#development)
- [Testing](#testing)

## System Overview

The SAI Sports Talent Assessment System is a mobile-first application designed to streamline the process of identifying and evaluating athletic talent. The system allows athletes to register, submit performance videos, and receive AI-powered analysis of their techniques. All assessments are blockchain-verified for authenticity and integrity.

## Key Features

### Core Functionality
- 🏃 **Athlete Registration** - Complete registration with personal and sports information
- 📹 **Video Submission** - Record and submit performance videos for analysis
- 🤖 **AI Analysis** - Automated assessment of athletic performance using computer vision
- 📊 **Performance Dashboard** - View detailed analysis results and historical data
- 🔐 **Blockchain Verification** - Immutable verification of all assessments
- 🏆 **Talent Rankings** - Athlete ranking system based on performance scores
- 📱 **Mobile-First Design** - Optimized for both Android and iOS devices

### Technical Features
- 🔥 **Firebase Integration** - Real-time database and authentication
- ⚡ **Offline Support** - Continue working even without internet connection
- 🌐 **Cross-Platform** - Works on mobile devices and web browsers
- 🛡️ **Security** - Secure authentication and data protection
- 📈 **Performance Optimized** - Fast loading and responsive UI

## Technology Stack

### Frontend (Mobile/Web)
- **Framework**: React Native (Expo)
- **UI Library**: Custom components with Material Design
- **State Management**: React Context API
- **Navigation**: React Navigation
- **Storage**: AsyncStorage for offline data

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **AI Processing**: Python-based computer vision algorithms

### Blockchain
- **Simulation**: Custom blockchain service for demonstration
- **Verification**: Hash-based verification of assessments

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **Python** (v3.8 or higher) - [Download here](https://www.python.org/downloads/)
3. **Expo CLI** - Install globally with `npm install -g expo-cli`
4. **Git** - [Download here](https://git-scm.com/downloads)

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SAI-Sports-Talent-Assessment
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Setup
Create a `.env` file in the backend directory with your Firebase configuration:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

## Blockchain Integration

### Overview
The system implements a simulated blockchain verification system to ensure the authenticity and immutability of athletic assessments. Each assessment is assigned a unique blockchain hash and transaction ID upon submission.

### Features
- 🔗 **Hash Generation** - Unique 64-character hash for each assessment
- 🆔 **Transaction IDs** - Ethereum-style transaction identifiers
- 📋 **Verification Display** - Visible blockchain information in UI
- 🔍 **Explorer Integration** - "View on Blockchain" functionality
- 🛡️ **Immutable Records** - Tamper-proof assessment records

### Implementation Details
1. When an assessment is submitted, a blockchain hash and transaction ID are automatically generated
2. These identifiers are stored with the assessment data in Firebase
3. Users can view blockchain information in the assessment details
4. A "View on Blockchain Explorer" button provides verification capability

### Example Blockchain Data
```
Hash: a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
Transaction ID: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
Status: Verified on Blockchain
```

## Development

### Starting the Development Server

#### Mobile Development
```bash
# Start Expo development server
expo start

# Start with specific options
expo start --android    # Android emulator
expo start --ios        # iOS simulator
expo start --web        # Web browser
```

#### Backend Server
```bash
# Navigate to backend directory
cd backend

# Start development server with auto-restart
npm run dev

# Or start normally
npm start
```

### Development Scripts
```bash
npm run start     # Start Expo development server
npm run android   # Start on Android
npm run ios       # Start on iOS
npm run web       # Start web version
npm run dev       # Start backend with nodemon
```

## Testing

### Manual Testing Guide

1. **Athlete Registration**
   - Navigate to Registration screen
   - Fill in athlete details
   - Submit and verify success

2. **Assessment Submission**
   - Select registered athlete
   - Choose assessment type
   - Record or upload video
   - Submit and check blockchain verification

3. **AI Analysis**
   - View submitted assessment
   - Check AI analysis results
   - Verify blockchain information

4. **Dashboard Navigation**
   - Browse talent rankings
   - View assessment history
   - Check performance statistics

For more detailed information about the project structure, deployment, and troubleshooting, please refer to [README_NEW.md](README_NEW.md).
