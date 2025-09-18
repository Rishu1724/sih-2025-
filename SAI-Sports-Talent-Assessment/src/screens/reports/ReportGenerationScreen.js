import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';

// Handle react-native-html-to-pdf import dynamically to prevent bundling errors
let RNHTMLtoPDF;
try {
  RNHTMLtoPDF = require('react-native-html-to-pdf');
} catch (error) {
  console.warn('react-native-html-to-pdf not available:', error);
  RNHTMLtoPDF = null;
}

// Handle expo-sharing import dynamically to prevent bundling errors
let Sharing;
try {
  Sharing = require('expo-sharing');
} catch (error) {
  console.warn('expo-sharing not available:', error);
  Sharing = {
    isAvailableAsync: async () => false,
    shareAsync: async () => {}
  };
}

import CustomButton from '../../components/CustomButton';
import CustomPicker from '../../components/CustomPicker';
import { Colors, Gradients } from '../../constants/colors';

const ReportGenerationScreen = ({ navigation }) => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSharingAvailable, setIsSharingAvailable] = useState(false);

  useEffect(() => {
    const checkSharingAvailability = async () => {
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        setIsSharingAvailable(isAvailable);
      } catch (error) {
        console.warn('Error checking sharing availability:', error);
        setIsSharingAvailable(false);
      }
    };
    
    checkSharingAvailability();
  }, []);

  const reportTypes = [
    { label: 'Athlete Performance Report', value: 'athlete-performance' },
    { label: 'Assessment Summary Report', value: 'assessment-summary' },
    { label: 'Talent Identification Report', value: 'talent-identification' },
  ];

  const dateRanges = [
    { label: 'Last 7 Days', value: '7' },
    { label: 'Last 30 Days', value: '30' },
    { label: 'Last 90 Days', value: '90' },
    { label: 'All Time', value: 'all' },
  ];

  const generateReport = async () => {
    if (!reportType || !dateRange) {
      Alert.alert('Validation Error', 'Please select both report type and date range');
      return;
    }

    setLoading(true);
    
    try {
      // Check if required packages are available
      if (!RNHTMLtoPDF) {
        Alert.alert('Error', 'PDF generation is not available in this environment');
        setLoading(false);
        return;
      }

      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would generate actual report data
      const reportData = `SAI Sports Talent Assessment Report
Generated on: ${new Date().toLocaleString()}

Report Type: ${reportTypes.find(t => t.value === reportType)?.label}
Date Range: ${dateRanges.find(r => r.value === dateRange)?.label}

Summary:
- Total Athletes: 156
- Total Assessments: 245
- Pending Evaluations: 23
- Completed Today: 8

This is a sample report. In a full implementation, this would contain detailed data.`;

      // Generate PDF report
      const htmlContent = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #1976D2; text-align: center;">SAI Sports Talent Assessment Report</h1>
          <p style="text-align: center;">Generated on: ${new Date().toLocaleString()}</p>
          
          <div style="margin: 20px 0;">
            <h2>Report Configuration</h2>
            <p><strong>Report Type:</strong> ${reportTypes.find(t => t.value === reportType)?.label}</p>
            <p><strong>Date Range:</strong> ${dateRanges.find(r => r.value === dateRange)?.label}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2>Summary Statistics</h2>
            <ul>
              <li>Total Athletes: 156</li>
              <li>Total Assessments: 245</li>
              <li>Pending Evaluations: 23</li>
              <li>Completed Today: 8</li>
            </ul>
          </div>
          
          <div style="margin: 20px 0;">
            <h2>Notes</h2>
            <p>This is a sample report. In a full implementation, this would contain detailed data analysis and charts.</p>
          </div>
        </div>
      `;
      
      const options = {
        html: htmlContent,
        fileName: `sai_report_${Date.now()}`,
        directory: 'Documents',
      };
      
      const pdf = await RNHTMLtoPDF.convert(options);
      const fileUri = pdf.filePath;
      
      Alert.alert(
        'Report Generated',
        'Your report has been generated successfully!',
        [
          ...(isSharingAvailable ? [{
            text: 'Share Report',
            onPress: async () => {
              try {
                if (Sharing && typeof Sharing.shareAsync === 'function') {
                  await Sharing.shareAsync(fileUri);
                } else {
                  Alert.alert('Error', 'Sharing functionality is not available on this device');
                }
              } catch (error) {
                console.error('Sharing error:', error);
                Alert.alert('Error', 'Failed to share report');
              }
            }
          }] : []),
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Report generation error:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <MaterialCommunityIcons name="file-chart" size={32} color={Colors.white} />
            <Text style={styles.headerTitle}>Generate Reports</Text>
            <Text style={styles.headerSubtitle}>Create performance and analytics reports</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Configuration</Text>
            
            <CustomPicker
              label="Report Type *"
              value={reportType}
              onValueChange={setReportType}
              items={reportTypes}
              placeholder="Select report type"
            />

            <CustomPicker
              label="Date Range *"
              value={dateRange}
              onValueChange={setDateRange}
              items={dateRanges}
              placeholder="Select date range"
            />

            <View style={styles.infoBox}>
              <MaterialCommunityIcons 
                name="information" 
                size={20} 
                color={Colors.info} 
              />
              <Text style={styles.infoText}>
                Reports will be generated in PDF format and can be shared or downloaded.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Preview</Text>
            
            <View style={styles.previewCard}>
              <MaterialCommunityIcons 
                name="file-document" 
                size={48} 
                color={Colors.primary} 
              />
              <Text style={styles.previewTitle}>Report Preview</Text>
              <Text style={styles.previewText}>
                Select a report type and date range to generate a detailed PDF analytics report.
              </Text>
            </View>
          </View>

          <CustomButton
            title="Generate Report"
            onPress={generateReport}
            loading={loading}
            disabled={loading}
            style={styles.generateButton}
            gradient
            leftIcon="file-chart"
          />
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
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    color: Colors.info,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  previewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  generateButton: {
    marginTop: 20,
  },
});

export default ReportGenerationScreen;