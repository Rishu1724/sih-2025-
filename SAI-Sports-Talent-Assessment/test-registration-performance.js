/**
 * Performance test utility for athlete registration
 * 
 * This script measures the time it takes to register an athlete
 * and provides metrics for optimization.
 */

// Mock athlete data for testing
const mockAthleteData = {
  name: 'Performance Test Athlete',
  email: 'test@example.com',
  phone: '1234567890',
  age: 20,
  gender: 'male',
  state: 'delhi',
  district: 'New Delhi',
  address: 'Test Address',
  emergencyContact: {
    name: 'Test Emergency Contact',
    phone: '0987654321',
    relationship: 'parent'
  },
  sportsBackground: 'Test sports background',
  medicalHistory: 'No medical history',
  ageGroup: 'Senior',
  sport: 'General',
  bestScores: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Performance test function
async function testRegistrationPerformance(createAthleteFunction, iterations = 5) {
  console.log('Starting performance test for athlete registration...');
  console.log(`Running ${iterations} iterations...\n`);
  
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    console.log(`Iteration ${i + 1}...`);
    
    const startTime = performance.now();
    
    try {
      // Call the createAthlete function
      const result = await createAthleteFunction(mockAthleteData);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      times.push(duration);
      
      console.log(`  Success: ${result.id || 'No ID'}`);
      console.log(`  Time: ${duration.toFixed(2)}ms\n`);
      
      // Add a small delay between iterations to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      times.push(duration);
      
      console.error(`  Error: ${error.message}`);
      console.log(`  Time: ${duration.toFixed(2)}ms\n`);
    }
  }
  
  // Calculate statistics
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  console.log('=== PERFORMANCE RESULTS ===');
  console.log(`Average time: ${avgTime.toFixed(2)}ms`);
  console.log(`Fastest time: ${minTime.toFixed(2)}ms`);
  console.log(`Slowest time: ${maxTime.toFixed(2)}ms`);
  console.log(`Total time: ${times.reduce((a, b) => a + b, 0).toFixed(2)}ms`);
  console.log('===========================\n');
  
  return {
    average: avgTime,
    min: minTime,
    max: maxTime,
    total: times.reduce((a, b) => a + b, 0),
    iterations: times.length
  };
}

// Export for use in other modules
module.exports = {
  testRegistrationPerformance,
  mockAthleteData
};

// Example usage (uncomment to run):
/*
// Import the actual createAthlete function
const { createAthlete } = require('./src/services/FirebaseService');

// Run the performance test
testRegistrationPerformance(createAthlete, 5)
  .then(results => {
    console.log('Performance test completed successfully');
    // You can add additional logic here based on the results
  })
  .catch(error => {
    console.error('Performance test failed:', error);
  });
*/