// Firebase Debug Script
import { auth, db } from './src/config/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { COLLECTIONS } from './src/constants/firebase';

console.log('Firebase Debug Info:');
console.log('====================');

// Check if Firebase is properly initialized
if (auth) {
  console.log('✓ Firebase Auth initialized');
  console.log('Current user:', auth.currentUser ? auth.currentUser.email : 'Not signed in');
} else {
  console.log('✗ Firebase Auth not initialized');
}

if (db) {
  console.log('✓ Firestore initialized');
  
  // Test Firestore connection with a simple query
  const testConnection = async () => {
    try {
      console.log('Testing Firestore connection...');
      
      // Try to fetch a small amount of data
      const athletesQuery = query(
        collection(db, COLLECTIONS.ATHLETES), 
        orderBy('createdAt', 'desc'), 
        limit(1)
      );
      
      const snapshot = await getDocs(athletesQuery);
      console.log(`✓ Firestore connection successful. Found ${snapshot.size} recent athletes.`);
      
    } catch (error) {
      console.log('✗ Firestore connection test failed:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', error);
    }
  };
  
  testConnection();
} else {
  console.log('✗ Firestore not initialized');
}

// Export for manual testing if needed
export { auth, db };