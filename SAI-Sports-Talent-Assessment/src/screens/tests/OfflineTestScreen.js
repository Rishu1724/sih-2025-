import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import CustomButton from '../../components/CustomButton';
import CustomCard from '../../components/CustomCard';
import ProgressBar from '../../components/ProgressBar';
import { Colors, Gradients } from '../../constants/colors';
import OfflineAIService from '../../services/OfflineAIService';
import offlineStorage from '../../utils/offlineStorage';

const OfflineTestScreen = ({ navigation }) => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [slideAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    initializeOfflineSystem();
    startPulseAnimation();
    startSlideAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
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

  const initializeOfflineSystem = async () => {
    try {
      const initialized = await offlineStorage.initialize();
      if (initialized) {
        setIsInitialized(true);
        refreshStorageInfo();
      }
    } catch (error) {
      console.error('Failed to initialize offline system:', error);
      Alert.alert('Error', 'Failed to initialize offline system');
    }
  };

  const refreshStorageInfo = async () => {
    try {
      const info = await offlineStorage.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  };

  const runTestAnalysis = async () => {
    try {
      // Create a mock video file path for testing
      const mockVideoPath = `${offlineStorage.VIDEOS_DIR}test_video.mp4`;
      
      // Test supported types
      const supportedTypes = OfflineAIService.getSupportedTypes();
      
      Alert.alert(
        'Offline AI Analysis',
        `Supported assessment types: ${supportedTypes.join(', ')}\n\nTesting with mock data...`,
        [{ text: 'OK' }]
      );
      
      // This would normally process an actual video file
      // For demo purposes, we're just showing the capability
    } catch (error) {
      console.error('Test analysis failed:', error);
      Alert.alert('Error', 'Test analysis failed');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Offline Data',
      'Are you sure you want to delete all offline test data and videos?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineStorage.clearAllData();
              await initializeOfflineSystem();
              Alert.alert('Success', 'All offline data has been cleared');
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('Error', 'Failed to clear offline data');
            }
          },
        },
      ]
    );
  };

  const slideUp = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
            <MaterialCommunityIcons
              name="cloud-off-outline"
              size={60}
              color={Colors.primary}
            />
          </Animated.View>
          <Text style={styles.title}>Offline Mode</Text>
          <Text style={styles.subtitle}>
            Sports assessments without internet connection
          </Text>
        </View>

        <View style={styles.content}>
          {/* Status Card */}
          <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
            <CustomCard style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <MaterialCommunityIcons
                  name={isInitialized ? "check-circle" : "alert-circle"}
                  size={24}
                  color={isInitialized ? Colors.success : Colors.error}
                />
                <Text style={styles.statusTitle}>
                  {isInitialized ? "Ready for Offline Use" : "Initialization Required"}
                </Text>
              </View>
              <Text style={styles.statusDescription}>
                {isInitialized
                  ? "All offline systems are ready. You can perform assessments without an internet connection."
                  : "Offline storage system needs to be initialized."}
              </Text>
              
              {!isInitialized && (
                <CustomButton
                  title="Initialize Offline System"
                  onPress={initializeOfflineSystem}
                  gradient
                  style={styles.initButton}
                />
              )}
            </CustomCard>
          </Animated.View>

          {/* Storage Info */}
          {storageInfo && (
            <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
              <CustomCard style={styles.infoCard}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="database"
                    size={20}
                    color={Colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Storage Information</Text>
                </View>
                
                <View style={styles.storageMetrics}>
                  <View style={styles.metricCard}>
                    <MaterialCommunityIcons
                      name="video"
                      size={24}
                      color={Colors.primary}
                    />
                    <Text style={styles.metricValue}>{storageInfo.testCount}</Text>
                    <Text style={styles.metricLabel}>Tests Recorded</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <MaterialCommunityIcons
                      name="harddisk"
                      size={24}
                      color={Colors.primary}
                    />
                    <Text style={styles.metricValue}>
                      {Math.round(storageInfo.totalVideoSize / 1024 / 1024)}
                    </Text>
                    <Text style={styles.metricLabel}>MB Used</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Storage Path:</Text>
                  <Text style={styles.infoValueSmall} numberOfLines={1}>
                    {storageInfo.storagePath}
                  </Text>
                </View>
              </CustomCard>
            </Animated.View>
          )}

          {/* Features */}
          <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
            <CustomCard style={styles.featuresCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.sectionTitle}>Offline Capabilities</Text>
              </View>
              
              <View style={styles.featuresGrid}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <MaterialCommunityIcons
                      name="video"
                      size={24}
                      color={Colors.white}
                    />
                  </View>
                  <Text style={styles.featureText}>Video Recording</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <MaterialCommunityIcons
                      name="robot-outline"
                      size={24}
                      color={Colors.white}
                    />
                  </View>
                  <Text style={styles.featureText}>AI Analysis</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <MaterialCommunityIcons
                      name="database"
                      size={24}
                      color={Colors.white}
                    />
                  </View>
                  <Text style={styles.featureText}>Local Storage</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <MaterialCommunityIcons
                      name="chart-bar"
                      size={24}
                      color={Colors.white}
                    />
                  </View>
                  <Text style={styles.featureText}>Performance Tracking</Text>
                </View>
              </View>
            </CustomCard>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
            <View style={styles.actionButtons}>
              <CustomButton
                title="Test Offline Analysis"
                onPress={runTestAnalysis}
                gradient
                style={styles.actionButton}
                leftIcon="test-tube"
                disabled={!isInitialized}
              />
              <CustomButton
                title="Refresh Storage Info"
                onPress={refreshStorageInfo}
                variant="outline"
                style={styles.actionButton}
                leftIcon="refresh"
              />
              <CustomButton
                title="Clear All Offline Data"
                onPress={clearAllData}
                variant="outline"
                style={styles.actionButton}
                leftIcon="delete"
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
  header: {
    alignItems: 'center',
    padding: 30,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 15,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  statusCard: {
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 10,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  initButton: {
    marginTop: 10,
  },
  infoCard: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 10,
  },
  storageMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginVertical: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValueSmall: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    maxWidth: 150,
    textAlign: 'right',
  },
  featuresCard: {
    marginBottom: 30,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButtons: {
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 15,
  },
});

export default OfflineTestScreen;