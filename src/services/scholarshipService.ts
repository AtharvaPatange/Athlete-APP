import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Core Types
export interface ScholarshipOpportunity {
  id: string;
  title: string;
  description: string;
  type: 'scholarship' | 'government_scheme' | 'sponsorship';
  category: string; // Sports category
  eligibility: {
    minAge: number;
    maxAge: number;
    regions: string[];
    sports: string[];
    incomeRequirement: string[];
    disabilityFlag?: boolean;
    minPerformanceScore?: number;
  };
  benefits: {
    amount: number;
    currency: string;
    type: 'one_time' | 'monthly' | 'yearly';
    additionalBenefits: string[];
  };
  provider: {
    name: string;
    type: 'government' | 'private' | 'ngo' | 'corporate';
    contact: string;
    website?: string;
  };
  applicationDeadline: Timestamp;
  maxApplicants: number;
  currentApplicants: number;
  fairnessWeighting: {
    ruralPreference: number;
    incomeWeighting: number;
    disabilityBonus: number;
    regionPriority: string[];
  };
  status: 'active' | 'closed' | 'upcoming';
  requirements: string[];
  documents: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ScholarshipApplication {
  id: string;
  opportunityId: string;
  athleteId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'waitlisted';
  appliedAt: Timestamp;
  fairnessScore: number;
  fairnessBreakdown: FairnessBreakdown;
  documents: {
    name: string;
    url: string;
    uploadedAt: Timestamp;
  }[];
  reviewNotes?: string;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

export interface FairnessBreakdown {
  baseScore: number;
  ruralBonus: number;
  incomeBonus: number;
  disabilityBonus: number;
  regionBonus: number;
  performanceScore: number;
  totalScore: number;
  explanation: string[];
  priorityRanking: number;
}

export interface AthleteEligibilityCheck {
  isEligible: boolean;
  reasons: string[];
  fairnessScore: number;
  fairnessBreakdown: FairnessBreakdown;
}

// Service Functions
export const scholarshipService = {
  // Get all active opportunities
  async getActiveOpportunities(): Promise<ScholarshipOpportunity[]> {
    try {
      // First try the optimized query with composite index
      const q = query(
        collection(db, 'scholarships'),
        where('status', '==', 'active'),
        orderBy('applicationDeadline', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScholarshipOpportunity));
    } catch (error: any) {
      // If composite index doesn't exist, fall back to simpler query
      if (error.code === 'failed-precondition') {
        console.log('Composite index not available, using fallback query...');
        try {
          const q = query(
            collection(db, 'scholarships'),
            where('status', '==', 'active')
          );
          
          const querySnapshot = await getDocs(q);
          const opportunities = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ScholarshipOpportunity));
          
          // Sort manually by application deadline
          return opportunities.sort((a, b) => 
            a.applicationDeadline.toMillis() - b.applicationDeadline.toMillis()
          );
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
      }
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  },

  // Get opportunities by type
  async getOpportunitiesByType(type: 'scholarship' | 'government_scheme' | 'sponsorship'): Promise<ScholarshipOpportunity[]> {
    try {
      // First try the optimized query with composite index
      const q = query(
        collection(db, 'scholarships'),
        where('type', '==', type),
        where('status', '==', 'active'),
        orderBy('applicationDeadline', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScholarshipOpportunity));
    } catch (error: any) {
      // If composite index doesn't exist, fall back to simpler query
      if (error.code === 'failed-precondition') {
        console.log('Composite index not available for type query, using fallback...');
        try {
          const q = query(
            collection(db, 'scholarships'),
            where('type', '==', type),
            where('status', '==', 'active')
          );
          
          const querySnapshot = await getDocs(q);
          const opportunities = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ScholarshipOpportunity));
          
          // Sort manually by application deadline
          return opportunities.sort((a, b) => 
            a.applicationDeadline.toMillis() - b.applicationDeadline.toMillis()
          );
        } catch (fallbackError) {
          console.error('Fallback type query also failed:', fallbackError);
          throw fallbackError;
        }
      }
      console.error('Error fetching opportunities by type:', error);
      throw error;
    }
  },

