"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserProfile {
  name: string;
  age: number;
  gender: string;
  sport: string;
  region: string;
  disability_flag: boolean;
  income_band: string;
  role: string;
  uid: string;
  createdAt: any;
}

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchUserProfile();
    }
  }, [user, loading, router]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "athlete": return "🏃‍♂️";
      case "coach": return "🏋️‍♂️";
      case "admin": return "👨‍💼";
      default: return "👤";
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case "football": return "⚽";
      case "basketball": return "🏀";
      case "tennis": return "🎾";
      case "swimming": return "🏊‍♂️";
      case "running": return "🏃‍♂️";
      case "cycling": return "🚴‍♂️";
      case "weightlifting": return "🏋️‍♂️";
      default: return "🏆";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-8 rounded-lg mr-3 flex items-center justify-center">
                <span className="text-white text-sm">🏃‍♂️</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AthleteApp</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {profile.name}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center text-3xl mr-6">
                {getRoleIcon(profile.role)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <span className="flex items-center">
                    {getSportIcon(profile.sport)} {profile.sport}
                  </span>
                  <span>📍 {profile.region}</span>
                  <span>🎂 {profile.age} years</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                {profile.role.toUpperCase()}
              </div>
              <p className="text-sm text-gray-500">Member since {new Date(profile.createdAt?.toDate()).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Personal Info</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-700 font-medium">Gender:</span> <span className="text-gray-900 ml-2">{profile.gender}</span></p>
                <p><span className="text-gray-700 font-medium">Region:</span> <span className="text-gray-900 ml-2">{profile.region}</span></p>
                <p><span className="text-gray-700 font-medium">Age:</span> <span className="text-gray-900 ml-2">{profile.age}</span></p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Athletic Profile</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-700 font-medium">Primary Sport:</span> <span className="text-gray-900 ml-2">{profile.sport}</span></p>
                <p><span className="text-gray-700 font-medium">Role:</span> <span className="text-gray-900 ml-2">{profile.role}</span></p>
                <p><span className="text-gray-700 font-medium">Accessibility:</span> <span className="text-gray-900 ml-2">{profile.disability_flag ? "Yes" : "No"}</span></p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Account Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-700 font-medium">Email:</span> <span className="text-gray-900 ml-2">{user.email}</span></p>
                <p><span className="text-gray-700 font-medium">Income Band:</span> <span className="text-gray-900 ml-2">{profile.income_band}</span></p>
                <p><span className="text-gray-700 font-medium">User ID:</span> <span className="text-gray-900 ml-2">{profile.uid.substring(0, 8)}...</span></p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
              📱 Generate QR Code
            </button>
            <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              ✏️ Edit Profile
            </button>
            <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              📊 View Analytics
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900">247</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-2xl">👁️</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">QR Scans</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-2xl">📱</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Connections</p>
                <p className="text-2xl font-bold text-gray-900">34</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <span className="text-2xl">🤝</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Achievements</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Coming Soon</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-gray-200 p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Analytics</h3>
              <p className="text-gray-600">Track your athletic performance with detailed insights and progress charts.</p>
            </div>
            
            <div className="border-2 border-dashed border-gray-200 p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Goal Setting</h3>
              <p className="text-gray-600">Set and track your athletic goals with milestone tracking and achievements.</p>
            </div>
            
            <div className="border-2 border-dashed border-gray-200 p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Management</h3>
              <p className="text-gray-600">Create and manage teams, schedule training sessions, and coordinate with teammates.</p>
            </div>
            
            <div className="border-2 border-dashed border-gray-200 p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Calendar</h3>
              <p className="text-gray-600">Keep track of competitions, training sessions, and important athletic events.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
