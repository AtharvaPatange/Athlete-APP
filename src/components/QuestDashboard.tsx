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
import { Trophy, Zap, Target, CheckCircle } from "lucide-react";


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
  <div className="space-y-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    {/* Header */}
    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-black rounded-xl shadow-xl p-6 text-white relative overflow-hidden">
      <div className="flex items-center mb-4">
        <div className="bg-white/10 p-3 rounded-lg mr-4">
          <Target className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Quests & Challenges</h2>
          <p className="text-slate-300">Complete quests to earn points and unlock badges!</p>
        </div>
      </div>
    </div>

    {/* Tab Navigation */}
    <div className="bg-white rounded-xl shadow-lg p-2">
      <div className="flex space-x-2">
        {[
          { id: "available", label: "Available", count: activeQuests.length, icon: <Target className="w-4 h-4" /> },
          { id: "active", label: "Active", count: getActiveAthleteQuests().length, icon: <Zap className="w-4 h-4" /> },
          { id: "completed", label: "Completed", count: getCompletedAthleteQuests().length, icon: <CheckCircle className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              selectedTab === tab.id
                ? "bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                selectedTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    </div>

    {/* Quest Cards Example (Available) */}
    {selectedTab === "available" && (
      <>
        {activeQuests.length > 0 ? (
          activeQuests.map((quest) => (
            <div
              key={quest.id}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:border-purple-400 transition-all"
            >
              <div className="flex items-start justify-between">
                {/* Left Content */}
                <div className="flex items-start">
                  <div className="text-4xl mr-4">{quest.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-gray-900 mr-3">{quest.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getRarityColor(
                          quest.rarity
                        )}`}
                      >
                        {getRarityIcon(quest.rarity)} {quest.rarity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-4">{quest.description}</p>

                    <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                      <span>🎯 Target: {quest.target}</span>
                      <span>⭐ {quest.points} pts</span>
                      <span>⏰ {quest.duration} days</span>
                      {quest.requirements?.sport && <span>🏃 {quest.requirements.sport}</span>}
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

                {/* CTA */}
                <button
                  onClick={() => handleStartQuest(quest)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Start Quest
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Target className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Available Quests</h3>
            <p className="text-gray-600">Check back later for new challenges!</p>
          </div>
        )}
      </>
    )}
  </div>
);

}
