import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import firebaseConfig from '../../firebase-applet-config.json';

// Ensure the config is valid before initializing
if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.error("CRITICAL: Firebase apiKey is missing in firebase-applet-config.json");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Persistence is handled dynamically in AuthScreen.tsx
// setPersistence(auth, browserLocalPersistence).catch(console.error);

export { app, auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, collection, addDoc, getDocs, query, where };

export interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      providerInfo: auth.currentUser?.providerData.map(p => p.providerId) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (errInfo.error.includes('the client is offline')) return;
  throw new Error(JSON.stringify(errInfo));
}
