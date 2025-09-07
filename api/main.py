import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

# Initialize GROQ client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="AthleteApp AI Recovery API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GROQ API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in environment variables. AI features will use fallback responses.")

# Request/Response Models
class InjuryInput(BaseModel):
    injuryType: str
    bodyPart: str
    severity: str
    description: str
    diagnosis: Optional[str] = None
    symptoms: List[str] = []

class RecoveryMilestone(BaseModel):
    title: str
    description: str
    targetDate: str  # ISO date string
    estimatedDuration: int  # days
    priority: str  # high, medium, low
    category: str  # rest, mobility, strength, activity

class RecoveryPlan(BaseModel):
    milestones: List[RecoveryMilestone]
    totalEstimatedDays: int
    recommendations: List[str]
    warnings: List[str]

# Nutrition Models
class AthleteProfile(BaseModel):
    age: Optional[int] = None
    weight: Optional[float] = None  # kg
    height: Optional[float] = None  # cm
    activityLevel: str  # sedentary, light, moderate, active, very_active
    sport: str

class NutritionProfile(BaseModel):
    dietaryPreference: str  # vegetarian, non-vegetarian, vegan, etc.
    allergies: List[str] = []
    calorieTarget: Optional[int] = None
    budgetRange: str  # low, medium, high, premium
    activityLevel: str
    mealsPerDay: int = 6
    goals: List[str] = []  # weight_loss, muscle_gain, endurance, recovery
    medicalConditions: List[str] = []
    supplementsAllowed: bool = True

class InjuryInfo(BaseModel):
    type: str
    bodyPart: str
    severity: str
    restrictions: List[str] = []

class PerformanceData(BaseModel):
    weeklySessionCount: int = 0
    averageIntensity: str = "moderate"  # low, moderate, high
    trainingPhase: str = "maintenance"  # preparation, competition, recovery

class NutritionRequest(BaseModel):
    athleteProfile: AthleteProfile
    nutritionProfile: NutritionProfile
    injuryInfo: Optional[List[InjuryInfo]] = []
    performanceData: Optional[PerformanceData] = None

class MealItem(BaseModel):
    name: str
    quantity: str
    calories: int
    protein: int
    carbs: int
    fat: int
    price: int
    instructions: str

class Meal(BaseModel):
    name: str
    time: str
    items: List[MealItem]
    totalCalories: int
    totalProtein: int
    totalCarbs: int
    totalFat: int
    totalPrice: int

class DailyPlan(BaseModel):
    day: str
    meals: List[Meal]
    totalDayCalories: int
    totalDayProtein: int
    totalDayCarbs: int
    totalDayFat: int
    totalDayPrice: int

class WeeklyGoals(BaseModel):
    targetCalories: int
    targetProtein: int
    targetCarbs: int
    targetFat: int
    focusAreas: List[str]

class ShoppingItem(BaseModel):
    item: str
    quantity: str
    estimatedPrice: int
    category: str

class NutritionPlan(BaseModel):
    dailyPlans: List[DailyPlan]
    weeklyGoals: WeeklyGoals
    shoppingList: Optional[List[ShoppingItem]] = []
    totalWeeklyCost: Optional[int] = None

@app.get("/")
async def root():
    return {"message": "AthleteApp AI Recovery API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/ai/recovery-milestones", response_model=RecoveryPlan)
async def generate_recovery_milestones(injury: InjuryInput):
    """
    Generate AI-powered recovery milestones for an injury using Llama 3.3 70B via GROQ
    """
    try:
        # Create prompt for Llama 3.3
        prompt = create_recovery_prompt(injury)
        
        # Call GROQ API
        response = await call_groq_api(prompt)
        
        # Parse and validate response
        recovery_plan = parse_groq_response(response, injury)
        
        return recovery_plan
        
    except Exception as e:
        print(f"Error generating recovery milestones: {str(e)}")
        # Return fallback plan
        return create_fallback_plan(injury)

