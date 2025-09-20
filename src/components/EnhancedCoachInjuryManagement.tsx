"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from "firebase/firestore";
import { 
  getAthleteInjuries, 
  getRecoveryMilestones, 
  getRecoveryProgress, 
  calculateRecoveryProgress,
  getCoachAssignedAthletesInjuries,
  getMultipleAthleteRecoveryData,
  getAthletesRequestingVerification,
  getRegionalActiveInjuries,
  getAthleteAchievements,
  getInjuriesNeedingVerification,
  verifyInjuryByCoach
} from "@/services/injuryService";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Activity, 
  Calendar, 
  User,
  FileText,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Target,
  Award,
  UserCheck,
  Camera,
  AlertCircle,
  RotateCcw,
  Zap
} from "lucide-react";

interface InjuryAlert {
  id: string;
  athleteId: string;
  athleteName: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskFactors: string[];
  recommendation: string;
  timestamp: any;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface Athlete {
  id: string;
  name: string;
  region: string;
  performance?: {
    speed: number;
    strength: number;
    endurance: number;
  };
  // Injury-related data
  injuries?: any[]; // Current active injuries from injuries collection
  recent_injuries?: any[];
  injury_risk?: 'high' | 'medium' | 'low';
  injury_status?: 'injured' | 'recovering' | 'healthy';
  injury_severity?: 'minor' | 'moderate' | 'severe' | 'critical';
  recovery_progress?: number; // 0-100
  recovery_start_date?: string;
  estimated_return_date?: string;
  injury_type?: string;
  medical_notes?: string;
  coach_verification_status?: 'pending' | 'verified' | 'not_required';
  coach_verification_date?: string;
  recovery_verification_requested?: boolean;
  // Achievement data
  achievements?: {
    totalChallenges: number;
    completedChallenges: number;
    totalPoints: number;
    achievements: any[];
    recentActivity: any[];
    currentTier?: string;
    tierProgress?: number;
  };
  // Priority score for sorting
  priorityScore?: number;
  lastActiveAt?: any;
}

interface EnhancedCoachInjuryManagementProps {
  coachRegion: string;
  coachId: string;
  assignedAthletes?: string[];
  availabilityStatus?: 'available' | 'unavailable';
}

const EnhancedCoachInjuryManagement = ({ 
  coachRegion, 
  coachId, 
  assignedAthletes = [], 
  availabilityStatus = 'unavailable' 
}: EnhancedCoachInjuryManagementProps) => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [injuryAlerts, setInjuryAlerts] = useState<InjuryAlert[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedAthleteReport, setSelectedAthleteReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [confirmingVerification, setConfirmingVerification] = useState<{athleteId: string, verified: boolean, athleteName: string} | null>(null);

  // Calculate injury risk based on multiple factors
  const calculateInjuryRisk = (athlete: Athlete): { risk: 'high' | 'medium' | 'low', factors: string[] } => {
    const factors: string[] = [];
    let riskScore = 0;

    // Current active injuries
    if (athlete.injuries && athlete.injuries.length > 0) {
      const activeCount = athlete.injuries.length;
      riskScore += activeCount * 3;
      factors.push(`${activeCount} active injury${activeCount > 1 ? 'ies' : ''}`);
      
      // Add severity factor
      const severeInjuries = athlete.injuries.filter(injury => injury.severity === 'severe' || injury.severity === 'critical');
      if (severeInjuries.length > 0) {
        riskScore += 2;
        factors.push('Severe injury present');
      }
    }

    // Recovery progress for current injuries
    if (athlete.injury_status === 'recovering' && athlete.recovery_progress !== undefined) {
      if (athlete.recovery_progress < 50) {
        riskScore += 2;
        factors.push('Early recovery stage');
      } else if (athlete.recovery_progress < 80) {
        riskScore += 1;
        factors.push('Mid recovery stage');
      }
    }

    // Recent injuries
    if (athlete.recent_injuries && athlete.recent_injuries.length > 0) {
      riskScore += athlete.recent_injuries.length * 1;
      factors.push(`${athlete.recent_injuries.length} recent injuries`);
    }

    // Performance indicators
    if (athlete.performance) {
      const { speed, strength, endurance } = athlete.performance;
      const avgPerformance = (speed + strength + endurance) / 3;
      
      if (avgPerformance < 4) {
        riskScore += 3;
        factors.push('Low overall performance');
      } else if (avgPerformance < 6) {
        riskScore += 1;
        factors.push('Moderate performance concerns');
      }

      // Imbalanced performance
      const maxPerf = Math.max(speed, strength, endurance);
      const minPerf = Math.min(speed, strength, endurance);
      if (maxPerf - minPerf > 4) {
        riskScore += 2;
        factors.push('Performance imbalance detected');
      }
    }

    // Activity level
    const lastActive = athlete.lastActiveAt?.toDate ? athlete.lastActiveAt.toDate() : new Date(athlete.lastActiveAt || 0);
    const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    // Determine risk level
    let risk: 'high' | 'medium' | 'low';
    if (riskScore >= 8) risk = 'high';
    else if (riskScore >= 4) risk = 'medium';
    else risk = 'low';

    return { risk, factors };
  };

  // Calculate priority score with injury priority
  const calculatePriorityScore = (athlete: Athlete): number => {
    let score = 0;

    // HIGHEST PRIORITY: Active injuries (injury takes precedence over everything)
    if (athlete.injuries && athlete.injuries.length > 0) {
      score += 1000; // Base high priority for any injury
      
      // Add more points for severe injuries
      athlete.injuries.forEach(injury => {
        switch (injury.severity) {
          case 'critical':
            score += 500;
            break;
          case 'severe':
            score += 300;
            break;
          case 'moderate':
            score += 200;
            break;
          case 'minor':
            score += 100;
            break;
        }
      });
      
      // Add points for recovery status
      if (athlete.injury_status === 'injured') {
        score += 200;
      } else if (athlete.injury_status === 'recovering') {
        score += 150;
      }
      
      // Add points for slow recovery progress
      if (athlete.recovery_progress !== undefined && athlete.recovery_progress < 50) {
        score += 100;
      }
      
      // Add points for verification requests
      if (athlete.recovery_verification_requested) {
        score += 250;
      }
    }
    
    // SECONDARY PRIORITY: Performance and activity concerns
    if (athlete.performance) {
      const avgPerf = (athlete.performance.speed + athlete.performance.strength + athlete.performance.endurance) / 3;
      if (avgPerf < 4) {
        score += 80;
      } else if (avgPerf < 6) {
        score += 40;
      }
    }
    
    // Activity level
    const lastActive = athlete.lastActiveAt?.toDate ? athlete.lastActiveAt.toDate() : new Date(athlete.lastActiveAt || 0);
    const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceActive > 14) {
      score += 60;
    } else if (daysSinceActive > 7) {
      score += 30;
    }

    // LOWEST PRIORITY: Achievement and engagement factors
    if (athlete.achievements) {
      // Lower engagement gets more attention
      if (athlete.achievements.completedChallenges < 3) {
        score += 20;
      }
      
      // Recent activity bonus
      const recentActivity = athlete.achievements.recentActivity?.length || 0;
      if (recentActivity > 5) {
        score += 10; // Active athletes get slight priority for monitoring
      }
    }

    return score;
  };

