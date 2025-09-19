import { collection, query, where, getDocs, doc, updateDoc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CoachInfo {
  id: string;
  name: string;
  email: string;
  region: string;
  availability_status: 'available' | 'unavailable';
  assigned_athletes: string[];
  specialization?: string;
  experience_years?: number;
  rating?: number;
}

export interface AthleteCoachAssignment {
  athleteId: string;
  athleteName: string;
  assignedCoach: CoachInfo | null;
  assignmentDate: Date | null;
  region: string;
}

/**
 * Get coach information for a specific athlete
 */
export const getAthleteAssignedCoach = async (athleteId: string): Promise<{
  success: boolean;
  coachInfo: CoachInfo | null;
  assignmentDate: Date | null;
  error?: string;
}> => {
  try {
    // Get athlete document to find assigned coach
    const athleteDoc = await getDoc(doc(db, "users", athleteId));
    
    if (!athleteDoc.exists()) {
      return { success: false, coachInfo: null, assignmentDate: null, error: "Athlete not found" };
    }

    const athleteData = athleteDoc.data();
    const assignedCoachId = athleteData.assigned_coach;
    const assignmentDate = athleteData.coach_assignment_date?.toDate() || null;

    if (!assignedCoachId) {
      return { success: true, coachInfo: null, assignmentDate: null };
    }

    // Get coach information
    const coachDoc = await getDoc(doc(db, "users", assignedCoachId));
    
    if (!coachDoc.exists()) {
      return { success: false, coachInfo: null, assignmentDate: null, error: "Assigned coach not found" };
    }

    const coachData = coachDoc.data();
    const coachInfo: CoachInfo = {
      id: assignedCoachId,
      name: coachData.name,
      email: coachData.email,
      region: coachData.region,
      availability_status: coachData.availability_status || 'unavailable',
      assigned_athletes: coachData.assigned_athletes || [],
      specialization: coachData.specialization,
      experience_years: coachData.experience_years,
      rating: coachData.rating
    };

    return { success: true, coachInfo, assignmentDate };
  } catch (error: any) {
    console.error("Error getting athlete assigned coach:", error);
    return { success: false, coachInfo: null, assignmentDate: null, error: error.message };
  }
};

/**
 * Find available coaches in a specific region
 */
export const getAvailableCoachesInRegion = async (region: string): Promise<{
  success: boolean;
  coaches: CoachInfo[];
  error?: string;
}> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("role", "==", "coach"),
      where("region", "==", region),
      where("availability_status", "==", "available")
    );

    const snapshot = await getDocs(q);
    const coaches: CoachInfo[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      coaches.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        region: data.region,
        availability_status: data.availability_status,
        assigned_athletes: data.assigned_athletes || [],
        specialization: data.specialization,
        experience_years: data.experience_years,
        rating: data.rating
      });
    });

    // Sort coaches by least assigned athletes first, then by rating
    coaches.sort((a, b) => {
      const assignedCountDiff = a.assigned_athletes.length - b.assigned_athletes.length;
      if (assignedCountDiff !== 0) return assignedCountDiff;
      return (b.rating || 0) - (a.rating || 0);
    });

    return { success: true, coaches };
  } catch (error: any) {
    console.error("Error getting available coaches in region:", error);
    return { success: false, coaches: [], error: error.message };
  }
};

/**
 * Reassign an athlete to a new available coach in their region
 */