def create_recovery_prompt(injury: InjuryInput) -> str:
    """Create a detailed prompt for Llama 3.3 to generate recovery milestones"""
    
    symptoms_text = ", ".join(injury.symptoms) if injury.symptoms else "None specified"
    diagnosis_text = injury.diagnosis if injury.diagnosis else "No formal diagnosis provided"
    
    prompt = f"""
You are a sports medicine expert and physical therapy specialist. Create a comprehensive recovery plan for an athlete with the following injury:

**Injury Details:**
- Type: {injury.injuryType}
- Body Part: {injury.bodyPart}
- Severity: {injury.severity}
- Description: {injury.description}
- Medical Diagnosis: {diagnosis_text}
- Symptoms: {symptoms_text}

**Task:** Generate a detailed recovery plan with specific milestones, following these guidelines:

1. **Recovery Phases:** Structure the plan in logical phases (acute, subacute, recovery, return-to-activity)
2. **Realistic Timeline:** Base timelines on injury severity and type
3. **Progressive Loading:** Ensure gradual progression from rest to full activity
4. **Evidence-Based:** Use sports medicine best practices
5. **Athlete-Specific:** Consider the athletic context

**Output Format (JSON):**
{{
  "milestones": [
    {{
      "title": "Milestone name",
      "description": "Detailed description of what the athlete should achieve",
      "targetDate": "2024-XX-XX",
      "estimatedDuration": number_of_days,
      "priority": "high|medium|low",
      "category": "rest|mobility|strength|activity"
    }}
  ],
  "totalEstimatedDays": total_recovery_days,
  "recommendations": ["General recommendation 1", "General recommendation 2"],
  "warnings": ["Warning or red flag 1", "Warning or red flag 2"]
}}

**Severity Guidelines:**
- Minor: 1-2 weeks recovery, focus on activity modification
- Moderate: 2-6 weeks recovery, structured rehabilitation needed
- Severe: 6-12 weeks recovery, professional supervision required
- Critical: 12+ weeks recovery, comprehensive medical management

**Body Part Considerations:**
- Account for the specific anatomy and function of {injury.bodyPart}
- Consider sport-specific movement patterns
- Include functional testing milestones

Generate 5-8 progressive milestones with realistic timelines. Start response with valid JSON only.
"""
    
    return prompt

async def call_groq_api(prompt: str) -> str:
    """Call GROQ API with Llama 3.3 70B model"""
    
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ API key not configured")
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "system",
                "content": "You are an expert sports medicine physician and certified athletic trainer with 15+ years of experience in injury rehabilitation. Provide evidence-based, progressive recovery plans tailored to athletes. Always respond with valid JSON format."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.3,  # Lower temperature for more consistent medical advice
        "max_tokens": 2000,
        "top_p": 0.9
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(GROQ_API_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"GROQ API error: {response.status_code}")
        
        result = response.json()
        
        if "choices" not in result or len(result["choices"]) == 0:
            raise HTTPException(status_code=500, detail="Invalid response from GROQ API")
        
        return result["choices"][0]["message"]["content"]

def parse_groq_response(response: str, injury: InjuryInput) -> RecoveryPlan:
    """Parse and validate the GROQ response"""
    
    try:
        # Extract JSON from response (in case there's extra text)
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        
        if json_start == -1 or json_end == 0:
            raise ValueError("No JSON found in response")
        
        json_str = response[json_start:json_end]
        data = json.loads(json_str)
        
        # Validate and adjust dates
        milestones = []
        base_date = datetime.now()
        
        for i, milestone_data in enumerate(data.get("milestones", [])):
            # Calculate target date based on duration if date is invalid
            try:
                target_date = datetime.fromisoformat(milestone_data["targetDate"].replace("2024-XX-XX", ""))
            except:
                # Use duration to calculate date
                days_offset = milestone_data.get("estimatedDuration", (i + 1) * 7)
                target_date = base_date + timedelta(days=days_offset)
            
            milestone = RecoveryMilestone(
                title=milestone_data.get("title", f"Recovery Milestone {i+1}"),
                description=milestone_data.get("description", "Follow recovery protocol"),
                targetDate=target_date.isoformat(),
                estimatedDuration=milestone_data.get("estimatedDuration", 7),
                priority=milestone_data.get("priority", "medium"),
                category=milestone_data.get("category", "recovery")
            )
            milestones.append(milestone)
        
        return RecoveryPlan(
            milestones=milestones,
            totalEstimatedDays=data.get("totalEstimatedDays", len(milestones) * 7),
            recommendations=data.get("recommendations", []),
            warnings=data.get("warnings", [])
        )
        
    except Exception as e:
        print(f"Error parsing GROQ response: {str(e)}")
        print(f"Response was: {response}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")

