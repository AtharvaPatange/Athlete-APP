"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { 
  Users, 
  BarChart3, 
  Heart, 
  MessageSquare, 
  LogOut, 
  MapPin,
  User,
  Loader2
} from "lucide-react";
import RegionalAthletesView from "@/components/RegionalAthletesView";
import CoachAnalyticsDashboard from "@/components/CoachAnalyticsDashboard";
import CoachInjuryManagement from "@/components/CoachInjuryManagement";
import CoachCommunity from "@/components/CoachCommunity";

interface UserProfile {
  name: string;
  role: string;
  region: string;
  sport: string;
  email: string;
}

const CoachDashboard = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("athletes");
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const fetchProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            // Check if user is actually a coach
            if (profile.role !== 'coach') {
              router.push("/dashboard");
              return;
            }
            setUserProfile(profile);
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
    <div className="min-h-screen bg-[#F6F7F7]">
      {/* Header - Single unified header like athlete dashboard */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo + Navigation Tabs */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-3">
                  <div className="bg-[#0F172A] p-2 rounded-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  Coach Portal
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
                    <span className={`transition-colors ${
                      activeTab === tab.id ? 'text-[#0F172A]' : 'text-[#182031]'
                    }`}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Right side - Profile + Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-[#303644]">
                <span className="font-semibold text-[#0F172A] hidden md:block">Welcome, {userProfile.name}!</span>
                <div className="flex items-center mt-1">
                  <MapPin className="w-4 h-4 text-[#182031] mr-1" />
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
    </div>
  );
};

export default CoachDashboard;