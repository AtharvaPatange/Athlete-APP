import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SeedOpportunity {
  title: string;
  description: string;
  amount: number;
  eligibleRegions: string[];
  maxApplicants: number;
  deadline: Date;
  eligibleSports: string[];
  requirements: string[];
  isActive: boolean;
}

export const seedTransparencyData = async () => {
  try {
    // Check if data already exists
    const existingOpportunities = await getDocs(collection(db, 'scholarship_opportunities'));
    if (existingOpportunities.size > 0) {
      console.log('Transparency data already exists');
      return;
    }

    // Sample scholarship opportunities based on real Indian government schemes
    const opportunities: SeedOpportunity[] = [
      {
        title: "Khelo India Scholarship Scheme",
        description: "Government of India's flagship program to support promising young athletes across all disciplines",
        amount: 500000,
        eligibleRegions: ["All States"],
        maxApplicants: 1000,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        eligibleSports: ["All Olympic Sports", "Cricket", "Football", "Hockey"],
        requirements: ["Age 8-25", "State/National level participation", "AADHAR card"],
        isActive: true
      },
      {
        title: "SAI Training Centre Scholarship",
        description: "Sports Authority of India scholarship for elite training at national centers",
        amount: 750000,
        eligibleRegions: ["Delhi", "Mumbai", "Bangalore", "Kolkata", "Chennai"],
        maxApplicants: 150,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        eligibleSports: ["Athletics", "Swimming", "Weightlifting", "Boxing", "Wrestling"],
        requirements: ["National level representation", "Age 16-28", "Medical fitness certificate"],
        isActive: true
      },
      {
        title: "Reliance Foundation Youth Sports",
        description: "Private foundation supporting grassroots and elite sports development across India",
        amount: 300000,
        eligibleRegions: ["Maharashtra", "Gujarat", "Rajasthan", "Haryana"],
        maxApplicants: 200,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        eligibleSports: ["Football", "Cricket", "Athletics", "Swimming", "Badminton"],
        requirements: ["Age 12-23", "School/College athlete", "Coach recommendation"],
        isActive: true
      },
      {
        title: "Tata Steel Adventure Foundation",
        description: "Supporting adventure and outdoor sports athletes, especially from tribal and rural areas",
        amount: 400000,
        eligibleRegions: ["Jharkhand", "Odisha", "Chhattisgarh", "West Bengal"],
        maxApplicants: 75,
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        eligibleSports: ["Archery", "Rock Climbing", "Mountaineering", "Cycling"],
        requirements: ["Tribal/Rural background preferred", "Adventure sports participation"],
        isActive: true
      },
      {
        title: "JSW Sports Excellence Program",
        description: "Corporate scholarship program focusing on Olympic sports and medal prospects",
        amount: 1000000,
        eligibleRegions: ["Karnataka", "Haryana", "Goa", "Himachal Pradesh"],
        maxApplicants: 50,
        deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        eligibleSports: ["Wrestling", "Boxing", "Shooting", "Badminton", "Table Tennis"],
        requirements: ["International level participation", "Medal prospect assessment"],
        isActive: true
      },
      {
        title: "ONGC Sports Scholarship",
        description: "Oil and Natural Gas Corporation scholarship for petroleum sector employees' children",
        amount: 250000,
        eligibleRegions: ["All States"],
        maxApplicants: 100,
        deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        eligibleSports: ["All Sports"],
        requirements: ["ONGC employee ward", "State level participation", "Academic merit"],
        isActive: true
      },
      {
        title: "Inspire Institute of Sport Fellowship",
        description: "World-class training and education program for elite Indian athletes",
        amount: 1200000,
        eligibleRegions: ["Karnataka", "Haryana", "Goa"],
        maxApplicants: 30,
        deadline: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
        eligibleSports: ["Athletics", "Swimming", "Cycling", "Wrestling", "Boxing"],
        requirements: ["Junior national medalist", "English proficiency", "Full-time commitment"],
        isActive: true
      },
      {
        title: "Mission Olympic Cell Scholarship",
        description: "Government scheme specifically for potential Olympic and Paralympic medalists",
        amount: 2000000,
        eligibleRegions: ["All States"],
        maxApplicants: 25,
        deadline: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
        eligibleSports: ["Olympic Sports", "Paralympic Sports"],
        requirements: ["Top 8 world ranking potential", "Scientific support needs assessment"],
        isActive: true
      },
      {
        title: "Rajiv Gandhi Khel Ratna Preparatory Scheme",
        description: "State government scheme preparing athletes for highest sporting honors",
        amount: 800000,
        eligibleRegions: ["Haryana", "Punjab", "Kerala", "Karnataka"],
        maxApplicants: 40,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        eligibleSports: ["All Olympic Sports"],
        requirements: ["Senior national medalist", "International competition participation"],
        isActive: true
      },
      {
        title: "Tribal Sports Excellence Initiative",
        description: "Special program for athletes from Scheduled Tribes with reservation benefits",
        amount: 350000,
        eligibleRegions: ["Jharkhand", "Odisha", "Madhya Pradesh", "Rajasthan"],
        maxApplicants: 120,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        eligibleSports: ["Archery", "Athletics", "Wrestling", "Hockey"],
        requirements: ["ST certificate", "District level participation", "Rural background"],
        isActive: true
      }
    ];

    // Add opportunities to Firestore
    for (const opportunity of opportunities) {
      await addDoc(collection(db, 'scholarship_opportunities'), opportunity);
    }

    console.log('✅ Transparency seed data created successfully!');
    console.log(`📊 Added ${opportunities.length} scholarship opportunities`);
    
  } catch (error) {
    console.error('❌ Error seeding transparency data:', error);
  }
};

