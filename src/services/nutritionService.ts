import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAthleteInjuries } from './injuryService';
import { getTrainingSessions, calculateWeeklyStats } from './performanceService';

// Nutrition Types and Interfaces
export type DietaryPreference = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'mediterranean';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'extreme';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack_morning' | 'snack_evening' | 'pre_workout' | 'post_workout';
export type BudgetRange = 'budget' | 'moderate' | 'premium';

export interface NutritionProfile {
  id?: string;
  athleteId: string;
  dietaryPreference: DietaryPreference;
  allergies: string[];
  calorieTarget?: number;
  budgetRange: BudgetRange;
  activityLevel: ActivityLevel;
  mealFrequency: number;
  hydrationGoal: number;
  supplementPreferences: string[];
  specialRequirements: string;
  weight?: number;
  height?: number;
  age?: number;
  goals?: string[]; // weight_loss, muscle_gain, endurance, recovery, etc.
  medicalConditions?: string[];
  supplementsAllowed?: boolean;
  mealsPerDay?: number;
  createdAt?: Date;
  updatedAt?: Date;
  lastUpdated: string;
  isActive: boolean;
}

export interface MealItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  cost?: number;
  preparationTime?: number;
  ingredients?: string[];
  instructions?: string[];
}

export interface DailyMealPlan {
  id?: string;
  athleteId: string;
  date: Date;
  meals: {
    [key in MealType]?: MealItem[];
  };
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalCost?: number;
  waterIntake?: number;
  supplementRecommendations?: string[];
  specialNotes?: string[];
  aiGenerated: boolean;
  createdAt: Date;
}

