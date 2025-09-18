import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Camera } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

import CustomButton from '../../components/CustomButton';
import { Colors } from '../../constants/colors';
import { TEST_CONFIG } from '../../constants/tests';
import { useTest } from '../../contexts/TestContext';
import OfflineAIService from '../../services/OfflineAIService';
import offlineStorage from '../../utils/offlineStorage';

const { width, height } = Dimensions.get('window');

const VideoRecordingScreen = ({ route, navigation }) => {
  const { testType, practiceMode = false } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [testPhase, setTestPhase] = useState('ready'); // ready, countdown, recording, paused, completed
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  
  const { saveTestResult } = useTest();
  const config = TEST_CONFIG[testType];

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
        if (mediaLibraryStatus.status !== 'granted') {
          Alert.alert('Permission needed', 'Media library permission is required to save videos');
        }
      }
      
      // Initialize offline storage
      await offlineStorage.initialize();
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdown(3);
    setTestPhase('countdown');
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setIsCountingDown(false);
          setCountdown(null);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        setTestPhase('recording');
        setRecordingTime(0);
        
        // Start recording timer
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);

        const video = await cameraRef.current.recordAsync({
          quality: Camera.Constants.VideoQuality['720p'],
          maxDuration: config.duration,
        });

        // Save the video
        await handleVideoSaved(video);
      } catch (error) {
        console.error('Recording failed:', error);
        Alert.alert('Error', 'Failed to start recording');
        resetRecording();
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        await cameraRef.current.stopRecording();
        setIsRecording(false);
        setTestPhase('completed');
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } catch (error) {
        console.error('Stop recording failed:', error);
        Alert.alert('Error', 'Failed to stop recording');
      }
    }
  };

  const handleVideoSaved = async (video) => {
    try {
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(video.uri);
      
      if (!practiceMode) {
        // Generate unique test ID
        const testId = `${testType}_${Date.now()}`;
        
        // Save video file locally for offline processing
        const fileName = `${testId}.mp4`;
        const localVideoPath = await offlineStorage.saveVideoFile(video.uri, fileName);
        
        // Save test result to context and offline storage
        const testResult = {
          id: testId,
          testType,
          videoUri: video.uri,
          localVideoPath, // For offline processing
          duration: recordingTime,
          completed: true,
          practiceMode: false,
          timestamp: new Date().toISOString(),
          results: {
            recordingDuration: `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`,
            videoQuality: '720p',
          },
        };
        
        await saveTestResult(testResult);
        await offlineStorage.saveTest(testResult);
        
        // Process offline AI analysis if supported
        if (OfflineAIService.isSupported(testType)) {
          try {
            // Update UI to show processing
            setTestPhase('processing');
            
            // Run offline AI analysis
            const aiResult = await OfflineAIService.analyzeVideo(localVideoPath, testType);
            
            // Save AI analysis result
            await OfflineAIService.saveAnalysisResult(testId, aiResult);
            
            // Update test with AI results
            const updatedTestResult = {
              ...testResult,
              aiAnalysis: aiResult
            };
            
            await offlineStorage.updateTest(testId, { aiAnalysis: aiResult });
          } catch (aiError) {
            console.error('Offline AI analysis failed:', aiError);
            // Continue without AI results
          }
        }
      }

      Alert.alert(
        practiceMode ? 'Practice Complete' : 'Test Recorded Successfully',
        practiceMode 
          ? 'Your practice session has been completed. Ready to take the official test?'
          : 'Your test video has been saved. You can view the results now.',
        [
          { text: 'OK', onPress: () => navigation.navigate('TestResult', { testType, practiceMode }) },
        ]
      );
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save video');
    }
  };

  const resetRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setTestPhase('ready');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMaxDuration = () => {
    return Math.floor(config.duration / 60);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons
            name="camera-off"
            size={60}
            color={Colors.error}
          />
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <CustomButton
            title="Go to Settings"
            onPress={() => {
              // In a real app, you'd open device settings
              Alert.alert('Permission', 'Please grant camera permission in device settings');
            }}
            style={styles.permissionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={type}
        onCameraReady={() => console.log('Camera ready')}
      >
        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <View style={styles.testInfo}>
            <Text style={styles.testName}>{config.name}</Text>
            {practiceMode && (
              <View style={styles.practiceBadge}>
                <Text style={styles.practiceText}>PRACTICE MODE</Text>
              </View>
            )}
            {isOfflineMode && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineText}>OFFLINE MODE</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (isRecording) {
                Alert.alert(
                  'Stop Recording?',
                  'Are you sure you want to stop the current recording?',
                  [
                    { text: 'Continue', style: 'cancel' },
                    { text: 'Stop', onPress: () => { stopRecording(); navigation.goBack(); } },
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
          >
            <MaterialCommunityIcons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Countdown Overlay */}
        {isCountingDown && countdown && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Get Ready!</Text>
          </View>
        )}

        {/* Recording Status */}
        {isRecording && (
          <View style={styles.recordingStatus}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>REC</Text>
            </View>
            <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
          </View>
        )}

        {/* Processing Status */}
        {testPhase === 'processing' && (
          <View style={styles.processingOverlay}>
            <Text style={styles.processingText}>Processing offline analysis...</Text>
          </View>
        )}

        {/* Control Overlay */}
        <View style={styles.controlsOverlay}>
          {/* Flip Camera Button */}
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => {
              setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }}
          >
            <MaterialCommunityIcons
              name="camera-flip"
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>

          {/* Main Control Button */}
          <View style={styles.mainControls}>
            {testPhase === 'ready' && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={startCountdown}
              >
                <MaterialCommunityIcons
                  name="play"
                  size={30}
                  color={Colors.white}
                />
              </TouchableOpacity>
            )}

            {testPhase === 'recording' && (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopRecording}
              >
                <MaterialCommunityIcons
                  name="stop"
                  size={30}
                  color={Colors.white}
                />
              </TouchableOpacity>
            )}
            
            {testPhase === 'processing' && (
              <View style={styles.processingButton}>
                <MaterialCommunityIcons
                  name="loading"
                  size={30}
                  color={Colors.white}
                />
              </View>
            )}
          </View>

          {/* Duration Info */}
          <View style={styles.durationInfo}>
            <Text style={styles.durationText}>
              Max: {getMaxDuration()}min
            </Text>
          </View>
        </View>

        {/* Instructions Overlay */}
        <View style={styles.instructionsOverlay}>
          <Text style={styles.instructionText}>
            {testPhase === 'ready' && 'Position yourself in frame and tap to start'}
            {testPhase === 'countdown' && 'Recording will start automatically'}
            {testPhase === 'recording' && 'Perform the test as instructed'}
            {testPhase === 'completed' && 'Test completed successfully!'}
            {testPhase === 'processing' && 'Analyzing your performance...'}
          </Text>
        </View>
      </Camera>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  camera: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  practiceBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  practiceText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  offlineBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  offlineText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  countdownText: {
    fontSize: 100,
    fontWeight: 'bold',
    color: Colors.white,
  },
  countdownLabel: {
    fontSize: 24,
    color: Colors.white,
    marginTop: 20,
  },
  recordingStatus: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    marginRight: 6,
  },
  recordingText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  processingOverlay: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  processingText: {
    color: Colors.white,
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
    paddingBottom: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainControls: {
    alignItems: 'center',
  },
  startButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  processingButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  durationInfo: {
    alignItems: 'center',
  },
  durationText: {
    color: Colors.white,
    fontSize: 12,
    textAlign: 'center',
  },
  instructionsOverlay: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  permissionButton: {
    paddingHorizontal: 30,
  },
});

export default VideoRecordingScreen;