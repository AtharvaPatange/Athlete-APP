// Quest Tier Initialization Script
// This script creates the tier-based quest structure in Firebase

import { 
  createQuest, 
  QuestTier, 
  BadgeRarity, 
  QuestType 
} from '@/services/gamificationService';

// Tier-based quest definitions
const QUEST_TIERS = {
  bronze: [
    {
      title: "First Steps",
      description: "Complete your first training session and begin your athletic journey",
      type: 'sessions' as QuestType,
      target: 1,
      points: 10,
      duration: 7,
      rarity: 'common' as BadgeRarity,
      tier: 'bronze' as QuestTier,
      icon: "👟",
      badge: true,
      requirements: { level: 1 }
    },
    {
      title: "Distance Explorer", 
      description: "Run a total distance of 5 kilometers across multiple sessions",
      type: 'distance' as QuestType,
      target: 5,
      points: 15,
      duration: 14,
      rarity: 'common' as BadgeRarity,
      tier: 'bronze' as QuestTier,
      icon: "🏃",
      badge: false,
      requirements: { sport: 'running' }
    },
    {
      title: "Consistency Builder",
      description: "Log training sessions for 3 consecutive days",
      type: 'consistency' as QuestType,
      target: 3,
      points: 20,
      duration: 7,
      rarity: 'uncommon' as BadgeRarity,
      tier: 'bronze' as QuestTier,
      icon: "📅",
      badge: true,
      requirements: {}
    },
    {
      title: "Time Commitment",
      description: "Accumulate 2 hours of total training time",
      type: 'duration' as QuestType,
      target: 120, // 120 minutes
      points: 25,
      duration: 14,
      rarity: 'uncommon' as BadgeRarity,
      tier: 'bronze' as QuestTier,
      icon: "⏱️",
      badge: false,
      requirements: {}
    }
  ],
  
  silver: [
    {
      title: "Speed Demon",
      description: "Achieve an average pace of 5 min/km in a running session",
      type: 'speed' as QuestType,
      target: 5, // 5 min/km pace
      points: 30,
      duration: 21,
      rarity: 'rare' as BadgeRarity,
      tier: 'silver' as QuestTier,
      icon: "⚡",
      badge: true,
      requirements: { sport: 'running', previousTierCompleted: 'bronze' }
    },
    {
      title: "Endurance Builder",
      description: "Complete a single session lasting 60 minutes or more",
      type: 'endurance' as QuestType,
      target: 60,
      points: 35,
      duration: 21,
      rarity: 'rare' as BadgeRarity,
      tier: 'silver' as QuestTier,
      icon: "💪",
      badge: false,
      requirements: { previousTierCompleted: 'bronze' }
    },
    {
      title: "Distance Warrior",
      description: "Run 25 kilometers total across all sessions",
      type: 'distance' as QuestType,
      target: 25,
      points: 40,
      duration: 28,
      rarity: 'rare' as BadgeRarity,
      tier: 'silver' as QuestTier,
      icon: "🏃‍♂️",
      badge: true,
      requirements: { sport: 'running', previousTierCompleted: 'bronze' }
    },
    {
      title: "Weekly Warrior",
      description: "Complete 7 training sessions in total",
      type: 'sessions' as QuestType,
      target: 7,
      points: 45,
      duration: 21,
      rarity: 'epic' as BadgeRarity,
      tier: 'silver' as QuestTier,
      icon: "🗓️",
      badge: true,
      requirements: { previousTierCompleted: 'bronze' }
    }
  ],

  gold: [
    {
      title: "Elite Pace",
      description: "Maintain sub 4:30 min/km pace in a running session",
      type: 'speed' as QuestType,
      target: 4.5,
      points: 50,
      duration: 30,
      rarity: 'epic' as BadgeRarity,
      tier: 'gold' as QuestTier,
      icon: "🏆",
      badge: true,
      requirements: { sport: 'running', previousTierCompleted: 'silver' }
    },
    {
      title: "Marathon Preparation",
      description: "Complete a single session of 90 minutes or more",
      type: 'endurance' as QuestType,
      target: 90,
      points: 60,
      duration: 35,
      rarity: 'epic' as BadgeRarity,
      tier: 'gold' as QuestTier,
      icon: "🏃‍♀️",
      badge: true,
      requirements: { previousTierCompleted: 'silver' }
    },
    {
      title: "Century Runner",
      description: "Reach 100 kilometers total distance",
      type: 'distance' as QuestType,
      target: 100,
      points: 75,
      duration: 60,
      rarity: 'legendary' as BadgeRarity,
      tier: 'gold' as QuestTier,
      icon: "💯",
      badge: true,
      requirements: { sport: 'running', previousTierCompleted: 'silver' }
    },
    {
      title: "Strength Foundation",
      description: "Complete 15 strength training sessions",
      type: 'sessions' as QuestType,
      target: 15,
      points: 55,
      duration: 45,
      rarity: 'epic' as BadgeRarity,
      tier: 'gold' as QuestTier,
      icon: "🏋️",
      badge: false,
      requirements: { sport: 'strength', previousTierCompleted: 'silver' }
    }
  ],

  platinum: [
    {
      title: "Lightning Speed",
      description: "Achieve sub 4:00 min/km pace in a session",
      type: 'speed' as QuestType,
      target: 4,
      points: 80,
      duration: 45,
      rarity: 'legendary' as BadgeRarity,
      tier: 'platinum' as QuestTier,
      icon: "⚡🏃",
      badge: true,
      requirements: { sport: 'running', previousTierCompleted: 'gold' }
    },
    {
      title: "Ultra Endurance",
      description: "Complete a 2+ hour training session",
      type: 'endurance' as QuestType,
      target: 120,
      points: 90,
      duration: 50,
      rarity: 'legendary' as BadgeRarity,
      tier: 'platinum' as QuestTier,
      icon: "🦾",
      badge: true,
      requirements: { previousTierCompleted: 'gold' }
    },
    {
      title: "Distance Master",
      description: "Accumulate 250 kilometers total",
      type: 'distance' as QuestType,
      target: 250,
      points: 100,
      duration: 90,
      rarity: 'legendary' as BadgeRarity,
      tier: 'platinum' as QuestTier,
      icon: "🌟",
      badge: true,
      requirements: { sport: 'running', previousTierCompleted: 'gold' }
    },
    {
      title: "Elite Athlete",
      description: "Complete 50 total training sessions",
      type: 'sessions' as QuestType,
      target: 50,
      points: 85,
      duration: 75,
      rarity: 'legendary' as BadgeRarity,
      tier: 'platinum' as QuestTier,
      icon: "👑",
      badge: true,
      requirements: { previousTierCompleted: 'gold' }
    }
  ],

  diamond: [
    {
      title: "Superhuman Speed",
      description: "Break the 3:30 min/km barrier",
      type: 'speed' as QuestType,
      target: 3.5,
      points: 120,
      duration: 60,
      rarity: 'mythical' as BadgeRarity,
      tier: 'diamond' as QuestTier,
      icon: "💎⚡",
      badge: true,
      requirements: { sport: 'running', previousTierCompleted: 'platinum' }
    },
    {
      title: "Iron Endurance",
      description: "Complete a 3+ hour session",
      type: 'endurance' as QuestType,
      target: 180,
      points: 150,
      duration: 90,
      rarity: 'mythical' as BadgeRarity,
      tier: 'diamond' as QuestTier,
      icon: "💎💪",
      badge: true,
      requirements: { previousTierCompleted: 'platinum' }
    },
    {
      title: "Legendary Distance",
      description: "Reach the ultimate 500km milestone",
      type: 'distance' as QuestType,
      target: 500,
      points: 200,
      duration: 180,
      rarity: 'mythical' as BadgeRarity,
      tier: 'diamond' as QuestTier,
      icon: "💎🏃",
      badge: true,
      requirements: { sport: 'running', previousTierCompleted: 'platinum' }
    },
    {
      title: "Master Athlete",
      description: "Complete 100 total training sessions",
      type: 'sessions' as QuestType,
      target: 100,
      points: 175,
      duration: 120,
      rarity: 'mythical' as BadgeRarity,
      tier: 'diamond' as QuestTier,
      icon: "💎👑",
      badge: true,
      requirements: { previousTierCompleted: 'platinum' }
    }
  ]
};

// Function to initialize all tier quests
export const initializeTierQuests = async (): Promise<void> => {
  console.log('🚀 Initializing tier-based quest system...');
  
  for (const [tierName, quests] of Object.entries(QUEST_TIERS)) {
    console.log(`📝 Creating ${tierName} tier quests...`);
    
    for (const questData of quests) {
      try {
        const result = await createQuest(questData);
        if (result.success) {
          console.log(`✅ Created quest: ${questData.title} (${tierName})`);
        } else {
          console.error(`❌ Failed to create quest: ${questData.title}`, result.error);
        }
      } catch (error) {
        console.error(`💥 Error creating quest ${questData.title}:`, error);
      }
    }
  }
  
  console.log('🎉 Tier quest initialization complete!');
};

// Export the quest structure for reference
export { QUEST_TIERS };