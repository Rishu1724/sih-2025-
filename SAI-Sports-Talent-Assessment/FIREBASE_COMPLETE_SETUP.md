# Firebase Configuration Guide for Complete Data Storage

## Overview
This guide will help you configure Firebase to store all data including videos, assessments, user profiles, and other important information for the SAI Sports Talent Assessment application.

## Firebase Security Rules

### 1. Firestore Security Rules
Replace the current Firestore rules with the following comprehensive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && request.auth.uid != null;
    }
    
    // Athletes collection - authenticated users can read all, write their own
    match /athletes/{athleteId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.uid || 
         request.auth.uid == resource.data.createdBy ||
         !exists(/databases/$(database)/documents/athletes/$(athleteId)));
    }
    
    // Assessments collection - authenticated users can read/write
    match /assessments/{assessmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.assessorId || 
         request.auth.uid == resource.data.createdBy ||
         !exists(/databases/$(database)/documents/assessments/$(assessmentId)));
    }
    
    // Test Results collection - authenticated users can read/write
    match /testResults/{testResultId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.evaluatorId || 
         request.auth.uid == resource.data.createdBy ||
         !exists(/databases/$(database)/documents/testResults/$(testResultId)));
    }
    
    // Videos collection - authenticated users can read/write
    match /videos/{videoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.uploadedBy ||
         !exists(/databases/$(database)/documents/videos/$(videoId)));
    }
    
    // Achievements collection - authenticated users can read/write
    match /achievements/{achievementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Notifications collection - users can read their own notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if request.auth != null;
    }
    
    // Admin collection - only for admin users (optional)
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 2. Firebase Storage Security Rules
Configure Firebase Storage rules for file uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile photos - users can upload their own
    match /profile-photos/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        fileName.matches('.*_' + request.auth.uid + '_.*');
    }
    
    // Assessment videos - authenticated users can upload
    match /assessment-videos/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.size < 100 * 1024 * 1024 && // 100MB limit
        request.resource.contentType.matches('video/.*');
    }
    
    // Documents - authenticated users can upload
    match /documents/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.size < 10 * 1024 * 1024 && // 10MB limit
        (request.resource.contentType.matches('application/pdf') ||
         request.resource.contentType.matches('application/msword') ||
         request.resource.contentType.matches('application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
    }
    
    // Thumbnails - authenticated users can read/write
    match /thumbnails/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.size < 2 * 1024 * 1024 && // 2MB limit
        request.resource.contentType.matches('image/.*');
    }
    
    // Reports - authenticated users can read/write
    match /reports/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Database Collections Structure

### 1. Users Collection (/users/{userId})
```json
{
  "uid": "firebase_auth_uid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin|evaluator|viewer",
  "profilePhotoURL": "storage_url",
  "phoneNumber": "+1234567890",
  "organization": "SAI",
  "permissions": ["read_athletes", "write_assessments"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "lastLoginAt": "2024-01-01T00:00:00.000Z",
  "isActive": true
}
```

### 2. Athletes Collection (/athletes/{athleteId})
```json
{
  "name": "Athlete Name",
  "email": "athlete@example.com",
  "age": 18,
  "dateOfBirth": "2005-01-01",
  "ageGroup": "Under-18",
  "state": "State Name",
  "district": "District Name",
  "sport": "Athletics",
  "height": 175.5,
  "weight": 65.0,
  "phoneNumber": "+1234567890",
  "profilePhotoURL": "storage_url",
  "uid": "firebase_auth_uid_if_registered",
  "registrationDate": "2024-01-01T00:00:00.000Z",
  "bestScores": {
    "sit-ups": 50,
    "push-ups": 30,
    "vertical-jump": 45.5,
    "sprint": 12.5,
    "endurance": 300
  },
  "averageScore": 85.5,
  "totalAssessments": 5,
  "achievements": ["first_assessment", "improvement_badge"],
  "status": "active|inactive",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "createdBy": "evaluator_uid"
}
```

