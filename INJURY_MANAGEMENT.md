# Injury Management & Recovery System

## Overview

A comprehensive injury management system for athletes with AI-powered recovery planning using Llama 3.3 70B via GROQ API.

## Features

### 🏥 Injury Reporting
- Detailed injury reporting form with:
  - Injury type, body part, severity classification
  - Symptoms tracking with pre-defined and custom options
  - Treatment plans and activity restrictions
  - Expected recovery timelines

### 🔄 Recovery Tracking
- AI-generated recovery milestones using Llama 3.3 70B
- Progress tracking with pain and mobility levels
- Milestone completion and verification system
- Recovery status monitoring with visual indicators

### 👨‍⚕️ Coach Verification
- Coach assessment and verification system
- Three verification statuses: Cleared, Not Ready, Needs Attention
- Recommended actions and follow-up scheduling
- Progress validation and safety checks

### 📊 Injury Dashboard
- Active, recovered, and chronic injury management
- Real-time status badges (Recovering, Fit, At Risk)
- Injury history and timeline tracking
- Visual progress indicators

## Technical Architecture

### Frontend (Next.js 15 + TypeScript)
- **Components:**
  - `InjuryManagement.tsx` - Main dashboard
  - `InjuryReportForm.tsx` - Injury reporting
  - `RecoveryTracker.tsx` - Recovery monitoring
  - `CoachVerificationForm.tsx` - Coach assessments

- **Services:**
  - `injuryService.ts` - Firestore CRUD operations
  - Comprehensive data models and helper functions

### Backend (FastAPI + Python)
- **AI-Powered Recovery Planning:**
  - Llama 3.3 70B integration via GROQ API
  - Evidence-based recovery milestone generation
  - Personalized treatment recommendations
  - Fallback plans for offline scenarios

- **API Endpoints:**
  - `POST /ai/recovery-milestones` - Generate recovery plans
  - Health checks and status monitoring

### Database (Firestore)
- **Collections:**
  - `injuries` - Injury records
  - `recovery_milestones` - AI-generated milestones
  - `recovery_progress` - Daily progress tracking
  - `coach_verifications` - Coach assessments

## Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Setup

Make sure your `.env.local` includes:
```bash
FASTAPI_URL=http://localhost:8000
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Start the Application

**Option 1: Use the startup scripts**
```bash
# Windows
.\start-app.bat

# Or PowerShell
.\start-app.ps1
```

**Option 2: Manual startup**
```bash
# Terminal 1: Start FastAPI
cd api
python main.py

# Terminal 2: Start Next.js
npm run dev
```

### 4. Access the Application
- Next.js Frontend: http://localhost:3000
- FastAPI Backend: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Usage Guide

### Reporting an Injury

1. Navigate to Performance → Injury Management
2. Click "Report New Injury"
3. Fill in the comprehensive injury form:
   - Select injury type and body part
   - Rate severity (minor, moderate, severe, critical)
   - Describe symptoms and circumstances
   - Add treatment plans and restrictions

### Tracking Recovery

1. Click "Track Recovery" on an active injury
2. View AI-generated recovery milestones
3. Log daily progress with pain/mobility levels
4. Mark milestones as completed
5. Monitor overall recovery progress

### Coach Verification

1. Access the verification tab in recovery tracker
2. Provide assessment status:
   - ✅ Cleared for Next Phase
   - ❌ Not Ready to Progress
   - ⚠️ Needs Attention
3. Add detailed notes and recommendations
4. Schedule follow-up assessments

## AI Integration

### Recovery Milestone Generation

The system uses Llama 3.3 70B to generate personalized recovery plans based on:
- Injury type and severity
- Body part affected
- Symptoms and diagnosis
- Evidence-based sports medicine protocols

### Fallback System

If AI is unavailable, the system provides structured fallback milestones based on:
- Injury severity multipliers
- Standard recovery phases (rest, mobility, strength, activity)
- Conservative timelines for safety

## Data Models

### Injury
```typescript
interface Injury {
  injuryType: 'muscle' | 'bone' | 'joint' | 'ligament' | 'tendon' | 'other';
  bodyPart: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  status: 'active' | 'recovering' | 'recovered' | 'chronic';
  description: string;
  symptoms: string[];
  restrictions: string[];
  // ... timestamps and metadata
}
```

### Recovery Milestone
```typescript
interface RecoveryMilestone {
  title: string;
  description: string;
  targetDate: Date;
  isCompleted: boolean;
  isVerified: boolean;
  aiGenerated: boolean;
  // ... metadata
}
```

## Safety Features

- **Medical Disclaimers:** Clear warnings about seeking professional medical advice
- **Conservative Timelines:** AI generates cautious recovery timelines
- **Coach Oversight:** Verification system prevents premature progression
- **Red Flags:** Automatic alerts for delayed recovery or concerning symptoms

## Integration with Performance System

The injury management system integrates seamlessly with the existing performance tracking:
- Injury status affects training recommendations
- Recovery progress influences gamification challenges
- Historical injury data informs future training plans
- Coach feedback connects to overall athlete development

## Future Enhancements

- Integration with wearable devices for automated progress tracking
- Photo documentation for visual progress monitoring
- Telemedicine integration for remote consultations
- Advanced analytics for injury prediction and prevention
- Multi-language support for international athletes

## Support

For technical issues or questions about the injury management system:
1. Check the FastAPI documentation at `/docs`
2. Review Firestore collections in Firebase Console
3. Monitor API logs for integration issues
4. Ensure GROQ API key is valid and has sufficient credits