def create_fallback_plan(injury: InjuryInput) -> RecoveryPlan:
    """Create a fallback recovery plan when AI is unavailable"""
    
    base_date = datetime.now()
    
    # Determine base recovery time based on severity
    severity_multiplier = {
        "minor": 1.0,
        "moderate": 2.0,
        "severe": 4.0,
        "critical": 8.0
    }
    
    base_weeks = severity_multiplier.get(injury.severity.lower(), 2.0)
    
    milestones = [
        RecoveryMilestone(
            title="Initial Rest and Assessment",
            description=f"Complete rest for {injury.bodyPart}. Apply RICE protocol (Rest, Ice, Compression, Elevation). Monitor symptoms and pain levels.",
            targetDate=(base_date + timedelta(days=3)).isoformat(),
            estimatedDuration=3,
            priority="high",
            category="rest"
        ),
        RecoveryMilestone(
            title="Pain Management Phase",
            description="Focus on pain reduction and initial healing. Continue modified rest with gentle movements as tolerated.",
            targetDate=(base_date + timedelta(days=7)).isoformat(),
            estimatedDuration=7,
            priority="high",
            category="rest"
        ),
        RecoveryMilestone(
            title="Gentle Mobility Introduction",
            description="Begin gentle range-of-motion exercises. Introduce light stretching and basic movements without pain.",
            targetDate=(base_date + timedelta(days=int(base_weeks * 7 * 0.3))).isoformat(),
            estimatedDuration=int(base_weeks * 7 * 0.2),
            priority="medium",
            category="mobility"
        ),
        RecoveryMilestone(
            title="Strength Building Phase",
            description="Progress to strength exercises and stability training. Focus on muscle activation and endurance.",
            targetDate=(base_date + timedelta(days=int(base_weeks * 7 * 0.6))).isoformat(),
            estimatedDuration=int(base_weeks * 7 * 0.3),
            priority="medium",
            category="strength"
        ),
        RecoveryMilestone(
            title="Functional Training",
            description="Introduce sport-specific movements and functional patterns. Progress intensity gradually.",
            targetDate=(base_date + timedelta(days=int(base_weeks * 7 * 0.8))).isoformat(),
            estimatedDuration=int(base_weeks * 7 * 0.2),
            priority="high",
            category="activity"
        ),
        RecoveryMilestone(
            title="Return to Full Activity",
            description="Graduate to full activity level with continued monitoring. Maintain preventive exercises.",
            targetDate=(base_date + timedelta(days=int(base_weeks * 7))).isoformat(),
            estimatedDuration=int(base_weeks * 7 * 0.1),
            priority="high",
            category="activity"
        )
    ]
    
    recommendations = [
        "Consult with a sports medicine professional for proper diagnosis",
        "Monitor pain levels daily and adjust activity accordingly",
        "Maintain consistent communication with your healthcare team",
        "Focus on proper nutrition and hydration for healing",
        "Ensure adequate sleep for recovery (7-9 hours per night)"
    ]
    
    warnings = [
        "Stop any exercise if pain increases significantly",
        "Seek immediate medical attention if symptoms worsen",
        "Do not rush the recovery process - patience is key",
        "Avoid activities that caused the initial injury until cleared"
    ]
    
    return RecoveryPlan(
        milestones=milestones,
        totalEstimatedDays=int(base_weeks * 7),
        recommendations=recommendations,
        warnings=warnings
    )

