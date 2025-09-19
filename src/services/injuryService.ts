import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Injury Types and Interfaces
export type InjuryType = 'muscle' | 'bone' | 'joint' | 'ligament' | 'tendon' | 'other';
export type InjurySeverity = 'minor' | 'moderate' | 'severe' | 'critical';
export type InjuryStatus = 'active' | 'recovering' | 'recovered' | 'chronic';
export type RecoveryStatus = 'on_track' | 'delayed' | 'ahead' | 'at_risk';

export interface Injury {
  id?: string;
  athleteId: string;
  injuryType: InjuryType;
  bodyPart: string;
  description: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  diagnosisDate: Date;
  expectedRecoveryDate?: Date;
  actualRecoveryDate?: Date;
  diagnosis: string;
  symptoms: string[];
  causedBy?: string;
  treatmentPlan?: string;
  restrictions: string[];
  medicalImages?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecoveryMilestone {
  id?: string;
  injuryId: string;
  athleteId: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  isCompleted: boolean;
  isVerified: boolean;
  verifiedBy?: string; // Coach ID
  verificationDate?: Date;
  aiGenerated: boolean;
  createdAt: Date;
}

export interface RecoveryProgress {
  id?: string;
  injuryId: string;
  athleteId: string;
  date: Date;
  painLevel: number; // 1-10 scale
  mobilityLevel: number; // 1-10 scale
  notes: string;
  exercisesCompleted: string[];
  physiotherapySession?: boolean;
  medicationTaken?: string[];
  createdAt: Date;
}

export interface CoachVerification {
  id?: string;
  injuryId: string;
  milestoneId?: string;
  athleteId: string;
  coachId: string;
  coachName: string;
  status: 'cleared' | 'not_ready' | 'needs_attention';
  notes: string;
  recommendedActions?: string[];
  nextCheckupDate?: Date;
  verificationDate: Date;
}

const INJURIES_COLLECTION = 'injuries';
const RECOVERY_MILESTONES_COLLECTION = 'recovery_milestones';
const RECOVERY_PROGRESS_COLLECTION = 'recovery_progress';
const COACH_VERIFICATIONS_COLLECTION = 'coach_verifications';

// Injury CRUD Operations
export const reportInjury = async (injuryData: Omit<Injury, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, INJURIES_COLLECTION), {
      ...injuryData,
      diagnosisDate: Timestamp.fromDate(injuryData.diagnosisDate),
      expectedRecoveryDate: injuryData.expectedRecoveryDate ? Timestamp.fromDate(injuryData.expectedRecoveryDate) : null,
      actualRecoveryDate: injuryData.actualRecoveryDate ? Timestamp.fromDate(injuryData.actualRecoveryDate) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

export const getAthleteInjuries = async (athleteId: string) => {
  try {
    const q = query(
      collection(db, INJURIES_COLLECTION),
      where('athleteId', '==', athleteId)
    );
    
    const snapshot = await getDocs(q);
    const injuries: Injury[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      injuries.push({
        id: doc.id,
        ...data,
        diagnosisDate: data.diagnosisDate.toDate(),
        expectedRecoveryDate: data.expectedRecoveryDate?.toDate(),
        actualRecoveryDate: data.actualRecoveryDate?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Injury);
    });
    
    // Sort by diagnosis date (newest first)
    injuries.sort((a, b) => b.diagnosisDate.getTime() - a.diagnosisDate.getTime());
    
    return { injuries, success: true, error: null };
  } catch (error: any) {
    return { injuries: [], success: false, error: error.message };
  }
};

export const updateInjury = async (injuryId: string, updates: Partial<Injury>) => {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    
    // Convert dates to timestamps
    if (updates.diagnosisDate) {
      updateData.diagnosisDate = Timestamp.fromDate(updates.diagnosisDate);
    }
    if (updates.expectedRecoveryDate) {
      updateData.expectedRecoveryDate = Timestamp.fromDate(updates.expectedRecoveryDate);
    }
    if (updates.actualRecoveryDate) {
      updateData.actualRecoveryDate = Timestamp.fromDate(updates.actualRecoveryDate);
    }
    
    await updateDoc(doc(db, INJURIES_COLLECTION, injuryId), updateData);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Recovery Milestones
export const addRecoveryMilestone = async (milestoneData: Omit<RecoveryMilestone, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, RECOVERY_MILESTONES_COLLECTION), {
      ...milestoneData,
      targetDate: Timestamp.fromDate(milestoneData.targetDate),
      completedDate: milestoneData.completedDate ? Timestamp.fromDate(milestoneData.completedDate) : null,
      verificationDate: milestoneData.verificationDate ? Timestamp.fromDate(milestoneData.verificationDate) : null,
      createdAt: Timestamp.now()
    });
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

export const getRecoveryMilestones = async (injuryId: string) => {
  try {
    const q = query(
      collection(db, RECOVERY_MILESTONES_COLLECTION),
      where('injuryId', '==', injuryId)
    );
    
    const snapshot = await getDocs(q);
    const milestones: RecoveryMilestone[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      milestones.push({
        id: doc.id,
        ...data,
        targetDate: data.targetDate.toDate(),
        completedDate: data.completedDate?.toDate(),
        verificationDate: data.verificationDate?.toDate(),
        createdAt: data.createdAt.toDate()
      } as RecoveryMilestone);
    });
    
    // Sort by target date
    milestones.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
    
    return { milestones, success: true, error: null };
  } catch (error: any) {
    return { milestones: [], success: false, error: error.message };
  }
};

export const updateMilestone = async (milestoneId: string, updates: Partial<RecoveryMilestone>) => {
  try {
    const updateData: any = { ...updates };
    
    if (updates.targetDate) {
      updateData.targetDate = Timestamp.fromDate(updates.targetDate);
    }
    if (updates.completedDate) {
      updateData.completedDate = Timestamp.fromDate(updates.completedDate);
    }
    if (updates.verificationDate) {
      updateData.verificationDate = Timestamp.fromDate(updates.verificationDate);
    }
    
    await updateDoc(doc(db, RECOVERY_MILESTONES_COLLECTION, milestoneId), updateData);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Recovery Progress Tracking
export const addRecoveryProgress = async (progressData: Omit<RecoveryProgress, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, RECOVERY_PROGRESS_COLLECTION), {
      ...progressData,
      date: Timestamp.fromDate(progressData.date),
      createdAt: Timestamp.now()
    });
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

export const getRecoveryProgress = async (injuryId: string) => {
  try {
    const q = query(
      collection(db, RECOVERY_PROGRESS_COLLECTION),
      where('injuryId', '==', injuryId)
    );
    
    const snapshot = await getDocs(q);
    const progress: RecoveryProgress[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      progress.push({
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate()
      } as RecoveryProgress);
    });
    
    // Sort by date (newest first)
    progress.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return { progress, success: true, error: null };
  } catch (error: any) {
    return { progress: [], success: false, error: error.message };
  }
};

// Coach Verification
export const addCoachVerification = async (verificationData: Omit<CoachVerification, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COACH_VERIFICATIONS_COLLECTION), {
      ...verificationData,
      verificationDate: Timestamp.fromDate(verificationData.verificationDate),
      nextCheckupDate: verificationData.nextCheckupDate ? Timestamp.fromDate(verificationData.nextCheckupDate) : null
    });
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

