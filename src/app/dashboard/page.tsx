"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PerformanceTabs from "@/components/PerformanceTabs";

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
  const [activeSection, setActiveSection] = useState<'overview' | 'performance'>('overview');

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
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
          Join thousands of athletes achieving their performance goals 
        </div>
      </div>

      {/* Header */}
<header className="bg-white shadow-sm relative z-10">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      
      {/* Logo + Tabs together on left */}
      <div className="flex items-center space-x-8">
        {/* Logo */}
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

        {/* Tabs */}
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveSection('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeSection === 'overview'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-gray-500 hover:text-slate-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSection('performance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeSection === 'performance'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-gray-500 hover:text-slate-700 hover:border-gray-300'
            }`}
          >
            Performance
          </button>
        </div>
      </div>

      {/* Welcome + Logout on right */}
      <div className="flex items-center space-x-4">
        <span className="text-slate-600 hidden md:block">
          Welcome, {profile.name}!
        </span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {activeSection === 'overview' ? (
          <>
            {/* Profile Section */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-12 border border-gray-200 relative">
              <div className="flex flex-col lg:flex-row items-start justify-between mb-8">
                <div className="flex items-center mb-6 lg:mb-0">
                  <div className="bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center text-3xl mr-6">
                    <span className="text-white font-bold">
                      {profile.role === "athlete" ? "A" : 
                       profile.role === "coach" ? "C" : 
                       profile.role === "admin" ? "AD" : "U"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">{profile.name}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                      <span className="flex items-center">{profile.sport}</span> <div> | </div>
                      <span>{profile.region}</span> <div> | </div>
                      <span>{profile.age} years</span>
                    </div>
                  </div>
                </div>
                <div className="text-left lg:text-right">
                  <div className="bg-slate-100 text-slate-800 px-4 py-2 rounded-md text-sm font-medium mb-2 inline-block">
                    {profile.role.toUpperCase()}
                  </div>
                  <p className="text-sm text-gray-500">Member since {new Date(profile.createdAt?.toDate()).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-4 text-lg">Personal Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="text-slate-800 font-medium">{profile.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region:</span>
                      <span className="text-slate-800 font-medium">{profile.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="text-slate-800 font-medium">{profile.age}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-4 text-lg">Athletic Profile</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Primary Sport:</span>
                      <span className="text-slate-800 font-medium">{profile.sport}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="text-slate-800 font-medium">{profile.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accessibility:</span>
                      <span className="text-slate-800 font-medium">{profile.disability_flag ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-4 text-lg">Account Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="text-slate-800 font-medium text-sm">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Band:</span>
                      <span className="text-slate-800 font-medium">{profile.income_band}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="text-slate-800 font-medium">{profile.uid.substring(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-md font-medium transition-colors cursor-pointer">
                  Generate QR Code →
                </button>
                <button className="border border-slate-300 text-slate-700 px-6 py-3 rounded-md font-medium hover:bg-slate-50 transition-colors cursor-pointer">
                  Edit Profile
                </button>
                <button 
                  onClick={() => setActiveSection('performance')}
                  className="border border-slate-300 text-slate-700 px-6 py-3 rounded-md font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  View Performance
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">Profile Views</p>
                    <p className="text-2xl font-bold text-gray-900">247</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">QR Scans</p>
                    <p className="text-2xl font-bold text-gray-900">89</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 rounded"></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">Connections</p>
                    <p className="text-2xl font-bold text-gray-900">34</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <div className="w-6 h-6 bg-purple-500 rounded"></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">Achievements</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-slate-800 rounded-2xl p-12 text-center text-white mb-12 relative shadow-lg">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Performance?</h2>
              <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
                Join our platform as an athlete and make a difference in your sports career
                while building your own athletic business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setActiveSection('performance')}
                  className="bg-white text-slate-800 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  View Performance
                </button>
                <button className="border border-slate-600 text-white px-8 py-3 rounded-md font-medium hover:bg-slate-700 transition-colors cursor-pointer">
                  Learn More
                </button>
              </div>
            </div>

            {/* Coming Soon Features */}
            {/* Coming Soon Features (Square Stack Style) */}
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 relative">
              <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Coming Soon</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Goal Setting", desc: "Set and track your athletic goals with milestone tracking and achievements.", color: "bg-blue-100", icon: "bg-blue-500" },
                  { title: "Team Management", desc: "Create and manage teams, schedule training sessions, and coordinate with teammates.", color: "bg-green-100", icon: "bg-green-500" },
                  { title: "Event Calendar", desc: "Keep track of competitions, training sessions, and important athletic events.", color: "bg-purple-100", icon: "bg-purple-500" },
                  { title: "Competitions", desc: "Register for competitions and track your performance against other athletes.", color: "bg-yellow-100", icon: "bg-yellow-500" },
                ].map((item, i) => (
                  <div key={i} className="text-center p-6 rounded-xl shadow-md border border-gray-100">
                    <div className={`${item.color} p-4 w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center`}>
                      <div className={`${item.icon} w-6 h-6 rounded-md`}></div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Performance Section */
          <div className="relative">
            <PerformanceTabs 
              athleteId={user.uid} 
              sport={profile.sport}
              region={profile.region}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className=" cursor : pointer flex items-center mb-4">
                <img
                  src="/AthleteX.png"        
                  alt="AthleteX Logo"
                  width={100}      
                  height={20}      
                  />
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Empowering athletes worldwide with quality training and comprehensive performance resources.
              </p>
              <div className="flex space-x-4">
                <button className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200">
                  <span className="text-gray-600">f</span>
                </button>
                <button className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200">
                  <span className="text-gray-600">t</span>
                </button>
                <button className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200">
                  <span className="text-gray-600">in</span>
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="cursor-pointer hover:text-slate-800">Training Programs</p>
                <p className="cursor-pointer hover:text-slate-800">Performance Analytics</p>
                <p className="cursor-pointer hover:text-slate-800">Study Materials</p>
                <p className="cursor-pointer hover:text-slate-800">About Us</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Support</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="cursor-pointer hover:text-slate-800">Help Center</p>
                <p className="cursor-pointer hover:text-slate-800">Contact Us</p>
                <p className="cursor-pointer hover:text-slate-800">Privacy Policy</p>
                <p className="cursor-pointer hover:text-slate-800">Terms of Service</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Contact Info</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>support@athleteapp.com</p>
                <p>+1 (555) 123-4567</p>
                <p>123 Sports St, Athletic City, AC 12345</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}