@app.post("/nutrition-plan", response_model=NutritionPlan)
async def generate_nutrition_plan(request: NutritionRequest):
    """
    Generate AI-powered nutrition plan for athlete
    """
    try:
        # Create simplified AI prompt to avoid truncation
        dietary_pref = request.nutritionProfile.dietaryPreference
        allergies_str = ', '.join(request.nutritionProfile.allergies) if request.nutritionProfile.allergies else 'None'
        calorie_target = request.nutritionProfile.calorieTarget or 2500
        meals_per_day = request.nutritionProfile.mealsPerDay
        
        prompt = f"""Create a 7-day nutrition plan for a {request.athleteProfile.sport} athlete.

Profile: {dietary_pref}, {calorie_target} calories/day, {meals_per_day} meals/day
Allergies: {allergies_str}
Budget: {request.nutritionProfile.budgetRange}

Return ONLY this JSON format (complete all 7 days):
{{
  "dailyPlans": [
    {{
      "day": "Monday",
      "meals": [
        {{
          "name": "Breakfast",
          "time": "07:00",
          "items": [
            {{
              "name": "Oats with banana",
              "quantity": "1 bowl",
              "calories": 300,
              "protein": 12,
              "carbs": 54,
              "fat": 6,
              "price": 40,
              "instructions": "Cook oats with milk"
            }}
          ],
          "totalCalories": 300,
          "totalProtein": 12,
          "totalCarbs": 54,
          "totalFat": 6,
          "totalPrice": 40
        }}
      ],
      "totalDayCalories": {calorie_target},
      "totalDayProtein": 150,
      "totalDayCarbs": 300,
      "totalDayFat": 85,
      "totalDayPrice": 400
    }}
  ],
  "weeklyGoals": {{
    "targetCalories": {calorie_target},
    "targetProtein": 150,
    "targetCarbs": 300,
    "targetFat": 85,
    "focusAreas": ["performance", "recovery"]
  }},
  "shoppingList": [
    {{
      "item": "Oats",
      "quantity": "1 kg",
      "estimatedPrice": 120,
      "category": "grains"
    }}
  ],
  "totalWeeklyCost": 2800
}}

Create {meals_per_day} meals for each of the 7 days. Use Indian foods and rupee prices."""

        # Make API call to GROQ
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a certified sports nutritionist and dietitian. Create detailed, practical meal plans that consider athletic performance, injury recovery, and budget constraints. ALWAYS return complete, valid JSON only. Ensure the response is not truncated."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=8000,  # Increased to prevent truncation
            stream=False
        )

        # Get AI response
        ai_response = completion.choices[0].message.content.strip()
        
        # Clean and validate JSON response
        try:
            # Remove any markdown formatting
            if ai_response.startswith("```json"):
                ai_response = ai_response[7:]
            if ai_response.startswith("```"):
                ai_response = ai_response[3:]
            if ai_response.endswith("```"):
                ai_response = ai_response[:-3]
            
            # Parse JSON with error handling
            nutrition_data = json.loads(ai_response.strip())
            
            # Validate required fields
            if "dailyPlans" not in nutrition_data:
                raise ValueError("Missing dailyPlans in AI response")
            
            # Ensure we have 7 days
            if len(nutrition_data["dailyPlans"]) < 7:
                raise ValueError(f"Expected 7 days, got {len(nutrition_data['dailyPlans'])}")
            
            # Add default values for missing fields
            if "weeklyGoals" not in nutrition_data:
                nutrition_data["weeklyGoals"] = {
                    "targetCalories": request.nutritionProfile.calorieTarget or 2500,
                    "targetProtein": 150,
                    "targetCarbs": 300,
                    "targetFat": 85,
                    "focusAreas": ["general fitness"]
                }
            
            if "shoppingList" not in nutrition_data:
                nutrition_data["shoppingList"] = []
                
            if "totalWeeklyCost" not in nutrition_data:
                nutrition_data["totalWeeklyCost"] = 2800
            
            return NutritionPlan(**nutrition_data)
            
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            print(f"AI Response Length: {len(ai_response)} characters")
            print(f"AI Response Sample: {ai_response[:500]}...")
            
            # Try to fix common JSON issues
            try:
                # Remove incomplete trailing content
                last_brace = ai_response.rfind('}')
                if last_brace > 0:
                    truncated_response = ai_response[:last_brace + 1]
                    print(f"Trying truncated response at position {last_brace}")
                    nutrition_data = json.loads(truncated_response)
                    
                    # Add missing required fields if they exist
                    if "dailyPlans" in nutrition_data and len(nutrition_data["dailyPlans"]) >= 1:
                        # Fill in missing days with simple fallback
                        while len(nutrition_data["dailyPlans"]) < 7:
                            day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                            missing_day = day_names[len(nutrition_data["dailyPlans"])]
                            nutrition_data["dailyPlans"].append({
                                "day": missing_day,
                                "meals": [],
                                "totalDayCalories": request.nutritionProfile.calorieTarget or 2500,
                                "totalDayProtein": 150,
                                "totalDayCarbs": 300,
                                "totalDayFat": 85,
                                "totalDayPrice": 400
                            })
                        
                        # Add missing fields
                        if "weeklyGoals" not in nutrition_data:
                            nutrition_data["weeklyGoals"] = {
                                "targetCalories": request.nutritionProfile.calorieTarget or 2500,
                                "targetProtein": 150,
                                "targetCarbs": 300,
                                "targetFat": 85,
                                "focusAreas": ["performance", "recovery"]
                            }
                        
                        if "shoppingList" not in nutrition_data:
                            nutrition_data["shoppingList"] = []
                            
                        if "totalWeeklyCost" not in nutrition_data:
                            nutrition_data["totalWeeklyCost"] = 2800
                        
                        print("Successfully recovered partial AI response!")
                        return NutritionPlan(**nutrition_data)
                        
            except Exception as recovery_error:
                print(f"Recovery attempt failed: {recovery_error}")
            
            # Fall back to our predefined plan
            print("Using fallback nutrition plan due to AI parsing failure")
            return create_fallback_nutrition_plan(request)
            
        except Exception as e:
            print(f"Validation Error: {e}")
            return create_fallback_nutrition_plan(request)
            
    except Exception as e:
        print(f"Error generating nutrition plan: {e}")
        return create_fallback_nutrition_plan(request)

