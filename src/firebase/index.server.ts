
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This file is intended for use on the server side only.

/**
 * Initializes and returns Firebase services for server-side environments.
 * It ensures that the Firebase app is initialized only once.
 * It first tries to initialize using environment variables (common in hosting environments like Firebase App Hosting)
 * and falls back to the local `firebaseConfig` object if that fails.
 * @returns {{ firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; }} An object containing the initialized Firebase App, Auth, and Firestore SDK instances.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      // In production (e.g., Firebase App Hosting), environment variables are automatically provided.
      firebaseApp = initializeApp();
    } catch (e) {
       if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      // For local development or other environments, use the config object.
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

/**
 * A helper function to get the various Firebase SDKs from a given FirebaseApp instance.
 * @param {FirebaseApp} firebaseApp - The initialized Firebase App instance.
 * @returns {{ firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; }} An object containing the SDK instances.
 */
function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}