  // Check athlete eligibility and calculate fairness score
  async checkEligibility(opportunityId: string, athleteId: string): Promise<AthleteEligibilityCheck> {
    try {
      // Get opportunity details
      const opportunityDoc = await getDoc(doc(db, 'scholarships', opportunityId));
      if (!opportunityDoc.exists()) {
        throw new Error('Opportunity not found');
      }
      const opportunity = opportunityDoc.data() as ScholarshipOpportunity;

      // Get athlete profile
      const athleteDoc = await getDoc(doc(db, 'users', athleteId));
      if (!athleteDoc.exists()) {
        throw new Error('Athlete profile not found');
      }
      const athlete = athleteDoc.data();

      // Check eligibility based on age only
      const eligibilityReasons: string[] = [];
      let isEligible = true;

      // Age check - only criteria for eligibility
      if (athlete.age < opportunity.eligibility.minAge || athlete.age > opportunity.eligibility.maxAge) {
        eligibilityReasons.push(`Age must be between ${opportunity.eligibility.minAge} and ${opportunity.eligibility.maxAge}`);
        isEligible = false;
      }

      // Calculate fairness score
      const fairnessScore = await this.calculateFairnessScore(opportunity, athlete);

      return {
        isEligible,
        reasons: eligibilityReasons,
        fairnessScore: fairnessScore.totalScore,
        fairnessBreakdown: fairnessScore
      };
    } catch (error) {
      console.error('Error checking eligibility:', error);
      throw error;
    }
  },

  // Calculate fairness score for an athlete
  async calculateFairnessScore(opportunity: ScholarshipOpportunity, athlete: any): Promise<FairnessBreakdown> {
    let baseScore = 50; // Base score for all applicants
    let ruralBonus = 0;
    let incomeBonus = 0;
    let disabilityBonus = 0;
    let regionBonus = 0;
    let performanceScore = 20; // Placeholder - could integrate with performance data
    
    const explanation: string[] = [];

    // Rural preference bonus
    const ruralRegions = ['Rural', 'Village', 'Small Town'];
    if (ruralRegions.some(region => athlete.region.includes(region))) {
      ruralBonus = opportunity.fairnessWeighting.ruralPreference;
      explanation.push(`+${ruralBonus} points for rural background (promoting rural development)`);
    }

    // Income-based bonus
    const incomeMapping: { [key: string]: number } = {
      'Below 1 Lakh': 25,
      '1-3 Lakhs': 20,
      '3-5 Lakhs': 15,
      '5-10 Lakhs': 10,
      '10-20 Lakhs': 5,
      'Above 20 Lakhs': 0
    };
    incomeBonus = (incomeMapping[athlete.income_band] || 0) * (opportunity.fairnessWeighting.incomeWeighting / 100);
    if (incomeBonus > 0) {
      explanation.push(`+${incomeBonus} points for income category (${athlete.income_band})`);
    }

    // Disability bonus
    if (athlete.disability_flag) {
      disabilityBonus = opportunity.fairnessWeighting.disabilityBonus;
      explanation.push(`+${disabilityBonus} points for disability inclusion`);
    }

    // Region priority bonus
    if (opportunity.fairnessWeighting.regionPriority.includes(athlete.region)) {
      regionBonus = 10;
      explanation.push(`+${regionBonus} points for priority region (${athlete.region})`);
    }

    const totalScore = baseScore + ruralBonus + incomeBonus + disabilityBonus + regionBonus + performanceScore;

    return {
      baseScore,
      ruralBonus,
      incomeBonus,
      disabilityBonus,
      regionBonus,
      performanceScore,
      totalScore,
      explanation,
      priorityRanking: 0 // Will be calculated when ranking all applicants
    };
  },

