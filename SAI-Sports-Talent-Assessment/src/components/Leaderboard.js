import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import CustomCard from './CustomCard';

const Leaderboard = ({ 
  data = [], 
  title = "Leaderboard",
  currentUserId = null,
  showRank = true,
  maxItems = 10,
  style,
}) => {
  const renderLeaderboardItem = ({ item, index }) => {
    const rank = index + 1;
    const isCurrentUser = currentUserId && item.id === currentUserId;
    
    const getRankIcon = (rank) => {
      switch (rank) {
        case 1:
          return { icon: 'trophy', color: '#FFD700' }; // Gold
        case 2:
          return { icon: 'trophy', color: '#C0C0C0' }; // Silver
        case 3:
          return { icon: 'trophy', color: '#CD7F32' }; // Bronze
        default:
          return { icon: 'medal', color: Colors.gray };
      }
    };

    const rankData = getRankIcon(rank);

    return (
      <View style={[
        styles.leaderboardItem,
        isCurrentUser && styles.currentUserItem
      ]}>
        <View style={styles.rankSection}>
          {showRank && (
            <>
              <MaterialCommunityIcons
                name={rankData.icon}
                size={24}
                color={rankData.color}
              />
              <Text style={[styles.rank, { color: rankData.color }]}>#{rank}</Text>
            </>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <Text style={[
              styles.userName,
              isCurrentUser && styles.currentUserText
            ]}>
              {item.name}
              {isCurrentUser && ' (You)'}
            </Text>
            <Text style={styles.userSubtitle}>
              {item.subtitle || `${item.testsCompleted || 0} tests completed`}
            </Text>
          </View>
          <View style={styles.scoreSection}>
            <Text style={[
              styles.score,
              isCurrentUser && styles.currentUserText
            ]}>
              {item.score || 0}
            </Text>
            <Text style={styles.scoreLabel}>pts</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="trophy-outline"
        size={60}
        color={Colors.gray}
      />
      <Text style={styles.emptyTitle}>No Rankings Yet</Text>
      <Text style={styles.emptyMessage}>
        Complete tests to appear on the leaderboard
      </Text>
    </View>
  );

  const limitedData = data.slice(0, maxItems);

  return (
    <CustomCard style={[styles.container, style]}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="trophy"
          size={24}
          color={Colors.primary}
        />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      {limitedData.length > 0 ? (
        <FlatList
          data={limitedData}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      ) : (
        renderEmptyState()
      )}
    </CustomCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  currentUserItem: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  rankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    marginRight: 12,
  },
  rank: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  currentUserText: {
    color: Colors.primary,
  },
  userSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scoreSection: {
    alignItems: 'center',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scoreLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default Leaderboard;