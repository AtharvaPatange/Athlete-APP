import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getNutritionProfile,
  getCurrentWeekMealPlan,
  generateWeeklyMealPlan,
  getAllMealPlansForAthlete,
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

  // Reload data when the component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadNutritionData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [athleteId]);

  const loadNutritionData = async () => {
    setLoading(true);
    try {
      // Add debug call to see all meal plans
      console.log('Loading nutrition data for athlete:', athleteId);
      
      const [profileResult, planResult] = await Promise.all([
        getNutritionProfile(athleteId),
        getCurrentWeekMealPlan(athleteId)
      ]);

      console.log('Profile result:', profileResult);
      console.log('Plan result:', planResult);

      if (profileResult.success) {
        setNutritionProfile(profileResult.profile);
        if (!profileResult.profile) {
          setShowProfileForm(true);
          setActiveTab('profile');
        }
      }

      if (planResult.success && planResult.plan) {
        console.log('✅ Found existing meal plan:', planResult.plan);
        console.log('Daily plans count:', planResult.plan.dailyPlans.length);
        if (planResult.plan.dailyPlans.length > 0) {
          console.log('First day meals:', planResult.plan.dailyPlans[0].meals);
        }
        setCurrentMealPlan(planResult.plan);
        // If we have both profile and plan, show the calendar
        if (profileResult.success && profileResult.profile) {
          setActiveTab('calendar');
        }
      } else {
        console.log('❌ No meal plan found for current week');
        setCurrentMealPlan(null);
        // If we have profile but no plan, show the plan generation tab
        if (profileResult.success && profileResult.profile) {
          setActiveTab('plan');
        }
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

    console.log('Starting meal plan generation for athlete:', athleteId);
    setIsGenerating(true);
    try {
      console.log('Calling generateWeeklyMealPlan...');
      const newPlan = await generateWeeklyMealPlan(athleteId);
      console.log('Generated plan result:', newPlan);
      
      if (newPlan) {
        console.log('✅ Successfully generated new plan:', newPlan);
        setCurrentMealPlan(newPlan);
        setActiveTab('calendar');
        
        // Debug: Check all plans for this athlete
        setTimeout(async () => {
          console.log('🔍 Debugging: Checking all meal plans for athlete...');
          const allPlans = await getAllMealPlansForAthlete(athleteId);
          console.log('All plans result:', allPlans);
          
          console.log('🔄 Refreshing current week plan from Firestore...');
          const planResult = await getCurrentWeekMealPlan(athleteId);
          console.log('Refresh result:', planResult);
          
          if (planResult.success && planResult.plan) {
            console.log('✅ Successfully refreshed plan from Firestore');
            setCurrentMealPlan(planResult.plan);
          } else {
            console.log('❌ Failed to refresh plan - plan might not be saved properly');
          }
        }, 2000);
      } else {
        console.error('generateWeeklyMealPlan returned null/undefined');
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
      <h2 className="text-3xl font-bold text-[#1E2537]">Nutrition & Diet Planning</h2>
      <p className="text-[#303848] mt-2">Personalized meal plans for optimal performance</p>
      <p className="text-sm text-[#6b7280]">Week of {weekRange.start} - {weekRange.end}</p>
    </div>
    <div className="flex space-x-3">
      {nutritionProfile && (
        <button
          onClick={handleGenerateMealPlan}
          disabled={isGenerating}
          className="bg-[#1E2537] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#11192C] transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Generating AI Plan...
            </div>
          ) : (
            'Generate New Plan'
          )}
        </button>
      )}
    </div>
  </div>

  {/* Quick Stats */}
  {nutritionProfile && currentMealPlan && (
    <div className="grid md:grid-cols-4 gap-6">
      <div className="bg-[#F4F5F6] p-6 rounded-xl shadow-md border border-[#EEEFF1]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#303848] text-sm font-medium">Daily Calories</p>
            <p className="text-2xl font-bold text-[#1E2537]">
              {Math.round(currentMealPlan.weeklyGoals.targetCalories / 7)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#F4F5F6] p-6 rounded-xl shadow-md border border-[#EEEFF1]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#303848] text-sm font-medium">Weekly Cost</p>
            <p className="text-2xl font-bold text-[#1E2537]">
              ₹{currentMealPlan.totalWeeklyCost || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#F4F5F6] p-6 rounded-xl shadow-md border border-[#EEEFF1]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#303848] text-sm font-medium">Diet Type</p>
            <p className="text-lg font-bold text-[#1E2537]">
              {nutritionProfile.dietaryPreference}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#F4F5F6] p-6 rounded-xl shadow-md border border-[#EEEFF1]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#303848] text-sm font-medium">Daily Protein</p>
            <p className="text-2xl font-bold text-[#1E2537]">
              {Math.round(currentMealPlan.weeklyGoals.targetProtein / 7)}g
            </p>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Tab Navigation */}
  <div className="bg-white rounded-xl shadow-md p-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    <div className="flex space-x-1">
      {[
        { id: 'profile', label: 'Profile' },
        { id: 'plan', label: 'Current Plan' },
        { id: 'calendar', label: 'Meal Calendar' },
        { id: 'shopping', label: 'Shopping List' }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-[#1E2537] text-white shadow-md'
              : 'text-[#303848] hover:text-[#11192C] hover:bg-[#EEEFF1]'
          }`}
        >
          <span>{tab.label}</span>
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
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-[#EEEFF1] text-[#1E2537]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A11.953 11.953 0 0112 15c2.485 0 4.774.755 6.879 2.051M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1E2537] mb-2">No Nutrition Profile Found</h3>
              <p className="text-[#303848] mb-6">Create your nutrition profile to get personalized meal plans</p>
              <button 
                onClick={() => setShowProfileForm(true)}
                className="px-8 py-4 rounded-xl font-medium text-white 
                          bg-gradient-to-r from-[#1E2537] to-[#303848] 
                          hover:from-[#11192C] hover:to-[#1E2537] 
                          transition-all cursor-pointer"
              >
                Create Nutrition Profile
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
  <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full bg-[#EEEFF1] text-[#1E2537]">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6M5 6h14v12H5z" />
    </svg>
  </div>
  <h3 className="text-2xl font-bold text-[#1E2537] mb-4">No Meal Plan Available</h3>
  <p className="text-[#303848] mb-8">Generate your first AI-powered meal plan</p>
  <button
    onClick={onGenerateNew}
    disabled={isGenerating}
    className="px-8 py-4 rounded-xl font-medium text-white 
               bg-gradient-to-r from-[#1E2537] to-[#303848] 
               hover:from-[#11192C] hover:to-[#1E2537] 
               transition-all disabled:opacity-50 cursor-pointer"
  >
    {isGenerating ? 'Generating...' : 'Generate Meal Plan'}
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
          Regenerate
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

      {/* Meal Plan Overview */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
        <h4 className="font-bold text-green-800 mb-2">� Plan Overview</h4>
        <div className="text-sm text-green-700 space-y-1">
          <div><strong>Generated:</strong> {new Date(mealPlan.createdAt).toLocaleDateString()}</div>
          <div><strong>Weekly plan with:</strong> {mealPlan.dailyPlans?.length || 0} days</div>
          <div><strong>Estimated cost:</strong> ₹{mealPlan.totalWeeklyCost || 'Calculating...'}</div>
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
              {Object.entries(day.meals).slice(0, 3).map(([mealType, meals]: [string, any]) => {
                return (
                  <div key={mealType} className="bg-gray-50 p-2 rounded">
                    <div className="font-medium text-gray-700 mb-1">
                      {getMealIcon(mealType)} {mealType.replace('_', ' ')}
                    </div>
                    {Array.isArray(meals) && meals.length > 0 ? meals.slice(0, 1).map((meal: any, idx: number) => {
                      // Handle nested structure with items array
                      if (meal.items && Array.isArray(meal.items)) {
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="text-xs font-medium text-gray-600">
                              {meal.name} {meal.time && `(${meal.time})`}
                            </div>
                            {meal.items.slice(0, 2).map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="text-xs text-gray-600">
                                {item.name} ({item.calories || 0} cal)
                              </div>
                            ))}
                            {meal.items.length > 2 && (
                              <div className="text-xs text-blue-600">
                                +{meal.items.length - 2} more items
                              </div>
                            )}
                            <div className="text-xs text-green-600 font-medium">
                              Total: {meal.totalCalories || 0} cal
                            </div>
                          </div>
                        );
                      } else {
                        // Fallback for simple meal structure
                        const mealName = meal.name || meal.foodItem || 'Unknown Meal';
                        const mealCalories = meal.totalCalories || meal.calories || meal.cal || 0;
                        return (
                          <div key={idx} className="text-xs text-gray-600">
                            {mealName} ({mealCalories} cal)
                          </div>
                        );
                      }
                    }) : (
                      <div className="text-xs text-gray-500 italic">
                        No meals planned
                      </div>
                    )}
                  </div>
                );
              })}
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
              {Object.entries(day.meals || {}).map(([mealType, meals]: [string, any]) => {
                // Ensure meals is an array
                const mealArray = Array.isArray(meals) ? meals : (meals ? [meals] : []);
                
                return (
                  <div key={mealType} className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">
                      {getMealIcon(mealType)} {mealType.replace('_', ' ').toUpperCase()}
                    </h5>
                    <div className="space-y-2">
                      {mealArray.length > 0 ? (
                        mealArray.map((meal: any, idx: number) => {
                          // Handle nested structure - each meal object may have items array
                          if (meal.items && Array.isArray(meal.items)) {
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="font-medium text-gray-800 text-xs mb-1">
                                  {meal.name} {meal.time && `(${meal.time})`}
                                </div>
                                {meal.items.map((item: any, itemIdx: number) => (
                                  <div key={itemIdx} className="text-sm border-l-2 border-blue-200 pl-2">
                                    <div className="font-medium text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-600">
                                      {item.quantity} | {item.calories || 0} cal | {item.protein || 0}g protein
                                    </div>
                                  </div>
                                ))}
                                <div className="text-xs text-green-600 font-medium">
                                  Total: {meal.totalCalories || 0} cal | {meal.totalProtein || 0}g protein
                                </div>
                              </div>
                            );
                          } else {
                            // Fallback for simple meal structure
                            return (
                              <div key={idx} className="text-sm">
                                <div className="font-medium text-gray-800">{meal.name || 'Unnamed Meal'}</div>
                                <div className="text-xs text-gray-600">
                                  {meal.quantity || 'N/A'} | {meal.totalCalories || meal.calories || 0} cal | {meal.totalProtein || meal.protein || 0}g protein
                                </div>
                                {meal.preparationTime && (
                                  <div className="text-xs text-blue-600">
                                    ⏱️ {meal.preparationTime} min prep
                                  </div>
                                )}
                              </div>
                            );
                          }
                        })
                      ) : (
                        <div className="text-sm text-gray-500 italic">No meals planned</div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Show message if no meals at all */}
              {(!day.meals || Object.keys(day.meals).length === 0) && (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🍽️</div>
                  <p>No meals planned for this day</p>
                </div>
              )}
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
