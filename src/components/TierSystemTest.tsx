"use client";
import React, { useState } from 'react';
import { 
  initializeAthleteTierProgress, 
  getAthleteTierProgress,
  AthleteTierProgress,
  QuestTier
} from '@/services/gamificationService';

interface TierSystemTestProps {
  athleteId: string;
}

export default function TierSystemTest({ athleteId }: TierSystemTestProps) {
  const [tierProgress, setTierProgress] = useState<AthleteTierProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const initializeTiers = async () => {
    setLoading(true);
    setMessage('Initializing tier progress...');
    
    try {
      await initializeAthleteTierProgress(athleteId);
      const result = await getAthleteTierProgress(athleteId);
      
      if (result.success && result.tierProgress) {
        setTierProgress(result.tierProgress);
        setMessage('✅ Tier progress initialized successfully!');
      } else {
        setMessage('❌ Failed to initialize tier progress: ' + result.error);
      }
    } catch (error) {
      setMessage('💥 Error: ' + String(error));
    }
    
    setLoading(false);
  };

  const refreshTierData = async () => {
    setLoading(true);
    setMessage('Refreshing tier data...');
    
    try {
      const result = await getAthleteTierProgress(athleteId);
      
      if (result.success && result.tierProgress) {
        setTierProgress(result.tierProgress);
        setMessage('🔄 Tier data refreshed!');
      } else {
        setMessage('❌ Failed to refresh: ' + result.error);
      }
    } catch (error) {
      setMessage('💥 Error: ' + String(error));
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-2xl font-bold mb-4">🧪 Tier System Test</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={initializeTiers}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '⏳ Loading...' : '🚀 Initialize Tiers'}
          </button>
          
          <button
            onClick={refreshTierData}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            🔄 Refresh Data
          </button>
        </div>
        
        {message && (
          <div className="p-3 bg-gray-100 rounded-lg text-sm font-mono">
            {message}
          </div>
        )}
        
        {tierProgress && (
          <div className="border rounded-lg p-4 bg-slate-50">
            <h3 className="font-bold mb-2">📊 Tier Progress Overview</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Athlete ID:</strong> {tierProgress.athleteId}</p>
              <p><strong>Current Tier:</strong> {tierProgress.currentTier}</p>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">🏆 Tier Status:</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as QuestTier[]).map((tier) => {
                    const tierInfo = tierProgress.tiers[tier];
                    return (
                      <div 
                        key={tier}
                        className={`p-3 rounded-lg border-2 text-center ${
                          tierInfo?.isUnlocked 
                            ? tierInfo?.isMedalAwarded 
                              ? 'bg-yellow-100 border-yellow-400' 
                              : 'bg-blue-100 border-blue-400'
                            : 'bg-gray-100 border-gray-300 opacity-50'
                        }`}
                      >
                        <div className="text-lg mb-1">
                          {tier === 'bronze' && '🥉'}
                          {tier === 'silver' && '🥈'}
                          {tier === 'gold' && '🥇'}
                          {tier === 'platinum' && '💎'}
                          {tier === 'diamond' && '💍'}
                        </div>
                        <div className="text-xs font-semibold capitalize">{tier}</div>
                        <div className="text-xs mt-1">
                          {tierInfo?.completedQuests || 0} / {tierInfo?.totalQuests || 4}
                        </div>
                        <div className="text-xs">
                          {tierInfo?.isMedalAwarded 
                            ? '🏅 Medal' 
                            : tierInfo?.isUnlocked 
                              ? '🔓 Unlocked' 
                              : '🔒 Locked'
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}