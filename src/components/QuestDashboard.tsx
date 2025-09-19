"use client";
import { useState, useEffect } from "react";
import {
  getActiveQuests,
  getAthleteQuests,
  startQuest,
  Quest,
  AthleteQuest,
  getRarityColor,
  BadgeRarity,
  QuestTier,
  QuestType,
  getAvailableQuestsForAthlete,
  getAthleteTierProgress,
  AthleteTierProgress,
  initializeAthleteTierProgress,
  createQuest
} from "@/services/gamificationService";
import { updateAthleteQuestProgress, QuestProgressUpdate } from "@/services/questProgressService";
import { autoSyncQuestProgress, getAthleteQuestStats } from "@/services/questManagementService";
import { Trophy, Zap, Target, CheckCircle, Award, Star, Calendar, Clock, RefreshCw, Sparkles, TrendingUp, BarChart3, Lock } from "lucide-react";
import QuestCompletionAnimation from "./QuestCompletionAnimation";
import { debugQuestProgress, manualQuestSync } from "@/utils/questDebugger";
import { testQuestProgressFlow, testExistingQuestProgress, logTestRunningSession } from "@/utils/questTestHelper";

interface QuestDashboardProps {
  athleteId: string;
}

export default function QuestDashboard({ athleteId }: QuestDashboardProps) {
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [athleteQuests, setAthleteQuests] = useState<AthleteQuest[]>([]);
  const [tierProgress, setTierProgress] = useState<AthleteTierProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'available' | 'active' | 'completed'>('available');
  const [selectedTier, setSelectedTier] = useState<QuestTier>('bronze');
  const [refreshing, setRefreshing] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<QuestProgressUpdate[]>([]);
  const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);
  const [completedQuest, setCompletedQuest] = useState<{
    title: string;
    points: number;
    rarity: BadgeRarity;
    icon: string;
  } | null>(null);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);

  // Helper function to get available quests for current tier
  const getAvailableTierQuests = () => {
    if (!tierProgress) return [];
    
    // Only show quests from unlocked tiers, specifically the selected tier
    const tierInfo = tierProgress.tiers[selectedTier];
    if (!tierInfo || !tierInfo.isUnlocked) return [];
    
    return activeQuests.filter(quest => quest.tier === selectedTier);
  };

  // Helper function to check if tier is unlocked
  const isTierUnlocked = (tier: QuestTier): boolean => {
    if (!tierProgress) return tier === 'bronze';
    return tierProgress.tiers[tier]?.isUnlocked || false;
  };

  // Helper function to check if tier is completed
  const isTierCompleted = (tier: QuestTier): boolean => {
    if (!tierProgress) return false;
    return tierProgress.tiers[tier]?.isMedalAwarded || false;
  };

  // Helper function to get tier progress percentage
  const getTierProgress = (tier: QuestTier): number => {
    if (!tierProgress) return 0;
    const tierInfo = tierProgress.tiers[tier];
    if (!tierInfo) return 0;
    return tierInfo.totalQuests > 0 ? (tierInfo.completedQuests / tierInfo.totalQuests) * 100 : 0;
  };

  // Setup quest system function
  const handleSetupQuestSystem = async () => {
    setLoading(true);
    console.log('🚀 Setting up quest system...');
    
    try {
      // Bronze tier quests that will be immediately available
      const bronzeQuests = [
        {
          title: "First Steps",
          description: "Complete your first training session and begin your athletic journey",
          type: 'sessions' as QuestType,
          target: 1,
          points: 10,
          duration: 7,
          rarity: 'common' as BadgeRarity,
          tier: 'bronze' as QuestTier,
          questOrder: 1,
          icon: "👟",
          badge: "first-steps-badge",
          isActive: true,
          requirements: {}
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
          questOrder: 2,
          icon: "🏃",
          isActive: true,
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
          questOrder: 3,
          icon: "📅",
          badge: "consistency-builder-badge",
          isActive: true,
          requirements: {}
        },
        {
          title: "Time Commitment",
          description: "Accumulate 2 hours of total training time",
          type: 'duration' as QuestType,
          target: 120,
          points: 25,
          duration: 14,
          rarity: 'uncommon' as BadgeRarity,
          tier: 'bronze' as QuestTier,
          questOrder: 4,
          icon: "⏱️",
          isActive: true,
          requirements: {}
        }
      ];

      console.log('Creating Bronze tier quests...');
      let createdCount = 0;
      
      for (const questData of bronzeQuests) {
        try {
          const result = await createQuest(questData);
          if (result.success) {
            createdCount++;
            console.log(`✅ Created: ${questData.title}`);
          } else {
            console.error(`❌ Failed to create: ${questData.title}`, result.error);
          }
        } catch (error) {
          console.error(`💥 Error creating ${questData.title}:`, error);
        }
      }

      console.log('Initializing athlete tier progress...');
      await initializeAthleteTierProgress(athleteId);
      
      console.log('Refreshing quest data...');
      await fetchQuestData();
      
      console.log(`🎉 Setup complete! Created ${createdCount}/4 Bronze quests`);
      alert(`Quest system setup complete!\nCreated ${createdCount}/4 Bronze tier quests.\nYou should now see available quests!`);
      
    } catch (error) {
      console.error('💥 Quest setup failed:', error);
      alert('Quest setup failed. Check console for details.');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestData();
    // Auto-sync quest progress on component mount
    autoSyncQuests();
    
    // Set up periodic refresh to catch updates from training sessions
    const refreshInterval = setInterval(() => {
      console.log('🔄 Periodic quest progress refresh...');
      autoSyncQuests();
    }, 30000); // Refresh every 30 seconds

    // Listen for page visibility changes to refresh when user returns
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔍 Page became visible, refreshing quest progress...');
        autoSyncQuests();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Expose test functions globally in development
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).testQuestProgress = () => testQuestProgressFlow(athleteId);
      (window as any).testExistingQuests = () => testExistingQuestProgress(athleteId);
      (window as any).logTestRun = (distance = 2.5) => logTestRunningSession(athleteId, distance);
      (window as any).refreshQuests = () => handleRefreshProgress();
      (window as any).debugQuests = () => debugQuestProgress(athleteId);
      
      console.log('🎯 Quest test functions available:');
      console.log('  - window.testQuestProgress() - Complete quest flow test');
      console.log('  - window.testExistingQuests() - Update existing quests');
      console.log('  - window.logTestRun(distance) - Log test running session');
      console.log('  - window.refreshQuests() - Manual refresh');
      console.log('  - window.debugQuests() - Full debug info');
    }

    // Cleanup interval on unmount
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [athleteId]);

  const autoSyncQuests = async () => {
    try {
      const syncResult = await autoSyncQuestProgress(athleteId);
      if (syncResult.success && syncResult.hasUpdates) {
        console.log('✅ Auto-sync completed with updates');
        // Refresh data if there were updates
        await fetchQuestData();
        
        // Show a brief notification about the updates
        setRecentUpdates([{ 
          questId: 'sync', 
          newProgress: 1, 
          isCompleted: false 
        }]);
        setShowUpdateAnimation(true);
        setTimeout(() => setShowUpdateAnimation(false), 2000);
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  };

  const fetchQuestData = async () => {
    setLoading(true);
    
    try {
      // Initialize tier progress if it doesn't exist
      await initializeAthleteTierProgress(athleteId);
      
      const [tierResult, availableQuestsResult, athleteQuestsResult] = await Promise.all([
        getAthleteTierProgress(athleteId),
        getAvailableQuestsForAthlete(athleteId),
        getAthleteQuests(athleteId)
      ]);
      
      if (tierResult.success && tierResult.tierProgress) {
        setTierProgress(tierResult.tierProgress);
        setSelectedTier(tierResult.tierProgress.currentTier);
      }
      
      if (availableQuestsResult.success) {
        setActiveQuests(availableQuestsResult.quests);
      }
      
      if (athleteQuestsResult.success) {
        setAthleteQuests(athleteQuestsResult.athleteQuests);
      }
    } catch (error) {
      console.error('Error fetching quest data:', error);
    }
    
    setLoading(false);
  };

  const handleStartQuest = async (quest: Quest) => {
    // Check if the quest is already started or completed
    const existingQuest = athleteQuests.find(aq => aq.questId === quest.id);
    
    if (existingQuest) {
      if (existingQuest.status === 'active') {
        alert(`Quest "${quest.title}" is already active! Check your Active quests tab to see your progress.`);
        return;
      } else if (existingQuest.status === 'completed') {
        alert(`Quest "${quest.title}" has already been completed! Check your Completed quests tab to see your achievement.`);
        return;
      }
    }

    const result = await startQuest(athleteId, quest);
    if (result.success) {
      alert(`Quest "${quest.title}" started successfully! Track your progress in the Active tab.`);
      await fetchQuestData();
      // Automatically refresh progress for the new quest
      await handleRefreshProgress();
    } else {
      alert(`Failed to start quest "${quest.title}". Please try again.`);
    }
  };

  const handleRefreshProgress = async () => {
    setRefreshing(true);
    console.log('🔄 Manual quest progress refresh started...');
    
    try {
      // Force clear the auto-sync throttle for immediate update
      const lastSyncKey = `questSync_${athleteId}`;
      localStorage.removeItem(lastSyncKey);
      console.log('🧹 Cleared sync throttle for immediate update');
      
      const result = await updateAthleteQuestProgress(athleteId);
      console.log('📊 Quest progress update result:', result);
      
      if (result.success && result.updates.length > 0) {
        console.log('✅ Found quest updates:', result.updates.map(u => ({
          questId: u.questId,
          newProgress: u.newProgress,
          isCompleted: u.isCompleted
        })));
        
        setRecentUpdates(result.updates);
        setShowUpdateAnimation(true);
        
        // Check for completed quests and show completion animation
        const completedUpdates = result.updates.filter(u => u.isCompleted);
        if (completedUpdates.length > 0) {
          console.log('🎉 Completed quests:', completedUpdates.length);
          // Find the quest details for the first completed quest
          const firstCompleted = completedUpdates[0];
          const completedAthleteQuest = athleteQuests.find(aq => aq.questId === firstCompleted.questId);
          
          if (completedAthleteQuest) {
            setCompletedQuest({
              title: completedAthleteQuest.quest.title,
              points: firstCompleted.completionData?.pointsEarned || completedAthleteQuest.quest.points,
              rarity: completedAthleteQuest.quest.rarity,
              icon: completedAthleteQuest.quest.icon
            });
            setShowCompletionAnimation(true);
          }
        }
        
        // Hide update animation after 3 seconds
        setTimeout(() => {
          setShowUpdateAnimation(false);
        }, 3000);
        
        // Refresh quest data to show updated progress
        await fetchQuestData();
        
        console.log('✅ Quest refresh completed successfully');
        alert(`Quest progress updated! ${result.updates.length} quest${result.updates.length > 1 ? 's' : ''} updated.`);
      } else {
        console.log('ℹ️ No quest updates found');
        alert('No quest progress updates found. Make sure you have active quests and recent training sessions.');
      }
    } catch (error) {
      console.error('❌ Error refreshing quest progress:', error);
      alert('Failed to refresh quest progress. Check console for details.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCompletionAnimationEnd = () => {
    setShowCompletionAnimation(false);
    setCompletedQuest(null);
  };

  const handleDebugQuests = async () => {
    console.log('🐛 Starting comprehensive quest debug session...');
    
    // Debug training sessions first
    try {
      const { getTrainingSessions } = await import('@/services/performanceService');
      const sessionsResult = await getTrainingSessions(athleteId, 50);
      
      console.log('📋 Training Sessions Debug:');
      console.log('- Success:', sessionsResult.success);
      console.log('- Total Sessions:', sessionsResult.sessions.length);
      
      sessionsResult.sessions.forEach((session, index) => {
        console.log(`Session ${index + 1}:`, {
          id: session.id,
          sport: session.sport,
          exerciseType: session.exerciseType,
          date: session.date,
          distance: session.distance,
          duration: session.duration,
          athleteId: session.athleteId
        });
      });
    } catch (error) {
      console.error('❌ Error fetching training sessions:', error);
    }
    
    // Debug active quests
    console.log('🎯 Active Quests Debug:');
    athleteQuests.filter(aq => aq.status === 'active').forEach((quest, index) => {
      console.log(`Active Quest ${index + 1}:`, {
        title: quest.quest.title,
        type: quest.quest.type,
        target: quest.quest.target,
        currentProgress: quest.progress,
        requirements: quest.quest.requirements,
        startedAt: quest.startedAt
      });
    });
    
    await debugQuestProgress(athleteId);
    
    // Also try manual sync
    const syncResult = await manualQuestSync(athleteId);
    if (syncResult.success && syncResult.updates.length > 0) {
      console.log('🔄 Manual sync found updates:', syncResult.updates);
      await fetchQuestData(); // Refresh the UI
    } else {
      console.log('ℹ️ Manual sync found no updates');
    }
  };

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  const getRarityIcon = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'bronze': return <Award className="w-4 h-4 text-amber-600" />;
      case 'silver': return <Award className="w-4 h-4 text-gray-400" />;
      case 'gold': return <Award className="w-4 h-4 text-yellow-500" />;
      case 'platinum': return <Award className="w-4 h-4 text-purple-500" />;
      case 'diamond': return <Trophy className="w-4 h-4 text-orange-500" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getActiveAthleteQuests = () => athleteQuests.filter(aq => aq.status === 'active');
  const getCompletedAthleteQuests = () => athleteQuests.filter(aq => aq.status === 'completed');

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-100">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#303644] font-medium">Loading quests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#182031] to-[#303644] rounded-xl shadow-lg p-6 text-white relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg mr-4 border border-white/20 group-hover:bg-white/15 transition-colors duration-300">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Quests & Challenges</h2>
              <p className="text-[#F6F7F7]/80">Complete quests to earn points and unlock badges!</p>
            </div>
          </div>
          
          {/* Progress Update Controls */}
          <div className="flex items-center space-x-3">
            {showUpdateAnimation && recentUpdates.length > 0 && (
              <div className="flex items-center bg-green-500/20 backdrop-blur-sm p-3 rounded-lg border border-green-400/30 animate-pulse">
                <Sparkles className="w-5 h-5 text-green-400 mr-2 animate-spin" />
                <span className="text-sm font-medium text-green-300">
                  {recentUpdates.filter(u => u.isCompleted).length > 0 
                    ? `${recentUpdates.filter(u => u.isCompleted).length} Quest${recentUpdates.filter(u => u.isCompleted).length > 1 ? 's' : ''} Completed!`
                    : `${recentUpdates.length} Quest${recentUpdates.length > 1 ? 's' : ''} Updated`
                  }
                </span>
              </div>
            )}

            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-4 text-white/80 text-sm">
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                <BarChart3 className="w-4 h-4 mr-1" />
                <span>{getActiveAthleteQuests().length} Active</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span>{getCompletedAthleteQuests().length} Done</span>
              </div>
            </div>
            
            <button
              onClick={handleRefreshProgress}
              disabled={refreshing}
              className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group relative"
              title="Refresh quest progress from training data (Forces immediate sync)"
            >
              <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''} group-hover:text-green-300 transition-colors`} />
              {refreshing && (
                <div className="absolute -top-1 -right-1 bg-green-400 rounded-full w-3 h-3 animate-pulse"></div>
              )}
            </button>

            {/* Quest Setup button (only show if no quests available) */}
            {activeQuests.length === 0 && (
              <button
                onClick={handleSetupQuestSystem}
                disabled={loading}
                className="bg-green-500/20 backdrop-blur-sm p-3 rounded-lg border border-green-400/30 hover:bg-green-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Create tier-based quest system"
              >
                <span className="text-green-300 text-sm font-mono">🚀 SETUP QUESTS</span>
              </button>
            )}

            {/* Manual Sync button for immediate quest progress update */}
            {activeQuests.length > 0 && (
              <button
                onClick={() => {
                  console.log('🔥 FORCE SYNC: Clearing throttle and syncing now...');
                  handleRefreshProgress();
                }}
                disabled={refreshing}
                className="bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-400/30 hover:bg-blue-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Force immediate quest progress sync (bypasses 5-min throttle)"
              >
                <span className="text-blue-300 text-sm font-medium flex items-center gap-2">
                  <Zap size={14} />
                  {refreshing ? 'SYNCING...' : 'SYNC NOW'}
                </span>
              </button>
            )}

            {/* Debug button (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleDebugQuests}
                className="bg-yellow-500/20 backdrop-blur-sm p-3 rounded-lg border border-yellow-400/30 hover:bg-yellow-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
                title="Comprehensive debug (Dev only)"
              >
                <span className="text-yellow-300 text-sm font-mono">� DEBUG</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tier Progression */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-xl p-6 border border-slate-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Athlete Tier Progression</h2>
          <p className="text-slate-300">Complete all quests in a tier to unlock the next level and earn medals</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as QuestTier[]).map((tier, index) => {
            const isUnlocked = isTierUnlocked(tier);
            const isCompleted = isTierCompleted(tier);
            const isCurrent = tierProgress ? tierProgress.currentTier === tier : tier === 'bronze';
            
            return (
              <div
                key={tier}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border-yellow-400 shadow-lg shadow-yellow-400/20'
                    : isUnlocked
                    ? isCurrent
                      ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border-blue-400 shadow-lg shadow-blue-400/20'
                      : 'bg-gradient-to-br from-slate-600/20 to-slate-700/20 border-slate-500 hover:border-slate-400'
                    : 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 opacity-50'
                }`}
              >
                {isCompleted && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 p-2 rounded-full shadow-lg">
                    <Award className="w-5 h-5" />
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {tier === 'bronze' && '🥉'}
                    {tier === 'silver' && '🥈'}
                    {tier === 'gold' && '🥇'}
                    {tier === 'platinum' && '💎'}
                    {tier === 'diamond' && '💍'}
                  </div>
                  <h3 className={`font-bold capitalize mb-1 ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                    {tier}
                  </h3>
                  <p className={`text-xs ${isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isCompleted ? 'Completed!' : isUnlocked ? isCurrent ? 'Current Tier' : 'Available' : 'Locked'}
                  </p>
                  
                  {isUnlocked && !isCompleted && (
                    <div className="mt-2">
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${getTierProgress(tier)}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {tierProgress?.tiers[tier]?.completedQuests || 0} / {tierProgress?.tiers[tier]?.totalQuests || 4} quests
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-2 border border-slate-100">
        <div className="flex space-x-1">
          {[
            { id: 'available', label: 'Available', count: activeQuests.length, icon: <Target className="w-4 h-4" /> },
            { id: 'active', label: 'Active', count: getActiveAthleteQuests().length, icon: <Zap className="w-4 h-4" /> },
            { id: 'completed', label: 'Completed', count: getCompletedAthleteQuests().length, icon: <CheckCircle className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-[#0F172A] to-[#303644] text-white shadow-lg'
                  : 'text-[#303644] hover:text-[#0F172A] hover:bg-[#F6F7F7]'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                selectedTab === tab.id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-[#F6F7F7] text-[#303644]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quest Content */}
      <div className="grid gap-6">
        {selectedTab === 'available' && (
          <>
            {/* Tier Selection */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Select Tier</h3>
              <div className="flex flex-wrap gap-2">
                {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as QuestTier[]).map((tier) => {
                  const isUnlocked = isTierUnlocked(tier);
                  const isSelected = selectedTier === tier;
                  
                  return (
                    <button
                      key={tier}
                      onClick={() => isUnlocked ? setSelectedTier(tier) : null}
                      disabled={!isUnlocked}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform ${
                        isSelected
                          ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg scale-105'
                          : isUnlocked
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105'
                          : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="mr-2">
                        {tier === 'bronze' && '🥉'}
                        {tier === 'silver' && '🥈'}
                        {tier === 'gold' && '🥇'}
                        {tier === 'platinum' && '💎'}
                        {tier === 'diamond' && '💍'}
                      </span>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      {!isUnlocked && (
                        <Lock className="w-4 h-4 ml-2 inline" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {getAvailableTierQuests().length > 0 ? (
              getAvailableTierQuests().map((quest) => (
                <div key={quest.id} className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 hover:border-[#0F172A]/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className="text-4xl mr-4 group-hover:scale-110 transition-transform duration-300">{quest.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-bold text-[#0F172A] mr-3 group-hover:text-[#303644] transition-colors duration-300">{quest.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRarityColor(quest.rarity)} flex items-center gap-1`}>
                              {getRarityIcon(quest.rarity)}
                              {quest.rarity.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-full text-xs font-medium flex items-center gap-1">
                              <span>
                                {selectedTier === 'bronze' && '🥉'}
                                {selectedTier === 'silver' && '🥈'}
                                {selectedTier === 'gold' && '🥇'}
                                {selectedTier === 'platinum' && '💎'}
                                {selectedTier === 'diamond' && '💍'}
                              </span>
                              {selectedTier.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <p className="text-[#303644] mb-4">{quest.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-[#182031] mb-4">
                          <div className="flex items-center bg-[#F6F7F7] px-3 py-1 rounded-lg hover:bg-[#0F172A]/5 transition-colors duration-200">
                            <Target className="w-4 h-4 mr-1" />
                            <span>Target: {quest.target}</span>
                          </div>
                          <div className="flex items-center bg-[#F6F7F7] px-3 py-1 rounded-lg hover:bg-[#0F172A]/5 transition-colors duration-200">
                            <Star className="w-4 h-4 mr-1" />
                            <span>{quest.points} points</span>
                          </div>
                          <div className="flex items-center bg-[#F6F7F7] px-3 py-1 rounded-lg hover:bg-[#0F172A]/5 transition-colors duration-200">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{quest.duration} days</span>
                          </div>
                          {quest.requirements && quest.requirements.sport && (
                            <div className="flex items-center bg-[#F6F7F7] px-3 py-1 rounded-lg hover:bg-[#0F172A]/5 transition-colors duration-200">
                              <span className="font-medium">{quest.requirements.sport}</span>
                            </div>
                          )}
                        </div>

                        {quest.badge && (
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200 hover:border-amber-300 transition-colors duration-200">
                            <p className="text-sm text-amber-800 flex items-center">
                              <Award className="w-4 h-4 mr-2" />
                              <strong>Badge Reward:</strong>&nbsp;Complete this quest to earn a special badge!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleStartQuest(quest)}
                      className="bg-gradient-to-r from-[#0F172A] to-[#303644] text-white px-6 py-3 rounded-lg font-semibold hover:from-[#182031] hover:to-[#0F172A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      Start Quest
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-100 hover:shadow-xl transition-shadow duration-300">
                <Target className="w-16 h-16 text-[#303644]/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                  {!isTierUnlocked(selectedTier) 
                    ? `${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier Locked`
                    : `No Available ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Quests`
                  }
                </h3>
                <p className="text-[#303644]">
                  {!isTierUnlocked(selectedTier)
                    ? `Complete the previous tier to unlock ${selectedTier} quests!`
                    : 'All quests in this tier are completed or in progress!'
                  }
                </p>
              </div>
            )}
          </>
        )}

        {selectedTab === 'active' && (
          <>
            {getActiveAthleteQuests().length > 0 ? (
              getActiveAthleteQuests().map((athleteQuest) => (
                <div key={athleteQuest.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#182031] hover:shadow-xl hover:border-l-[#0F172A] transition-all duration-300 transform hover:scale-[1.02] group">
                  <div className="flex items-start">
                    <div className="text-4xl mr-4 group-hover:scale-110 transition-transform duration-300">{athleteQuest.quest.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-[#0F172A] group-hover:text-[#303644] transition-colors duration-300">{athleteQuest.quest.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="bg-gradient-to-r from-[#182031] to-[#0F172A] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            IN PROGRESS
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRarityColor(athleteQuest.quest.rarity)} flex items-center gap-1`}>
                            {getRarityIcon(athleteQuest.quest.rarity)}
                            {athleteQuest.quest.rarity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-[#303644] mb-4">{athleteQuest.quest.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-[#0F172A]">
                            Progress: {athleteQuest.progress} / {athleteQuest.quest.target}
                          </span>
                          <span className="text-sm text-[#182031] bg-[#F6F7F7] px-2 py-1 rounded-lg">
                            {getProgressPercentage(athleteQuest.progress, athleteQuest.quest.target).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#F6F7F7] rounded-full h-3 shadow-inner overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#182031] to-[#0F172A] h-3 rounded-full transition-all duration-700 shadow-sm relative overflow-hidden"
                            style={{
                              width: `${getProgressPercentage(athleteQuest.progress, athleteQuest.quest.target)}%`
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-[#182031]">
                        <div className="flex items-center bg-[#F6F7F7] px-3 py-1 rounded-lg hover:bg-[#0F172A]/5 transition-colors duration-200">
                          <Star className="w-4 h-4 mr-1" />
                          <span>Reward: {athleteQuest.quest.points} points</span>
                        </div>
                        <div className="flex items-center bg-[#F6F7F7] px-3 py-1 rounded-lg hover:bg-[#0F172A]/5 transition-colors duration-200">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Started: {athleteQuest.startedAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center bg-[#F6F7F7] px-3 py-1 rounded-lg hover:bg-[#0F172A]/5 transition-colors duration-200">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>Expires: {athleteQuest.quest.expiresAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-100 hover:shadow-xl transition-shadow duration-300">
                <Zap className="w-16 h-16 text-[#303644]/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">No Active Quests</h3>
                <p className="text-[#303644]">Start a quest from the available tab to begin your journey!</p>
              </div>
            )}
          </>
        )}

        {selectedTab === 'completed' && (
          <>
            {getCompletedAthleteQuests().length > 0 ? (
              getCompletedAthleteQuests().map((athleteQuest) => (
                <div key={athleteQuest.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl hover:border-l-green-600 transition-all duration-300 transform hover:scale-[1.02] group relative">
                  <div className="absolute top-4 right-4">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-2 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="flex items-start pr-14">
                    <div className="text-4xl mr-4 group-hover:scale-110 transition-transform duration-300">{athleteQuest.quest.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-[#0F172A] group-hover:text-[#303644] transition-colors duration-300">{athleteQuest.quest.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            COMPLETED
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRarityColor(athleteQuest.quest.rarity)} flex items-center gap-1`}>
                            {getRarityIcon(athleteQuest.quest.rarity)}
                            {athleteQuest.quest.rarity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-[#303644] mb-4">{athleteQuest.quest.description}</p>
                      
                      {/* Completion Stats */}
                      <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-200 hover:border-green-300 transition-colors duration-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="bg-white/70 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                            <p className="text-green-600 text-xs font-semibold uppercase tracking-wide mb-1">Points Earned</p>
                            <p className="text-2xl font-bold text-green-800">+{athleteQuest.pointsEarned}</p>
                          </div>
                          <div className="bg-white/70 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                            <p className="text-green-600 text-xs font-semibold uppercase tracking-wide mb-1">Completed</p>
                            <p className="text-sm font-bold text-green-800">
                              {athleteQuest.completedAt?.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="bg-white/70 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                            <p className="text-green-600 text-xs font-semibold uppercase tracking-wide mb-1">Progress</p>
                            <p className="text-lg font-bold text-green-800">
                              {athleteQuest.progress}/{athleteQuest.quest.target}
                            </p>
                          </div>
                          <div className="bg-white/70 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                            <p className="text-green-600 text-xs font-semibold uppercase tracking-wide mb-1">Duration</p>
                            <p className="text-lg font-bold text-green-800">
                              {Math.ceil((athleteQuest.completedAt!.getTime() - athleteQuest.startedAt.getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {athleteQuest.quest.badge && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200 hover:border-amber-300 transition-colors duration-200">
                          <p className="text-sm text-amber-800 flex items-center">
                            <Trophy className="w-4 h-4 mr-2" />
                            <strong>Badge Earned:</strong>&nbsp;You've unlocked a special achievement badge!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-100 hover:shadow-xl transition-shadow duration-300">
                <Trophy className="w-16 h-16 text-[#303644]/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">No Completed Quests Yet</h3>
                <p className="text-[#303644]">Complete your first quest to see your achievements here!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quest Completion Animation */}
      {completedQuest && (
        <QuestCompletionAnimation
          isVisible={showCompletionAnimation}
          questTitle={completedQuest.title}
          pointsEarned={completedQuest.points}
          badgeRarity={completedQuest.rarity}
          questIcon={completedQuest.icon}
          onAnimationComplete={handleCompletionAnimationEnd}
        />
      )}
    </div>
  );
}
