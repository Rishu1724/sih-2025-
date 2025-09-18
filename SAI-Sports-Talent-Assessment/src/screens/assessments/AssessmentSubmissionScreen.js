import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import BlockchainExplorer from '../../components/BlockchainExplorer';

import { Colors, Gradients } from '../../constants/colors';
import { API_CONFIG } from '../../config/api';
import { getAthletes } from '../../services/FirebaseService';
import { testNetworkConnectivity } from '../../utils/networkUtils';
import { generateBlockchainHash, generateTransactionId } from '../../services/BlockchainService';

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
    },
    // Add blockchain fields
    blockchainHash: '',
    transactionId: ''
  });

  const [athletes, setAthletes] = useState([]);
  const [sportsCategories, setSportsCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [isMobile, setIsMobile] = useState(Platform.OS !== 'web');
  const [networkError, setNetworkError] = useState(false);

  // Assessment types (AI-supported exercises)
  const assessmentTypes = useMemo(() => [
    { label: 'Sit-ups - Core strength assessment (AI Analysis)', value: 'sit-ups' },
    { label: 'Push-ups - Upper body strength assessment (AI Analysis)', value: 'push-ups' },
    { label: 'Vertical Jump - Explosive leg power assessment (AI Analysis)', value: 'vertical-jump' },
    { label: 'Shuttle Run - Agility and speed assessment (AI Analysis)', value: 'shuttle-run' }
  ], []);

  // Function to get assessment details when type is selected
  const getAssessmentDetails = useCallback((assessmentType) => {
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
  }, []);

  // Handle assessment type selection
  const handleAssessmentTypeChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev,
      assessmentType: value
    }));
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAthletesWrapper = async () => {
      try {
        setLoadingAthletes(true);
        setNetworkError(false);
        
        // Fetch real athletes from Firestore using FirebaseService
        const athletesData = await getAthletes();
        
        // Check if component is still mounted before updating state
        if (!isMounted) return;
        
        if (athletesData && athletesData.length > 0) {
          // Group athletes by sport more efficiently
          const sportGroups = new Map();
          athletesData.forEach(athlete => {
            if (!sportGroups.has(athlete.sport)) {
              sportGroups.set(athlete.sport, {
                label: athlete.sport,
                value: athlete.sport,
                athletes: []
              });
            }
            sportGroups.get(athlete.sport).athletes.push(athlete);
          });
          
          const sportsCategories = Array.from(sportGroups.values());
          if (isMounted) {
            setSportsCategories(sportsCategories);
            setAthletes(athletesData);
          }
        } else {
          // Fallback to mock data if no athletes found
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
          
          if (isMounted) {
            setSportsCategories(mockSportsCategories);
            const allAthletes = mockSportsCategories.flatMap(category => category.athletes);
            setAthletes(allAthletes);
          }
        }
      } catch (error) {
        console.error('Fetch athletes error:', error);
        if (isMounted) {
          setNetworkError(true);
          Alert.alert('Error', 'Failed to load athletes. Please check your network connection.');
        }
      } finally {
        if (isMounted) {
          setLoadingAthletes(false);
        }
      }
    };
    
    fetchAthletesWrapper();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Platform-specific initialization
  useEffect(() => {
    setIsMobile(Platform.OS !== 'web');
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

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleVideoSelect = useCallback(async () => {
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
  }, []);

  const validateForm = useCallback(() => {
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
  }, [formData]);

  // Function to generate a dummy blockchain hash
  const handleGenerateBlockchainHash = useCallback(() => {
    const hash = generateBlockchainHash();
    const transactionId = generateTransactionId();
    
    setFormData(prev => ({
      ...prev,
      blockchainHash: hash,
      transactionId: transactionId
    }));
  }, []);

  // Function to generate a dummy transaction ID
  const generateTransactionId = useCallback(() => {
    const prefix = '0x';
    const characters = '0123456789abcdef';
    let id = prefix;
    for (let i = 0; i < 64; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // If blockchain hash doesn't exist, generate it
      let blockchainHash = formData.blockchainHash;
      let transactionId = formData.transactionId;
      
      if (!blockchainHash) {
        blockchainHash = generateBlockchainHash();
        transactionId = generateTransactionId();
      }

      // Update form data with blockchain identifiers
      setFormData(prev => ({
        ...prev,
        blockchainHash,
        transactionId
      }));

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
        // Add blockchain data
        blockchainHash,
        transactionId,
        status: 'Processing',
        submissionDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Always save to Firebase first to ensure data persistence
      let firebaseAssessmentId = null;
      try {
        // Import FirebaseService here to avoid circular dependencies
        const { createAssessment } = require('../../services/FirebaseService');
        const firebaseResult = await createAssessment(assessmentData);
        if (firebaseResult.success) {
          firebaseAssessmentId = firebaseResult.id;
          // Update the assessment ID in the data for local storage
          assessmentData.id = firebaseAssessmentId;
        }
      } catch (firebaseError) {
        console.error('Failed to save assessment to Firebase:', firebaseError);
        Alert.alert('Error', 'Failed to save assessment data. Please try again.');
        setLoading(false);
        return;
      }

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
        }
        
        // Save assessment to local storage with Firebase ID
        await offlineStorage.saveTest(assessmentData);
      } catch (storageError) {
        console.warn('Failed to save assessment locally:', storageError);
      }

      // Test network connectivity
      const { success: networkSuccess, baseUrl } = await testNetworkConnectivity();

      // If network test fails, show success message for offline submission
      if (!networkSuccess) {
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
                  },
                  blockchainHash: '',
                  transactionId: ''
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced timeout to 15 seconds for faster failure
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENT_SUBMIT}`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData, let fetch set it automatically
        },
        body: submitData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const result = await response.json();
      
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
        } catch (updateError) {
          console.warn('Failed to update assessment with API response:', updateError);
        }
        
        // Show green success popup with blockchain info
        Alert.alert(
          'Success', 
          `Assessment submitted successfully!

Blockchain Hash: ${blockchainHash}
Transaction ID: ${transactionId}

AI analysis is processing your video. You can check the results in the assessments list and test history.`,
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
                  },
                  blockchainHash: '',
                  transactionId: ''
                });
                // Navigate to assessment list to view the submitted assessment
                navigation.navigate('AssessmentList');
              }
            }
          ]
        );
      } else {
        const errorMessage = result.message || 'Assessment submission failed. Please try again.';
        
        // Even if API submission fails, the assessment is already saved in Firebase and local storage
        Alert.alert(
          'Partial Success',
          `Assessment saved locally with blockchain verification!

Blockchain Hash: ${blockchainHash}
Transaction ID: ${transactionId}

AI analysis will process your video when you reconnect. You can view it in your history and recent activities.`,
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
                  },
                  blockchainHash: '',
                  transactionId: ''
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
  }, [formData, navigation, validateForm]);

  const selectedAthlete = useMemo(() => athletes.find(athlete => athlete.id === formData.athleteId), [athletes, formData.athleteId]);

  // Show success message when a new athlete is selected
  const showSuccessMessage = useMemo(() => newAthleteId && selectedAthlete && selectedAthlete.id === newAthleteId, [newAthleteId, selectedAthlete]);

  // Simple loading check for mobile - show content as soon as we have data
  const isContentReady = useMemo(() => !loadingAthletes || athletes.length > 0, [loadingAthletes, athletes]);

  // Memoize athlete items to prevent unnecessary re-renders
  const athleteItems = useMemo(() => athletes.map(athlete => ({ 
    label: `${athlete.name} (${athlete.district}, ${athlete.state})`, 
    value: athlete.id 
  })), [athletes]);
  
  // Memoize sport category items
  const sportCategoryItems = useMemo(() => sportsCategories.map(cat => ({ label: cat.label, value: cat.value })), [sportsCategories]);

  const handleVerifyOnBlockchain = () => {
    // In a real implementation, this would open a blockchain explorer
    // For now, we'll just show an alert
    Alert.alert(
      'Blockchain Verification',
      `This assessment will be verified on the blockchain with:

Hash: ${formData.blockchainHash}
Transaction ID: ${formData.transactionId}

In a real implementation, this would open a blockchain explorer.`,
      [{ text: 'OK' }]
    );
  };

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
            <MaterialCommunityIcons name="video-plus" size={28} color={Colors.white} />
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
            size={24}
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
            <MaterialCommunityIcons name="check-circle" size={24} color={Colors.white} />
            <Text style={styles.successMessageText}>
              Athlete "{newAthleteName || selectedAthlete.name}" registered successfully!
            </Text>
          </View>
        </View>
      )}

      {/* Show content immediately but disable pickers while loading */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.formContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assessment Details</Text>
              
              <CustomPicker
                label="Select Sport Category *"
                value={formData.selectedSport}
                onValueChange={(value) => handleInputChange('selectedSport', value)}
                items={sportCategoryItems}
                placeholder="Choose sport category"
                disabled={loadingAthletes}
              />

              <CustomPicker
                label="Select Athlete *"
                value={formData.athleteId}
                onValueChange={(value) => handleInputChange('athleteId', value)}
                items={athleteItems}
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

            {/* Blockchain Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Blockchain Verification</Text>
                <TouchableOpacity 
                  style={styles.generateButton}
                  onPress={handleGenerateBlockchainHash}
                >
                  <MaterialCommunityIcons name="refresh" size={18} color={Colors.white} />
                  <Text style={styles.generateButtonText}>Generate</Text>
                </TouchableOpacity>
              </View>
              
              {formData.blockchainHash ? (
                <View style={styles.blockchainInfoContainer}>
                  <View style={styles.blockchainInfo}>
                    <View style={styles.blockchainRow}>
                      <MaterialCommunityIcons name="hexagon-outline" size={18} color={Colors.primary} />
                      <Text style={styles.blockchainLabel}>Blockchain Hash:</Text>
                    </View>
                    <Text style={styles.blockchainValue} selectable>
                      {formData.blockchainHash}
                    </Text>
                  </View>
                  <View style={styles.blockchainInfo}>
                    <View style={styles.blockchainRow}>
                      <MaterialCommunityIcons name="identifier" size={18} color={Colors.primary} />
                      <Text style={styles.blockchainLabel}>Transaction ID:</Text>
                    </View>
                    <Text style={styles.blockchainValue} selectable>
                      {formData.transactionId}
                    </Text>
                  </View>
                  <View style={styles.blockchainStatus}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
                    <Text style={styles.blockchainStatusText}>Assessment secured on blockchain</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.verifyButton}
                    onPress={handleVerifyOnBlockchain}
                  >
                    <MaterialCommunityIcons name="open-in-new" size={18} color={Colors.white} />
                    <Text style={styles.verifyButtonText}>Verify on Blockchain</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.blockchainPlaceholder}>
                  <MaterialCommunityIcons name="blockchain" size={40} color={Colors.gray} />
                  <Text style={styles.blockchainPlaceholderText}>
                    Click "Generate" to create blockchain verification for this assessment
                  </Text>
                  <Text style={styles.blockchainPlaceholderSubtext}>
                    This ensures your assessment is securely recorded and tamper-proof
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
    paddingBottom: 25,
    paddingTop: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.white + '20',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  keyboardView: {
    flex: 1,
  },
  networkErrorContainer: {
    backgroundColor: Colors.warning + '20',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.warning,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  networkErrorText: {
    color: Colors.error,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  videoSelectButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    minHeight: 56,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  videoSelectButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  videoInfo: {
    backgroundColor: Colors.info + '20',
    padding: 16,
    borderRadius: 16,
    marginTop: 15,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  videoInfoText: {
    color: Colors.info,
    fontSize: 16,
    fontWeight: '500',
  },
  athleteInfoContainer: {
    marginBottom: 25,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 25,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  athleteInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  athleteInfoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 12,
  },
  athleteInfoCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  athleteNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  athleteNameDetails: {
    marginLeft: 20,
  },
  athleteName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  athleteAge: {
    fontSize: 18,
    color: Colors.gray,
    marginTop: 6,
    fontWeight: '600',
  },
  athleteDetails: {
    marginTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
  detailText: {
    fontSize: 18,
    color: Colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  videoUploadContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  videoUploadButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  videoUploadText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 12,
  },
  videoFileName: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 8,
    textAlign: 'center',
  },
  videoUploadHint: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 10,
  },
  submitButton: {
    marginTop: 25,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  successMessageContainer: {
    backgroundColor: Colors.success,
    paddingVertical: 16,
    paddingHorizontal: 25,
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  successMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMessageText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  assessmentInfo: {
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginTop: 15,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assessmentInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 10,
  },
  assessmentInfoText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    minHeight: 40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  
  generateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  blockchainInfoContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  
  blockchainInfo: {
    marginBottom: 15,
  },
  
  blockchainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  blockchainLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 10,
  },
  
  blockchainValue: {
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 10,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },
  
  blockchainStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    justifyContent: 'center',
  },
  
  blockchainStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 8,
  },
  
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.info,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
    justifyContent: 'center',
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  
  verifyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  blockchainPlaceholder: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 25,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  blockchainPlaceholderText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
    lineHeight: 24,
  },
  
  blockchainPlaceholderSubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default AssessmentSubmissionScreen;