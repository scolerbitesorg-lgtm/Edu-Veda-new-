import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Default project configuration fallback
const defaultConfig = {
  projectId: 'acoustic-energy-65p7n',
  appId: '1:577865334119:web:3d8772a6c51ffd441303c2',
  apiKey: 'edu-veda-public-client-key',
  authDomain: 'acoustic-energy-65p7n.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-remixeduveda-8ae4aac6-f0b5-4ed8-9dda-cd902e1b5c20',
  storageBucket: 'acoustic-energy-65p7n.firebasestorage.app',
  messagingSenderId: '577865334119',
};

const apiKeyEnv = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();

const firebaseConfig = {
  apiKey: apiKeyEnv || defaultConfig.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain).trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId).trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket).trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId).trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || defaultConfig.appId).trim(),
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '').trim(),
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_DATABASE_ID || defaultConfig.firestoreDatabaseId || '(default)').trim(),
};

let appInstance: FirebaseApp;
try {
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('Firebase initializeApp fallback:', e);
  appInstance = !getApps().length ? initializeApp({ projectId: defaultConfig.projectId, apiKey: defaultConfig.apiKey, appId: defaultConfig.appId }) : getApp();
}

export const app = appInstance;

const dbId = firebaseConfig.firestoreDatabaseId;
let firestoreInstance: Firestore;
try {
  firestoreInstance = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
} catch (e) {
  console.warn('Firestore fallback to default db:', e);
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;

let authInstance: Auth;
try {
  authInstance = getAuth(app);
} catch (e) {
  console.warn('Auth initialization fallback:', e);
  authInstance = getAuth(app);
}

export const auth = authInstance;

let storageInstance: FirebaseStorage;
try {
  storageInstance = getStorage(app);
} catch (e) {
  console.warn('Storage initialization fallback:', e);
  storageInstance = getStorage(app);
}

export const storage = storageInstance;

// Safe Analytics Initialization
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isSupported()
    .then(supported => {
      if (supported) {
        getAnalytics(app);
      }
    })
    .catch(() => {
      // Ignore analytics initialization failure
    });
}

let isConnected = true;

// Validate connection to Firestore
export async function testConnection(): Promise<boolean> {
  try {
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ]);
    isConnected = true;
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is offline. Operating in offline-cached mode.');
      isConnected = false;
      return false;
    }
    isConnected = true;
    return true;
  }
}

export function getIsOnline(): boolean {
  return isConnected;
}

testConnection().catch(() => {});

export default app;
