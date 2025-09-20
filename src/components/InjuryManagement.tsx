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

const COLORS = {
  oxfordBlue: "#030C26",
  marianBlue: "#2D488B",
  seasalt: "#F9FAFB",
  powderBlue: "#9FAFDO",
  platinum: "#E0E4E9",
};

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
    loadInjuries();
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.seasalt }}>
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: COLORS.marianBlue }}
          ></div>
          <p style={{ color: COLORS.marianBlue }}>Loading injury management...</p>
        </div>
      </div>
    );
  }

  if (activeView === 'report') {
    return (
      <div className="min-h-screen py-8" style={{ backgroundColor: COLORS.seasalt }}>
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
      <div className="min-h-screen py-8" style={{ backgroundColor: COLORS.seasalt }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => setActiveView('dashboard')}
              className="font-medium hover:underline"
              style={{ color: COLORS.marianBlue }}
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
          <h2 className="text-3xl font-bold" style={{ color: COLORS.oxfordBlue }}> Injury Management</h2>
          <p className="mt-2" style={{ color: COLORS.marianBlue }}>Track, manage, and recover from injuries</p>
        </div>
        <button
          onClick={() => setActiveView('report')}
          className="px-6 py-3 rounded-xl font-medium transition-all"
          style={{
            background: `linear-gradient(to right, ${COLORS.oxfordBlue}, ${COLORS.marianBlue})`,
            color: COLORS.seasalt
          }}
        >
           Report New Injury
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl shadow-lg border" style={{ backgroundColor: COLORS.seasalt, borderColor: COLORS.platinum }}>
          <p className="text-sm font-medium" style={{ color: COLORS.marianBlue }}>Active Injuries</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.marianBlue }}>{activeInjuries.length}</p>
        </div>

        <div className="p-6 rounded-xl shadow-lg border" style={{ backgroundColor: COLORS.seasalt, borderColor: COLORS.platinum }}>
          <p className="text-sm font-medium" style={{ color: COLORS.marianBlue }}>Recovered</p>
          <p className="text-2xl font-bold text-green-600">{recoveredInjuries.length}</p>
        </div>

        <div className="p-6 rounded-xl shadow-lg border" style={{ backgroundColor: COLORS.seasalt, borderColor: COLORS.platinum }}>
          <p className="text-sm font-medium" style={{ color: COLORS.marianBlue }}>Chronic</p>
          <p className="text-2xl font-bold text-orange-600">{chronicInjuries.length}</p>
        </div>

        <div className="p-6 rounded-xl shadow-lg border" style={{ backgroundColor: COLORS.seasalt, borderColor: COLORS.platinum }}>
          <p className="text-sm font-medium" style={{ color: COLORS.marianBlue }}>Total Injuries</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.oxfordBlue }}>{injuries.length}</p>
        </div>
      </div>

      {/* Active Injuries */}
      {activeInjuries.length > 0 && (
        <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: COLORS.seasalt }}>
          <h3 className="text-2xl font-bold mb-6" style={{ color: COLORS.oxfordBlue }}> Active Injuries</h3>
          {activeInjuries.map((injury) => {
            const statusBadge = getInjuryStatusBadge(injury);
            return (
              <div key={injury.id} className="border rounded-xl p-6 mb-4" style={{ borderColor: COLORS.platinum }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{getInjuryIcon(injury.injuryType)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-semibold" style={{ color: COLORS.oxfordBlue }}>
                          {injury.bodyPart} {injury.injuryType}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(injury.severity)}`}>
                          {injury.severity}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusBadge.color}`}>
                          {statusBadge.icon} {statusBadge.status}
                        </span>
                        {injury.needsCoachVerification && injury.verificationStatus === 'pending' && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium border border-yellow-300 bg-yellow-50 text-yellow-700">
                            ⏳ Awaiting Coach Verification
                          </span>
                        )}
                        {injury.verificationStatus === 'verified' && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium border border-green-300 bg-green-50 text-green-700">
                            ✅ Coach Verified
                          </span>
                        )}
                        {injury.verificationStatus === 'rejected' && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium border border-red-300 bg-red-50 text-red-700">
                            ❌ Needs Review
                          </span>
                        )}
                      </div>
                      <p style={{ color: COLORS.marianBlue }}>{injury.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewRecovery(injury)}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: COLORS.marianBlue,
                      color: COLORS.seasalt
                    }}
                  >
                    Track Recovery
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {injuries.length === 0 && (
        <div className="rounded-2xl shadow-lg p-12 text-center" style={{ backgroundColor: COLORS.seasalt }}>
          <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.oxfordBlue }}>No Injuries Reported</h3>
          <p className="mb-8 max-w-md mx-auto" style={{ color: COLORS.marianBlue }}>
            Great news! You haven't reported any injuries yet. Stay safe and keep up the good work!
          </p>
          <button
            onClick={() => setActiveView('report')}
            className="px-8 py-4 rounded-xl font-medium transition-all"
            style={{
              background: `linear-gradient(to right, ${COLORS.oxfordBlue}, ${COLORS.marianBlue})`,
              color: COLORS.seasalt
            }}
          >
            Report First Injury
          </button>
        </div>
      )}
    </div>
  );
}