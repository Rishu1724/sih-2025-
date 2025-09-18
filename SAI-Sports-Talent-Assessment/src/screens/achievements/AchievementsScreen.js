import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import CustomCard from '../../components/CustomCard';
import ProgressBar from '../../components/ProgressBar';
import { Colors, Gradients } from '../../constants/colors';
import { ACHIEVEMENT_BADGES } from '../../constants/tests';
import { useTest } from '../../contexts/TestContext';

const { width } = Dimensions.get('window');

const AchievementsScreen = () => {
  const { achievements, userStats, testHistory } = useTest();

  // Calculate achievements based on user progress
  const calculateEarnedAchievements = () => {
    const earned = [];
    
    // First Test Achievement
    if (testHistory.length > 0) {
      earned.push({
        id: 'first_test',
        ...ACHIEVEMENT_BADGES.FIRST_TEST,
        description: 'Completed your first assessment test',
        dateEarned: testHistory[testHistory.length - 1].timestamp,
      });
    }

    // Consistent Performer
    if (testHistory.length >= 5) {
      earned.push({
        id: 'consistent',
        ...ACHIEVEMENT_BADGES.CONSISTENT,
        description: 'Completed 5 or more tests',
        dateEarned: testHistory[4].timestamp,
      });
    }

    // Perfect Form (example - based on completion without errors)
    const perfectTests = testHistory.filter(test => test.completed && !test.errors);
    if (perfectTests.length >= 3) {
      earned.push({
        id: 'perfect_form',
        ...ACHIEVEMENT_BADGES.PERFECT_FORM,
        description: 'Completed 3 tests with perfect form',
        dateEarned: perfectTests[2].timestamp,
      });
    }

    return earned;
  };

  const earnedAchievements = calculateEarnedAchievements();
  const totalPossibleAchievements = Object.keys(ACHIEVEMENT_BADGES).length;
  const achievementProgress = (earnedAchievements.length / totalPossibleAchievements) * 100;

  const renderAchievementCard = ({ item }) => {
    const isEarned = earnedAchievements.some(earned => earned.name === item.name);
    const earnedData = earnedAchievements.find(earned => earned.name === item.name);

    return (
      <CustomCard style={[styles.achievementCard, !isEarned && styles.lockedCard]}>
        <View style={styles.achievementContent}>
          <View style={[styles.iconContainer, { backgroundColor: isEarned ? item.color : Colors.gray }]}>
            <MaterialCommunityIcons
              name={item.icon}
              size={30}
              color={Colors.white}
            />
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementName, !isEarned && styles.lockedText]}>
              {item.name}
            </Text>
            <Text style={[styles.achievementDescription, !isEarned && styles.lockedText]}>
              {earnedData ? earnedData.description : 'Achievement locked'}
            </Text>
            {isEarned && earnedData && (
              <Text style={styles.dateEarned}>
                Earned on {new Date(earnedData.dateEarned).toLocaleDateString()}
              </Text>
            )}
          </View>
          {isEarned && (
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={Colors.success}
            />
          )}
        </View>
      </CustomCard>
    );
  };

  const renderProgressHeader = () => (
    <View style={styles.progressSection}>
      <LinearGradient colors={Gradients.primary} style={styles.progressGradient}>
        <View style={styles.progressContent}>
          <MaterialCommunityIcons
            name="trophy"
            size={50}
            color={Colors.white}
          />
          <Text style={styles.progressTitle}>Achievement Progress</Text>
          <Text style={styles.progressStats}>
            {earnedAchievements.length} of {totalPossibleAchievements} earned
          </Text>
          <ProgressBar
            progress={earnedAchievements.length}
            total={totalPossibleAchievements}
            color={Colors.white}
            backgroundColor="rgba(255, 255, 255, 0.3)"
            showPercentage
            style={styles.progressBar}
          />
        </View>
      </LinearGradient>
      <Text style={styles.sectionTitle}>Your Achievements</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="trophy-outline"
        size={80}
        color={Colors.gray}
      />
      <Text style={styles.emptyTitle}>No Achievements Yet</Text>
      <Text style={styles.emptyMessage}>
        Complete assessment tests to start earning achievements and showcase your progress!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={Object.values(ACHIEVEMENT_BADGES)}
        renderItem={renderAchievementCard}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderProgressHeader}
        ListEmptyComponent={earnedAchievements.length === 0 ? renderEmptyState : null}
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
    paddingBottom: 40,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressGradient: {
    margin: 20,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
  },
  progressContent: {
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 10,
    marginBottom: 5,
  },
  progressStats: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 20,
  },
  progressBar: {
    width: width - 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  achievementCard: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  lockedCard: {
    opacity: 0.6,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  lockedText: {
    color: Colors.gray,
  },
  dateEarned: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    lineHeight: 24,
  },
});

export default AchievementsScreen;