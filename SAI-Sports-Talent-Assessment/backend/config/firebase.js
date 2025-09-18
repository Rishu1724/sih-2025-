const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, orderBy } = require('firebase/firestore');
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

// Create a compatibility layer for admin SDK-like interface
const createCompatibilityLayer = (firestore) => {
  return {
    collection: (collectionName) => {
      const collectionRef = collection(firestore, collectionName);
      
      return {
        add: async (data) => {
          const docRef = await addDoc(collectionRef, data);
          return { id: docRef.id };
        },
        
        get: async () => {
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
        },
        
        where: (field, operator, value) => {
          const q = query(collectionRef, where(field, operator, value));
          
          return {
            get: async () => {
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
            }
          };
        },
        
        orderBy: (field, direction = 'asc') => {
          const q = query(collectionRef, orderBy(field, direction));
          
          return {
            get: async () => {
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
            }
          };
        },
        
        doc: (docId) => {
          const docRef = doc(firestore, collectionName, docId);
          
          return {
            get: async () => {
              const docSnap = await getDoc(docRef);
              return {
                id: docSnap.id,
                exists: docSnap.exists(),
                data: () => docSnap.data()
              };
            },
            
            update: async (data) => {
              return await updateDoc(docRef, data);
            },
            
            delete: async () => {
              return await deleteDoc(docRef);
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