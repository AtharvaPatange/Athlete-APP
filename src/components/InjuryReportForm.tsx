import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  reportInjury, 
  InjuryType, 
  InjurySeverity, 
  InjuryStatus,
  type Injury 
} from '@/services/injuryService';
import { 
  Activity, User, Calendar, AlertCircle, FileText, Heart,
  Target, Clock, Plus, X, ArrowRight, ArrowLeft, CheckCircle
} from 'lucide-react';

interface InjuryReportFormProps {
  onSubmitSuccess?: (injuryId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<Injury>;
}

const COLORS = {
  oxfordBlue: "#030C26",
  marianBlue: "#2D488B",
  seasalt: "#F9FAFB",
  powderBlue: "#9FAFDO",
  platinum: "#E0E4E9",
};

const INJURY_TYPES: { value: InjuryType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'muscle', label: 'Muscle Strain/Tear', icon: <Activity size={20} />, description: 'Muscle tissue damage' },
  { value: 'bone', label: 'Bone Fracture/Break', icon: <Target size={20} />, description: 'Bone structure damage' },
  { value: 'joint', label: 'Joint Injury', icon: <User size={20} />, description: 'Joint movement issues' },
  { value: 'ligament', label: 'Ligament Injury', icon: <Heart size={20} />, description: 'Ligament damage' },
  { value: 'tendon', label: 'Tendon Injury', icon: <ArrowRight size={20} />, description: 'Tendon inflammation' },
  { value: 'other', label: 'Other', icon: <AlertCircle size={20} />, description: 'Other injury type' }
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
  const [currentStep, setCurrentStep] = useState(1);
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
    symptoms: initialData?.symptoms || [],
    causedBy: initialData?.causedBy || '',
    restrictions: initialData?.restrictions || [],
    medicalImages: [] as string[]
  });

  const [customSymptom, setCustomSymptom] = useState('');
  const [customRestriction, setCustomRestriction] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.injuryType && formData.bodyPart;
      case 2:
        return formData.severity && formData.diagnosisDate;
      case 3:
        return formData.description.trim().length > 0;
      default:
        return true;
    }
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

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'sachin');
    formData.append('cloud_name', 'drxliiejo');

    const response = await fetch('https://api.cloudinary.com/v1_1/drxliiejo/image/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file));
      const imageUrls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...imageUrls]);
      setFormData(prev => ({
        ...prev,
        medicalImages: [...prev.medicalImages, ...imageUrls]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(url => url !== imageUrl));
    setFormData(prev => ({
      ...prev,
      medicalImages: prev.medicalImages.filter(url => url !== imageUrl)
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
        diagnosis: '', // Will be generated by the system
        symptoms: formData.symptoms,
        causedBy: formData.causedBy || undefined,
        treatmentPlan: '', // Will be generated by the system
        restrictions: formData.restrictions,
        medicalImages: formData.medicalImages
      };

      const result = await reportInjury(injuryData);
      
      if (result.success && result.id) {
        // Show different message based on verification needs
        if (result.needsVerification) {
          alert('Injury report submitted successfully! Since you have previous injuries, this report has been sent to your coach for verification.');
        }
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

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of injury occurred?</h2>
        <p className="text-gray-600">Select the injury type and affected body part</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Injury Type</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {INJURY_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleInputChange('injuryType', type.value)}
              className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md cursor-pointer ${
                formData.injuryType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  formData.injuryType === type.value 
                    ? 'bg-blue-200 text-blue-700' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {type.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{type.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Body Part Affected</label>
        <select
          value={formData.bodyPart}
          onChange={(e) => handleInputChange('bodyPart', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600 cursor-pointer"
        >
          <option value="" className="text-gray-600">Select body part</option>
          {BODY_PARTS.map((part) => (
            <option key={part} value={part}>{part}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">How severe is the injury?</h2>
        <p className="text-gray-600">Rate the severity and set the timeline</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Injury Severity</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {SEVERITY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => handleInputChange('severity', level.value)}
              className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md cursor-pointer ${
                formData.severity === level.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium text-gray-900">{level.label}</div>
              <div className="text-sm text-gray-600 mt-1">{level.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Injury</label>
          <input
            type="date"
            value={formData.diagnosisDate}
            onChange={(e) => handleInputChange('diagnosisDate', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Expected Recovery Date</label>
          <input
            type="date"
            value={formData.expectedRecoveryDate}
            onChange={(e) => handleInputChange('expectedRecoveryDate', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us what happened</h2>
        <p className="text-gray-600">Describe the injury and its cause</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Injury Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
          placeholder="Describe how the injury occurred and what you felt..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Caused By</label>
        <select
          value={formData.causedBy}
          onChange={(e) => handleInputChange('causedBy', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
        >
          <option value="" className="text-gray-600">Select cause</option>
          {COMMON_CAUSES.map((cause) => (
            <option key={cause} value={cause}>{cause}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What symptoms are you experiencing?</h2>
        <p className="text-gray-600">Select all symptoms that apply</p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {COMMON_SYMPTOMS.map((symptom) => (
            <button
              key={symptom}
              type="button"
              onClick={() => handleSymptomToggle(symptom)}
              className={`px-4 py-2 rounded-full text-sm border transition-all cursor-pointer ${
                formData.symptoms.includes(symptom)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100'
              }`}
            >
              {symptom}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customSymptom}
            onChange={(e) => setCustomSymptom(e.target.value)}
            placeholder="Add custom symptom"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSymptom())}
          />
          <button
            type="button"
            onClick={addCustomSymptom}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg transition-colors hover:bg-gray-800 cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Restrictions & Documentation</h2>
        <p className="text-gray-600">Add activity restrictions and upload medical images</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Activity Restrictions</label>
        
        {formData.restrictions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {formData.restrictions.map((restriction, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-blue-50 text-blue-700"
              >
                {restriction}
                <button
                  type="button"
                  onClick={() => removeRestriction(restriction)}
                  className="ml-2 text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  <X size={14} />
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
            placeholder="Add activity restriction"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRestriction())}
          />
          <button
            type="button"
            onClick={addCustomRestriction}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg transition-colors hover:bg-gray-800 cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical Images (Optional)
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Upload images of X-rays, MRI scans, physical examination photos, or other relevant medical documentation
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <input
              type="file"
              id="injury-images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="injury-images"
              className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                isUploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Choose Images'}
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Supports: JPG, PNG, GIF (Max 10MB per image)
            </p>
          </div>
        </div>

        {/* Display uploaded images */}
        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Images:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Injury documentation ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(imageUrl)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Summary */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="text-gray-600">Type:</span> <span className="font-medium text-gray-900">{INJURY_TYPES.find(t => t.value === formData.injuryType)?.label}</span></p>
            <p><span className="text-gray-600">Body Part:</span> <span className="font-medium text-gray-900">{formData.bodyPart}</span></p>
            <p><span className="text-gray-600">Severity:</span> <span className="font-medium text-gray-900 capitalize">{formData.severity}</span></p>
          </div>
          <div>
            <p><span className="text-gray-600">Date:</span> <span className="font-medium text-gray-900">{new Date(formData.diagnosisDate).toLocaleDateString()}</span></p>
            <p><span className="text-gray-600">Symptoms:</span> <span className="font-medium text-gray-900">{formData.symptoms.length} selected</span></p>
            {formData.expectedRecoveryDate && (
              <p><span className="text-gray-600">Recovery:</span> <span className="font-medium text-gray-900">{new Date(formData.expectedRecoveryDate).toLocaleDateString()}</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Report Injury</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Step {currentStep} of 5</span>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderCurrentStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNextStep}
                disabled={!validateStep(currentStep)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                  validateStep(currentStep)
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next Step
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !validateStep(currentStep)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Submit Report
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}