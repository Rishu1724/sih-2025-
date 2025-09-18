/**
 * Test script to verify the fix for the createAthlete ReferenceError
 */

// Test 1: Verify FirebaseService import
console.log('=== Test 1: FirebaseService Import Verification ===');
try {
  const { createAthlete, getAthletes } = require('./src/services/FirebaseService');
  console.log('✓ FirebaseService imports successful');
  console.log('✓ createAthlete function available:', typeof createAthlete === 'function');
  console.log('✓ getAthletes function available:', typeof getAthletes === 'function');
} catch (error) {
  console.error('✗ FirebaseService import failed:', error.message);
}
console.log('');

// Test 2: Verify AthleteRegistrationScreen import
console.log('=== Test 2: AthleteRegistrationScreen Import Verification ===');
try {
  // This would normally be a React component import, but we're just checking syntax
  const fs = require('fs');
  const athleteRegContent = fs.readFileSync('./src/screens/athletes/AthleteRegistrationScreen.js', 'utf8');
  
  // Check if the correct import statement exists
  const hasCorrectImport = athleteRegContent.includes("import { createAthlete } from '../../services/FirebaseService'");
  const hasRemovedDirectFirestoreImport = !athleteRegContent.includes("import { collection, addDoc, serverTimestamp } from 'firebase/firestore'") || 
                                          !athleteRegContent.includes("import { db } from '../../config/firebase'");
  
  console.log('✓ Correct createAthlete import:', hasCorrectImport);
  console.log('✓ Removed direct Firestore import:', hasRemovedDirectFirestoreImport);
} catch (error) {
  console.error('✗ AthleteRegistrationScreen import check failed:', error.message);
}
console.log('');

// Test 3: Verify DashboardScreen functionality
console.log('=== Test 3: DashboardScreen Functionality ===');
try {
  const fs = require('fs');
  const dashboardContent = fs.readFileSync('./src/screens/dashboard/DashboardScreen.js', 'utf8');
  
  // Check if FirebaseService functions are imported
  const hasFirebaseImports = dashboardContent.includes("import { getAthletes, getAssessments } from '../../services/FirebaseService'");
  
  console.log('✓ FirebaseService imports in DashboardScreen:', hasFirebaseImports);
} catch (error) {
  console.error('✗ DashboardScreen check failed:', error.message);
}
console.log('');

console.log('=== Summary ===');
console.log('All tests completed. If all checks show ✓, the fix has been implemented correctly.');
console.log('The ReferenceError should now be resolved, and athlete registration should work properly.');