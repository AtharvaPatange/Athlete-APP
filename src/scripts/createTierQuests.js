// Simple quest initialization script for browser console
// This will create all 20 tier-based quests in your Firebase database

const initializeAllQuests = async () => {
  console.log('🚀 Starting quest initialization...\n');
  
  try {
    // Import gamification service
    const gamificationModule = await import('/src/services/gamificationService.js');
    const { createQuest } = gamificationModule;
    
    // Define all tier-based quests
    const TIER_QUESTS = [
      // BRONZE TIER
      {
        title: "First Steps",
        description: "Complete your first training session and begin your athletic journey",
        type: 'sessions',
        target: 1,
        points: 10,
        duration: 7,
        rarity: 'common',
        tier: 'bronze',
        icon: "👟",
        badge: true,
        requirements: { level: 1 }
      },
      {
        title: "Distance Explorer", 
        description: "Run a total distance of 5 kilometers across multiple sessions",
        type: 'distance',
        target: 5,
        points: 15,
        duration: 14,
        rarity: 'common',
        tier: 'bronze',
        icon: "🏃",
        badge: false,
        requirements: { sport: 'running' }
      },
      {
        title: "Consistency Builder",
        description: "Log training sessions for 3 consecutive days",
        type: 'consistency',
        target: 3,
        points: 20,
        duration: 7,
        rarity: 'uncommon',
        tier: 'bronze',
        icon: "📅",
        badge: true,
        requirements: {}
      },
      {
        title: "Time Commitment",
        description: "Accumulate 2 hours of total training time",
        type: 'duration',
        target: 120,
        points: 25,
        duration: 14,
        rarity: 'uncommon',
        tier: 'bronze',
        icon: "⏱️",
        badge: false,
        requirements: {}
      },
      
      // SILVER TIER  
      {
        title: "Speed Demon",
        description: "Achieve an average pace of 5 min/km in a running session",
        type: 'speed',
        target: 5,
        points: 30,
        duration: 21,
        rarity: 'rare',
        tier: 'silver',
        icon: "⚡",
        badge: true,
        requirements: { sport: 'running', previousTierCompleted: 'bronze' }
      },
      {
        title: "Endurance Builder",
        description: "Complete a single session lasting 60 minutes or more",
        type: 'endurance',
        target: 60,
        points: 35,
        duration: 21,
        rarity: 'rare',
        tier: 'silver',
        icon: "💪",
        badge: false,
        requirements: { previousTierCompleted: 'bronze' }
      },
      {
        title: "Distance Warrior",
        description: "Run 25 kilometers total across all sessions",
        type: 'distance',
        target: 25,
        points: 40,
        duration: 28,
        rarity: 'rare',
        tier: 'silver',
        icon: "🏃‍♂️",
        badge: true,
        requirements: { sport: 'running', previousTierCompleted: 'bronze' }
      },
      {
        title: "Weekly Warrior",
        description: "Complete 7 training sessions in total",
        type: 'sessions',
        target: 7,
        points: 45,
        duration: 21,
        rarity: 'epic',
        tier: 'silver',
        icon: "🗓️",
        badge: true,
        requirements: { previousTierCompleted: 'bronze' }
      },

      // GOLD TIER
      {
        title: "Elite Pace",
        description: "Maintain sub 4:30 min/km pace in a running session",
        type: 'speed',
        target: 4.5,
        points: 50,
        duration: 30,
        rarity: 'epic',
        tier: 'gold',
        icon: "🏆",
        badge: true,
        requirements: { sport: 'running', previousTierCompleted: 'silver' }
      },
      {
        title: "Marathon Preparation",
        description: "Complete a single session of 90 minutes or more",
        type: 'endurance',
        target: 90,
        points: 60,
        duration: 35,
        rarity: 'epic',
        tier: 'gold',
        icon: "🏃‍♀️",
        badge: true,
        requirements: { previousTierCompleted: 'silver' }
      },
      {
        title: "Century Runner",
        description: "Reach 100 kilometers total distance",
        type: 'distance',
        target: 100,
        points: 75,
        duration: 60,
        rarity: 'legendary',
        tier: 'gold',
        icon: "💯",
        badge: true,
        requirements: { sport: 'running', previousTierCompleted: 'silver' }
      },
      {
        title: "Strength Foundation",
        description: "Complete 15 strength training sessions",
        type: 'sessions',
        target: 15,
        points: 55,
        duration: 45,
        rarity: 'epic',
        tier: 'gold',
        icon: "🏋️",
        badge: false,
        requirements: { sport: 'strength', previousTierCompleted: 'silver' }
      },

      // PLATINUM TIER
      {
        title: "Lightning Speed",
        description: "Achieve sub 4:00 min/km pace in a session",
        type: 'speed',
        target: 4,
        points: 80,
        duration: 45,
        rarity: 'legendary',
        tier: 'platinum',
        icon: "⚡🏃",
        badge: true,
        requirements: { sport: 'running', previousTierCompleted: 'gold' }
      },
      {
        title: "Ultra Endurance",
        description: "Complete a 2+ hour training session",
        type: 'endurance',
        target: 120,
        points: 90,
        duration: 50,
        rarity: 'legendary',
        tier: 'platinum',
        icon: "🦾",
        badge: true,
        requirements: { previousTierCompleted: 'gold' }
      },
      {
        title: "Distance Master",
        description: "Accumulate 250 kilometers total",
        type: 'distance',
        target: 250,
        points: 100,
        duration: 90,
        rarity: 'legendary',
        tier: 'platinum',
        icon: "🌟",
        badge: true,
        requirements: { sport: 'running', previousTierCompleted: 'gold' }
      },
      {
        title: "Elite Athlete",
        description: "Complete 50 total training sessions",
        type: 'sessions',
        target: 50,
        points: 85,
        duration: 75,
        rarity: 'legendary',
        tier: 'platinum',
        icon: "👑",
        badge: true,
        requirements: { previousTierCompleted: 'gold' }
      },

      // DIAMOND TIER
      {
        title: "Superhuman Speed",
        description: "Break the 3:30 min/km barrier",
        type: 'speed',
        target: 3.5,
        points: 120,
        duration: 60,
        rarity: 'mythical',
        tier: 'diamond',
        icon: "💎⚡",
        badge: true,
        requirements: { sport: 'running', previousTierCompleted: 'platinum' }
      },
      {
        title: "Iron Endurance",
        description: "Complete a 3+ hour session",
        type: 'endurance',
        target: 180,
        points: 150,
        duration: 90,
        rarity: 'mythical',
        tier: 'diamond',
        icon: "💎💪",
        badge: true,
        requirements: { previousTierCompleted: 'platinum' }
      },
      {
        title: "Legendary Distance",
        description: "Reach the ultimate 500km milestone",
        type: 'distance',
        target: 500,
        points: 200,
        duration: 180,
        rarity: 'mythical',
        tier: 'diamond',
        icon: "💎🏃",
        badge: true,
        requirements: { sport: 'running', previousTierCompleted: 'platinum' }
      },
      {
        title: "Master Athlete",
        description: "Complete 100 total training sessions",
        type: 'sessions',
        target: 100,
        points: 175,
        duration: 120,
        rarity: 'mythical',
        tier: 'diamond',
        icon: "💎👑",
        badge: true,
        requirements: { previousTierCompleted: 'platinum' }
      }
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    // Create each quest
    for (let i = 0; i < TIER_QUESTS.length; i++) {
      const questData = TIER_QUESTS[i];
      console.log(`Creating quest ${i + 1}/20: ${questData.title} (${questData.tier})`);
      
      try {
        const result = await createQuest(questData);
        if (result.success) {
          successCount++;
          console.log(`✅ Created: ${questData.title}`);
        } else {
          failCount++;
          console.error(`❌ Failed: ${questData.title} - ${result.error}`);
        }
      } catch (error) {
        failCount++;
        console.error(`💥 Error creating ${questData.title}:`, error);
      }
    }
    
    console.log(`\n🎉 Quest initialization complete!`);
    console.log(`✅ Successfully created: ${successCount} quests`);
    console.log(`❌ Failed: ${failCount} quests`);
    
    if (successCount > 0) {
      console.log(`\n🔄 Please refresh the Quest Dashboard to see the new quests!`);
    }
    
  } catch (error) {
    console.error('💥 Fatal error during initialization:', error);
  }
};

// Expose function globally
if (typeof window !== 'undefined') {
  window.initializeAllQuests = initializeAllQuests;
  console.log('🚀 Quest initialization loaded! Run initializeAllQuests() to create all tier-based quests');
}