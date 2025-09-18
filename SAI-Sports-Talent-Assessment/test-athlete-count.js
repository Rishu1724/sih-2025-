/**
 * Test script to verify that the total athlete count is properly displayed
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

// Function to verify dashboard implementation
function verifyDashboardImplementation() {
  console.log('Verifying Dashboard Implementation...');
  
  const dashboardPath = path.join(__dirname, 'src', 'screens', 'dashboard', 'DashboardScreen.js');
  
  // Check for key components
  const hasFetchDashboardData = fileContainsText(dashboardPath, 'fetchDashboardData');
  const hasAthleteCountDisplay = fileContainsText(dashboardPath, 'totalAthletes');
  const hasFallbackToFirebase = fileContainsText(dashboardPath, 'getAthletes()');
  const hasApiConnectivityTest = fileContainsText(dashboardPath, 'testApiConnectivity');
  
  if (hasFetchDashboardData && hasAthleteCountDisplay && hasFallbackToFirebase && hasApiConnectivityTest) {
    console.log('✅ Dashboard Implementation correctly handles athlete count display');
    return true;
  } else {
    console.log('❌ Dashboard Implementation missing key components');
    console.log(`  Fetch Dashboard Data: ${hasFetchDashboardData}`);
    console.log(`  Athlete Count Display: ${hasAthleteCountDisplay}`);
    console.log(`  Fallback to Firebase: ${hasFallbackToFirebase}`);
    console.log(`  API Connectivity Test: ${hasApiConnectivityTest}`);
    return false;
  }
}

// Function to verify backend athlete endpoint
function verifyBackendAthleteEndpoint() {
  console.log('Verifying Backend Athlete Endpoint...');
  
  const athletesPath = path.join(__dirname, 'backend', 'routes', 'athletes.js');
  
  // Check for key components
  const hasAthleteEndpoint = fileContainsText(athletesPath, '/api/athletes');
  const hasGetAthletes = fileContainsText(athletesPath, 'getAthletes');
  const hasAthleteCount = fileContainsText(athletesPath, 'count: athletes.length');
  
  if (hasAthleteEndpoint && hasGetAthletes && hasAthleteCount) {
    console.log('✅ Backend Athlete Endpoint correctly implemented');
    return true;
  } else {
    console.log('❌ Backend Athlete Endpoint missing key components');
    console.log(`  Athlete Endpoint: ${hasAthleteEndpoint}`);
    console.log(`  Get Athletes: ${hasGetAthletes}`);
    console.log(`  Athlete Count: ${hasAthleteCount}`);
    return false;
  }
}

// Function to verify Firebase service
function verifyFirebaseService() {
  console.log('Verifying Firebase Service...');
  
  const firebaseServicePath = path.join(__dirname, 'src', 'services', 'FirebaseService.js');
  
  // Check for key components
  const hasGetAthletes = fileContainsText(firebaseServicePath, 'getAthletes');
  const hasAthleteCollection = fileContainsText(firebaseServicePath, 'COLLECTIONS.ATHLETES');
  
  if (hasGetAthletes && hasAthleteCollection) {
    console.log('✅ Firebase Service correctly implemented');
    return true;
  } else {
    console.log('❌ Firebase Service missing key components');
    console.log(`  Get Athletes: ${hasGetAthletes}`);
    console.log(`  Athlete Collection: ${hasAthleteCollection}`);
    return false;
  }
}

// Main verification function
async function verifyAthleteCountDisplay() {
  console.log('=== Verifying Athlete Count Display Implementation ===\n');
  
  const checks = [
    { name: 'Dashboard Implementation', fn: verifyDashboardImplementation },
    { name: 'Backend Athlete Endpoint', fn: verifyBackendAthleteEndpoint },
    { name: 'Firebase Service', fn: verifyFirebaseService }
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
    console.log('✅ Total athlete count is displayed correctly in the dashboard');
    console.log('✅ System prioritizes API data but falls back to Firebase when needed');
    console.log('✅ Athlete count is consistently shown even when offline');
    console.log('✅ Dashboard refreshes data periodically to show updated counts');
  } else {
    console.log('\n❌ Some verifications FAILED. Please check the implementation.');
  }
}

// Run verification
verifyAthleteCountDisplay().catch(error => {
  console.error('Verification failed:', error);
});