"use client";
import { useState, useEffect } from "react";
import QuestDashboard from "./QuestDashboard";
import AchievementDashboard from "./AchievementDashboard";
import Leaderboard from "./Leaderboard";
import { Trophy, Target, Flame, Star, Award, Crown, Zap, Shield, Sparkles } from "lucide-react";
import { AlertTriangle } from "lucide-react";

import { 
  getAthleteProgress,
  AthleteProgress,
  initializeDefaultQuests,
  cleanupDuplicateProgress
} from "@/services/gamificationService";

interface GamificationDashboardProps {
  athleteId: string;
  sport?: string;
  region?: string;
}

export default function GamificationDashboard({ athleteId, sport, region }: GamificationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'quests' | 'achievements' | 'leaderboard'>('quests');
  const [progress, setProgress] = useState<AthleteProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeGamification();
  }, [athleteId]);

  const initializeGamification = async () => {
    setLoading(true);
    setError(null);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Gamification initialization timeout');
      setLoading(false);
      setError('Loading took too long. Please refresh the page.');
    }, 10000); // 10 second timeout

    try {
      console.log('Starting gamification initialization for athlete:', athleteId);
      
      // First cleanup any duplicate records
      await cleanupDuplicateProgress(athleteId);
      
      // Get athlete progress (this is quick and essential)
      console.log('Getting athlete progress...');
      const progressResult = await getAthleteProgress(athleteId);
      
      if (progressResult.success && progressResult.progress) {
        console.log('Athlete progress loaded:', progressResult.progress);
        setProgress(progressResult.progress);
      } else if (progressResult.error) {
        console.error('Error getting athlete progress:', progressResult.error);
        setError(`Failed to load progress: ${progressResult.error}`);
      }
      
      // Initialize default quests in background (don't wait for it)
      initializeDefaultQuests().catch(error => {
        console.log('Default quests initialization (background):', error.message);
      });
      
      clearTimeout(timeoutId);
      
    } catch (error: any) {
      console.error('Error initializing gamification:', error);
      setError(`Initialization failed: ${error.message}`);
      clearTimeout(timeoutId);
    } finally {
      setLoading(false);
    }
  };

  const tabs: Array<{
    id: 'quests' | 'achievements' | 'leaderboard';
    label: string;
    icon: any;
    description: string;
    gradient: string;
    hoverGradient: string;
  }> = [
    { 
      id: 'quests' as const, 
      label: 'Quests', 
      icon: Target,
      description: 'Complete challenges to earn points and badges',
      gradient: 'from-emerald-500 to-teal-600',
      hoverGradient: 'from-emerald-600 to-teal-700'
    },
    { 
      id: 'achievements' as const, 
      label: 'Achievements', 
      icon: Trophy,
      description: 'View your progress and earned badges',
      gradient: 'from-amber-500 to-orange-600',
      hoverGradient: 'from-amber-600 to-orange-700'
    },
    { 
      id: 'leaderboard' as const, 
      label: 'Leaderboard', 
      icon: Crown,
      description: 'See how you rank against other athletes',
      gradient: 'from-purple-500 to-indigo-600',
      hoverGradient: 'from-purple-600 to-indigo-700'
    }
  ];

  if (loading) {
  return (
    <div className="bg-gradient-to-br from-[#0F172A] via-[#182031] to-[#303644] rounded-2xl shadow-2xl p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>
      
      <div className="flex items-center justify-center h-64 relative z-10">
        <div className="text-center">
          {/* Enhanced spinner with gradient */}
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-purple-400 border-b-amber-400 border-l-indigo-400 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-white/30"></div>
            <Sparkles className="w-6 h-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Initializing Gamification...</h3>
          <p className="text-gray-300 text-sm">Loading your quests and achievements</p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 rounded-2xl shadow-2xl p-8 border border-red-200 relative overflow-hidden">
      {/* Error background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-8 right-8 w-24 h-24 bg-red-200 rounded-full blur-2xl"></div>
        <div className="absolute bottom-8 left-8 w-20 h-20 bg-rose-200 rounded-full blur-xl"></div>
      </div>
      
      <div className="flex items-center justify-center h-64 relative z-10">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-red-700 mb-3">Oops! Something went wrong</h3>
          <p className="text-red-600 mb-6 max-w-md mx-auto leading-relaxed">{error}</p>
          <button
            onClick={initializeGamification}
            className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 shadow-lg hover:from-red-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-2 mx-auto"
          >
            <Shield className="w-5 h-5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
return (
  <div className="space-y-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    {/* Enhanced Welcome Banner */}
    <div className="bg-gradient-to-br from-[#0F172A] via-[#182031] to-[#303644] rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden group">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-8 right-8 w-32 h-32 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-8 left-8 w-24 h-24 bg-gradient-to-br from-purple-400/30 to-indigo-500/30 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>
      
      {/* Floating sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Sparkles className="absolute top-12 left-24 w-4 h-4 text-emerald-300 animate-bounce delay-200" />
        <Sparkles className="absolute top-20 right-32 w-3 h-3 text-purple-300 animate-bounce delay-700" />
        <Sparkles className="absolute bottom-24 right-16 w-5 h-5 text-amber-300 animate-bounce delay-1200" />
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl mr-6 shadow-xl relative group-hover:scale-110 transition-transform duration-300">
            <Trophy className="w-10 h-10 text-white" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Gamification Hub
            </h1>
            <p className="text-gray-300 text-lg flex items-center">
              <Zap className="w-5 h-5 text-amber-400 mr-2 animate-pulse" />
              Challenge yourself, earn rewards, and climb the leaderboard!
            </p>
          </div>
        </div>

        {progress && (
          <div className="text-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center mb-2">
              <Crown className="w-5 h-5 text-amber-400 mr-2" />
              <p className="text-xs text-gray-300 uppercase font-bold tracking-wider">Your Level</p>
            </div>
            <p className="text-5xl font-extrabold text-transparent bg-gradient-to-br from-amber-300 to-orange-400 bg-clip-text mb-1">
              {progress.level}
            </p>
            <div className="flex items-center justify-center">
              <Star className="w-4 h-4 text-purple-400 mr-1" />
              <p className="text-sm text-gray-400 font-semibold">{progress.totalPoints.toLocaleString()} pts</p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Enhanced Tab Navigation */}
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative p-6 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                isActive
                  ? `bg-gradient-to-br ${tab.gradient} text-white shadow-2xl border-2 border-white/20`
                  : 'text-gray-700 hover:text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 hover:border-gray-300 shadow-lg'
              }`}
            >
              {/* Background glow for active tab */}
              {isActive && (
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${tab.gradient} blur-xl opacity-50 -z-10 group-hover:opacity-70 transition-opacity`}></div>
              )}
              
              <div className="flex items-center mb-3">
                <div className={`p-3 rounded-xl mr-4 transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20 backdrop-blur-sm shadow-lg' 
                    : 'bg-gray-200 group-hover:bg-gray-300'
                }`}>
                  <IconComponent className={`w-6 h-6 transition-all duration-300 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-600 group-hover:text-gray-800'
                  }`} />
                </div>
                <div className={`font-bold text-xl transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-gray-800'
                }`}>
                  {tab.label}
                </div>
              </div>
              
              <div className={`text-sm leading-relaxed transition-all duration-300 ${
                isActive ? 'text-white/90' : 'text-gray-600'
              }`}>
                {tab.description}
              </div>
              
              {/* Floating elements for active tab */}
              {isActive && (
                <>
                  <Sparkles className="absolute top-4 right-4 w-4 h-4 text-white/60 animate-pulse" />
                  <div className="absolute bottom-4 right-4 flex space-x-1">
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-200"></div>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>

    {/* Tab Content */}
    <div>
      {activeTab === 'quests' && <QuestDashboard athleteId={athleteId} />}
      {activeTab === 'achievements' && <AchievementDashboard athleteId={athleteId} />}
      {activeTab === 'leaderboard' && (
        <Leaderboard athleteId={athleteId} sport={sport} region={region} />
      )}
    </div>

    {/* Enhanced Motivation Footer */}
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-8 border border-emerald-200 shadow-xl relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-6 right-8 w-20 h-20 bg-gradient-to-br from-emerald-300 to-teal-400 rounded-full blur-xl"></div>
        <div className="absolute bottom-6 left-8 w-16 h-16 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full blur-lg"></div>
      </div>
      
      <div className="flex items-start relative z-10">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl mr-6 shadow-xl">
          <Star className="w-8 h-8 text-white" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
        </div>
        <div className="flex-1">
          <div className="flex items-center mb-4">
            <h4 className="text-2xl font-bold text-gray-800 mr-3">Stay Motivated!</h4>
            <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 text-sm">
            {/* Daily Goals Section */}
            <div className="bg-gradient-to-br from-white/80 to-emerald-50/80 backdrop-blur-sm p-6 rounded-xl border border-emerald-200 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-lg mr-3">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <h5 className="text-lg font-bold text-gray-800">Daily Goals</h5>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center group hover:scale-105 transition-transform">
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-1.5 rounded-lg mr-3 shadow-md">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 group-hover:text-gray-900 font-medium">Log at least one training session</span>
                </li>
                <li className="flex items-center group hover:scale-105 transition-transform">
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-1.5 rounded-lg mr-3 shadow-md">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 group-hover:text-gray-900 font-medium">Check available quests</span>
                </li>
                <li className="flex items-center group hover:scale-105 transition-transform">
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-1.5 rounded-lg mr-3 shadow-md">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 group-hover:text-gray-900 font-medium">Maintain your streak</span>
                </li>
              </ul>
            </div>
            
            {/* Weekly Challenges Section */}
            <div className="bg-gradient-to-br from-white/80 to-purple-50/80 backdrop-blur-sm p-6 rounded-xl border border-purple-200 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg mr-3">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h5 className="text-lg font-bold text-gray-800">Weekly Challenges</h5>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center group hover:scale-105 transition-transform">
                  <div className="bg-gradient-to-br from-indigo-400 to-purple-500 p-1.5 rounded-lg mr-3 shadow-md">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 group-hover:text-gray-900 font-medium">Complete 3 active quests</span>
                </li>
                <li className="flex items-center group hover:scale-105 transition-transform">
                  <div className="bg-gradient-to-br from-indigo-400 to-purple-500 p-1.5 rounded-lg mr-3 shadow-md">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 group-hover:text-gray-900 font-medium">Earn 100+ points</span>
                </li>
                <li className="flex items-center group hover:scale-105 transition-transform">
                  <div className="bg-gradient-to-br from-indigo-400 to-purple-500 p-1.5 rounded-lg mr-3 shadow-md">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 group-hover:text-gray-900 font-medium">Climb 5 spots on leaderboard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating motivational elements */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce delay-300" />
          <Sparkles className="w-3 h-3 text-teal-400 animate-bounce delay-700" />
          <Sparkles className="w-4 h-4 text-cyan-400 animate-bounce delay-1100" />
        </div>
      </div>
    </div>
  </div>
);
}