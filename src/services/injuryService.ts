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
  needsCoachVerification?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | null;
  verifiedBy?: string; // Coach ID
  verifiedAt?: Date;
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
    // Check if athlete has previous injuries
    const previousInjuriesQuery = query(
      collection(db, INJURIES_COLLECTION),
      where('athleteId', '==', injuryData.athleteId)
    );
    
    const previousInjuriesSnapshot = await getDocs(previousInjuriesQuery);
    const hasPreviousInjuries = !previousInjuriesSnapshot.empty;
    
    // If athlete has previous injuries, this new injury needs coach verification
    const needsVerification = hasPreviousInjuries;
    
    const docRef = await addDoc(collection(db, INJURIES_COLLECTION), {
      ...injuryData,
      needsCoachVerification: needsVerification,
      verificationStatus: needsVerification ? 'pending' : null,
      diagnosisDate: Timestamp.fromDate(injuryData.diagnosisDate),
      expectedRecoveryDate: injuryData.expectedRecoveryDate ? Timestamp.fromDate(injuryData.expectedRecoveryDate) : null,
      actualRecoveryDate: injuryData.actualRecoveryDate ? Timestamp.fromDate(injuryData.actualRecoveryDate) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return { id: docRef.id, success: true, error: null, needsVerification };
  } catch (error: any) {
    return { id: null, success: false, error: error.message, needsVerification: false };
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

// Verify injury by coach
export const verifyInjuryByCoach = async (
  injuryId: string, 
  coachId: string, 
  status: 'verified' | 'rejected',
  notes?: string
) => {
  try {
    const injuryRef = doc(db, INJURIES_COLLECTION, injuryId);
    
    await updateDoc(injuryRef, {
      verificationStatus: status,
      verifiedBy: coachId,
      verifiedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Also add to coach verifications collection for record keeping
    const verificationData: Omit<CoachVerification, 'id'> = {
      injuryId,
      athleteId: '', // Will need to get this from the injury
      coachId,
      coachName: '', // Will need to get coach name
      status: status === 'verified' ? 'cleared' : 'needs_attention',
      notes: notes || '',
      verificationDate: new Date()
    };
    
    await addCoachVerification(verificationData);
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get injuries that need coach verification
export const getInjuriesNeedingVerification = async (coachRegion?: string) => {
  try {
    let q = query(
      collection(db, INJURIES_COLLECTION),
      where('needsCoachVerification', '==', true),
      where('verificationStatus', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const injuries: (Injury & { athleteName?: string })[] = [];
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const injury: Injury & { athleteName?: string } = {
        id: docSnapshot.id,
        athleteId: data.athleteId,
        injuryType: data.injuryType,
        bodyPart: data.bodyPart,
        description: data.description,
        severity: data.severity,
        status: data.status,
        diagnosisDate: data.diagnosisDate.toDate(),
        expectedRecoveryDate: data.expectedRecoveryDate?.toDate(),
        actualRecoveryDate: data.actualRecoveryDate?.toDate(),
        diagnosis: data.diagnosis || '',
        symptoms: data.symptoms || [],
        causedBy: data.causedBy,
        treatmentPlan: data.treatmentPlan || '',
        restrictions: data.restrictions || [],
        medicalImages: data.medicalImages || [],
        needsCoachVerification: data.needsCoachVerification,
        verificationStatus: data.verificationStatus,
        verifiedBy: data.verifiedBy,
        verifiedAt: data.verifiedAt?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
      
      // Get athlete name
      try {
        const athleteDoc = await getDoc(doc(db, 'users', data.athleteId));
        if (athleteDoc.exists()) {
          const athleteData = athleteDoc.data();
          injury.athleteName = athleteData.name;
          
          // If coach region is specified, filter by athlete region
          if (coachRegion && athleteData.region !== coachRegion) {
            continue;
          }
        }
      } catch (error) {
        console.error('Error getting athlete data:', error);
      }
      
      injuries.push(injury);
    }
    
    return { injuries, success: true, error: null };
  } catch (error: any) {
    return { injuries: [], success: false, error: error.message };
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

// Coach-specific functions to manage multiple athletes' injuries
export const getCoachAssignedAthletesInjuries = async (athleteIds: string[]) => {
  try {
    if (athleteIds.length === 0) {
      return { athleteInjuries: [], success: true, error: null };
    }

    // Firebase 'in' operator has a limit of 10 items
    const chunkedIds = [];
    for (let i = 0; i < athleteIds.length; i += 10) {
      chunkedIds.push(athleteIds.slice(i, i + 10));
    }

    const allInjuries: { athleteId: string; injuries: Injury[] }[] = [];

    for (const chunk of chunkedIds) {
      // Simplified query to avoid composite index requirement
      const q = query(
        collection(db, INJURIES_COLLECTION),
        where('athleteId', 'in', chunk)
      );

      const snapshot = await getDocs(q);
      const chunkInjuries: { [key: string]: Injury[] } = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter for active/recovering injuries in code instead of query
        if (data.status === 'active' || data.status === 'recovering') {
          const injury: Injury = {
            id: doc.id,
            athleteId: data.athleteId,
            injuryType: data.injuryType,
            bodyPart: data.bodyPart,
            description: data.description,
            severity: data.severity,
            status: data.status,
            diagnosis: data.diagnosis,
            symptoms: data.symptoms,
            causedBy: data.causedBy,
            treatmentPlan: data.treatmentPlan,
            restrictions: data.restrictions,
            medicalImages: data.medicalImages,
            diagnosisDate: data.diagnosisDate.toDate(),
            expectedRecoveryDate: data.expectedRecoveryDate?.toDate(),
            actualRecoveryDate: data.actualRecoveryDate?.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          };

          if (!chunkInjuries[injury.athleteId]) {
            chunkInjuries[injury.athleteId] = [];
          }
          chunkInjuries[injury.athleteId].push(injury);
        }
      });

      // Convert to array format
      Object.keys(chunkInjuries).forEach(athleteId => {
        allInjuries.push({ athleteId, injuries: chunkInjuries[athleteId] });
      });
    }

    return { athleteInjuries: allInjuries, success: true, error: null };
  } catch (error: any) {
    console.error("Error fetching coach assigned athletes injuries:", error);
    return { athleteInjuries: [], success: false, error: error.message };
  }
};

// Get all active injuries in a region for coach assignment
export const getRegionalActiveInjuries = async (region: string) => {
  try {
    // Get all injuries first, then filter
    const q = query(collection(db, INJURIES_COLLECTION));
    const snapshot = await getDocs(q);
    
    const regionalInjuries: { athleteId: string; injuries: Injury[] }[] = [];
    const injuriesByAthlete: { [key: string]: Injury[] } = {};

    // Get athlete regions to filter
    const athleteIds = new Set<string>();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'active' || data.status === 'recovering') {
        athleteIds.add(data.athleteId);
      }
    });

    // Get athlete data to check regions
    const athleteRegions: { [key: string]: string } = {};
    if (athleteIds.size > 0) {
      const athleteIdsArray = Array.from(athleteIds);
      
      // Query in chunks due to Firebase 'in' limit
      for (let i = 0; i < athleteIdsArray.length; i += 10) {
        const chunk = athleteIdsArray.slice(i, i + 10);
        const athleteQuery = query(
          collection(db, 'users'),
          where('__name__', 'in', chunk)
        );
        const athleteSnapshot = await getDocs(athleteQuery);
        
        athleteSnapshot.forEach((doc) => {
          const data = doc.data();
          athleteRegions[doc.id] = data.region;
        });
      }
    }

    // Now filter injuries by region and status
    snapshot.forEach((doc) => {
      const data = doc.data();
      if ((data.status === 'active' || data.status === 'recovering') && 
          athleteRegions[data.athleteId] === region) {
        
        const injury: Injury = {
          id: doc.id,
          athleteId: data.athleteId,
          injuryType: data.injuryType,
          bodyPart: data.bodyPart,
          description: data.description,
          severity: data.severity,
          status: data.status,
          diagnosis: data.diagnosis,
          symptoms: data.symptoms,
          causedBy: data.causedBy,
          treatmentPlan: data.treatmentPlan,
          restrictions: data.restrictions,
          medicalImages: data.medicalImages,
          diagnosisDate: data.diagnosisDate.toDate(),
          expectedRecoveryDate: data.expectedRecoveryDate?.toDate(),
          actualRecoveryDate: data.actualRecoveryDate?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        };

        if (!injuriesByAthlete[injury.athleteId]) {
          injuriesByAthlete[injury.athleteId] = [];
        }
        injuriesByAthlete[injury.athleteId].push(injury);
      }
    });

    // Convert to array format
    Object.keys(injuriesByAthlete).forEach(athleteId => {
      regionalInjuries.push({ athleteId, injuries: injuriesByAthlete[athleteId] });
    });

    return { regionalInjuries, success: true, error: null };
  } catch (error: any) {
    console.error("Error fetching regional injuries:", error);
    return { regionalInjuries: [], success: false, error: error.message };
  }
};

// Get achievements and challenge data for multiple athletes
export const getAthleteAchievements = async (athleteIds: string[]) => {
  try {
    if (athleteIds.length === 0) {
      return { achievements: [], success: true, error: null };
    }

    const achievementsData: { [key: string]: any } = {};

    // Query in chunks due to Firebase 'in' limit
    for (let i = 0; i < athleteIds.length; i += 10) {
      const chunk = athleteIds.slice(i, i + 10);
      
      // Get challenges completed by these athletes
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('participants', 'array-contains-any', chunk)
      );
      
      const challengesSnapshot = await getDocs(challengesQuery);
      
      challengesSnapshot.forEach((doc) => {
        const challengeData = doc.data();
        
        // Process each participant in this challenge
        chunk.forEach(athleteId => {
          if (challengeData.participants && challengeData.participants.includes(athleteId)) {
            if (!achievementsData[athleteId]) {
              achievementsData[athleteId] = {
                totalChallenges: 0,
                completedChallenges: 0,
                totalPoints: 0,
                achievements: [],
                recentActivity: []
              };
            }
            
            achievementsData[athleteId].totalChallenges += 1;
            
            // Check if athlete completed this challenge
            if (challengeData.completedBy && challengeData.completedBy[athleteId]) {
              achievementsData[athleteId].completedChallenges += 1;
              achievementsData[athleteId].totalPoints += challengeData.points || 0;
              achievementsData[athleteId].achievements.push({
                id: doc.id,
                title: challengeData.title,
                points: challengeData.points || 0,
                completedAt: challengeData.completedBy[athleteId].completedAt || challengeData.createdAt,
                category: challengeData.category || 'General'
              });
            }
            
            // Add to recent activity
            achievementsData[athleteId].recentActivity.push({
              type: 'challenge',
              title: challengeData.title,
              date: challengeData.createdAt,
              status: challengeData.completedBy && challengeData.completedBy[athleteId] ? 'completed' : 'active'
            });
          }
        });
      });

      // Get user quest/achievement data
      const usersQuery = query(
        collection(db, 'users'),
        where('__name__', 'in', chunk)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const athleteId = doc.id;
        
        if (!achievementsData[athleteId]) {
          achievementsData[athleteId] = {
            totalChallenges: 0,
            completedChallenges: 0,
            totalPoints: 0,
            achievements: [],
            recentActivity: []
          };
        }
        
        // Add user-level achievements
        if (userData.achievements) {
          achievementsData[athleteId].achievements = [
            ...achievementsData[athleteId].achievements,
            ...userData.achievements
          ];
        }
        
        // Add tier/level information
        if (userData.current_tier) {
          achievementsData[athleteId].currentTier = userData.current_tier;
          achievementsData[athleteId].tierProgress = userData.tier_progress || 0;
        }
        
        // Add total points from user profile
        if (userData.total_points) {
          achievementsData[athleteId].totalPoints += userData.total_points;
        }
      });
    }

    return { achievements: achievementsData, success: true, error: null };
  } catch (error: any) {
    console.error("Error fetching athlete achievements:", error);
    return { achievements: {}, success: false, error: error.message };
  }
};

// Get recovery data for multiple athletes
export const getMultipleAthleteRecoveryData = async (injuryIds: string[]) => {
  try {
    if (injuryIds.length === 0) {
      return { recoveryData: [], success: true, error: null };
    }

    const recoveryData: {
      injuryId: string;
      milestones: RecoveryMilestone[];
      progress: RecoveryProgress[];
    }[] = [];

    for (const injuryId of injuryIds) {
      const [milestonesResult, progressResult] = await Promise.all([
        getRecoveryMilestones(injuryId),
        getRecoveryProgress(injuryId)
      ]);

      recoveryData.push({
        injuryId,
        milestones: milestonesResult.success ? milestonesResult.milestones : [],
        progress: progressResult.success ? progressResult.progress : []
      });
    }

    return { recoveryData, success: true, error: null };
  } catch (error: any) {
    return { recoveryData: [], success: false, error: error.message };
  }
};

// Get athletes requiring coach verification
export const getAthletesRequestingVerification = async (athleteIds: string[]) => {
  try {
    if (athleteIds.length === 0) {
      return { athletes: [], success: true, error: null };
    }

    // Firebase 'in' operator has a limit of 10 items
    const chunkedIds = [];
    for (let i = 0; i < athleteIds.length; i += 10) {
      chunkedIds.push(athleteIds.slice(i, i + 10));
    }

    const athletes: any[] = [];

    for (const chunk of chunkedIds) {
      const q = query(
        collection(db, 'users'),
        where('__name__', 'in', chunk),
        where('recovery_verification_requested', '==', true)
      );

      const snapshot = await getDocs(q);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        athletes.push({
          id: doc.id,
          name: data.name,
          recovery_verification_requested: data.recovery_verification_requested,
          coach_verification_status: data.coach_verification_status,
          verification_request_date: data.verification_request_date?.toDate()
        });
      });
    }

    return { athletes, success: true, error: null };
  } catch (error: any) {
    return { athletes: [], success: false, error: error.message };
  }
};
