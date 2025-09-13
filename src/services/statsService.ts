import { doc, updateDoc, increment, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserStats {
  profileViews: number;
  qrScans: number;
  connections: number;
  achievements: number;
  lastUpdated: Date;
}

// Initialize user stats document
export const initializeUserStats = async (userId: string) => {
  const statsRef = doc(db, 'userStats', userId);
  const statsDoc = await getDoc(statsRef);
  
  if (!statsDoc.exists()) {
    await setDoc(statsRef, {
      profileViews: 0,
      qrScans: 0,
      connections: 0,
      achievements: 0,
      lastUpdated: new Date()
    });
  }
};

// Increment profile views
export const incrementProfileViews = async (userId: string) => {
  try {
    const statsRef = doc(db, 'userStats', userId);
    await updateDoc(statsRef, {
      profileViews: increment(1),
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error updating profile views:', error);
  }
};

// Increment QR scans
export const incrementQRScans = async (userId: string) => {
  try {
    const statsRef = doc(db, 'userStats', userId);
    await updateDoc(statsRef, {
      qrScans: increment(1),
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error updating QR scans:', error);
  }
};

// Add new connection
export const addConnection = async (userId: string, connectedUserId: string) => {
  try {
    // Add to connections collection
    const connectionRef = doc(collection(db, 'connections'));
    await setDoc(connectionRef, {
      userId,
      connectedUserId,
      createdAt: new Date()
    });

    // Update stats
    const statsRef = doc(db, 'userStats', userId);
    await updateDoc(statsRef, {
      connections: increment(1),
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error adding connection:', error);
  }
};

// Add new achievement
export const addAchievement = async (userId: string, achievement: {
  title: string;
  description: string;
  type: 'training' | 'performance' | 'social' | 'milestone';
  date: Date;
  points?: number;
}) => {
  try {
    // Add to achievements collection
    const achievementRef = doc(collection(db, 'achievements'));
    await setDoc(achievementRef, {
      userId,
      ...achievement,
      createdAt: new Date()
    });

    // Update user achievements array
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentAchievements = userDoc.data()?.achievements || [];
    
    await updateDoc(userRef, {
      achievements: [...currentAchievements, achievement.title]
    });

    // Update stats
    const statsRef = doc(db, 'userStats', userId);
    await updateDoc(statsRef, {
      achievements: increment(1),
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error adding achievement:', error);
  }
};

// Get user stats
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    const statsRef = doc(db, 'userStats', userId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      return {
        profileViews: statsDoc.data().profileViews || 0,
        qrScans: statsDoc.data().qrScans || 0,
        connections: statsDoc.data().connections || 0,
        achievements: statsDoc.data().achievements || 0,
        lastUpdated: statsDoc.data().lastUpdated?.toDate() || new Date()
      };
    }
    
    // Initialize if doesn't exist
    await initializeUserStats(userId);
    return {
      profileViews: 0,
      qrScans: 0,
      connections: 0,
      achievements: 0,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

// Get real connections count
export const getRealConnectionsCount = async (userId: string): Promise<number> => {
  try {
    const connectionsQuery = query(
      collection(db, 'connections'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(connectionsQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting connections count:', error);
    return 0;
  }
};

// Get real achievements count
export const getRealAchievementsCount = async (userId: string): Promise<number> => {
  try {
    const achievementsQuery = query(
      collection(db, 'achievements'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(achievementsQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting achievements count:', error);
    return 0;
  }
};

// Auto-award achievements based on activities
export const checkAndAwardAchievements = async (userId: string) => {
  try {
    const stats = await getUserStats(userId);
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentAchievements = userDoc.data()?.achievements || [];

    // Achievement milestones
    const milestones = [
      { views: 10, title: 'First Steps', description: 'Reached 10 profile views' },
      { views: 50, title: 'Getting Noticed', description: 'Reached 50 profile views' },
      { views: 100, title: 'Popular Athlete', description: 'Reached 100 profile views' },
      { qrScans: 5, title: 'QR Explorer', description: 'QR code scanned 5 times' },
      { qrScans: 25, title: 'Digital Networker', description: 'QR code scanned 25 times' },
      { connections: 5, title: 'Social Starter', description: 'Made 5 connections' },
      { connections: 20, title: 'Network Builder', description: 'Made 20 connections' },
    ];

    if (stats) {
      for (const milestone of milestones) {
        const achievementTitle = milestone.title;
        
        if (!currentAchievements.includes(achievementTitle)) {
          if ((milestone.views && stats.profileViews >= milestone.views) ||
              (milestone.qrScans && stats.qrScans >= milestone.qrScans) ||
              (milestone.connections && stats.connections >= milestone.connections)) {
            
            await addAchievement(userId, {
              title: milestone.title,
              description: milestone.description,
              type: 'milestone',
              date: new Date(),
              points: 10
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
};