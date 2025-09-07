import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getAthleteInjuries,
  updateInjury,
  getInjuryStatusBadge,
  type Injury
} from '@/services/injuryService';
import InjuryReportForm from './InjuryReportForm';
import RecoveryTracker from './RecoveryTracker';

export default function InjuryManagement() {
  const { user } = useAuth();
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'report' | 'tracker'>('dashboard');
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null);

  useEffect(() => {
    if (user) {
      loadInjuries();
    }
  }, [user]);

  const loadInjuries = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await getAthleteInjuries(user.uid);
      if (result.success) {
        setInjuries(result.injuries);
      } else {
        console.error('Error loading injuries:', result.error);
      }
    } catch (error) {
      console.error('Error loading injuries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInjuryReported = (injuryId: string) => {
    setActiveView('dashboard');
    loadInjuries(); // Reload injuries list
  };

  const handleViewRecovery = (injury: Injury) => {
    setSelectedInjury(injury);
    setActiveView('tracker');
  };

  const handleUpdateInjuryStatus = async (injuryId: string, status: 'active' | 'recovering' | 'recovered' | 'chronic') => {
    try {
      await updateInjury(injuryId, { status });
      await loadInjuries();
    } catch (error) {
      console.error('Error updating injury status:', error);
      alert('Failed to update injury status. Please try again.');
    }
  };

  const getActiveInjuries = () => injuries.filter(injury => injury.status === 'active' || injury.status === 'recovering');
  const getRecoveredInjuries = () => injuries.filter(injury => injury.status === 'recovered');
  const getChronicInjuries = () => injuries.filter(injury => injury.status === 'chronic');

  const getInjuryIcon = (injuryType: string) => {
    switch (injuryType) {
      case 'muscle': return '💪';
      case 'bone': return '🦴';
      case 'joint': return '🔗';
      case 'ligament': return '🏃‍♂️';
      case 'tendon': return '🎯';
      default: return '❓';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'severe': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading injury management...</p>
        </div>
      </div>
    );
  }

  if (activeView === 'report') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <InjuryReportForm
            onSubmitSuccess={handleInjuryReported}
            onCancel={() => setActiveView('dashboard')}
          />
        </div>
      </div>
    );
  }

  if (activeView === 'tracker' && selectedInjury) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => setActiveView('dashboard')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Injury Dashboard
            </button>
          </div>
          <RecoveryTracker
            injury={selectedInjury}
            onUpdateInjury={loadInjuries}
          />
        </div>
      </div>
    );
  }

  const activeInjuries = getActiveInjuries();
  const recoveredInjuries = getRecoveredInjuries();
  const chronicInjuries = getChronicInjuries();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🏥 Injury Management</h2>
          <p className="text-gray-600 mt-2">Track, manage, and recover from injuries</p>
        </div>
        <button
          onClick={() => setActiveView('report')}
          className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-red-700 hover:to-pink-700 transition-all"
        >
          🚨 Report New Injury
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Active Injuries</p>
              <p className="text-2xl font-bold text-red-600">{activeInjuries.length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <span className="text-2xl">🚨</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Recovered</p>
              <p className="text-2xl font-bold text-green-600">{recoveredInjuries.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Chronic Conditions</p>
              <p className="text-2xl font-bold text-orange-600">{chronicInjuries.length}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Total Injuries</p>
              <p className="text-2xl font-bold text-purple-600">{injuries.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Injuries */}
      {activeInjuries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">🚨 Active Injuries</h3>
          <div className="space-y-4">
            {activeInjuries.map((injury) => {
              const statusBadge = getInjuryStatusBadge(injury);
              return (
                <div key={injury.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{getInjuryIcon(injury.injuryType)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-xl font-semibold text-gray-900">
                            {injury.bodyPart} {injury.injuryType}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(injury.severity)}`}>
                            {injury.severity}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusBadge.color}`}>
                            {statusBadge.icon} {statusBadge.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{injury.description}</p>
                        <div className="text-sm text-gray-500 space-x-4">
                          <span>📅 Injured: {injury.diagnosisDate.toLocaleDateString()}</span>
                          {injury.expectedRecoveryDate && (
                            <span>🎯 Expected Recovery: {injury.expectedRecoveryDate.toLocaleDateString()}</span>
                          )}
                        </div>
                        {injury.symptoms.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1">
                              {injury.symptoms.slice(0, 5).map((symptom) => (
                                <span key={symptom} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                  {symptom}
                                </span>
                              ))}
                              {injury.symptoms.length > 5 && (
                                <span className="text-gray-500 text-xs">+{injury.symptoms.length - 5} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleViewRecovery(injury)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        🔄 Track Recovery
                      </button>
                      
                      <div className="relative group">
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                          Update Status ▼
                        </button>
                        <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleUpdateInjuryStatus(injury.id!, 'recovering')}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              🏥 Recovering
                            </button>
                            <button
                              onClick={() => handleUpdateInjuryStatus(injury.id!, 'recovered')}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              ✅ Recovered
                            </button>
                            <button
                              onClick={() => handleUpdateInjuryStatus(injury.id!, 'chronic')}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              ⚠️ Chronic
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Injury History */}
      {(recoveredInjuries.length > 0 || chronicInjuries.length > 0) && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📚 Injury History</h3>
          
          {recoveredInjuries.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-green-600 mb-4">✅ Recovered Injuries</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {recoveredInjuries.map((injury) => (
                  <div key={injury.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getInjuryIcon(injury.injuryType)}</span>
                      <span className="font-medium text-gray-900">{injury.bodyPart}</span>
                      <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(injury.severity)}`}>
                        {injury.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{injury.description}</p>
                    <div className="text-xs text-gray-500">
                      <span>Injured: {injury.diagnosisDate.toLocaleDateString()}</span>
                      {injury.actualRecoveryDate && (
                        <span className="ml-3">Recovered: {injury.actualRecoveryDate.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chronicInjuries.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-orange-600 mb-4">⚠️ Chronic Conditions</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {chronicInjuries.map((injury) => (
                  <div key={injury.id} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getInjuryIcon(injury.injuryType)}</span>
                          <span className="font-medium text-gray-900">{injury.bodyPart}</span>
                          <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(injury.severity)}`}>
                            {injury.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{injury.description}</p>
                        <div className="text-xs text-gray-500">
                          Since: {injury.diagnosisDate.toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewRecovery(injury)}
                        className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {injuries.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-8xl mb-6">🏥</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No Injuries Reported</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Great news! You haven't reported any injuries yet. Stay safe and keep up the good work!
          </p>
          <button
            onClick={() => setActiveView('report')}
            className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-xl font-medium hover:from-red-700 hover:to-pink-700 transition-all"
          >
            🚨 Report First Injury
          </button>
        </div>
      )}
    </div>
  );
}
