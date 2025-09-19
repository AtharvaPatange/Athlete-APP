// Debug script to check current quest data
// Run this in browser console to see what quests exist

const debugCurrentQuests = async () => {
  console.log('🔍 Debugging current quest data...\n');
  
  try {
    // Import the required functions (adjust path as needed)
    const { getActiveQuests, getAthleteTierProgress } = await import('/src/services/gamificationService.js');
    
    console.log('1. Checking active quests...');
    const questsResult = await getActiveQuests();
    console.log('📊 Active quests result:', questsResult);
    
    if (questsResult.success) {
      console.log('📝 Total active quests:', questsResult.quests.length);
      
      if (questsResult.quests.length > 0) {
        console.log('🎯 Quest details:');
        questsResult.quests.forEach((quest, index) => {
          console.log(`${index + 1}. ${quest.title} (${quest.tier || 'No tier'}) - ${quest.type}`);
        });
        
        // Group by tier
        const questsByTier = {};
        questsResult.quests.forEach(quest => {
          const tier = quest.tier || 'unknown';
          if (!questsByTier[tier]) questsByTier[tier] = [];
          questsByTier[tier].push(quest.title);
        });
        
        console.log('📋 Quests grouped by tier:', questsByTier);
      } else {
        console.log('⚠️ No active quests found - database might be empty');
      }
    }
    
    console.log('\n2. Checking athlete tier progress...');
    // Use a test athlete ID - replace with actual ID
    const athleteId = 'test-athlete-123';
    const tierResult = await getAthleteTierProgress(athleteId);
    console.log('🏆 Tier progress result:', tierResult);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    console.log('💡 Make sure you are on the quest dashboard page');
  }
  
  console.log('\n✨ Debug complete!');
};

// Expose function globally
if (typeof window !== 'undefined') {
  window.debugCurrentQuests = debugCurrentQuests;
  console.log('🎮 Debug function loaded! Run debugCurrentQuests() in console');
}