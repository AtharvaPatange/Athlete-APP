"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
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
  const { user, loading } = useAuth();
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
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Coach Portal...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load profile. Please try again.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "athletes", label: "🏃‍♂️ Athletes", icon: "👥" },
    { id: "analytics", label: "📊 Analytics", icon: "📈" },
    { id: "injuries", label: "🏥 Injury Management", icon: "🩺" },
    { id: "community", label: "💬 Community", icon: "🗨️" }
  ];

  const handleLogout = async () => {
    const { logout } = await import("@/hooks/useAuth");
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  🏋️‍♂️ Coach Portal
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{userProfile.name}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {userProfile.region} Region
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {userProfile.name}! 👋
            </h2>
            <p className="text-blue-100 text-lg">
              Managing athletes in the {userProfile.region} region • {userProfile.sport} specialization
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
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