import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import CustomCard from '../../components/CustomCard';
import CustomButton from '../../components/CustomButton';
import DashboardViewToggle from '../../components/DashboardViewToggle';
import { Colors, Gradients } from '../../constants/colors';
import { API_CONFIG, testApiConnectivity } from '../../config/api';
import { getAthletes, getAssessments } from '../../services/FirebaseService';
import { TEST_CONFIG } from '../../constants/tests';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDashboardStats, calculateAndUpdateUserStats, getUserDashboardSettings, updateUserDashboardSettings } from '../../services/UserDashboardService';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAthletes: 0,
    totalAssessments: 0,
    pendingEvaluations: 0,
    completedToday: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [processingAssessment, setProcessingAssessment] = useState(null);
  const [userSettings, setUserSettings] = useState({ overviewType: 'personal' });

  useEffect(() => {
    console.log('DashboardScreen mounted, fetching data...');
    fetchDashboardData();
    
    // Set up interval to refresh data every 15 seconds (faster refresh)
    const interval = setInterval(() => {
      console.log('Refreshing dashboard data...');
      fetchDashboardData();
    }, 15000);
    
    // Clean up interval on unmount
    return () => {
      console.log('DashboardScreen unmounted, clearing interval...');
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Load user-specific settings
    if (user?.uid) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const settings = await getUserDashboardSettings(user.uid);
      setUserSettings(settings);
    } catch (error) {
      console.log('Error loading user settings:', error);
      // Use default settings if there's an error
      setUserSettings({ overviewType: 'personal' });
    }
  };

  const handleViewChange = async (viewType) => {
    try {
      const updatedSettings = await updateUserDashboardSettings(user.uid, {
        ...userSettings,
        overviewType: viewType
      });
      
      if (updatedSettings.success) {
        setUserSettings(updatedSettings.data);
        // Refresh dashboard data to reflect the new view
        await fetchDashboardData(true);
      }
    } catch (error) {
      console.log('Error updating view settings:', error);
      Alert.alert('Error', 'Failed to update dashboard view settings. You may be offline.');
    }
  };

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setNetworkError(false);
      
      console.log('Fetching dashboard data...', { forceRefresh });
      
      // For authenticated users, try to get personalized stats first
      if (user?.uid && userSettings.overviewType === 'personal') {
        try {
          const userStats = await getUserDashboardStats(user.uid, user.email);
          // If we have recent user stats, use them
          if (userStats.lastUpdated && new Date(userStats.lastUpdated) > new Date(Date.now() - 5 * 60 * 1000)) { // 5 minutes
            setStats({
              totalAthletes: userStats.totalAthletes || 0,
              totalAssessments: userStats.totalAssessments || 0,
              pendingEvaluations: userStats.pendingEvaluations || 0,
              completedToday: userStats.completedToday || 0,
            });
          }
        } catch (userStatsError) {
          console.log('Error fetching user stats:', userStatsError);
        }
      }
      
      // Test API connectivity first with improved error handling
      let isApiReachable = false;
      try {
        isApiReachable = await testApiConnectivity();
        console.log('API connectivity test result:', isApiReachable);
      } catch (connectivityError) {
        console.log('API connectivity test failed:', connectivityError.message);
        isApiReachable = false;
      }
      
      let athletes = [];
      let assessments = [];
      
      if (isApiReachable) {
        console.log('Attempting to fetch from API...');
        try {
          // Fetch athletes with timeout and better error handling
          try {
            const athletesController = new AbortController();
            const athletesTimeout = setTimeout(() => athletesController.abort(), API_CONFIG.TIMEOUT || 8000);
            const athletesResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ATHLETES}`, {
              signal: athletesController.signal,
              headers: {
                'Content-Type': 'application/json',
              }
            });
            clearTimeout(athletesTimeout);
            
            if (athletesResponse.ok) {
              const athletesResult = await athletesResponse.json();
              if (athletesResult.success) {
                athletes = athletesResult.data || [];
                console.log(`API Athletes: ${athletes.length}`);
              }
            }
          } catch (athleteError) {
            console.log('API athlete fetch failed:', athleteError.message);
          }
          
          // Fetch assessments with timeout and better error handling
          try {
            const assessmentsController = new AbortController();
            const assessmentsTimeout = setTimeout(() => assessmentsController.abort(), API_CONFIG.TIMEOUT || 8000);
            const assessmentsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENTS}`, {
              signal: assessmentsController.signal,
              headers: {
                'Content-Type': 'application/json',
              }
            });
            clearTimeout(assessmentsTimeout);
            
            if (assessmentsResponse.ok) {
              const assessmentsResult = await assessmentsResponse.json();
              if (assessmentsResult.success) {
                assessments = assessmentsResult.data || [];
                console.log(`API Assessments: ${assessments.length}`);
                console.log('API Assessments:', assessments);
              }
            }
          } catch (assessmentError) {
            console.log('API assessment fetch failed:', assessmentError.message);
          }
        } catch (apiError) {
          console.log('API fetch failed, falling back to Firebase:', apiError.message);
        }
      }
      
      // Always try to fetch from Firebase to ensure data accuracy
      try {
        // Fetch athletes from Firebase (critical for athlete count)
        console.log('Fetching athletes from Firebase...');
        const firebaseAthletes = await getAthletes();
        console.log(`Firebase Athletes: ${firebaseAthletes.length}`);
        
        // Only use Firebase athletes if we didn't get athletes from API or if API failed
        if (athletes.length === 0 || !isApiReachable) {
          athletes = firebaseAthletes;
        }
        
        // Fetch assessments from Firebase if not fetched from API
        if (assessments.length === 0 || !isApiReachable) {
          console.log('Fetching assessments from Firebase...');
          const firebaseAssessments = await getAssessments();
          console.log(`Firebase Assessments: ${firebaseAssessments.length}`);
          assessments = firebaseAssessments;
        }
      } catch (firebaseError) {
        console.error('Firebase fetch error:', firebaseError);
        // Only set network error if we have no data at all
        if (athletes.length === 0 && assessments.length === 0) {
          setNetworkError(true);
        }
      }
      
      // Ensure we always have athlete data
      if (athletes.length === 0) {
        console.log('Warning: No athlete data available from any source');
        // Try one more time to get athletes from Firebase
        try {
          athletes = await getAthletes();
          console.log(`Second attempt Firebase Athletes: ${athletes.length}`);
        } catch (retryError) {
          console.log('Second Firebase athlete fetch failed:', retryError.message);
        }
      }
      
      // Calculate statistics
      const totalAthletes = athletes.length;
      const totalAssessments = assessments.length;
      const pendingEvaluations = assessments.filter(a => 
        a.status === 'Pending' || a.status === 'Processing'
      ).length;
      
      const today = new Date().toDateString();
      const completedToday = assessments.filter(a => 
        new Date(a.submissionDate || a.createdAt?.toDate?.() || a.createdAt).toDateString() === today
      ).length;
      
      // Update user-specific stats if user is authenticated and viewing personal stats
      if (user?.uid && userSettings.overviewType === 'personal') {
        try {
          await calculateAndUpdateUserStats(user.uid, user.email);
        } catch (updateError) {
          console.log('Error updating user stats:', updateError);
        }
      }
      
      setStats({
        totalAthletes,
        totalAssessments,
        pendingEvaluations,
        completedToday,
      });
      
      // Set recent activities (sort by submission date or creation date)
      const recent = [...assessments]
        .sort((a, b) => {
          const dateA = new Date(a.submissionDate || a.createdAt?.toDate?.() || a.createdAt);
          const dateB = new Date(b.submissionDate || b.createdAt?.toDate?.() || b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 5);
      
      console.log('Recent activities:', recent);
      setRecentActivities(recent);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setNetworkError(true);
      // Show user-friendly error message
      Alert.alert(
        'Connection Error',
        'Unable to fetch dashboard data. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      // Set default values to prevent UI issues but preserve existing data if available
      setStats(prevStats => ({
        totalAthletes: prevStats.totalAthletes || 0,
        totalAssessments: prevStats.totalAssessments || 0,
        pendingEvaluations: prevStats.pendingEvaluations || 0,
        completedToday: prevStats.completedToday || 0,
      }));
      // Only clear recent activities if we have no data at all
      if (recentActivities.length === 0) {
        setRecentActivities([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to manually refresh recent activities
  const refreshRecentActivities = async () => {
    console.log('Manually refreshing recent activities...');
    await fetchDashboardData(true);
  };

  const processAssessmentWithAI = async (assessment) => {
    // Check if assessment type is supported
    const supportedTypes = ['sit-ups', 'push-ups', 'vertical-jump', 'shuttle-run'];
    if (!supportedTypes.includes(assessment.assessmentType)) {
      Alert.alert(
        'Not Supported',
        `AI analysis is not supported for ${assessment.assessmentType} assessments.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setProcessingAssessment(assessment.id);
    
    try {
      // Show processing alert
      Alert.alert(
        'AI Analysis Started',
        `Starting AI analysis for ${assessment.assessmentType} assessment. This may take a few minutes.`,
        [{ text: 'OK' }]
      );

      // Call the backend API to process the assessment with AI
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENTS}/${assessment.id}/process-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        // Poll for assessment updates until processing is complete with faster polling
        const pollForUpdates = async () => {
          try {
            // Wait a bit before first check
            await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2000 to 1000ms
            
            // Poll for updates every 500ms for up to 2 minutes (faster and shorter)
            for (let i = 0; i < 240; i++) { // Increased iterations for 2 minutes at 500ms intervals
              const updateResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENTS}/${assessment.id}`);
              const updateResult = await updateResponse.json();
              
              if (updateResult.success && updateResult.data) {
                const updatedAssessment = updateResult.data;
                
                // Check if processing is complete
                if (updatedAssessment.status === 'Evaluated' || updatedAssessment.status === 'Failed') {
                  // Refresh dashboard data to show updated assessment in recent activities
                  await fetchDashboardData();
                  
                  // Navigate to the assessment detail screen to view results
                  navigation.navigate('AssessmentDetail', { assessmentId: assessment.id });
                  return;
                }
              }
              
              // Wait before next poll (faster polling)
              await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000 to 500ms
            }
            
            // If we get here, processing took too long
            Alert.alert(
              'Processing Taking Longer Than Expected',
              'AI analysis is still processing. You can view the results later in the assessment details.',
              [{ text: 'OK' }]
            );
            
            // Refresh dashboard data anyway to show current status
            await fetchDashboardData();
            navigation.navigate('AssessmentDetail', { assessmentId: assessment.id });
          } catch (pollError) {
            console.error('Polling error:', pollError);
            // Still navigate to assessment detail screen
            navigation.navigate('AssessmentDetail', { assessmentId: assessment.id });
          }
        };
        
        // Start polling for updates
        pollForUpdates();
      } else {
        throw new Error(result.message || 'Failed to start AI processing');
      }
    } catch (error) {
      console.error('AI processing error:', error);
      Alert.alert(
        'Processing Error',
        `Failed to process assessment with AI: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setProcessingAssessment(null);
    }
  };

  const dashboardActions = [
    {
      id: 'register-athlete',
      title: 'Register Athlete',
      subtitle: 'Add new talent to the system',
      icon: 'account-plus',
      color: Colors.primary,
      onPress: () => navigation.navigate('AthleteRegistration'),
    },
    {
      id: 'submit-assessment',
      title: 'Submit Assessment',
      subtitle: 'Upload performance videos',
      icon: 'video-plus',
      color: Colors.success,
      onPress: () => navigation.navigate('AssessmentSubmission'),
    },
    {
      id: 'view-assessments',
      title: 'View Assessments',
      subtitle: 'Review and evaluate submissions',
      icon: 'clipboard-list',
      color: Colors.info,
      onPress: () => navigation.navigate('AssessmentList'),
    },
    {
      id: 'talent-rankings',
      title: 'Talent Rankings',
      subtitle: 'View performance leaderboard',
      icon: 'trophy-variant',
      color: Colors.warning,
      onPress: () => navigation.navigate('TalentRankings'),
    },
  ];

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={24} color={Colors.white} />
        </View>
      </View>
    </View>
  );

  const ActivityItem = ({ activity }) => {
    const isProcessing = processingAssessment === activity.id;
    
    // Function to get assessment-specific details
    const getAssessmentDetails = () => {
      if (!activity.aiAnalysis) return null;
      
      switch (activity.assessmentType) {
        case 'push-ups':
          return `${activity.aiAnalysis.aiRepCount || 0} push-ups`;
        case 'sit-ups':
          return `${activity.aiAnalysis.aiRepCount || 0} sit-ups`;
        case 'vertical-jump':
          if (activity.aiAnalysis.jumpHeights && activity.aiAnalysis.jumpHeights.length > 0) {
            // Convert cm to feet
            const heightInFeet = (activity.aiAnalysis.jumpHeights[0] * 0.0328084).toFixed(2);
            return `${heightInFeet} feet`;
          }
          return null;
        case 'shuttle-run':
          return activity.aiAnalysis.processingTime ? 
            `${activity.aiAnalysis.processingTime.toFixed(2)} seconds` : null;
        default:
          return null;
      }
    };
    
    const assessmentDetails = getAssessmentDetails();
    
    return (
      <TouchableOpacity 
        style={styles.activityItem}
        onPress={() => processAssessmentWithAI(activity)}
        disabled={isProcessing}
      >
        <View style={styles.activityIcon}>
          <MaterialCommunityIcons
            name={getActivityIcon(activity.status)}
            size={16}
            color={getActivityColor(activity.status)}
          />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>
            {getAssessmentTypeName(activity.assessmentType)}
          </Text>
          <Text style={styles.activitySubtitle}>
            Athlete ID: {activity.athleteId} • {formatDate(activity.submissionDate || activity.createdAt)}
          </Text>
          {assessmentDetails && activity.status === 'Evaluated' && (
            <Text style={styles.activityDetails}>
              {assessmentDetails}
            </Text>
          )}
        </View>
        <View style={styles.activityAction}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={20}
              color={Colors.primary}
            />
          )}
        </View>
        <View style={[styles.activityStatus, { backgroundColor: getActivityColor(activity.status) }]}>
          <Text style={styles.activityStatusText}>{activity.status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getActivityIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing': return 'loading';
      case 'pending': return 'clock-outline';
      case 'evaluated': 
      case 'completed': return 'check-circle';
      default: return 'help-circle';
    }
  };

  const getActivityColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing': return Colors.warning;
      case 'pending': return Colors.info;
      case 'evaluated': 
      case 'completed': return Colors.success;
      default: return Colors.gray;
    }
  };

  const getAssessmentTypeName = (type) => {
    const config = TEST_CONFIG[type];
    return config ? config.name : type?.replace('-', ' ')?.toUpperCase() || 'Assessment';
  };

  const formatDate = (dateInput) => {
    const date = new Date(dateInput);
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient 
          colors={Gradients.primary && Gradients.primary.length >= 2 ? Gradients.primary : ['#1976D2', '#1565C0']} 
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons
                name="view-dashboard"
                size={40}
                color={Colors.white}
              />
              <Text style={styles.headerTitle}>SAI Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                Sports Talent Assessment Overview
              </Text>
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
              Network connection issues detected. Data is being loaded from local cache.
            </Text>
          </View>
        )}

        {/* Retry button when there's an error */}
        {stats.totalAthletes === 0 && stats.totalAssessments === 0 && !loading && (
          <View style={styles.retryContainer}>
            <CustomButton
              title="Retry Connection"
              onPress={fetchDashboardData}
              style={styles.retryButton}
            />
          </View>
        )}

        <View style={styles.content}>
          {/* View Toggle for authenticated users */}
          {user?.uid && (
            <DashboardViewToggle 
              currentView={userSettings.overviewType || 'personal'}
              onViewChange={handleViewChange}
            />
          )}

          {/* Statistics */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Overview Statistics</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Athletes"
                value={stats.totalAthletes}
                icon="account-group"
                color={Colors.primary}
              />
              <StatCard
                title="Total Assessments"
                value={stats.totalAssessments}
                icon="clipboard-list"
                color={Colors.success}
              />
              <StatCard
                title="Pending Reviews"
                value={stats.pendingEvaluations}
                icon="clock-outline"
                color={Colors.warning}
              />
              <StatCard
                title="Completed Today"
                value={stats.completedToday}
                icon="check-circle"
                color={Colors.info}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {dashboardActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={action.onPress}
                >
                  <LinearGradient
                    colors={action.color ? [action.color, action.color + '80'] : [Colors.primary, Colors.primary + '80']}
                    style={styles.actionGradient}
                  >
                    <MaterialCommunityIcons
                      name={action.icon}
                      size={32}
                      color={Colors.white}
                    />
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Activities */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activities</Text>
              <View style={styles.recentActions}>
                <TouchableOpacity onPress={refreshRecentActivities} style={styles.refreshButton}>
                  <MaterialCommunityIcons 
                    name={loading ? "refresh" : "refresh"} 
                    size={20} 
                    color={Colors.primary} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('AssessmentList')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <CustomCard style={styles.activitiesCard}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading recent activities...</Text>
                </View>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <View key={activity.id || index}>
                    <ActivityItem activity={activity} />
                    {index < recentActivities.length - 1 && (
                      <View style={styles.activityDivider} />
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyActivities}>
                  <MaterialCommunityIcons
                    name="clipboard-text-off"
                    size={48}
                    color={Colors.gray}
                  />
                  <Text style={styles.emptyText}>No recent activities</Text>
                  <TouchableOpacity 
                    onPress={refreshRecentActivities}
                    style={styles.retryButtonSmall}
                  >
                    <Text style={styles.retryButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              )}
            </CustomCard>
          </View>
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
    padding: 20,
    paddingTop: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 5,
    textAlign: 'center',
  },
  networkErrorContainer: {
    backgroundColor: Colors.warning + '20',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkErrorText: {
    color: Colors.error,
    marginLeft: 8,
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    marginRight: 15,
    padding: 5,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.gray,
  },
  retryContainer: {
    padding: 20,
    alignItems: 'center',
  },
  retryButton: {
    width: '50%',
  },
  retryButtonSmall: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    // Fixed deprecated shadow props
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statTitle: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    // Fixed deprecated shadow props
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 20,
  },
  activitiesCard: {
    padding: 16,
    // Fixed deprecated shadow props
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  activitySubtitle: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  activityDetails: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  activityAction: {
    marginRight: 12,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityStatusText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activityDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 8,
  },
  emptyActivities: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    marginTop: 12,
  },
});

export default DashboardScreen;