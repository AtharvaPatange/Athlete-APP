import requests
import json

# Test the nutrition endpoint
url = "http://127.0.0.1:8000/nutrition-plan"

# Sample request data
test_request = {
    "athleteProfile": {
        "age": 25,
        "weight": 70,
        "height": 175,
        "activityLevel": "active",
        "sport": "Football"
    },
    "nutritionProfile": {
        "dietaryPreference": "non-vegetarian",
        "allergies": ["nuts"],
        "calorieTarget": 2800,
        "budgetRange": "medium",
        "activityLevel": "active",
        "mealsPerDay": 6,
        "goals": ["muscle_gain", "endurance"],
        "medicalConditions": [],
        "supplementsAllowed": True
    },
    "injuryInfo": [
        {
            "type": "strain",
            "bodyPart": "hamstring",
            "severity": "mild",
            "restrictions": ["no heavy squats"]
        }
    ],
    "performanceData": {
        "weeklySessionCount": 5,
        "averageIntensity": "high",
        "trainingPhase": "preparation"
    }
}

print("Testing nutrition endpoint...")
print(f"Request URL: {url}")
print(f"Request data: {json.dumps(test_request, indent=2)}")

try:
    response = requests.post(url, json=test_request, timeout=30)
    print(f"\nResponse Status: {response.status_code}")
    
    if response.status_code == 200:
        nutrition_plan = response.json()
        print("✅ SUCCESS! Nutrition plan generated successfully!")
        print(f"Daily plans count: {len(nutrition_plan.get('dailyPlans', []))}")
        
        # Show first day as example
        if nutrition_plan.get('dailyPlans'):
            first_day = nutrition_plan['dailyPlans'][0]
            print(f"\nSample Day ({first_day.get('day', 'Unknown')}):")
            print(f"Total Calories: {first_day.get('totalDayCalories', 'N/A')}")
            print(f"Total Protein: {first_day.get('totalDayProtein', 'N/A')}g")
            print(f"Daily Cost: ₹{first_day.get('totalDayPrice', 'N/A')}")
            print(f"Meals: {len(first_day.get('meals', []))}")
            
            # Show meals breakdown
            for i, meal in enumerate(first_day.get('meals', [])[:2]):  # Show first 2 meals
                print(f"  {meal.get('name', 'Unknown Meal')}: {meal.get('totalCalories', 'N/A')} cal, ₹{meal.get('totalPrice', 'N/A')}")
        
        # Show weekly goals
        if nutrition_plan.get('weeklyGoals'):
            goals = nutrition_plan['weeklyGoals']
            print(f"\nWeekly Goals:")
            print(f"Target Calories: {goals.get('targetCalories', 'N/A')}")
            print(f"Target Protein: {goals.get('targetProtein', 'N/A')}g")
            print(f"Focus Areas: {', '.join(goals.get('focusAreas', []))}")
        
        print(f"\nTotal Weekly Cost: ₹{nutrition_plan.get('totalWeeklyCost', 'N/A')}")
        print(f"Shopping List Items: {len(nutrition_plan.get('shoppingList', []))}")
        
        # Show if it's AI-generated or fallback
        if len(nutrition_plan.get('dailyPlans', [])) > 0:
            first_day = nutrition_plan['dailyPlans'][0]
            if len(first_day.get('meals', [])) > 0:
                print("✅ Plan appears to be AI-generated with detailed meals")
            else:
                print("⚠️  Plan appears to be fallback (limited meal details)")
        
    else:
        print(f"❌ ERROR: {response.status_code}")
        print(f"Response: {response.text}")
        
except requests.exceptions.Timeout:
    print("❌ Request timed out (30 seconds)")
except requests.exceptions.ConnectionError:
    print("❌ Connection error - is the server running?")
except Exception as e:
    print(f"❌ Error: {e}")
