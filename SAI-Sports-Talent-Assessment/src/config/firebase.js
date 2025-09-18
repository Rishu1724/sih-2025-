import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUK6Fp1Z--Sl-b9jG9HpwIYqT7WKAOqR0",
  authDomain: "sihnew-4c27b.firebaseapp.com",
  projectId: "sihnew-4c27b",
  storageBucket: "sihnew-4c27b.appspot.com",
  messagingSenderId: "1097171240577",
  appId: "1:1097171240577:web:6dea794e40e68408cbaf80"
};

// Initialize Firebase with performance settings
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with conditional persistence based on platform
let auth;
if (Platform.OS === 'web') {
  // For web, use default auth
  auth = getAuth(app);
} else {
  // For mobile, try to use AsyncStorage persistence
  try {
    const { getReactNativePersistence } = require('firebase/auth');
    const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
    const { initializeAuth } = require('firebase/auth');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (error) {
    console.warn('Failed to initialize auth with persistence, falling back to default:', error);
    auth = getAuth(app);
  }
}

// Fallback if auth wasn't initialized properly
if (!auth) {
  auth = getAuth(app);
}

export { auth };

// Initialize Firestore with performance optimizations
export const db = getFirestore(app);

// Enable Firestore emulator in development for faster testing
if (__DEV__) {
  // Uncomment the following line if you're using the Firestore emulator
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

// Initialize Analytics (only for web platform and when supported)
export let analytics = null;
if (Platform.OS === 'web') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export default app;