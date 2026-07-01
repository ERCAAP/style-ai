import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  initializeAuth,
  // @ts-ignore - getReactNativePersistence exists in RN bundle but missing from TS definitions
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration - Environment variables ile
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
function validateFirebaseConfig(): boolean {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

  if (missingKeys.length > 0) {
    console.error(
      '❌ Firebase configuration is incomplete. Missing environment variables:',
      missingKeys.map(key => `EXPO_PUBLIC_FIREBASE_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`).join(', ')
    );
    console.error('Please create a .env file based on .env.example and add your Firebase credentials.');
    return false;
  }

  return true;
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let initializationError: Error | null = null;

// Initialize Firebase immediately
function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } {
  // If initialization already failed, throw the same error
  if (initializationError) {
    throw initializationError;
  }

  try {
    // Validate configuration first
    if (!validateFirebaseConfig()) {
      initializationError = new Error('Firebase configuration is incomplete. Please check your .env file.');
      throw initializationError;
    }

    // Initialize app if not already done
    if (!appInstance) {
      if (getApps().length === 0) {
        appInstance = initializeApp(firebaseConfig);
      } else {
        appInstance = getApps()[0];
      }
    }

    // Initialize Auth with React Native persistence
    if (!authInstance) {
      try {
        authInstance = initializeAuth(appInstance, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (error: any) {
        // If auth is already initialized, get the existing instance
        if (error.code === 'auth/already-initialized') {
          authInstance = getAuth(appInstance);
        } else {
          console.error('Auth initialization error:', error);
          throw error;
        }
      }
    }

    // Initialize Firestore
    if (!dbInstance) {
      dbInstance = getFirestore(appInstance);
    }

    // Initialize Storage
    if (!storageInstance) {
      storageInstance = getStorage(appInstance);
    }

    return {
      app: appInstance,
      auth: authInstance,
      db: dbInstance,
      storage: storageInstance
    };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Initialize Firebase on module load
let firebaseInstances: { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage };

try {
  firebaseInstances = initializeFirebase();
} catch (error) {
  console.error('Failed to initialize Firebase on module load:', error);
  // Initialize with dummy values to prevent crashes - will retry on first use
  throw error;
}

// Export instances directly (no Proxy needed)
export const app = firebaseInstances.app;
export const auth = firebaseInstances.auth;
export const db = firebaseInstances.db;
export const storage = firebaseInstances.storage;

// Export initialize function for manual re-initialization if needed
export { initializeFirebase };