  // Generate recommendations based on risk factors
  const generateRecommendation = (riskLevel: 'high' | 'medium' | 'low', factors: string[]): string => {
    switch (riskLevel) {
      case 'high':
        return 'Immediate assessment required. Consider reducing training intensity and scheduling medical evaluation.';
      case 'medium':
        return 'Monitor closely. Implement preventive measures and adjust training program as needed.';
      case 'low':
        return 'Continue current program. Maintain regular check-ins and monitoring.';
      default:
        return 'Regular monitoring recommended.';
    }
  };

  // Fetch assigned athletes and their injury data
  useEffect(() => {
    if (availabilityStatus !== 'available') {
      setAthletes([]);
      setInjuryAlerts([]);
      setLoading(false);
      return;
    }

    const fetchAthletesWithInjuryData = async () => {
      setLoading(true);
      
      try {
        // Get all active injuries in the coach's region
        const regionalInjuriesResult = await getRegionalActiveInjuries(coachRegion);
        
        if (!regionalInjuriesResult.success) {
          console.error("Failed to fetch regional injuries:", regionalInjuriesResult.error);
          setLoading(false);
          return;
        }
        
        // Extract unique athlete IDs who have active injuries
        const injuredAthleteIds = regionalInjuriesResult.regionalInjuries.map(({ athleteId }) => athleteId);
        
        if (injuredAthleteIds.length === 0) {
          setAthletes([]);
          setInjuryAlerts([]);
          setLoading(false);
          return;
        }

        // Auto-assign these injured athletes to the coach if not already assigned
        await autoAssignInjuredAthletes(injuredAthleteIds);

        // Get basic athlete data for injured athletes
        const usersRef = collection(db, "users");
        
        // Query in chunks due to Firebase 'in' limit
        const athleteDataMap: { [key: string]: any } = {};
        for (let i = 0; i < injuredAthleteIds.length; i += 10) {
          const chunk = injuredAthleteIds.slice(i, i + 10);
          const q = query(
            usersRef,
            where("__name__", "in", chunk)
          );

          const snapshot = await getDocs(q);
          snapshot.docs.forEach((doc) => {
            athleteDataMap[doc.id] = {
              id: doc.id,
              ...doc.data()
            };
          });
        }

        // Create injury lookup map
        const injuriesByAthlete: { [key: string]: any[] } = {};
        regionalInjuriesResult.regionalInjuries.forEach(({ athleteId, injuries }) => {
          injuriesByAthlete[athleteId] = injuries;
        });

        // Get all injury IDs for batch recovery data fetching
        const allInjuryIds: string[] = [];
        Object.values(injuriesByAthlete).forEach(injuries => {
          injuries.forEach(injury => {
            if (injury.id) allInjuryIds.push(injury.id);
          });
        });

        // Get recovery data for all injuries in batch
        const recoveryDataResult = await getMultipleAthleteRecoveryData(allInjuryIds);
        const recoveryDataByInjury: { [key: string]: any } = {};
        if (recoveryDataResult.success) {
          recoveryDataResult.recoveryData.forEach(data => {
            recoveryDataByInjury[data.injuryId] = data;
          });
        }

        // Process all injured athletes with achievement data
        const processedAthletes = await Promise.all(
          injuredAthleteIds.map(async (athleteId) => {
            const basicData = athleteDataMap[athleteId];
            if (!basicData) {
              return null;
            }

            const athleteInjuries = injuriesByAthlete[athleteId] || [];
            
            // Calculate recovery data for most recent injury
            let recoveryProgress = 0;
            let injuryStatus = 'injured';
            let injurySeverity = null;
            let injuryType = null;
            let estimatedReturnDate = null;
            let recoveryStartDate = null;
            
            if (athleteInjuries.length > 0) {
              const mostRecentInjury = athleteInjuries[0];
              injuryStatus = mostRecentInjury.status;
              injurySeverity = mostRecentInjury.severity;
              injuryType = `${mostRecentInjury.bodyPart} - ${mostRecentInjury.injuryType}`;
              estimatedReturnDate = mostRecentInjury.expectedRecoveryDate?.toISOString();
              recoveryStartDate = mostRecentInjury.diagnosisDate.toISOString();
              
              // Get recovery progress from batch data
              const recoveryData = recoveryDataByInjury[mostRecentInjury.id];
              if (recoveryData && recoveryData.milestones.length > 0) {
                recoveryProgress = calculateRecoveryProgress(mostRecentInjury, recoveryData.milestones);
              }
            }

            // Fetch achievement data
            let achievements;
            try {
              const achievementResult = await getAthleteAchievements([athleteId]);
              if (achievementResult.success && achievementResult.achievements && 
                  typeof achievementResult.achievements === 'object' && 
                  !Array.isArray(achievementResult.achievements)) {
                const achievementsObj = achievementResult.achievements as { [key: string]: any };
                achievements = achievementsObj[athleteId] || {
                  totalChallenges: 0,
                  completedChallenges: 0,
                  totalPoints: 0,
                  achievements: [],
                  recentActivity: [],
                  currentTier: 'Bronze',
                  tierProgress: 0
                };
              } else {
                achievements = {
                  totalChallenges: 0,
                  completedChallenges: 0,
                  totalPoints: 0,
                  achievements: [],
                  recentActivity: [],
                  currentTier: 'Bronze',
                  tierProgress: 0
                };
              }
            } catch (error) {
              console.warn(`Failed to load achievements for athlete ${athleteId}:`, error);
              achievements = {
                totalChallenges: 0,
                completedChallenges: 0,
                totalPoints: 0,
                achievements: [],
                recentActivity: [],
                currentTier: 'Bronze',
                tierProgress: 0
              };
            }

            return {
              id: athleteId,
              name: basicData.name || 'Unknown Athlete',
              region: basicData.region || 'Unknown',
              performance: basicData.performance,
              achievements,
              injuries: athleteInjuries,
              recent_injuries: basicData.recent_injuries || [],
              injury_status: injuryStatus as 'injured' | 'recovering' | 'healthy',
              injury_severity: injurySeverity as 'minor' | 'moderate' | 'severe' | 'critical' | null,
              recovery_progress: recoveryProgress,
              recovery_start_date: recoveryStartDate,
              estimated_return_date: estimatedReturnDate,
              injury_type: injuryType,
              medical_notes: basicData.medical_notes,
              coach_verification_status: basicData.coach_verification_status || 'not_required',
              coach_verification_date: basicData.coach_verification_date,
              recovery_verification_requested: basicData.recovery_verification_requested || false,
              lastActiveAt: basicData.lastActiveAt
            } as Athlete;
          })
        );
        
        const validAthletes = processedAthletes.filter(Boolean) as Athlete[];

        // Calculate injury risks and generate alerts
        const alerts: InjuryAlert[] = [];
        const athletesWithRisk = validAthletes.map(athlete => {
          const { risk, factors } = calculateInjuryRisk(athlete);
          athlete.injury_risk = risk;

          // Generate alert if high or medium risk
          if (risk === 'high' || risk === 'medium') {
            alerts.push({
              id: `alert_${athlete.id}_${Date.now()}`,
              athleteId: athlete.id,
              athleteName: athlete.name,
              riskLevel: risk,
              riskFactors: factors,
              recommendation: generateRecommendation(risk, factors),
              timestamp: new Date(),
              status: 'active'
            });
          }

          return athlete;
        });

        // Sort athletes by priority (injury priority first)
        const sortedAthletes = athletesWithRisk.sort((a, b) => {
          const scoreB = calculatePriorityScore(b);
          const scoreA = calculatePriorityScore(a);
          return scoreB - scoreA; // Higher scores first
        });

        setAthletes(sortedAthletes);
        setInjuryAlerts(alerts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching athlete injury data:", error);
        setLoading(false);
      }
    };

    fetchAthletesWithInjuryData();
  }, [coachRegion, availabilityStatus, assignedAthletes]);

  // Load pending verifications
  useEffect(() => {
    const fetchPendingVerifications = async () => {
      if (!coachId) return;
      
      try {
        const result = await getInjuriesNeedingVerification();
        if (result.success) {
          setPendingVerifications(result.injuries);
        }
      } catch (error) {
        console.error("Error fetching pending verifications:", error);
      }
    };

    fetchPendingVerifications();
  }, [coachId]);

  // Handle coach verification for completed recovery
  const handleRecoveryVerification = async (athleteId: string, verified: boolean) => {
    try {
      const updates: any = {
        coach_verification_status: verified ? 'verified' : 'pending',
        coach_verification_date: new Date(),
        recovery_verification_requested: false
      };

      if (verified) {
        // When verified, mark athlete as healthy and clear injury data
        updates.injury_status = 'healthy';
        updates.recovery_progress = 100;
        updates.injury_severity = null;
        updates.injury_type = null;

        // Also update the actual injury records to mark them as recovered
        const athlete = athletes.find(a => a.id === athleteId);
        if (athlete && athlete.injuries && athlete.injuries.length > 0) {
          // Mark the most recent active injury as recovered
          const activeInjury = athlete.injuries.find(injury => 
            injury.status === 'active' || injury.status === 'recovering'
          );
          
          if (activeInjury && activeInjury.id) {
            await updateDoc(doc(db, "injuries", activeInjury.id), {
              status: 'recovered',
              actualRecoveryDate: new Date(),
              updatedAt: new Date()
            });
            console.log(`Marked injury ${activeInjury.id} as recovered`);
          }
        }
      }

      // Update athlete profile
      await updateDoc(doc(db, "users", athleteId), updates);
      
      console.log(`Recovery ${verified ? 'verified' : 'rejected'} for athlete ${athleteId}`);
      
      // Show success message
      const athleteName = athletes.find(a => a.id === athleteId)?.name || 'Athlete';
      setVerificationMessage(verified 
        ? `${athleteName}'s recovery has been verified and they are cleared to return to activity!`
        : `${athleteName} needs more recovery time. They will be notified.`
      );
      
      // Clear message after 5 seconds
      setTimeout(() => setVerificationMessage(null), 5000);
      
      // The dashboard should auto-update due to the onSnapshot listener
    } catch (error) {
      console.error("Error updating verification status:", error);
    }
  };

  // Fetch detailed injury report for verification
  const fetchAthleteReport = async (athleteId: string) => {
    setLoadingReport(true);
    try {
      const athlete = athletes.find(a => a.id === athleteId);
      if (!athlete || !athlete.injuries || athlete.injuries.length === 0) {
        setReportData(null);
        setLoadingReport(false);
        return;
      }

      const mostRecentInjury = athlete.injuries[0];
      if (!mostRecentInjury.id) {
        setReportData(null);
        setLoadingReport(false);
        return;
      }

      // Use batch recovery data fetching for single injury
      const recoveryResult = await getMultipleAthleteRecoveryData([mostRecentInjury.id]);
      let milestones: any[] = [];
      let progressEntries: any[] = [];

      if (recoveryResult.success && recoveryResult.recoveryData.length > 0) {
        const recoveryData = recoveryResult.recoveryData[0];
        milestones = recoveryData.milestones;
        progressEntries = recoveryData.progress;
      }

      setReportData({
        athlete: athlete,
        injury: mostRecentInjury,
        milestones: milestones,
        progressEntries: progressEntries
      });
    } catch (error) {
      console.error("Error fetching athlete report:", error);
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const openReport = async (athleteId: string) => {
    setSelectedAthleteReport(athleteId);
    await fetchAthleteReport(athleteId);
  };

  const closeReport = () => {
    setSelectedAthleteReport(null);
    setReportData(null);
  };

  // Handle coach verification for re-injury verification
  const handleInjuryVerification = async (injuryId: string, approved: boolean, notes?: string) => {
    try {
      const status = approved ? 'verified' : 'rejected';
      const result = await verifyInjuryByCoach(injuryId, coachId, status, notes);
      if (result.success) {
        // Show success message
        setVerificationMessage(approved 
          ? "Injury has been verified and approved."
          : "Injury verification has been rejected. The athlete will be notified."
        );
        
        // Refresh pending verifications
        const updatedVerifications = await getInjuriesNeedingVerification();
        if (updatedVerifications.success) {
          setPendingVerifications(updatedVerifications.injuries);
        }
        
        // Clear message after 5 seconds
        setTimeout(() => setVerificationMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error handling injury verification:", error);
      setVerificationMessage("Error processing verification. Please try again.");
      setTimeout(() => setVerificationMessage(null), 5000);
    }
  };

  // Helper function to get athletes needing urgent attention
  const getAthletesNeedingAttention = () => {
    return athletes.filter(athlete => 
      athlete.recovery_verification_requested || 
      athlete.injury_risk === 'high' ||
      (athlete.injury_status === 'recovering' && athlete.recovery_progress && athlete.recovery_progress < 30)
    );
  };

  // Helper function to get recovery timeline status
  const getRecoveryTimelineStatus = (athlete: Athlete) => {
    if (!athlete.recovery_start_date || !athlete.estimated_return_date) {
      return { status: 'unknown', message: 'Timeline not available' };
    }

    const startDate = new Date(athlete.recovery_start_date);
    const returnDate = new Date(athlete.estimated_return_date);
    const now = new Date();
    const totalDuration = returnDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    if (now > returnDate && athlete.injury_status !== 'healthy') {
      return { status: 'overdue', message: 'Recovery overdue - needs assessment' };
    } else if (progress > 80 && athlete.recovery_progress && athlete.recovery_progress < 60) {
      return { status: 'at_risk', message: 'Behind schedule - monitor closely' };
    } else if (athlete.recovery_progress && athlete.recovery_progress > progress + 20) {
      return { status: 'ahead', message: 'Ahead of schedule' };
    } else {
      return { status: 'on_track', message: 'Recovery progressing normally' };
    }
  };

  // Auto-assign injured athletes to the coach
  const autoAssignInjuredAthletes = async (injuredAthleteIds: string[]) => {
    try {
      // Update each injured athlete to be assigned to this coach
      const assignmentPromises = injuredAthleteIds.map(athleteId =>
        updateDoc(doc(db, "users", athleteId), {
          assigned_coach: coachId,
          coach_assignment_date: new Date()
        }).catch(error => {
          console.error(`Failed to assign athlete ${athleteId}:`, error);
        })
      );

      await Promise.all(assignmentPromises);
    } catch (error) {
      console.error("Error in auto-assignment:", error);
    }
  };

  // Confirmation handlers
  const requestVerificationConfirmation = (athleteId: string, verified: boolean) => {
    const athlete = athletes.find(a => a.id === athleteId);
    setConfirmingVerification({
      athleteId,
      verified,
      athleteName: athlete?.name || 'Athlete'
    });
  };

  const confirmVerification = async () => {
    if (confirmingVerification) {
      await handleRecoveryVerification(confirmingVerification.athleteId, confirmingVerification.verified);
      setConfirmingVerification(null);
    }
  };

  const cancelVerification = () => {
    setConfirmingVerification(null);
  };

  const filteredAthletes = selectedFilter === 'all' 
    ? athletes 
    : athletes.filter(athlete => athlete.injury_risk === selectedFilter);

  const riskStats = {
    total: athletes.length,
    high: athletes.filter(a => a.injury_risk === 'high').length,
    medium: athletes.filter(a => a.injury_risk === 'medium').length,
    low: athletes.filter(a => a.injury_risk === 'low').length
  };

  return (
    <div className="min-h-screen bg-white p-6 space-y-8">

      <div>
      {/* Success/Verification Message */}
      {verificationMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <p className="text-green-800 font-medium">{verificationMessage}</p>
          </div>
        </div>
      )}

    

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between p-8 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-300 shadow-lg">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {availabilityStatus === 'available' ? 'Injury Management - My Athletes' : 'Injury Prevention & Monitoring'}
            </h2>
            <p className="text-gray-700">
              {availabilityStatus === 'available' 
                ? `Regional Injury Management for ${coachRegion} - ${athletes.length} injured athletes`
                : 'Set availability status to access injury management features'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-amber-100 border border-amber-300 rounded-xl px-4 py-3 flex items-center space-x-2 shadow-sm">
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 font-medium">{injuryAlerts.length} Active Alerts</span>
            </div>
            {pendingVerifications.length > 0 && (
              <div className="bg-purple-100 border border-purple-300 rounded-xl px-4 py-3 flex items-center space-x-2 shadow-sm">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-purple-700 font-medium">{pendingVerifications.length} Pending Verifications</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Total Athletes</p>
              <p className="text-3xl font-bold text-gray-900">{riskStats.total}</p>
            </div>
            <User className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">High Risk</p>
              <p className="text-3xl font-bold">{riskStats.high}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-rose-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Medium Risk</p>
              <p className="text-3xl font-bold">{riskStats.medium}</p>
            </div>
            <Activity className="w-8 h-8 text-amber-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Low Risk</p>
              <p className="text-3xl font-bold">{riskStats.low}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Pending Verifications</p>
              <p className="text-3xl font-bold">{pendingVerifications.length}</p>
            </div>
            <Shield className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {injuryAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-600" />
            Active Injury Risk Alerts
          </h3>
          <div className="space-y-4">
            {injuryAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`border-l-4 p-4 rounded-r-lg ${
                alert.riskLevel === 'high' ? 'border-red-500 bg-red-50' :
                alert.riskLevel === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{alert.athleteName}</h4>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                    alert.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.riskLevel.toUpperCase()} RISK
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Risk Factors:</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                    {alert.riskFactors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-800">Recommendation:</p>
                  <p className="text-sm text-gray-700">{alert.recommendation}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Generated just now
                  </p>
                  <div className="flex space-x-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium cursor-pointer">
                      Acknowledge
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium cursor-pointer">
                      Contact Athlete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Injury Verifications */}
      {pendingVerifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Pending Injury Verifications ({pendingVerifications.length})
          </h3>
          <div className="space-y-4">
            {pendingVerifications.map((injury) => (
              <div key={injury.id} className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {injury.athleteName || 'Unknown Athlete'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Injury: {injury.injuryType || 'Not specified'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Area: {injury.injuredArea || 'Not specified'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Reported: {injury.createdAt ? new Date(injury.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    NEEDS VERIFICATION
                  </div>
                </div>
                
                {injury.description && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-800">Description:</p>
                    <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                      {injury.description}
                    </p>
                  </div>
                )}

                {injury.previousInjuries && injury.previousInjuries.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-800">Previous Similar Injuries:</p>
                    <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border">
                      {injury.previousInjuries.map((prev: any, index: number) => (
                        <div key={index} className="mb-1">
                          • {prev.injuryType} ({prev.injuredArea}) - {new Date(prev.createdAt.seconds * 1000).toLocaleDateString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-purple-200">
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Re-injured athlete requiring coach verification
                  </p>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleInjuryVerification(injury.id!, false)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      <XCircle className="w-3 h-3 inline mr-1" />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleInjuryVerification(injury.id!, true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Progress Tracking Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Recovery Progress Tracking</h3>
          <p className="text-gray-700">Monitor recovery progress for all injured athletes in your region</p>
        </div>

        {availabilityStatus !== 'available' ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">Set Availability Status</h4>
            <p className="text-gray-700">Enable your availability to manage injuries for athletes in your region</p>
          </div>
        ) : assignedAthletes.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">No Athletes Assigned</h4>
            <p className="text-gray-700">Athletes will be automatically assigned based on priority needs</p>
          </div>
        ) : (
          <div className="space-y-6">
            {athletes.map((athlete) => (
              <div key={athlete.id} className="border rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      {athlete.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{athlete.name}</h4>
                      <p className="text-sm text-gray-600">{athlete.region} Region</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      athlete.injury_status === 'injured' && athlete.injury_severity === 'severe' ? 'bg-red-100 text-red-800' :
                      athlete.injury_status === 'injured' && athlete.injury_severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                      athlete.injury_status === 'injured' && athlete.injury_severity === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                      athlete.injury_status === 'recovering' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {athlete.injury_status === 'injured' ? (
                        <>
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Injured ({athlete.injury_severity})
                        </>
                      ) : athlete.injury_status === 'recovering' ? (
                        <>
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Recovering
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Healthy
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {(athlete.injury_status === 'recovering' || athlete.recovery_verification_requested || athlete.coach_verification_status === 'verified' || (athlete.recovery_progress || 0) >= 100) && (
                  <div className="bg-white rounded-lg p-4 space-y-4">
                    {athlete.injury_status === 'recovering' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Recovery Progress</label>
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full transition-all duration-300 ${
                                    (athlete.recovery_progress || 0) >= 100 ? 'bg-green-500' :
                                    (athlete.recovery_progress || 0) >= 75 ? 'bg-blue-500' :
                                    (athlete.recovery_progress || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${athlete.recovery_progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{athlete.recovery_progress || 0}%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Injury Type</label>
                            <p className="text-sm text-gray-900">{athlete.injury_type || 'Not specified'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Started Recovery</label>
                            <p className="text-sm text-gray-900">
                              {athlete.recovery_start_date ? new Date(athlete.recovery_start_date).toLocaleDateString() : 'Not set'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Estimated Return</label>
                            <p className="text-sm text-gray-900">
                              {athlete.estimated_return_date ? new Date(athlete.estimated_return_date).toLocaleDateString() : 'Not set'}
                            </p>
                          </div>
                        </div>

                        {athlete.medical_notes && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Medical Notes</label>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{athlete.medical_notes}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Coach Verification Section - Now shows for verification requests regardless of injury status */}
                    {((athlete.recovery_progress || 0) >= 100 || athlete.recovery_verification_requested || athlete.coach_verification_status === 'verified') && (
                      <div className="border-t pt-4">
                        {athlete.coach_verification_status === 'verified' ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                              <div>
                                <h5 className="font-medium text-green-900 flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5" />
                                  Recovery Verified
                                </h5>
                                <p className="text-sm text-green-700">
                                  Verified on {athlete.coach_verification_date ? 
                                    new Date(athlete.coach_verification_date).toLocaleDateString() : 'Recently'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : athlete.recovery_verification_requested ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Bell className="w-6 h-6 text-yellow-600" />
                                <div>
                                  <h5 className="font-medium text-yellow-900">Verification Requested</h5>
                                  <p className="text-sm text-yellow-700">
                                    Athlete has requested recovery verification - Review their complete recovery report
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openReport(athlete.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer flex items-center space-x-2 transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>View Report</span>
                                </button>
                                <button
                                  onClick={() => requestVerificationConfirmation(athlete.id, true)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer flex items-center space-x-2 transition-colors"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  <span>Quick Verify</span>
                                </button>
                                <button
                                  onClick={() => requestVerificationConfirmation(athlete.id, false)}
                                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                                >
                                  Need More Time
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <Clock className="w-6 h-6 text-blue-600" />
                              <div>
                                <h5 className="font-medium text-blue-900">Recovery Complete</h5>
                                <p className="text-sm text-blue-700">
                                  Athlete will request verification when ready
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progress Summary for Verification Requests */}
                    {athlete.recovery_verification_requested && athlete.injury_status !== 'recovering' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h5 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Recovery Summary
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Progress:</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${(athlete.recovery_progress || 0) >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                  style={{ width: `${athlete.recovery_progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-gray-900">{athlete.recovery_progress || 0}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Current Status:</span>
                            <p className="text-gray-600">{athlete.injury_status || 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Injury Type:</span>
                            <p className="text-gray-600">{athlete.injury_type || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Healthy Athletes - Brief Status */}
                {athlete.injury_status === 'healthy' && !athlete.recovery_verification_requested && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Heart className="w-6 h-6 text-green-600" />
                      <div>
                        <h5 className="font-medium text-green-900">Healthy Status</h5>
                        <p className="text-sm text-green-700">No active injuries or recovery needed</p>
                      </div>
                    </div>
                  </div>
                )}

                {athlete.injury_status === 'injured' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <div>
                        <h5 className="font-medium text-red-900">Active Injury</h5>
                        <p className="text-sm text-red-700">
                          {athlete.injury_type || 'Injury type not specified'} - 
                          Severity: {athlete.injury_severity || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comprehensive Injury Report Modal */}
      {selectedAthleteReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-blue-200">
            <div className="flex items-center justify-between p-6 border-b border-blue-200 bg-gradient-to-r from-blue-100 to-purple-100">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Recovery Verification Report</h2>
                  <p className="text-gray-700 font-medium">
                    {reportData?.athlete?.name} - Complete Recovery Assessment
                  </p>
                </div>
              </div>
              <button
                onClick={closeReport}
                className="text-gray-500 hover:text-gray-700 transition-colors bg-white p-1 rounded-lg hover:bg-gray-100"
              >
                <XCircle className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingReport ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                </div>
              ) : reportData ? (
                <div className="p-6 space-y-8">
                  {/* Athlete Summary */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <User className="w-5 h-5 text-blue-600 mr-2" />
                          Athlete Information
                        </h3>
                        <div className="space-y-2">
                          <p><span className="font-medium text-gray-800">Name:</span> <span className="text-gray-900">{reportData.athlete.name}</span></p>
                          <p><span className="font-medium text-gray-800">Sport:</span> <span className="text-gray-900">{reportData.athlete.sport}</span></p>
                          <p><span className="font-medium text-gray-800">Region:</span> <span className="text-gray-900">{reportData.athlete.region}</span></p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <Activity className="w-5 h-5 text-green-600 mr-2" />
                          Recovery Status
                        </h3>
                        <div className="space-y-2">
                          <p><span className="font-medium text-gray-800">Progress:</span> <span className="text-gray-900 font-semibold">{reportData.athlete.recovery_progress}%</span></p>
                          <p><span className="font-medium text-gray-800">Status:</span> <span className="text-gray-900 capitalize">{reportData.athlete.injury_status}</span></p>
                          <p><span className="font-medium text-gray-800">Risk Level:</span> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              reportData.athlete.injury_risk === 'high' ? 'bg-red-100 text-red-800' :
                              reportData.athlete.injury_risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {reportData.athlete.injury_risk?.toUpperCase()}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                          Timeline
                        </h3>
                        <div className="space-y-2">
                          <p><span className="font-medium text-gray-800">Injury Date:</span> <span className="text-gray-900">{new Date(reportData.injury.diagnosisDate).toLocaleDateString()}</span></p>
                          <p><span className="font-medium text-gray-800">Expected Return:</span> <span className="text-gray-900">{reportData.injury.expectedRecoveryDate ? new Date(reportData.injury.expectedRecoveryDate).toLocaleDateString() : 'Not set'}</span></p>
                          <p><span className="font-medium text-gray-800">Days in Recovery:</span> <span className="text-gray-900 font-semibold">{Math.floor((Date.now() - new Date(reportData.injury.diagnosisDate).getTime()) / (1000 * 60 * 60 * 24))} days</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Injury Details */}
                  <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border border-red-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Target className="w-6 h-6 text-red-500 mr-2" />
                      Injury Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Basic Information</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium text-gray-800">Type:</span> <span className="text-gray-900">{reportData.injury.injuryType}</span></p>
                          <p><span className="font-medium text-gray-800">Body Part:</span> <span className="text-gray-900">{reportData.injury.bodyPart}</span></p>
                          <p><span className="font-medium text-gray-800">Severity:</span> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              reportData.injury.severity === 'severe' ? 'bg-red-100 text-red-800' :
                              reportData.injury.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {reportData.injury.severity?.toUpperCase()}
                            </span>
                          </p>
                          <p><span className="font-medium text-gray-800">Status:</span> <span className="text-gray-900 capitalize">{reportData.injury.status}</span></p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Medical Information</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium text-gray-800">Diagnosis:</span> <span className="text-gray-900">{reportData.injury.diagnosis || 'Not provided'}</span></p>
                          <p><span className="font-medium text-gray-800">Caused by:</span> <span className="text-gray-900">{reportData.injury.causedBy || 'Not specified'}</span></p>
                          <p><span className="font-medium text-gray-800">Symptoms:</span> <span className="text-gray-900">{reportData.injury.symptoms?.join(', ') || 'None listed'}</span></p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-900 bg-white bg-opacity-60 p-3 rounded-lg border border-gray-200">
                        {reportData.injury.description || 'No detailed description provided.'}
                      </p>
                    </div>

                    {/* Medical Images */}
                    {reportData.injury.medicalImages && reportData.injury.medicalImages.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                          <Camera className="w-5 h-5 text-blue-500 mr-2" />
                          Medical Images ({reportData.injury.medicalImages.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {reportData.injury.medicalImages.map((image: string, index: number) => (
                            <div key={index} className="relative group">
                              <img 
                                src={image} 
                                alt={`Medical image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => window.open(image, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-sm">Click to enlarge</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recovery Milestones */}
                  <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Award className="w-6 h-6 text-green-500 mr-2" />
                      Recovery Milestones ({reportData.milestones.filter((m: any) => m.isCompleted).length}/{reportData.milestones.length} completed)
                    </h3>
                    
                    <div className="space-y-4">
                      {reportData.milestones.map((milestone: any, index: number) => (
                        <div key={milestone.id || index} className={`p-4 rounded-lg border-2 ${
                          milestone.isCompleted 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {milestone.isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Clock className="w-5 h-5 text-gray-400" />
                                )}
                                <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                                {milestone.isVerified && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                    Coach Verified
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{milestone.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Target: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                                {milestone.completedDate && (
                                  <span>Completed: {new Date(milestone.completedDate).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recovery Progress Entries */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                      Recovery Progress Log ({reportData.progressEntries.length} entries)
                    </h3>
                    
                    {reportData.progressEntries.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {reportData.progressEntries.slice(0, 10).map((entry: any, index: number) => (
                          <div key={entry.id || index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                {new Date(entry.date).toLocaleDateString()}
                              </span>
                              <div className="flex space-x-4 text-sm">
                                <span className="text-red-600">Pain: {entry.painLevel}/10</span>
                                <span className="text-blue-600">Mobility: {entry.mobilityLevel}/10</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{entry.notes || 'No notes provided'}</p>
                            {entry.exercisesCompleted && entry.exercisesCompleted.length > 0 && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Exercises: </span>
                                {entry.exercisesCompleted.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                        {reportData.progressEntries.length > 10 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            ... and {reportData.progressEntries.length - 10} more entries
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No progress entries recorded yet.</p>
                    )}
                  </div>

                  {/* Verification Actions */}
                  <div className="bg-gradient-to-br from-green-100 via-blue-50 to-indigo-100 border border-green-300 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <UserCheck className="w-6 h-6 text-green-500 mr-2" />
                      Coach Verification Decision
                    </h3>
                    <p className="text-gray-800 mb-6 font-medium">
                      Based on the complete recovery report above, make your verification decision for {reportData.athlete.name}'s recovery.
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          requestVerificationConfirmation(selectedAthleteReport!, true);
                          closeReport();
                        }}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Approve Recovery - Clear to Return</span>
                      </button>
                      <button
                        onClick={() => {
                          requestVerificationConfirmation(selectedAthleteReport!, false);
                          closeReport();
                        }}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Request More Recovery Time</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No injury data found for this athlete.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Confirmation Modal */}
      {confirmingVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-md w-full p-6 border border-blue-200">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                confirmingVerification.verified ? 'bg-gradient-to-br from-green-100 to-green-200' : 'bg-gradient-to-br from-orange-100 to-orange-200'
              }`}>
                {confirmingVerification.verified ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <Clock className="w-8 h-8 text-orange-600" />
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {confirmingVerification.verified ? 'Verify Recovery?' : 'Request More Time?'}
              </h3>
              
              <p className="text-gray-700 mb-6 font-medium">
                {confirmingVerification.verified 
                  ? `Are you sure you want to verify ${confirmingVerification.athleteName}'s recovery? They will be marked as healthy and cleared to return to full activity.`
                  : `Are you sure ${confirmingVerification.athleteName} needs more recovery time? They will be notified that their verification was not approved yet.`
                }
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelVerification}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmVerification}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl ${
                    confirmingVerification.verified 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                      : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                  }`}
                >
                  {confirmingVerification.verified ? 'Yes, Verify' : 'Yes, Need More Time'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
</div>
  );
};

export default EnhancedCoachInjuryManagement;