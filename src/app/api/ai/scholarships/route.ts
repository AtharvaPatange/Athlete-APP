import { NextRequest, NextResponse } from 'next/server';

// Mock LLM service - replace with actual LLM API call
const scholarshipPrompt = `
You are an AI assistant specialized in finding sports scholarships and opportunities in India. 
Search for the latest sports scholarships, government schemes, and opportunities available for Indian athletes.

Please provide the data in this exact JSON format:
{
  "scholarships": [
    {
      "id": "unique_id",
      "title": "Scholarship Name",
      "provider": "Organization/Government",
      "amount": "Amount in INR",
      "eligibility": ["requirement1", "requirement2"],
      "sports": ["sport1", "sport2"],
      "deadline": "YYYY-MM-DD",
      "description": "Brief description",
      "applicationUrl": "https://website.com",
      "documents": ["document1", "document2"],
      "category": "government/private/corporate",
      "status": "active",
      "ageLimit": "18-25",
      "region": "Pan India/State specific",
      "contactEmail": "contact@email.com",
      "contactPhone": "+91XXXXXXXXXX"
    }
  ],
  "lastUpdated": "2025-09-11T10:00:00Z",
  "totalFound": 15
}

Focus on:
1. Government schemes (Khelo India, SAI scholarships, etc.)
2. Corporate scholarships (Tata, Reliance, etc.)
3. Sports federation scholarships
4. University scholarships
5. NGO/Foundation scholarships

Ensure all information is current and accurate as of September 2025.
`;

