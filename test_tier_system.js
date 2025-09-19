// Test script to verify the tier-based quest system
// Run this in the browser console to test quest progression

const testTierSystem = async () => {
  console.log('🧪 Testing Tier-based Quest System...\n');
  
  // Test athlete ID - use your actual athlete ID
  const athleteId = 'test-athlete-123';
  
  console.log('1. Testing tier progress initialization...');
  try {
    // Initialize tier progress (this should create bronze tier with first quest unlocked)
    const initResult = await initializeAthleteTierProgress(athleteId);
    console.log('✅ Tier progress initialized:', initResult);
    
    // Get tier progress
    const tierResult = await getAthleteTierProgress(athleteId);
    console.log('📊 Current tier progress:', tierResult);
    
  } catch (error) {
    console.error('❌ Tier initialization failed:', error);
  }
  
  console.log('\n2. Testing available quests by tier...');
  try {
    // Get available quests
    const questsResult = await getAvailableQuestsForAthlete(athleteId);
    if (questsResult.success) {
      console.log('🎯 Available quests:', questsResult.quests.length);
      
      // Group by tier
      const questsByTier = {};
      questsResult.quests.forEach(quest => {
        // Find which tier this quest belongs to
        for (const [tier, quests] of Object.entries(QUEST_TIERS)) {
          if (Object.values(quests).some(q => q.id === quest.id)) {
            if (!questsByTier[tier]) questsByTier[tier] = [];
            questsByTier[tier].push(quest.title);
            break;
          }
        }
      });
      
      console.log('📝 Quests by tier:', questsByTier);
    }
  } catch (error) {
    console.error('❌ Quest retrieval failed:', error);
  }
  
  console.log('\n3. Testing quest start and progress...');
  try {
    // Start a bronze tier quest
    const questsResult = await getAvailableQuestsForAthlete(athleteId);
    if (questsResult.success && questsResult.quests.length > 0) {
      const firstQuest = questsResult.quests[0];
      console.log('🚀 Starting quest:', firstQuest.title);
      
      const startResult = await startQuest(athleteId, firstQuest.id);
      console.log('✅ Quest started:', startResult);
      
      // Simulate some progress
      if (startResult.success) {
        console.log('📈 Simulating quest progress...');
        
        // Create a mock training session
        const mockSession = {
          athleteId,
          sport: firstQuest.requirements?.sport || 'running',
          duration: 30, // 30 minutes
          distance: 3, // 3 km
          intensity: 'medium',
          notes: 'Test session for quest progress',
          date: new Date().toISOString().split('T')[0]
        };
        
        // This would normally be done through the TrainingLogForm
        console.log('🏃 Mock training session:', mockSession);
      }
    }
  } catch (error) {
    console.error('❌ Quest start failed:', error);
  }
  
  console.log('\n4. Testing tier unlocking simulation...');
  try {
    // Get current tier progress
    const tierResult = await getAthleteTierProgress(athleteId);
    if (tierResult.success && tierResult.tierProgress) {
      const progress = tierResult.tierProgress;
      console.log('🏆 Current tier:', progress.currentTier);
      console.log('🔓 Unlocked tiers:', progress.unlockedTiers);
      console.log('✅ Completed tiers:', progress.completedTiers);
      console.log('📊 Tier progress:', progress.tierProgress);
    }
  } catch (error) {
    console.error('❌ Tier progress check failed:', error);
  }
  
  console.log('\n✨ Tier system test completed!');
};

// Run the test
if (typeof window !== 'undefined') {
  window.testTierSystem = testTierSystem;
  console.log('🎮 Tier system test loaded! Run testTierSystem() to begin testing.');
}