export const getCoachVerifications = async (injuryId: string) => {
  try {
    const q = query(
      collection(db, COACH_VERIFICATIONS_COLLECTION),
      where('injuryId', '==', injuryId)
    );
    
    const snapshot = await getDocs(q);
    const verifications: CoachVerification[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      verifications.push({
        id: doc.id,
        ...data,
        verificationDate: data.verificationDate.toDate(),
        nextCheckupDate: data.nextCheckupDate?.toDate()
      } as CoachVerification);
    });
    
    // Sort by verification date (newest first)
    verifications.sort((a, b) => b.verificationDate.getTime() - a.verificationDate.getTime());
    
    return { verifications, success: true, error: null };
  } catch (error: any) {
    return { verifications: [], success: false, error: error.message };
  }
};

// Helper Functions
export const getInjuryStatusBadge = (injury: Injury): { status: string; color: string; icon: string } => {
  const now = new Date();
  
  if (injury.status === 'recovered') {
    return { status: 'Fit', color: 'bg-green-100 text-green-800 border-green-200', icon: '✅' };
  }
  
  if (injury.status === 'active' || injury.status === 'recovering') {
    // Check if recovery is delayed
    if (injury.expectedRecoveryDate && now > injury.expectedRecoveryDate) {
      return { status: 'At Risk', color: 'bg-red-100 text-red-800 border-red-200', icon: '⚠️' };
    }
    return { status: 'Recovering', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🏥' };
  }
  
  if (injury.status === 'chronic') {
    return { status: 'At Risk', color: 'bg-red-100 text-red-800 border-red-200', icon: '⚠️' };
  }
  
  return { status: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '❓' };
};

export const calculateRecoveryProgress = (injury: Injury, milestones: RecoveryMilestone[]): number => {
  if (milestones.length === 0) return 0;
  
  const completedMilestones = milestones.filter(m => m.isCompleted);
  return Math.round((completedMilestones.length / milestones.length) * 100);
};

export const getRecoveryStatusColor = (status: RecoveryStatus): string => {
  switch (status) {
    case 'on_track': return 'text-green-600 bg-green-50 border-green-200';
    case 'ahead': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'delayed': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'at_risk': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// AI Integration (will call FastAPI backend)
export const generateRecoveryMilestones = async (injury: Injury): Promise<Omit<RecoveryMilestone, 'id' | 'createdAt'>[]> => {
  try {
    const response = await fetch('/api/ai/recovery-milestones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        injuryType: injury.injuryType,
        bodyPart: injury.bodyPart,
        severity: injury.severity,
        description: injury.description,
        diagnosis: injury.diagnosis,
        symptoms: injury.symptoms,
        medicalImages: injury.medicalImages || []
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate milestones');
    }
    
    const data = await response.json();
    
    return data.milestones.map((milestone: any) => ({
      injuryId: injury.id!,
      athleteId: injury.athleteId,
      title: milestone.title,
      description: milestone.description,
      targetDate: new Date(milestone.targetDate),
      isCompleted: false,
      isVerified: false,
      aiGenerated: true
    }));
    
  } catch (error) {
    console.error('Error generating AI milestones:', error);
    // Return fallback milestones
    return getFallbackMilestones(injury);
  }
};

const getFallbackMilestones = (injury: Injury): Omit<RecoveryMilestone, 'id' | 'createdAt'>[] => {
  const baseDate = new Date();
  const milestones = [];
  
  // Week 1: Initial rest and assessment
  milestones.push({
    injuryId: injury.id!,
    athleteId: injury.athleteId,
    title: "Initial Rest Period",
    description: "Complete rest and follow RICE protocol (Rest, Ice, Compression, Elevation)",
    targetDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    isCompleted: false,
    isVerified: false,
    aiGenerated: false
  });
  
  // Week 2: Gentle mobility
  milestones.push({
    injuryId: injury.id!,
    athleteId: injury.athleteId,
    title: "Gentle Mobility Exercises",
    description: "Begin gentle range-of-motion exercises as tolerated",
    targetDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
    isCompleted: false,
    isVerified: false,
    aiGenerated: false
  });
  
  // Week 4: Strength building
  milestones.push({
    injuryId: injury.id!,
    athleteId: injury.athleteId,
    title: "Strength Building Phase",
    description: "Progress to strength and stability exercises",
    targetDate: new Date(baseDate.getTime() + 28 * 24 * 60 * 60 * 1000),
    isCompleted: false,
    isVerified: false,
    aiGenerated: false
  });
  
  return milestones;
};