export async function GET(request: NextRequest) {
  try {
    // Mock AI response - replace with actual LLM API call
    const mockScholarships = {
      scholarships: [
        {
          id: "khelo-india-2025-001",
          title: "Khelo India Scholarship Scheme 2025",
          provider: "Ministry of Youth Affairs and Sports",
          amount: "₹5,00,000 per year",
          eligibility: [
            "Indian citizen aged 10-18 years",
            "Outstanding performance in sports",
            "Annual family income below ₹6 lakhs"
          ],
          sports: ["Athletics", "Swimming", "Badminton", "Hockey", "Football", "Wrestling"],
          deadline: "2025-12-31",
          description: "Financial assistance to promising young athletes to pursue sports excellence while continuing education",
          applicationUrl: "https://kheloindia.gov.in/scholarship",
          documents: ["Birth Certificate", "Aadhar Card", "Income Certificate", "Sports Performance Certificate"],
          category: "government",
          status: "active",
          ageLimit: "10-18 years",
          region: "Pan India",
          contactEmail: "scholarships@kheloindia.gov.in",
          contactPhone: "+91-11-23073700"
        },
        {
          id: "sai-excellence-2025-002",
          title: "SAI Training Center Excellence Scholarship",
          provider: "Sports Authority of India",
          amount: "₹3,00,000 per year + Training",
          eligibility: [
            "Age 14-25 years",
            "State/National level representation",
            "Medical fitness certificate"
          ],
          sports: ["Boxing", "Wrestling", "Weightlifting", "Judo", "Archery", "Shooting"],
          deadline: "2025-11-15",
          description: "Comprehensive training and financial support at SAI centers across India",
          applicationUrl: "https://sai.gov.in/excellence-scholarship",
          documents: ["Medical Certificate", "Sports Achievement Certificate", "Educational Qualification"],
          category: "government",
          status: "active",
          ageLimit: "14-25 years",
          region: "Pan India",
          contactEmail: "excellence@sai.gov.in",
          contactPhone: "+91-11-24368112"
        },
        {
          id: "tata-sports-2025-003",
          title: "Tata Steel Sports Scholarship",
          provider: "Tata Steel Foundation",
          amount: "₹2,50,000 per year",
          eligibility: [
            "Age 12-22 years",
            "Financial need (family income <₹8 lakhs)",
            "Demonstrated sports talent"
          ],
          sports: ["Football", "Athletics", "Archery", "Hockey", "Boxing"],
          deadline: "2025-10-30",
          description: "Supporting young athletes from economically disadvantaged backgrounds",
          applicationUrl: "https://www.tatasteelfoundation.org/sports-scholarship",
          documents: ["Income Proof", "Academic Records", "Sports Certificates", "Recommendation Letter"],
          category: "corporate",
          status: "active",
          ageLimit: "12-22 years",
          region: "Jharkhand, Odisha, West Bengal",
          contactEmail: "sports@tatasteelfoundation.org",
          contactPhone: "+91-657-2345678"
        },
        {
          id: "reliance-foundation-2025-004",
          title: "Reliance Foundation Youth Sports Scholarship",
          provider: "Reliance Foundation",
          amount: "₹4,00,000 per year",
          eligibility: [
            "Age 8-18 years",
            "Outstanding sports performance",
            "Indian citizenship"
          ],
          sports: ["Cricket", "Football", "Swimming", "Badminton", "Table Tennis"],
          deadline: "2025-11-30",
          description: "Nurturing young sports talent through comprehensive support and training",
          applicationUrl: "https://www.reliancefoundation.org/sports-scholarship",
          documents: ["Birth Certificate", "Sports Achievements", "School Records", "Parent Consent"],
          category: "corporate",
          status: "active",
          ageLimit: "8-18 years",
          region: "Pan India",
          contactEmail: "youthsports@reliancefoundation.org",
          contactPhone: "+91-22-30386000"
        },
        {
          id: "inspire-institute-2025-005",
          title: "Inspire Institute of Sport Scholarship",
          provider: "JSW Group & GoSports Foundation",
          amount: "Full Training + ₹1,50,000 stipend",
          eligibility: [
            "Age 12-18 years",
            "Elite level potential",
            "Commitment to full-time training"
          ],
          sports: ["Swimming", "Athletics", "Wrestling", "Boxing", "Judo"],
          deadline: "2025-12-15",
          description: "World-class training facility scholarship for Olympic sport disciplines",
          applicationUrl: "https://www.inspireinstituteofsport.in/scholarship",
          documents: ["Medical Clearance", "Training History", "Performance Records"],
          category: "private",
          status: "active",
          ageLimit: "12-18 years",
          region: "Karnataka (Training in Vijayanagar)",
          contactEmail: "admissions@inspireinstitute.in",
          contactPhone: "+91-8381-234567"
        },
        {
          id: "maharashtra-state-2025-006",
          title: "Maharashtra State Sports Scholarship",
          provider: "Government of Maharashtra",
          amount: "₹1,00,000 - ₹3,00,000",
          eligibility: [
            "Domicile of Maharashtra",
            "Age 10-25 years",
            "State level participation minimum"
          ],
          sports: ["All Olympic Sports", "Traditional Sports", "Paralympics"],
          deadline: "2025-10-15",
          description: "State government scholarship for Maharashtra domicile athletes",
          applicationUrl: "https://krida.maharashtra.gov.in/scholarship",
          documents: ["Domicile Certificate", "Sports Participation Certificate", "Income Certificate"],
          category: "government",
          status: "active",
          ageLimit: "10-25 years",
          region: "Maharashtra",
          contactEmail: "sports@maharashtra.gov.in",
          contactPhone: "+91-22-22027990"
        }
      ],
      lastUpdated: new Date().toISOString(),
      totalFound: 6
    };

    return NextResponse.json(mockScholarships);
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scholarships' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    if (action === 'refresh') {
      // Simulate AI web scraping and data collection
      console.log('Refreshing scholarship data with AI...');
      
      // In real implementation, call LLM API here
      // const response = await callLLMAPI(scholarshipPrompt);
      
      // For now, return updated mock data
      const updatedScholarships = {
        scholarships: [
          // ... updated scholarship data from AI
        ],
        lastUpdated: new Date().toISOString(),
        message: "Scholarship data refreshed successfully using AI",
        totalFound: 8 // Simulate finding new scholarships
      };

      return NextResponse.json(updatedScholarships);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in scholarship API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
}
