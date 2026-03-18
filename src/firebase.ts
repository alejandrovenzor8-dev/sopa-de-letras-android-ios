import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// To set up Firebase:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project
// 3. Add a web app and copy the config below
// 4. Enable "Realtime Database" in the Firebase console
// 5. Set database rules to allow read/write during development:
//    { "rules": { ".read": true, ".write": true } }
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  databaseURL: 'YOUR_DATABASE_URL',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
