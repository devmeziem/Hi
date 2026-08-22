import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0135161700",
  appId: "1:166707266012:web:a00cf6debee848db97c40c",
  storageBucket: "gen-lang-client-0135161700.firebasestorage.app",
  apiKey: "AIzaSyDajoMYBcuzePAnf8B4dNNNeuxmlU2IfhI",
  authDomain: "gen-lang-client-0135161700.firebaseapp.com",
  messagingSenderId: "166707266012",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app, "ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e");
export const auth: Auth = getAuth(app);
export const isFirebaseEnabled = true;