### 3. Assessments Collection (/assessments/{assessmentId})
```json
{
  "athleteId": "athlete_document_id",
  "assessorId": "evaluator_uid",
  "assessmentDate": "2024-01-01T00:00:00.000Z",
  "location": "Assessment Center Name",
  "testsCompleted": ["sit-ups", "vertical-jump", "sprint"],
  "overallScore": 85.5,
  "status": "pending|in_progress|completed|cancelled",
  "notes": "Assessment notes",
  "weather": "sunny",
  "equipment": ["stopwatch", "measuring_tape"],
  "duration": 120,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. Test Results Collection (/testResults/{testResultId})
```json
{
  "athleteId": "athlete_document_id",
  "assessmentId": "assessment_document_id",
  "testType": "sit-ups|push-ups|vertical-jump|sprint|endurance",
  "score": 45.5,
  "unit": "repetitions|cm|seconds|minutes",
  "videoId": "video_document_id",
  "videoURL": "storage_download_url",
  "metrics": {
    "attempts": 3,
    "bestAttempt": 2,
    "consistency": 85.0,
    "technique": "good"
  },
  "notes": "Performance notes",
  "evaluatorId": "evaluator_uid",
  "evaluationDate": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 5. Videos Collection (/videos/{videoId})
```json
{
  "athleteId": "athlete_document_id",
  "assessmentId": "assessment_document_id",
  "testType": "sit-ups|push-ups|vertical-jump|sprint|endurance",
  "filename": "unique_filename.mp4",
  "downloadURL": "storage_download_url",
  "thumbnailURL": "storage_thumbnail_url",
  "size": 25678900,
  "mimeType": "video/mp4",
  "duration": 120,
  "resolution": "1920x1080",
  "fps": 30,
  "description": "Video description",
  "uploadDate": "2024-01-01T00:00:00.000Z",
  "userId": "uploader_uid",
  "status": "uploaded|processing|ready|error",
  "metadata": {
    "camera": "iPhone 12",
    "location": "Assessment Center"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 6. Achievements Collection (/achievements/{achievementId})
```json
{
  "athleteId": "athlete_document_id",
  "type": "first_assessment|improvement|milestone|ranking",
  "title": "First Assessment Complete",
  "description": "Completed your first sports assessment",
  "icon": "trophy|medal|star|badge",
  "points": 100,
  "criteria": {
    "testType": "any|specific_test",
    "threshold": 50,
    "comparison": "greater_than|improvement"
  },
  "unlockedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 7. Notifications Collection (/notifications/{notificationId})
```json
{
  "userId": "recipient_uid",
  "type": "assessment_complete|achievement_unlocked|reminder|system",
  "title": "Assessment Complete",
  "message": "Your assessment has been completed successfully",
  "data": {
    "assessmentId": "assessment_document_id",
    "athleteId": "athlete_document_id"
  },
  "read": false,
  "readAt": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Storage Structure

### Folder Organization
```
/profile-photos/
  - profile_{userId}_{timestamp}_{random}.jpg
  
/assessment-videos/
  - {testType}_{athleteId}_{userId}_{timestamp}_{random}.mp4
  
/documents/
  - document_{userId}_{timestamp}_{random}.pdf
  
/thumbnails/
  - thumb_{videoId}_{timestamp}.jpg
  
/reports/
  - report_{assessmentId}_{timestamp}.pdf
```

## Implementation Steps

1. **Update Firebase Console Rules**:
   - Go to Firebase Console > Firestore Database > Rules
   - Replace the current rules with the Firestore rules above
   - Go to Firebase Console > Storage > Rules
   - Replace the current rules with the Storage rules above

2. **Test the Connection**:
   - The backend is already configured to use these collections
   - The new API endpoints handle all data operations
   - All video uploads and file storage are managed automatically

3. **Data Flow**:
   - User authentication → Firebase Auth
   - User profiles → Firestore users collection
   - Athlete registration → Firestore athletes collection
   - Video uploads → Firebase Storage + Firestore videos collection
   - Assessment data → Firestore assessments and testResults collections
   - File uploads → Firebase Storage with metadata in Firestore

## API Endpoints Available

### Upload Endpoints
- `POST /api/uploads/video` - Upload assessment videos
- `POST /api/uploads/document` - Upload documents
- `GET /api/uploads/videos/:athleteId` - Get videos for athlete
- `GET /api/uploads/files/:userId` - Get files for user
- `GET /api/uploads/stats/:userId` - Get storage statistics
- `DELETE /api/uploads/file` - Delete a file
- `POST /api/uploads/test-result` - Store test results
- `GET /api/uploads/test-results/:athleteId` - Get test results

### Enhanced Athlete Endpoints
- `POST /api/athletes/register` - Register athlete (with photo upload)
- `GET /api/athletes` - Get athletes (with filtering)
- `GET /api/athletes/:id` - Get specific athlete
- `PUT /api/athletes/:id` - Update athlete (with photo upload)

All data is now stored securely in Firebase with proper authentication and authorization!