// Helper function to generate mock applications
export const generateMockApplications = async () => {
  try {
    // Get all opportunities
    const opportunitiesSnapshot = await getDocs(collection(db, 'scholarship_opportunities'));
    const opportunities = opportunitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    if (opportunities.length === 0) {
      console.log('No opportunities found. Run seedTransparencyData first.');
      return;
    }

    // Mock athlete profiles for applications - realistic Indian athletes
    const mockAthletes = [
      { id: 'athlete1', name: 'Priya Sharma', region: 'Haryana', isRural: true, income: 'Low', sport: 'Wrestling', category: 'General' },
      { id: 'athlete2', name: 'Arjun Patel', region: 'Gujarat', isRural: false, income: 'Medium', sport: 'Cricket', category: 'OBC' },
      { id: 'athlete3', name: 'Kavitha Naidu', region: 'Karnataka', isRural: true, income: 'Low', sport: 'Badminton', category: 'General' },
      { id: 'athlete4', name: 'Ravi Kumar', region: 'Kerala', isRural: false, income: 'High', sport: 'Swimming', category: 'General' },
      { id: 'athlete5', name: 'Sunita Munda', region: 'Jharkhand', isRural: true, income: 'Low', sport: 'Archery', category: 'ST' },
      { id: 'athlete6', name: 'Vikram Singh', region: 'Punjab', isRural: true, income: 'Medium', sport: 'Hockey', category: 'General' },
      { id: 'athlete7', name: 'Asha Devi', region: 'Rajasthan', isRural: true, income: 'Low', sport: 'Athletics', category: 'SC' },
      { id: 'athlete8', name: 'Mohammad Ali', region: 'West Bengal', isRural: false, income: 'Low', sport: 'Boxing', category: 'OBC' },
      { id: 'athlete9', name: 'Deepika Reddy', region: 'Andhra Pradesh', isRural: false, income: 'Medium', sport: 'Shooting', category: 'General' },
      { id: 'athlete10', name: 'Lakshmi Nair', region: 'Tamil Nadu', isRural: true, income: 'Low', sport: 'Weightlifting', category: 'OBC' },
      { id: 'athlete11', name: 'Rahul Yadav', region: 'Uttar Pradesh', isRural: true, income: 'Low', sport: 'Wrestling', category: 'OBC' },
      { id: 'athlete12', name: 'Pooja Kumari', region: 'Bihar', isRural: true, income: 'Low', sport: 'Athletics', category: 'SC' },
      { id: 'athlete13', name: 'Kiran Bedi', region: 'Delhi', isRural: false, income: 'High', sport: 'Table Tennis', category: 'General' },
      { id: 'athlete14', name: 'Tribhuvan Singh', region: 'Odisha', isRural: true, income: 'Low', sport: 'Hockey', category: 'ST' },
      { id: 'athlete15', name: 'Manisha Devi', region: 'Himachal Pradesh', isRural: true, income: 'Medium', sport: 'Skiing', category: 'General' }
    ];

    // Generate applications for each opportunity
    for (const opportunity of opportunities) {
      const numApplications = Math.floor(Math.random() * 50) + 20; // 20-70 applications per opportunity
      
      for (let i = 0; i < numApplications; i++) {
        const athlete = mockAthletes[Math.floor(Math.random() * mockAthletes.length)];
        
        // Calculate fairness score based on athlete profile (Indian context)
        const ruralScore = athlete.isRural ? 0.2 : 0.05;
        const incomeScore = athlete.income === 'Low' ? 0.25 : athlete.income === 'Medium' ? 0.15 : 0.05;
        const performanceScore = Math.random() * 0.3 + 0.1; // Random performance 0.1-0.4
        const regionalScore = opportunity.eligibleRegions?.includes(athlete.region) || opportunity.eligibleRegions?.includes('All States') ? 0.15 : 0.05;
        const categoryScore = athlete.category === 'ST' ? 0.1 : athlete.category === 'SC' ? 0.08 : athlete.category === 'OBC' ? 0.06 : 0.02;
        
        const fairnessScore = (ruralScore + incomeScore + performanceScore + regionalScore + categoryScore) * 100;
        
        const application = {
          opportunityId: opportunity.id,
          athleteId: athlete.id,
          athleteName: athlete.name,
          appliedAt: new Date(),
          status: 'pending',
          fairnessScore: Math.round(fairnessScore),
          fairnessBreakdown: {
            ruralBackground: ruralScore * 100,
            economicStatus: incomeScore * 100,
            performanceMetrics: performanceScore * 100,
            regionalRepresentation: regionalScore * 100,
            categoryReservation: categoryScore * 100,
            priorityRanking: 0 // Will be calculated later
          }
        };

        await addDoc(collection(db, 'scholarship_applications'), application);
      }
    }

    console.log('✅ Mock applications generated successfully!');
    
  } catch (error) {
    console.error('❌ Error generating mock applications:', error);
  }
};
