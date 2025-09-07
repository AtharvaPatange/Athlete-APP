import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward request to FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/ai/nutrition-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling FastAPI for nutrition plan:', error);
    
    // Return fallback response
    const currentDate = new Date();
    const weekStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
    
    const fallbackPlan = {
      dailyPlans: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        
        return {
          date: date.toISOString(),
          meals: {
            breakfast: [
              {
                name: "Oatmeal with berries",
                quantity: "1 serving",
                calories: 350,
                protein: 15,
                carbs: 45,
                fats: 12,
                fiber: 6,
                cost: 4,
                preparationTime: 10,
                ingredients: ["oats", "berries", "milk"],
                instructions: ["Cook oats with milk", "Add berries on top"]
              }
            ],
            lunch: [
              {
                name: "Grilled chicken with quinoa",
                quantity: "1 serving",
                calories: 450,
                protein: 35,
                carbs: 40,
                fats: 15,
                fiber: 5,
                cost: 8,
                preparationTime: 25,
                ingredients: ["chicken breast", "quinoa", "vegetables"],
                instructions: ["Grill chicken", "Cook quinoa", "Steam vegetables"]
              }
            ],
            dinner: [
              {
                name: "Salmon with sweet potato",
                quantity: "1 serving",
                calories: 400,
                protein: 30,
                carbs: 35,
                fats: 18,
                fiber: 4,
                cost: 10,
                preparationTime: 20,
                ingredients: ["salmon fillet", "sweet potato", "broccoli"],
                instructions: ["Bake salmon", "Roast sweet potato", "Steam broccoli"]
              }
            ]
          },
          totalCalories: 1200,
          totalProtein: 80,
          totalCarbs: 120,
          totalFats: 45,
          totalCost: 22,
          waterIntake: 3,
          supplementRecommendations: ["Multivitamin", "Omega-3"],
          specialNotes: ["Focus on post-workout recovery", "Stay hydrated"]
        };
      }),
      weeklyGoals: {
        targetCalories: 8400,
        targetProtein: 560,
        targetCarbs: 840,
        targetFats: 315
      },
      shoppingList: [
        {
          item: "Chicken breast",
          quantity: "2 kg",
          estimatedCost: 15,
          category: "proteins"
        },
        {
          item: "Salmon fillets",
          quantity: "1 kg",
          estimatedCost: 20,
          category: "proteins"
        },
        {
          item: "Quinoa",
          quantity: "500g",
          estimatedCost: 6,
          category: "grains"
        },
        {
          item: "Oats",
          quantity: "1 kg",
          estimatedCost: 4,
          category: "grains"
        },
        {
          item: "Mixed berries",
          quantity: "500g",
          estimatedCost: 8,
          category: "fruits"
        },
        {
          item: "Sweet potatoes",
          quantity: "2 kg",
          estimatedCost: 5,
          category: "vegetables"
        }
      ],
      totalWeeklyCost: 154,
      nutritionTips: [
        "Eat protein with every meal for muscle recovery",
        "Include colorful vegetables for antioxidants",
        "Time carbohydrates around training sessions",
        "Stay hydrated throughout the day"
      ],
      injurySpecificAdvice: [
        "Include anti-inflammatory foods like berries and fatty fish",
        "Ensure adequate protein intake for tissue repair",
        "Consider turmeric and ginger for natural anti-inflammatory effects"
      ]
    };
    
    return NextResponse.json(fallbackPlan);
  }
}
