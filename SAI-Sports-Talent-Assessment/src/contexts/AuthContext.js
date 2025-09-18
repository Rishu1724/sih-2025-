import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { loginUser, registerUser, logoutUser, getUserData, updateUserProfile, signInWithGoogle } from '../utils/authHelpers';

const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          console.log('User signed in:', firebaseUser.email);
          
          // For now, create a basic user object without Firestore
          // until permissions are properly configured
          const user = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            photoURL: firebaseUser.photoURL,
            // Default user data until Firestore is configured
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            joinDate: new Date().toISOString(),
            completedTests: 0,
            achievements: [],
            authProvider: firebaseUser.providerData[0]?.providerId || 'email'
          };
          
          dispatch({ type: 'LOGIN', payload: user });
        } else {
          // User is signed out
          console.log('User signed out');
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });

    return () => unsubscribe();
  }, []);

  // Legacy method - now handled by Firebase auth state listener
  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        dispatch({ type: 'LOGIN', payload: JSON.parse(userData) });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { user, userData } = await loginUser(email, password);
      
      const combinedUserData = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        ...userData
      };
      
      // Cache user data locally as backup
      await AsyncStorage.setItem('userData', JSON.stringify(combinedUserData));
      
      return combinedUserData;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // First dispatch logout to update state immediately
      dispatch({ type: 'LOGOUT' });
      
      // Then clear local storage
      await AsyncStorage.removeItem('userData');
      
      // Finally sign out from Firebase
      await logoutUser();
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if Firebase logout fails, we should still log out locally
      dispatch({ type: 'LOGOUT' });
      await AsyncStorage.removeItem('userData');
    }
  };

  const updateUser = async (updates) => {
    try {
      if (state.user?.uid) {
        await updateUserProfile(state.user.uid, updates);
        const updatedUser = { ...state.user, ...updates };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        dispatch({ type: 'UPDATE_USER', payload: updates });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { user, userData } = await signInWithGoogle();
      
      const combinedUserData = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ...userData
      };
      
      // Cache user data locally as backup
      await AsyncStorage.setItem('userData', JSON.stringify(combinedUserData));
      
      return combinedUserData;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (email, password, userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await registerUser(email, password, userData);
      return result;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const value = {
    ...state,
    login,
    logout,
    register,
    loginWithGoogle,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};