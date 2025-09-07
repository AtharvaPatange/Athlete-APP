import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addCoachVerification, type Injury, type CoachVerification } from '@/services/injuryService';

interface CoachVerificationFormProps {
  injury: Injury;
  milestoneId?: string;
  onVerificationSubmitted?: () => void;
  onCancel?: () => void;
}

type VerificationStatus = 'cleared' | 'not_ready' | 'needs_attention';

const STATUS_OPTIONS: { value: VerificationStatus; label: string; color: string; icon: string; description: string }[] = [
  {
    value: 'cleared',
    label: 'Cleared for Next Phase',
    color: 'border-green-500 bg-green-50 text-green-700',
    icon: '✅',
    description: 'Athlete is ready to progress to the next recovery phase'
  },
  {
    value: 'not_ready',
    label: 'Not Ready to Progress',
    color: 'border-red-500 bg-red-50 text-red-700',
    icon: '❌',
    description: 'Athlete needs more time at current level before advancing'
  },
  {
    value: 'needs_attention',
    label: 'Needs Attention',
    color: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    icon: '⚠️',
    description: 'Requires additional assessment or modified approach'
  }
];

const RECOMMENDED_ACTIONS = [
  'Continue current exercise protocol',
  'Increase exercise intensity gradually',
  'Add sport-specific movements',
  'Focus on strengthening exercises',
  'Emphasize flexibility and mobility',
  'Reduce activity intensity',
  'Schedule additional physiotherapy',
  'Consult with sports medicine doctor',
  'Modify training regimen',
  'Implement pain management strategies',
  'Add recovery modalities (ice, heat, etc.)',
  'Schedule follow-up assessment'
];

export default function CoachVerificationForm({ 
  injury, 
  milestoneId, 
  onVerificationSubmitted, 
  onCancel 
}: CoachVerificationFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    status: '' as VerificationStatus,
    notes: '',
    recommendedActions: [] as string[],
    nextCheckupDate: ''
  });

  const [customAction, setCustomAction] = useState('');

  const handleStatusChange = (status: VerificationStatus) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleActionToggle = (action: string) => {
    setFormData(prev => ({
      ...prev,
      recommendedActions: prev.recommendedActions.includes(action)
        ? prev.recommendedActions.filter(a => a !== action)
        : [...prev.recommendedActions, action]
    }));
  };

  const addCustomAction = () => {
    if (customAction.trim() && !formData.recommendedActions.includes(customAction.trim())) {
      setFormData(prev => ({
        ...prev,
        recommendedActions: [...prev.recommendedActions, customAction.trim()]
      }));
      setCustomAction('');
    }
  };

  const removeAction = (action: string) => {
    setFormData(prev => ({
      ...prev,
      recommendedActions: prev.recommendedActions.filter(a => a !== action)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.status) return;

    setIsSubmitting(true);
    
    try {
      // For demo purposes, we'll use user info as coach
      // In a real app, this would be a proper coach user
      const verificationData: Omit<CoachVerification, 'id'> = {
        injuryId: injury.id!,
        milestoneId: milestoneId,
        athleteId: injury.athleteId,
        coachId: user.uid,
        coachName: user.displayName || user.email || 'Coach',
        status: formData.status,
        notes: formData.notes,
        recommendedActions: formData.recommendedActions.length > 0 ? formData.recommendedActions : undefined,
        nextCheckupDate: formData.nextCheckupDate ? new Date(formData.nextCheckupDate) : undefined,
        verificationDate: new Date()
      };

      const result = await addCoachVerification(verificationData);
      
      if (result.success) {
        onVerificationSubmitted?.();
      } else {
        alert(`Error submitting verification: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStatus = STATUS_OPTIONS.find(opt => opt.value === formData.status);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">👨‍⚕️ Coach Verification</h2>
          <p className="text-gray-600 mt-2">
            Verify recovery progress for {injury.bodyPart} {injury.injuryType}
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Injury Summary */}
      <div className="bg-gray-50 p-6 rounded-xl mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Injury Summary</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Injury Type</p>
            <p className="font-medium text-gray-900">{injury.injuryType} - {injury.bodyPart}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Severity</p>
            <p className="font-medium text-gray-900">{injury.severity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Injury Date</p>
            <p className="font-medium text-gray-900">{injury.diagnosisDate.toLocaleDateString()}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">Description</p>
          <p className="text-gray-900">{injury.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Verification Status */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🏥 Verification Status</h3>
          <div className="space-y-3">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStatusChange(option.value)}
                className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                  formData.status === option.value
                    ? option.color
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold">{option.label}</h4>
                    <p className="text-sm opacity-80 mt-1">{option.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Verification Notes */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📝 Assessment Notes</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Provide detailed notes on the athlete's current condition, progress, and any observations..."
            required
          />
        </div>

        {/* Recommended Actions */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">💡 Recommended Actions</h3>
          
          <div className="mb-4">
            <div className="grid md:grid-cols-2 gap-2">
              {RECOMMENDED_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => handleActionToggle(action)}
                  className={`p-3 border rounded-lg text-sm text-left transition-all ${
                    formData.recommendedActions.includes(action)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Action Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              placeholder="Add custom recommendation"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAction())}
            />
            <button
              type="button"
              onClick={addCustomAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>

          {/* Selected Actions */}
          {formData.recommendedActions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Selected Recommendations:</p>
              <div className="flex flex-wrap gap-2">
                {formData.recommendedActions.map((action) => (
                  <span
                    key={action}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {action}
                    <button
                      type="button"
                      onClick={() => removeAction(action)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Next Checkup Date */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📅 Next Checkup</h3>
          <input
            type="date"
            value={formData.nextCheckupDate}
            onChange={(e) => setFormData(prev => ({ ...prev, nextCheckupDate: e.target.value }))}
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-sm text-gray-600 mt-2">
            Optional: Schedule the next verification or follow-up assessment
          </p>
        </div>

        {/* Summary Preview */}
        {selectedStatus && (
          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Verification Summary</h3>
            <div className={`p-4 rounded-lg border-2 ${selectedStatus.color}`}>
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">{selectedStatus.icon}</span>
                <span className="font-semibold">{selectedStatus.label}</span>
              </div>
              {formData.notes && (
                <p className="text-sm mb-2">{formData.notes}</p>
              )}
              {formData.recommendedActions.length > 0 && (
                <div className="text-sm">
                  <strong>Recommendations:</strong> {formData.recommendedActions.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting || !formData.status || !formData.notes}
            className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting Verification...
              </div>
            ) : (
              '✅ Submit Verification'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
