import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addAchievement, checkAndAwardAchievements } from '@/services/statsService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createTrainingSession } from '@/services/performanceService';

interface FormData {
  category: string; // 'cardio' | 'strength' | 'flexibility' | 'coordination'
  exerciseType: string;
  duration: string;
  intensity: string;
  date: string;
  notes: string;
  heartRateAvg: string;
  heartRateMax: string;
  caloriesBurned: string;
  
  // Cardio specific fields
  distance?: string;
  speed?: string;
  
  // Strength specific fields
  sets?: string;
  reps?: string;
  weight?: string;
  restTime?: string;
  
  // Flexibility specific fields
  flexibilityType?: string;
  targetAreas?: string[];
  
  // Coordination specific fields
  skillLevel?: string;
  coordinationType?: string;
  accuracy?: string;
}

interface FormErrors {
  category?: string;
  exerciseType?: string;
  duration?: string;
  intensity?: string;
}

interface TrainingLogFormProps {
  athleteId?: string;
  onSessionAdded?: () => void;
}

const TrainingSessionForm = ({ athleteId, onSessionAdded }: TrainingLogFormProps) => {
  const { user } = useAuth();
  
  // Use provided athleteId or fallback to current user's uid
  const currentAthleteId = athleteId || user?.uid || '';
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    category: '',
    exerciseType: '',
    duration: '',
    intensity: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    heartRateAvg: '',
    heartRateMax: '',
    caloriesBurned: '',
    
    // Optional category-specific fields
    distance: '',
    speed: '',
    sets: '',
    reps: '',
    weight: '',
    restTime: '',
    flexibilityType: '',
    targetAreas: [],
    skillLevel: '',
    coordinationType: '',
    accuracy: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const exerciseCategories = [
    { 
      id: 'cardio', 
      label: 'Cardio', 
      icon: '❤️',
      description: 'Running, Cycling, etc.',
      exercises: ['Running', 'Cycling', 'Jogging', 'Treadmill']
    },
    { 
      id: 'strength', 
      label: 'Strength', 
      icon: '💪',
      description: 'Bodyweight & resistance exercises',
      exercises: ['Push-ups', 'Squats', 'Pull-ups', 'Deadlifts', 'Bench Press', 'Planks', 'Lunges', 'Burpees']
    },
    { 
      id: 'flexibility', 
      label: 'Flexibility & Balance', 
      icon: '🧘‍♀️',
      description: 'Stretching, yoga, mobility drills',
      exercises: ['Yoga', 'Stretching', 'Balance Training', 'Mobility Work']
    },
    { 
      id: 'coordination', 
      label: 'Coordination', 
      icon: '🎯',
      description: 'Throwing, catching, agility drills',
      exercises: ['Agility Drills', 'Ball Handling', 'Throwing Practice', 'Catching Drills', 'Ladder Drills', 'Cone Drills', 'Reaction Training']
    }
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
      if (!formData.category.trim()) {
        newErrors.category = 'Exercise category is required';
      }
      if (!formData.exerciseType) {
        newErrors.exerciseType = 'Specific exercise is required';
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

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!user || !currentAthleteId || !validateStep(currentStep)) return;

    try {
      // Prepare training session data for the service
      const trainingSession = {
        athleteId: currentAthleteId,
        sport: formData.category, // Using category as sport for backward compatibility
        exerciseType: formData.exerciseType,
        category: formData.category,
        duration: parseInt(formData.duration) || 0,
        distance: parseFloat(formData.distance || '0') || 0,
        intensity: formData.intensity as 'low' | 'medium' | 'high' | 'peak',
        date: new Date(formData.date),
        notes: formData.notes,
        heartRateAvg: parseInt(formData.heartRateAvg) || 0,
        heartRateMax: parseInt(formData.heartRateMax) || 0,
        caloriesBurned: parseInt(formData.caloriesBurned) || 0,
        
        // Category-specific fields
        speed: parseFloat(formData.speed || '0') || 0,
        sets: parseInt(formData.sets || '0') || 0,
        reps: parseInt(formData.reps || '0') || 0,
        weight: parseFloat(formData.weight || '0') || 0,
        restTime: parseInt(formData.restTime || '0') || 0,
        flexibilityType: formData.flexibilityType || '',
        targetAreas: formData.targetAreas || [],
        skillLevel: formData.skillLevel || '',
        coordinationType: formData.coordinationType || '',
        accuracy: parseFloat(formData.accuracy || '0') || 0
      };

      console.log('💾 Saving training session:', trainingSession);

      // Use the proper service which handles quest progress automatically
      const result = await createTrainingSession(trainingSession);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save training session');
      }

      console.log('✅ Training session saved with ID:', result.id);

      // Update user's training sessions count
      const userRef = doc(db, 'users', currentAthleteId);
      const userDoc = await getDoc(userRef);
      const currentCount = userDoc.data()?.trainingSessionsCount || 0;
      
      await updateDoc(userRef, {
        trainingSessionsCount: currentCount + 1,
        lastTrainingSession: new Date()
      });

      // Award training-based achievements
      await awardTrainingAchievements(currentCount + 1, formData);

      console.log('Training session data:', formData);
      alert('🏆 Training session logged successfully!\n\n🎯 Quest progress has been automatically updated!\n\nCheck the Gamification section to see your quest progress.');
      
      // Call the callback if provided
      if (onSessionAdded) {
        onSessionAdded();
      }
      
      // Reset form
      setFormData({
        category: '',
        exerciseType: '',
        duration: '',
        intensity: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        heartRateAvg: '',
        heartRateMax: '',
        caloriesBurned: '',
        
        // Optional category-specific fields
        distance: '',
        speed: '',
        sets: '',
        reps: '',
        weight: '',
        restTime: '',
        flexibilityType: '',
        targetAreas: [],
        skillLevel: '',
        coordinationType: '',
        accuracy: ''
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
        await addAchievement(currentAthleteId, {
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
        await addAchievement(currentAthleteId, {
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
        const userRef = doc(db, 'users', currentAthleteId);
        const userDoc = await getDoc(userRef);
        const achievements = userDoc.data()?.achievements || [];
        
        if (!achievements.includes('Endurance Warrior')) {
          await addAchievement(currentAthleteId, {
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
        const userRef = doc(db, 'users', currentAthleteId);
        const userDoc = await getDoc(userRef);
        const achievements = userDoc.data()?.achievements || [];
        
        if (!achievements.includes('High Intensity Hero')) {
          await addAchievement(currentAthleteId, {
            title: 'High Intensity Hero',
            description: 'Completed a high-intensity training session',
            type: 'performance',
            date: new Date(),
            points: 12
          });
        }
      }

      // Check for additional achievements
      await checkAndAwardAchievements(currentAthleteId);
    } catch (error) {
      console.error('Error awarding achievements:', error);
    }
  };

  const renderStep1 = () => {
    const selectedCategory = exerciseCategories.find(cat => cat.id === formData.category);
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of training did you do?</h2>
          <p className="text-gray-600">Choose your exercise category</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Exercise Category</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {exerciseCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  handleInputChange('category', category.id);
                  handleInputChange('exerciseType', ''); // Reset exercise type when category changes
                }}
                className={`p-6 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                  formData.category === category.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{category.icon}</div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-gray-900 mb-1">{category.label}</div>
                    <div className="text-sm text-gray-600">{category.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category}</p>}
        </div>

        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Specific {selectedCategory.label} Exercise
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {selectedCategory.exercises.map((exercise) => (
                <button
                  key={exercise}
                  type="button"
                  onClick={() => handleInputChange('exerciseType', exercise)}
                  className={`p-3 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                    formData.exerciseType === exercise
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">{exercise}</div>
                </button>
              ))}
            </div>
            
            <div className="mt-4">
              <input
                type="text"
                placeholder="Or type a custom exercise here..."
                value={formData.exerciseType}
                onChange={(e) => handleInputChange('exerciseType', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900 ${
                  errors.exerciseType ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            
            {errors.exerciseType && <p className="mt-2 text-sm text-red-600">{errors.exerciseType}</p>}
          </div>
        )}
      </div>
    );
  };

  const renderStep2 = () => {
    const renderCategorySpecificFields = () => {
      switch (formData.category) {
        case 'cardio':
          return (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distance (m)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="500"
                  value={formData.distance}
                  onChange={(e) => handleInputChange('distance', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Average Speed (km/h)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="10.0"
                  value={formData.speed}
                  onChange={(e) => handleInputChange('speed', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
                />
              </div>
            </>
          );

        case 'strength':
          return (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sets</label>
                <input
                  type="number"
                  placeholder="3"
                  value={formData.sets}
                  onChange={(e) => handleInputChange('sets', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reps per Set</label>
                <input
                  type="number"
                  placeholder="12"
                  value={formData.reps}
                  onChange={(e) => handleInputChange('reps', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="20"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rest Time (seconds)</label>
                <input
                  type="number"
                  placeholder="60"
                  value={formData.restTime}
                  onChange={(e) => handleInputChange('restTime', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
                />
              </div>
            </>
          );

        case 'flexibility':
          return (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flexibility Type</label>
                <select
                  value={formData.flexibilityType}
                  onChange={(e) => handleInputChange('flexibilityType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select type...</option>
                  <option value="static">Static Stretching</option>
                  <option value="dynamic">Dynamic Stretching</option>
                  <option value="yoga">Yoga Flow</option>
                  <option value="pilates">Pilates</option>
                  <option value="mobility">Mobility Work</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Areas</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Upper Body', 'Lower Body', 'Core', 'Full Body', 'Back', 'Legs', 'Arms', 'Hips'].map((area) => (
                    <label key={area} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.targetAreas?.includes(area) || false}
                        onChange={(e) => {
                          const currentAreas = formData.targetAreas || [];
                          if (e.target.checked) {
                            handleInputChange('targetAreas', [...currentAreas, area]);
                          } else {
                            handleInputChange('targetAreas', currentAreas.filter(a => a !== area));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          );

        case 'coordination':
          return (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coordination Type</label>
                <select
                  value={formData.coordinationType}
                  onChange={(e) => handleInputChange('coordinationType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select type...</option>
                  <option value="agility">Agility Drills</option>
                  <option value="ball-handling">Ball Handling</option>
                  <option value="throwing">Throwing Practice</option>
                  <option value="catching">Catching Drills</option>
                  <option value="reaction">Reaction Training</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
                <select
                  value={formData.skillLevel}
                  onChange={(e) => handleInputChange('skillLevel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select level...</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accuracy (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="75"
                  value={formData.accuracy}
                  onChange={(e) => handleInputChange('accuracy', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
                />
              </div>
            </>
          );

        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Details</h2>
          <p className="text-gray-600">Tell us about your workout intensity and duration</p>
        </div>

        {/* Common Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <input
              type="number"
              placeholder="60"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900 ${
                errors.duration ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Calories Burned</label>
            <input
              type="number"
              placeholder="300"
              value={formData.caloriesBurned}
              onChange={(e) => handleInputChange('caloriesBurned', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
            />
          </div>

          {/* Category-specific fields */}
          {renderCategorySpecificFields()}
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
  };

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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Heart Rate (bpm)</label>
          <input
            type="number"
            placeholder="180"
            value={formData.heartRateMax}
            onChange={(e) => handleInputChange('heartRateMax', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-gray-900"
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
            <p><span className="text-gray-600">Category:</span> <span className="font-medium text-gray-900 capitalize">{formData.category}</span></p>
            <p><span className="text-gray-600">Exercise:</span> <span className="font-medium text-gray-900">{formData.exerciseType}</span></p>
            <p><span className="text-gray-600">Date:</span> <span className="font-medium text-gray-900">{formatDate(formData.date)}</span></p>
            <p><span className="text-gray-600">Intensity:</span> <span className="font-medium capitalize text-gray-900">{formData.intensity}</span></p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
            <p><span className="text-gray-600">Duration:</span> <span className="font-medium text-gray-900">{formData.duration} min</span></p>
            {formData.distance && <p><span className="text-gray-600">Distance:</span> <span className="font-medium text-gray-900">{formData.distance} m</span></p>}
            {formData.caloriesBurned && <p><span className="text-gray-600">Calories:</span> <span className="font-medium text-gray-900">{formData.caloriesBurned} kcal</span></p>}
            {formData.heartRateAvg && <p><span className="text-gray-600">Avg HR:</span> <span className="font-medium text-gray-900">{formData.heartRateAvg} bpm</span></p>}
          </div>
        </div>
        {formData.notes && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
            <p className="text-gray-900 bg-white p-3 rounded border">{formData.notes}</p>
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