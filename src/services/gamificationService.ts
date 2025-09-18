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
  increment,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Quest Types and Interfaces
export type QuestType = 'distance' | 'sessions' | 'duration' | 'consistency' | 'improvement' | 'social' | 'intensity' | 'weekly' | 'monthly';
export type QuestStatus = 'active' | 'completed' | 'expired' | 'paused';
export type BadgeRarity = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

export interface Quest {
  id?: string;
  title: string;
  description: string;
  type: QuestType;
  target: number;
  points: number;
  badge?: string;
  icon: string;
  rarity: BadgeRarity;
  duration: number; // days
  requirements?: {
    sport?: string;
    intensity?: 'low' | 'medium' | 'high' | 'peak';
    minDistance?: number;
    minDuration?: number;
    specificExercise?: string;
    timeFrame?: 'daily' | 'weekly' | 'monthly';
    consistencyDays?: number;
  };
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface AthleteQuest {
  id?: string;
  athleteId: string;
  questId: string;
  quest: Quest;
  progress: number;
  status: QuestStatus;
  startedAt: Date;
  completedAt?: Date;
  pointsEarned?: number;
}

export interface Badge {
  id?: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  questId?: string;
  requirements: string;
  pointsAwarded: number;
}

export interface AthleteBadge {
  id?: string;
  athleteId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: Date;
  questId?: string;
}

export interface AthleteProgress {
  id?: string;
  athleteId: string;
  totalPoints: number;
  level: number;
  totalBadges: number;
  completedQuests: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  achievements: {
    bronzeBadges: number;
    silverBadges: number;
    goldBadges: number;
    platinumBadges: number;
    legendaryBadges: number;
  };
  updatedAt: Date;
}

export interface LeaderboardEntry {
  athleteId: string;
  athleteName: string;
  sport: string;
  region: string;
  totalPoints: number;
  level: number;
  totalBadges: number;
  rank: number;
  profilePicture?: string;
}

const QUESTS_COLLECTION = 'quests';
const ATHLETE_QUESTS_COLLECTION = 'athlete_quests';
const BADGES_COLLECTION = 'badges';
const ATHLETE_BADGES_COLLECTION = 'athlete_badges';
const ATHLETE_PROGRESS_COLLECTION = 'athlete_progress';

// Quest Management
export const createQuest = async (questData: Omit<Quest, 'id' | 'createdAt' | 'expiresAt'>) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + questData.duration);

    const docRef = await addDoc(collection(db, QUESTS_COLLECTION), {
      ...questData,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt)
    });
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

export const getActiveQuests = async () => {
  try {
    // Use simpler query to avoid index requirements
    const q = query(
      collection(db, QUESTS_COLLECTION),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const quests: Quest[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const quest = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        expiresAt: data.expiresAt.toDate()
      } as Quest;
      
      // Filter expired quests in memory
      if (quest.expiresAt > new Date()) {
        quests.push(quest);
      }
    });
    
    // Sort by expiration date
    quests.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
    
    return { quests, success: true, error: null };
  } catch (error: any) {
    return { quests: [], success: false, error: error.message };
  }
};

export const getAthleteQuests = async (athleteId: string) => {
  try {
    // Use simpler query to avoid index requirements
    const q = query(
      collection(db, ATHLETE_QUESTS_COLLECTION),
      where('athleteId', '==', athleteId)
    );
    
    const snapshot = await getDocs(q);
    const athleteQuests: AthleteQuest[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      athleteQuests.push({
        id: doc.id,
        ...data,
        startedAt: data.startedAt.toDate(),
        completedAt: data.completedAt?.toDate(),
        quest: {
          ...data.quest,
          createdAt: data.quest.createdAt.toDate(),
          expiresAt: data.quest.expiresAt.toDate()
        }
      } as AthleteQuest);
    });
    
    // Sort by start date (newest first)
    athleteQuests.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    return { athleteQuests, success: true, error: null };
  } catch (error: any) {
    return { athleteQuests: [], success: false, error: error.message };
  }
};

