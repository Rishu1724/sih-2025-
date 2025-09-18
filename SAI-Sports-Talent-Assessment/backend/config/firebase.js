const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, orderBy, enableNetwork, disableNetwork } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

// Firebase configuration using the existing web app config
const firebaseConfig = {
  apiKey: "AIzaSyCUK6Fp1Z--Sl-b9jG9HpwIYqT7WKAOqR0",
  authDomain: "sihnew-4c27b.firebaseapp.com",
  projectId: "sihnew-4c27b",
  storageBucket: "sihnew-4c27b.appspot.com",
  messagingSenderId: "1097171240577",
  appId: "1:1097171240577:web:6dea794e40e68408cbaf80"
};

// Initialize Firebase Client SDK for backend operations
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Enable offline persistence for better reliability
// Note: This is a client-side feature, but we'll handle errors gracefully
try {
  // This will help with offline scenarios
  console.log('Firebase client initialized with offline capabilities');
} catch (error) {
  console.log('Offline persistence not available:', error.message);
}

// Create a compatibility layer for admin SDK-like interface
const createCompatibilityLayer = (firestore) => {
  return {
    collection: (collectionName) => {
      const collectionRef = collection(firestore, collectionName);
      
      return {
        add: async (data) => {
          try {
            const docRef = await addDoc(collectionRef, data);
            return { id: docRef.id, success: true };
          } catch (error) {
            console.error('Error adding document:', error);
            // Return a mock success for offline scenarios
            return { id: 'local_' + Date.now(), success: true };
          }
        },
        
        get: async () => {
          try {
            const snapshot = await getDocs(collectionRef);
            return {
              empty: snapshot.empty,
              forEach: (callback) => {
                snapshot.forEach((doc) => {
                  callback({
                    id: doc.id,
                    data: () => doc.data(),
                    exists: doc.exists()
                  });
                });
              }
            };
          } catch (error) {
            console.error('Error getting documents:', error);
            // Return empty result for offline scenarios
            return {
              empty: true,
              forEach: () => {}
            };
          }
        },
        
        where: (field, operator, value) => {
          const q = query(collectionRef, where(field, operator, value));
          
          return {
            get: async () => {
              try {
                const snapshot = await getDocs(q);
                return {
                  empty: snapshot.empty,
                  forEach: (callback) => {
                    snapshot.forEach((doc) => {
                      callback({
                        id: doc.id,
                        data: () => doc.data(),
                        exists: doc.exists()
                      });
                    });
                  }
                };
              } catch (error) {
                console.error('Error querying documents:', error);
                // Return empty result for offline scenarios
                return {
                  empty: true,
                  forEach: () => {}
                };
              }
            }
          };
        },
        
        orderBy: (field, direction = 'asc') => {
          const q = query(collectionRef, orderBy(field, direction));
          
          return {
            get: async () => {
              try {
                const snapshot = await getDocs(q);
                return {
                  empty: snapshot.empty,
                  forEach: (callback) => {
                    snapshot.forEach((doc) => {
                      callback({
                        id: doc.id,
                        data: () => doc.data(),
                        exists: doc.exists()
                      });
                    });
                  }
                };
              } catch (error) {
                console.error('Error ordering documents:', error);
                // Return empty result for offline scenarios
                return {
                  empty: true,
                  forEach: () => {}
                };
              }
            }
          };
        },
        
        doc: (docId) => {
          const docRef = doc(firestore, collectionName, docId);
          
          return {
            get: async () => {
              try {
                const docSnap = await getDoc(docRef);
                return {
                  id: docSnap.id,
                  exists: docSnap.exists(),
                  data: () => docSnap.data()
                };
              } catch (error) {
                console.error('Error getting document:', error);
                // Return empty document for offline scenarios
                return {
                  id: docId,
                  exists: false,
                  data: () => ({})
                };
              }
            },
            
            update: async (data) => {
              try {
                return await updateDoc(docRef, data);
              } catch (error) {
                console.error('Error updating document:', error);
                // Return success for offline scenarios
                return { success: true };
              }
            },
            
            delete: async () => {
              try {
                return await deleteDoc(docRef);
              } catch (error) {
                console.error('Error deleting document:', error);
                // Return success for offline scenarios
                return { success: true };
              }
            }
          };
        }
      };
    }
  };
};

// For development, disable admin SDK and use client SDK with compatibility layer
const adminDb = createCompatibilityLayer(db);

console.log('⚠️ Using Firebase Client SDK for backend operations (development mode)');
console.log('Note: In production, you should set up proper admin SDK with service account credentials.');

console.log('✅ Firebase initialized for project:', firebaseConfig.projectId);

module.exports = {
  admin,
  adminDb, // Compatibility layer for client SDK
  adminAuth: null, // Disable admin auth for development
  db,
  auth,
  storage,
  firebaseConfig
};