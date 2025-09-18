import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import CustomPicker from '../../components/CustomPicker';
import { Colors, Gradients } from '../../constants/colors';
import { API_CONFIG } from '../../config/api';
import { getAthletes } from '../../services/FirebaseService';
import { testNetworkConnectivity } from '../../utils/networkUtils';

const AssessmentSubmissionScreen = ({ route, navigation }) => {
  // More robust way to handle route parameters
  const routeParams = route?.params || {};
  const { newAthleteId, newAthleteName } = routeParams;

  const [formData, setFormData] = useState({
    selectedSport: '',
    assessmentType: '',
    athleteId: '',
    videoFile: null,
    metadata: {
      deviceInfo: '',
      duration: 0,
      fileSize: 0
    }
  });

  const [athletes, setAthletes] = useState([]);
  const [sportsCategories, setSportsCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  // Assessment types (AI-supported exercises)
  const assessmentTypes = [
    { label: 'Sit-ups - Core strength assessment (AI Analysis)', value: 'sit-ups' },
    { label: 'Push-ups - Upper body strength assessment (AI Analysis)', value: 'push-ups' },
    { label: 'Vertical Jump - Explosive leg power assessment (AI Analysis)', value: 'vertical-jump' },
    { label: 'Shuttle Run - Agility and speed assessment (AI Analysis)', value: 'shuttle-run' }
  ];

  // Function to get assessment details when type is selected
  const getAssessmentDetails = (assessmentType) => {
    const details = {
      'sit-ups': {
        name: 'Sit-ups',
        description: 'Core strength assessment using AI analysis',
        aiScript: 'situp_counter.py',
        expectedOutput: 'Repetition count and technique analysis'
      },
      'push-ups': {
        name: 'Push-ups',
        description: 'Upper body strength assessment using AI analysis',
        aiScript: 'pushup.py',
        expectedOutput: 'Repetition count and technique analysis'
      },
      'vertical-jump': {
        name: 'Vertical Jump',
        description: 'Explosive leg power assessment using AI analysis',
        aiScript: 'vertical_jump.py',
        expectedOutput: 'Jump height and technique analysis'
      },
      'shuttle-run': {
        name: 'Shuttle Run',
        description: 'Agility and speed assessment using AI analysis',
        aiScript: 'shuttle_run.py',
        expectedOutput: 'Lap count and technique analysis'
      }
    };
    
    return details[assessmentType] || null;
  };

  // Handle assessment type selection
  const handleAssessmentTypeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      assessmentType: value
    }));
    
    // Show information about the selected assessment type
    if (value) {
      const details = getAssessmentDetails(value);
      if (details) {
        console.log(`Selected assessment: ${details.name}`);
        console.log(`AI Script: ${details.aiScript}`);
        console.log(`Expected Output: ${details.expectedOutput}`);
      }
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, []);

  // Effect to automatically select newly registered athlete
  useEffect(() => {
    if (newAthleteId && athletes.length > 0) {
      // Find the athlete to get their sport
      const athlete = athletes.find(a => a.id === newAthleteId);
      if (athlete) {
        setFormData(prev => ({
          ...prev,
          athleteId: newAthleteId,
          selectedSport: athlete.sport
        }));
      }
    }
  }, [newAthleteId, athletes]);

  const fetchAthletes = async () => {
    try {
      setLoadingAthletes(true);
      setNetworkError(false);
      
      // Fetch real athletes from Firestore using FirebaseService
      const athletesData = await getAthletes();
      
      if (athletesData && athletesData.length > 0) {
        // Group athletes by sport
        const sportGroups = {};
        athletesData.forEach(athlete => {
          if (!sportGroups[athlete.sport]) {
            sportGroups[athlete.sport] = {
              label: athlete.sport,
              value: athlete.sport,
              athletes: []
            };
          }
          sportGroups[athlete.sport].athletes.push(athlete);
        });
        
        const sportsCategories = Object.values(sportGroups);
        setSportsCategories(sportsCategories);
        setAthletes(athletesData);
        
        console.log('Athletes loaded:', athletesData.length, 'athletes');
      } else {
        // Fallback to mock data if no athletes found
        console.warn('No athletes found, using mock data');
        const mockSportsCategories = [
          {
            label: 'Swimming',
            value: 'Swimming',
            athletes: [
              { id: '1', name: 'Michael Phelps', email: 'michael.phelps@example.com', sport: 'Swimming', age: 25, state: 'Maharashtra', district: 'Mumbai' },
              { id: '2', name: 'Katie Ledecky', email: 'katie.ledecky@example.com', sport: 'Swimming', age: 22, state: 'Karnataka', district: 'Bangalore' }
            ]
          },
          {
            label: 'Cricket',
            value: 'Cricket',
            athletes: [
              { id: '3', name: 'Virat Kohli', email: 'virat.kohli@example.com', sport: 'Cricket', age: 28, state: 'Delhi', district: 'New Delhi' },
              { id: '4', name: 'Mithali Raj', email: 'mithali.raj@example.com', sport: 'Cricket', age: 26, state: 'Tamil Nadu', district: 'Chennai' }
            ]
          }
        ];
        
        setSportsCategories(mockSportsCategories);
        const allAthletes = mockSportsCategories.flatMap(category => category.athletes);
        setAthletes(allAthletes);
      }
    } catch (error) {
      console.error('Fetch athletes error:', error);
      setNetworkError(true);
      Alert.alert('Error', 'Failed to load athletes. Please check your network connection.');
    } finally {
      setLoadingAthletes(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVideoSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setFormData(prev => ({
          ...prev,
          videoFile: file,
          metadata: {
            ...prev.metadata,
            fileSize: file.size || 0,
            deviceInfo: Platform.OS + ' ' + Platform.Version
          }
        }));
        Alert.alert('Success', `Video selected: ${file.name}`);
      }
    } catch (error) {
      console.error('Video selection error:', error);
      Alert.alert('Error', 'Failed to select video file');
    }
  };

  const validateForm = () => {
    if (!formData.selectedSport) {
      Alert.alert('Validation Error', 'Please select a sports category');
      return false;
    }
    
    if (!formData.athleteId) {
      Alert.alert('Validation Error', 'Please select an athlete');
      return false;
    }
    
    if (!formData.assessmentType) {
      Alert.alert('Validation Error', 'Please select an assessment type');
      return false;
    }
    
    if (!formData.videoFile) {
      Alert.alert('Validation Error', 'Please select a video file');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare assessment data with proper structure for both Firebase and API
      const assessmentData = {
        sportCategory: formData.selectedSport,
        assessmentType: formData.assessmentType,
        athleteId: formData.athleteId,
        // Store video metadata properly
        videoMetadata: formData.videoFile ? {
          name: formData.videoFile.name,
          size: formData.videoFile.size,
          type: formData.videoFile.mimeType,
          uri: formData.videoFile.uri
        } : null,
        metadata: {
          ...formData.metadata,
          deviceInfo: Platform.OS + ' ' + (formData.metadata.deviceInfo || ''),
        },
        status: 'Processing',
        submissionDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Prepared assessment data:', assessmentData);

      // Always save to Firebase first to ensure data persistence
      let firebaseAssessmentId = null;
      try {
        // Import FirebaseService here to avoid circular dependencies
        const { createAssessment } = require('../../services/FirebaseService');
        const firebaseResult = await createAssessment(assessmentData);
        if (firebaseResult.success) {
          firebaseAssessmentId = firebaseResult.id;
          console.log('Assessment saved to Firebase with ID:', firebaseAssessmentId);
          // Update the assessment ID in the data for local storage
          assessmentData.id = firebaseAssessmentId;
        }
      } catch (firebaseError) {
        console.error('Failed to save assessment to Firebase:', firebaseError);
        Alert.alert('Error', 'Failed to save assessment data. Please try again.');
        setLoading(false);
        return;
      }

      // Test network connectivity
      console.log('Testing network connectivity...');
      const { success: networkSuccess, baseUrl } = await testNetworkConnectivity();
      
      // Save to local storage immediately for offline access
      try {
        const offlineStorage = require('../../utils/offlineStorage').default;
        await offlineStorage.initialize();
        
        // Save video locally if available
        let localVideoPath = null;
        if (formData.videoFile) {
          const fileName = `assessment_${Date.now()}_${formData.videoFile.name}`;
          localVideoPath = await offlineStorage.saveVideoFile(formData.videoFile.uri, fileName);
          assessmentData.localVideoPath = localVideoPath;
          console.log('Video saved locally at:', localVideoPath);
        }
        
        // Save assessment to local storage with Firebase ID
        await offlineStorage.saveTest(assessmentData);
        console.log('Assessment saved to local storage');
      } catch (storageError) {
        console.warn('Failed to save assessment locally:', storageError);
      }

      // If network test fails, show success message for offline submission
      if (!networkSuccess) {
        console.log('Network unavailable, showing offline success message');
        
        // Show success message
        Alert.alert(
          'Success', 
          'Assessment saved successfully! AI analysis will process your video when you reconnect to the network. You can view this assessment in your history and recent activities.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  selectedSport: '',
                  assessmentType: '',
                  athleteId: '',
                  videoFile: null,
                  metadata: {
                    deviceInfo: '',
                    duration: 0,
                    fileSize: 0
                  }
                });
                // Navigate to assessment list to view the submitted assessment
                navigation.navigate('AssessmentList');
              }
            }
          ]
        );
        
        setLoading(false);
        return;
      }
      
      // Update API base URL if needed
      if (baseUrl && baseUrl !== API_CONFIG.BASE_URL) {
        API_CONFIG.BASE_URL = baseUrl;
        console.log('Updated BASE_URL to:', API_CONFIG.BASE_URL);
      }
      
      // Proceed with online submission if network is available
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('sportCategory', formData.selectedSport);
      submitData.append('assessmentType', formData.assessmentType);
      submitData.append('athleteId', formData.athleteId);
      submitData.append('metadata', JSON.stringify({
        ...formData.metadata,
        deviceInfo: Platform.OS + ' ' + (formData.metadata.deviceInfo || ''),
      }));
      
      if (formData.videoFile) {
        submitData.append('video', {
          uri: formData.videoFile.uri,
          type: formData.videoFile.mimeType || 'video/mp4',
          name: formData.videoFile.name || 'assessment_video.mp4'
        });
      }

      console.log('Submitting assessment with data to API');
      console.log('Making request to:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENT_SUBMIT}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for video upload
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENT_SUBMIT}`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData, let fetch set it automatically
        },
        body: submitData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Submission response:', result);
      
      if (response.ok && result.success) {
        // Update the assessment in Firebase with API response data if available
        try {
          const { updateAssessment } = require('../../services/FirebaseService');
          const updateData = {
            status: 'Processing',
            updatedAt: new Date().toISOString()
          };
          
          // If API returned analysis data, include it
          if (result.data?.aiAnalysis) {
            updateData.aiAnalysis = result.data.aiAnalysis;
            updateData.status = 'Evaluated';
          }
          
          await updateAssessment(firebaseAssessmentId, updateData);
          console.log('Assessment updated in Firebase with API response');
        } catch (updateError) {
          console.warn('Failed to update assessment with API response:', updateError);
        }
        
        // Show green success popup
        Alert.alert(
          'Success', 
          'Assessment submitted successfully! AI analysis is processing your video. You can check the results in the assessments list and test history.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  selectedSport: '',
                  assessmentType: '',
                  athleteId: '',
                  videoFile: null,
                  metadata: {
                    deviceInfo: '',
                    duration: 0,
                    fileSize: 0
                  }
                });
                // Navigate to assessment list to view the submitted assessment
                navigation.navigate('AssessmentList');
              }
            }
          ]
        );
      } else {
        const errorMessage = result.message || 'Assessment submission failed. Please try again.';
        console.warn('Submission failed:', errorMessage);
        
        // Even if API submission fails, the assessment is already saved in Firebase and local storage
        Alert.alert(
          'Partial Success',
          'Assessment saved locally and will be processed when you reconnect. You can view it in your history and recent activities.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  selectedSport: '',
                  assessmentType: '',
                  athleteId: '',
                  videoFile: null,
                  metadata: {
                    deviceInfo: '',
                    duration: 0,
                    fileSize: 0
                  }
                });
                // Navigate to assessment list to view the submitted assessment
                navigation.navigate('AssessmentList');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Submission error:', error);
      setNetworkError(true);
      
      let errorMessage = 'Failed to submit assessment. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your network connection and try again.';
      } else if (error.message === 'Network request failed') {
        errorMessage = 'Cannot connect to server. Please check your internet connection and make sure the backend is running.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert('Submission Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedAthlete = athletes.find(athlete => athlete.id === formData.athleteId);

  // Show success message when a new athlete is selected
  const showSuccessMessage = newAthleteId && selectedAthlete && selectedAthlete.id === newAthleteId;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.primary} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <MaterialCommunityIcons name="video-plus" size={32} color={Colors.white} />
            <Text style={styles.headerTitle}>Submit Assessment</Text>
            <Text style={styles.headerSubtitle}>Upload performance video for evaluation</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Network error message */}
      {networkError && (
        <View style={styles.networkErrorContainer}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={20}
            color={Colors.error}
          />
          <Text style={styles.networkErrorText}>
            Network connection issues detected.
          </Text>
        </View>
      )}

      {/* Success message for newly registered athlete */}
      {showSuccessMessage && (
        <View style={styles.successMessageContainer}>
          <View style={styles.successMessageContent}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.white} />
            <Text style={styles.successMessageText}>
              Athlete "{newAthleteName || selectedAthlete.name}" registered successfully!
            </Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assessment Details</Text>
              
              <CustomPicker
                label="Select Sport Category *"
                value={formData.selectedSport}
                onValueChange={(value) => handleInputChange('selectedSport', value)}
                items={sportsCategories.map(cat => ({ label: cat.label, value: cat.value }))}
                placeholder="Choose sport category"
                disabled={loadingAthletes}
              />

              <CustomPicker
                label="Select Athlete *"
                value={formData.athleteId}
                onValueChange={(value) => handleInputChange('athleteId', value)}
                items={athletes.map(athlete => ({ 
                  label: `${athlete.name} (${athlete.district}, ${athlete.state})`, 
                  value: athlete.id 
                }))}
                placeholder="Choose athlete"
                disabled={loadingAthletes}
              />

              <CustomPicker
                label="Assessment Type *"
                value={formData.assessmentType}
                onValueChange={handleAssessmentTypeChange}
                items={assessmentTypes}
                placeholder="Select assessment type"
              />

              {/* Show details about selected assessment type */}
              {formData.assessmentType ? (
                <View style={styles.assessmentInfo}>
                  <Text style={styles.assessmentInfoTitle}>
                    {getAssessmentDetails(formData.assessmentType)?.name} Assessment
                  </Text>
                  <Text style={styles.assessmentInfoText}>
                    {getAssessmentDetails(formData.assessmentType)?.description}
                  </Text>
                  <Text style={styles.assessmentInfoText}>
                    <MaterialCommunityIcons name="robot" size={16} color={Colors.primary} />
                    {' '}AI Analysis: {getAssessmentDetails(formData.assessmentType)?.expectedOutput}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity 
                style={styles.videoSelectButton} 
                onPress={handleVideoSelect}
                disabled={loading}
              >
                <MaterialCommunityIcons 
                  name={formData.videoFile ? "video" : "video-plus"} 
                  size={24} 
                  color={Colors.white} 
                />
                <Text style={styles.videoSelectButtonText}>
                  {formData.videoFile ? formData.videoFile.name : "Select Video File"}
                </Text>
              </TouchableOpacity>

              {formData.videoFile && (
                <View style={styles.videoInfo}>
                  <Text style={styles.videoInfoText}>
                    <MaterialCommunityIcons name="information" size={16} color={Colors.info} />
                    {' '}File size: {(formData.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </View>
              )}
            </View>

            <CustomButton
              title="Submit Assessment"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || loadingAthletes}
              style={styles.submitButton}
              gradient
              leftIcon="send"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  networkErrorContainer: {
    backgroundColor: Colors.warning + '20',
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  networkErrorText: {
    color: Colors.error,
    marginLeft: 8,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  videoSelectButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  videoSelectButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  videoInfo: {
    backgroundColor: Colors.info + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  videoInfoText: {
    color: Colors.info,
    fontSize: 14,
  },
  athleteInfoContainer: {
    marginBottom: 25,
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  athleteInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  athleteInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 10,
  },
  athleteInfoCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  athleteNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  athleteNameDetails: {
    marginLeft: 15,
  },
  athleteName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  athleteAge: {
    fontSize: 16,
    color: Colors.gray,
    marginTop: 4,
    fontWeight: '600',
  },
  athleteDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 5,
  },
  detailText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 10,
    fontWeight: '500',
  },
  videoUploadContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  videoUploadButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoUploadText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 10,
  },
  videoFileName: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 5,
    textAlign: 'center',
  },
  videoUploadHint: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  submitButton: {
    marginTop: 20,
  },
  successMessageContainer: {
    backgroundColor: Colors.success,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  successMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMessageText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  assessmentInfo: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginTop: 10,
  },
  assessmentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  assessmentInfoText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default AssessmentSubmissionScreen;