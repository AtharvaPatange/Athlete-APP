// Athlete tier progress initialization script
// Run this after creating quests to set up tier progression

const initializeAthleteForTiers = async (athleteId = 'test-athlete-123') => {
  console.log(`🏃 Initializing tier progress for athlete: ${athleteId}`);
  
  try {
    // Import required functions
    const gamificationModule = await import('/src/services/gamificationService.js');
    const { initializeAthleteTierProgress, getAthleteTierProgress } = gamificationModule;
    
    console.log('1. Initializing tier progress...');
    await initializeAthleteTierProgress(athleteId);
    
    console.log('2. Checking tier progress...');
    const result = await getAthleteTierProgress(athleteId);
    
    if (result.success && result.tierProgress) {
      console.log('✅ Tier progress initialized successfully!');
      console.log('📊 Current status:');
      console.log(`   Current Tier: ${result.tierProgress.currentTier}`);
      
      // Show tier status
      const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      tiers.forEach(tier => {
        const tierInfo = result.tierProgress.tiers[tier];
        const status = tierInfo.isMedalAwarded ? '🏅 Medal' : 
                      tierInfo.isUnlocked ? '🔓 Unlocked' : '🔒 Locked';
        console.log(`   ${tier.charAt(0).toUpperCase() + tier.slice(1)}: ${status} (${tierInfo.completedQuests}/${tierInfo.totalQuests} quests)`);
      });
      
      return result.tierProgress;
    } else {
      console.error('❌ Failed to initialize tier progress:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('💥 Error initializing athlete tiers:', error);
    return null;
  }
};

// Expose function globally
if (typeof window !== 'undefined') {
  window.initializeAthleteForTiers = initializeAthleteForTiers;
  console.log('🏃 Athlete tier initialization loaded! Run initializeAthleteForTiers("your-athlete-id") to setup tier progression');
}