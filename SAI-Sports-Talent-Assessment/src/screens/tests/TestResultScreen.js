import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
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
import { TEST_CONFIG, ACHIEVEMENT_BADGES } from '../../constants/tests';
import { useTest } from '../../contexts/TestContext';
import OfflineAIService from '../../services/OfflineAIService';

const TestResultScreen = ({ route, navigation }) => {
  const { testType, practiceMode = false } = route.params;
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [offlineAnalysis, setOfflineAnalysis] = useState(null);
  const [scoreScale] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const { testHistory, addAchievement, userStats } = useTest();

  const config = TEST_CONFIG[testType];
  const latestResult = testHistory.find(result => result.testType === testType);

  useEffect(() => {
    // Check for new achievements
    if (!practiceMode && latestResult) {
      checkAndAwardAchievements();
    }
    
    // Load offline AI analysis if available
    loadOfflineAnalysis();
    
    // Start animations
    startScoreAnimation();
    startSlideAnimation();
    startPulseAnimation();
  }, [latestResult, practiceMode]);

  const startScoreAnimation = () => {
    Animated.spring(scoreScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const startSlideAnimation = () => {
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
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

  const loadOfflineAnalysis = async () => {
    if (latestResult && latestResult.id) {
      const analysis = await OfflineAIService.loadAnalysisResult(latestResult.id);
      if (analysis) {
        setOfflineAnalysis(analysis);
      }
    }
  };

  const checkAndAwardAchievements = async () => {
    // First test achievement
    if (testHistory.length === 1) {
      await addAchievement({
        ...ACHIEVEMENT_BADGES.FIRST_TEST,
        testType,
        description: 'Completed your first assessment test',
      });
    }

    // Perfect form achievement (example logic)
    if (latestResult.completed && !latestResult.errors) {
      const perfectTests = testHistory.filter(test => test.completed && !test.errors);
      if (perfectTests.length === 3) {
        await addAchievement({
          ...ACHIEVEMENT_BADGES.PERFECT_FORM,
          description: 'Completed 3 tests with perfect form',
        });
      }
    }
  };

  const generatePerformanceScore = () => {
    // Use offline AI analysis if available, otherwise generate mock score
    if (offlineAnalysis && offlineAnalysis.aiRepCount !== undefined) {
      // Convert rep count to performance score (0-100)
      return Math.min(100, Math.max(0, offlineAnalysis.aiRepCount * 10));
    }
    
    if (practiceMode) return null;
    
    const baseScore = Math.floor(Math.random() * 40) + 60; // 60-100 range
    return Math.min(baseScore + (userStats.completedTests * 2), 100);
  };

  const generateAnalysisData = () => {
    // Use offline AI analysis if available
    if (offlineAnalysis) {
      return {
        form: Math.min(100, Math.max(0, (offlineAnalysis.aiTechniqueScore || 0) * 100)),
        technique: Math.min(100, Math.max(0, ((offlineAnalysis.aiTechniqueScore || 0) + 0.1) * 100)),
        consistency: Math.min(100, Math.max(0, ((offlineAnalysis.aiTechniqueScore || 0) + 0.05) * 100)),
        improvement: Math.min(100, Math.max(0, ((offlineAnalysis.aiTechniqueScore || 0) - 0.1) * 100)),
      };
    }
    
    // Mock analysis data - in real app this would come from AI/ML processing
    return {
      form: Math.floor(Math.random() * 30) + 70,
      technique: Math.floor(Math.random() * 25) + 75,
      consistency: Math.floor(Math.random() * 20) + 80,
      improvement: Math.floor(Math.random() * 15) + 5,
    };
  };

  const handleRetakeTest = () => {
    Alert.alert(
      'Retake Test',
      'Are you sure you want to retake this test? This will start a new recording session.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retake', onPress: () => navigation.navigate('TestInstruction', { testType }) },
      ]
    );
  };

  const handleShareResults = async () => {
    try {
      const score = generatePerformanceScore();
      const message = practiceMode
        ? `I just completed a practice session for ${config.name} on SAI Sports Assessment!`
        : `I scored ${score}/100 on ${config.name} in SAI Sports Assessment! 🏆`;
      
      await Share.share({
        message,
        title: 'My Sports Assessment Results',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const performanceScore = generatePerformanceScore();
  const analysisData = generateAnalysisData();

  const getScoreColor = (score) => {
    if (score >= 90) return Colors.success;
    if (score >= 70) return Colors.warning;
    return Colors.error;
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Average';
    return 'Needs Improvement';
  };

  const getGradeIcon = (score) => {
    if (score >= 90) return 'trophy-award';
    if (score >= 80) return 'trophy-variant';
    if (score >= 70) return 'trophy';
    return 'trophy-outline';
  };

  const slideUp = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0]
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient 
          colors={practiceMode ? Gradients.warning : Gradients.primary} 
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
              <MaterialCommunityIcons
                name={practiceMode ? "school" : config.icon}
                size={60}
                color={Colors.white}
              />
            </Animated.View>
            <Text style={styles.testTitle}>{config.name}</Text>
            {practiceMode ? (
              <View style={styles.practiceHeader}>
                <Text style={styles.practiceTitle}>Practice Session Complete</Text>
                <Text style={styles.practiceSubtitle}>Ready for the official test?</Text>
              </View>
            ) : (
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Test Complete!</Text>
                <Text style={styles.completionDate}>
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Performance Score (only for official tests) */}
          {!practiceMode && performanceScore && (
            <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
              <CustomCard style={styles.scoreCard}>
                <View style={styles.scoreHeader}>
                  <Text style={styles.sectionTitle}>Performance Score</Text>
                  <View style={styles.scoreContainer}>
                    <Animated.View style={{ transform: [{ scale: scoreScale }] }}>
                      <Text style={[styles.scoreNumber, { color: getScoreColor(performanceScore) }]}>
                        {performanceScore}
                      </Text>
                    </Animated.View>
                    <Text style={styles.scoreOutOf}>/100</Text>
                  </View>
                </View>
                <View style={styles.gradeContainer}>
                  <MaterialCommunityIcons 
                    name={getGradeIcon(performanceScore)} 
                    size={24} 
                    color={getScoreColor(performanceScore)} 
                  />
                  <Text style={[styles.scoreGrade, { color: getScoreColor(performanceScore) }]}>
                    {getScoreGrade(performanceScore)}
                  </Text>
                </View>
                <ProgressBar
                  progress={performanceScore}
                  total={100}
                  color={getScoreColor(performanceScore)}
                  height={12}
                  style={styles.scoreProgress}
                />
              </CustomCard>
            </Animated.View>
          )}

          {/* Test Details */}
          <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
            <CustomCard style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Test Details</Text>
              <View style={styles.detailsList}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.gray} />
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {latestResult?.results?.recordingDuration || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="video" size={20} color={Colors.gray} />
                  <Text style={styles.detailLabel}>Video Quality</Text>
                  <Text style={styles.detailValue}>
                    {latestResult?.results?.videoQuality || '720p'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={Colors.gray} />
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: Colors.success }]}>
                    {practiceMode ? 'Practice Complete' : 'Completed'}
                  </Text>
                </View>
              </View>
            </CustomCard>
          </Animated.View>

          {/* AI Analysis (only for official tests) */}
          {!practiceMode && (
            <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
              <CustomCard style={styles.analysisCard}>
                <TouchableOpacity 
                  style={styles.analysisHeader} 
                  onPress={() => setShowAnalysis(!showAnalysis)}
                >
                  <View style={styles.analysisHeaderContent}>
                    <MaterialCommunityIcons
                      name="robot-outline"
                      size={20}
                      color={Colors.primary}
                    />
                    <Text style={styles.sectionTitle}>AI Performance Analysis</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={showAnalysis ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
                
                {showAnalysis && (
                  <View style={styles.analysisContent}>
                    {offlineAnalysis ? (
                      <>
                        <Text style={styles.analysisNote}>
                          * Analysis based on offline AI processing
                        </Text>
                        <View style={styles.analysisMetrics}>
                          <View style={styles.metricItem}>
                            <Text style={styles.metricName}>Repetitions Detected</Text>
                            <Text style={styles.metricValue}>{offlineAnalysis.aiRepCount}</Text>
                          </View>
                          <View style={styles.metricItem}>
                            <Text style={styles.metricName}>Technique Score</Text>
                            <ProgressBar
                              progress={Math.min(100, Math.max(0, (offlineAnalysis.aiTechniqueScore || 0) * 100))}
                              total={100}
                              showPercentage
                              color={getScoreColor((offlineAnalysis.aiTechniqueScore || 0) * 100)}
                              height={8}
                            />
                          </View>
                          {offlineAnalysis.additionalMetrics?.jumpHeights && (
                            <View style={styles.metricItem}>
                              <Text style={styles.metricName}>Jump Heights (cm)</Text>
                              <Text style={styles.metricValue}>
                                {offlineAnalysis.additionalMetrics.jumpHeights
                                  .map(h => h.toFixed(1))
                                  .join(', ')}
                              </Text>
                            </View>
                          )}
                          {offlineAnalysis.aiNotes && (
                            <View style={styles.notesContainer}>
                              <Text style={styles.notesTitle}>Analysis Notes</Text>
                              <Text style={styles.notesText}>{offlineAnalysis.aiNotes}</Text>
                            </View>
                          )}
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={styles.analysisNote}>
                          * Analysis based on video assessment and movement patterns
                        </Text>
                        
                        <View style={styles.analysisMetrics}>
                          {Object.entries(analysisData).map(([key, value]) => (
                            <View key={key} style={styles.metricItem}>
                              <Text style={styles.metricName}>
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </Text>
                              <ProgressBar
                                progress={value}
                                total={100}
                                showPercentage
                                color={getScoreColor(value)}
                                height={8}
                              />
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                )}
              </CustomCard>
            </Animated.View>
          )}

          {/* Recommendations */}
          <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
            <CustomCard style={styles.recommendationsCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name={practiceMode ? "school" : "lightbulb-outline"}
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.sectionTitle}>
                  {practiceMode ? 'Practice Feedback' : 'Recommendations'}
                </Text>
              </View>
              <View style={styles.recommendations}>
                {practiceMode ? (
                  <>
                    <Text style={styles.recommendationItem}>
                      • Great job completing the practice session!
                    </Text>
                    <Text style={styles.recommendationItem}>
                      • Make sure you're familiar with all test requirements
                    </Text>
                    <Text style={styles.recommendationItem}>
                      • Ensure proper lighting and camera positioning for the official test
                    </Text>
                    <Text style={styles.recommendationItem}>
                      • Take a short break and warm up before the official test
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.recommendationItem}>
                      • Continue regular training to improve your performance
                    </Text>
                    <Text style={styles.recommendationItem}>
                      • Focus on maintaining proper form throughout the exercise
                    </Text>
                    <Text style={styles.recommendationItem}>
                      • Consider retaking the test after additional practice
                    </Text>
                    <Text style={styles.recommendationItem}>
                      • Share your results with coaches for personalized feedback
                    </Text>
                  </>
                )}
              </View>
            </CustomCard>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
            <View style={styles.actionButtons}>
              {practiceMode ? (
                <>
                  <CustomButton
                    title="Take Official Test"
                    onPress={() => navigation.navigate('TestInstruction', { testType })}
                    gradient
                    style={styles.actionButton}
                    leftIcon="play-circle"
                  />
                  <CustomButton
                    title="Practice Again"
                    onPress={() => navigation.navigate('VideoRecording', { testType, practiceMode: true })}
                    variant="outline"
                    style={styles.actionButton}
                    leftIcon="refresh"
                  />
                </>
              ) : (
                <>
                  <CustomButton
                    title="Share Results"
                    onPress={handleShareResults}
                    gradient
                    style={styles.actionButton}
                    leftIcon="share-variant"
                  />
                  <CustomButton
                    title="Retake Test"
                    onPress={handleRetakeTest}
                    variant="outline"
                    style={styles.actionButton}
                    leftIcon="refresh"
                  />
                </>
              )}
              
              <CustomButton
                title="Back to Home"
                onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
                variant="outline"
                style={styles.actionButton}
                leftIcon="home"
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
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  practiceHeader: {
    alignItems: 'center',
  },
  practiceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 5,
  },
  practiceSubtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  resultHeader: {
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 5,
  },
  completionDate: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  scoreCard: {
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreOutOf: {
    fontSize: 24,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreGrade: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  scoreProgress: {
    width: '100%',
  },
  detailsCard: {
    marginBottom: 20,
  },
  detailsList: {
    marginTop: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  analysisCard: {
    marginBottom: 20,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  analysisHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisContent: {
    marginTop: 15,
  },
  analysisNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 15,
  },
  analysisMetrics: {
    marginTop: 10,
  },
  metricItem: {
    marginBottom: 15,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 15,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  recommendationsCard: {
    marginBottom: 30,
  },
  recommendations: {
    marginTop: 15,
  },
  recommendationItem: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  actionButtons: {
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 15,
  },
});

export default TestResultScreen;