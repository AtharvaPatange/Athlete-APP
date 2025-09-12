import { 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  initializeDefaultQuests, 
  getAthleteQuests,
  AthleteQuest
} from './gamificationService';
import { updateAthleteQuestProgress, QuestProgressUpdate } from './questProgressService';

/**
 * Initialize the quest system for the application
 * This should be called when the app starts or when setting up a new athlete
 */
export const initializeQuestSystem = async (): Promise<{
  success: boolean;
  error: string | null;
}> => {
  try {
    console.log('Initializing quest system...');
    
    // Initialize default quests if they don't exist
    const questResult = await initializeDefaultQuests();
    
    if (!questResult.success) {
      return { success: false, error: questResult.error };
    }
    
    console.log('Quest system initialized successfully');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error initializing quest system:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync all active quests for an athlete with their training data
 * This is useful for manual syncing or when fixing data inconsistencies
 */
export const syncAllAthleteQuests = async (athleteId: string): Promise<{
  success: boolean;
  error: string | null;
  syncedQuests: number;
  completedQuests: number;
  updates: QuestProgressUpdate[];
}> => {
  try {
    console.log(`Starting quest sync for athlete: ${athleteId}`);
    
    // Update all quest progress
    const result = await updateAthleteQuestProgress(athleteId);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        syncedQuests: 0,
        completedQuests: 0,
        updates: []
      };
    }
    
    const completedCount = result.updates.filter(u => u.isCompleted).length;
    
    console.log(`Quest sync completed: ${result.updates.length} quests updated, ${completedCount} completed`);
    
    return {
      success: true,
      error: null,
      syncedQuests: result.updates.length,
      completedQuests: completedCount,
      updates: result.updates
    };
  } catch (error: any) {
    console.error('Error syncing athlete quests:', error);
    return {
      success: false,
      error: error.message,
      syncedQuests: 0,
      completedQuests: 0,
      updates: []
    };
  }
};

/**
 * Clean up expired quests for all athletes
 * This should be run periodically (e.g., daily) to mark expired quests
 */
export const cleanupExpiredQuests = async (): Promise<{
  success: boolean;
  error: string | null;
  expiredCount: number;
}> => {
  try {
    console.log('Starting cleanup of expired quests...');
    
    const now = new Date();
    
    // Get all active athlete quests
    const activeQuestsQuery = query(
      collection(db, 'athlete_quests'),
      where('status', '==', 'active')
    );
    
    const activeQuestsSnapshot = await getDocs(activeQuestsQuery);
    
    if (activeQuestsSnapshot.empty) {
      return { success: true, error: null, expiredCount: 0 };
    }
    
    const batch = writeBatch(db);
    let expiredCount = 0;
    
    // Check each quest for expiration
    activeQuestsSnapshot.forEach((questDoc) => {
      const questData = questDoc.data();
      const expiresAt = questData.quest.expiresAt.toDate();
      
      if (expiresAt < now) {
        // Mark as expired
        batch.update(doc(db, 'athlete_quests', questDoc.id), {
          status: 'expired',
          expiredAt: now
        });
        expiredCount++;
      }
    });
    
    if (expiredCount > 0) {
      await batch.commit();
    }
    
    console.log(`Cleanup completed: ${expiredCount} quests expired`);
    
    return { success: true, error: null, expiredCount };
  } catch (error: any) {
    console.error('Error cleaning up expired quests:', error);
    return { success: false, error: error.message, expiredCount: 0 };
  }
};

/**
 * Get quest statistics for an athlete
 */
export const getAthleteQuestStats = async (athleteId: string): Promise<{
  success: boolean;
  error: string | null;
  stats?: {
    totalQuests: number;
    activeQuests: number;
    completedQuests: number;
    expiredQuests: number;
    totalPointsEarned: number;
    averageProgress: number;
    streak: {
      current: number;
      longest: number;
    };
  };
}> => {
  try {
    const result = await getAthleteQuests(athleteId);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    const quests = result.athleteQuests;
    
    const stats = {
      totalQuests: quests.length,
      activeQuests: quests.filter(q => q.status === 'active').length,
      completedQuests: quests.filter(q => q.status === 'completed').length,
      expiredQuests: quests.filter(q => q.status === 'expired').length,
      totalPointsEarned: quests
        .filter(q => q.status === 'completed')
        .reduce((sum, q) => sum + (q.pointsEarned || 0), 0),
      averageProgress: quests.length > 0 
        ? quests.reduce((sum, q) => sum + (q.progress / q.quest.target * 100), 0) / quests.length
        : 0,
      streak: calculateQuestStreak(quests)
    };
    
    return { success: true, error: null, stats };
  } catch (error: any) {
    console.error('Error getting quest statistics:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate quest completion streak
 */
const calculateQuestStreak = (quests: AthleteQuest[]): { current: number; longest: number } => {
  const completedQuests = quests
    .filter(q => q.status === 'completed' && q.completedAt)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  
  if (completedQuests.length === 0) {
    return { current: 0, longest: 0 };
  }
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  // Calculate current streak (from most recent completion)
  const now = new Date();
  const daysSinceLastCompletion = Math.floor(
    (now.getTime() - completedQuests[0].completedAt!.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastCompletion <= 7) { // Within a week
    currentStreak = 1;
    
    // Check for consecutive completions
    for (let i = 1; i < completedQuests.length; i++) {
      const prevDate = completedQuests[i - 1].completedAt!;
      const currDate = completedQuests[i].completedAt!;
      const daysBetween = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysBetween <= 7) { // Within a week of each other
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  // Calculate longest streak
  for (let i = 1; i < completedQuests.length; i++) {
    const prevDate = completedQuests[i - 1].completedAt!;
    const currDate = completedQuests[i].completedAt!;
    const daysBetween = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysBetween <= 7) { // Within a week
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return { current: currentStreak, longest: longestStreak };
};

/**
 * Auto-sync quest progress for an athlete when they log in or when the app loads
 */
export const autoSyncQuestProgress = async (athleteId: string): Promise<{
  success: boolean;
  error: string | null;
  hasUpdates: boolean;
}> => {
  try {
    // Check if we need to sync (don't sync too frequently)
    const lastSyncKey = `questSync_${athleteId}`;
    const lastSync = localStorage.getItem(lastSyncKey);
    const now = Date.now();
    
    // Sync at most once every 5 minutes
    if (lastSync && (now - parseInt(lastSync)) < 5 * 60 * 1000) {
      return { success: true, error: null, hasUpdates: false };
    }
    
    const result = await updateAthleteQuestProgress(athleteId);
    
    // Store last sync time
    localStorage.setItem(lastSyncKey, now.toString());
    
    return {
      success: result.success,
      error: result.error,
      hasUpdates: result.updates.length > 0
    };
  } catch (error: any) {
    console.error('Error in auto-sync:', error);
    return { success: false, error: error.message, hasUpdates: false };
  }
};