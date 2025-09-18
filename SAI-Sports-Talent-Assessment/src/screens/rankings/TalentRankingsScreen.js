import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Gradients } from '../../constants/colors';
import CustomCard from '../../components/CustomCard';
import { getAthletes, getAssessments } from '../../services/FirebaseService';

const { width } = Dimensions.get('window');

const TalentRankingsScreen = ({ navigation }) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch athletes and assessments
      const athletes = await getAthletes();
      const assessments = await getAssessments();

      // Calculate rankings based on assessment scores
      const athleteScores = {};
      
      // Initialize all athletes with 0 score
      athletes.forEach(athlete => {
        athleteScores[athlete.id] = {
          athlete: athlete,
          totalScore: 0,
          assessmentCount: 0
        };
      });

      // Calculate scores from assessments
      assessments.forEach(assessment => {
        if (assessment.athleteId && assessment.aiAnalysis && assessment.aiAnalysis.score) {
          if (!athleteScores[assessment.athleteId]) {
            // Find athlete if not already in our list
            const athlete = athletes.find(a => a.id === assessment.athleteId);
            if (athlete) {
              athleteScores[assessment.athleteId] = {
                athlete: athlete,
                totalScore: 0,
                assessmentCount: 0
              };
            }
          }
          
          if (athleteScores[assessment.athleteId]) {
            athleteScores[assessment.athleteId].totalScore += assessment.aiAnalysis.score;
            athleteScores[assessment.athleteId].assessmentCount += 1;
          }
        }
      });

      // Calculate average scores and create rankings
      const rankingData = Object.values(athleteScores)
        .filter(item => item.assessmentCount > 0)
        .map(item => ({
          ...item,
          averageScore: item.totalScore / item.assessmentCount
        }))
        .sort((a, b) => b.averageScore - a.averageScore);

      setRankings(rankingData);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      Alert.alert('Error', 'Failed to fetch rankings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchRankings(true);
  };

  const renderRankingItem = ({ item, index }) => (
    <CustomCard style={styles.rankingCard}>
      <View style={styles.rankingHeader}>
        <View style={styles.rankContainer}>
          {index === 0 && (
            <MaterialCommunityIcons 
              name="trophy" 
              size={width < 350 ? 20 : 24} 
              color="#FFD700" 
            />
          )}
          {index === 1 && (
            <MaterialCommunityIcons 
              name="trophy" 
              size={width < 350 ? 20 : 24} 
              color="#C0C0C0" 
            />
          )}
          {index === 2 && (
            <MaterialCommunityIcons 
              name="trophy" 
              size={width < 350 ? 20 : 24} 
              color="#CD7F32" 
            />
          )}
          {index > 2 && (
            <Text style={[styles.rankText, { fontSize: width < 350 ? 16 : 18 }]}>#{index + 1}</Text>
          )}
        </View>
        
        <View style={styles.athleteInfo}>
          <MaterialCommunityIcons 
            name="account" 
            size={width < 350 ? 20 : 24} 
            color={Colors.primary} 
          />
          <View style={styles.athleteText}>
            <Text style={[styles.athleteName, { fontSize: width < 350 ? 14 : 16 }]} numberOfLines={1}>
              {item.athlete.name}
            </Text>
            <Text style={[styles.athleteDetails, { fontSize: width < 350 ? 10 : 12 }]} numberOfLines={1}>
              {item.athlete.district}, {item.athlete.state}
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { fontSize: width < 350 ? 16 : 20 }]}>
            {item.averageScore.toFixed(1)}
          </Text>
          <Text style={[styles.scoreLabel, { fontSize: width < 350 ? 10 : 12 }]}>Avg Score</Text>
        </View>
      </View>
      
      <View style={styles.assessmentInfo}>
        <Text style={[styles.assessmentCount, { fontSize: width < 350 ? 12 : 14 }]}>
          {item.assessmentCount} assessments
        </Text>
      </View>
    </CustomCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.primary} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons
              name="trophy-variant"
              size={width < 350 ? 28 : 32}
              color={Colors.white}
            />
            <Text style={[styles.headerTitle, { fontSize: width < 350 ? 20 : 24 }]}>Talent Rankings</Text>
            <Text style={[styles.headerSubtitle, { fontSize: width < 350 ? 12 : 14 }]}>
              Top performing athletes based on assessment scores
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {rankings.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={width < 350 ? 48 : 64}
              color={Colors.gray}
            />
            <Text style={[styles.emptyTitle, { fontSize: width < 350 ? 18 : 20 }]}>No Rankings Available</Text>
            <Text style={[styles.emptyText, { fontSize: width < 350 ? 14 : 16 }]}>
              Rankings will appear once athletes complete assessments
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AssessmentSubmission')}
            >
              <Text style={[styles.actionButtonText, { fontSize: width < 350 ? 14 : 16 }]}>Submit Assessment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={rankings}
            renderItem={renderRankingItem}
            keyExtractor={(item, index) => `${item.athlete.id}-${index}`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
              />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: width < 350 ? 20 : 30,
  },
  header: {
    padding: width < 350 ? 15 : 20,
    paddingTop: width < 350 ? 5 : 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: width < 350 ? 5 : 10,
  },
  headerSubtitle: {
    color: Colors.white,
    opacity: 0.9,
    marginTop: width < 350 ? 3 : 5,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: width < 350 ? 10 : 20,
    marginTop: width < 350 ? -10 : -20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width < 350 ? 15 : 20,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: width < 350 ? 12 : 16,
  },
  emptyText: {
    color: Colors.gray,
    marginTop: width < 350 ? 6 : 8,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: width < 350 ? 10 : 12,
    paddingHorizontal: width < 350 ? 20 : 24,
    marginTop: width < 350 ? 15 : 20,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: width < 350 ? 10 : 20,
  },
  rankingCard: {
    marginBottom: width < 350 ? 12 : 16,
    padding: width < 350 ? 12 : 16,
    marginHorizontal: width < 350 ? 5 : 0,
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankContainer: {
    width: width < 350 ? 30 : 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: width < 350 ? 5 : 8,
  },
  athleteText: {
    marginLeft: width < 350 ? 8 : 12,
    flex: 1,
  },
  athleteName: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  athleteDetails: {
    color: Colors.gray,
    marginTop: width < 350 ? 1 : 2,
  },
  scoreContainer: {
    alignItems: 'center',
    minWidth: width < 350 ? 60 : 80,
  },
  scoreText: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  scoreLabel: {
    color: Colors.gray,
  },
  assessmentInfo: {
    marginTop: width < 350 ? 8 : 12,
    paddingTop: width < 350 ? 8 : 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  assessmentCount: {
    color: Colors.text,
    textAlign: 'center',
  },
});

export default TalentRankingsScreen;