def create_fallback_nutrition_plan(request: NutritionRequest) -> NutritionPlan:
    """
    Create a basic fallback nutrition plan when AI fails
    """
    is_vegetarian = "vegetarian" in request.nutritionProfile.dietaryPreference.lower()
    is_vegan = "vegan" in request.nutritionProfile.dietaryPreference.lower()
    target_calories = request.nutritionProfile.calorieTarget or 2500
    
    # Basic meal template
    if is_vegan:
        breakfast_items = [
            {
                "name": "Oats with almond milk and fruits",
                "quantity": "1 bowl",
                "calories": 350,
                "protein": 12,
                "carbs": 65,
                "fat": 8,
                "price": 60,
                "instructions": "Cook oats with almond milk, add seasonal fruits"
            }
        ]
        lunch_protein = {
            "name": "Dal and quinoa",
            "quantity": "1 plate",
            "calories": 400,
            "protein": 18,
            "carbs": 70,
            "fat": 8,
            "price": 80,
            "instructions": "Serve dal with quinoa and vegetables"
        }
    elif is_vegetarian:
        breakfast_items = [
            {
                "name": "Vegetable upma with yogurt",
                "quantity": "1 bowl",
                "calories": 320,
                "protein": 12,
                "carbs": 55,
                "fat": 8,
                "price": 50,
                "instructions": "Prepare upma with vegetables, serve with yogurt"
            }
        ]
        lunch_protein = {
            "name": "Paneer curry with rice",
            "quantity": "1 plate",
            "calories": 450,
            "protein": 20,
            "carbs": 65,
            "fat": 12,
            "price": 100,
            "instructions": "Paneer curry with brown rice and salad"
        }
    else:
        breakfast_items = [
            {
                "name": "Scrambled eggs with toast",
                "quantity": "2 eggs + 2 slices",
                "calories": 380,
                "protein": 20,
                "carbs": 30,
                "fat": 18,
                "price": 60,
                "instructions": "Scrambled eggs with whole wheat toast"
            }
        ]
        lunch_protein = {
            "name": "Chicken breast with rice",
            "quantity": "150g + 1 cup rice",
            "calories": 500,
            "protein": 35,
            "carbs": 60,
            "fat": 8,
            "price": 120,
            "instructions": "Grilled chicken breast with steamed rice and vegetables"
        }
    
    # Create daily plans
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    daily_plans = []
    
    for day in days:
        meals = [
            {
                "name": "Breakfast",
                "time": "07:00",
                "items": breakfast_items,
                "totalCalories": sum(item["calories"] for item in breakfast_items),
                "totalProtein": sum(item["protein"] for item in breakfast_items),
                "totalCarbs": sum(item["carbs"] for item in breakfast_items),
                "totalFat": sum(item["fat"] for item in breakfast_items),
                "totalPrice": sum(item["price"] for item in breakfast_items)
            },
            {
                "name": "Lunch",
                "time": "12:30",
                "items": [lunch_protein],
                "totalCalories": lunch_protein["calories"],
                "totalProtein": lunch_protein["protein"],
                "totalCarbs": lunch_protein["carbs"],
                "totalFat": lunch_protein["fat"],
                "totalPrice": lunch_protein["price"]
            }
        ]
        
        day_totals = {
            "totalDayCalories": sum(meal["totalCalories"] for meal in meals),
            "totalDayProtein": sum(meal["totalProtein"] for meal in meals),
            "totalDayCarbs": sum(meal["totalCarbs"] for meal in meals),
            "totalDayFat": sum(meal["totalFat"] for meal in meals),
            "totalDayPrice": sum(meal["totalPrice"] for meal in meals)
        }
        
        daily_plans.append({
            "day": day,
            "meals": meals,
            **day_totals
        })
    
    return NutritionPlan(
        dailyPlans=daily_plans,
        weeklyGoals={
            "targetCalories": target_calories,
            "targetProtein": 150,
            "targetCarbs": 300,
            "targetFat": 85,
            "focusAreas": ["basic nutrition", "athletic performance"]
        },
        shoppingList=[
            {
                "item": "Basic groceries",
                "quantity": "Weekly supply",
                "estimatedPrice": 2000,
                "category": "mixed"
            }
        ],
        totalWeeklyCost=2500
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
