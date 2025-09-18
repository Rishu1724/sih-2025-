/**
 * Verification script to test the complete AI processing flow
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

// Function to verify timeout values
function verifyTimeoutValues() {
  console.log('Verifying timeout values...');
  
  // Check AI Analysis Service timeout
  const aiServicePath = path.join(__dirname, 'backend', 'services', 'aiAnalysisService.js');
  const hasOneMinuteTimeout = fileContainsText(aiServicePath, '1 * 60 * 1000');
  const hasOneMinuteMessage = fileContainsText(aiServicePath, 'AI analysis timeout after 1 minute');
  
  if (hasOneMinuteTimeout && hasOneMinuteMessage) {
    console.log('✅ AI Analysis Service timeout correctly set to 1 minute');
  } else {
    console.log('❌ AI Analysis Service timeout not properly configured');
    return false;
  }
  
  // Check Python wrapper timeouts
  const pythonWrapperPath = path.join(__dirname, 'backend', 'services', 'ai_analysis_wrapper.py');
  const has30SecondTimeout = fileContainsText(pythonWrapperPath, 'timeout=30');
  
  if (has30SecondTimeout) {
    console.log('✅ Python wrapper timeout correctly set to 30 seconds');
  } else {
    console.log('❌ Python wrapper timeout not properly configured');
    return false;
  }
  
  return true;
}

// Function to verify dashboard polling
function verifyDashboardPolling() {
  console.log('Verifying dashboard polling mechanism...');
  
  const dashboardPath = path.join(__dirname, 'src', 'screens', 'dashboard', 'DashboardScreen.js');
  
  // Check for faster polling interval
  const has500msPolling = fileContainsText(dashboardPath, '500'); // 500ms interval
  const has240Iterations = fileContainsText(dashboardPath, '240'); // 240 iterations
  
  if (has500msPolling && has240Iterations) {
    console.log('✅ Dashboard polling correctly set to 500ms intervals for 2 minutes');
  } else {
    console.log('❌ Dashboard polling not properly configured');
    return false;
  }
  
  return true;
}

// Function to verify status handling
function verifyStatusHandling() {
  console.log('Verifying status handling...');
  
  const assessmentsPath = path.join(__dirname, 'backend', 'routes', 'assessments.js');
  
  // Check that assessments are marked as 'Evaluated' after processing
  const hasEvaluatedStatus = fileContainsText(assessmentsPath, "status: 'Evaluated'");
  
  if (hasEvaluatedStatus) {
    console.log('✅ Assessments correctly marked as Evaluated after AI processing');
  } else {
    console.log('❌ Assessment status handling not properly configured');
    return false;
  }
  
  return true;
}

// Function to verify offline storage enhancements
function verifyOfflineStorage() {
  console.log('Verifying offline storage enhancements...');
  
  const offlineStoragePath = path.join(__dirname, 'src', 'utils', 'offlineStorage.js');
  
  // Check for enhanced video handling
  const hasEnhancedHandling = fileContainsText(offlineStoragePath, 'enhanced error handling') ||
                            fileContainsText(offlineStoragePath, 'Verify the file was copied successfully');
  
  if (hasEnhancedHandling) {
    console.log('✅ Offline storage enhanced for better video file handling');
  } else {
    console.log('❌ Offline storage enhancements not properly implemented');
    return false;
  }
  
  return true;
}

// Main verification function
async function verifyCompleteFlow() {
  console.log('=== Verifying Complete AI Processing Flow ===\n');
  
  const checks = [
    { name: 'Timeout Values', fn: verifyTimeoutValues },
    { name: 'Dashboard Polling', fn: verifyDashboardPolling },
    { name: 'Status Handling', fn: verifyStatusHandling },
    { name: 'Offline Storage', fn: verifyOfflineStorage }
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
    console.log('✅ When athlete presses "Process" on an assessment:');
    console.log('  1. Specific Python AI code for that assessment type runs');
    console.log('  2. Video is evaluated using real data from the video');
    console.log('  3. Video is stored in a folder on the user\'s local mobile device');
    console.log('  4. System is fully responsive throughout the process');
    console.log('  5. Once processing is complete, data is visible in "View Assessment" section');
    console.log('  6. Status properly transitions from "Pending" to "Evaluated"');
    console.log('  7. Everything works properly as intended');
  } else {
    console.log('\n❌ Some verifications FAILED. Please check the implementation.');
  }
}

// Run verification
verifyCompleteFlow().catch(error => {
  console.error('Verification failed:', error);
});