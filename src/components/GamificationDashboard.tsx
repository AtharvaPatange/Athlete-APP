"use client";
import { useState, useEffect } from "react";
import QuestDashboard from "./QuestDashboard";
import AchievementDashboard from "./AchievementDashboard";
import Leaderboard from "./Leaderboard";
import { Trophy, Target, Flame, Star } from "lucide-react";
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

  const tabs = [
    { 
      id: 'quests', 
      label: '🎯 Quests', 
      description: 'Complete challenges to earn points and badges' 
    },
    { 
      id: 'achievements', 
      label: '🏆 Achievements', 
      description: 'View your progress and earned badges' 
    },
    { 
      id: 'leaderboard', 
      label: '🏅 Leaderboard', 
      description: 'See how you rank against other athletes' 
    }
  ];

  if (loading) {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          {/* Fancy spinner */}
          <div className="relative w-14 h-14 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
          </div>
          <p className="text-slate-700 font-medium">Initializing Gamification...</p>
          <p className="text-slate-500 text-sm mt-2">This should only take a few seconds</p>
        </div>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-red-600 mb-2">Loading Error</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={initializeGamification}
            className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
return (
  <div className="space-y-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    {/* Welcome Banner */}
    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-black rounded-xl shadow-xl p-6 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,_#6366f1,_transparent_60%)]"></div>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <div className="bg-slate-700 bg-opacity-40 p-4 rounded-lg mr-4 shadow-inner">
            <Trophy className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gamification Hub</h1>
            <p className="text-slate-300 text-sm">Challenge yourself, earn rewards, and climb the leaderboard!</p>
          </div>
        </div>

        {progress && (
          <div className="text-center bg-slate-700 bg-opacity-40 rounded-lg p-4 shadow-inner">
            <p className="text-xs text-slate-300 uppercase">Your Level</p>
            <p className="text-4xl font-extrabold text-indigo-400">{progress.level}</p>
            <p className="text-sm text-slate-400">{progress.totalPoints.toLocaleString()} pts</p>
          </div>
        )}
      </div>
    </div>

    {/* Tab Navigation */}
    <div className="bg-white rounded-xl shadow-lg p-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`p-4 rounded-lg text-left transition-all border ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-slate-800 to-black text-white border-slate-700 shadow-lg scale-[1.02]'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="font-semibold mb-1">{tab.label}</div>
            <div className={`text-sm ${activeTab === tab.id ? 'text-slate-300' : 'text-slate-500'}`}>
              {tab.description}
            </div>
          </button>
        ))}
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

    {/* Motivation Footer */}
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-start">
        <div className="bg-slate-200 p-3 rounded-lg mr-4">
          <Star className="w-6 h-6 text-yellow-500" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">Stay Motivated!</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div>
              <h5 className="font-medium text-slate-900 mb-1">Daily Goals:</h5>
              <ul className="space-y-1">
                <li className="flex items-center">
                  <Flame className="w-4 h-4 text-green-500 mr-2" />
                  Log at least one training session
                </li>
                <li className="flex items-center">
                  <Flame className="w-4 h-4 text-green-500 mr-2" />
                  Check available quests
                </li>
                <li className="flex items-center">
                  <Flame className="w-4 h-4 text-green-500 mr-2" />
                  Maintain your streak
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-slate-900 mb-1">Weekly Challenges:</h5>
              <ul className="space-y-1">
                <li className="flex items-center">
                  <Target className="w-4 h-4 text-indigo-500 mr-2" />
                  Complete 3 active quests
                </li>
                <li className="flex items-center">
                  <Target className="w-4 h-4 text-indigo-500 mr-2" />
                  Earn 100+ points
                </li>
                <li className="flex items-center">
                  <Target className="w-4 h-4 text-indigo-500 mr-2" />
                  Climb 5 spots on leaderboard
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}