// Script to clear all existing scholarships from Firebase
// Run this once to clean the database: node clearScholarships.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCTRH5huTOOkL9rFwz2exMgf4ebeeND6eY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "athlete-app-c2dbd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "athlete-app-c2dbd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "athlete-app-c2dbd.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "404028531016",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:404028531016:web:df4623cce49f9a921ad37d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-935SMPR49R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearAllScholarships() {
  try {
    console.log('🧹 Clearing all existing scholarships...');
    
    const scholarshipsRef = collection(db, 'scholarships');
    const snapshot = await getDocs(scholarshipsRef);
    
    console.log(`Found ${snapshot.docs.length} scholarships to remove`);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log('✅ All scholarships cleared successfully!');
    console.log('📝 Now only admin-created scholarships will appear in the dashboard.');
    
  } catch (error) {
    console.error('❌ Error clearing scholarships:', error);
  }
}

clearAllScholarships();