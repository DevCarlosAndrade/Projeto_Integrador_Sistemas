import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDetX8jiTv8_AVynx_yKKa7-uAq1912mfY",
  authDomain: "query-sniffer.firebaseapp.com",
  projectId: "query-sniffer",
  storageBucket: "query-sniffer.firebasestorage.app",
  messagingSenderId: "523963142552",
  appId: "1:523963142552:web:58dc96aecfcee57c705bed",
  measurementId: "G-QCB403EZ08"
};


console.log(" API KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);