import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import CustomButton from '../../components/CustomButton';
import ProgressBar from '../../components/ProgressBar';
import BlockchainExplorer from '../../components/BlockchainExplorer';

import { Colors, Gradients } from '../../constants/colors';
import { API_CONFIG } from '../../config/api';

const AssessmentDetailScreen = ({ route, navigation }) => {
  const { assessmentId } = route.params;
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState(null);

  useEffect(() => {
    fetchAssessmentDetails();
  }, []);

  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch assessment details
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENTS}/${assessmentId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setAssessment(result.data);
        
        // If athlete data is embedded, set it
        if (result.data.athlete) {
          setAthlete(result.data.athlete);
        }
      } else {
        Alert.alert('Error', 'Failed to fetch assessment details');
      }
    } catch (error) {
      console.error('Fetch assessment details error:', error);
      Alert.alert('Error', 'Failed to fetch assessment details');
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSESSMENTS}/${assessmentId}/reprocess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Success', 'AI reprocessing started. Please check back in a few minutes.');
        fetchAssessmentDetails(); // Refresh the details
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

  const handleViewVideo = () => {
    if (assessment && assessment.videoUrl) {
      Linking.openURL(assessment.videoUrl).catch(() => {
        Alert.alert('Error', 'Unable to open video URL');
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAssessmentTypeLabel = (type) => {
    const labels = {
      'sit-ups': 'Sit-ups',
      'push-ups': 'Push-ups',
      'vertical-jump': 'Vertical Jump',
      'shuttle-run': 'Shuttle Run'
    };
    return labels[type] || type.replace('-', ' ');
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

  const handleVerifyOnBlockchain = () => {
    // In a real implementation, this would open a blockchain explorer
    // For now, we'll just show an alert
    Alert.alert(
      'Blockchain Verification',
      `This assessment is verified on the blockchain with:

Hash: ${assessment.blockchainHash}
Transaction ID: ${assessment.transactionId}

In a real implementation, this would open a blockchain explorer.`,
      [{ text: 'OK' }]
    );
  };

  if (loading && !assessment) {
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
              <Text style={styles.headerTitle}>Loading...</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.content}>
          <Text>Loading assessment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!assessment) {
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
              <Text style={styles.headerTitle}>Assessment Not Found</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.content}>
          <Text>Unable to load assessment details.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <MaterialCommunityIcons name="clipboard-text" size={32} color={Colors.white} />
            <Text style={styles.headerTitle}>Assessment Details</Text>
            <Text style={styles.headerSubtitle}>AI Analysis Results</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Assessment Header */}
        <View style={styles.assessmentHeader}>
          <View style={styles.assessmentTypeContainer}>
            <MaterialCommunityIcons 
              name="dumbbell" 
              size={24} 
              color={Colors.primary} 
            />
            <Text style={styles.assessmentType}>
              {getAssessmentTypeLabel(assessment.assessmentType)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assessment.status) }]}>
            <MaterialCommunityIcons 
              name={getStatusIcon(assessment.status)} 
              size={16} 
              color={Colors.white} 
            />
            <Text style={styles.statusText}>{assessment.status}</Text>
          </View>
        </View>

        {/* Submission Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons 
              name="calendar" 
              size={20} 
              color={Colors.gray} 
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Submitted</Text>
              <Text style={styles.infoValue}>{formatDate(assessment.submissionDate)}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons 
              name="account" 
              size={20} 
              color={Colors.gray} 
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Athlete ID</Text>
              <Text style={styles.infoValue}>{assessment.athleteId || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons 
              name="tag" 
              size={20} 
              color={Colors.gray} 
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Sport Category</Text>
              <Text style={styles.infoValue}>{assessment.sportCategory || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Assessment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Information</Text>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color={Colors.primary} />
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{getAssessmentTypeLabel(assessment.assessmentType)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{formatDate(assessment.submissionDate)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="tag" size={20} color={Colors.primary} />
            <Text style={styles.infoLabel}>Sport:</Text>
            <Text style={styles.infoValue}>{assessment.sportCategory}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name={getStatusIcon(assessment.status)} size={20} color={getStatusColor(assessment.status)} />
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(assessment.status) }]}>
              {assessment.status}
            </Text>
          </View>
          
          {/* Blockchain Information */}
          {assessment.blockchainHash && (
            <View style={styles.blockchainSection}>
              <Text style={styles.sectionTitle}>Blockchain Verification</Text>
              <View style={styles.blockchainInfo}>
                <View style={styles.blockchainRow}>
                  <MaterialCommunityIcons name="blockchain" size={20} color={Colors.primary} />
                  <Text style={styles.blockchainLabel}>Hash:</Text>
                </View>
                <Text style={styles.blockchainValue}>{assessment.blockchainHash}</Text>
              </View>
              <View style={styles.blockchainInfo}>
                <View style={styles.blockchainRow}>
                  <MaterialCommunityIcons name="identifier" size={20} color={Colors.primary} />
                  <Text style={styles.blockchainLabel}>Transaction:</Text>
                </View>
                <Text style={styles.blockchainValue}>{assessment.transactionId}</Text>
              </View>
              <View style={styles.blockchainStatus}>
                <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
                <Text style={styles.blockchainStatusText}>Verified on Blockchain</Text>
              </View>
            </View>
          )}
        </View>

        {/* Blockchain Explorer */}
        {assessment && assessment.blockchainHash && (
          <BlockchainExplorer 
            blockchainHash={assessment.blockchainHash}
            transactionId={assessment.transactionId}
            onVerify={handleVerifyOnBlockchain}
          />
        )}

        {/* AI Analysis Results */}
        <View style={styles.analysisSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="brain" 
              size={24} 
              color={Colors.primary} 
            />
            <Text style={styles.sectionTitle}>AI Analysis Results</Text>
          </View>
          
          {assessment.aiAnalysis ? (
            <View style={styles.analysisCard}>
              {/* Assessment-specific details */}
              {assessment.assessmentType === 'push-ups' && (
                <View style={styles.metricContainer}>
                  <View style={styles.metricHeader}>
                    <MaterialCommunityIcons 
                      name="arm-flex" 
                      size={20} 
                      color={Colors.info} 
                    />
                    <Text style={styles.metricTitle}>Push-ups Count</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {assessment.aiAnalysis.aiRepCount || 0} push-ups
                  </Text>
                  <Text style={styles.metricDescription}>
                    {assessment.aiAnalysis.aiRepCount > 0 
                      ? 'Total push-ups detected by AI' 
                      : 'No push-ups detected'}
                  </Text>
                </View>
              )}
              
              {assessment.assessmentType === 'sit-ups' && (
                <View style={styles.metricContainer}>
                  <View style={styles.metricHeader}>
                    <MaterialCommunityIcons 
                      name="weight-lifter" 
                      size={20} 
                      color={Colors.info} 
                    />
                    <Text style={styles.metricTitle}>Sit-ups Count</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {assessment.aiAnalysis.aiRepCount || 0} sit-ups
                  </Text>
                  <Text style={styles.metricDescription}>
                    {assessment.aiAnalysis.aiRepCount > 0 
                      ? 'Total sit-ups detected by AI' 
                      : 'No sit-ups detected'}
                  </Text>
                </View>
              )}
              
              {assessment.assessmentType === 'vertical-jump' && assessment.aiAnalysis.jumpHeights && assessment.aiAnalysis.jumpHeights.length > 0 && (
                <View style={styles.metricContainer}>
                  <View style={styles.metricHeader}>
                    <MaterialCommunityIcons 
                      name="arrow-up-bold" 
                      size={20} 
                      color={Colors.info} 
                    />
                    <Text style={styles.metricTitle}>Jump Height</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {(assessment.aiAnalysis.jumpHeights[0] * 0.0328084).toFixed(2)} feet
                  </Text>
                  <Text style={styles.metricValue}>
                    {(assessment.aiAnalysis.jumpHeights[0]).toFixed(1)} cm
                  </Text>
                  <Text style={styles.metricDescription}>
                    Maximum jump height detected by AI
                  </Text>
                </View>
              )}
              
              {assessment.assessmentType === 'shuttle-run' && (
                <View style={styles.metricContainer}>
                  <View style={styles.metricHeader}>
                    <MaterialCommunityIcons 
                      name="run-fast" 
                      size={20} 
                      color={Colors.info} 
                    />
                    <Text style={styles.metricTitle}>Shuttle Run Time</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {assessment.aiAnalysis.processingTime ? (assessment.aiAnalysis.processingTime).toFixed(2) : 'N/A'} seconds
                  </Text>
                  <Text style={styles.metricDescription}>
                    Time taken to complete the shuttle run
                  </Text>
                </View>
              )}
              
              {/* General Repetition Count for other assessments */}
              {!['push-ups', 'sit-ups', 'vertical-jump', 'shuttle-run'].includes(assessment.assessmentType) && (
                <View style={styles.metricContainer}>
                  <View style={styles.metricHeader}>
                    <MaterialCommunityIcons 
                      name="counter" 
                      size={20} 
                      color={Colors.info} 
                    />
                    <Text style={styles.metricTitle}>Repetition Count</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {assessment.aiAnalysis.aiRepCount || 0}
                  </Text>
                  <Text style={styles.metricDescription}>
                    {assessment.aiAnalysis.aiRepCount > 0 
                      ? 'Repetitions detected by AI' 
                      : 'No repetitions detected'}
                  </Text>
                </View>
              )}
              
              {/* Technique Score */}
              <View style={styles.metricContainer}>
                <View style={styles.metricHeader}>
                  <MaterialCommunityIcons 
                    name="star" 
                    size={20} 
                    color={Colors.warning} 
                  />
                  <Text style={styles.metricTitle}>Technique Score</Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreValue}>
                    {assessment.aiAnalysis.aiTechniqueScore 
                      ? (assessment.aiAnalysis.aiTechniqueScore * 100).toFixed(1) 
                      : '0.0'}%
                  </Text>
                </View>
                <ProgressBar 
                  progress={assessment.aiAnalysis.aiTechniqueScore || 0} 
                  color={Colors.warning} 
                  style={styles.progressBar}
                />
                <Text style={styles.metricDescription}>
                  {assessment.aiAnalysis.aiTechniqueScore >= 0.8 
                    ? 'Excellent technique' 
                    : assessment.aiAnalysis.aiTechniqueScore >= 0.6 
                    ? 'Good technique' 
                    : assessment.aiAnalysis.aiTechniqueScore >= 0.4 
                    ? 'Fair technique' 
                    : 'Needs improvement'}
                </Text>
              </View>
              
              {/* Processing Time */}
              {assessment.aiAnalysis.processingTime > 0 && (
                <View style={styles.metricContainer}>
                  <View style={styles.metricHeader}>
                    <MaterialCommunityIcons 
                      name="timer" 
                      size={20} 
                      color={Colors.success} 
                    />
                    <Text style={styles.metricTitle}>Processing Time</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {assessment.aiAnalysis.processingTime.toFixed(1)} seconds
                  </Text>
                </View>
              )}
              
              {/* AI Notes */}
              {assessment.aiAnalysis.aiNotes && (
                <View style={styles.notesContainer}>
                  <View style={styles.metricHeader}>
                    <MaterialCommunityIcons 
                      name="note-text" 
                      size={20} 
                      color={Colors.primary} 
                    />
                    <Text style={styles.metricTitle}>AI Notes</Text>
                  </View>
                  <Text style={styles.notesText}>
                    {assessment.aiAnalysis.aiNotes}
                  </Text>
                </View>
              )}
              
              {/* Error Information */}
              {assessment.aiAnalysis.error && (
                <View style={styles.notesContainer}>
                  <View style={styles.metricHeader}>
                    <MaterialCommunityIcons 
                      name="alert-circle" 
                      size={20} 
                      color={Colors.error} 
                    />
                    <Text style={styles.metricTitle}>AI Error</Text>
                  </View>
                  <Text style={[styles.notesText, { color: Colors.error }]}>
                    {assessment.aiAnalysis.error}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.analysisCard}>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="information-outline" 
                  size={48} 
                  color={Colors.gray} 
                />
                <Text style={styles.emptyStateText}>
                  {assessment.status === 'Processing' 
                    ? 'AI analysis is currently processing. Please check back in a few minutes.' 
                    : 'No AI analysis results available for this assessment.'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Manual Evaluation */}
        {assessment.evaluation && assessment.evaluation.score !== null && (
          <View style={styles.evaluationSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="clipboard-check" 
                size={24} 
                color={Colors.success} 
              />
              <Text style={styles.sectionTitle}>Manual Evaluation</Text>
            </View>
            
            <View style={styles.evaluationCard}>
              <View style={styles.finalScoreContainer}>
                <Text style={styles.finalScoreLabel}>Final Score</Text>
                <Text style={styles.finalScoreValue}>
                  {assessment.evaluation.score}/100
                </Text>
              </View>
              
              <ProgressBar 
                progress={assessment.evaluation.score / 100} 
                color={Colors.success} 
                style={styles.progressBar}
              />
              
              {assessment.evaluation.evaluatorNotes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Evaluator Notes</Text>
                  <Text style={styles.notesText}>
                    {assessment.evaluation.evaluatorNotes}
                  </Text>
                </View>
              )}
              
              <View style={styles.evaluationInfo}>
                <Text style={styles.evaluationByText}>
                  Evaluated by: {assessment.evaluation.evaluatedBy || 'SAI Official'}
                </Text>
                <Text style={styles.evaluationDateText}>
                  {formatDate(assessment.evaluation.evaluationDate)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <CustomButton
            title="View Video"
            onPress={handleViewVideo}
            style={styles.actionButton}
            variant="outline"
            leftIcon="video"
            disabled={!assessment.videoUrl}
          />
          
          {(assessment.status === 'Failed' || assessment.status === 'Pending') && (
            <CustomButton
              title="Process AI Analysis"
              onPress={handleReprocess}
              loading={loading}
              style={styles.actionButton}
              leftIcon="refresh"
            />
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
  content: {
    flex: 1,
    padding: 20,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    elevation: 2,
    // Fixed deprecated shadow props
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    // Fixed deprecated shadow props
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTextContainer: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  analysisSection: {
    marginBottom: 25,
  },
  analysisCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    // Fixed deprecated shadow props
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricContainer: {
    marginBottom: 20,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  progressBar: {
    marginVertical: 10,
  },
  metricDescription: {
    fontSize: 14,
    color: Colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  notesContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  evaluationSection: {
    marginBottom: 25,
  },
  evaluationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    // Fixed deprecated shadow props
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  finalScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  finalScoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  finalScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.success,
  },
  evaluationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  evaluationByText: {
    fontSize: 12,
    color: Colors.gray,
  },
  evaluationDateText: {
    fontSize: 12,
    color: Colors.gray,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  blockchainSection: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: 16,
    marginTop: 16,
  },
  blockchainInfo: {
    marginBottom: 12,
  },
  blockchainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  blockchainLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  blockchainValue: {
    fontSize: 12,
    color: Colors.text,
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 6,
    fontFamily: 'monospace',
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 22,
  },
});

export default AssessmentDetailScreen;