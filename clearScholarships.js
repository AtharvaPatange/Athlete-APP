// Script to clear all existing scholarships from Firebase
// Run this once to clean the database: node clearScholarships.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Add your Firebase config here or use environment variables
  // This should match your firebase.ts config
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