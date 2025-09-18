import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Google Sign-In
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user exists in Firestore, if not create profile
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create new user profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        avatar: user.photoURL,
        joinDate: new Date().toISOString(),
        completedTests: 0,
        achievements: [],
        emailVerified: user.emailVerified,
        authProvider: 'google'
      });
    }
    
    // Get user data from Firestore
    const userData = userDoc.exists() ? userDoc.data() : null;
    
    return {
      user,
      userData
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile
    await updateProfile(user, {
      displayName: userData.name
    });
    
    // Save additional user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      name: userData.name,
      age: userData.age,
      phone: userData.phone,
      joinDate: new Date().toISOString(),
      avatar: null,
      completedTests: 0,
      achievements: [],
      emailVerified: user.emailVerified
    });
    
    // Send email verification
    await sendEmailVerification(user);
    
    return {
      user,
      message: 'Registration successful! Please check your email for verification.'
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;
    
    return {
      user,
      userData
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error('Logout failed. Please try again.');
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return 'Password reset email sent! Check your inbox.';
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Update user profile
export const updateUserProfile = async (uid, updates) => {
  try {
    await setDoc(doc(db, 'users', uid), updates, { merge: true });
    return 'Profile updated successfully!';
  } catch (error) {
    throw new Error('Failed to update profile. Please try again.');
  }
};

// Get user data from Firestore
export const getUserData = async (uid) => {
  try {
    // For now, return null to avoid permission errors
    // We'll enable this once Firestore rules are properly configured
    console.log('Fetching user data for:', uid);
    return null;
    
    // Commented out until Firestore rules are configured
    // const userDoc = await getDoc(doc(db, 'users', uid));
    // return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.log('Error fetching user data (this is expected during initial setup):', error.message);
    return null;
  }
};

// Firebase auth error messages
const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred. Please try again.';
  }
};