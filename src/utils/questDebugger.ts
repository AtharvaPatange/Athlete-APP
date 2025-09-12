import { getTrainingSessions } from '@/services/performanceService';
import { getAthleteQuests } from '@/services/gamificationService';
import { updateAthleteQuestProgress, getQuestProgressBreakdown } from '@/services/questProgressService';

/**
 * Debug utility to test quest progress calculation
 */
export const debugQuestProgress = async (athleteId: string) => {
  console.log('🐛 === QUEST DEBUG SESSION START ===');
  console.log('🎯 Athlete ID:', athleteId);
  
  try {
    // 1. Get athlete's training sessions
    console.log('\n📊 1. FETCHING TRAINING SESSIONS...');
    const sessionsResult = await getTrainingSessions(athleteId, 50);
    
    if (!sessionsResult.success) {
      console.error('❌ Failed to fetch training sessions:', sessionsResult.error);
      return;
    }
    
    console.log('✅ Found', sessionsResult.sessions.length, 'training sessions');
    
    // Show recent sessions
    const recentSessions = sessionsResult.sessions.slice(0, 5);
    console.log('📋 Recent sessions:');
    recentSessions.forEach((session, index) => {
      console.log(`  ${index + 1}. ${session.date.toLocaleDateString()} - ${session.sport} - ${session.distance || 0}km - ${session.duration}min`);
    });
    
    // 2. Get athlete's active quests
    console.log('\n🎯 2. FETCHING ACTIVE QUESTS...');
    const questsResult = await getAthleteQuests(athleteId);
    
    if (!questsResult.success) {
      console.error('❌ Failed to fetch quests:', questsResult.error);
      return;
    }
    
    const activeQuests = questsResult.athleteQuests.filter(q => q.status === 'active');
    console.log('✅ Found', activeQuests.length, 'active quests');
    
    activeQuests.forEach((quest, index) => {
      console.log(`  ${index + 1}. ${quest.quest.title} (${quest.quest.type}) - Progress: ${quest.progress}/${quest.quest.target}`);
    });
    
    // 3. Update quest progress
    console.log('\n🔄 3. UPDATING QUEST PROGRESS...');
    const updateResult = await updateAthleteQuestProgress(athleteId);
    
    if (!updateResult.success) {
      console.error('❌ Failed to update quest progress:', updateResult.error);
      return;
    }
    
    console.log('✅ Quest update completed');
    console.log('📈 Updates:', updateResult.updates.length);
    
    updateResult.updates.forEach((update, index) => {
      console.log(`  ${index + 1}. Quest ${update.questId}: ${update.newProgress} (${update.isCompleted ? 'COMPLETED' : 'IN PROGRESS'})`);
    });
    
    // 4. Get detailed breakdown for distance quests
    console.log('\n🔍 4. DETAILED QUEST BREAKDOWN...');
    
    for (const quest of activeQuests) {
      if (quest.quest.type === 'distance') {
        console.log(`\n📏 Distance Quest: ${quest.quest.title}`);
        const breakdown = await getQuestProgressBreakdown(athleteId, quest.questId);
        
        if (breakdown.success && breakdown.breakdown) {
          console.log('  📊 Quest Details:', {
            target: breakdown.breakdown.questDetails.quest.target,
            currentProgress: breakdown.breakdown.questDetails.progress,
            calculatedProgress: breakdown.breakdown.calculatedProgress
          });
          console.log('  📋 Relevant Sessions:', breakdown.breakdown.relevantSessions.length);
          breakdown.breakdown.relevantSessions.forEach((session, i) => {
            console.log(`    ${i + 1}. ${session.date.toLocaleDateString()} - ${session.sport} - ${session.distance}km`);
          });
          console.log('  📈 Progress Details:', breakdown.breakdown.progressDetails);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug session failed:', error);
  }
  
  console.log('\n🐛 === QUEST DEBUG SESSION END ===');
};

/**
 * Quick function to manually trigger quest updates
 */
export const manualQuestSync = async (athleteId: string) => {
  console.log('🔄 Manual quest sync triggered for athlete:', athleteId);
  
  try {
    const result = await updateAthleteQuestProgress(athleteId);
    
    if (result.success) {
      console.log('✅ Manual sync completed');
      console.log('📊 Updates:', result.updates);
      return result;
    } else {
      console.error('❌ Manual sync failed:', result.error);
      return result;
    }
  } catch (error: any) {
    console.error('❌ Manual sync error:', error);
    return { success: false, error: error.message, updates: [] };
  }
};

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).debugQuestProgress = debugQuestProgress;
  (window as any).manualQuestSync = manualQuestSync;
  console.log('🐛 Quest debug functions available globally:');
  console.log('  - window.debugQuestProgress(athleteId)');
  console.log('  - window.manualQuestSync(athleteId)');
}