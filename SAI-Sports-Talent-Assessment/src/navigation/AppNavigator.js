import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import MainTabNavigator from './MainTabNavigator';
import TestInstructionScreen from '../screens/tests/TestInstructionScreen';
import VideoRecordingScreen from '../screens/tests/VideoRecordingScreen';
import TestResultScreen from '../screens/tests/TestResultScreen';
import OfflineTestScreen from '../screens/tests/OfflineTestScreen';

// Import new assessment screens
import AssessmentSubmissionScreen from '../screens/assessments/AssessmentSubmissionScreen';
import AssessmentListScreen from '../screens/assessments/AssessmentListScreen';
import AssessmentDetailScreen from '../screens/assessments/AssessmentDetailScreen';
import AthleteRegistrationScreen from '../screens/athletes/AthleteRegistrationScreen';
import AthleteListScreen from '../screens/athletes/AthleteListScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TalentRankingsScreen from '../screens/rankings/TalentRankingsScreen';
import ReportGenerationScreen from '../screens/reports/ReportGenerationScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen 
              name="OTPVerification" 
              component={OTPVerificationScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="TestInstruction" 
              component={TestInstructionScreen}
              options={{ headerShown: true, title: 'Test Instructions' }}
            />
            <Stack.Screen 
              name="VideoRecording" 
              component={VideoRecordingScreen}
              options={{ headerShown: true, title: 'Record Test' }}
            />
            <Stack.Screen 
              name="TestResult" 
              component={TestResultScreen}
              options={{ headerShown: true, title: 'Test Results' }}
            />
            <Stack.Screen 
              name="OfflineTest" 
              component={OfflineTestScreen}
              options={{ headerShown: true, title: 'Offline Testing' }}
            />
            <Stack.Screen 
              name="AssessmentSubmission" 
              component={AssessmentSubmissionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AssessmentList" 
              component={AssessmentListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AssessmentDetail" 
              component={AssessmentDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AthleteRegistration" 
              component={AthleteRegistrationScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AthleteList" 
              component={AthleteListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="TalentRankings" 
              component={TalentRankingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ReportGeneration" 
              component={ReportGenerationScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;