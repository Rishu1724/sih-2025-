import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Colors, Gradients } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';
import { API_CONFIG } from '../../config/api';

const AssessmentListScreen = ({ navigation }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, processing, evaluated

  useFocusEffect(
    useCallback(() => {
      fetchAssessments();
    }, [filter])
  );

  const fetchAssessments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filterQuery = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENTS}${filterQuery}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setAssessments(result.data || []);
      } else {
        Alert.alert('Error', 'Failed to fetch assessments');
      }
    } catch (error) {
      console.error('Fetch assessments error:', error);
      Alert.alert('Error', 'Failed to fetch assessments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchAssessments(true);
  };

  const handleReprocess = async (assessmentId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENT_REPROCESS}/${assessmentId}/reprocess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Success', 'AI reprocessing started. Please check back in a few minutes.');
        fetchAssessments(); // Refresh the list
      } else {
        Alert.alert('Error', result.message || 'Failed to start reprocessing');
      }
    } catch (error) {
      console.error('Reprocess error:', error);
      Alert.alert('Error', 'Failed to start reprocessing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing':
        return Colors.warning;
      case 'pending':
        return Colors.info;
      case 'evaluated':
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
        return 'check-circle';
      case 'failed':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderAssessmentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.assessmentCard}
      onPress={() => navigation.navigate('AssessmentDetail', { assessmentId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.assessmentTypeContainer}>
          <MaterialCommunityIcons 
            name="dumbbell" 
            size={20} 
            color={Colors.primary} 
          />
          <Text style={styles.assessmentType}>
            {item.assessmentType?.replace('-', ' ')?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <MaterialCommunityIcons 
              name={getStatusIcon(item.status)} 
              size={14} 
              color={Colors.white} 
            />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          {/* Blockchain Verification Badge */}
          {item.blockchainHash && (
            <View style={[styles.statusBadge, { backgroundColor: Colors.success, marginLeft: 8 }]}>
              <MaterialCommunityIcons 
                name="blockchain" 
                size={14} 
                color={Colors.white} 
              />
              <Text style={styles.statusText}>Verified</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.athleteInfo}>
          <MaterialCommunityIcons 
            name="account" 
            size={16} 
            color={Colors.gray} 
          />
          <Text style={styles.athleteName}>
            Athlete ID: {item.athleteId}
          </Text>
        </View>

        <View style={styles.dateInfo}>
          <MaterialCommunityIcons 
            name="calendar" 
            size={16} 
            color={Colors.gray} 
          />
          <Text style={styles.submissionDate}>
            {formatDate(item.submissionDate)}
          </Text>
        </View>

        {item.aiAnalysis && (
          <View style={styles.analysisInfo}>
            <View style={styles.analysisHeader}>
              <MaterialCommunityIcons 
                name="brain" 
                size={16} 
                color={Colors.primary} 
              />
              <Text style={styles.analysisTitle}>AI Analysis</Text>
            </View>
            <View style={styles.analysisMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Count</Text>
                <Text style={styles.metricValue}>{item.aiAnalysis.aiRepCount || 0}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Score</Text>
                <Text style={styles.metricValue}>
                  {item.aiAnalysis.aiTechniqueScore ? (item.aiAnalysis.aiTechniqueScore * 100).toFixed(1) : 0}%
                </Text>
              </View>
              {item.aiAnalysis.processingTime > 0 && (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Time</Text>
                  <Text style={styles.metricValue}>
                    {item.aiAnalysis.processingTime.toFixed(1)}s
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {item.evaluation && item.evaluation.score && (
          <View style={styles.evaluationInfo}>
            <MaterialCommunityIcons 
              name="star" 
              size={16} 
              color={Colors.warning} 
            />
            <Text style={styles.evaluationText}>
              Final Score: {item.evaluation.score}/100
            </Text>
          </View>
        )}

        {item.status === 'Failed' && item.aiAnalysis && (
          <TouchableOpacity 
            style={styles.reprocessButton}
            onPress={() => handleReprocess(item.id)}
          >
            <MaterialCommunityIcons 
              name="refresh" 
              size={16} 
              color={Colors.primary} 
            />
            <Text style={styles.reprocessText}>Reprocess AI Analysis</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ title, value, active }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.primary} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <MaterialCommunityIcons name="clipboard-list" size={32} color={Colors.white} />
            <Text style={styles.headerTitle}>Assessments</Text>
            <Text style={styles.headerSubtitle}>View and manage assessments</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('AssessmentSubmission')}
            style={styles.addButton}
          >
            <MaterialCommunityIcons name="plus" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.filterContainer}>
          <FilterButton title="All" value="all" active={filter === 'all'} />
          <FilterButton title="Processing" value="processing" active={filter === 'processing'} />
          <FilterButton title="Pending" value="pending" active={filter === 'pending'} />
          <FilterButton title="Evaluated" value="evaluated" active={filter === 'evaluated'} />
        </View>

        <FlatList
          data={assessments}
          renderItem={renderAssessmentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="clipboard-text-off" 
                size={64} 
                color={Colors.gray} 
              />
              <Text style={styles.emptyTitle}>No Assessments Found</Text>
              <Text style={styles.emptyText}>
                {filter === 'all' 
                  ? 'No assessments have been submitted yet.'
                  : `No assessments with status "${filter}" found.`
                }
              </Text>
              <CustomButton
                title="Submit Assessment"
                onPress={() => navigation.navigate('AssessmentSubmission')}
                style={styles.emptyButton}
                variant="outline"
              />
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  addButton: {
    marginLeft: 15,
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: Colors.lightGray,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  listContainer: {
    padding: 20,
  },
  assessmentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    // Fixed deprecated shadow props
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assessmentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assessmentType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    // Fixed deprecated shadow props
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  cardContent: {
    gap: 8,
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  athleteName: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submissionDate: {
    fontSize: 14,
    color: Colors.gray,
    marginLeft: 8,
  },
  analysisInfo: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  analysisMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  evaluationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
  },
  evaluationText: {
    fontSize: 16,
    color: Colors.warning,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
  reprocessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  reprocessText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default AssessmentListScreen;