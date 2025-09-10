"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminDashboard from "@/components/AdminDashboard";

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || !authorized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <strong className="font-bold">Access Denied</strong>
            <span className="block sm:inline"> You don't have permission to access this page.</span>
          </div>
          <button 
            onClick={() => router.push("/dashboard")}
            className="mt-4 bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition"
          >
            Go to Dashboard
          </button>
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
          🏛️ Government Administration Portal - Sports Ministry Dashboard
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo + Title */}
            <div className="flex items-center space-x-4">
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
                <h1 className="text-lg font-semibold">Admin Console</h1>
                <p className="text-xs text-gray-500">Sports Ministry Portal</p>
              </div>
            </div>

            {/* Admin Info + Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-800">{profile.name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 border border-gray-600 px-4 py-2 rounded-md text-slate-700 
                           cursor-pointer hover:bg-gray-100 hover:border-slate-800 hover:shadow-sm transition text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AdminDashboard adminId={user.uid} adminRole={profile.role} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2024 Sports Ministry, Government of India. All rights reserved.</p>
            <p className="mt-1">RTI Compliance | Data Protection Act | Sports Policy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