export interface WeeklyMealPlan {
  id?: string;
  athleteId: string;
  weekStartDate: Date;
  dailyPlans: DailyMealPlan[];
  weeklyGoals: {
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFats: number;
  };
  shoppingList?: {
    item: string;
    quantity: string;
    estimatedCost?: number;
    category: string;
  }[];
  totalWeeklyCost?: number;
  adherenceScore?: number;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionLog {
  id?: string;
  athleteId: string;
  date: Date;
  mealType: MealType;
  foodItems: {
    name: string;
    quantity: string;
    calories: number;
  }[];
  totalCalories: number;
  waterIntake?: number;
  notes?: string;
  adherenceToPlanned: boolean;
  createdAt: Date;
}

const NUTRITION_PROFILES_COLLECTION = 'nutrition_profiles';
const DAILY_MEAL_PLANS_COLLECTION = 'daily_meal_plans';
const WEEKLY_MEAL_PLANS_COLLECTION = 'weekly_meal_plans';
const NUTRITION_LOGS_COLLECTION = 'nutrition_logs';

// Nutrition Profile CRUD Operations
export const createNutritionProfile = async (profileData: Omit<NutritionProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, NUTRITION_PROFILES_COLLECTION), {
      ...profileData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Fetch the created profile to return it
    const createdDoc = await getDoc(docRef);
    if (!createdDoc.exists()) {
      return { profile: null, success: false, error: 'Failed to create profile' };
    }
    
    const data = createdDoc.data();
    const profile: NutritionProfile = {
      id: createdDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as NutritionProfile;
    
    return { profile, success: true, error: null };
  } catch (error: any) {
    return { profile: null, success: false, error: error.message };
  }
};

export const getNutritionProfile = async (athleteId: string) => {
  try {
    const q = query(
      collection(db, NUTRITION_PROFILES_COLLECTION),
      where('athleteId', '==', athleteId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { profile: null, success: true, error: null };
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const profile: NutritionProfile = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as NutritionProfile;
    
    return { profile, success: true, error: null };
  } catch (error: any) {
    return { profile: null, success: false, error: error.message };
  }
};

export const updateNutritionProfile = async (profileId: string, updates: Partial<NutritionProfile>) => {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(doc(db, NUTRITION_PROFILES_COLLECTION, profileId), updateData);
    
    // Fetch the updated profile to return it
    const updatedDoc = await getDoc(doc(db, NUTRITION_PROFILES_COLLECTION, profileId));
    if (!updatedDoc.exists()) {
      return { profile: null, success: false, error: 'Profile not found after update' };
    }
    
    const data = updatedDoc.data();
    const profile: NutritionProfile = {
      id: updatedDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as NutritionProfile;
    
    return { profile, success: true, error: null };
  } catch (error: any) {
    return { profile: null, success: false, error: error.message };
  }
};

// Debug function to check all meal plans for an athlete
export const getAllMealPlansForAthlete = async (athleteId: string) => {
  try {
    const q = query(
      collection(db, WEEKLY_MEAL_PLANS_COLLECTION),
      where('athleteId', '==', athleteId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      weekStartDate: doc.data().weekStartDate.toDate(),
      createdAt: doc.data().createdAt.toDate()
    }));
    
    console.log(`Found ${plans.length} total meal plans for athlete ${athleteId}:`, plans);
    return { plans, success: true, error: null };
  } catch (error: any) {
    console.error('Error getting all meal plans:', error);
    return { plans: [], success: false, error: error.message };
  }
};

// Weekly Meal Plan Operations
export const saveWeeklyMealPlan = async (planData: Omit<WeeklyMealPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    console.log('Saving meal plan data:', JSON.stringify(planData, null, 2));
    
    // Validate required fields
    if (!planData.athleteId) {
      throw new Error('Missing athleteId');
    }
    if (!planData.weekStartDate) {
      throw new Error('Missing weekStartDate');
    }
    if (!planData.dailyPlans || planData.dailyPlans.length === 0) {
      throw new Error('Missing dailyPlans');
    }

    const docRef = await addDoc(collection(db, WEEKLY_MEAL_PLANS_COLLECTION), {
      ...planData,
      weekStartDate: Timestamp.fromDate(planData.weekStartDate),
      dailyPlans: planData.dailyPlans.map(plan => ({
        ...plan,
        date: Timestamp.fromDate(plan.date),
        createdAt: Timestamp.fromDate(plan.createdAt || new Date())
      })),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log('Successfully saved meal plan with ID:', docRef.id);
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    console.error('Error saving meal plan:', error);
    return { id: null, success: false, error: error.message };
  }
};

export const getWeeklyMealPlans = async (athleteId: string, limit_count: number = 10) => {
  try {
    const q = query(
      collection(db, WEEKLY_MEAL_PLANS_COLLECTION),
      where('athleteId', '==', athleteId),
      orderBy('weekStartDate', 'desc'),
      limit(limit_count)
    );
    
    const snapshot = await getDocs(q);
    const plans: WeeklyMealPlan[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      plans.push({
        id: doc.id,
        ...data,
        weekStartDate: data.weekStartDate.toDate(),
        dailyPlans: data.dailyPlans.map((plan: any) => ({
          ...plan,
          date: plan.date.toDate(),
          createdAt: plan.createdAt.toDate()
        })),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as WeeklyMealPlan);
    });
    
    return { plans, success: true, error: null };
  } catch (error: any) {
    return { plans: [], success: false, error: error.message };
  }
};

export const getCurrentWeekMealPlan = async (athleteId: string) => {
  try {
    // Calculate the exact week start date (same logic as in generateWeeklyMealPlan)
    const weekStart = getWeekStartDate();
    
    console.log('Looking for meal plan with weekStartDate:', weekStart);
    
    // First try to find the exact week start date
    const exactQuery = query(
      collection(db, WEEKLY_MEAL_PLANS_COLLECTION),
      where('athleteId', '==', athleteId),
      where('weekStartDate', '==', Timestamp.fromDate(weekStart)),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    let snapshot = await getDocs(exactQuery);
    
    // If no exact match, try a range query for any plan in this week
    if (snapshot.empty) {
      console.log('No exact match found, trying range query...');
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const rangeQuery = query(
        collection(db, WEEKLY_MEAL_PLANS_COLLECTION),
        where('athleteId', '==', athleteId),
        where('weekStartDate', '>=', Timestamp.fromDate(weekStart)),
        where('weekStartDate', '<=', Timestamp.fromDate(weekEnd)),
        orderBy('weekStartDate', 'desc'),
        limit(1)
      );
      
      snapshot = await getDocs(rangeQuery);
    }
    
    if (snapshot.empty) {
      console.log('No meal plan found for current week');
      return { plan: null, success: true, error: null };
    }
    
    console.log('Found meal plan in Firestore');
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    console.log('Raw Firestore data:', JSON.stringify(data, null, 2));
    
    const plan: WeeklyMealPlan = {
      id: doc.id,
      ...data,
      weekStartDate: data.weekStartDate.toDate(),
      dailyPlans: data.dailyPlans.map((plan: any) => {
        console.log('Processing retrieved daily plan:', plan);
        const processedPlan = {
          ...plan,
          date: plan.date.toDate(),
          createdAt: plan.createdAt.toDate()
        };
        console.log('Processed daily plan:', processedPlan);
        return processedPlan;
      }),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as WeeklyMealPlan;
    
    console.log('Final retrieved meal plan:', JSON.stringify(plan, null, 2));
    
    return { plan, success: true, error: null };
  } catch (error: any) {
    return { plan: null, success: false, error: error.message };
  }
};

// Daily Meal Plan Operations
export const saveDailyMealPlan = async (planData: Omit<DailyMealPlan, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, DAILY_MEAL_PLANS_COLLECTION), {
      ...planData,
      date: Timestamp.fromDate(planData.date),
      createdAt: Timestamp.now()
    });
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

// Nutrition Logging
export const addNutritionLog = async (logData: Omit<NutritionLog, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, NUTRITION_LOGS_COLLECTION), {
      ...logData,
      date: Timestamp.fromDate(logData.date),
      createdAt: Timestamp.now()
    });
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

export const getNutritionLogs = async (athleteId: string, dateFrom: Date, dateTo: Date) => {
  try {
    const q = query(
      collection(db, NUTRITION_LOGS_COLLECTION),
      where('athleteId', '==', athleteId),
      where('date', '>=', Timestamp.fromDate(dateFrom)),
      where('date', '<=', Timestamp.fromDate(dateTo)),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const logs: NutritionLog[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate()
      } as NutritionLog);
    });
    
    return { logs, success: true, error: null };
  } catch (error: any) {
    return { logs: [], success: false, error: error.message };
  }
};

// AI Integration Function
export const generateWeeklyMealPlan = async (athleteId: string): Promise<WeeklyMealPlan | null> => {
  try {
    // Get athlete's nutrition profile
    const profileResult = await getNutritionProfile(athleteId);
    if (!profileResult.success || !profileResult.profile) {
      throw new Error('Nutrition profile not found');
    }

    // Get athlete's injury history
    const injuryResult = await getAthleteInjuries(athleteId);
    const activeInjuries = injuryResult.success ? 
      injuryResult.injuries.filter(injury => injury.status === 'active' || injury.status === 'recovering') : [];

    // Get athlete's performance data
    const sessionsResult = await getTrainingSessions(athleteId, 30); // Get last 30 sessions
    const performanceData = sessionsResult.success ? 
      calculateWeeklyStats(sessionsResult.sessions) : null;

    // Get user profile for basic info (you'll need to implement this)
    const userProfile = await getUserProfile(athleteId);

    // Prepare data for AI API call
    const requestData = {
      athleteProfile: {
        age: userProfile?.age || profileResult.profile.age,
        weight: profileResult.profile.weight,
        height: profileResult.profile.height,
        activityLevel: profileResult.profile.activityLevel,
        sport: userProfile?.sport || 'general'
      },
      nutritionProfile: profileResult.profile,
      injuryInfo: activeInjuries.map(injury => ({
        type: injury.injuryType,
        bodyPart: injury.bodyPart,
        severity: injury.severity,
        restrictions: injury.restrictions || []
      })),
      performanceData: performanceData && performanceData.length > 0 ? {
        weeklySessionCount: performanceData[0].sessions || 0,
        averageIntensity: getIntensityLevel(performanceData[0].avgIntensity || 0),
        trainingPhase: "maintenance"
      } : {
        weeklySessionCount: 0,
        averageIntensity: "moderate",
        trainingPhase: "maintenance"
      }
    };

    // Call AI API
    const response = await fetch('/api/ai/nutrition-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error('Failed to generate meal plan');
    }

    const data = await response.json();
    console.log('Received AI response:', JSON.stringify(data, null, 2));
    console.log('Raw AI response data:', JSON.stringify(data, null, 2));
    
    // Convert AI response to WeeklyMealPlan format
    const weeklyPlan: Omit<WeeklyMealPlan, 'id' | 'createdAt' | 'updatedAt'> = {
      athleteId,
      weekStartDate: getWeekStartDate(),
      dailyPlans: data.dailyPlans.map((plan: any, index: number) => {
        console.log(`Processing daily plan ${index}:`, plan);
        const planDate = new Date(getWeekStartDate());
        planDate.setDate(planDate.getDate() + index);
        
        // Ensure meals is in the correct format
        let meals = plan.meals || {};
        console.log(`Original meals for day ${index}:`, meals);
        console.log(`First meal sample for day ${index}:`, meals[0]);
        console.log(`Meal times for day ${index}:`, meals.map((m: any) => m.time || m.type || 'no-time-property'));
        console.log(`All meals for day ${index}:`, JSON.stringify(meals, null, 2));
        
        // If meals is an array instead of an object, convert it
        if (Array.isArray(meals)) {
          console.log(`Converting meal array to object for day ${index}...`);
          console.log(`All meal names for day ${index}:`, meals.map(m => m.name));
          
          // Create a more flexible mapping function
          const getMealsByType = (searchTerms: string[]) => {
            return meals.filter((m: any) => {
              const mealName = (m.name || '').toLowerCase();
              return searchTerms.some(term => mealName.includes(term.toLowerCase()));
            });
          };
          
          meals = {
            breakfast: getMealsByType(['breakfast']),
            lunch: getMealsByType(['lunch']),
            dinner: getMealsByType(['dinner']),
            snack_morning: getMealsByType(['mid-morning', 'morning snack', 'morning']),
            snack_evening: getMealsByType(['evening snack', 'evening']),
            pre_workout: getMealsByType(['pre-workout', 'pre workout']),
            post_workout: getMealsByType(['post-workout', 'post workout']),
          };
          
          // Log the results for debugging
          Object.entries(meals).forEach(([type, mealArray]) => {
            console.log(`${type}: ${Array.isArray(mealArray) ? mealArray.length : 0} meals`);
            if (Array.isArray(mealArray) && mealArray.length > 0) {
              console.log(`  - ${mealArray.map(m => m.name).join(', ')}`);
            }
          });
          
          console.log(`Converted meals structure for day ${index}:`, meals);
        }
        
        // Ensure each meal type is an array
        Object.keys(meals).forEach(mealType => {
          if (!Array.isArray(meals[mealType])) {
            meals[mealType] = meals[mealType] ? [meals[mealType]] : [];
          }
        });
        
        console.log(`Processed meals for day ${index}:`, meals);
        
        const dailyPlan = {
          athleteId,
          date: planDate,
          meals,
          totalCalories: plan.totalDayCalories || plan.totalCalories || 0,
          totalProtein: plan.totalDayProtein || plan.totalProtein || 0,
          totalCarbs: plan.totalDayCarbs || plan.totalCarbs || 0,
          totalFats: plan.totalDayFat || plan.totalFats || 0,
          totalCost: plan.totalDayPrice || plan.totalCost || 0,
          waterIntake: plan.waterIntake || 2.5,
          supplementRecommendations: plan.supplementRecommendations || [],
          specialNotes: plan.specialNotes || [],
          aiGenerated: true,
          createdAt: new Date()
        } as DailyMealPlan;
        
        console.log(`Final daily plan ${index}:`, dailyPlan);
        return dailyPlan;
      }),
      weeklyGoals: {
        targetCalories: data.weeklyGoals?.targetCalories || 2500,
        targetProtein: data.weeklyGoals?.targetProtein || 150,
        targetCarbs: data.weeklyGoals?.targetCarbs || 300,
        targetFats: data.weeklyGoals?.targetFat || data.weeklyGoals?.targetFats || 85
      },
      shoppingList: data.shoppingList?.map((item: any) => ({
        item: item.item,
        quantity: item.quantity,
        estimatedCost: item.estimatedPrice || item.estimatedCost || 0,
        category: item.category
      })) || [],
      totalWeeklyCost: data.totalWeeklyCost || 0,
      aiGenerated: true
    };

    console.log('Final weekly plan before saving:', JSON.stringify(weeklyPlan, null, 2));

    // Save to Firestore
    const saveResult = await saveWeeklyMealPlan(weeklyPlan);
    if (!saveResult.success) {
      console.error('Failed to save meal plan to Firestore:', saveResult.error);
      // Still return the plan even if save failed, so user can see it
      return { 
        ...weeklyPlan, 
        id: 'temp-' + Date.now(), 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
    }

    return { ...weeklyPlan, id: saveResult.id!, createdAt: new Date(), updatedAt: new Date() };

  } catch (error) {
    console.error('Error generating weekly meal plan:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('Attempting fallback meal plan...');
    return await getFallbackMealPlan(athleteId);
  }
};

// Helper Functions
const getUserProfile = async (athleteId: string) => {
  try {
    const docRef = doc(db, 'users', athleteId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

const getWeekStartDate = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const getIntensityLevel = (avgIntensity: number): string => {
  if (avgIntensity >= 8) return "high";
  if (avgIntensity >= 5) return "moderate";
  return "low";
};

const getFallbackMealPlan = async (athleteId: string): Promise<WeeklyMealPlan> => {
  const profileResult = await getNutritionProfile(athleteId);
  const profile = profileResult.profile;
  
  const weekStart = getWeekStartDate();
  const dailyPlans: DailyMealPlan[] = [];
  
  // Create 7 days of basic meal plans
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    
    const dailyPlan: DailyMealPlan = {
      athleteId,
      date,
      meals: {
        breakfast: [
          {
            name: profile?.dietaryPreference === 'vegan' ? 'Oatmeal with berries' : 'Scrambled eggs with toast',
            quantity: '1 serving',
            calories: 350,
            protein: 15,
            carbs: 45,
            fats: 12
          }
        ],
        lunch: [
          {
            name: profile?.dietaryPreference === 'vegetarian' ? 'Quinoa salad with vegetables' : 'Grilled chicken with rice',
            quantity: '1 serving',
            calories: 450,
            protein: 25,
            carbs: 55,
            fats: 15
          }
        ],
        dinner: [
          {
            name: 'Mixed vegetable curry with brown rice',
            quantity: '1 serving',
            calories: 400,
            protein: 18,
            carbs: 60,
            fats: 12
          }
        ]
      },
      totalCalories: 1200,
      totalProtein: 58,
      totalCarbs: 160,
      totalFats: 39,
      aiGenerated: false,
      createdAt: new Date()
    };
    
    dailyPlans.push(dailyPlan);
  }
  
  const fallbackPlan: WeeklyMealPlan = {
    athleteId,
    weekStartDate: weekStart,
    dailyPlans,
    weeklyGoals: {
      targetCalories: 8400, // 1200 * 7
      targetProtein: 406,   // 58 * 7
      targetCarbs: 1120,    // 160 * 7
      targetFats: 273       // 39 * 7
    },
    aiGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return fallbackPlan;
};

// Nutrition calculation helpers
export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
    extreme: 1.9
  };
  
  return bmr * multipliers[activityLevel];
};

export const getDietaryPreferenceIcon = (preference: DietaryPreference): string => {
  const icons = {
    omnivore: '🍽️',
    vegetarian: '🥬',
    vegan: '🌱',
    pescatarian: '🐟',
    keto: '🥑',
    paleo: '🦴',
    mediterranean: '🫒'
  };
  return icons[preference] || '🍽️';
};

export const getBudgetRangeDescription = (budget: BudgetRange): string => {
  const descriptions = {
    budget: 'Budget-friendly meals ₹3,500-5,600/week',
    moderate: 'Balanced meals ₹5,600-8,400/week',
    premium: 'Premium organic meals ₹8,400+/week'
  };
  return descriptions[budget];
};
