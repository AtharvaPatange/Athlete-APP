import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Example interface for an athlete
export interface Athlete {
  id?: string;
  name: string;
  sport: string;
  age: number;
  email: string;
  performance: {
    speed: number;
    strength: number;
    endurance: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Collection reference
const COLLECTION_NAME = 'athletes';
const athletesRef = collection(db, COLLECTION_NAME);

// Create a new athlete
export const createAthlete = async (athleteData: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(athletesRef, {
      ...athleteData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

// Get all athletes
export const getAllAthletes = async () => {
  try {
    const snapshot = await getDocs(athletesRef);
    const athletes: Athlete[] = [];
    snapshot.forEach((doc) => {
      athletes.push({ id: doc.id, ...doc.data() } as Athlete);
    });
    return { athletes, success: true, error: null };
  } catch (error: any) {
    return { athletes: [], success: false, error: error.message };
  }
};

// Get athletes by sport
export const getAthletesBySport = async (sport: string) => {
  try {
    const q = query(athletesRef, where('sport', '==', sport), orderBy('name'));
    const snapshot = await getDocs(q);
    const athletes: Athlete[] = [];
    snapshot.forEach((doc) => {
      athletes.push({ id: doc.id, ...doc.data() } as Athlete);
    });
    return { athletes, success: true, error: null };
  } catch (error: any) {
    return { athletes: [], success: false, error: error.message };
  }
};

// Update an athlete
export const updateAthlete = async (id: string, updates: Partial<Athlete>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete an athlete
export const deleteAthlete = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
