"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit, onSnapshot } from "firebase/firestore";
import { 
  Users, 
  BarChart3, 
  Heart, 
  MessageSquare, 
  LogOut, 
  MapPin,
  User,
  Loader2,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX
} from "lucide-react";
import RegionalAthletesView from "@/components/EnhancedRegionalAthletesView";
import CoachAnalyticsDashboard from "@/components/CoachAnalyticsDashboard";
import CoachInjuryManagement from "@/components/EnhancedCoachInjuryManagement";
import CoachCommunity from "@/components/EnhancedCoachCommunity";
import VoiceNavigationComponent from "@/components/VoiceNavigationComponent";

interface UserProfile {
  name: string;
  role: string;
  region: string;
  sport: string;
  email: string;
  availability_status?: 'available' | 'unavailable';
  assigned_athletes?: string[]; // Array of athlete IDs
  last_assignment_update?: any;
}

const CoachDashboard = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("athletes");
  const [profileLoading, setProfileLoading] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'unavailable'>('unavailable');
  const [assignedAthletes, setAssignedAthletes] = useState<string[]>([]);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            
            // Check if user is actually a coach
            if (profile.role !== 'coach') {
              router.push("/dashboard");
              return;
            }
            setUserProfile(profile);
            setAvailabilityStatus(profile.availability_status || 'unavailable');
            setAssignedAthletes(profile.assigned_athletes || []);
          } else {
            // No profile found, redirect to registration
            router.push("/register");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setProfileLoading(false);
        }
      };

      fetchProfile();
    }
  }, [user, loading, router]);

  // Voice navigation event listeners
  useEffect(() => {
    const handleVoiceTabChange = (event: CustomEvent) => {
      const tab = event.detail;
      if (['athletes', 'analytics', 'injuries', 'community'].includes(tab)) {
        setActiveTab(tab);
      }
    };

    const handleVoiceLogout = () => {
      handleLogout();
    };

    const handleVoiceAvailability = (event: CustomEvent) => {
      const status = event.detail;
      if (status === 'available' || status === 'unavailable') {
        toggleAvailability();
      }
    };

    window.addEventListener('voice-tab-change', handleVoiceTabChange as EventListener);
    window.addEventListener('voice-logout', handleVoiceLogout);
    window.addEventListener('voice-availability', handleVoiceAvailability as EventListener);

    return () => {
      window.removeEventListener('voice-tab-change', handleVoiceTabChange as EventListener);
      window.removeEventListener('voice-logout', handleVoiceLogout);
      window.removeEventListener('voice-availability', handleVoiceAvailability as EventListener);
    };
  }, []);

  // Function to assign 3 athletes to the coach based on priority and region
  const assignAthletesToCoach = async () => {
    if (!user || !userProfile) return;

    try {
      // Get all athletes from the same region who are not already assigned to a coach
      const athletesQuery = query(
        collection(db, "users"),
        where("role", "==", "athlete"),
        where("region", "==", userProfile.region),
        limit(50) // Get more athletes to choose from
      );

      const athletesSnapshot = await getDocs(athletesQuery);
      const availableAthletes = athletesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((athlete: any) => !athlete.assigned_coach); // Only unassigned athletes

      // Sort by priority (high injury risk, declining performance, etc.)
      const prioritizedAthletes = availableAthletes.sort((a: any, b: any) => {
        let scoreA = 0, scoreB = 0;
        
        // Priority scoring
        if (a.injury_risk === 'high') scoreA += 3;
        if (a.injury_risk === 'medium') scoreA += 2;
        if (a.performance_trend === 'declining') scoreA += 3;
        if (a.injury_status === 'injured' || a.injury_status === 'recovering') scoreA += 4;
        
        if (b.injury_risk === 'high') scoreB += 3;
        if (b.injury_risk === 'medium') scoreB += 2;
        if (b.performance_trend === 'declining') scoreB += 3;
        if (b.injury_status === 'injured' || b.injury_status === 'recovering') scoreB += 4;
        
        return scoreB - scoreA; // Higher score = higher priority
      });

      // Take the top 3 priority athletes
      const selectedAthletes = prioritizedAthletes.slice(0, 3);

      if (selectedAthletes.length > 0) {
        const athleteIds = selectedAthletes.map((athlete: any) => athlete.id);
        
        // Update coach profile with assigned athletes
        await updateDoc(doc(db, "users", user.uid), {
          assigned_athletes: athleteIds,
          last_assignment_update: new Date()
        });

        // Update each athlete with the assigned coach
        for (const athlete of selectedAthletes) {
          await updateDoc(doc(db, "users", athlete.id), {
            assigned_coach: user.uid,
            coach_assignment_date: new Date()
          });
        }

        setAssignedAthletes(athleteIds);
        console.log(`Assigned ${selectedAthletes.length} athletes to coach`);
      }
    } catch (error) {
      console.error("Error assigning athletes:", error);
    }
  };

  // Function to toggle availability status
  const toggleAvailability = async () => {
    if (!user || isUpdatingAvailability) return;
    
    setIsUpdatingAvailability(true);
    const newStatus = availabilityStatus === 'available' ? 'unavailable' : 'available';

    try {
      await updateDoc(doc(db, "users", user.uid), {
        availability_status: newStatus
      });

      setAvailabilityStatus(newStatus);

      // If becoming available and no athletes assigned, assign athletes
      if (newStatus === 'available' && assignedAthletes.length === 0) {
        await assignAthletesToCoach();
      }

      // If becoming unavailable, unassign athletes
      if (newStatus === 'unavailable' && assignedAthletes.length > 0) {
        // Remove coach assignment from athletes
        for (const athleteId of assignedAthletes) {
          await updateDoc(doc(db, "users", athleteId), {
            assigned_coach: null,
            coach_assignment_date: null
          });
        }

        // Clear assigned athletes from coach
        await updateDoc(doc(db, "users", user.uid), {
          assigned_athletes: [],
          last_assignment_update: new Date()
        });

        setAssignedAthletes([]);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0F172A] animate-spin mx-auto mb-4" />
          <p className="text-[#303644] font-medium">Loading Coach Portal...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#303644] mb-4">Unable to load profile. Please try again.</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-[#0F172A] text-white rounded-lg hover:bg-[#182031] transition-colors cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "athletes", label: "Athletes", icon: <Users className="w-5 h-5" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "injuries", label: "Injury Management", icon: <Heart className="w-5 h-5" /> },
    { id: "community", label: "Community", icon: <MessageSquare className="w-5 h-5" /> }
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Grid Background */}
      <div 
        className="fixed inset-0 opacity-100 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 2px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)",
          backgroundSize: '32px 32px'
        }}
      ></div>

      {/* Header - Single unified header like athlete dashboard */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-8">
            {/* Left side - Logo + Navigation Tabs */}
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-3">
                  <div className="bg-[#0F172A] p-2 rounded-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-[#0F172A] hidden md:block">Welcome, Coach!</span>
                </h1>
              </div>

              {/* Navigation Tabs */}
              <div className="flex space-x-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? "border-[#0F172A] text-[#0F172A]"
                        : "border-transparent text-[#303644] hover:text-[#0F172A] hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Right side - Availability + Profile + Logout */}
            <div className="flex items-center space-x-4 ml-auto">
              {/* Availability Toggle */}
              <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Status:</div>
                  <div className={`text-xs ${availabilityStatus === 'available' ? 'text-green-600' : 'text-gray-500'}`}>
                    {availabilityStatus === 'available' 
                      ? `Managing ${assignedAthletes.length}/3 Athletes` 
                      : 'Not Available'
                    }
                  </div>
                </div>
                <button
                  onClick={toggleAvailability}
                  disabled={isUpdatingAvailability}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                    availabilityStatus === 'available'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isUpdatingAvailability ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUpdatingAvailability ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : availabilityStatus === 'available' ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <UserX className="w-4 h-4" />
                  )}
                  <span>
                    {availabilityStatus === 'available' ? 'Available' : 'Set Available'}
                  </span>
                </button>
              </div>
              
              <div className="text-sm text-[#303644]">
                <div className="flex items-center mt-1">
                  <span className="px-2 py-1 bg-[#0F172A] text-white rounded-full text-xs font-medium">
                    {userProfile.region} Region
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#303644] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#0F172A] transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px]">
          {activeTab === "athletes" && (
            <RegionalAthletesView 
              coachRegion={userProfile.region} 
              coachSport={userProfile.sport}
              coachId={user?.uid || ""}
              assignedAthletes={assignedAthletes}
              availabilityStatus={availabilityStatus}
            />
          )}
          
          {activeTab === "analytics" && (
            <CoachAnalyticsDashboard 
              coachRegion={userProfile.region} 
              coachSport={userProfile.sport}
              coachId={user?.uid || ""}
            />
          )}
          
          {activeTab === "injuries" && (
            <CoachInjuryManagement 
              coachRegion={userProfile.region} 
              coachId={user?.uid || ""}
              assignedAthletes={assignedAthletes}
              availabilityStatus={availabilityStatus}
            />
          )}
          
          {activeTab === "community" && (
            <CoachCommunity 
              coachId={user?.uid || ""} 
              coachName={userProfile.name}
              coachRegion={userProfile.region}
            />
          )}
        </div>
      </main>

      {/* Voice Navigation */}
      <VoiceNavigationComponent 
        commands={[
          {
            command: 'go to athletes',
            action: () => setActiveTab('athletes'),
            description: 'Switch to athletes view',
            category: 'Coach Dashboard'
          },
          {
            command: 'go to analytics',
            action: () => setActiveTab('analytics'),
            description: 'Switch to analytics view',
            category: 'Coach Dashboard'
          },
          {
            command: 'go to injuries',
            action: () => setActiveTab('injuries'),
            description: 'Switch to injury management',
            category: 'Coach Dashboard'
          },
          {
            command: 'go to community',
            action: () => setActiveTab('community'),
            description: 'Switch to coach community',
            category: 'Coach Dashboard'
          },
          {
            command: 'toggle availability',
            action: () => toggleAvailability(),
            description: 'Toggle your availability status',
            category: 'Coach Actions'
          }
        ]}
        onCommandExecuted={(command) => {
          console.log('Coach voice command executed:', command);
        }}
      />
    </div>
  );
};

export default CoachDashboard;