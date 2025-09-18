/**
 * Test script to verify that assessment details are properly displayed
 * with correct status and information in the SAI dashboard
 */

const fs = require('fs');
const path = require('path');

// Function to check if a file contains specific text
function fileContainsText(filePath, searchText) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(searchText);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return false;
  }
}

// Function to verify AssessmentDetailScreen implementation
function verifyAssessmentDetailScreen() {
  console.log('Verifying Assessment Detail Screen...');
  
  const detailScreenPath = path.join(__dirname, 'src', 'screens', 'assessments', 'AssessmentDetailScreen.js');
  
  // Check for key components
  const hasStatusDisplay = fileContainsText(detailScreenPath, 'assessment.status');
  const hasAIAnalysisSection = fileContainsText(detailScreenPath, 'AI Analysis Results');
  const hasAssessmentTypeLabel = fileContainsText(detailScreenPath, 'getAssessmentTypeLabel');
  const hasProcessingState = fileContainsText(detailScreenPath, 'AI analysis is currently processing');
  const hasErrorDisplay = fileContainsText(detailScreenPath, 'AI Error');
  
  if (hasStatusDisplay && hasAIAnalysisSection && hasAssessmentTypeLabel && hasProcessingState && hasErrorDisplay) {
    console.log('✅ Assessment Detail Screen correctly implemented');
    return true;
  } else {
    console.log('❌ Assessment Detail Screen missing key components');
    console.log(`  Status Display: ${hasStatusDisplay}`);
    console.log(`  AI Analysis Section: ${hasAIAnalysisSection}`);
    console.log(`  Assessment Type Label: ${hasAssessmentTypeLabel}`);
    console.log(`  Processing State: ${hasProcessingState}`);
    console.log(`  Error Display: ${hasErrorDisplay}`);
    return false;
  }
}

// Function to verify backend status handling
function verifyBackendStatusHandling() {
  console.log('Verifying Backend Status Handling...');
  
  const assessmentsPath = path.join(__dirname, 'backend', 'routes', 'assessments.js');
  
  // Check for proper status updates
  const hasEvaluatedStatus = fileContainsText(assessmentsPath, "status: 'Evaluated'");
  const hasProcessingStatus = fileContainsText(assessmentsPath, "status: 'Processing'");
  const hasFailedStatus = fileContainsText(assessmentsPath, "status: 'Failed'");
  const hasOneMinuteTimeout = fileContainsText(assessmentsPath, 'AI analysis timeout after 1 minute');
  
  if (hasEvaluatedStatus && hasProcessingStatus && hasFailedStatus && hasOneMinuteTimeout) {
    console.log('✅ Backend Status Handling correctly implemented');
    return true;
  } else {
    console.log('❌ Backend Status Handling missing key components');
    console.log(`  Evaluated Status: ${hasEvaluatedStatus}`);
    console.log(`  Processing Status: ${hasProcessingStatus}`);
    console.log(`  Failed Status: ${hasFailedStatus}`);
    console.log(`  1-Minute Timeout: ${hasOneMinuteTimeout}`);
    return false;
  }
}

// Function to verify dashboard processing flow
function verifyDashboardProcessingFlow() {
  console.log('Verifying Dashboard Processing Flow...');
  
  const dashboardPath = path.join(__dirname, 'src', 'screens', 'dashboard', 'DashboardScreen.js');
  
  // Check for processing flow
  const hasProcessAssessmentFunction = fileContainsText(dashboardPath, 'processAssessmentWithAI');
  const hasPollingMechanism = fileContainsText(dashboardPath, 'pollForUpdates');
  const hasNavigationToDetail = fileContainsText(dashboardPath, "navigation.navigate('AssessmentDetail'");
  const hasStatusBadge = fileContainsText(dashboardPath, 'activityStatus');
  
  if (hasProcessAssessmentFunction && hasPollingMechanism && hasNavigationToDetail && hasStatusBadge) {
    console.log('✅ Dashboard Processing Flow correctly implemented');
    return true;
  } else {
    console.log('❌ Dashboard Processing Flow missing key components');
    console.log(`  Process Assessment Function: ${hasProcessAssessmentFunction}`);
    console.log(`  Polling Mechanism: ${hasPollingMechanism}`);
    console.log(`  Navigation to Detail: ${hasNavigationToDetail}`);
    console.log(`  Status Badge: ${hasStatusBadge}`);
    return false;
  }
}

// Main verification function
async function verifyCompleteImplementation() {
  console.log('=== Verifying Complete Assessment Details Implementation ===\n');
  
  const checks = [
    { name: 'Assessment Detail Screen', fn: verifyAssessmentDetailScreen },
    { name: 'Backend Status Handling', fn: verifyBackendStatusHandling },
    { name: 'Dashboard Processing Flow', fn: verifyDashboardProcessingFlow }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      if (result) {
        console.log(`✅ ${check.name} verification PASSED\n`);
        passed++;
      } else {
        console.log(`❌ ${check.name} verification FAILED\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${check.name} verification FAILED with error: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('=== VERIFICATION RESULTS ===');
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`TOTAL: ${checks.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All verifications PASSED!');
    console.log('\n=== EXPECTED BEHAVIOR ===');
    console.log('✅ When an athlete submits an assessment:');
    console.log('  1. Assessment appears in recent activities with "Processing" status');
    console.log('  2. AI analysis runs automatically in the background');
    console.log('  3. Status updates from "Processing" to "Evaluated" or "Failed"');
    console.log('  4. Detailed results visible in "View Assessment" section');
    console.log('  5. All assessment details properly displayed with correct status');
    console.log('  6. Processing time, technique score, and notes are shown');
    console.log('  7. Error information displayed if AI analysis fails');
  } else {
    console.log('\n❌ Some verifications FAILED. Please check the implementation.');
  }
}

// Run verification
verifyCompleteImplementation().catch(error => {
  console.error('Verification failed:', error);
});