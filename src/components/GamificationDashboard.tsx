"use client";
import { useState, useEffect } from "react";
import QuestDashboard from "./QuestDashboard";
import AchievementDashboard from "./AchievementDashboard";
import Leaderboard from "./Leaderboard";
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
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing gamification...</p>
            <p className="text-gray-500 text-sm mt-2">This should only take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-600 mb-2">Loading Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={initializeGamification}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-4 rounded-lg mr-4">
              <span className="text-4xl">🎮</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gamification Hub</h1>
              <p className="text-purple-100">Challenge yourself, earn rewards, and climb the leaderboard!</p>
            </div>
          </div>
          
          {progress && (
            <div className="text-center bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Your Level</p>
              <p className="text-4xl font-bold">{progress.level}</p>
              <p className="text-sm text-purple-100">{progress.totalPoints.toLocaleString()} pts</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-4 rounded-lg text-left transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold mb-1">{tab.label}</div>
              <div className={`text-sm ${activeTab === tab.id ? 'text-purple-100' : 'text-gray-500'}`}>
                {tab.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'quests' && (
          <QuestDashboard athleteId={athleteId} />
        )}
        
        {activeTab === 'achievements' && (
          <AchievementDashboard athleteId={athleteId} />
        )}
        
        {activeTab === 'leaderboard' && (
          <Leaderboard 
            athleteId={athleteId} 
            sport={sport}
            region={region}
          />
        )}
      </div>

      {/* Motivation Footer */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-start">
          <div className="bg-indigo-100 p-3 rounded-lg mr-4">
            <span className="text-2xl">💪</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Stay Motivated!</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Daily Goals:</h5>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Log at least one training session
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Check available quests
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Maintain your streak
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Weekly Challenges:</h5>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">🎯</span>
                    Complete 3 active quests
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">🎯</span>
                    Earn 100+ points
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">🎯</span>
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