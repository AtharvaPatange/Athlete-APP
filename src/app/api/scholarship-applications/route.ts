import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ScholarshipApplication {
  id?: string;
  athleteId: string;
  scholarshipId: string;
  scholarshipTitle: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'interview_scheduled';
  applicationData: {
    personalInfo: {
      fullName: string;
      dateOfBirth: string;
      email: string;
      phone: string;
      address: string;
      aadharNumber?: string;
    };
    sportsInfo: {
      primarySport: string;
      secondarySports?: string[];
      achievements: string[];
      coachName?: string;
      trainingCenter?: string;
      playingExperience: string;
    };
    academicInfo: {
      currentEducation: string;
      institution: string;
      percentage: number;
      completionYear?: string;
    };
    financialInfo?: {
      familyIncome: string;
      incomeCertificate?: string;
      bankDetails?: {
        accountNumber: string;
        ifscCode: string;
        bankName: string;
      };
    };
    documents: {
      [key: string]: {
        fileName: string;
        uploadedAt: string;
        fileUrl?: string;
      };
    };
    additionalInfo?: string;
  };
  submittedAt?: Date;
  lastUpdatedAt: Date;
  reviewNotes?: string;
  interviewDate?: Date;
  rejectionReason?: string;
  approvalAmount?: string;
  trackingNumber: string;
}

const APPLICATIONS_COLLECTION = 'scholarship_applications';

// Submit new application
export async function POST(request: NextRequest) {
  try {
    const applicationData: Omit<ScholarshipApplication, 'id' | 'lastUpdatedAt' | 'trackingNumber'> = await request.json();
    
    // Generate tracking number
    const trackingNumber = `SCH-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    const docRef = await addDoc(collection(db, APPLICATIONS_COLLECTION), {
      ...applicationData,
      trackingNumber,
      lastUpdatedAt: Timestamp.now(),
      submittedAt: applicationData.status === 'submitted' ? Timestamp.now() : null
    });

    return NextResponse.json({ 
      id: docRef.id, 
      trackingNumber,
      message: 'Application submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' }, 
      { status: 500 }
    );
  }
}

// Get applications for athlete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const trackingNumber = searchParams.get('trackingNumber');

    if (trackingNumber) {
      // Get application by tracking number
      const q = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('trackingNumber', '==', trackingNumber)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      const application: ScholarshipApplication = {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate() || null,
        lastUpdatedAt: data.lastUpdatedAt.toDate(),
        interviewDate: data.interviewDate?.toDate() || null
      } as ScholarshipApplication;

      return NextResponse.json({ application });
    }

    if (!athleteId) {
      return NextResponse.json({ error: 'Athlete ID required' }, { status: 400 });
    }

    const q = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('athleteId', '==', athleteId),
      orderBy('lastUpdatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const applications: ScholarshipApplication[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate() || null,
        lastUpdatedAt: data.lastUpdatedAt.toDate(),
        interviewDate: data.interviewDate?.toDate() || null
      } as ScholarshipApplication);
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' }, 
      { status: 500 }
    );
  }
}

// Update application status (for admin/system use)
export async function PUT(request: NextRequest) {
  try {
    const { applicationId, status, reviewNotes, interviewDate, rejectionReason, approvalAmount } = await request.json();
    
    const updateData: any = {
      status,
      lastUpdatedAt: Timestamp.now()
    };

    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (interviewDate) updateData.interviewDate = Timestamp.fromDate(new Date(interviewDate));
    if (rejectionReason) updateData.rejectionReason = rejectionReason;
    if (approvalAmount) updateData.approvalAmount = approvalAmount;

    await updateDoc(doc(db, APPLICATIONS_COLLECTION, applicationId), updateData);

    return NextResponse.json({ message: 'Application updated successfully' });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' }, 
      { status: 500 }
    );
  }
}
