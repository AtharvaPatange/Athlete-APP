"use client";
import { useState, useEffect } from "react";
import { 
  getActiveQuests, 
  getAthleteQuests, 
  startQuest,
  Quest, 
  AthleteQuest,
  getRarityColor,
  BadgeRarity 
} from "@/services/gamificationService";

interface QuestDashboardProps {
  athleteId: string;
}

export default function QuestDashboard({ athleteId }: QuestDashboardProps) {
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [athleteQuests, setAthleteQuests] = useState<AthleteQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'available' | 'active' | 'completed'>('available');

  useEffect(() => {
    fetchQuestData();
  }, [athleteId]);

  const fetchQuestData = async () => {
    setLoading(true);
    
    const [questsResult, athleteQuestsResult] = await Promise.all([
      getActiveQuests(),
      getAthleteQuests(athleteId)
    ]);
    
    if (questsResult.success) {
      // Filter out quests already started by athlete
      const startedQuestIds = athleteQuestsResult.athleteQuests.map(aq => aq.questId);
      const availableQuests = questsResult.quests.filter(q => !startedQuestIds.includes(q.id!));
      setActiveQuests(availableQuests);
    }
    
    if (athleteQuestsResult.success) {
      setAthleteQuests(athleteQuestsResult.athleteQuests);
    }
    
    setLoading(false);
  };

  const handleStartQuest = async (quest: Quest) => {
    const result = await startQuest(athleteId, quest);
    if (result.success) {
      await fetchQuestData(); // Refresh data
    }
  };

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  const getRarityIcon = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      case 'legendary': return '👑';
      default: return '🏅';
    }
  };

  const getActiveAthleteQuests = () => athleteQuests.filter(aq => aq.status === 'active');
  const getCompletedAthleteQuests = () => athleteQuests.filter(aq => aq.status === 'completed');

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center mb-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
            <span className="text-3xl">🎯</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Quests & Challenges</h2>
            <p className="text-purple-100">Complete quests to earn points and unlock badges!</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-2">
        <div className="flex space-x-1">
          {[
            { id: 'available', label: '🎯 Available', count: activeQuests.length },
            { id: 'active', label: '⚡ Active', count: getActiveAthleteQuests().length },
            { id: 'completed', label: '✅ Completed', count: getCompletedAthleteQuests().length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.label}</span>
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
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
            {activeQuests.length > 0 ? (
              activeQuests.map((quest) => (
                <div key={quest.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="text-4xl mr-4">{quest.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-bold text-gray-900 mr-3">{quest.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRarityColor(quest.rarity)}`}>
                            {getRarityIcon(quest.rarity)} {quest.rarity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{quest.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                          <span>🎯 Target: {quest.target}</span>
                          <span>⭐ Points: {quest.points}</span>
                          <span>⏰ {quest.duration} days</span>
                          {quest.requirements && quest.requirements.sport && (
                            <span>🏃‍♂️ {quest.requirements.sport}</span>
                          )}
                        </div>

                        {quest.badge && (
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              🏅 <strong>Badge Reward:</strong> Complete this quest to earn a special badge!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleStartQuest(quest)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Start Quest
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Available Quests</h3>
                <p className="text-gray-600">Check back later for new challenges!</p>
              </div>
            )}
          </>
        )}

        {selectedTab === 'active' && (
          <>
            {getActiveAthleteQuests().length > 0 ? (
              getActiveAthleteQuests().map((athleteQuest) => (
                <div key={athleteQuest.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-start">
                    <div className="text-4xl mr-4">{athleteQuest.quest.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{athleteQuest.quest.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRarityColor(athleteQuest.quest.rarity)}`}>
                          {getRarityIcon(athleteQuest.quest.rarity)} {athleteQuest.quest.rarity.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{athleteQuest.quest.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Progress: {athleteQuest.progress} / {athleteQuest.quest.target}
                          </span>
                          <span className="text-sm text-gray-500">
                            {getProgressPercentage(athleteQuest.progress, athleteQuest.quest.target).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${getProgressPercentage(athleteQuest.progress, athleteQuest.quest.target)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>⭐ Reward: {athleteQuest.quest.points} points</span>
                        <span>📅 Started: {athleteQuest.startedAt.toLocaleDateString()}</span>
                        <span>⏰ Expires: {athleteQuest.quest.expiresAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Quests</h3>
                <p className="text-gray-600">Start a quest from the available tab to begin your journey!</p>
              </div>
            )}
          </>
        )}

        {selectedTab === 'completed' && (
          <>
            {getCompletedAthleteQuests().length > 0 ? (
              getCompletedAthleteQuests().map((athleteQuest) => (
                <div key={athleteQuest.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-start">
                    <div className="text-4xl mr-4">{athleteQuest.quest.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{athleteQuest.quest.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                            ✅ COMPLETED
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRarityColor(athleteQuest.quest.rarity)}`}>
                            {getRarityIcon(athleteQuest.quest.rarity)} {athleteQuest.quest.rarity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{athleteQuest.quest.description}</p>
                      
                      {/* Completion Stats */}
                      <div className="bg-green-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-green-600 text-sm font-medium">Points Earned</p>
                            <p className="text-2xl font-bold text-green-800">+{athleteQuest.pointsEarned}</p>
                          </div>
                          <div>
                            <p className="text-green-600 text-sm font-medium">Completed</p>
                            <p className="text-lg font-bold text-green-800">
                              {athleteQuest.completedAt?.toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-green-600 text-sm font-medium">Progress</p>
                            <p className="text-lg font-bold text-green-800">
                              {athleteQuest.progress}/{athleteQuest.quest.target}
                            </p>
                          </div>
                          <div>
                            <p className="text-green-600 text-sm font-medium">Duration</p>
                            <p className="text-lg font-bold text-green-800">
                              {Math.ceil((athleteQuest.completedAt!.getTime() - athleteQuest.startedAt.getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {athleteQuest.quest.badge && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            🏅 <strong>Badge Earned:</strong> You've unlocked a special achievement badge!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Completed Quests Yet</h3>
                <p className="text-gray-600">Complete your first quest to see your achievements here!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
