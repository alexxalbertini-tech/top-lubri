import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK
let app;
try {
  if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === 'TODO_KEYHERE') {
    throw new Error("Invalid or missing Firebase configuration");
  }
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.error("Firebase initialization failed:", e);
  app = initializeApp({ apiKey: "invalid", authDomain: "invalid", projectId: "invalid", appId: "invalid" });
}

export const auth = getAuth(app);

// Forçar persistência local para evitar deslogar acidentalmente
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Initialize Firestore with robust database ID handling
export const db = (firebaseConfig as any)?.firestoreDatabaseId && (firebaseConfig as any)?.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

export interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Don't throw if it's just an offline message during a non-critical operation
  if (errInfo.error.includes('the client is offline')) {
    return;
  }
  throw new Error(JSON.stringify(errInfo));
}
