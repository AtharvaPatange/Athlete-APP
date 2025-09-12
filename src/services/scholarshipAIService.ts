import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Scholarship {
  id?: string;
  title: string;
  provider: string;
  amount: string;
  eligibility: string[];
  sports: string[];
  deadline: string;
  description: string;
  applicationUrl: string;
  documents: string[];
  category: 'government' | 'private' | 'corporate';
  status: 'active' | 'closed' | 'upcoming';
  ageLimit: string;
  region: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: Date;
  updatedAt: Date;
  aiGenerated?: boolean;
  lastAIUpdate?: Date;
}

const SCHOLARSHIPS_COLLECTION = 'scholarships';

// Scholarship CRUD Operations
export const createScholarship = async (scholarshipData: Omit<Scholarship, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, SCHOLARSHIPS_COLLECTION), {
      ...scholarshipData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return { id: docRef.id, success: true, error: null };
  } catch (error: any) {
    return { id: null, success: false, error: error.message };
  }
};

export const getScholarships = async (filters?: {
  category?: string;
  sport?: string;
  region?: string;
  status?: string;
  limit?: number;
}) => {
  try {
    const baseCollection = collection(db, SCHOLARSHIPS_COLLECTION);
    const queryConstraints: any[] = [];
    
    // Apply filters if provided
    if (filters?.category) {
      queryConstraints.push(where('category', '==', filters.category));
    }
    if (filters?.status) {
      queryConstraints.push(where('status', '==', filters.status));
    }
    
    // Add ordering and limit
    queryConstraints.push(orderBy('updatedAt', 'desc'));
    if (filters?.limit) {
      queryConstraints.push(limit(filters.limit));
    }
    
    const q = query(baseCollection, ...queryConstraints);
    
    const snapshot = await getDocs(q);
    const scholarships: Scholarship[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      scholarships.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        lastAIUpdate: data.lastAIUpdate?.toDate() || null
      } as Scholarship);
    });
    
    // Apply client-side filters for arrays (sports, region)
    let filteredScholarships = scholarships;
    
    if (filters?.sport) {
      filteredScholarships = scholarships.filter(s => 
        (s.sports || []).some(sport => 
          sport.toLowerCase().includes(filters.sport!.toLowerCase())
        )
      );
    }
    
    if (filters?.region && filters.region !== 'Pan India') {
      filteredScholarships = filteredScholarships.filter(s => 
        s.region.toLowerCase().includes(filters.region!.toLowerCase()) || 
        s.region === 'Pan India'
      );
    }
    
    return { scholarships: filteredScholarships, success: true, error: null };
  } catch (error: any) {
    return { scholarships: [], success: false, error: error.message };
  }
};

export const updateScholarship = async (scholarshipId: string, updates: Partial<Scholarship>) => {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    
    if (updates.lastAIUpdate) {
      updateData.lastAIUpdate = Timestamp.fromDate(updates.lastAIUpdate);
    }
    
    await updateDoc(doc(db, SCHOLARSHIPS_COLLECTION, scholarshipId), updateData);
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const refreshScholarshipsWithAI = async () => {
  try {
    // Call the AI API to get fresh scholarship data
    const response = await fetch('/api/ai/scholarships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh' })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch AI scholarship data');
    }
    
    const aiData = await response.json();
    
    // Update existing scholarships or create new ones
    const updatePromises = aiData.scholarships.map(async (scholarship: any) => {
      // Check if scholarship already exists
      const existingQuery = query(
        collection(db, SCHOLARSHIPS_COLLECTION),
        where('title', '==', scholarship.title),
        where('provider', '==', scholarship.provider)
      );
      
      const existing = await getDocs(existingQuery);
      
      const scholarshipData = {
        ...scholarship,
        aiGenerated: true,
        lastAIUpdate: new Date(),
        updatedAt: new Date()
      };
      
      if (existing.empty) {
        // Create new scholarship
        return createScholarship(scholarshipData);
      } else {
        // Update existing scholarship
        const docId = existing.docs[0].id;
        return updateScholarship(docId, scholarshipData);
      }
    });
    
    await Promise.all(updatePromises);
    
    return { 
      success: true, 
      error: null, 
      message: `Updated ${aiData.scholarships.length} scholarships`,
      lastUpdated: new Date()
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Application tracking utilities
export const generateApplicationForm = (scholarship: Scholarship) => {
  return {
    requiredFields: {
      personalInfo: ['fullName', 'dateOfBirth', 'email', 'phone', 'address'],
      sportsInfo: ['primarySport', 'achievements', 'playingExperience'],
      academicInfo: ['currentEducation', 'institution', 'percentage'],
      documents: scholarship.documents
    },
    optionalFields: {
      financialInfo: scholarship.category === 'government' ? ['familyIncome'] : [],
      additionalInfo: ['additionalInfo']
    },
    validationRules: {
      email: 'email',
      phone: 'phone',
      ageLimit: scholarship.ageLimit,
      eligibleSports: scholarship.sports,
      deadline: scholarship.deadline
    }
  };
};

export const validateApplication = (applicationData: any, scholarship: Scholarship) => {
  const errors: string[] = [];
  
  // Check deadline
  const deadline = new Date(scholarship.deadline);
  if (new Date() > deadline) {
    errors.push('Application deadline has passed');
  }
  
  // Check age limit if provided
  if (scholarship.ageLimit && applicationData.personalInfo?.dateOfBirth) {
    const age = new Date().getFullYear() - new Date(applicationData.personalInfo.dateOfBirth).getFullYear();
    const [minAge, maxAge] = scholarship.ageLimit.split('-').map(a => parseInt(a.trim()));
    
    if (age < minAge || age > maxAge) {
      errors.push(`Age must be between ${minAge} and ${maxAge} years`);
    }
  }
  
  // Check sport eligibility
  if (scholarship.sports.length > 0 && !scholarship.sports.includes('All Olympic Sports')) {
    const applicantSport = applicationData.sportsInfo?.primarySport;
    if (!scholarship.sports.includes(applicantSport)) {
      errors.push(`This scholarship is only for: ${scholarship.sports.join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
