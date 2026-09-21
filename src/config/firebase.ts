import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { createAuth } from './auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

export const useEmulators = process.env.EXPO_PUBLIC_USE_EMULATORS === 'true';
const config = useEmulators ? {
  apiKey: 'demo-sgo-key', authDomain: 'demo-sgo.firebaseapp.com', projectId: 'demo-sgo',
  storageBucket: 'demo-sgo.appspot.com', appId: '1:123:web:demo', messagingSenderId: '123',
} : {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseReady = Boolean(config.apiKey && config.projectId && config.appId && config.authDomain);
export const storageReady = Boolean(config.storageBucket);

const emulatorRegistry = globalThis as typeof globalThis & {
  __sgoEmulatorsConnected?: boolean;
};

function initializeServices() {
  const existing = getApps().length > 0;
  const app = existing ? getApp() : initializeApp(config);
  const auth = createAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const functions = getFunctions(app, 'southamerica-east1');
  if (useEmulators) {
    const host = process.env.EXPO_PUBLIC_EMULATOR_HOST || '127.0.0.1';
    if (!emulatorRegistry.__sgoEmulatorsConnected) {
      connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(db, host, 8080);
      connectStorageEmulator(storage, host, 9199);
      connectFunctionsEmulator(functions, host, 5001);
      emulatorRegistry.__sgoEmulatorsConnected = true;
    }
  }
  return { auth, db, storage, functions };
}
const services = firebaseReady ? initializeServices() : null;
export function firebase() {
  if (!services) throw new Error('Configure o Firebase no arquivo .env para usar o SGO. Consulte o README.');
  return services;
}
