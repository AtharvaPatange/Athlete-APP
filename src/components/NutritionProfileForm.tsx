import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  createNutritionProfile,
  updateNutritionProfile,
  type NutritionProfile,
  type DietaryPreference,
  type BudgetRange,
  type ActivityLevel,
  getDietaryPreferenceIcon,
  getBudgetRangeDescription
} from '@/services/nutritionService';

interface NutritionProfileFormProps {
  athleteId: string;
  existingProfile?: NutritionProfile | null;
  userProfile?: any;
  sport?: string;
  onProfileSaved: (profile: NutritionProfile) => void;
  onCancel?: () => void;
}

export default function NutritionProfileForm({
  athleteId,
  existingProfile,
  userProfile,
  sport,
  onProfileSaved,
  onCancel
}: NutritionProfileFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [formData, setFormData] = useState({
    dietaryPreference: (existingProfile?.dietaryPreference as DietaryPreference) || 'omnivore',
    allergies: existingProfile?.allergies || [],
    calorieTarget: existingProfile?.calorieTarget || '',
    budgetRange: (existingProfile?.budgetRange as BudgetRange) || 'moderate',
    activityLevel: (existingProfile?.activityLevel as ActivityLevel) || 'moderate',
    mealFrequency: existingProfile?.mealFrequency || 3,
    hydrationGoal: existingProfile?.hydrationGoal || 2500,
    supplementPreferences: existingProfile?.supplementPreferences || [],
    specialRequirements: existingProfile?.specialRequirements || '',
    
    // Personal info for calculations
    age: userProfile?.age || '',
    weight: userProfile?.weight || '',
    height: userProfile?.height || '',
    gender: userProfile?.gender || '',
    fitnessGoals: userProfile?.fitnessGoals || []
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dietaryOptions: { value: DietaryPreference; label: string; description: string }[] = [
    { value: 'omnivore', label: 'Omnivore', description: 'Includes all foods - meat, dairy, vegetables, grains' },
    { value: 'vegetarian', label: 'Vegetarian', description: 'No meat, but includes dairy and eggs' },
    { value: 'vegan', label: 'Vegan', description: 'Plant-based only - no animal products' },
    { value: 'pescatarian', label: 'Pescatarian', description: 'Vegetarian plus fish and seafood' },
    { value: 'keto', label: 'Ketogenic', description: 'High fat, very low carb diet' },
    { value: 'paleo', label: 'Paleo', description: 'Whole foods, no processed foods or grains' },
    { value: 'mediterranean', label: 'Mediterranean', description: 'Fish, olive oil, nuts, fruits, and vegetables' }
  ];

  const budgetOptions: { value: BudgetRange; label: string; description: string }[] = [
    { value: 'budget', label: 'Budget-Friendly', description: '₹3,500-5,600/week - Focus on affordable staples' },
    { value: 'moderate', label: 'Moderate', description: '₹5,600-8,400/week - Balanced options' },
    { value: 'premium', label: 'Premium', description: '₹8,400+/week - Organic, specialty foods' }
  ];

  const activityOptions: { value: ActivityLevel; label: string; description: string }[] = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { value: 'light', label: 'Light Activity', description: '1-3 days/week light exercise' },
    { value: 'moderate', label: 'Moderate Activity', description: '3-5 days/week moderate exercise' },
    { value: 'high', label: 'High Activity', description: '6-7 days/week intense exercise' },
    { value: 'extreme', label: 'Extreme Activity', description: 'Multiple daily sessions, competitive athlete' }
  ];

  const commonAllergies = [
    'Nuts', 'Shellfish', 'Fish', 'Eggs', 'Dairy/Lactose', 'Gluten/Wheat',
    'Soy', 'Sesame', 'Sulfites', 'MSG', 'Artificial Sweeteners'
  ];

  const supplementOptions = [
    'Protein Powder', 'Creatine', 'BCAAs', 'Pre-Workout', 'Post-Workout',
    'Multivitamin', 'Vitamin D', 'Omega-3', 'Probiotics', 'Magnesium'
  ];

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepNumber) {
      case 1:
        if (!formData.dietaryPreference) {
          newErrors.dietaryPreference = 'Please select a dietary preference';
        }
        break;
      case 2:
        if (!formData.budgetRange) {
          newErrors.budgetRange = 'Please select a budget range';
        }
        if (!formData.activityLevel) {
          newErrors.activityLevel = 'Please select your activity level';
        }
        break;
      case 3:
        if (formData.mealFrequency < 3 || formData.mealFrequency > 6) {
          newErrors.mealFrequency = 'Meal frequency should be between 3-6 meals per day';
        }
        if (formData.hydrationGoal < 1500 || formData.hydrationGoal > 5000) {
          newErrors.hydrationGoal = 'Hydration goal should be between 1500-5000ml';
        }
        break;
      case 4:
        // Personal info validation
        if (!formData.age || formData.age < 13 || formData.age > 100) {
          newErrors.age = 'Please enter a valid age (13-100)';
        }
        if (!formData.weight || formData.weight < 30 || formData.weight > 300) {
          newErrors.weight = 'Please enter a valid weight (30-300 kg)';
        }
        if (!formData.height || formData.height < 120 || formData.height > 220) {
          newErrors.height = 'Please enter a valid height (120-220 cm)';
        }
        if (!formData.gender) {
          newErrors.gender = 'Please select your gender';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setErrors({});
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, newAllergy.trim()]
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter(a => a !== allergy)
    });
  };

  const toggleSupplement = (supplement: string) => {
    const current = formData.supplementPreferences;
    if (current.includes(supplement)) {
      setFormData({
        ...formData,
        supplementPreferences: current.filter(s => s !== supplement)
      });
    } else {
      setFormData({
        ...formData,
        supplementPreferences: [...current, supplement]
      });
    }
  };

  const calculateEstimatedCalories = () => {
    const { age, weight, height, gender, activityLevel } = formData;
    
    if (!age || !weight || !height || !gender) return null;

    // Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) + 5;
    } else {
      bmr = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) - 161;
    }

    // Activity multipliers
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      high: 1.725,
      extreme: 1.9
    };

    const tdee = bmr * multipliers[activityLevel];
    return Math.round(tdee);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const estimatedCalories = calculateEstimatedCalories();
      
      const profileData: Omit<NutritionProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        athleteId,
        dietaryPreference: formData.dietaryPreference,
        allergies: formData.allergies,
        calorieTarget: formData.calorieTarget ? Number(formData.calorieTarget) : estimatedCalories || undefined,
        budgetRange: formData.budgetRange,
        activityLevel: formData.activityLevel,
        mealFrequency: formData.mealFrequency,
        hydrationGoal: formData.hydrationGoal,
        supplementPreferences: formData.supplementPreferences,
        specialRequirements: formData.specialRequirements,
        lastUpdated: new Date().toISOString(),
        isActive: true
      };

      let result;
      if (existingProfile && existingProfile.id) {
        result = await updateNutritionProfile(existingProfile.id, profileData);
      } else {
        result = await createNutritionProfile(profileData);
      }

      if (result.success && result.profile) {
        onProfileSaved(result.profile);
      } else {
        alert(result.error || 'Failed to save nutrition profile');
      }
    } catch (error) {
      console.error('Error saving nutrition profile:', error);
      alert('Failed to save nutrition profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">🍽️ Dietary Preferences</h3>
              <p className="text-gray-600">Choose your preferred eating style</p>
            </div>

            <div className="grid gap-4">
              {dietaryOptions.map(option => (
                <label
                  key={option.value}
                  className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.dietaryPreference === option.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="dietaryPreference"
                    value={option.value}
                    checked={formData.dietaryPreference === option.value}
                    onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value as DietaryPreference })}
                    className="sr-only"
                  />
                  <div className="flex items-center flex-1">
                    <span className="text-2xl mr-4">{getDietaryPreferenceIcon(option.value)}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                  {formData.dietaryPreference === option.value && (
                    <div className="text-green-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>

            {errors.dietaryPreference && (
              <p className="text-red-500 text-sm">{errors.dietaryPreference}</p>
            )}

            {/* Allergies Section */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Allergies & Food Restrictions</h4>
              
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Add an allergy or restriction..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-600 text-gray-900"
                    onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                  />
                  <button
                    type="button"
                    onClick={addAllergy}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Common allergies:</p>
                <div className="flex flex-wrap gap-2">
                  {commonAllergies.map(allergy => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => {
                        if (!formData.allergies.includes(allergy)) {
                          setFormData({
                            ...formData,
                            allergies: [...formData.allergies, allergy]
                          });
                        }
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      + {allergy}
                    </button>
                  ))}
                </div>
              </div>

              {formData.allergies.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Your allergies/restrictions:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.allergies.map(allergy => (
                      <span
                        key={allergy}
                        className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => removeAllergy(allergy)}
                          className="ml-2 hover:text-red-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">💰 Budget & Activity</h3>
              <p className="text-gray-600">Help us plan meals within your budget and activity level</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Weekly Food Budget</h4>
              <div className="grid gap-4">
                {budgetOptions.map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.budgetRange === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="budgetRange"
                      value={option.value}
                      checked={formData.budgetRange === option.value}
                      onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value as BudgetRange })}
                      className="sr-only"
                    />
                    <div className="flex items-center flex-1">
                      <span className="text-2xl mr-4">💰</span>
                      <div>
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </div>
                    {formData.budgetRange === option.value && (
                      <div className="text-blue-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {errors.budgetRange && (
                <p className="text-red-500 text-sm mt-2">{errors.budgetRange}</p>
              )}
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity Level</h4>
              <div className="grid gap-4">
                {activityOptions.map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.activityLevel === option.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="activityLevel"
                      value={option.value}
                      checked={formData.activityLevel === option.value}
                      onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })}
                      className="sr-only"
                    />
                    <div className="flex items-center flex-1">
                      <span className="text-2xl mr-4">🏃‍♂️</span>
                      <div>
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </div>
                    {formData.activityLevel === option.value && (
                      <div className="text-orange-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {errors.activityLevel && (
                <p className="text-red-500 text-sm mt-2">{errors.activityLevel}</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">🥘 Meal Preferences</h3>
              <p className="text-gray-600">Customize your eating schedule and nutrition goals</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Calorie Target (optional)
                </label>
                <input
                  type="number"
                  value={formData.calorieTarget}
                  onChange={(e) => setFormData({ ...formData, calorieTarget: e.target.value })}
                  placeholder="Leave blank for auto-calculation"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-600 text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll calculate based on your info if left blank
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meals per Day
                </label>
                <select
                  value={formData.mealFrequency}
                  onChange={(e) => setFormData({ ...formData, mealFrequency: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value={3} className="text-gray-900">3 meals (Breakfast, Lunch, Dinner)</option>
                  <option value={4} className="text-gray-900">4 meals (+ 1 snack)</option>
                  <option value={5} className="text-gray-900">5 meals (+ 2 snacks)</option>
                  <option value={6} className="text-gray-900">6 meals (+ pre/post workout)</option>
                </select>
                {errors.mealFrequency && (
                  <p className="text-red-500 text-sm mt-1">{errors.mealFrequency}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Hydration Goal (ml)
                </label>
                <input
                  type="number"
                  value={formData.hydrationGoal}
                  onChange={(e) => setFormData({ ...formData, hydrationGoal: Number(e.target.value) })}
                  placeholder="Enter daily water intake goal (ml)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-600 text-gray-900"
                />
                {errors.hydrationGoal && (
                  <p className="text-red-500 text-sm mt-1">{errors.hydrationGoal}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requirements
                </label>
                <textarea
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                  placeholder="Any specific dietary needs, medical requirements, or preferences..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-600 text-gray-900"
                />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">💊 Supplement Preferences</h4>
              <p className="text-sm text-gray-600 mb-4">Select supplements you currently use or are interested in</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {supplementOptions.map(supplement => (
                  <label
                    key={supplement}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.supplementPreferences.includes(supplement)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.supplementPreferences.includes(supplement)}
                      onChange={() => toggleSupplement(supplement)}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <span className="text-lg mr-2">💊</span>
                      <span className="text-sm font-medium">{supplement}</span>
                    </div>
                    {formData.supplementPreferences.includes(supplement) && (
                      <div className="ml-auto text-purple-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        const estimatedCalories = calculateEstimatedCalories();
        
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">📊 Personal Information</h3>
              <p className="text-gray-600">Help us calculate your personalized nutrition needs</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  placeholder="Enter your age"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-600 text-gray-900"
                />
                {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-500">Select gender</option>
                  <option value="male" className="text-gray-900">Male</option>
                  <option value="female" className="text-gray-900">Female</option>
                  <option value="other" className="text-gray-900">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  placeholder="Enter weight in kg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-600 text-gray-900"
                />
                {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  placeholder="Enter height in cm"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-600 text-gray-900"
                />
                {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
              </div>
            </div>

            {estimatedCalories && (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <h4 className="text-lg font-semibold text-green-900 mb-2">🎯 Estimated Daily Calorie Needs</h4>
                <div className="text-3xl font-bold text-green-600 mb-2">{estimatedCalories} calories</div>
                <p className="text-sm text-green-800">
                  Based on your age, gender, weight, height, and activity level. 
                  {formData.calorieTarget && formData.calorieTarget !== estimatedCalories.toString() && (
                    <span className="block mt-1">
                      Your target: {formData.calorieTarget} calories (override active)
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-4">📋 Profile Summary</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-900">Diet Type:</div>
                  <div className="text-blue-800">{getDietaryPreferenceIcon(formData.dietaryPreference)} {formData.dietaryPreference}</div>
                </div>
                <div>
                  <div className="font-medium text-blue-900">Budget:</div>
                  <div className="text-blue-800">{getBudgetRangeDescription(formData.budgetRange)}</div>
                </div>
                <div>
                  <div className="font-medium text-blue-900">Activity Level:</div>
                  <div className="text-blue-800 capitalize">{formData.activityLevel}</div>
                </div>
                <div>
                  <div className="font-medium text-blue-900">Meals per Day:</div>
                  <div className="text-blue-800">{formData.mealFrequency} meals</div>
                </div>
                {formData.allergies.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="font-medium text-blue-900">Allergies:</div>
                    <div className="text-blue-800">{formData.allergies.join(', ')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {existingProfile ? '✏️ Edit Nutrition Profile' : '🌱 Create Nutrition Profile'}
          </h2>
          <div className="text-sm text-gray-600">
            Step {step} of {totalSteps}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[500px]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <div>
          {step > 1 && (
            <button
              onClick={handlePrevious}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          
          {step < totalSteps ? (
  <button
    onClick={handleNext}
    className="px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-lg 
               hover:from-slate-800 hover:to-black transition-all"
    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
  >
    Next →
  </button>
) : (
  <button
    onClick={handleSubmit}
    disabled={loading}
    className="px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-lg 
               hover:from-slate-800 hover:to-black transition-all disabled:opacity-50"
    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
  >
    {loading ? (
      <div className="flex items-center">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
        {existingProfile ? 'Updating...' : 'Creating...'}
      </div>
    ) : (
      existingProfile ? 'Update Profile' : 'Create Profile'
    )}
  </button>
)}

        </div>
      </div>
    </div>
  );
}