  // Submit application
  async submitApplication(opportunityId: string, athleteId: string): Promise<string> {
    try {
      // Check if already applied
      const existingQuery = query(
        collection(db, 'scholarship_applications'),
        where('opportunityId', '==', opportunityId),
        where('athleteId', '==', athleteId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        throw new Error('You have already applied for this opportunity');
      }

      // Get eligibility check for fairness score
      const eligibilityCheck = await this.checkEligibility(opportunityId, athleteId);

      // Create application
      const applicationData: Omit<ScholarshipApplication, 'id'> = {
        opportunityId,
        athleteId,
        status: 'pending',
        appliedAt: Timestamp.now(),
        fairnessScore: eligibilityCheck.fairnessScore,
        fairnessBreakdown: eligibilityCheck.fairnessBreakdown,
        documents: []
      };

      const docRef = await addDoc(collection(db, 'scholarship_applications'), applicationData);

      // Update opportunity applicant count
      const opportunityRef = doc(db, 'scholarships', opportunityId);
      const opportunityDoc = await getDoc(opportunityRef);
      if (opportunityDoc.exists()) {
        const currentCount = opportunityDoc.data().currentApplicants || 0;
        await updateDoc(opportunityRef, {
          currentApplicants: currentCount + 1
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  },

  // Get athlete's applications
  async getAthleteApplications(athleteId: string): Promise<(ScholarshipApplication & { opportunity: ScholarshipOpportunity })[]> {
    try {
      // Use simple query without ordering to avoid index requirement
      const q = query(
        collection(db, 'scholarship_applications'),
        where('athleteId', '==', athleteId)
      );
      
      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScholarshipApplication));

      // Sort in memory instead of in query
      applications.sort((a, b) => b.appliedAt.toMillis() - a.appliedAt.toMillis());

      // Get opportunity details for each application
      const applicationsWithOpportunities = await Promise.all(
        applications.map(async (application) => {
          const opportunityDoc = await getDoc(doc(db, 'scholarships', application.opportunityId));
          const opportunity = opportunityDoc.exists() ? 
            { id: opportunityDoc.id, ...opportunityDoc.data() } as ScholarshipOpportunity : 
            null;
          return {
            ...application,
            opportunity: opportunity!
          };
        })
      );

      return applicationsWithOpportunities.filter(app => app.opportunity);
    } catch (error) {
      console.error('Error fetching athlete applications:', error);
      // Return empty array instead of throwing to allow UI to show empty state
      return [];
    }
  },

  // Get applications for an opportunity (for admin/review)
  async getOpportunityApplications(opportunityId: string): Promise<(ScholarshipApplication & { athlete: any })[]> {
    try {
      // Use simple query without ordering to avoid index requirement
      const q = query(
        collection(db, 'scholarship_applications'),
        where('opportunityId', '==', opportunityId)
      );
      
      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScholarshipApplication));

      // Sort by fairness score in memory
      applications.sort((a, b) => b.fairnessScore - a.fairnessScore);

      // Get athlete details for each application
      const applicationsWithAthletes = await Promise.all(
        applications.map(async (application, index) => {
          const athleteDoc = await getDoc(doc(db, 'users', application.athleteId));
          const athlete = athleteDoc.exists() ? athleteDoc.data() : null;
          
          // Update priority ranking
          application.fairnessBreakdown.priorityRanking = index + 1;
          
          return {
            ...application,
            athlete
          };
        })
      );

      return applicationsWithAthletes.filter(app => app.athlete);
    } catch (error) {
      console.error('Error fetching opportunity applications:', error);
      return [];
    }
  },

  // Create sample opportunities (for testing)
  // Removed createSampleOpportunities - only admin-created scholarships will be shown,

  // Method to clear all existing scholarships (admin use only)
  async clearAllScholarships(): Promise<void> {
    try {
      const scholarshipsRef = collection(db, 'scholarships');
      const snapshot = await getDocs(scholarshipsRef);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`Cleared ${snapshot.docs.length} existing scholarships`);
    } catch (error) {
      console.error('Error clearing scholarships:', error);
      throw error;
    }
  }
};
