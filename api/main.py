import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
