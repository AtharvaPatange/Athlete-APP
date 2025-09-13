import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addAchievement, checkAndAwardAchievements } from '@/services/statsService';
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateAthleteQuestProgress } from '@/services/questProgressService';

interface FormData {
  sport: string;
  exerciseType: string;
  duration: string;
  distance: string;
  intensity: string;
  date: string;
  notes: string;
  heartRateAvg: string;
  heartRateMax: string;
  caloriesBurned: string;
}

interface FormErrors {
  sport?: string;
  exerciseType?: string;
  duration?: string;
  intensity?: string;
}

const TrainingSessionForm = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    sport: '',
    exerciseType: '',
    duration: '',
    distance: '',
    intensity: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    heartRateAvg: '',
    heartRateMax: '',
    caloriesBurned: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const exerciseTypes = [
    { id: 'running', label: 'Running', icon: '🏃‍♂️' },
    { id: 'cycling', label: 'Cycling', icon: '🚴‍♂️' },
    { id: 'swimming', label: 'Swimming', icon: '🏊‍♂️' },
    { id: 'weightlifting', label: 'Weight Lifting', icon: '🏋️‍♂️' },
    { id: 'cardio', label: 'Cardio', icon: '❤️' },
    { id: 'flexibility', label: 'Flexibility', icon: '🧘‍♀️' },
    { id: 'sports_practice', label: 'Sports Practice', icon: '⚽' },
    { id: 'other', label: 'Other', icon: '🏃‍♀️' }
  ];

  const intensityLevels = [
    { id: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200 placeholder:text-black' },
    { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 placeholder:text-black' },
    { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200 placeholder:text-black' },
    { id: 'peak', label: 'Peak', color: 'bg-red-100 text-red-800 border-red-200 placeholder:text-black' }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const validateStep = (step: number) => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.sport.trim()) {
        newErrors.sport = 'Sport is required';
      }
      if (!formData.exerciseType) {
        newErrors.exerciseType = 'Activity type is required';
      }
    }

    if (step === 2) {
      if (!formData.duration || Number(formData.duration) <= 0) {
        newErrors.duration = 'Duration must be greater than 0';
      }
      if (!formData.intensity) {
        newErrors.intensity = 'Intensity level is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!user || !validateStep(currentStep)) return;

    try {
      // Save training session to Firestore with exact field structure
      const trainingSession = {
        athleteId: user.uid,
        sport: formData.sport,
        exerciseType: formData.exerciseType,
        duration: parseInt(formData.duration) || 0,
        distance: parseFloat(formData.distance) || 0,
        intensity: formData.intensity,
        date: new Date(formData.date),
        notes: formData.notes,
        heartRateAvg: parseInt(formData.heartRateAvg) || 0,
        heartRateMax: parseInt(formData.heartRateMax) || 0,
        caloriesBurned: parseInt(formData.caloriesBurned) || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('💾 Saving training session to training_sessions:', trainingSession);

      // Add to training_sessions collection (correct collection name)
      const docRef = await addDoc(collection(db, 'training_sessions'), trainingSession);
      
      console.log('✅ Training session saved with ID:', docRef.id);
      
      // Verify the session was saved correctly
      const savedDoc = await getDoc(docRef);
      if (savedDoc.exists()) {
        console.log('✅ Verification: Session saved correctly:', savedDoc.data());
      } else {
        console.error('❌ Verification: Session not found after saving!');
      }

      // Update user's training sessions count
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const currentCount = userDoc.data()?.trainingSessionsCount || 0;
      
      await updateDoc(userRef, {
        trainingSessionsCount: currentCount + 1,
        lastTrainingSession: new Date()
      });

      // Award training-based achievements
      await awardTrainingAchievements(currentCount + 1, formData);

      // Update quest progress after logging training session
      try {
        console.log('🎯 Updating quest progress after training session...');
        
        // Wait a bit for the training session to be fully written to Firebase
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const questProgressResult = await updateAthleteQuestProgress(user.uid);
        console.log('🎯 Quest progress result:', questProgressResult);
        
        if (questProgressResult.success && questProgressResult.updates.length > 0) {
          console.log('✅ Quest progress updated:', questProgressResult.updates);
          const completedQuests = questProgressResult.updates.filter(u => u.isCompleted);
          if (completedQuests.length > 0) {
            alert(`🏆 Congratulations! You completed ${completedQuests.length} quest(s)!\n\nCheck the Quests section to see your achievements!`);
          } else {
            const updatedQuests = questProgressResult.updates.length;
            alert(`🎯 Quest progress updated! ${updatedQuests} quest(s) have new progress.\n\nCheck the Quests section to see your updated progress!`);
          }
        } else {
          console.log('ℹ️ No quest progress updates found');
        }
      } catch (questError) {
        console.error('Error updating quest progress:', questError);
        // Don't fail the training session if quest update fails
      }

      console.log('Training session data:', formData);
      alert('Training session logged successfully!');
      
      // Reset form
      setFormData({
        sport: '',
        exerciseType: '',
        duration: '',
        distance: '',
        intensity: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        heartRateAvg: '',
        heartRateMax: '',
        caloriesBurned: ''
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error logging training session:', error);
      alert('Error saving training session. Please try again.');
    }
  };

  const awardTrainingAchievements = async (sessionCount: number, trainingData: FormData) => {
    if (!user) return;

    try {
      // First training session
      if (sessionCount === 1) {
        await addAchievement(user.uid, {
          title: 'First Steps',
          description: 'Logged your first training session',
          type: 'training',
          date: new Date(),
          points: 10
        });
      }

      // Training milestones
      const milestones = [5, 10, 25, 50, 100];
      if (milestones.includes(sessionCount)) {
        await addAchievement(user.uid, {
          title: `${sessionCount} Sessions Strong`,
          description: `Completed ${sessionCount} training sessions`,
          type: 'milestone',
          date: new Date(),
          points: sessionCount * 2
        });
      }

      // Duration-based achievements
      const duration = parseInt(trainingData.duration) || 0;
      if (duration >= 60) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const achievements = userDoc.data()?.achievements || [];
        
        if (!achievements.includes('Endurance Warrior')) {
          await addAchievement(user.uid, {
            title: 'Endurance Warrior',
            description: 'Completed a training session longer than 60 minutes',
            type: 'performance',
            date: new Date(),
            points: 15
          });
        }
      }

      // Intensity-based achievements
      if (trainingData.intensity === 'high') {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const achievements = userDoc.data()?.achievements || [];
        
        if (!achievements.includes('High Intensity Hero')) {
          await addAchievement(user.uid, {
            title: 'High Intensity Hero',
            description: 'Completed a high-intensity training session',
            type: 'performance',
            date: new Date(),
            points: 12
          });
        }
      }

      // Check for additional achievements
      await checkAndAwardAchievements(user.uid);
    } catch (error) {
      console.error('Error awarding achievements:', error);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What did you train today?</h2>
        <p className="text-gray-600">Choose your activity type</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Activity Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {exerciseTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                handleInputChange('exerciseType', type.id);
                handleInputChange('sport', type.label);
              }}
              className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                formData.exerciseType === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="text-sm font-medium text-gray-800">{type.label}</div>
            </button>
          ))}
        </div>
        
        <div className="mt-4">
          <input
            type="text"
            placeholder="Or type a custom activity/sport here..."
            value={formData.sport}
            onChange={(e) => {
              handleInputChange('sport', e.target.value);
              handleInputChange('exerciseType', 'custom');
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-900 text-gray-900 ${
              errors.sport ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        </div>
        
        {errors.exerciseType && <p className="mt-2 text-sm text-red-600 ">{errors.exerciseType}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Details</h2>
        <p className="text-gray-600">Tell us about your workout intensity and duration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
          <input
            type="number"
            placeholder="60"
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-900 ${
              errors.duration ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
          <input
            type="number"
            step="0.1"
            placeholder="5.0"
            value={formData.distance}
            onChange={(e) => handleInputChange('distance', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Calories Burned</label>
          <input
            type="number"
            placeholder="300"
            value={formData.caloriesBurned}
            onChange={(e) => handleInputChange('caloriesBurned', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Intensity Level</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {intensityLevels.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => handleInputChange('intensity', level.id)}
              className={`p-3 border-2 rounded-lg text-center transition-all hover:shadow-md font-medium ${
                formData.intensity === level.id
                  ? `${level.color} border-current`
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-800 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{level.label}</div>
            </button>
          ))}
        </div>
        {errors.intensity && <p className="mt-2 text-sm text-red-600">{errors.intensity}</p>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Performance Metrics</h2>
        <p className="text-gray-600">Optional: Add heart rate and other performance data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Average Heart Rate (bpm)</label>
          <input
            type="number"
            placeholder="140"
            value={formData.heartRateAvg}
            onChange={(e) => handleInputChange('heartRateAvg', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Heart Rate (bpm)</label>
          <input
            type="number"
            placeholder="180"
            value={formData.heartRateMax}
            onChange={(e) => handleInputChange('heartRateMax', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Session Notes</label>
        <textarea
          rows={4}
          placeholder="How did you feel? Any observations about your performance?"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-900"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-gray-600">Please review your training session details</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Session Info</h4>
            <p><span className="text-gray-600">Sport:</span> <span className="font-medium">{formData.sport}</span></p>
            <p><span className="text-gray-600">Activity:</span> <span className="font-medium">{exerciseTypes.find(t => t.id === formData.exerciseType)?.label}</span></p>
            <p><span className="text-gray-600">Date:</span> <span className="font-medium">{formatDate(formData.date)}</span></p>
            <p><span className="text-gray-600">Intensity:</span> <span className="font-medium capitalize">{formData.intensity}</span></p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
            <p><span className="text-gray-600">Duration:</span> <span className="font-medium">{formData.duration} min</span></p>
            {formData.distance && <p><span className="text-gray-600">Distance:</span> <span className="font-medium">{formData.distance} km</span></p>}
            {formData.caloriesBurned && <p><span className="text-gray-600">Calories:</span> <span className="font-medium">{formData.caloriesBurned} kcal</span></p>}
            {formData.heartRateAvg && <p><span className="text-gray-600">Avg HR:</span> <span className="font-medium">{formData.heartRateAvg} bpm</span></p>}
          </div>
        </div>
        {formData.notes && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
            <p className="text-gray-700 bg-white p-3 rounded border">{formData.notes}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Form Container */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Log Training Session</h1>
              <span className="text-sm text-gray-500">Step {currentStep} of 4</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
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
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNextStep}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Log Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingSessionForm;