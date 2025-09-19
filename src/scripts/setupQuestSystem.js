// Complete quest system setup - run this to fix the "no challenges available" issue
// This will create all quests and initialize your athlete tier progress

const setupCompleteQuestSystem = async () => {
  console.log('🎮 COMPLETE QUEST SYSTEM SETUP');
  console.log('================================\n');
  
  const athleteId = prompt('Enter your athlete ID (or press OK for test-athlete-123):') || 'test-athlete-123';
  console.log(`👤 Setting up for athlete: ${athleteId}\n`);
  
  try {
    // Step 1: Create all tier-based quests
    console.log('STEP 1: Creating tier-based quests...');
    console.log('====================================');
    
    const gamificationModule = await import('/src/services/gamificationService.js');
    const { createQuest, initializeAthleteTierProgress, getAthleteTierProgress } = gamificationModule;
    
    // All 20 tier-based quests
    const QUESTS = [
      // Bronze Tier (4 quests)
      { title: "First Steps", description: "Complete your first training session", type: 'sessions', target: 1, points: 10, duration: 7, rarity: 'common', tier: 'bronze', icon: "👟", badge: true, requirements: { level: 1 } },
      { title: "Distance Explorer", description: "Run 5km total", type: 'distance', target: 5, points: 15, duration: 14, rarity: 'common', tier: 'bronze', icon: "🏃", badge: false, requirements: { sport: 'running' } },
      { title: "Consistency Builder", description: "3 consecutive training days", type: 'consistency', target: 3, points: 20, duration: 7, rarity: 'uncommon', tier: 'bronze', icon: "📅", badge: true, requirements: {} },
      { title: "Time Commitment", description: "2 hours total training", type: 'duration', target: 120, points: 25, duration: 14, rarity: 'uncommon', tier: 'bronze', icon: "⏱️", badge: false, requirements: {} },
      
      // Silver Tier (4 quests)
      { title: "Speed Demon", description: "5 min/km pace", type: 'speed', target: 5, points: 30, duration: 21, rarity: 'rare', tier: 'silver', icon: "⚡", badge: true, requirements: { sport: 'running', previousTierCompleted: 'bronze' } },
      { title: "Endurance Builder", description: "60-minute session", type: 'endurance', target: 60, points: 35, duration: 21, rarity: 'rare', tier: 'silver', icon: "💪", badge: false, requirements: { previousTierCompleted: 'bronze' } },
      { title: "Distance Warrior", description: "25km total", type: 'distance', target: 25, points: 40, duration: 28, rarity: 'rare', tier: 'silver', icon: "🏃‍♂️", badge: true, requirements: { sport: 'running', previousTierCompleted: 'bronze' } },
      { title: "Weekly Warrior", description: "7 total sessions", type: 'sessions', target: 7, points: 45, duration: 21, rarity: 'epic', tier: 'silver', icon: "🗓️", badge: true, requirements: { previousTierCompleted: 'bronze' } },
      
      // Gold Tier (4 quests)
      { title: "Elite Pace", description: "Sub 4:30 min/km", type: 'speed', target: 4.5, points: 50, duration: 30, rarity: 'epic', tier: 'gold', icon: "🏆", badge: true, requirements: { sport: 'running', previousTierCompleted: 'silver' } },
      { title: "Marathon Prep", description: "90-minute session", type: 'endurance', target: 90, points: 60, duration: 35, rarity: 'epic', tier: 'gold', icon: "🏃‍♀️", badge: true, requirements: { previousTierCompleted: 'silver' } },
      { title: "Century Runner", description: "100km total", type: 'distance', target: 100, points: 75, duration: 60, rarity: 'legendary', tier: 'gold', icon: "💯", badge: true, requirements: { sport: 'running', previousTierCompleted: 'silver' } },
      { title: "Strength Foundation", description: "15 strength sessions", type: 'sessions', target: 15, points: 55, duration: 45, rarity: 'epic', tier: 'gold', icon: "🏋️", badge: false, requirements: { sport: 'strength', previousTierCompleted: 'silver' } },
      
      // Platinum Tier (4 quests)
      { title: "Lightning Speed", description: "Sub 4:00 min/km", type: 'speed', target: 4, points: 80, duration: 45, rarity: 'legendary', tier: 'platinum', icon: "⚡🏃", badge: true, requirements: { sport: 'running', previousTierCompleted: 'gold' } },
      { title: "Ultra Endurance", description: "2+ hour session", type: 'endurance', target: 120, points: 90, duration: 50, rarity: 'legendary', tier: 'platinum', icon: "🦾", badge: true, requirements: { previousTierCompleted: 'gold' } },
      { title: "Distance Master", description: "250km total", type: 'distance', target: 250, points: 100, duration: 90, rarity: 'legendary', tier: 'platinum', icon: "🌟", badge: true, requirements: { sport: 'running', previousTierCompleted: 'gold' } },
      { title: "Elite Athlete", description: "50 total sessions", type: 'sessions', target: 50, points: 85, duration: 75, rarity: 'legendary', tier: 'platinum', icon: "👑", badge: true, requirements: { previousTierCompleted: 'gold' } },
      
      // Diamond Tier (4 quests)
      { title: "Superhuman Speed", description: "3:30 min/km barrier", type: 'speed', target: 3.5, points: 120, duration: 60, rarity: 'mythical', tier: 'diamond', icon: "💎⚡", badge: true, requirements: { sport: 'running', previousTierCompleted: 'platinum' } },
      { title: "Iron Endurance", description: "3+ hour session", type: 'endurance', target: 180, points: 150, duration: 90, rarity: 'mythical', tier: 'diamond', icon: "💎💪", badge: true, requirements: { previousTierCompleted: 'platinum' } },
      { title: "Legendary Distance", description: "500km milestone", type: 'distance', target: 500, points: 200, duration: 180, rarity: 'mythical', tier: 'diamond', icon: "💎🏃", badge: true, requirements: { sport: 'running', previousTierCompleted: 'platinum' } },
      { title: "Master Athlete", description: "100 total sessions", type: 'sessions', target: 100, points: 175, duration: 120, rarity: 'mythical', tier: 'diamond', icon: "💎👑", badge: true, requirements: { previousTierCompleted: 'platinum' } }
    ];
    
    let created = 0;
    for (const quest of QUESTS) {
      try {
        const result = await createQuest(quest);
        if (result.success) {
          created++;
          console.log(`✅ ${created}/20: ${quest.title} (${quest.tier})`);
        } else {
          console.log(`❌ Failed: ${quest.title} - ${result.error}`);
        }
      } catch (error) {
        console.log(`💥 Error: ${quest.title} - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Created ${created}/20 quests\n`);
    
    // Step 2: Initialize athlete tier progress
    console.log('STEP 2: Initializing athlete tier progress...');
    console.log('===========================================');
    
    await initializeAthleteTierProgress(athleteId);
    const tierResult = await getAthleteTierProgress(athleteId);
    
    if (tierResult.success) {
      console.log('✅ Athlete tier progress initialized!');
      console.log(`📊 Current tier: ${tierResult.tierProgress.currentTier}`);
      console.log(`🥉 Bronze tier: ${tierResult.tierProgress.tiers.bronze.isUnlocked ? 'Unlocked' : 'Locked'}`);
    }
    
    // Step 3: Final verification
    console.log('\nSTEP 3: Final verification...');
    console.log('=============================');
    
    const { getActiveQuests } = gamificationModule;
    const questCheck = await getActiveQuests();
    
    if (questCheck.success) {
      const bronzeQuests = questCheck.quests.filter(q => q.tier === 'bronze');
      console.log(`✅ Total active quests: ${questCheck.quests.length}`);
      console.log(`🥉 Bronze quests available: ${bronzeQuests.length}`);
      
      if (bronzeQuests.length > 0) {
        console.log('\n🎉 SUCCESS! Quest system is ready!');
        console.log('📱 Go to Quest Dashboard and refresh the page');
        console.log('🥉 You should now see Bronze tier quests available');
      } else {
        console.log('\n⚠️ No Bronze quests found - check quest creation');
      }
    }
    
    console.log('\n🎮 SETUP COMPLETE!');
    console.log('=================');
    console.log('Next steps:');
    console.log('1. Refresh the Quest Dashboard page');
    console.log('2. You should see Bronze tier quests available');
    console.log('3. Complete quests to unlock higher tiers');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
};

// Expose function globally
if (typeof window !== 'undefined') {
  window.setupCompleteQuestSystem = setupCompleteQuestSystem;
  console.log('🎮 QUEST SYSTEM SETUP READY!');
  console.log('============================');
  console.log('Run setupCompleteQuestSystem() to create all quests and fix the "no challenges available" issue');
}