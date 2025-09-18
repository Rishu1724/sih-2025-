import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import CustomCard from '../../components/CustomCard';
import { Colors } from '../../constants/colors';
import { TEST_CONFIG } from '../../constants/tests';
import { useTest } from '../../contexts/TestContext';
import { API_CONFIG } from '../../config/api';
import { getAthlete, getAssessments } from '../../services/FirebaseService';
import offlineStorage from '../../utils/offlineStorage';

const { width } = Dimensions.get('window');

const HistoryScreen = () => {
  const { testHistory } = useTest();
  const [assessments, setAssessments] = useState([]);
  const [athletes, setAthletes] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));

  useFocusEffect(
    useCallback(() => {
      fetchAssessments();
    }, [])
  );

  const fetchAthleteDetails = async (athleteId) => {
    if (athletes[athleteId]) return athletes[athleteId];
    
    try {
      const athleteData = await getAthlete(athleteId);
      if (athleteData) {
        setAthletes(prev => ({ ...prev, [athleteId]: athleteData }));
        return athleteData;
      }
    } catch (error) {
      console.error('Error fetching athlete:', error);
    }
    return null;
  };

  const fetchAssessments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch from API first
      let apiAssessments = [];
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENTS}`, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const result = await response.json();
        
        if (result.success) {
          apiAssessments = result.data || [];
          console.log('Fetched assessments from API:', apiAssessments.length);
        }
      } catch (apiError) {
        console.warn('Failed to fetch assessments from API:', apiError);
      }

      // Fetch from Firebase as fallback
      let firebaseAssessments = [];
      try {
        firebaseAssessments = await getAssessments();
        console.log('Fetched assessments from Firebase:', firebaseAssessments.length);
      } catch (firebaseError) {
        console.warn('Failed to fetch assessments from Firebase:', firebaseError);
      }

      // Fetch from local storage (offline assessments)
      let localAssessments = [];
      try {
        await offlineStorage.initialize();
        localAssessments = await offlineStorage.getTests();
        console.log('Fetched assessments from local storage:', localAssessments.length);
      } catch (storageError) {
        console.warn('Failed to fetch assessments from local storage:', storageError);
      }

      // Combine all assessments, with API taking precedence, then Firebase, then local
      const allAssessments = [
        ...apiAssessments,
        ...firebaseAssessments.filter(fba => 
          !apiAssessments.some(aa => aa.id === fba.id)
        ),
        ...localAssessments.filter(la => 
          !apiAssessments.some(aa => aa.id === la.id) &&
          !firebaseAssessments.some(fba => fba.id === la.id)
        )
      ];

      // Remove duplicates and sort by date (newest first)
      const uniqueAssessments = Array.from(
        new Map(allAssessments.map(item => [item.id || item.assessmentId || item._id, item])).values()
      ).sort((a, b) => {
        // Handle different date formats
        const getDate = (item) => {
          if (item.submissionDate) return new Date(item.submissionDate);
          if (item.createdAt) {
            // Handle Firebase Timestamp
            if (item.createdAt.toDate) return item.createdAt.toDate();
            return new Date(item.createdAt);
          }
          return new Date(); // fallback
        };
        
        const dateA = getDate(a);
        const dateB = getDate(b);
        return dateB - dateA;
      });

      console.log('Total unique assessments:', uniqueAssessments.length);

      // Fetch athlete details for each assessment
      for (const assessment of uniqueAssessments) {
        if (assessment.athleteId && !athletes[assessment.athleteId]) {
          await fetchAthleteDetails(assessment.athleteId);
        }
      }
      
      setAssessments(uniqueAssessments);
    } catch (error) {
      console.error('Fetch assessments error:', error);
      Alert.alert('Error', 'Failed to load assessment history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchAssessments(true);
  };

  const getAthleteInfo = (athleteId) => {
    return athletes[athleteId] || null;
  };

  const renderAssessmentItem = ({ item }) => {
    const athlete = getAthleteInfo(item.athleteId);
    
    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'processing':
          return Colors.warning;
        case 'pending':
          return Colors.info;
        case 'evaluated':
        case 'completed':
          return Colors.success;
        case 'failed':
          return Colors.error;
        default:
          return Colors.gray;
      }
    };

    const getStatusIcon = (status) => {
      switch (status?.toLowerCase()) {
        case 'processing':
          return 'loading';
        case 'pending':
          return 'clock-outline';
        case 'evaluated':
        case 'completed':
          return 'check-circle';
        case 'failed':
          return 'alert-circle';
        default:
          return 'help-circle';
      }
    };

    const getAssessmentTypeName = (type) => {
      const config = TEST_CONFIG[type];
      return config ? config.name : type?.replace('-', ' ')?.toUpperCase() || 'Assessment';
    };

    // 3D Card Animation
    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 8,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    };

    return (
      <Animated.View style={[styles.animatedContainer, { transform: [{ scale: scaleValue }] }]}>
        <TouchableOpacity 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <CustomCard style={styles.historyCard}>
            {/* Athlete Information */}
            {athlete ? (
              <View style={styles.athleteInfoContainer}>
                <View style={styles.athleteHeader}>
                  <MaterialCommunityIcons
                    name="account-circle"
                    size={40}
                    color={Colors.primary}
                  />
                  <View style={styles.athleteDetails}>
                    <Text style={styles.athleteName}>{athlete.name}</Text>
                    <Text style={styles.athleteSport}>{athlete.sport} • Age: {athlete.age}</Text>
                  </View>
                </View>
                <View style={styles.athleteContact}>
                  <View style={styles.contactItem}>
                    <MaterialCommunityIcons name="email" size={14} color={Colors.gray} />
                    <Text style={styles.contactText}>{athlete.email}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <MaterialCommunityIcons name="map-marker" size={14} color={Colors.gray} />
                    <Text style={styles.contactText}>{athlete.district}, {athlete.state}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.athleteInfoContainer}>
                <View style={styles.athleteHeader}>
                  <MaterialCommunityIcons
                    name="account-circle"
                    size={40}
                    color={Colors.primary}
                  />
                  <View style={styles.athleteDetails}>
                    <Text style={styles.athleteName}>Athlete ID: {item.athleteId}</Text>
                    <Text style={styles.athleteSport}>Loading athlete information...</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Assessment Details */}
            <View style={styles.historyHeader}>
              <View style={styles.testInfo}>
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={24}
                  color={Colors.primary}
                />
                <View style={styles.testDetails}>
                  <Text style={styles.testName}>
                    {getAssessmentTypeName(item.assessmentType || item.type)}
                  </Text>
                  <Text style={styles.testDate}>
                    {new Date(item.submissionDate || item.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.scoreContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <MaterialCommunityIcons 
                    name={getStatusIcon(item.status)} 
                    size={14} 
                    color={Colors.white} 
                  />
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            </View>
            
            {item.aiAnalysis && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>AI Analysis Results:</Text>
                <View style={styles.resultsList}>
                  {/* Show assessment-specific details */}
                  {item.assessmentType === 'push-ups' && (
                    <>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Push-ups Count:</Text>
                        <Text style={styles.resultValue}>{item.aiAnalysis.aiRepCount || 0} push-ups</Text>
                      </View>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Technique Score:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.aiTechniqueScore ? (item.aiAnalysis.aiTechniqueScore * 100).toFixed(1) : '0.0'}%
                        </Text>
                      </View>
                      {item.aiAnalysis.processingTime > 0 && (
                        <View style={styles.resultItem}>
                          <Text style={styles.resultKey}>Processing Time:</Text>
                          <Text style={styles.resultValue}>{item.aiAnalysis.processingTime.toFixed(2)}s</Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  {item.assessmentType === 'sit-ups' && (
                    <>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Sit-ups Count:</Text>
                        <Text style={styles.resultValue}>{item.aiAnalysis.aiRepCount || 0} sit-ups</Text>
                      </View>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Technique Score:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.aiTechniqueScore ? (item.aiAnalysis.aiTechniqueScore * 100).toFixed(1) : '0.0'}%
                        </Text>
                      </View>
                      {item.aiAnalysis.processingTime > 0 && (
                        <View style={styles.resultItem}>
                          <Text style={styles.resultKey}>Processing Time:</Text>
                          <Text style={styles.resultValue}>{item.aiAnalysis.processingTime.toFixed(2)}s</Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  {item.assessmentType === 'vertical-jump' && (
                    <>
                      {item.aiAnalysis.jumpHeights && item.aiAnalysis.jumpHeights.length > 0 && (
                        <View style={styles.resultItem}>
                          <Text style={styles.resultKey}>Jump Height:</Text>
                          <Text style={styles.resultValue}>
                            {(item.aiAnalysis.jumpHeights[0] * 0.0328084).toFixed(2)} feet ({item.aiAnalysis.jumpHeights[0].toFixed(1)} cm)
                          </Text>
                        </View>
                      )}
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Technique Score:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.aiTechniqueScore ? (item.aiAnalysis.aiTechniqueScore * 100).toFixed(1) : '0.0'}%
                        </Text>
                      </View>
                      {item.aiAnalysis.processingTime > 0 && (
                        <View style={styles.resultItem}>
                          <Text style={styles.resultKey}>Processing Time:</Text>
                          <Text style={styles.resultValue}>{item.aiAnalysis.processingTime.toFixed(2)}s</Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  {item.assessmentType === 'shuttle-run' && (
                    <>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Completion Time:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.processingTime ? (item.aiAnalysis.processingTime).toFixed(2) : 'N/A'} seconds
                        </Text>
                      </View>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Technique Score:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.aiTechniqueScore ? (item.aiAnalysis.aiTechniqueScore * 100).toFixed(1) : '0.0'}%
                        </Text>
                      </View>
                    </>
                  )}
                  
                  {item.assessmentType === 'height_weight' && (
                    <>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Height:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.height ? `${item.aiAnalysis.height.toFixed(1)} cm` : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Weight:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.weight ? `${item.aiAnalysis.weight.toFixed(1)} kg` : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>BMI:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.bmi ? item.aiAnalysis.bmi.toFixed(1) : 'N/A'}
                        </Text>
                      </View>
                    </>
                  )}
                  
                  {item.assessmentType === 'endurance_run' && (
                    <>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Distance Covered:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.distance ? `${item.aiAnalysis.distance.toFixed(2)} meters` : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Time:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.processingTime ? `${item.aiAnalysis.processingTime.toFixed(2)} seconds` : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Speed:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.speed ? `${item.aiAnalysis.speed.toFixed(2)} m/s` : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Technique Score:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.aiTechniqueScore ? (item.aiAnalysis.aiTechniqueScore * 100).toFixed(1) : '0.0'}%
                        </Text>
                      </View>
                    </>
                  )}
                  
                  {/* General AI analysis results for other assessment types */}
                  {!['push-ups', 'sit-ups', 'vertical-jump', 'shuttle-run', 'height_weight', 'endurance_run'].includes(item.assessmentType) && (
                    <>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Repetitions:</Text>
                        <Text style={styles.resultValue}>{item.aiAnalysis.aiRepCount || item.aiAnalysis.repetitions || 0}</Text>
                      </View>
                      <View style={styles.resultItem}>
                        <Text style={styles.resultKey}>Technique Score:</Text>
                        <Text style={styles.resultValue}>
                          {item.aiAnalysis.aiTechniqueScore || item.aiAnalysis.techniqueScore ? 
                            ((item.aiAnalysis.aiTechniqueScore || item.aiAnalysis.techniqueScore) * 100).toFixed(1) : 0}%
                        </Text>
                      </View>
                      {(item.aiAnalysis.processingTime || item.aiAnalysis.processingTimeMs) > 0 && (
                        <View style={styles.resultItem}>
                          <Text style={styles.resultKey}>Processing Time:</Text>
                          <Text style={styles.resultValue}>
                            {(item.aiAnalysis.processingTime || item.aiAnalysis.processingTimeMs / 1000).toFixed(1)}s
                          </Text>
                        </View>
                      )}
                      {item.aiAnalysis.jumpHeights && item.aiAnalysis.jumpHeights.length > 0 && item.assessmentType !== 'vertical-jump' && (
                        <View style={styles.resultItem}>
                          <Text style={styles.resultKey}>Jump Heights (cm):</Text>
                          <Text style={styles.resultValue}>
                            {item.aiAnalysis.jumpHeights.map(h => h.toFixed(1)).join(', ')}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            )}
            
            {item.aiAnalysis?.aiNotes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesTitle}>AI Notes:</Text>
                <Text style={styles.notesText}>{item.aiAnalysis.aiNotes}</Text>
              </View>
            )}
            
            {/* Manual Evaluation Results */}
            {item.evaluation && item.evaluation.score !== null && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Manual Evaluation:</Text>
                <View style={styles.resultsList}>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultKey}>Final Score:</Text>
                    <Text style={styles.resultValue}>{item.evaluation.score}/100</Text>
                  </View>
                  {item.evaluation.evaluatorNotes && (
                    <View style={styles.resultItem}>
                      <Text style={styles.resultKey}>Evaluator Notes:</Text>
                      <Text style={styles.resultValue}>{item.evaluation.evaluatorNotes}</Text>
                    </View>
                  )}
                  <View style={styles.resultItem}>
                    <Text style={styles.resultKey}>Evaluated By:</Text>
                    <Text style={styles.resultValue}>{item.evaluation.evaluatedBy || 'SAI Official'}</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultKey}>Evaluation Date:</Text>
                    <Text style={styles.resultValue}>
                      {new Date(item.evaluation.evaluationDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Blockchain Information */}
            {item.blockchainHash && (
              <View style={styles.blockchainContainer}>
                <View style={styles.blockchainHeader}>
                  <MaterialCommunityIcons name="blockchain" size={18} color={Colors.primary} />
                  <Text style={styles.blockchainTitle}>Blockchain Verification</Text>
                </View>
                <View style={styles.blockchainInfo}>
                  <View style={styles.blockchainRow}>
                    <Text style={styles.blockchainLabel}>Hash:</Text>
                    <Text style={styles.blockchainValue} numberOfLines={1} ellipsizeMode="middle">
                      {item.blockchainHash.substring(0, 6)}...{item.blockchainHash.substring(item.blockchainHash.length - 4)}
                    </Text>
                  </View>
                  <View style={styles.blockchainRow}>
                    <Text style={styles.blockchainLabel}>Transaction:</Text>
                    <Text style={styles.blockchainValue} numberOfLines={1} ellipsizeMode="middle">
                      {item.transactionId?.substring(0, 6)}...{item.transactionId?.substring(item.transactionId?.length - 4)}
                    </Text>
                  </View>
                  <View style={styles.blockchainStatus}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
                    <Text style={styles.blockchainStatusText}>Verified on Blockchain</Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Additional Assessment Details */}
            <View style={styles.additionalDetails}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="dumbbell" size={16} color={Colors.gray} />
                <Text style={styles.detailLabel}>Assessment Type:</Text>
                <Text style={styles.detailValue}>{getAssessmentTypeName(item.assessmentType || item.type)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={16} color={Colors.gray} />
                <Text style={styles.detailLabel}>Submission Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(item.submissionDate || item.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="video" size={16} color={Colors.gray} />
                <Text style={styles.detailLabel}>Video Quality:</Text>
                <Text style={styles.detailValue}>{item.videoQuality || item.videoMetadata?.quality || 'N/A'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.gray} />
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>
                  {item.recordingDuration || item.videoMetadata?.duration ? 
                    `${(item.recordingDuration || item.videoMetadata.duration).toFixed(1)}s` : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="file-video" size={16} color={Colors.gray} />
                <Text style={styles.detailLabel}>File Size:</Text>
                <Text style={styles.detailValue}>
                  {item.videoMetadata?.size ? 
                    `${(item.videoMetadata.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
                </Text>
              </View>
              
              {item.deviceInfo && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="cellphone" size={16} color={Colors.gray} />
                  <Text style={styles.detailLabel}>Device:</Text>
                  <Text style={styles.detailValue}>{item.deviceInfo}</Text>
                </View>
              )}
              
              {item.metadata && (
                <>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="information" size={16} color={Colors.gray} />
                    <Text style={styles.detailLabel}>Platform:</Text>
                    <Text style={styles.detailValue}>{item.metadata.deviceInfo || 'N/A'}</Text>
                  </View>
                  {item.metadata.appVersion && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="application" size={16} color={Colors.gray} />
                      <Text style={styles.detailLabel}>App Version:</Text>
                      <Text style={styles.detailValue}>{item.metadata.appVersion}</Text>
                    </View>
                  )}
                </>
              )}
              
              {item.sportCategory && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="trophy" size={16} color={Colors.gray} />
                  <Text style={styles.detailLabel}>Sport Category:</Text>
                  <Text style={styles.detailValue}>{item.sportCategory}</Text>
                </View>
              )}
            </View>
          </CustomCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="history"
        size={80}
        color={Colors.gray}
      />
      <Text style={styles.emptyTitle}>No Test History Yet</Text>
      <Text style={styles.emptyMessage}>
        Complete your first assessment test to see your history here
      </Text>
    </View>
  );

  const renderStatsHeader = () => {
    if (assessments.length === 0) return null;

    const completedAssessments = assessments.filter(assessment => 
      assessment.status?.toLowerCase() === 'evaluated' || assessment.status?.toLowerCase() === 'completed'
    ).length;
    
    const pendingAssessments = assessments.filter(assessment => 
      assessment.status?.toLowerCase() === 'pending' || assessment.status?.toLowerCase() === 'processing'
    ).length;
    
    const failedAssessments = assessments.filter(assessment => 
      assessment.status?.toLowerCase() === 'failed'
    ).length;
    
    const averageScore = assessments
      .filter(assessment => assessment.aiAnalysis?.aiTechniqueScore || assessment.evaluation?.score)
      .reduce((sum, assessment, _, arr) => {
        const score = assessment.aiAnalysis?.aiTechniqueScore || (assessment.evaluation?.score / 100) || 0;
        return sum + (score * 100) / arr.length;
      }, 0);
    
    // Get assessment type distribution
    const assessmentTypeCounts = assessments.reduce((counts, assessment) => {
      const type = assessment.assessmentType || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
    
    // Get sport category distribution
    const sportCategoryCounts = assessments.reduce((counts, assessment) => {
      const category = assessment.sportCategory || 'unknown';
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});

    return (
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Assessment Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{assessments.length}</Text>
            <Text style={styles.statLabel}>Total Assessments</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedAssessments}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          {averageScore > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{Math.round(averageScore)}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
            </>
          )}
        </View>
        
        {/* Additional Stats */}
        <View style={styles.additionalStatsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statItemSmall}>
              <Text style={styles.statNumberSmall}>{pendingAssessments}</Text>
              <Text style={styles.statLabelSmall}>Pending</Text>
            </View>
            <View style={styles.statItemSmall}>
              <Text style={styles.statNumberSmall}>{failedAssessments}</Text>
              <Text style={styles.statLabelSmall}>Failed</Text>
            </View>
          </View>
          
          {/* Assessment Type Distribution */}
          <View style={styles.distributionContainer}>
            <Text style={styles.distributionTitle}>Assessment Types</Text>
            <View style={styles.distributionList}>
              {Object.entries(assessmentTypeCounts).map(([type, count]) => (
                <View key={type} style={styles.distributionItem}>
                  <Text style={styles.distributionLabel}>
                    {TEST_CONFIG[type]?.name || type.replace('-', ' ')}
                  </Text>
                  <Text style={styles.distributionValue}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Sport Category Distribution */}
          <View style={styles.distributionContainer}>
            <Text style={styles.distributionTitle}>Sport Categories</Text>
            <View style={styles.distributionList}>
              {Object.entries(sportCategoryCounts)
                .filter(([category]) => category !== 'unknown')
                .map(([category, count]) => (
                  <View key={category} style={styles.distributionItem}>
                    <Text style={styles.distributionLabel}>{category}</Text>
                    <Text style={styles.distributionValue}>{count}</Text>
                  </View>
                ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={assessments}
        renderItem={renderAssessmentItem}
        keyExtractor={(item) => item.id || item.assessmentId || item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderStatsHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  animatedContainer: {
    marginBottom: 20,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.lightGray,
    marginHorizontal: 15,
  },
  additionalStatsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 15,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItemSmall: {
    alignItems: 'center',
    flex: 1,
  },
  statNumberSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabelSmall: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  distributionContainer: {
    marginTop: 15,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  distributionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 120,
  },
  distributionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  distributionValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: 'bold',
  },
  historyCard: {
    marginBottom: 0,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  athleteInfoContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  athleteDetails: {
    marginLeft: 12,
  },
  athleteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  athleteSport: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  athleteContact: {
    marginLeft: 52,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testDetails: {
    marginLeft: 12,
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  testDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  resultsContainer: {
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  resultsList: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  resultKey: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 10,
    marginBottom: 15,
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
    lineHeight: 20,
  },
  blockchainContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: 12,
    marginBottom: 15,
  },
  blockchainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockchainTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  blockchainInfo: {
    paddingLeft: 4,
  },
  blockchainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  blockchainLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    width: 80,
  },
  blockchainValue: {
    fontSize: 12,
    color: Colors.text,
    backgroundColor: Colors.white,
    padding: 6,
    borderRadius: 6,
    fontFamily: 'monospace',
    flex: 1,
    marginLeft: 8,
  },
  blockchainStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  blockchainStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 6,
  },
  additionalDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },

});

export default HistoryScreen;