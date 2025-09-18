import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomCard from '../../components/CustomCard';
import CustomButton from '../../components/CustomButton';
import ProgressBar from '../../components/ProgressBar';
import { Colors, Gradients } from '../../constants/colors';
import { TEST_CONFIG, TEST_TYPES } from '../../constants/tests';
import { useAuth } from '../../contexts/AuthContext';
import { useTest } from '../../contexts/TestContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { testHistory, userStats } = useTest();

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleTestPress = (testType) => {
    navigation.navigate('TestInstruction', { testType });
  };

  const renderTestCard = (testType) => {
    const config = TEST_CONFIG[testType];
    
    // Add safety check for config
    if (!config) {
      console.warn(`Test config not found for: ${testType}`);
      return null;
    }
    
    const isCompleted = testHistory.some(test => test.testType === testType);
    
    return (
      <CustomCard
        key={testType}
        title={config.name}
        subtitle={config.description}
        icon={config.icon}
        iconColor={isCompleted ? Colors.success : Colors.primary}
        style={styles.testCard}
        onPress={() => handleTestPress(testType)}
        rightElement={
          <View style={styles.testCardRight}>
            {isCompleted && (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={Colors.success}
              />
            )}
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={Colors.gray}
            />
          </View>
        }
      />
    );
  };

  const completionPercentage = (userStats.completedTests / Object.keys(TEST_TYPES).length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <LinearGradient colors={Gradients.primary} style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.greeting}>{getTimeOfDayGreeting()},</Text>
              <Text style={styles.userName}>{user?.name || 'Athlete'}!</Text>
              <Text style={styles.welcomeText}>Ready for your next challenge?</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.completedTests}</Text>
                <Text style={styles.statLabel}>Tests Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{testHistory.length}</Text>
                <Text style={styles.statLabel}>Total Attempts</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Progress Section */}
          <CustomCard style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <MaterialCommunityIcons
                name="trophy-outline"
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.progressTitle}>Assessment Progress</Text>
            </View>
            <ProgressBar
              progress={userStats.completedTests}
              total={Object.keys(TEST_TYPES).length}
              showPercentage
              label={`${userStats.completedTests} of ${Object.keys(TEST_TYPES).length} tests completed`}
              style={styles.progressBar}
            />
            {completionPercentage === 100 && (
              <View style={styles.completionBadge}>
                <MaterialCommunityIcons
                  name="trophy"
                  size={20}
                  color={Colors.accent}
                />
                <Text style={styles.completionText}>All tests completed!</Text>
              </View>
            )}
          </CustomCard>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <CustomButton
                title="Submit Assessment"
                onPress={() => navigation.navigate('AssessmentSubmission')}
                style={styles.actionButton}
                leftIcon="video-plus"
                gradient
              />
              <CustomButton
                title="Register Athlete"
                onPress={() => navigation.navigate('AthleteRegistration')}
                style={styles.actionButton}
                leftIcon="account-plus"
                variant="outline"
              />
              <CustomButton
                title="View Assessments"
                onPress={() => navigation.navigate('AssessmentList')}
                style={styles.actionButton}
                leftIcon="clipboard-list"
                variant="outline"
              />
              <CustomButton
                title="Start Random Test"
                onPress={() => {
                  const testTypes = Object.keys(TEST_TYPES);
                  const randomTest = testTypes[Math.floor(Math.random() * testTypes.length)];
                  handleTestPress(randomTest);
                }}
                style={styles.actionButton}
                leftIcon="dice-5"
                variant="outline"
              />
            </View>
          </View>

          {/* Test Categories */}
          <View style={styles.testsSection}>
            <Text style={styles.sectionTitle}>Assessment Tests</Text>
            <Text style={styles.sectionSubtitle}>
              Complete all tests to get a comprehensive fitness assessment
            </Text>
            
            {Object.keys(TEST_TYPES).map(renderTestCard)}
          </View>

          {/* Recent Activity */}
          {testHistory.length > 0 && (
            <CustomCard style={styles.recentCard}>
              <View style={styles.recentHeader}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={24}
                  color={Colors.primary}
                />
                <Text style={styles.recentTitle}>Recent Activity</Text>
              </View>
              <View style={styles.recentItem}>
                <Text style={styles.recentTestName}>
                  {TEST_CONFIG[testHistory[0].testType].name}
                </Text>
                <Text style={styles.recentDate}>
                  {new Date(testHistory[0].timestamp).toLocaleDateString()}
                </Text>
              </View>
              <CustomButton
                title="View All History"
                onPress={() => navigation.navigate('History')}
                variant="outline"
                style={styles.historyButton}
              />
            </CustomCard>
          )}
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
  welcomeContainer: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 18,
    color: Colors.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginVertical: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
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
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  progressCard: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  progressBar: {
    marginBottom: 10,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  completionText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 4,
  },
  quickActions: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 10,
  },
  testsSection: {
    marginBottom: 30,
  },
  testCard: {
    marginBottom: 12,
  },
  testCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentCard: {
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recentTestName: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  recentDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  historyButton: {
    alignSelf: 'flex-start',
  },
});

export default HomeScreen;