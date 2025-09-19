/**
 * Quest System Demonstration for New 4-Category Training System
 * 
 * This file demonstrates how the updated quest system works with the new
 * 4-category training structure: Cardio, Strength, Flexibility & Balance, Coordination
 */

import { Quest, QuestTier } from '@/services/gamificationService';

// Example quest configurations for each category
export const categoryQuestExamples: Record<string, Quest[]> = {
  // CARDIO CATEGORY QUESTS
  cardio: [
    {
      title: "Cardio Newcomer",
      description: "Complete your first cardio session (running, cycling, swimming, etc.)",
      type: "sessions",
      target: 1,
      points: 30,
      badge: "cardio_newcomer_badge",
      icon: "💓",
      rarity: "bronze",
      tier: "bronze",
      questOrder: 1,
      duration: 7,
      requirements: { category: "cardio" },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: "Heart Rate Hero",
      description: "Complete 3 high-intensity cardio sessions",
      type: "sessions",
      target: 3,
      points: 120,
      badge: "heart_rate_hero_badge",
      icon: "💗",
      rarity: "silver",
      tier: "silver",
      questOrder: 2,
      duration: 14,
      requirements: { category: "cardio", intensity: "high" },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  ],

  // STRENGTH CATEGORY QUESTS
  strength: [
    {
      title: "Strength Starter",
      description: "Begin your strength journey with your first strength training session",
      type: "sessions",
      target: 1,
      points: 35,
      badge: "strength_starter_badge",
      icon: "💪",
      rarity: "bronze",
      tier: "bronze",
      questOrder: 1,
      duration: 7,
      requirements: { category: "strength" },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: "Power Builder",
      description: "Complete 6 strength sessions to build muscle power",
      type: "sessions",
      target: 6,
      points: 140,
      badge: "power_builder_badge",
      icon: "🏋️‍♂️",
      rarity: "silver",
      tier: "silver",
      questOrder: 2,
      duration: 21,
      requirements: { category: "strength", minDuration: 25 },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  ],

  // FLEXIBILITY & BALANCE CATEGORY QUESTS
  'flexibility & balance': [
    {
      title: "Flexibility Explorer",
      description: "Discover flexibility training with your first session",
      type: "sessions",
      target: 1,
      points: 25,
      badge: "flexibility_explorer_badge",
      icon: "🧘‍♀️",
      rarity: "bronze",
      tier: "bronze",
      questOrder: 1,
      duration: 7,
      requirements: { category: "flexibility & balance" },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: "Balance Achiever",
      description: "Master balance with 4 flexibility & balance sessions",
      type: "sessions",
      target: 4,
      points: 100,
      badge: "balance_achiever_badge",
      icon: "⚖️",
      rarity: "silver",
      tier: "silver",
      questOrder: 2,
      duration: 14,
      requirements: { category: "flexibility & balance", minDuration: 20 },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  ],

  // COORDINATION CATEGORY QUESTS
  coordination: [
    {
      title: "Coordination Beginner",
      description: "Start improving your coordination with your first session",
      type: "sessions",
      target: 1,
      points: 30,
      badge: "coordination_beginner_badge",
      icon: "🎯",
      rarity: "bronze",
      tier: "bronze",
      questOrder: 1,
      duration: 7,
      requirements: { category: "coordination" },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: "Agility Master",
      description: "Complete 5 coordination training sessions for better agility",
      type: "sessions",
      target: 5,
      points: 130,
      badge: "agility_master_badge",
      icon: "🏃‍♂️💨",
      rarity: "silver",
      tier: "silver",
      questOrder: 2,
      duration: 14,
      requirements: { category: "coordination", minDuration: 20 },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  ]
};

// Sample training sessions demonstrating the new category system
export interface SampleTrainingSession {
  id: string;
  date: Date;
  exerciseType: string;
  category: string; // New category field
  duration: number;
  intensity: 'low' | 'medium' | 'high' | 'peak';
  distance?: number;
  description: string;
}

export const sampleTrainingSessions: SampleTrainingSession[] = [
  // CARDIO SESSIONS
  {
    id: "cardio_1",
    date: new Date(),
    exerciseType: "Running",
    category: "cardio",
    duration: 30,
    intensity: "medium",
    distance: 5,
    description: "Morning jog in the park for cardiovascular fitness"
  },
  {
    id: "cardio_2",
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    exerciseType: "Cycling",
    category: "cardio",
    duration: 45,
    intensity: "high",
    distance: 15,
    description: "High-intensity cycling for endurance building"
  },

  // STRENGTH SESSIONS
  {
    id: "strength_1",
    date: new Date(),
    exerciseType: "Weight Lifting",
    category: "strength",
    duration: 40,
    intensity: "high",
    description: "Full body strength training with weights"
  },
  {
    id: "strength_2",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    exerciseType: "Bodyweight Exercises",
    category: "strength",
    duration: 25,
    intensity: "medium",
    description: "Push-ups, pull-ups, and bodyweight strength exercises"
  },

  // FLEXIBILITY & BALANCE SESSIONS
  {
    id: "flexibility_1",
    date: new Date(),
    exerciseType: "Yoga",
    category: "flexibility & balance",
    duration: 60,
    intensity: "low",
    description: "Hatha yoga session focusing on flexibility and balance"
  },
  {
    id: "flexibility_2",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    exerciseType: "Stretching",
    category: "flexibility & balance",
    duration: 20,
    intensity: "low",
    description: "Dynamic stretching routine for improved flexibility"
  },

  // COORDINATION SESSIONS
  {
    id: "coordination_1",
    date: new Date(),
    exerciseType: "Boxing",
    category: "coordination",
    duration: 35,
    intensity: "high",
    description: "Boxing training for hand-eye coordination and agility"
  },
  {
    id: "coordination_2",
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    exerciseType: "Tennis",
    category: "coordination",
    duration: 50,
    intensity: "medium",
    description: "Tennis practice for improved coordination and reflexes"
  }
];

/**
 * Demonstrates how quest matching works with the new category system
 */
export const demonstrateQuestMatching = () => {
  console.log("🎯 Quest System Category Matching Demonstration\n");

  // Example: How a cardio quest would match training sessions
  const cardioQuest = categoryQuestExamples.cardio[0];
  const cardioSessions = sampleTrainingSessions.filter(session => 
    session.category === "cardio"
  );

  console.log(`Quest: "${cardioQuest.title}"`);
  console.log(`Target: ${cardioQuest.target} sessions`);
  console.log(`Matching sessions: ${cardioSessions.length}`);
  console.log("Matching sessions:");
  cardioSessions.forEach(session => {
    console.log(`  - ${session.exerciseType} (${session.category}) - ${session.duration}min`);
  });

  console.log("\n" + "=".repeat(50) + "\n");

  // Example: Cross-category quest matching
  const wellRoundedQuest: Quest = {
    title: "Well-Rounded Athlete",
    description: "Train in 2 different categories this week",
    type: "sessions",
    target: 2,
    points: 80,
    badge: "well_rounded_athlete_badge",
    icon: "🌟",
    rarity: "bronze",
    tier: "bronze",
    questOrder: 9,
    duration: 7,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true
  };

  const uniqueCategories = new Set(sampleTrainingSessions.map(s => s.category));
  console.log(`Quest: "${wellRoundedQuest.title}"`);
  console.log(`Target: Train in ${wellRoundedQuest.target} different categories`);
  console.log(`Categories trained: ${uniqueCategories.size} (${Array.from(uniqueCategories).join(", ")})`);
  console.log(`Progress: ${Math.min(uniqueCategories.size, wellRoundedQuest.target)}/${wellRoundedQuest.target}`);

  return {
    cardioQuestProgress: Math.min(cardioSessions.length, cardioQuest.target),
    wellRoundedProgress: Math.min(uniqueCategories.size, wellRoundedQuest.target)
  };
};

/**
 * Summary of the 4-category quest system
 */
export const questSystemSummary = {
  categories: [
    {
      name: "Cardio",
      icon: "❤️",
      description: "Running, cycling, swimming, aerobic exercises",
      questExamples: ["Cardio Newcomer", "Heart Rate Hero", "Cardio Champion"]
    },
    {
      name: "Strength", 
      icon: "💪",
      description: "Weight lifting, bodyweight exercises, resistance training",
      questExamples: ["Strength Starter", "Power Builder", "Strength Elite"]
    },
    {
      name: "Flexibility & Balance",
      icon: "🧘",
      description: "Yoga, pilates, stretching, balance exercises",
      questExamples: ["Flexibility Explorer", "Balance Achiever", "Balance Master"]
    },
    {
      name: "Coordination",
      icon: "🎯", 
      description: "Boxing, tennis, martial arts, agility training",
      questExamples: ["Coordination Beginner", "Agility Master", "Coordination Legend"]
    }
  ],
  tiers: [
    { name: "Bronze", color: "#CD7F32", description: "Beginner level quests" },
    { name: "Silver", color: "#C0C0C0", description: "Intermediate level challenges" },
    { name: "Gold", color: "#FFD700", description: "Advanced level achievements" },
    { name: "Platinum", color: "#E5E4E2", description: "Expert level mastery" },
    { name: "Diamond", color: "#B9F2FF", description: "Elite level excellence" }
  ],
  features: [
    "✅ Category-based quest matching",
    "✅ Backward compatibility with sport-specific data",
    "✅ Flexible matching for exercise types and categories",
    "✅ Cross-category quests for well-rounded training",
    "✅ Tier-based progression system",
    "✅ Badge rewards and point system",
    "✅ Auto-sync quest progress tracking"
  ]
};