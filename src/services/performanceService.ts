import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { onTrainingSessionAdded } from './questProgressService';

// Training Session Interface
export interface TrainingSession {
  id?: string;
  athleteId: string;
  date: Date;
  duration: number; // in minutes
  intensity: 'low' | 'medium' | 'high' | 'peak';
  sport: string; // Keep for backward compatibility
  exerciseType: string;
  category: string; // New: 'cardio' | 'strength' | 'flexibility' | 'coordination'
  notes?: string;
  caloriesBurned?: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Cardio specific fields
  distance?: number; // in km
  speed?: number; // in km/h
  
  // Strength specific fields
  sets?: number;
  reps?: number;
  weight?: number; // in kg
  restTime?: number; // in seconds
  
  // Flexibility specific fields
  flexibilityType?: string;
  targetAreas?: string[];
  
  // Coordination specific fields
  skillLevel?: string;
  coordinationType?: string;
  accuracy?: number; // percentage 0-100
}

// Coach Feedback Interface
export interface CoachFeedback {
  id?: string;
  athleteId: string;
  coachId: string;
  coachName: string;
  sessionId?: string;
  feedback: string;
  rating: number; // 1-5 stars
  recommendations?: string;
  focusAreas?: string[];
  createdAt: Date;
}

// Performance Summary Interface
export interface PerformanceSummary {
  athleteId: string;
  period: 'week' | 'month' | 'year';
  totalSessions: number;
  totalDuration: number;
  totalDistance: number;
  avgIntensity: number;
  periodStart: Date;
  periodEnd: Date;
  lastUpdated: Date;
}

const TRAINING_COLLECTION = 'training_sessions';
const FEEDBACK_COLLECTION = 'coach_feedback';
const SUMMARY_COLLECTION = 'performance_summaries';

