import { initializeApp } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';

// To set up Firebase:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project
// 3. Add a web app and copy the config below
// 4. Enable "Realtime Database" in the Firebase console
// 5. Set database rules to allow read/write during development:
//    { "rules": { ".read": true, ".write": true } }
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'YOUR_AUTH_DOMAIN',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? 'YOUR_DATABASE_URL',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'YOUR_STORAGE_BUCKET',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'YOUR_MESSAGING_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'YOUR_APP_ID',
};

const isMissingConfig = Object.values(firebaseConfig).some(
  (value) => !value || value.startsWith('YOUR_'),
);

let db: Database | null = null;

if (!isMissingConfig) {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} else {
  console.warn(
    'Firebase no configurado. Completa src/firebase.ts o define EXPO_PUBLIC_FIREBASE_* para habilitar multijugador.',
  );
}

export { db };
