import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getRecoveryMilestones,
  addRecoveryProgress,
  getRecoveryProgress,
  updateMilestone,
  getCoachVerifications,
  generateRecoveryMilestones,
  addRecoveryMilestone,
  type Injury,
  type RecoveryMilestone,
  type RecoveryProgress,
  type CoachVerification,
  calculateRecoveryProgress
} from '@/services/injuryService';

interface RecoveryTrackerProps {
  injury: Injury;
  onUpdateInjury?: () => void;
}

export default function RecoveryTracker({ injury, onUpdateInjury }: RecoveryTrackerProps) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<RecoveryMilestone[]>([]);
  const [progress, setProgress] = useState<RecoveryProgress[]>([]);
  const [verifications, setVerifications] = useState<CoachVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'milestones' | 'progress' | 'verification'>('milestones');
  const [isGeneratingMilestones, setIsGeneratingMilestones] = useState(false);

  // Progress form state
  const [progressForm, setProgressForm] = useState({
    painLevel: 5,
    mobilityLevel: 5,
    notes: '',
    exercisesCompleted: [] as string[],
    physiotherapySession: false,
    medicationTaken: [] as string[]
  });

  const [showProgressForm, setShowProgressForm] = useState(false);

  useEffect(() => {
    loadRecoveryData();
  }, [injury.id]);

  const loadRecoveryData = async () => {
    if (!injury.id) return;

    setLoading(true);
    try {
      const [milestonesResult, progressResult, verificationsResult] = await Promise.all([
        getRecoveryMilestones(injury.id),
        getRecoveryProgress(injury.id),
        getCoachVerifications(injury.id)
      ]);

      if (milestonesResult.success) {
        setMilestones(milestonesResult.milestones);
      }
      if (progressResult.success) {
        setProgress(progressResult.progress);
      }
      if (verificationsResult.success) {
        setVerifications(verificationsResult.verifications);
      }
    } catch (error) {
      console.error('Error loading recovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMilestones = async () => {
    if (!injury.id) return;

    setIsGeneratingMilestones(true);
    try {
      const generatedMilestones = await generateRecoveryMilestones(injury);
      
      // Add each milestone to Firestore
      for (const milestone of generatedMilestones) {
        await addRecoveryMilestone(milestone);
      }
      
      // Reload milestones
      await loadRecoveryData();
    } catch (error) {
      console.error('Error generating milestones:', error);
      alert('Failed to generate recovery milestones. Please try again.');
    } finally {
      setIsGeneratingMilestones(false);
    }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      await updateMilestone(milestoneId, {
        isCompleted: true,
        completedDate: new Date()
      });
      await loadRecoveryData();
    } catch (error) {
      console.error('Error completing milestone:', error);
      alert('Failed to complete milestone. Please try again.');
    }
  };

  const handleSubmitProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !injury.id) return;

    try {
      const progressData = {
        injuryId: injury.id,
        athleteId: user.uid,
        date: new Date(),
        painLevel: progressForm.painLevel,
        mobilityLevel: progressForm.mobilityLevel,
        notes: progressForm.notes,
        exercisesCompleted: progressForm.exercisesCompleted,
        physiotherapySession: progressForm.physiotherapySession,
        medicationTaken: progressForm.medicationTaken
      };

      await addRecoveryProgress(progressData);
      
      // Reset form
      setProgressForm({
        painLevel: 5,
        mobilityLevel: 5,
        notes: '',
        exercisesCompleted: [],
        physiotherapySession: false,
        medicationTaken: []
      });
      
      setShowProgressForm(false);
      await loadRecoveryData();
    } catch (error) {
      console.error('Error submitting progress:', error);
      alert('Failed to submit progress. Please try again.');
    }
  };

  const getOverallProgress = () => {
    return calculateRecoveryProgress(injury, milestones);
  };

  const getRecoveryStatus = () => {
    const overallProgress = getOverallProgress();
    const now = new Date();
    const expectedDate = injury.expectedRecoveryDate;
    
    if (overallProgress === 100) {
      return { status: 'Recovered', color: 'text-green-600 bg-green-50 border-green-200', icon: '✅' };
    }
    
    if (expectedDate && now > expectedDate && overallProgress < 80) {
      return { status: 'At Risk', color: 'text-red-600 bg-red-50 border-red-200', icon: '⚠️' };
    }
    
    if (overallProgress > 75) {
      return { status: 'Nearly Recovered', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: '🔄' };
    }
    
    return { status: 'Recovering', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: '🏥' };
  };

  const getLatestProgress = () => {
    return progress.length > 0 ? progress[0] : null;
  };

  const recoveryStatus = getRecoveryStatus();
  const overallProgress = getOverallProgress();
  const latestProgress = getLatestProgress();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recovery data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Recovery Tracker</h2>
          <p className="text-gray-600 mt-2">{injury.bodyPart} - {injury.injuryType}</p>
        </div>
        
        <div className="text-right">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${recoveryStatus.color}`}>
            <span className="mr-2">{recoveryStatus.icon}</span>
            {recoveryStatus.status}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {overallProgress}% Complete
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 text-sm font-medium">Overall Progress</p>
              <p className="text-2xl font-bold text-blue-900">{overallProgress}%</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 text-sm font-medium">Milestones</p>
              <p className="text-2xl font-bold text-green-900">
                {milestones.filter(m => m.isCompleted).length}/{milestones.length}
              </p>
            </div>
            <div className="text-2xl">🎯</div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-800 text-sm font-medium">Latest Pain Level</p>
              <p className="text-2xl font-bold text-purple-900">
                {latestProgress ? `${latestProgress.painLevel}/10` : 'N/A'}
              </p>
            </div>
            <div className="text-2xl">😤</div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-800 text-sm font-medium">Days Since Injury</p>
              <p className="text-2xl font-bold text-orange-900">
                {Math.ceil((new Date().getTime() - injury.diagnosisDate.getTime()) / (1000 * 60 * 60 * 24))}
              </p>
            </div>
            <div className="text-2xl">📅</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'milestones', label: 'Recovery Milestones', icon: '🎯' },
            { id: 'progress', label: 'Progress Tracking', icon: '📈' },
            { id: 'verification', label: 'Coach Verification', icon: '✅' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'milestones' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recovery Milestones</h3>
            {milestones.length === 0 && (
              <button
                onClick={handleGenerateMilestones}
                disabled={isGeneratingMilestones}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {isGeneratingMilestones ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating AI Milestones...
                  </div>
                ) : (
                  '🤖 Generate AI Milestones'
                )}
              </button>
            )}
          </div>

          {milestones.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recovery Milestones Yet</h3>
              <p className="text-gray-600 mb-6">Generate AI-powered recovery milestones to track your progress</p>
              <button
                onClick={handleGenerateMilestones}
                disabled={isGeneratingMilestones}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {isGeneratingMilestones ? 'Generating...' : '🤖 Generate Recovery Plan'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`p-6 rounded-xl border transition-all ${
                    milestone.isCompleted
                      ? 'bg-green-50 border-green-200'
                      : milestone.isVerified
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 mr-3">{milestone.title}</h4>
                        {milestone.aiGenerated && (
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                            🤖 AI Generated
                          </span>
                        )}
                        {milestone.isVerified && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full ml-2">
                            ✅ Coach Verified
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{milestone.description}</p>
                      <div className="text-sm text-gray-500">
                        Target: {milestone.targetDate.toLocaleDateString()}
                        {milestone.completedDate && (
                          <span className="ml-4 text-green-600">
                            Completed: {milestone.completedDate.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex items-center space-x-2">
                      {milestone.isCompleted ? (
                        <div className="text-green-600 text-2xl">✅</div>
                      ) : (
                        <button
                          onClick={() => handleCompleteMilestone(milestone.id!)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Progress Tracking</h3>
            <button
              onClick={() => setShowProgressForm(!showProgressForm)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
             Add Progress Entry
            </button>
          </div>

          {showProgressForm && (
            <form onSubmit={handleSubmitProgress} className="bg-gray-50 p-6 rounded-xl mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pain Level (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={progressForm.painLevel}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, painLevel: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>No Pain</span>
                    <span className="font-medium">{progressForm.painLevel}/10</span>
                    <span>Severe Pain</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobility Level (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={progressForm.mobilityLevel}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, mobilityLevel: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Very Limited</span>
                    <span className="font-medium">{progressForm.mobilityLevel}/10</span>
                    <span>Full Mobility</span>
                  </div>
                </div>
              </div>

                            <div className="mt-6">
                <label className="block text-sm font-medium text-[#0F172A] mb-2">
                  Progress Notes
                </label>
                <textarea
                  value={progressForm.notes}
                  onChange={(e) =>
                    setProgressForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-[#303644] rounded-lg 
                            focus:ring-2 focus:ring-[#0F172A] focus:border-transparent
                            placeholder:text-[#6B7280] text-[#182031]"
                  placeholder="How are you feeling today? Any improvements or concerns?"
                />
              </div>

              <div className="flex items-center space-x-6 mt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={progressForm.physiotherapySession}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, physiotherapySession: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Had physiotherapy session today</span>
                </label>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Progress
                </button>
                <button
                  type="button"
                  onClick={() => setShowProgressForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {progress.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Progress Entries Yet</h3>
              <p className="text-gray-600">Start tracking your daily recovery progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {progress.slice(0, 10).map((entry) => (
                <div key={entry.id} className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {entry.date.toLocaleDateString()}
                      </h4>
                      <p className="text-gray-600">{entry.notes}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Pain: {entry.painLevel}/10 | Mobility: {entry.mobilityLevel}/10
                      </div>
                      {entry.physiotherapySession && (
                        <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full mt-1">
                          💪 Physiotherapy
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'verification' && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Coach Verification</h3>
          
          {verifications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Coach Verifications Yet</h3>
              <p className="text-gray-600">Your coach will verify your recovery progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => (
                <div key={verification.id} className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Verification by {verification.coachName}
                      </h4>
                      <p className="text-gray-600 mt-2">{verification.notes}</p>
                      <div className="text-sm text-gray-500 mt-2">
                        {verification.verificationDate.toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      verification.status === 'cleared' 
                        ? 'bg-green-100 text-green-700'
                        : verification.status === 'not_ready'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {verification.status === 'cleared' ? '✅ Cleared' :
                       verification.status === 'not_ready' ? '❌ Not Ready' :
                       '⚠️ Needs Attention'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