export const reassignAthleteToAvailableCoach = async (athleteId: string): Promise<{
  success: boolean;
  newCoach: CoachInfo | null;
  error?: string;
}> => {
  try {
    // Get athlete info
    const athleteDoc = await getDoc(doc(db, "users", athleteId));
    if (!athleteDoc.exists()) {
      return { success: false, newCoach: null, error: "Athlete not found" };
    }

    const athleteData = athleteDoc.data();
    const athleteRegion = athleteData.region;
    const currentCoachId = athleteData.assigned_coach;

    // Get available coaches in the athlete's region
    const availableCoachesResult = await getAvailableCoachesInRegion(athleteRegion);
    if (!availableCoachesResult.success || availableCoachesResult.coaches.length === 0) {
      return { success: false, newCoach: null, error: "No available coaches found in region" };
    }

    // Find a coach with capacity (less than 3 athletes)
    const availableCoach = availableCoachesResult.coaches.find(coach => 
      coach.assigned_athletes.length < 3 && coach.id !== currentCoachId
    );

    if (!availableCoach) {
      return { success: false, newCoach: null, error: "No coaches with capacity found in region" };
    }

    // Use batch write for atomic updates
    const batch = writeBatch(db);

    // Update athlete document
    const athleteRef = doc(db, "users", athleteId);
    batch.update(athleteRef, {
      assigned_coach: availableCoach.id,
      coach_assignment_date: new Date()
    });

    // Update new coach document
    const newCoachRef = doc(db, "users", availableCoach.id);
    const updatedAthletes = [...availableCoach.assigned_athletes, athleteId];
    batch.update(newCoachRef, {
      assigned_athletes: updatedAthletes
    });

    // If there was a previous coach, remove this athlete from their list
    if (currentCoachId) {
      try {
        const currentCoachDoc = await getDoc(doc(db, "users", currentCoachId));
        if (currentCoachDoc.exists()) {
          const currentCoachData = currentCoachDoc.data();
          const currentCoachAthletes = (currentCoachData.assigned_athletes || []).filter(
            (id: string) => id !== athleteId
          );
          
          const currentCoachRef = doc(db, "users", currentCoachId);
          batch.update(currentCoachRef, {
            assigned_athletes: currentCoachAthletes
          });
        }
      } catch (error) {
        console.warn("Error removing athlete from previous coach:", error);
      }
    }

    // Commit the batch
    await batch.commit();

    // Return updated coach info
    const updatedCoachInfo: CoachInfo = {
      ...availableCoach,
      assigned_athletes: updatedAthletes
    };

    return { success: true, newCoach: updatedCoachInfo };
  } catch (error: any) {
    console.error("Error reassigning athlete to available coach:", error);
    return { success: false, newCoach: null, error: error.message };
  }
};

/**
 * Check and reassign athletes of unavailable coaches in a region
 */
export const checkAndReassignAthletesOfUnavailableCoaches = async (region: string): Promise<{
  success: boolean;
  reassignedCount: number;
  error?: string;
}> => {
  try {
    // Get all coaches in the region
    const coachesRef = collection(db, "users");
    const coachQuery = query(
      coachesRef,
      where("role", "==", "coach"),
      where("region", "==", region)
    );

    const coachSnapshot = await getDocs(coachQuery);
    let reassignedCount = 0;

    // Find unavailable coaches with assigned athletes
    const unavailableCoaches: string[] = [];
    const athletesToReassign: string[] = [];

    coachSnapshot.forEach(doc => {
      const coachData = doc.data();
      if (coachData.availability_status === 'unavailable' && 
          coachData.assigned_athletes && 
          coachData.assigned_athletes.length > 0) {
        unavailableCoaches.push(doc.id);
        athletesToReassign.push(...coachData.assigned_athletes);
      }
    });

    // Reassign each athlete
    for (const athleteId of athletesToReassign) {
      try {
        const result = await reassignAthleteToAvailableCoach(athleteId);
        if (result.success) {
          reassignedCount++;
        }
      } catch (error) {
        console.warn(`Failed to reassign athlete ${athleteId}:`, error);
      }
    }

    return { success: true, reassignedCount };
  } catch (error: any) {
    console.error("Error checking and reassigning athletes:", error);
    return { success: false, reassignedCount: 0, error: error.message };
  }
};

/**
 * Get all athletes and their coach assignments in a region
 */
export const getRegionAthleteCoachAssignments = async (region: string): Promise<{
  success: boolean;
  assignments: AthleteCoachAssignment[];
  error?: string;
}> => {
  try {
    const usersRef = collection(db, "users");
    const athleteQuery = query(
      usersRef,
      where("role", "==", "athlete"),
      where("region", "==", region)
    );

    const snapshot = await getDocs(athleteQuery);
    const assignments: AthleteCoachAssignment[] = [];

    for (const doc of snapshot.docs) {
      const athleteData = doc.data();
      let coachInfo: CoachInfo | null = null;

      if (athleteData.assigned_coach) {
        const coachResult = await getAthleteAssignedCoach(doc.id);
        coachInfo = coachResult.coachInfo;
      }

      assignments.push({
        athleteId: doc.id,
        athleteName: athleteData.name,
        assignedCoach: coachInfo,
        assignmentDate: athleteData.coach_assignment_date?.toDate() || null,
        region: athleteData.region
      });
    }

    return { success: true, assignments };
  } catch (error: any) {
    console.error("Error getting region athlete coach assignments:", error);
    return { success: false, assignments: [], error: error.message };
  }
};
