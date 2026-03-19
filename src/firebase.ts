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
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyC4TjF1yyehKnBlP-8dNqMRTgzz9TlNduQ',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'sopa-de-letras-online-venz.firebaseapp.com',
  databaseURL:
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? 'https://sopa-de-letras-online-venz-default-rtdb.firebaseio.com/',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'sopa-de-letras-online-venz',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'sopa-de-letras-online-venz.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '334485345606',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:334485345606:web:375669665a6e9b35b00147',
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
