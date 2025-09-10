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
import { Trophy, Zap, Target, CheckCircle, Award, Star, Calendar, Clock } from "lucide-react";

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
      await fetchQuestData();
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
      case 'legendary': return <Trophy className="w-4 h-4 text-orange-500" />;
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
        <div className="relative z-10 flex items-center">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg mr-4 border border-white/20 group-hover:bg-white/15 transition-colors duration-300">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Quests & Challenges</h2>
            <p className="text-[#F6F7F7]/80">Complete quests to earn points and unlock badges!</p>
          </div>
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
            {activeQuests.length > 0 ? (
              activeQuests.map((quest) => (
                <div key={quest.id} className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 hover:border-[#0F172A]/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className="text-4xl mr-4 group-hover:scale-110 transition-transform duration-300">{quest.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-bold text-[#0F172A] mr-3 group-hover:text-[#303644] transition-colors duration-300">{quest.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRarityColor(quest.rarity)} flex items-center gap-1`}>
                            {getRarityIcon(quest.rarity)}
                            {quest.rarity.toUpperCase()}
                          </span>
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
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">No Available Quests</h3>
                <p className="text-[#303644]">Check back later for new challenges!</p>
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
    </div>
  );
}
