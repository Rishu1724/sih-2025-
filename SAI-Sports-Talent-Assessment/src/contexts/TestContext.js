import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TestContext = createContext();

const initialState = {
  testHistory: [],
  currentTest: null,
  achievements: [],
  userStats: {
    totalTests: 0,
    completedTests: 0,
    bestPerformances: {},
  },
};

const testReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TEST_HISTORY':
      return { ...state, testHistory: action.payload };
    case 'ADD_TEST_RESULT':
      return {
        ...state,
        testHistory: [action.payload, ...state.testHistory],
        userStats: {
          ...state.userStats,
          totalTests: state.userStats.totalTests + 1,
          completedTests: state.userStats.completedTests + 1,
        },
      };
    case 'SET_CURRENT_TEST':
      return { ...state, currentTest: action.payload };
    case 'SET_ACHIEVEMENTS':
      return { ...state, achievements: action.payload };
    case 'ADD_ACHIEVEMENT':
      return { ...state, achievements: [...state.achievements, action.payload] };
    case 'UPDATE_STATS':
      return { ...state, userStats: { ...state.userStats, ...action.payload } };
    default:
      return state;
  }
};

export const TestProvider = ({ children }) => {
  const [state, dispatch] = useReducer(testReducer, initialState);

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      const testHistory = await AsyncStorage.getItem('testHistory');
      const achievements = await AsyncStorage.getItem('achievements');
      const userStats = await AsyncStorage.getItem('userStats');

      if (testHistory) {
        dispatch({ type: 'SET_TEST_HISTORY', payload: JSON.parse(testHistory) });
      }
      if (achievements) {
        dispatch({ type: 'SET_ACHIEVEMENTS', payload: JSON.parse(achievements) });
      }
      if (userStats) {
        dispatch({ type: 'UPDATE_STATS', payload: JSON.parse(userStats) });
      }
    } catch (error) {
      console.error('Error loading test data:', error);
    }
  };

  const saveTestResult = async (testResult) => {
    try {
      const newResult = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...testResult,
      };

      dispatch({ type: 'ADD_TEST_RESULT', payload: newResult });
      
      const updatedHistory = [newResult, ...state.testHistory];
      await AsyncStorage.setItem('testHistory', JSON.stringify(updatedHistory));
      
      // Update user stats
      const updatedStats = {
        ...state.userStats,
        totalTests: state.userStats.totalTests + 1,
        completedTests: state.userStats.completedTests + 1,
      };
      await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
      
    } catch (error) {
      console.error('Error saving test result:', error);
      throw error;
    }
  };

  const addAchievement = async (achievement) => {
    try {
      const newAchievement = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...achievement,
      };

      dispatch({ type: 'ADD_ACHIEVEMENT', payload: newAchievement });
      
      const updatedAchievements = [...state.achievements, newAchievement];
      await AsyncStorage.setItem('achievements', JSON.stringify(updatedAchievements));
    } catch (error) {
      console.error('Error adding achievement:', error);
    }
  };

  const setCurrentTest = (test) => {
    dispatch({ type: 'SET_CURRENT_TEST', payload: test });
  };

  const value = {
    ...state,
    saveTestResult,
    addAchievement,
    setCurrentTest,
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
};

export const useTest = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
};