export const startQuest = async (athleteId: string, quest: Quest) => {
  try {
    const docRef = await addDoc(collection(db, ATHLETE_QUESTS_COLLECTION), {
      athleteId,
      questId: quest.id,
      quest,
      progress: 0,
      status: 'active',
      startedAt: Timestamp.now()
    });
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

// Progress Tracking
export const updateQuestProgress = async (
  athleteId: string, 
  questId: string, 
  progressIncrement: number
) => {
  try {
    const q = query(
      collection(db, ATHLETE_QUESTS_COLLECTION),
      where('athleteId', '==', athleteId),
      where('questId', '==', questId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'No active quest found' };
    }

    const batch = writeBatch(db);
    
    snapshot.forEach(async (questDoc) => {
      const questData = questDoc.data() as AthleteQuest;
      const newProgress = questData.progress + progressIncrement;
      const isCompleted = newProgress >= questData.quest.target;
      
      const updateData: any = {
        progress: newProgress
      };
      
      if (isCompleted) {
        updateData.status = 'completed';
        updateData.completedAt = Timestamp.now();
        updateData.pointsEarned = questData.quest.points;
        
        // Award points and update progress
        await awardPoints(athleteId, questData.quest.points);
        
        // Award badge if quest has one
        if (questData.quest.badge) {
          await awardBadge(athleteId, questData.quest.badge, questId);
        }
      }
      
      batch.update(doc(db, ATHLETE_QUESTS_COLLECTION, questDoc.id), updateData);
    });
    
    await batch.commit();
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Badge System
export const createBadge = async (badgeData: Omit<Badge, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, BADGES_COLLECTION), badgeData);
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

export const awardBadge = async (athleteId: string, badgeId: string, questId?: string) => {
  try {
    // Get badge details
    const badgeDoc = await getDoc(doc(db, BADGES_COLLECTION, badgeId));
    if (!badgeDoc.exists()) {
      return { success: false, error: 'Badge not found' };
    }
    
    const badge = { id: badgeDoc.id, ...badgeDoc.data() } as Badge;
    
    // Check if athlete already has this badge
    const existingBadgeQuery = query(
      collection(db, ATHLETE_BADGES_COLLECTION),
      where('athleteId', '==', athleteId),
      where('badgeId', '==', badgeId)
    );
    
    const existingSnapshot = await getDocs(existingBadgeQuery);
    if (!existingSnapshot.empty) {
      return { success: false, error: 'Badge already awarded' };
    }
    
    // Award the badge
    await addDoc(collection(db, ATHLETE_BADGES_COLLECTION), {
      athleteId,
      badgeId,
      badge,
      earnedAt: Timestamp.now(),
      questId
    });
    
    // Update athlete progress
    await updateAthleteProgress(athleteId, { badgeEarned: badge.rarity });
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAthleteBadges = async (athleteId: string) => {
  try {
    // Use simpler query to avoid index requirements
    const q = query(
      collection(db, ATHLETE_BADGES_COLLECTION),
      where('athleteId', '==', athleteId)
    );
    
    const snapshot = await getDocs(q);
    const badges: AthleteBadge[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      badges.push({
        id: doc.id,
        ...data,
        earnedAt: data.earnedAt.toDate()
      } as AthleteBadge);
    });
    
    // Sort by earned date (newest first)
    badges.sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
    
    return { badges, success: true, error: null };
  } catch (error: any) {
    return { badges: [], success: false, error: error.message };
  }
};

// Points and Level System
export const awardPoints = async (athleteId: string, points: number) => {
  try {
    // Find the athlete's progress record
    const progressQuery = query(
      collection(db, ATHLETE_PROGRESS_COLLECTION),
      where('athleteId', '==', athleteId),
      limit(1)
    );
    
    const progressSnapshot = await getDocs(progressQuery);
    
    if (!progressSnapshot.empty) {
      const progressDoc = progressSnapshot.docs[0];
      const currentData = progressDoc.data() as AthleteProgress;
      const newPoints = currentData.totalPoints + points;
      const newLevel = calculateLevel(newPoints);
      
      await updateDoc(doc(db, ATHLETE_PROGRESS_COLLECTION, progressDoc.id), {
        totalPoints: newPoints,
        level: newLevel,
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new progress record if doesn't exist
      await createAthleteProgress(athleteId, points);
    }
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const createAthleteProgress = async (athleteId: string, initialPoints: number = 0) => {
  try {
    // Check if progress already exists to prevent duplicates
    const existingQuery = query(
      collection(db, ATHLETE_PROGRESS_COLLECTION),
      where('athleteId', '==', athleteId),
      limit(1)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      console.log('Athlete progress already exists');
      return { success: true, error: null };
    }

    const progressData: Omit<AthleteProgress, 'id'> = {
      athleteId,
      totalPoints: initialPoints,
      level: calculateLevel(initialPoints),
      totalBadges: 0,
      completedQuests: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date(),
      achievements: {
        bronzeBadges: 0,
        silverBadges: 0,
        goldBadges: 0,
        platinumBadges: 0,
        legendaryBadges: 0
      },
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, ATHLETE_PROGRESS_COLLECTION), {
      ...progressData,
      lastActivityDate: Timestamp.fromDate(progressData.lastActivityDate),
      updatedAt: Timestamp.now()
    });
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateAthleteProgress = async (
  athleteId: string, 
  updates: { 
    questCompleted?: boolean;
    badgeEarned?: BadgeRarity;
    streakUpdate?: boolean;
  }
) => {
  try {
    // Find the athlete's progress record
    const progressQuery = query(
      collection(db, ATHLETE_PROGRESS_COLLECTION),
      where('athleteId', '==', athleteId),
      limit(1)
    );
    
    const progressSnapshot = await getDocs(progressQuery);
    
    if (!progressSnapshot.empty) {
      const progressDoc = progressSnapshot.docs[0];
      const updateData: any = {
        lastActivityDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      if (updates.questCompleted) {
        updateData.completedQuests = increment(1);
      }
      
      if (updates.badgeEarned) {
        updateData.totalBadges = increment(1);
        updateData[`achievements.${updates.badgeEarned}Badges`] = increment(1);
      }
      
      if (updates.streakUpdate) {
        updateData.currentStreak = increment(1);
      }
      
      await updateDoc(doc(db, ATHLETE_PROGRESS_COLLECTION, progressDoc.id), updateData);
    }
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAthleteProgress = async (athleteId: string): Promise<{ progress: AthleteProgress | null; success: boolean; error: string | null }> => {
  try {
    // First check if progress record exists by querying with athleteId
    const q = query(
      collection(db, ATHLETE_PROGRESS_COLLECTION),
      where('athleteId', '==', athleteId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Found existing progress record
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const progress: AthleteProgress = {
        id: doc.id,
        ...data,
        lastActivityDate: data.lastActivityDate.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as AthleteProgress;
      
      return { progress, success: true, error: null };
    }
    
    // No existing record found, create a new one
    const newProgressData: Omit<AthleteProgress, 'id'> = {
      athleteId,
      totalPoints: 0,
      level: 1,
      totalBadges: 0,
      completedQuests: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date(),
      achievements: {
        bronzeBadges: 0,
        silverBadges: 0,
        goldBadges: 0,
        platinumBadges: 0,
        legendaryBadges: 0
      },
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, ATHLETE_PROGRESS_COLLECTION), {
      ...newProgressData,
      lastActivityDate: Timestamp.fromDate(newProgressData.lastActivityDate),
      updatedAt: Timestamp.now()
    });
    
    // Return the newly created progress
    const progress: AthleteProgress = {
      id: docRef.id,
      ...newProgressData
    };
    
    return { progress, success: true, error: null };
  } catch (error: any) {
    return { progress: null, success: false, error: error.message };
  }
};

// Leaderboard
export const getLeaderboard = async (
  sport?: string,
  region?: string,
  limitCount: number = 50
) => {
  try {
    // Use simpler query to avoid index requirements
    const q = query(
      collection(db, ATHLETE_PROGRESS_COLLECTION),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const leaderboard: LeaderboardEntry[] = [];
    
    let rank = 1;
    for (const progressDoc of snapshot.docs) {
      const progressData = progressDoc.data() as AthleteProgress;
      
      // Get athlete profile for filtering
      try {
        const athleteDoc = await getDoc(doc(db, 'users', progressData.athleteId));
        if (athleteDoc.exists()) {
          const athleteData = athleteDoc.data();
          
          // Apply filters
          if (sport && athleteData.sport !== sport) continue;
          if (region && athleteData.region !== region) continue;
          
          leaderboard.push({
            athleteId: progressData.athleteId,
            athleteName: athleteData.name,
            sport: athleteData.sport,
            region: athleteData.region,
            totalPoints: progressData.totalPoints,
            level: progressData.level,
            totalBadges: progressData.totalBadges,
            rank: rank++
          });
        }
      } catch (error) {
        console.error('Error fetching athlete data:', error);
      }
    }
    
    // Sort by points in memory (descending)
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Update ranks after sorting
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return { leaderboard, success: true, error: null };
  } catch (error: any) {
    return { leaderboard: [], success: false, error: error.message };
  }
};

// Helper Functions
export const calculateLevel = (points: number): number => {
  // Level calculation: 100 points per level initially, with increasing requirements
  if (points < 100) return 1;
  if (points < 300) return 2;
  if (points < 600) return 3;
  if (points < 1000) return 4;
  if (points < 1500) return 5;
  if (points < 2100) return 6;
  if (points < 2800) return 7;
  if (points < 3600) return 8;
  if (points < 4500) return 9;
  if (points < 5500) return 10;
  
  // Beyond level 10, each level requires 1000 more points
  return Math.floor((points - 5500) / 1000) + 10;
};

export const getPointsForNextLevel = (currentPoints: number): number => {
  const currentLevel = calculateLevel(currentPoints);
  const nextLevel = currentLevel + 1;
  
  // Calculate points needed for next level
  if (nextLevel <= 10) {
    const levelRequirements = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
    return levelRequirements[nextLevel] - currentPoints;
  } else {
    const pointsForLevel10 = 5500;
    const additionalLevels = nextLevel - 10;
    const pointsNeeded = pointsForLevel10 + (additionalLevels * 1000);
    return pointsNeeded - currentPoints;
  }
};

export const getRarityColor = (rarity: BadgeRarity): string => {
  switch (rarity) {
    case 'bronze': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'silver': return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'platinum': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'legendary': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Helper function to clean up duplicate athlete progress records
export const cleanupDuplicateProgress = async (athleteId: string) => {
  try {
    const q = query(
      collection(db, ATHLETE_PROGRESS_COLLECTION),
      where('athleteId', '==', athleteId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.size > 1) {
      console.log(`Found ${snapshot.size} duplicate records for athlete ${athleteId}, cleaning up...`);
      
      // Keep the first record and delete the rest
      const docs = snapshot.docs;
      const batch = writeBatch(db);
      
      // Delete all but the first document
      for (let i = 1; i < docs.length; i++) {
        batch.delete(docs[i].ref);
      }
      
      await batch.commit();
      console.log(`Cleaned up ${docs.length - 1} duplicate records`);
    }
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error cleaning up duplicates:', error);
    return { success: false, error: error.message };
  }
};
export const initializeDefaultQuests = async () => {
  try {
    // Check if default quests already exist
    const existingQuestsQuery = query(
      collection(db, QUESTS_COLLECTION),
      where('isActive', '==', true)
    );
    
    const existingSnapshot = await getDocs(existingQuestsQuery);
    
    if (existingSnapshot.size > 0) {
      console.log('Default quests already exist');
      return { success: true, error: null };
    }

    const defaultQuests: Omit<Quest, 'id' | 'createdAt' | 'expiresAt'>[] = [
      {
        title: "First Steps",
        description: "Complete your first training session to begin your fitness journey",
        type: "sessions",
        target: 1,
        points: 50,
        badge: "first_steps_badge",
        icon: "🚀",
        rarity: "bronze",
        duration: 30,
        isActive: true
      },
      {
        title: "5K Runner",
        description: "Run a total distance of 5km across running sessions",
        type: "distance",
        target: 5,
        points: 100,
        badge: "5k_runner_badge",
        icon: "🏃‍♂️",
        rarity: "bronze",
        duration: 14,
        requirements: { sport: "running" },
        isActive: true
      },
      {
        title: "Distance Warrior",
        description: "Cover a total distance of 10km across all training sessions",
        type: "distance",
        target: 10,
        points: 150,
        badge: "distance_warrior_badge",
        icon: "🏃‍♂️",
        rarity: "silver",
        duration: 14,
        requirements: { minDistance: 1 },
        isActive: true
      },
      {
        title: "Training Streak",
        description: "Train for 5 consecutive days without skipping",
        type: "consistency",
        target: 5,
        points: 200,
        badge: "streak_master_badge",
        icon: "🔥",
        rarity: "gold",
        duration: 10,
        requirements: { consistencyDays: 5 },
        isActive: true
      },
      {
        title: "Endurance Builder",
        description: "Accumulate 300 minutes of total training time",
        type: "duration",
        target: 300,
        points: 175,
        badge: "endurance_badge",
        icon: "⏱️",
        rarity: "silver",
        duration: 14,
        requirements: { minDuration: 30 },
        isActive: true
      },
      {
        title: "Session Master",
        description: "Complete 10 training sessions of any type",
        type: "sessions",
        target: 10,
        points: 300,
        badge: "session_master_badge",
        icon: "💪",
        rarity: "gold",
        duration: 21,
        isActive: true
      },
      {
        title: "High Intensity Hero",
        description: "Complete 3 high or peak intensity training sessions",
        type: "sessions",
        target: 3,
        points: 125,
        badge: "intensity_hero_badge",
        icon: "⚡",
        rarity: "silver",
        duration: 10,
        requirements: { intensity: "high" },
        isActive: true
      },
      {
        title: "Weekly Warrior",
        description: "Train at least 4 times in a single week",
        type: "weekly",
        target: 4,
        points: 100,
        badge: "weekly_warrior_badge",
        icon: "📅",
        rarity: "bronze",
        duration: 7,
        requirements: { timeFrame: "weekly" },
        isActive: true
      },
      {
        title: "Marathon Distance",
        description: "Cover a total distance of 42.2km (marathon distance)",
        type: "distance",
        target: 42.2,
        points: 500,
        badge: "marathon_badge",
        icon: "🏅",
        rarity: "legendary",
        duration: 30,
        requirements: { minDistance: 5 },
        isActive: true
      }
    ];

    const batch = writeBatch(db);
    const now = new Date();

    defaultQuests.forEach((quest) => {
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + quest.duration);
      
      const questRef = doc(collection(db, QUESTS_COLLECTION));
      batch.set(questRef, {
        ...quest,
        createdAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt)
      });
    });

    await batch.commit();
    console.log('Default quests initialized successfully');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error initializing default quests:', error);
    return { success: false, error: error.message };
  }
};
