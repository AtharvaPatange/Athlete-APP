"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ModernAdminDashboard from "@/components/ModernAdminDashboard";
import { Trophy, Shield, Users, ChevronRight } from "lucide-react";

interface UserProfile {
  name: string;
  role: string;
  uid: string;
  createdAt: any;
}

export default function AdminPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

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
        const userData = docSnap.data() as UserProfile;
        setProfile(userData);
        
        // Check if user is admin
        if (userData.role === 'admin' || userData.role === 'government') {
          setAuthorized(true);
        } else {
          // Redirect non-admin users to regular dashboard
          router.push("/dashboard");
        }
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
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#182031] to-[#303644] flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-32 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-lg animate-pulse delay-500"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-400 border-r-purple-400 border-b-cyan-400 border-l-pink-400 animate-spin"></div>
            <Shield className="w-6 h-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Loading Admin Console...</h3>
          <p className="text-gray-300 text-sm">Securing your access</p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile || !authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#182031] to-[#303644] flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-8 right-8 w-32 h-32 bg-gradient-to-br from-red-400/30 to-orange-500/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-8 left-8 w-24 h-24 bg-gradient-to-br from-red-400/30 to-pink-500/30 rounded-full blur-xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-md">
            <h3 className="text-2xl font-bold text-white mb-3">Access Denied</h3>
            <p className="text-gray-300 mb-6">You don't have permission to access the admin console.</p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Go to Dashboard</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 relative" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Grid Background */}
      <div 
        className="fixed inset-0 opacity-100 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 2px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)",
          backgroundSize: '32px 32px'
        }}
      ></div>

      {/* Top Banner */}
      <div className="bg-slate-800 text-center py-3 relative z-10">
        <div className="flex items-center justify-center text-white text-sm">
          <Shield className="w-4 h-4 mr-2" />
          🏛️ Government Administration Portal - Sports Ministry Dashboard
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo + Title */}
            <div className="flex items-center space-x-6">
              <div
                onClick={() => router.push("/")}
                className="flex items-center cursor-pointer"
              >
                <img
                  src="/AthleteX.png"        
                  alt="AthleteX Logo"
                  width={90}      
                  height={20}
                />
              </div>
              <div className="text-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-800 p-1.5 rounded-lg">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-800">Admin Console</h1>
                    <p className="text-xs text-gray-600">Sports Ministry Portal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Info + Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-800">{profile.name}</p>
                <p className="text-xs text-gray-600 capitalize flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {profile.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-white transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <span>Logout</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <ModernAdminDashboard adminId={user.uid} adminRole={profile.role} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>©️ 2024 Sports Ministry, Government of India. All rights reserved.</p>
            <p className="mt-1 text-gray-500">RTI Compliance | Data Protection Act | Sports Policy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}