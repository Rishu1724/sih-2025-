# Firebase Firestore Setup Guide

## Issue Description
The "Failed to update profile. Please try again." error is occurring because Firebase Firestore security rules are denying write access to the users collection.

## Solution Steps

### Step 1: Configure Firestore Security Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `sihnew-4c27b`
3. Navigate to **Firestore Database** > **Rules**
4. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Athletes collection - authenticated users can read and write
    match /athletes/{athleteId} {
      allow read, write: if request.auth != null;
    }
    
    // Assessments collection - authenticated users can read and write
    match /assessments/{assessmentId} {
      allow read, write: if request.auth != null;
    }
    
    // Rankings collection - authenticated users can read and write
    match /rankings/{rankingId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow all authenticated users to read and write for development
    // In production, you should implement more restrictive rules
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish** to save the rules

### Step 2: Test the Rules
1. Make sure you're logged in to the application
2. Try updating your profile
3. Check the browser console for any error messages

### Step 3: Alternative Temporary Fix (For Development Only)
If you need a quick temporary fix for development, you can use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning**: Never use these permissive rules in production!

## What We Fixed in the Code

1. **Enhanced Error Handling**: Added detailed error logging and specific error messages
2. **Authentication Checks**: Verify user is authenticated before making Firestore calls
3. **Better Firebase Functions**: Improved `updateUserProfile`, `createUserProfile`, and `getUserProfile` functions
4. **User-Friendly Messages**: Show specific error messages for different failure scenarios

## Common Errors and Solutions

### Error: "Permission denied"
- **Cause**: Firestore security rules are too restrictive
- **Solution**: Update Firestore rules as shown in Step 1

### Error: "Missing or insufficient permissions"
- **Cause**: User is not authenticated or rules don't allow the operation
- **Solution**: Ensure user is logged in and rules are properly configured

### Error: "User not authenticated"
- **Cause**: Firebase auth session expired
- **Solution**: Log out and log in again

### Error: "Network error"
- **Cause**: Internet connection issues
- **Solution**: Check internet connection and try again

## Testing the Fix

1. Start both frontend and backend servers
2. Log in with Google or email
3. Navigate to the profile page
4. Try updating your name, age, or other fields
5. The update should now work without permission errors

## Production Considerations

For production deployment:
1. Use more restrictive Firestore rules
2. Implement proper user roles and permissions
3. Add input validation on the server side
4. Set up monitoring for security rule violations