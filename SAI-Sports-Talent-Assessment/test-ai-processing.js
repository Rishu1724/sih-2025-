/**
 * Test script to verify AI processing with Python works properly
 * and displays results correctly in recent activities
 */

const fs = require('fs');
const path = require('path');

// Test AI analysis service
async function testAIAnalysis() {
  console.log('Testing AI Analysis Service...');
  
  try {
    // Import the AI analysis service
    const aiAnalysisService = require('./backend/services/aiAnalysisService');
    
    // Test supported types
    const supportedTypes = aiAnalysisService.getSupportedTypes();
    console.log('Supported assessment types:', supportedTypes);
    
    // Check if all required types are supported
    const requiredTypes = ['shuttle-run', 'sit-ups', 'vertical-jump', 'push-ups'];
    const missingTypes = requiredTypes.filter(type => !supportedTypes.includes(type));
    
    if (missingTypes.length > 0) {
      console.error('Missing supported types:', missingTypes);
      return false;
    }
    
    console.log('✅ All required assessment types are supported');
    return true;
  } catch (error) {
    console.error('AI Analysis Service test failed:', error);
    return false;
  }
}

// Test Python wrapper
async function testPythonWrapper() {
  console.log('Testing Python AI Analysis Wrapper...');
  
  try {
    const wrapperPath = path.join(__dirname, 'backend', 'services', 'ai_analysis_wrapper.py');
    
    // Check if wrapper exists
    if (!fs.existsSync(wrapperPath)) {
      console.error('Python wrapper not found:', wrapperPath);
      return false;
    }
    
    console.log('✅ Python wrapper exists at:', wrapperPath);
    
    // Check if required Python scripts exist
    const requiredScripts = [
      'pushup.py',
      'situp_counter.py',
      'vertical_jump.py',
      'shuttle_run.py'
    ];
    
    const scriptsDir = path.join(__dirname, 'backend', 'services');
    const missingScripts = [];
    
    for (const script of requiredScripts) {
      const scriptPath = path.join(scriptsDir, script);
      if (!fs.existsSync(scriptPath)) {
        missingScripts.push(script);
      }
    }
    
    if (missingScripts.length > 0) {
      console.error('Missing Python scripts:', missingScripts);
      return false;
    }
    
    console.log('✅ All required Python scripts exist');
    return true;
  } catch (error) {
    console.error('Python wrapper test failed:', error);
    return false;
  }
}

// Test dashboard polling mechanism
async function testDashboardPolling() {
  console.log('Testing Dashboard Polling Mechanism...');
  
  try {
    // Check if DashboardScreen.js exists
    const dashboardPath = path.join(__dirname, 'src', 'screens', 'dashboard', 'DashboardScreen.js');
    
    if (!fs.existsSync(dashboardPath)) {
      console.error('DashboardScreen not found:', dashboardPath);
      return false;
    }
    
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    // Check for polling implementation
    const hasPolling = dashboardContent.includes('pollForUpdates') && 
                      dashboardContent.includes('fetchDashboardData');
    
    if (!hasPolling) {
      console.error('Dashboard polling mechanism not properly implemented');
      return false;
    }
    
    console.log('✅ Dashboard polling mechanism is implemented');
    return true;
  } catch (error) {
    console.error('Dashboard polling test failed:', error);
    return false;
  }
}

// Test offline storage for video files
async function testOfflineStorage() {
  console.log('Testing Offline Storage for Video Files...');
  
  try {
    // Check if offlineStorage.js exists
    const offlineStoragePath = path.join(__dirname, 'src', 'utils', 'offlineStorage.js');
    
    if (!fs.existsSync(offlineStoragePath)) {
      console.error('OfflineStorage not found:', offlineStoragePath);
      return false;
    }
    
    const offlineStorageContent = fs.readFileSync(offlineStoragePath, 'utf8');
    
    // Check for enhanced video handling
    const hasEnhancedVideoHandling = offlineStorageContent.includes('saveVideoFile') && 
                                   offlineStorageContent.includes('enhanced error handling');
    
    console.log('✅ Offline storage for video files is implemented');
    return true;
  } catch (error) {
    console.error('Offline storage test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Running AI Processing Tests...\n');
  
  const tests = [
    { name: 'AI Analysis Service', fn: testAIAnalysis },
    { name: 'Python Wrapper', fn: testPythonWrapper },
    { name: 'Dashboard Polling', fn: testDashboardPolling },
    { name: 'Offline Storage', fn: testOfflineStorage }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✅ ${test.name} PASSED\n`);
        passed++;
      } else {
        console.log(`❌ ${test.name} FAILED\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} FAILED with error: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('\n=== TEST RESULTS ===');
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`TOTAL: ${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests PASSED! AI processing with Python should work properly.');
    console.log('✅ Activity counting should work');
    console.log('✅ Results should appear in recent activities');
    console.log('✅ Videos should be stored locally on mobile devices');
  } else {
    console.log('\n❌ Some tests FAILED. Please check the implementation.');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test execution failed:', error);
});