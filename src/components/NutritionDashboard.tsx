import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getNutritionProfile,
  getCurrentWeekMealPlan,
  generateWeeklyMealPlan,
  type NutritionProfile,
  type WeeklyMealPlan,
  type DietaryPreference,
  type BudgetRange,
  type ActivityLevel,
  getDietaryPreferenceIcon,
  getBudgetRangeDescription
} from '@/services/nutritionService';
import NutritionProfileForm from './NutritionProfileForm';

// Helper functions
const getDayName = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const getMealIcon = (mealType: string) => {
  const icons = {
    breakfast: '🌅',
    lunch: '🌞',
    dinner: '🌙',
    snack_morning: '☕',
    snack_evening: '🥨',
    pre_workout: '💪',
    post_workout: '🥤'
  };
  return icons[mealType as keyof typeof icons] || '🍽️';
};

interface NutritionDashboardProps {
  athleteId: string;
  sport?: string;
  userProfile?: any;
}

export default function NutritionDashboard({ athleteId, sport, userProfile }: NutritionDashboardProps) {
  const { user } = useAuth();
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfile | null>(null);
  const [currentMealPlan, setCurrentMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'plan' | 'calendar' | 'shopping'>('profile');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  useEffect(() => {
    loadNutritionData();
  }, [athleteId]);

  const loadNutritionData = async () => {
    setLoading(true);
    try {
      const [profileResult, planResult] = await Promise.all([
        getNutritionProfile(athleteId),
        getCurrentWeekMealPlan(athleteId)
      ]);

      if (profileResult.success) {
        setNutritionProfile(profileResult.profile);
        if (!profileResult.profile) {
          setShowProfileForm(true);
          setActiveTab('profile');
        }
      }

      if (planResult.success) {
        setCurrentMealPlan(planResult.plan);
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMealPlan = async () => {
    if (!nutritionProfile) {
      alert('Please complete your nutrition profile first');
      setActiveTab('profile');
      return;
    }

    setIsGenerating(true);
    try {
      const newPlan = await generateWeeklyMealPlan(athleteId);
      if (newPlan) {
        setCurrentMealPlan(newPlan);
        setActiveTab('calendar');
      } else {
        alert('Failed to generate meal plan. Please try again.');
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getWeekDateRange = () => {
    const today = new Date();
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return {
      start: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  };

  const weekRange = getWeekDateRange();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading nutrition dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🥗 Nutrition & Diet Planning</h2>
          <p className="text-gray-600 mt-2">Personalized meal plans for optimal performance</p>
          <p className="text-sm text-gray-500">Week of {weekRange.start} - {weekRange.end}</p>
        </div>
        <div className="flex space-x-3">
          {nutritionProfile && (
            <button
              onClick={handleGenerateMealPlan}
              disabled={isGenerating}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating AI Plan...
                </div>
              ) : (
                '🤖 Generate New Plan'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {nutritionProfile && currentMealPlan && (
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Daily Calories</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(currentMealPlan.weeklyGoals.targetCalories / 7)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Weekly Cost</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{currentMealPlan.totalWeeklyCost || 'N/A'}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Diet Type</p>
                <p className="text-lg font-bold text-purple-600">
                  {getDietaryPreferenceIcon(nutritionProfile.dietaryPreference)} {nutritionProfile.dietaryPreference}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <span className="text-2xl">🌱</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Daily Protein</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(currentMealPlan.weeklyGoals.targetProtein / 7)}g
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <span className="text-2xl">💪</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-2">
        <div className="flex space-x-1">
          {[
            { id: 'profile', label: 'Profile', icon: '👤' },
            { id: 'plan', label: 'Current Plan', icon: '📋' },
            { id: 'calendar', label: 'Meal Calendar', icon: '📅' },
            { id: 'shopping', label: 'Shopping List', icon: '🛒' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2 text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'profile' && (
          <NutritionProfileTab
            profile={nutritionProfile}
            athleteId={athleteId}
            userProfile={userProfile}
            sport={sport}
            onProfileUpdated={loadNutritionData}
            showProfileForm={showProfileForm}
            setShowProfileForm={setShowProfileForm}
          />
        )}

        {activeTab === 'plan' && (
          <CurrentPlanTab
            mealPlan={currentMealPlan}
            onGenerateNew={handleGenerateMealPlan}
            isGenerating={isGenerating}
          />
        )}

        {activeTab === 'calendar' && (
          <MealCalendarTab
            mealPlan={currentMealPlan}
            onDayClick={(date: Date) => console.log('Day clicked:', date)}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListTab
            mealPlan={currentMealPlan}
          />
        )}
      </div>
    </div>
  );
}

// Sub-components for each tab
function NutritionProfileTab({ profile, athleteId, userProfile, sport, onProfileUpdated, showProfileForm, setShowProfileForm }: any) {
  const handleProfileSaved = (savedProfile: NutritionProfile) => {
    setShowProfileForm(false);
    onProfileUpdated();
  };

  const handleEditProfile = () => {
    setShowProfileForm(true);
  };

  if (showProfileForm) {
    return (
      <NutritionProfileForm
        athleteId={athleteId}
        existingProfile={profile}
        userProfile={userProfile}
        sport={sport}
        onProfileSaved={handleProfileSaved}
        onCancel={() => setShowProfileForm(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">👤 Nutrition Profile</h3>
      {profile ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Dietary Preferences</h4>
              <p className="text-gray-700">{getDietaryPreferenceIcon(profile.dietaryPreference)} {profile.dietaryPreference}</p>
              <p className="text-sm text-gray-600 mt-1">{getBudgetRangeDescription(profile.budgetRange)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Daily Goals</h4>
              <p className="text-gray-700">Target: {profile.calorieTarget || 'Auto-calculated'} calories</p>
              <p className="text-sm text-gray-600 mt-1">Activity: {profile.activityLevel}</p>
            </div>
          </div>
          
          {profile.allergies.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ Allergies & Restrictions</h4>
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((allergy: string) => (
                  <span key={allergy} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={handleEditProfile}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ✏️ Edit Profile
          </button>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Nutrition Profile Found</h3>
          <p className="text-gray-600 mb-6">Create your nutrition profile to get personalized meal plans</p>
          <button 
            onClick={() => setShowProfileForm(true)}
            className="bg-green-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            🌱 Create Nutrition Profile
          </button>
        </div>
      )}
    </div>
  );
}

function CurrentPlanTab({ mealPlan, onGenerateNew, isGenerating }: any) {
  if (!mealPlan) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="text-8xl mb-6">📋</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">No Meal Plan Available</h3>
        <p className="text-gray-600 mb-8">Generate your first AI-powered meal plan</p>
        <button
          onClick={onGenerateNew}
          disabled={isGenerating}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : '🤖 Generate Meal Plan'}
        </button>
      </div>
    );
  }

  const weekTotal = mealPlan.weeklyGoals;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">📋 Current Meal Plan</h3>
        <button
          onClick={onGenerateNew}
          disabled={isGenerating}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          🔄 Regenerate
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{weekTotal.targetCalories}</div>
          <div className="text-sm text-gray-600">Weekly Calories</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{Math.round(weekTotal.targetProtein)}g</div>
          <div className="text-sm text-gray-600">Weekly Protein</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{Math.round(weekTotal.targetCarbs)}g</div>
          <div className="text-sm text-gray-600">Weekly Carbs</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{Math.round(weekTotal.targetFats)}g</div>
          <div className="text-sm text-gray-600">Weekly Fats</div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">📊 Daily Breakdown</h4>
        {mealPlan.dailyPlans.slice(0, 3).map((day: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900">
                {getDayName(new Date(day.date))} - {new Date(day.date).toLocaleDateString()}
              </h5>
              <div className="text-sm text-gray-600">
                {day.totalCalories} cal | {Math.round(day.totalProtein)}g protein
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {Object.entries(day.meals).slice(0, 3).map(([mealType, meals]: [string, any]) => (
                <div key={mealType} className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-700 mb-1">
                    {getMealIcon(mealType)} {mealType.replace('_', ' ')}
                  </div>
                  {meals.slice(0, 2).map((meal: any, idx: number) => (
                    <div key={idx} className="text-xs text-gray-600">
                      {meal.name} ({meal.calories} cal)
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="text-center">
          <p className="text-gray-600">View complete calendar for all 7 days</p>
        </div>
      </div>
    </div>
  );
}

function MealCalendarTab({ mealPlan }: any) {
  if (!mealPlan) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="text-8xl mb-6">📅</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">No Meal Calendar Available</h3>
        <p className="text-gray-600">Generate a meal plan to view the weekly calendar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">📅 Weekly Meal Calendar</h3>
      
      <div className="grid gap-6">
        {mealPlan.dailyPlans.map((day: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-gray-900">
                {getDayName(new Date(day.date))}
              </h4>
              <div className="text-sm text-gray-600">
                {new Date(day.date).toLocaleDateString()} | {day.totalCalories} cal
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(day.meals).map(([mealType, meals]: [string, any]) => (
                <div key={mealType} className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">
                    {getMealIcon(mealType)} {mealType.replace('_', ' ').toUpperCase()}
                  </h5>
                  <div className="space-y-2">
                    {meals.map((meal: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <div className="font-medium text-gray-800">{meal.name}</div>
                        <div className="text-xs text-gray-600">
                          {meal.quantity} | {meal.calories} cal | {meal.protein}g protein
                        </div>
                        {meal.preparationTime && (
                          <div className="text-xs text-blue-600">
                            ⏱️ {meal.preparationTime} min prep
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {day.specialNotes && day.specialNotes.length > 0 && (
              <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                <h6 className="font-medium text-blue-900 mb-1">💡 Today's Tips</h6>
                <ul className="text-sm text-blue-800 list-disc list-inside">
                  {day.specialNotes.map((note: string, idx: number) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShoppingListTab({ mealPlan }: any) {
  if (!mealPlan || !mealPlan.shoppingList) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="text-8xl mb-6">🛒</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">No Shopping List Available</h3>
        <p className="text-gray-600">Generate a meal plan to get your shopping list</p>
      </div>
    );
  }

  const groupedItems = mealPlan.shoppingList.reduce((acc: any, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const getCategoryIcon = (category: string) => {
    const icons = {
      proteins: '🥩',
      dairy: '🥛',
      grains: '🌾',
      vegetables: '🥬',
      fruits: '🍎',
      fats: '🥑',
      spices: '🧂',
      general: '🛒'
    };
    return icons[category as keyof typeof icons] || '🛒';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">🛒 Weekly Shopping List</h3>
        <div className="text-lg font-semibold text-green-600">
          Total: ₹{mealPlan.totalWeeklyCost || 'Calculating...'}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedItems).map(([category, items]: [string, any]) => (
          <div key={category} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2 text-xl">{getCategoryIcon(category)}</span>
              {category.toUpperCase()}
            </h4>
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.item}</div>
                    <div className="text-sm text-gray-600">{item.quantity}</div>
                  </div>
                  {item.estimatedCost && (
                    <div className="text-sm font-medium text-green-600">
                      ₹{item.estimatedCost}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-green-50 p-6 rounded-xl">
        <h4 className="font-semibold text-green-900 mb-3">💡 Shopping Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Buy proteins in bulk and freeze portions</li>
          <li>• Choose seasonal vegetables for better prices</li>
          <li>• Prep grains and proteins on Sunday for the week</li>
          <li>• Check store sales and adjust quantities accordingly</li>
        </ul>
      </div>
    </div>
  );
}
