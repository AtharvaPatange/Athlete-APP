import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward request to FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/ai/recovery-milestones`, {
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
    console.error('Error calling FastAPI:', error);
    
    // Return fallback response
    return NextResponse.json({
      milestones: [
        {
          title: "Initial Rest Period",
          description: "Complete rest and follow RICE protocol (Rest, Ice, Compression, Elevation)",
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 7,
          priority: "high",
          category: "rest"
        },
        {
          title: "Gentle Mobility Phase",
          description: "Begin gentle range-of-motion exercises as tolerated",
          targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 7,
          priority: "medium",
          category: "mobility"
        },
        {
          title: "Strength Building",
          description: "Progress to strength and stability exercises",
          targetDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 14,
          priority: "medium",
          category: "strength"
        }
      ],
      totalEstimatedDays: 28,
      recommendations: [
        "Consult with a sports medicine professional",
        "Monitor pain levels daily",
        "Maintain consistent communication with your healthcare team"
      ],
      warnings: [
        "Stop any exercise if pain increases significantly",
        "Seek immediate medical attention if symptoms worsen"
      ]
    });
  }
}
