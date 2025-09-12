import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTrainingSessions, getSessionsByDateRange, TrainingSession } from './performanceService';
import { 
  AthleteQuest, 
  Quest, 
  QuestType, 
  updateQuestProgress,
  awardPoints,
  updateAthleteProgress
} from './gamificationService';

// Quest Progress Calculator Service
export interface QuestProgressUpdate {
  questId: string;
  newProgress: number;
  isCompleted: boolean;
  completionData?: {
    completedAt: Date;
    pointsEarned: number;
    badgeAwarded?: string;
  };
}

/**
 * Calculate progress for distance-based quests
 * Tracks total distance covered in training sessions
 */
const calculateDistanceProgress = (
  sessions: TrainingSession[], 
  quest: Quest,
  athleteQuest: AthleteQuest
): number => {
  console.log('🔍 Calculating distance progress for quest:', quest.title);
  console.log('📊 Total sessions provided:', sessions.length);
  console.log('📅 Quest started at:', athleteQuest.startedAt);
  
  // Filter sessions based on quest requirements
  let filteredSessions = sessions;
  
  if (quest.requirements?.sport) {
    console.log('🏃 Filtering by sport:', quest.requirements.sport);
    filteredSessions = sessions.filter(s => s.sport.toLowerCase() === quest.requirements!.sport!.toLowerCase());
    console.log('📊 Sessions after sport filter:', filteredSessions.length);
  }
  
  if (quest.requirements?.minDistance) {
    console.log('📏 Filtering by min distance:', quest.requirements.minDistance);
    filteredSessions = sessions.filter(s => (s.distance || 0) >= quest.requirements!.minDistance!);
    console.log('📊 Sessions after distance filter:', filteredSessions.length);
  }
  
  // Calculate total distance since quest started
  const questStartDate = athleteQuest.startedAt;
  const relevantSessions = filteredSessions.filter(s => s.date >= questStartDate);
  
  console.log('📊 Relevant sessions since quest start:', relevantSessions.length);
  console.log('📋 Session details:', relevantSessions.map(s => ({ 
    date: s.date, 
    sport: s.sport, 
    distance: s.distance,
    duration: s.duration
  })));
  
  const totalDistance = relevantSessions.reduce((sum, session) => sum + (session.distance || 0), 0);
  const finalProgress = Math.min(totalDistance, quest.target);
  
  console.log('🎯 Total distance calculated:', totalDistance, 'km');
  console.log('🏆 Quest target:', quest.target, 'km');
  console.log('✨ Final progress:', finalProgress, 'km');
  
  return finalProgress;
};

/**
 * Calculate progress for session-based quests
 * Tracks number of completed training sessions
 */
const calculateSessionProgress = (
  sessions: TrainingSession[], 
  quest: Quest,
  athleteQuest: AthleteQuest
): number => {
  // Filter sessions based on quest requirements
  let filteredSessions = sessions;
  
  if (quest.requirements?.sport) {
    filteredSessions = sessions.filter(s => s.sport.toLowerCase() === quest.requirements!.sport!.toLowerCase());
  }
  
  if (quest.requirements?.intensity) {
    filteredSessions = sessions.filter(s => s.intensity === quest.requirements!.intensity);
  }
  
  if (quest.requirements?.minDuration) {
    filteredSessions = sessions.filter(s => s.duration >= quest.requirements!.minDuration!);
  }
  
  // Count sessions since quest started
  const questStartDate = athleteQuest.startedAt;
  const relevantSessions = filteredSessions.filter(s => s.date >= questStartDate);
  
  return Math.min(relevantSessions.length, quest.target);
};

/**
 * Calculate progress for duration-based quests
 * Tracks total training time in minutes
 */
const calculateDurationProgress = (
  sessions: TrainingSession[], 
  quest: Quest,
  athleteQuest: AthleteQuest
): number => {
  // Filter sessions based on quest requirements
  let filteredSessions = sessions;
  
  if (quest.requirements?.sport) {
    filteredSessions = sessions.filter(s => s.sport.toLowerCase() === quest.requirements!.sport!.toLowerCase());
  }
  
  if (quest.requirements?.intensity) {
    filteredSessions = sessions.filter(s => s.intensity === quest.requirements!.intensity);
  }
  
  // Calculate total duration since quest started
  const questStartDate = athleteQuest.startedAt;
  const relevantSessions = filteredSessions.filter(s => s.date >= questStartDate);
  
  const totalDuration = relevantSessions.reduce((sum, session) => sum + session.duration, 0);
  
  return Math.min(totalDuration, quest.target);
};

/**
 * Calculate progress for consistency-based quests
 * Tracks consecutive days with training sessions
 */
