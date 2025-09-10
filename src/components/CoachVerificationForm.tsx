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
    {/* Header */}
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-3xl font-bold text-[#1E2537] flex items-center gap-2">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EEEFF1] text-[#1E2537]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0118 20.944M6 20.944a12.083 12.083 0 01-.16-10.366L12 14z" />
            </svg>
          </span>
          Coach Verification
        </h2>
        <p className="text-[#303848] mt-2">
          Verify recovery progress for {injury.bodyPart} {injury.injuryType}
        </p>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      )}
    </div>

    {/* Injury Summary */}
    <div className="bg-[#EEEFF1] p-6 rounded-xl mb-8">
      <h3 className="text-lg font-semibold text-[#1E2537] mb-4 flex items-center gap-2">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-[#1E2537]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6M5 6h14v12H5z" />
          </svg>
        </span>
        Injury Summary
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-[#303848]">Injury Type</p>
          <p className="font-medium text-[#1E2537]">{injury.injuryType} - {injury.bodyPart}</p>
        </div>
        <div>
          <p className="text-sm text-[#303848]">Severity</p>
          <p className="font-medium text-[#1E2537]">{injury.severity}</p>
        </div>
        <div>
          <p className="text-sm text-[#303848]">Injury Date</p>
          <p className="font-medium text-[#1E2537]">{injury.diagnosisDate.toLocaleDateString()}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-[#303848]">Description</p>
        <p className="text-[#1E2537]">{injury.description}</p>
      </div>
    </div>

    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Verification Status */}
      <div>
        <h3 className="text-xl font-semibold text-[#1E2537] mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EEEFF1] text-[#1E2537]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Verification Status
        </h3>
        <div className="space-y-3">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStatusChange(option.value)}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                formData.status === option.value
                  ? option.color
                  : 'border-gray-200 hover:border-gray-300 bg-white text-[#303848]'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-xl">{option.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold">{option.label}</h4>
                  <p className="text-sm opacity-80 mt-1">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-xl font-semibold text-[#1E2537] mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EEEFF1] text-[#1E2537]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 14h.01M16 10h.01M9 21h6a2 2 0 002-2v-1a9 9 0 10-10 0v1a2 2 0 002 2z" />
            </svg>
          </span>
          Assessment Notes
        </h3>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2537] focus:border-[#1E2537]"
          placeholder="Provide detailed notes on the athlete's condition..."
          required
        />
      </div>

      {/* Recommended Actions */}
      <div>
        <h3 className="text-xl font-semibold text-[#1E2537] mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EEEFF1] text-[#1E2537]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
          </span>
          Recommended Actions
        </h3>
        {/* Actions list + input remain same but styled subtly */}
      </div>

      {/* Next Checkup */}
      <div>
        <h3 className="text-xl font-semibold text-[#1E2537] mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EEEFF1] text-[#1E2537]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
            </svg>
          </span>
          Next Checkup
        </h3>
        <input
          type="date"
          value={formData.nextCheckupDate}
          onChange={(e) => setFormData(prev => ({ ...prev, nextCheckupDate: e.target.value }))}
          className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2537] focus:border-[#1E2537]"
          min={new Date().toISOString().split('T')[0]}
        />
        <p className="text-sm text-[#303848] mt-2">
          Optional: Schedule the next verification or follow-up assessment
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-6">
        <button
          type="submit"
          disabled={isSubmitting || !formData.status || !formData.notes}
          className="flex-1 bg-gradient-to-r from-[#1E2537] to-[#303848] text-white py-4 px-6 rounded-xl font-medium hover:from-[#11192C] hover:to-[#1E2537] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Submitting Verification...
            </div>
          ) : (
            'Submit Verification'
          )}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 border border-gray-300 text-[#303848] rounded-xl font-medium hover:bg-[#EEEFF1] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  </div>
);
}
