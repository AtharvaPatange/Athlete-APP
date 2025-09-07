import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  reportInjury, 
  InjuryType, 
  InjurySeverity, 
  InjuryStatus,
  type Injury 
} from '@/services/injuryService';

interface InjuryReportFormProps {
  onSubmitSuccess?: (injuryId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<Injury>;
}

const INJURY_TYPES: { value: InjuryType; label: string; icon: string }[] = [
  { value: 'muscle', label: 'Muscle Strain/Tear', icon: '💪' },
  { value: 'bone', label: 'Bone Fracture/Break', icon: '🦴' },
  { value: 'joint', label: 'Joint Injury', icon: '🔗' },
  { value: 'ligament', label: 'Ligament Injury', icon: '🏃‍♂️' },
  { value: 'tendon', label: 'Tendon Injury', icon: '🎯' },
  { value: 'other', label: 'Other', icon: '❓' }
];

const SEVERITY_LEVELS: { value: InjurySeverity; label: string; description: string; color: string }[] = [
  { value: 'minor', label: 'Minor', description: 'Mild discomfort, can continue activity', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'moderate', label: 'Moderate', description: 'Noticeable pain, activity modification needed', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'severe', label: 'Severe', description: 'Significant pain, activity cessation required', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'critical', label: 'Critical', description: 'Intense pain, immediate medical attention', color: 'text-red-600 bg-red-50 border-red-200' }
];

const BODY_PARTS = [
  'Head/Neck', 'Shoulder', 'Arm', 'Elbow', 'Wrist', 'Hand/Fingers',
  'Chest', 'Back', 'Abdomen', 'Hip', 'Thigh', 'Knee', 
  'Calf', 'Ankle', 'Foot/Toes', 'Other'
];

const COMMON_SYMPTOMS = [
  'Pain', 'Swelling', 'Bruising', 'Stiffness', 'Weakness',
  'Numbness', 'Tingling', 'Instability', 'Limited range of motion',
  'Clicking/Popping sounds', 'Inflammation', 'Tenderness'
];

const COMMON_CAUSES = [
  'Training overload', 'Poor form/technique', 'Inadequate warm-up',
  'Equipment failure', 'Environmental conditions', 'Contact with opponent',
  'Fall/slip', 'Sudden movement', 'Overuse/repetitive stress',
  'Previous injury site', 'Fatigue', 'Other'
];

export default function InjuryReportForm({ onSubmitSuccess, onCancel, initialData }: InjuryReportFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    injuryType: initialData?.injuryType || '' as InjuryType,
    bodyPart: initialData?.bodyPart || '',
    description: initialData?.description || '',
    severity: initialData?.severity || '' as InjurySeverity,
    status: initialData?.status || 'active' as InjuryStatus,
    diagnosisDate: initialData?.diagnosisDate ? 
      initialData.diagnosisDate.toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0],
    expectedRecoveryDate: initialData?.expectedRecoveryDate ?
      initialData.expectedRecoveryDate.toISOString().split('T')[0] : '',
    diagnosis: initialData?.diagnosis || '',
    symptoms: initialData?.symptoms || [],
    causedBy: initialData?.causedBy || '',
    treatmentPlan: initialData?.treatmentPlan || '',
    restrictions: initialData?.restrictions || []
  });

  const [customSymptom, setCustomSymptom] = useState('');
  const [customRestriction, setCustomRestriction] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !formData.symptoms.includes(customSymptom.trim())) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, customSymptom.trim()]
      }));
      setCustomSymptom('');
    }
  };

  const addCustomRestriction = () => {
    if (customRestriction.trim() && !formData.restrictions.includes(customRestriction.trim())) {
      setFormData(prev => ({
        ...prev,
        restrictions: [...prev.restrictions, customRestriction.trim()]
      }));
      setCustomRestriction('');
    }
  };

  const removeRestriction = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      restrictions: prev.restrictions.filter(r => r !== restriction)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      const injuryData = {
        athleteId: user.uid,
        injuryType: formData.injuryType,
        bodyPart: formData.bodyPart,
        description: formData.description,
        severity: formData.severity,
        status: formData.status,
        diagnosisDate: new Date(formData.diagnosisDate),
        expectedRecoveryDate: formData.expectedRecoveryDate ? new Date(formData.expectedRecoveryDate) : undefined,
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms,
        causedBy: formData.causedBy || undefined,
        treatmentPlan: formData.treatmentPlan || undefined,
        restrictions: formData.restrictions
      };

      const result = await reportInjury(injuryData);
      
      if (result.success && result.id) {
        onSubmitSuccess?.(result.id);
      } else {
        alert(`Error reporting injury: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting injury report:', error);
      alert('Failed to submit injury report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🏥 Report Injury</h2>
          <p className="text-gray-600 mt-2">Document your injury details for proper tracking and recovery</p>
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Injury Information */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 Basic Information</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Injury Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Injury Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INJURY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('injuryType', type.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      formData.injuryType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Part */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body Part Affected <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bodyPart}
                onChange={(e) => handleInputChange('bodyPart', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select body part</option>
                {BODY_PARTS.map((part) => (
                  <option key={part} value={part}>{part}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Severity */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Injury Severity <span className="text-red-500">*</span>
            </label>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {SEVERITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleInputChange('severity', level.value)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.severity === level.value
                      ? `border-opacity-100 ${level.color.replace('text-', 'border-').replace('-600', '-500')}`
                      : 'border-gray-200 hover:border-gray-300'
                    } ${formData.severity === level.value ? level.color : 'text-gray-700'}`}
                >
                  <div className="font-medium">{level.label}</div>
                  <div className="text-xs mt-1 opacity-80">{level.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📅 Timeline</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Injury <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.diagnosisDate}
                onChange={(e) => handleInputChange('diagnosisDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Recovery Date
              </label>
              <input
                type="date"
                value={formData.expectedRecoveryDate}
                onChange={(e) => handleInputChange('expectedRecoveryDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📝 Detailed Information</h3>
          
          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Injury Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe how the injury occurred and what you felt..."
                required
              />
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Diagnosis
              </label>
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Medical professional's diagnosis (if available)"
              />
            </div>

            {/* Caused By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caused By
              </label>
              <select
                value={formData.causedBy}
                onChange={(e) => handleInputChange('causedBy', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select cause</option>
                {COMMON_CAUSES.map((cause) => (
                  <option key={cause} value={cause}>{cause}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🩺 Symptoms</h3>
          
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleSymptomToggle(symptom)}
                  className={`px-3 py-2 rounded-full text-sm transition-all ${
                    formData.symptoms.includes(symptom)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-transparent'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              placeholder="Add custom symptom"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSymptom())}
            />
            <button
              type="button"
              onClick={addCustomSymptom}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Treatment & Restrictions */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">⚕️ Treatment & Restrictions</h3>
          
          <div className="space-y-6">
            {/* Treatment Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treatment Plan
              </label>
              <textarea
                value={formData.treatmentPlan}
                onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the treatment plan or medical recommendations..."
              />
            </div>

            {/* Activity Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Restrictions
              </label>
              
              {formData.restrictions.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {formData.restrictions.map((restriction, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full"
                    >
                      {restriction}
                      <button
                        type="button"
                        onClick={() => removeRestriction(restriction)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRestriction}
                  onChange={(e) => setCustomRestriction(e.target.value)}
                  placeholder="Add activity restriction (e.g., 'No running', 'Avoid overhead movements')"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRestriction())}
                />
                <button
                  type="button"
                  onClick={addCustomRestriction}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting || !formData.injuryType || !formData.bodyPart || !formData.severity || !formData.description}
            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 px-6 rounded-xl font-medium hover:from-red-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </div>
            ) : (
              '🏥 Report Injury'
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