const calculateConsistencyProgress = (
  sessions: TrainingSession[], 
  quest: Quest,
  athleteQuest: AthleteQuest
): number => {
  // Filter sessions based on quest requirements
  let filteredSessions = sessions;
  
  if (quest.requirements?.sport) {
    filteredSessions = sessions.filter(s => s.sport.toLowerCase() === quest.requirements!.sport!.toLowerCase());
  }
  
  // Get sessions since quest started
  const questStartDate = athleteQuest.startedAt;
  const relevantSessions = filteredSessions
    .filter(s => s.date >= questStartDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  if (relevantSessions.length === 0) return 0;
  
  // Calculate consecutive days
  let currentStreak = 0;
  let maxStreak = 0;
  let lastSessionDate: Date | null = null;
  
  // Group sessions by date
  const sessionsByDate = new Map<string, TrainingSession[]>();
  relevantSessions.forEach(session => {
    const dateKey = session.date.toDateString();
    if (!sessionsByDate.has(dateKey)) {
      sessionsByDate.set(dateKey, []);
    }
    sessionsByDate.get(dateKey)!.push(session);
  });
  
  // Get unique training dates
  const uniqueDates = Array.from(sessionsByDate.keys()).sort();
  
  for (let i = 0; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i]);
    
    if (lastSessionDate === null) {
      currentStreak = 1;
    } else {
      const dayDifference = Math.floor((currentDate.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDifference === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }
    
    maxStreak = Math.max(maxStreak, currentStreak);
    lastSessionDate = currentDate;
  }
  
  return Math.min(maxStreak, quest.target);
};

/**
 * Calculate progress for improvement-based quests
 * Tracks improvement in performance metrics
 */
const calculateImprovementProgress = (
  sessions: TrainingSession[], 
  quest: Quest,
  athleteQuest: AthleteQuest
): number => {
  // Filter sessions based on quest requirements
  let filteredSessions = sessions;
  
  if (quest.requirements?.sport) {
    filteredSessions = sessions.filter(s => s.sport.toLowerCase() === quest.requirements!.sport!.toLowerCase());
  }
  
  // Get sessions since quest started
  const questStartDate = athleteQuest.startedAt;
  const relevantSessions = filteredSessions
    .filter(s => s.date >= questStartDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  if (relevantSessions.length < 2) return 0;
  
  // Calculate improvement based on quest criteria
  const firstSession = relevantSessions[0];
  const latestSession = relevantSessions[relevantSessions.length - 1];
  
  let improvement = 0;
  
  // Distance improvement
  if (firstSession.distance && latestSession.distance) {
    const distanceImprovement = ((latestSession.distance - firstSession.distance) / firstSession.distance) * 100;
    improvement = Math.max(improvement, distanceImprovement);
  }
  
  // Duration improvement (endurance)
  if (firstSession.duration && latestSession.duration) {
    const durationImprovement = ((latestSession.duration - firstSession.duration) / firstSession.duration) * 100;
    improvement = Math.max(improvement, durationImprovement);
  }
  
  return Math.min(Math.max(improvement, 0), quest.target);
};

/**
 * Calculate progress for weekly-based quests
 * Tracks sessions within a specific week
 */
const calculateWeeklyProgress = (
  sessions: TrainingSession[], 
  quest: Quest,
  athleteQuest: AthleteQuest
): number => {
  // Get current week's sessions since quest started
  const questStartDate = athleteQuest.startedAt;
  const now = new Date();
  
  // Find the start of the current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Filter sessions for current week and after quest start
  const weekSessions = sessions.filter(s => {
    const effectiveStartTime = Math.max(questStartDate.getTime(), startOfWeek.getTime());
    return s.date.getTime() >= effectiveStartTime && s.date.getTime() <= now.getTime();
  });
  
  // Apply additional filters
  let filteredSessions = weekSessions;
  
  if (quest.requirements?.sport) {
    filteredSessions = weekSessions.filter(s => s.sport.toLowerCase() === quest.requirements!.sport!.toLowerCase());
  }
  
  if (quest.requirements?.intensity) {
    filteredSessions = weekSessions.filter(s => s.intensity === quest.requirements!.intensity);
  }
  
  return Math.min(filteredSessions.length, quest.target);
};

/**
 * Calculate progress for intensity-based quests
 * Tracks sessions with specific intensity levels
 */
const calculateIntensityProgress = (
  sessions: TrainingSession[], 
  quest: Quest,
  athleteQuest: AthleteQuest
): number => {
  // Filter sessions based on intensity requirement
  const questStartDate = athleteQuest.startedAt;
  
  let filteredSessions = sessions.filter(s => s.date >= questStartDate);
  
  if (quest.requirements?.intensity) {
    if (quest.requirements.intensity === 'high') {
      // Include both high and peak intensity
      filteredSessions = filteredSessions.filter(s => s.intensity === 'high' || s.intensity === 'peak');
    } else {
      filteredSessions = filteredSessions.filter(s => s.intensity === quest.requirements!.intensity);
    }
  }
  
  if (quest.requirements?.sport) {
    filteredSessions = filteredSessions.filter(s => s.sport.toLowerCase() === quest.requirements!.sport!.toLowerCase());
  }
  
  return Math.min(filteredSessions.length, quest.target);
};

/**
 * Calculate progress based on quest type
 */
export const calculateQuestProgress = (
  sessions: TrainingSession[], 
  quest: Quest,
  athleteQuest: AthleteQuest
): number => {
  switch (quest.type) {
    case 'distance':
      return calculateDistanceProgress(sessions, quest, athleteQuest);
    case 'sessions':
      return calculateSessionProgress(sessions, quest, athleteQuest);
    case 'duration':
      return calculateDurationProgress(sessions, quest, athleteQuest);
    case 'consistency':
      return calculateConsistencyProgress(sessions, quest, athleteQuest);
    case 'improvement':
      return calculateImprovementProgress(sessions, quest, athleteQuest);
    case 'weekly':
      return calculateWeeklyProgress(sessions, quest, athleteQuest);
    case 'intensity':
      return calculateIntensityProgress(sessions, quest, athleteQuest);
    case 'monthly':
      // For monthly quests, use session progress but filter by month
      return calculateSessionProgress(sessions, quest, athleteQuest);
    default:
      return athleteQuest.progress; // Return current progress for unknown types
  }
};

/**
 * Update all active quest progress for an athlete based on their training data
 */
export const updateAthleteQuestProgress = async (athleteId: string): Promise<{
  success: boolean;
  error: string | null;
  updates: QuestProgressUpdate[];
}> => {
  try {
    console.log('🎯 Starting quest progress update for athlete:', athleteId);
    
    // Get all active quests for the athlete
    const activeQuestsQuery = query(
      collection(db, 'athlete_quests'),
      where('athleteId', '==', athleteId),
      where('status', '==', 'active')
    );
    
    const activeQuestsSnapshot = await getDocs(activeQuestsQuery);
    
    console.log('📋 Found active quests:', activeQuestsSnapshot.size);
    
    if (activeQuestsSnapshot.empty) {
      console.log('ℹ️ No active quests found for athlete');
      return { success: true, error: null, updates: [] };
    }
    
    // Get athlete's training sessions
    const sessionsResult = await getTrainingSessions(athleteId, 100); // Get more sessions for better calculation
    
    if (!sessionsResult.success) {
      console.error('❌ Failed to get training sessions:', sessionsResult.error);
      return { success: false, error: sessionsResult.error, updates: [] };
    }
    
    console.log('✅ Retrieved', sessionsResult.sessions.length, 'training sessions for athlete');
    
    const updates: QuestProgressUpdate[] = [];
    const batch = writeBatch(db);
    
    // Process each active quest
    for (const questDoc of activeQuestsSnapshot.docs) {
      const athleteQuest = {
        id: questDoc.id,
        ...questDoc.data(),
        startedAt: questDoc.data().startedAt.toDate(),
        completedAt: questDoc.data().completedAt?.toDate(),
        quest: {
          ...questDoc.data().quest,
          createdAt: questDoc.data().quest.createdAt.toDate(),
          expiresAt: questDoc.data().quest.expiresAt.toDate()
        }
      } as AthleteQuest;
      
      // Calculate new progress
      const newProgress = calculateQuestProgress(sessionsResult.sessions, athleteQuest.quest, athleteQuest);
      
      // Check if progress has changed
      if (newProgress !== athleteQuest.progress) {
        const isCompleted = newProgress >= athleteQuest.quest.target;
        
        const updateData: any = {
          progress: newProgress,
          updatedAt: Timestamp.now()
        };
        
        let completionData = undefined;
        
        if (isCompleted && athleteQuest.status !== 'completed') {
          updateData.status = 'completed';
          updateData.completedAt = Timestamp.now();
          updateData.pointsEarned = athleteQuest.quest.points;
          
          completionData = {
            completedAt: new Date(),
            pointsEarned: athleteQuest.quest.points,
            badgeAwarded: athleteQuest.quest.badge
          };
          
          // Award points
          await awardPoints(athleteId, athleteQuest.quest.points);
          
          // Update athlete progress stats
          await updateAthleteProgress(athleteId, { 
            questCompleted: true,
            streakUpdate: athleteQuest.quest.type === 'consistency'
          });
        }
        
        // Add to batch update
        batch.update(doc(db, 'athlete_quests', questDoc.id), updateData);
        
        updates.push({
          questId: athleteQuest.questId,
          newProgress,
          isCompleted,
          completionData
        });
      }
    }
    
    // Commit all updates
    if (updates.length > 0) {
      await batch.commit();
    }
    
    return { success: true, error: null, updates };
  } catch (error: any) {
    console.error('Error updating quest progress:', error);
    return { success: false, error: error.message, updates: [] };
  }
};

/**
 * Trigger quest progress update when a new training session is logged
 */
export const onTrainingSessionAdded = async (athleteId: string, session: TrainingSession): Promise<{
  success: boolean;
  error: string | null;
  questUpdates: QuestProgressUpdate[];
}> => {
  try {
    console.log('🚀 QUEST UPDATE TRIGGERED! Athlete ID:', athleteId);
    console.log('🏃 New training session details:', {
      sport: session.sport,
      distance: session.distance,
      duration: session.duration,
      date: session.date,
      intensity: session.intensity
    });
    
    const result = await updateAthleteQuestProgress(athleteId);
    
    if (result.success && result.updates.length > 0) {
      console.log(`🎉 Updated progress for ${result.updates.length} quests:`, result.updates);
    } else {
      console.log('ℹ️ No quest updates needed or no active quests found');
    }
    
    return {
      success: result.success,
      error: result.error,
      questUpdates: result.updates
    };
  } catch (error: any) {
    console.error('❌ Error in onTrainingSessionAdded:', error);
    return {
      success: false,
      error: error.message,
      questUpdates: []
    };
  }
};

/**
 * Get detailed quest progress breakdown for debugging
 */
export const getQuestProgressBreakdown = async (athleteId: string, questId: string): Promise<{
  success: boolean;
  error: string | null;
  breakdown?: {
    questDetails: AthleteQuest;
    relevantSessions: TrainingSession[];
    calculatedProgress: number;
    progressDetails: any;
  };
}> => {
  try {
    // Get the specific athlete quest
    const athleteQuestQuery = query(
      collection(db, 'athlete_quests'),
      where('athleteId', '==', athleteId),
      where('questId', '==', questId)
    );
    
    const athleteQuestSnapshot = await getDocs(athleteQuestQuery);
    
    if (athleteQuestSnapshot.empty) {
      return { success: false, error: 'Quest not found for athlete' };
    }
    
    const questDoc = athleteQuestSnapshot.docs[0];
    const athleteQuest = {
      id: questDoc.id,
      ...questDoc.data(),
      startedAt: questDoc.data().startedAt.toDate(),
      completedAt: questDoc.data().completedAt?.toDate(),
      quest: {
        ...questDoc.data().quest,
        createdAt: questDoc.data().quest.createdAt.toDate(),
        expiresAt: questDoc.data().quest.expiresAt.toDate()
      }
    } as AthleteQuest;
    
    // Get training sessions
    const sessionsResult = await getTrainingSessions(athleteId, 100);
    
    if (!sessionsResult.success) {
      return { success: false, error: sessionsResult.error };
    }
    
    // Filter relevant sessions (after quest start date)
    const relevantSessions = sessionsResult.sessions.filter(s => s.date >= athleteQuest.startedAt);
    
    // Calculate progress
    const calculatedProgress = calculateQuestProgress(sessionsResult.sessions, athleteQuest.quest, athleteQuest);
    
    // Create progress details based on quest type
    let progressDetails: any = {};
    
    switch (athleteQuest.quest.type) {
      case 'distance':
        progressDetails = {
          totalDistance: relevantSessions.reduce((sum, s) => sum + (s.distance || 0), 0),
          sessionCount: relevantSessions.length,
          target: athleteQuest.quest.target
        };
        break;
      case 'sessions':
        progressDetails = {
          sessionCount: relevantSessions.length,
          target: athleteQuest.quest.target
        };
        break;
      case 'duration':
        progressDetails = {
          totalDuration: relevantSessions.reduce((sum, s) => sum + s.duration, 0),
          sessionCount: relevantSessions.length,
          target: athleteQuest.quest.target
        };
        break;
      case 'consistency':
        progressDetails = {
          uniqueTrainingDays: new Set(relevantSessions.map(s => s.date.toDateString())).size,
          sessionCount: relevantSessions.length,
          target: athleteQuest.quest.target
        };
        break;
    }
    
    return {
      success: true,
      error: null,
      breakdown: {
        questDetails: athleteQuest,
        relevantSessions,
        calculatedProgress,
        progressDetails
      }
    };
  } catch (error: any) {
    console.error('Error getting quest progress breakdown:', error);
    return { success: false, error: error.message };
  }
};