// Training Session CRUD Operations
export const createTrainingSession = async (sessionData: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, TRAINING_COLLECTION), {
      ...sessionData,
      date: Timestamp.fromDate(sessionData.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Update performance summary after adding session
    await updatePerformanceSummary(sessionData.athleteId);
    
    // Create full session object for quest tracking
    const fullSession: TrainingSession = {
      id: docRef.id,
      ...sessionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Trigger quest progress update
    try {
      const questResult = await onTrainingSessionAdded(sessionData.athleteId, fullSession);
      if (questResult.success && questResult.questUpdates.length > 0) {
        console.log(`Quest progress updated for ${questResult.questUpdates.length} quests`);
      }
    } catch (questError) {
      console.error('Error updating quest progress:', questError);
      // Don't fail the session creation if quest update fails
    }
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

export const getTrainingSessions = async (athleteId: string, limitCount: number = 20) => {
  try {
    console.log('🔍 Fetching training sessions for athlete:', athleteId);
    
    // Query by athleteId (matches your Firebase structure)
    const q = query(
      collection(db, TRAINING_COLLECTION),
      where('athleteId', '==', athleteId)
    );
    
    const snapshot = await getDocs(q);
    const sessions: TrainingSession[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📋 Found session:`, {
        sport: data.sport,
        exerciseType: data.exerciseType,
        distance: data.distance,
        date: data.date?.toDate?.() || data.date
      });
      
      sessions.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
      } as TrainingSession);
    });
    
    console.log('📊 Total sessions found:', sessions.length);
    
    // Sort by date in JavaScript instead of Firestore
    sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Apply limit in JavaScript
    const limitedSessions = sessions.slice(0, limitCount);
    
    return { sessions: limitedSessions, success: true, error: null };
  } catch (error: any) {
    console.error('❌ Error fetching training sessions:', error);
    return { sessions: [], success: false, error: error.message };
  }
};

export const getSessionsByDateRange = async (
  athleteId: string, 
  startDate: Date, 
  endDate: Date
) => {
  try {
    // Simplified query - just filter by athleteId first
    const q = query(
      collection(db, TRAINING_COLLECTION),
      where('athleteId', '==', athleteId)
    );
    
    const snapshot = await getDocs(q);
    const sessions: TrainingSession[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const sessionDate = data.date.toDate();
      
      // Filter by date range in JavaScript
      if (sessionDate >= startDate && sessionDate <= endDate) {
        sessions.push({
          id: doc.id,
          ...data,
          date: sessionDate,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as TrainingSession);
      }
    });
    
    // Sort by date in JavaScript
    sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return { sessions, success: true, error: null };
  } catch (error: any) {
    return { sessions: [], success: false, error: error.message };
  }
};

// Coach Feedback Operations
export const addCoachFeedback = async (feedbackData: Omit<CoachFeedback, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), {
      ...feedbackData,
      createdAt: Timestamp.now()
    });
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

export const getCoachFeedback = async (athleteId: string) => {
  try {
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      where('athleteId', '==', athleteId)
    );
    
    const snapshot = await getDocs(q);
    const feedback: CoachFeedback[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      feedback.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate()
      } as CoachFeedback);
    });
    
    // Sort by date in JavaScript instead of Firestore
    feedback.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return { feedback, success: true, error: null };
  } catch (error: any) {
    return { feedback: [], success: false, error: error.message };
  }
};

// Performance Analytics
export const calculateWeeklyStats = (sessions: TrainingSession[]) => {
  const weeklyData: { [key: string]: any } = {};
  
  sessions.forEach(session => {
    const weekKey = getWeekKey(session.date);
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        week: weekKey,
        sessions: 0,
        totalDuration: 0,
        totalDistance: 0,
        intensitySum: 0,
        date: session.date
      };
    }
    
    weeklyData[weekKey].sessions += 1;
    weeklyData[weekKey].totalDuration += session.duration;
    weeklyData[weekKey].totalDistance += session.distance || 0;
    weeklyData[weekKey].intensitySum += getIntensityValue(session.intensity);
  });
  
  return Object.values(weeklyData).map(week => ({
    ...week,
    avgIntensity: week.intensitySum / week.sessions
  }));
};

export const calculateMonthlyStats = (sessions: TrainingSession[]) => {
  const monthlyData: { [key: string]: any } = {};
  
  sessions.forEach(session => {
    const monthKey = getMonthKey(session.date);
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        sessions: 0,
        totalDuration: 0,
        totalDistance: 0,
        intensitySum: 0,
        date: session.date
      };
    }
    
    monthlyData[monthKey].sessions += 1;
    monthlyData[monthKey].totalDuration += session.duration;
    monthlyData[monthKey].totalDistance += session.distance || 0;
    monthlyData[monthKey].intensitySum += getIntensityValue(session.intensity);
  });
  
  return Object.values(monthlyData).map(month => ({
    ...month,
    avgIntensity: month.intensitySum / month.sessions
  }));
};

// Helper Functions
const getWeekKey = (date: Date): string => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  return startOfWeek.toISOString().split('T')[0];
};

const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getIntensityValue = (intensity: string): number => {
  switch (intensity) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    case 'peak': return 4;
    default: return 2;
  }
};

// Performance Summary (for caching)
const updatePerformanceSummary = async (athleteId: string) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get weekly sessions
    const weekResult = await getSessionsByDateRange(athleteId, startOfWeek, now);
    if (weekResult.success) {
      const weeklySummary = calculateSummaryStats(weekResult.sessions);
      await saveSummary(athleteId, 'week', weeklySummary, startOfWeek, now);
    }
    
    // Get monthly sessions
    const monthResult = await getSessionsByDateRange(athleteId, startOfMonth, now);
    if (monthResult.success) {
      const monthlySummary = calculateSummaryStats(monthResult.sessions);
      await saveSummary(athleteId, 'month', monthlySummary, startOfMonth, now);
    }
    
  } catch (error) {
    console.error('Error updating performance summary:', error);
  }
};

const calculateSummaryStats = (sessions: TrainingSession[]) => {
  return {
    totalSessions: sessions.length,
    totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
    totalDistance: sessions.reduce((sum, s) => sum + (s.distance || 0), 0),
    avgIntensity: sessions.reduce((sum, s) => sum + getIntensityValue(s.intensity), 0) / sessions.length || 0
  };
};

const saveSummary = async (
  athleteId: string, 
  period: 'week' | 'month', 
  stats: any, 
  periodStart: Date, 
  periodEnd: Date
) => {
  try {
    await addDoc(collection(db, SUMMARY_COLLECTION), {
      athleteId,
      period,
      ...stats,
      periodStart: Timestamp.fromDate(periodStart),
      periodEnd: Timestamp.fromDate(periodEnd),
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving summary:', error);
  }
};
