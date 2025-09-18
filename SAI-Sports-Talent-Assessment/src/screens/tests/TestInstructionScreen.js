import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import CustomCard from '../../components/CustomCard';
import CustomButton from '../../components/CustomButton';
import ProgressBar from '../../components/ProgressBar';
import { Colors, Gradients } from '../../constants/colors';
import { TEST_CONFIG } from '../../constants/tests';
import { useTest } from '../../contexts/TestContext';

const TestInstructionScreen = ({ route, navigation }) => {
  const { testType } = route.params;
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    instructions: true,
    equipment: true,
    safety: true,
    tips: true
  });
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [slideAnimation] = useState(new Animated.Value(0));
  const { setCurrentTest } = useTest();

  const config = TEST_CONFIG[testType];

  useEffect(() => {
    if (config) {
      setCurrentTest({ testType, config });
    }
    
    // Start animations
    startPulseAnimation();
    startSlideAnimation();
  }, [testType, config, setCurrentTest]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startSlideAnimation = () => {
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleStartTest = async () => {
    try {
      // Dynamic import with fallback for web
      let Camera;
      try {
        const cameraModule = await import('expo-camera');
        Camera = cameraModule.Camera;
      } catch (importError) {
        console.warn('Camera import failed, using fallback:', importError);
        // For web or when camera is not available, proceed without camera check
        navigation.navigate('VideoRecording', { testType });
        return;
      }
      
      // Request camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to record your test performance.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Permission', onPress: handleStartTest },
          ]
        );
        return;
      }

      navigation.navigate('VideoRecording', { testType });
    } catch (error) {
      Alert.alert('Error', 'Failed to start test. Please try again.');
    }
  };

  const handlePracticeMode = () => {
    Alert.alert(
      'Practice Mode',
      'Practice mode will start a test session without recording. This helps you get familiar with the test requirements.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Practice', onPress: () => navigation.navigate('VideoRecording', { testType, practiceMode: true }) },
      ]
    );
  };

  const renderInstruction = (instruction, index) => (
    <View key={index} style={styles.instructionItem}>
      <Animated.View 
        style={[
          styles.instructionNumber,
          { transform: [{ scale: pulseAnimation }] }
        ]}
      >
        <Text style={styles.instructionNumberText}>{index + 1}</Text>
      </Animated.View>
      <Text style={styles.instructionText}>{instruction}</Text>
    </View>
  );

  const renderEquipmentItem = (equipment, index) => (
    <View key={index} style={styles.equipmentItem}>
      <MaterialCommunityIcons
        name="check-circle"
        size={16}
        color={Colors.success}
      />
      <Text style={styles.equipmentText}>{equipment}</Text>
    </View>
  );

  const renderSafetyTip = (tip, index) => (
    <View key={index} style={styles.tipItem}>
      <MaterialCommunityIcons
        name="shield-check"
        size={16}
        color={Colors.warning}
        style={styles.tipIcon}
      />
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  );

  const renderRecordingTip = (tip, index) => (
    <View key={index} style={styles.tipItem}>
      <MaterialCommunityIcons
        name="lightbulb-outline"
        size={16}
        color={Colors.accent}
        style={styles.tipIcon}
      />
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  );

  if (!config) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={60}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Test configuration not found</Text>
          <CustomButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const slideUp = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={Gradients.primary} style={styles.headerGradient}>
          <View style={styles.header}>
            <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
              <MaterialCommunityIcons
                name={config.icon}
                size={60}
                color={Colors.white}
              />
            </Animated.View>
            <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
              <Text style={styles.testTitle}>{config.name}</Text>
              <Text style={styles.testDescription}>{config.description}</Text>
              <View style={styles.durationContainer}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={Colors.white}
                />
                <Text style={styles.durationText}>
                  Estimated time: {Math.ceil(config.duration / 60)} minutes
                </Text>
              </View>
            </Animated.View>
            
            {/* Progress bar for test preparation */}
            <Animated.View 
              style={[
                styles.preparationProgress, 
                { transform: [{ translateY: slideUp }] }
              ]}
            >
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Test Preparation</Text>
                <Text style={styles.progressText}>Ready to start</Text>
              </View>
              <ProgressBar
                progress={85}
                total={100}
                color={Colors.success}
                height={6}
                showPercentage={false}
              />
            </Animated.View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Instructions */}
          <CustomCard style={styles.instructionsCard}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => toggleSection('instructions')}
            >
              <View style={styles.sectionHeaderContent}>
                <MaterialCommunityIcons
                  name="format-list-numbered"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.sectionTitle}>Test Instructions</Text>
              </View>
              <MaterialCommunityIcons
                name={expandedSections.instructions ? "chevron-up" : "chevron-down"}
                size={24}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            
            {expandedSections.instructions && (
              <>
                <Text style={styles.sectionSubtitle}>
                  Follow these steps carefully for accurate assessment
                </Text>
                <View style={styles.instructionsList}>
                  {config.instructions.map(renderInstruction)}
                </View>
              </>
            )}
          </CustomCard>

          {/* Equipment Needed */}
          <CustomCard style={styles.equipmentCard}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => toggleSection('equipment')}
            >
              <View style={styles.sectionHeaderContent}>
                <MaterialCommunityIcons
                  name="toolbox"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.sectionTitle}>Equipment Needed</Text>
              </View>
              <MaterialCommunityIcons
                name={expandedSections.equipment ? "chevron-up" : "chevron-down"}
                size={24}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            
            {expandedSections.equipment && (
              <View style={styles.equipmentList}>
                {config.equipment.map(renderEquipmentItem)}
              </View>
            )}
          </CustomCard>

          {/* Safety Tips */}
          <CustomCard style={styles.safetyCard}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => toggleSection('safety')}
            >
              <View style={styles.sectionHeaderContent}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={20}
                  color={Colors.warning}
                />
                <Text style={styles.sectionTitle}>Safety First</Text>
              </View>
              <MaterialCommunityIcons
                name={expandedSections.safety ? "chevron-up" : "chevron-down"}
                size={24}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            
            {expandedSections.safety && (
              <View style={styles.tipsList}>
                {[
                  'Ensure you have adequate space to perform the test',
                  'Warm up properly before starting',
                  'Stop immediately if you feel any pain or discomfort',
                  'Have water available and stay hydrated',
                  'Ensure proper lighting for video recording'
                ].map(renderSafetyTip)}
              </View>
            )}
          </CustomCard>

          {/* Recording Tips */}
          <CustomCard style={styles.tipsCard}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => toggleSection('tips')}
            >
              <View style={styles.sectionHeaderContent}>
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={20}
                  color={Colors.accent}
                />
                <Text style={styles.sectionTitle}>Recording Tips</Text>
              </View>
              <MaterialCommunityIcons
                name={expandedSections.tips ? "chevron-up" : "chevron-down"}
                size={24}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            
            {expandedSections.tips && (
              <View style={styles.tipsList}>
                {[
                  'Position camera to capture full body movement',
                  'Ensure stable phone placement or use a tripod',
                  'Record in landscape mode for better visibility',
                  'Minimize background noise and distractions',
                  'Wear appropriate athletic clothing'
                ].map(renderRecordingTip)}
              </View>
            )}
          </CustomCard>

          {/* Action Buttons */}
          <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
            <View style={styles.actionButtons}>
              <CustomButton
                title="Practice Mode"
                onPress={handlePracticeMode}
                variant="outline"
                style={styles.practiceButton}
                leftIcon="school"
              />
              <CustomButton
                title="Start Official Test"
                onPress={handleStartTest}
                gradient
                style={styles.startButton}
                leftIcon="play-circle"
              />
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    padding: 30,
  },
  testTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  testDescription: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 15,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  durationText: {
    color: Colors.white,
    marginLeft: 8,
    fontWeight: '500',
  },
  preparationProgress: {
    width: '100%',
    marginTop: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  progressText: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionsCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 15,
    marginTop: 5,
  },
  instructionsList: {
    marginTop: 10,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  equipmentCard: {
    marginBottom: 20,
  },
  equipmentList: {
    marginTop: 10,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  equipmentText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 10,
  },
  safetyCard: {
    marginBottom: 20,
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  tipsCard: {
    marginBottom: 30,
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  tipsList: {
    marginTop: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    marginTop: 3,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginLeft: 10,
  },
  actionButtons: {
    marginBottom: 20,
  },
  practiceButton: {
    marginBottom: 15,
  },
  startButton: {
    marginBottom: 10,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  errorButton: {
    paddingHorizontal: 30,
  },
});

export default TestInstructionScreen;