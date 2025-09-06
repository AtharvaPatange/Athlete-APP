"use client";
import { useState } from "react";
import TrainingLogForm from "./TrainingLogForm";
import PerformanceAnalytics from "./PerformanceAnalytics";
import TrainingSessionsList from "./TrainingSessionsList";
import GamificationDashboard from "./GamificationDashboard";

interface PerformanceTabsProps {
  athleteId: string;
  sport?: string;
  region?: string;
}

const tabs = [
  { id: 'log', label: '📝 Log Training', icon: '📝' },
  { id: 'analytics', label: '📊 Analytics', icon: '📊' },
  { id: 'sessions', label: '📋 History', icon: '📋' },
  { id: 'gamification', label: '🎮 Challenges', icon: '🎮' }
];

export default function PerformanceTabs({ athleteId, sport, region }: PerformanceTabsProps) {
  const [activeTab, setActiveTab] = useState('log');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSessionAdded = () => {
    // Trigger refresh for analytics and sessions list
    setRefreshTrigger(prev => prev + 1);
    // Switch to analytics tab to show the new data
    setActiveTab('analytics');
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2 text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'log' && (
          <TrainingLogForm 
            athleteId={athleteId} 
            onSessionAdded={handleSessionAdded}
          />
        )}
        
        {activeTab === 'analytics' && (
          <PerformanceAnalytics 
            athleteId={athleteId} 
            refreshTrigger={refreshTrigger}
          />
        )}
        
        {activeTab === 'sessions' && (
          <TrainingSessionsList 
            athleteId={athleteId} 
            refreshTrigger={refreshTrigger}
          />
        )}
        
        {activeTab === 'gamification' && (
          <GamificationDashboard 
            athleteId={athleteId}
            sport={sport}
            region={region}
          />
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">🎯</div>
            <p className="text-sm opacity-90">Weekly Goal</p>
            <p className="text-lg font-semibold">5 Sessions</p>
          </div>
          <div>
            <div className="text-2xl font-bold">🔥</div>
            <p className="text-sm opacity-90">Streak</p>
            <p className="text-lg font-semibold">7 Days</p>
          </div>
          <div>
            <div className="text-2xl font-bold">📈</div>
            <p className="text-sm opacity-90">This Month</p>
            <p className="text-lg font-semibold">18 Sessions</p>
          </div>
          <div>
            <div className="text-2xl font-bold">⚡</div>
            <p className="text-sm opacity-90">Avg Intensity</p>
            <p className="text-lg font-semibold">Medium</p>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-start">
          <div className="bg-green-100 p-3 rounded-lg mr-4">
            <span className="text-2xl">💡</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Performance Tips</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Log your training consistently to track progress patterns
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Include heart rate data for better intensity monitoring
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Add detailed notes about how you felt during training
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Review weekly/monthly trends to optimize your training plan
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
