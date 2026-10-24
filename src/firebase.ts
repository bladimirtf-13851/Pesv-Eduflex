import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseAppletConfig from '../firebase-applet-config.json';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config if present
export const db = firebaseConfig.firestoreDatabaseId
  ? initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export default app;

