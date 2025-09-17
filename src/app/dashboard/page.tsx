"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserStats, checkAndAwardAchievements, initializeUserStats } from '@/services/statsService';
import PerformanceTabs from "@/components/PerformanceTabs";
import TransparencyDashboard from "@/components/TransparencyDashboard";
import AthleteQRCode from "@/components/AthleteQRCode";
import ChatbotPopup from "@/components/ChatbotPopup";

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
  profileViews?: number;
  qrScans?: number;
  connections?: number;
  achievements?: string[];
  trainingSessionsCount?: number;
  lastActive?: any;
}

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'performance' | 'transparency' | 'qrcode'>('overview');
  const [stats, setStats] = useState({
    profileViews: 0,
    qrScans: 0,
    connections: 0,
    achievements: 0,
    loading: true
  });

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
      // Initialize user stats if they don't exist
      await initializeUserStats(user.uid);
      
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        setProfile(userData);
        
        // Get real stats from Firebase
        const userStats = await getUserStats(user.uid);
        
        if (userStats) {
          setStats({
            profileViews: userStats.profileViews,
            qrScans: userStats.qrScans,
            connections: userStats.connections,
            achievements: userStats.achievements,
            loading: false
          });
        } else {
          // Fallback to zero values if stats can't be retrieved
          setStats({
            profileViews: 0,
            qrScans: 0,
            connections: 0,
            achievements: 0,
            loading: false
          });
        }
        
        // Check and award achievements based on current activity
        await checkAndAwardAchievements(user.uid);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setStats({
        profileViews: 0,
        qrScans: 0,
        connections: 0,
        achievements: 0,
        loading: false
      });
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
          <button
            onClick={() => setActiveSection('transparency')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeSection === 'transparency'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-gray-500 hover:text-slate-700 hover:border-gray-300'
            }`}
          >
            Transparency
          </button>
          <button
            onClick={() => router.push('/chat')}
            className="py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer border-transparent text-gray-500 hover:text-slate-700 hover:border-gray-300 flex items-center gap-1"
          >
            💬 Community
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
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeSection === 'overview' ? (
          <>
            {/* Simplified Profile Section with QR Code */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200 relative">
              <div className="flex flex-col lg:flex-row items-start justify-between mb-6">
                <div className="flex items-center mb-4 lg:mb-0">
                  <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center text-2xl mr-4">
                    <span className="text-white font-bold">
                      {profile.role === "athlete" ? "A" : 
                       profile.role === "coach" ? "C" : 
                       profile.role === "admin" ? "AD" : "U"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">{profile.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-gray-600 text-sm">
                      <span>{profile.sport}</span> <div> | </div>
                      <span>{profile.region}</span> <div> | </div>
                      <span>{profile.age} years</span>
                    </div>
                  </div>
                </div>
                <div className="text-left lg:text-right">
                  <div className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-md text-xs font-medium mb-1 inline-block">
                    {profile.role.toUpperCase()}
                  </div>
                  <p className="text-xs text-gray-500">Member since {new Date(profile.createdAt?.toDate()).toLocaleDateString()}</p>
                </div>
              </div>

              {/* QR Code Section - More compact */}
              <div className="mt-6">
                <AthleteQRCode />
              </div>
            </div>

            {/* Dynamic Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Profile Views */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-semibold mb-1">Profile Views</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {stats.loading ? (
                        <div className="w-12 h-8 bg-blue-200 rounded animate-pulse"></div>
                      ) : (
                        stats.profileViews.toLocaleString()
                      )}
                    </p>
                    <p className="text-blue-600 text-xs mt-1">↗ +12% this month</p>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* QR Scans */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-semibold mb-1">QR Scans</p>
                    <p className="text-3xl font-bold text-green-900">
                      {stats.loading ? (
                        <div className="w-12 h-8 bg-green-200 rounded animate-pulse"></div>
                      ) : (
                        stats.qrScans.toLocaleString()
                      )}
                    </p>
                    <p className="text-green-600 text-xs mt-1">↗ +8% this week</p>
                  </div>
                  <div className="bg-green-500 p-3 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Connections */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 text-sm font-semibold mb-1">Connections</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {stats.loading ? (
                        <div className="w-12 h-8 bg-purple-200 rounded animate-pulse"></div>
                      ) : (
                        stats.connections.toLocaleString()
                      )}
                    </p>
                    <p className="text-purple-600 text-xs mt-1">↗ +5 new this week</p>
                  </div>
                  <div className="bg-purple-500 p-3 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Achievements */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg border border-yellow-200 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-700 text-sm font-semibold mb-1">Achievements</p>
                    <p className="text-3xl font-bold text-yellow-900">
                      {stats.loading ? (
                        <div className="w-12 h-8 bg-yellow-200 rounded animate-pulse"></div>
                      ) : (
                        stats.achievements.toLocaleString()
                      )}
                    </p>
                    <p className="text-yellow-600 text-xs mt-1">🏆 Latest: Training Goal</p>
                  </div>
                  <div className="bg-yellow-500 p-3 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
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
                <button 
                  onClick={() => setActiveSection('transparency')}
                  className="border border-slate-600 text-white px-8 py-3 rounded-md font-medium hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  View Transparency
                </button>
              </div>
            </div>

            {/* Available and Coming Soon Features */}
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 relative">
              <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Platform Features</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Available Feature - Community Chat */}
                <div 
                  onClick={() => router.push('/chat')}
                  className="text-center p-6 rounded-xl shadow-md border border-orange-200 bg-orange-50 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="bg-orange-100 p-4 w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <div className="text-2xl">💬</div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Community Chat</h3>
                  <p className="text-gray-600 text-sm mb-3">Connect with athletes, coaches, and get real-time support in our community chat.</p>
                  <span className="inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">Available Now</span>
                </div>

                {/* Coming Soon Features */}
                {[
                  { title: "Goal Setting", desc: "Set and track your athletic goals with milestone tracking and achievements.", color: "bg-blue-100", icon: "bg-blue-500" },
                  { title: "Team Management", desc: "Create and manage teams, schedule training sessions, and coordinate with teammates.", color: "bg-green-100", icon: "bg-green-500" },
                  { title: "Event Calendar", desc: "Keep track of competitions, training sessions, and important athletic events.", color: "bg-purple-100", icon: "bg-purple-500" },
                ].map((item, i) => (
                  <div key={i} className="text-center p-6 rounded-xl shadow-md border border-gray-100 opacity-75">
                    <div className={`${item.color} p-4 w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center`}>
                      <div className={`${item.icon} w-6 h-6 rounded-md`}></div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{item.desc}</p>
                    <span className="inline-block bg-gray-400 text-white text-xs px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : activeSection === 'performance' ? (
          /* Performance Section */
          <div className="relative">
            <PerformanceTabs 
              athleteId={user.uid} 
              sport={profile.sport}
              region={profile.region}
            />
          </div>
        ) : (
          /* Transparency Section */
          <div className="relative">
            <TransparencyDashboard />
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

      {/* Chatbot Popup */}
      <ChatbotPopup />
    </div>
  );
}