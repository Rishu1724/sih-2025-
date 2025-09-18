import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import CustomCard from '../../components/CustomCard';
import { Colors, Gradients } from '../../constants/colors';
import { getAthletes, getAssessments } from '../../services/FirebaseService';

const AdminScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalAthletes: 0,
    totalAssessments: 0,
    pendingAssessments: 0,
    completedToday: 0,
  });
  
  const [loading, setLoading] = useState(true);
  
  const [recentActivities, setRecentActivities] = useState([
    {
      id: '1',
      type: 'New Registration',
      description: 'New athlete registered - John Doe',
      time: '2h ago',
      icon: 'account-plus',
      color: Colors.success,
    },
    {
      id: '2',
      type: 'Assessment',
      description: 'Assessment submitted - Push-ups test',
      time: '4h ago',
      icon: 'video-plus',
      color: Colors.info,
    },
    {
      id: '3',
      type: 'Evaluation',
      description: 'Assessment evaluated - Score: 85/100',
      time: '6h ago',
      icon: 'check-circle',
      color: Colors.success,
    },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch athletes
      const athletes = await getAthletes();
      
      // Fetch assessments
      const assessments = await getAssessments();
      
      // Calculate statistics
      const pendingAssessments = assessments.filter(a => 
        a.status === 'Pending' || a.status === 'Processing'
      ).length;
      
      const today = new Date().toDateString();
      const completedToday = assessments.filter(a => 
        new Date(a.submissionDate || a.createdAt?.toDate?.() || a.createdAt).toDateString() === today
      ).length;
      
      setStats({
        totalAthletes: athletes.length,
        totalAssessments: assessments.length,
        pendingAssessments,
        completedToday,
      });
      
      // Update recent activities with real data
      const recent = assessments
        .sort((a, b) => {
          const dateA = new Date(a.submissionDate || a.createdAt?.toDate?.() || a.createdAt);
          const dateB = new Date(b.submissionDate || b.createdAt?.toDate?.() || b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 3)
        .map((assessment, index) => ({
          id: assessment.id,
          type: 'Assessment',
          description: `${assessment.assessmentType?.replace('-', ' ')?.toUpperCase()} submitted`,
          time: 'Recent',
          icon: 'video-plus',
          color: Colors.info,
        }));
      
      if (recent.length > 0) {
        setRecentActivities(recent);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const adminActions = [
    {
      id: 'register-athlete',
      title: 'Register Athlete',
      subtitle: 'Add new athlete to the system',
      icon: 'account-plus',
      color: Colors.primary,
      onPress: () => navigation.navigate('AthleteRegistration'),
    },
    {
      id: 'submit-assessment',
      title: 'Submit Assessment',
      subtitle: 'Upload assessment videos',
      icon: 'video-plus',
      color: Colors.success,
      onPress: () => navigation.navigate('AssessmentSubmission'),
    },
    {
      id: 'view-assessments',
      title: 'View Assessments',
      subtitle: 'Manage all assessments',
      icon: 'clipboard-list',
      secondaryIcon: 'eye',
      color: Colors.info,
      onPress: () => navigation.navigate('AssessmentList'),
    },
    {
      id: 'athlete-list',
      title: 'Athlete Directory',
      subtitle: 'View all registered athletes',
      icon: 'account-group',
      color: Colors.warning,
      onPress: () => navigation.navigate('AthleteList'),
    },
    {
      id: 'rankings',
      title: 'Talent Rankings',
      subtitle: 'View performance rankings',
      icon: 'trophy-variant',
      color: Colors.accent,
      onPress: () => navigation.navigate('TalentRankings'),
    },
    {
      id: 'reports',
      title: 'Generate Reports',
      subtitle: 'Export assessment reports',
      icon: 'file-chart',
      color: Colors.secondary,
      onPress: () => navigation.navigate('ReportGeneration'),
    },
  ];

  const quickStats = [
    { label: 'Total Athletes', value: stats.totalAthletes.toString(), icon: 'account-group' },
    { label: 'Pending Assessments', value: stats.pendingAssessments.toString(), icon: 'clock-outline' },
    { label: 'Completed Today', value: stats.completedToday.toString(), icon: 'check-circle' },
    { label: 'Total Assessments', value: stats.totalAssessments.toString(), icon: 'clipboard-list' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={Gradients.primary} style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons
                name="shield-account"
                size={40}
                color={Colors.white}
              />
              <Text style={styles.headerTitle}>Admin Panel</Text>
              <Text style={styles.headerSubtitle}>
                Sports Talent Assessment Management
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Quick Overview</Text>
            <View style={styles.statsGrid}>
              {quickStats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <MaterialCommunityIcons
                    name={stat.icon}
                    size={24}
                    color={Colors.primary}
                  />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Admin Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Management Tools</Text>
            <View style={styles.actionsGrid}>
              {adminActions.map((action) => (
                <CustomCard
                  key={action.id}
                  style={styles.actionCard}
                  onPress={action.onPress}
                >
                  <View style={styles.actionContent}>
                    <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                      <MaterialCommunityIcons
                        name={action.icon}
                        size={28}
                        color={Colors.white}
                      />
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                    </View>
                    {action.secondaryIcon && (
                      <MaterialCommunityIcons
                        name={action.secondaryIcon}
                        size={18}
                        color={Colors.gray}
                        style={styles.secondaryIcon}
                      />
                    )}
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color={Colors.gray}
                    />
                  </View>
                </CustomCard>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <CustomCard style={styles.activityCard}>
              {recentActivities.map((activity, index) => (
                <View key={activity.id}>
                  <View style={styles.activityItem}>
                    <MaterialCommunityIcons
                      name={activity.icon}
                      size={20}
                      color={activity.color}
                    />
                    <Text style={styles.activityText}>
                      {activity.description}
                    </Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  {index < recentActivities.length - 1 && (
                    <View style={styles.activityDivider} />
                  )}
                </View>
              ))}
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
    padding: 15,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    // Fixed deprecated shadow props
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    marginBottom: 0,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.gray,
  },
  secondaryIcon: {
    marginRight: 8,
  },
  recentSection: {
    marginBottom: 20,
  },
  activityCard: {
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.gray,
  },
  activityDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 8,
  },
});

export default AdminScreen;