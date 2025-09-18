/**
 * Quest Progress Test Helper
 * Use this to test quest progress functionality
 */

import { createTrainingSession } from '@/services/performanceService';
import { getAthleteQuests, startQuest, getActiveQuests } from '@/services/gamificationService';
import { updateAthleteQuestProgress } from '@/services/questProgressService';

export interface QuestTestResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Test the complete quest flow: start a quest and verify progress updates
 */
export const testQuestProgressFlow = async (athleteId: string): Promise<QuestTestResult> => {
  try {
    console.log('🧪 Starting quest progress test for athlete:', athleteId);

    // Step 1: Get available quests
    console.log('1️⃣ Fetching available quests...');
    const questsResult = await getActiveQuests();
    if (!questsResult.success) {
      return { success: false, message: 'Failed to fetch available quests', details: questsResult.error };
    }

    // Look for 5K Runner quest
    const runnerQuest = questsResult.quests.find(q => q.title === '5K Runner');
    if (!runnerQuest) {
      return { success: false, message: '5K Runner quest not found in available quests' };
    }

    console.log('✅ Found 5K Runner quest:', runnerQuest);

    // Step 2: Check if athlete already has this quest
    const athleteQuestsResult = await getAthleteQuests(athleteId);
    if (!athleteQuestsResult.success) {
      return { success: false, message: 'Failed to get athlete quests', details: athleteQuestsResult.error };
    }

    let activeRunnerQuest = athleteQuestsResult.athleteQuests.find(
      aq => aq.questId === runnerQuest.id && aq.status === 'active'
    );

    // Step 3: Start the quest if not already active
    if (!activeRunnerQuest) {
      console.log('2️⃣ Starting 5K Runner quest...');
      const startResult = await startQuest(athleteId, runnerQuest);
      if (!startResult.success) {
        return { success: false, message: 'Failed to start quest', details: startResult.error };
      }
      console.log('✅ Quest started successfully');

      // Refresh athlete quests
      const updatedQuestsResult = await getAthleteQuests(athleteId);
      activeRunnerQuest = updatedQuestsResult.athleteQuests.find(
        aq => aq.questId === runnerQuest.id && aq.status === 'active'
      );
    }

    if (!activeRunnerQuest) {
      return { success: false, message: 'Could not find active runner quest after starting' };
    }

    console.log('✅ Active quest found:', {
      title: activeRunnerQuest.quest.title,
      progress: activeRunnerQuest.progress,
      target: activeRunnerQuest.quest.target
    });

    // Step 4: Log a running training session
    console.log('3️⃣ Logging running training session...');
    const trainingSession = {
      athleteId: athleteId,
      sport: 'Running',
      exerciseType: 'running',
      duration: 30,
      distance: 2.5, // 2.5km run
      intensity: 'medium' as const,
      date: new Date(),
      notes: 'Test run for quest progress',
      heartRateAvg: 140,
      heartRateMax: 160,
      caloriesBurned: 250
    };

    const sessionResult = await createTrainingSession(trainingSession);
    if (!sessionResult.success) {
      return { success: false, message: 'Failed to create training session', details: sessionResult.error };
    }

    console.log('✅ Training session logged with ID:', sessionResult.id);

    // Step 5: Wait a moment and then check quest progress
    console.log('4️⃣ Checking quest progress update...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    // Manually trigger quest progress update
    const progressResult = await updateAthleteQuestProgress(athleteId);
    if (!progressResult.success) {
      return { success: false, message: 'Failed to update quest progress', details: progressResult.error };
    }

    console.log('✅ Quest progress update result:', progressResult);

    // Step 6: Verify the quest progress was updated
    const finalQuestsResult = await getAthleteQuests(athleteId);
    const updatedQuest = finalQuestsResult.athleteQuests.find(
      aq => aq.questId === runnerQuest.id && aq.status !== 'expired'
    );

    if (!updatedQuest) {
      return { success: false, message: 'Could not find quest after progress update' };
    }

    console.log('✅ Final quest state:', {
      title: updatedQuest.quest.title,
      progress: updatedQuest.progress,
      target: updatedQuest.quest.target,
      status: updatedQuest.status
    });

    const expectedProgress = 2.5; // The distance we logged
    const actualProgress = updatedQuest.progress;

    if (actualProgress >= expectedProgress) {
      return {
        success: true,
        message: `✅ Quest progress test PASSED! Progress updated from 0 to ${actualProgress}km (expected at least ${expectedProgress}km)`,
        details: {
          questTitle: updatedQuest.quest.title,
          previousProgress: 0,
          newProgress: actualProgress,
          target: updatedQuest.quest.target,
          status: updatedQuest.status,
          sessionDistance: trainingSession.distance,
          progressUpdates: progressResult.updates
        }
      };
    } else {
      return {
        success: false,
        message: `❌ Quest progress test FAILED! Expected progress >= ${expectedProgress}km, but got ${actualProgress}km`,
        details: {
          questTitle: updatedQuest.quest.title,
          expectedProgress,
          actualProgress,
          target: updatedQuest.quest.target,
          status: updatedQuest.status,
          sessionDistance: trainingSession.distance,
          progressUpdates: progressResult.updates
        }
      };
    }

  } catch (error: any) {
    console.error('❌ Quest test error:', error);
    return {
      success: false,
      message: `Test failed with error: ${error.message}`,
      details: error
    };
  }
};

/**
 * Quick test for existing quest progress update
 */
export const testExistingQuestProgress = async (athleteId: string): Promise<QuestTestResult> => {
  try {
    console.log('🧪 Testing existing quest progress update for athlete:', athleteId);

    const progressResult = await updateAthleteQuestProgress(athleteId);
    
    if (!progressResult.success) {
      return {
        success: false,
        message: 'Failed to update quest progress',
        details: progressResult.error
      };
    }

    return {
      success: true,
      message: `✅ Quest progress update completed. ${progressResult.updates.length} quests updated.`,
      details: {
        updatesCount: progressResult.updates.length,
        updates: progressResult.updates
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Test failed: ${error.message}`,
      details: error
    };
  }
};

/**
 * Log a test running session
 */
export const logTestRunningSession = async (athleteId: string, distance: number = 2.5): Promise<QuestTestResult> => {
  try {
    console.log(`🧪 Logging test running session: ${distance}km`);

    const trainingSession = {
      athleteId: athleteId,
      sport: 'Running',
      exerciseType: 'running',
      duration: Math.round(distance * 6), // ~6 min per km
      distance: distance,
      intensity: 'medium' as const,
      date: new Date(),
      notes: `Test ${distance}km run for quest progress`,
      heartRateAvg: 140,
      heartRateMax: 160,
      caloriesBurned: Math.round(distance * 60)
    };

    const sessionResult = await createTrainingSession(trainingSession);
    
    if (!sessionResult.success) {
      return {
        success: false,
        message: 'Failed to create training session',
        details: sessionResult.error
      };
    }

    return {
      success: true,
      message: `✅ Test running session logged: ${distance}km`,
      details: {
        sessionId: sessionResult.id,
        distance: distance,
        sport: trainingSession.sport,
        exerciseType: trainingSession.exerciseType
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to log session: ${error.message}`,
      details: error
    };
  }
};

// Make functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testQuestProgress = testQuestProgressFlow;
  (window as any).testExistingQuestProgress = testExistingQuestProgress;
  (window as any).logTestRunningSession = logTestRunningSession;
  
  console.log('🧪 Quest test functions available:');
  console.log('  - window.testQuestProgress(athleteId) - Full quest flow test');
  console.log('  - window.testExistingQuestProgress(athleteId) - Update existing quests');
  console.log('  - window.logTestRunningSession(athleteId, distance) - Log test run');
}