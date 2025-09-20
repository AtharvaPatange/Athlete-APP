"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserStats, checkAndAwardAchievements, initializeUserStats } from '@/services/statsService';
import { getAthleteAssignedCoach, reassignAthleteToAvailableCoach, CoachInfo } from '@/services/coachAssignmentService';
import { useCoachAvailabilityMonitor } from '@/hooks/useCoachAvailabilityMonitor';
import PerformanceTabs from "@/components/PerformanceTabs";
import TransparencyDashboard from "@/components/TransparencyDashboard";
import AthleteQRCode from "@/components/AthleteQRCode";
import ChatbotPopup from "@/components/ChatbotPopup";
import ConsistencyCalendar from "@/components/ConsistencyCalendar";
import VoiceNavigationComponent from "@/components/VoiceNavigationComponent";
import { Camera, RefreshCw } from "lucide-react";

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
  profileImage?: string;
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [assignedCoach, setAssignedCoach] = useState<CoachInfo | null>(null);
  const [coachAssignmentDate, setCoachAssignmentDate] = useState<Date | null>(null);
  const [coachLoading, setCoachLoading] = useState(true);
  const [coachNotification, setCoachNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'warning' | 'info';
  }>({ show: false, message: '', type: 'info' });

  // Monitor coach availability for athletes
  useCoachAvailabilityMonitor(
    profile?.region, 
    profile?.role === 'athlete' && !!user, 
    30 // Check every 30 minutes
  );

  useEffect(() => {
    if (coachNotification.show) {
      const timer = setTimeout(() => {
        setCoachNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [coachNotification.show]);

  // Voice navigation event listeners
  useEffect(() => {
    const handleVoiceTabChange = (event: CustomEvent) => {
      const section = event.detail;
      console.log('Dashboard: Received voice-tab-change event with detail:', section);
      // Only accept valid section names
      if (section === 'overview' || section === 'performance' || section === 'transparency') {
        console.log('Dashboard: Setting active section to:', section);
        setActiveSection(section);
      } else {
        console.log('Dashboard: Invalid section name, ignoring:', section);
      }
    };

    const handleVoiceCombinedNavigation = (event: CustomEvent) => {
      const { section, subTab } = event.detail;
      console.log('Dashboard: Received combined navigation:', { section, subTab });
      
      if (section === 'performance') {
        setActiveSection('performance');
        // Dispatch the sub-tab event after setting the section
        setTimeout(() => {
          const subTabEvent = new CustomEvent('voice-performance-tab-change', { detail: subTab });
          window.dispatchEvent(subTabEvent);
        }, 300);
      }
    };

    const handleVoiceLogout = () => {
      handleLogout();
    };

    window.addEventListener('voice-tab-change', handleVoiceTabChange as EventListener);
    window.addEventListener('voice-navigation-combined', handleVoiceCombinedNavigation as EventListener);
    window.addEventListener('voice-logout', handleVoiceLogout);

    return () => {
      window.removeEventListener('voice-tab-change', handleVoiceTabChange as EventListener);
      window.removeEventListener('voice-navigation-combined', handleVoiceCombinedNavigation as EventListener);
      window.removeEventListener('voice-logout', handleVoiceLogout);
    };
  }, []);

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
        
        // If user is an athlete, fetch assigned coach information
        if (userData.role === 'athlete') {
          await fetchAssignedCoach(user.uid);
        }
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

  const fetchAssignedCoach = async (athleteId: string) => {
    try {
      setCoachLoading(true);
      const result = await getAthleteAssignedCoach(athleteId);
      
      if (result.success) {
        setAssignedCoach(result.coachInfo);
        setCoachAssignmentDate(result.assignmentDate);
        
        // If coach is unavailable, try to reassign
        if (result.coachInfo && result.coachInfo.availability_status === 'unavailable') {
          console.log('Assigned coach is unavailable, attempting reassignment...');
          const reassignResult = await reassignAthleteToAvailableCoach(athleteId);
          
          if (reassignResult.success && reassignResult.newCoach) {
            setAssignedCoach(reassignResult.newCoach);
            setCoachAssignmentDate(new Date());
            setCoachNotification({
              show: true,
              message: `Your coach has been automatically reassigned to ${reassignResult.newCoach.name}`,
              type: 'success'
            });
            console.log('Successfully reassigned to new coach:', reassignResult.newCoach.name);
          } else {
            setCoachNotification({
              show: true,
              message: 'Your assigned coach is currently unavailable. We are looking for an alternative.',
              type: 'warning'
            });
            console.warn('Could not reassign coach:', reassignResult.error);
          }
        }
      } else {
        console.error('Error fetching assigned coach:', result.error);
      }
    } catch (error) {
      console.error('Error in fetchAssignedCoach:', error);
    } finally {
      setCoachLoading(false);
    }
  };

  const handleRefreshCoachInfo = async () => {
    if (user && profile?.role === 'athlete') {
      await fetchAssignedCoach(user.uid);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'sachin');
    formData.append('cloud_name', 'drxliiejo');

    const response = await fetch('https://api.cloudinary.com/v1_1/drxliiejo/image/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB.');
      return;
    }

    setIsUploadingImage(true);
    try {
      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      // Update Firebase user document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        profileImage: imageUrl
      });

      // Update local state
      setProfile(prev => prev ? { ...prev, profileImage: imageUrl } : null);

      console.log('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image. Please try again.');
    } finally {
      setIsUploadingImage(false);
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
      {/* Coach Assignment Notification */}
      {coachNotification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg transition-all duration-300 ${
          coachNotification.type === 'success' ? 'bg-green-100 border border-green-200' :
          coachNotification.type === 'warning' ? 'bg-yellow-100 border border-yellow-200' :
          'bg-blue-100 border border-blue-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className={`w-5 h-5 rounded-full mr-2 mt-0.5 ${
                coachNotification.type === 'success' ? 'bg-green-500' :
                coachNotification.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}></div>
              <p className={`text-sm font-medium ${
                coachNotification.type === 'success' ? 'text-green-800' :
                coachNotification.type === 'warning' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {coachNotification.message}
              </p>
            </div>
            <button
              onClick={() => setCoachNotification(prev => ({ ...prev, show: false }))}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
            Community
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
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-2xl mr-4">
                      {profile.profileImage ? (
                        <img 
                          src={profile.profileImage} 
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold">
                          {profile.role === "athlete" ? "A" : 
                           profile.role === "coach" ? "C" : 
                           profile.role === "admin" ? "AD" : "U"}
                        </span>
                      )}
                    </div>
                    
                    {/* Upload overlay */}
                    <div className="absolute inset-0 w-16 h-16 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mr-4">
                      <Camera className="w-5 h-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploadingImage}
                      />
                    </div>
                    
                    {isUploadingImage && (
                      <div className="absolute inset-0 w-16 h-16 rounded-full bg-black bg-opacity-75 flex items-center justify-center mr-4">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">{profile.name}</h2>
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
            
            <div className="mb-8 ">
              <ConsistencyCalendar athleteId={user.uid} />
            </div>

            {/* Assigned Coach Section - Only for Athletes */}
            {profile.role === 'athlete' && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-slate-700 font-bold text-sm">C</span>
                    </div>
                    Your Assigned Coach
                  </div>
                  <button
                    onClick={handleRefreshCoachInfo}
                    disabled={coachLoading}
                    className="text-slate-600 hover:text-slate-800 p-1 rounded transition-colors disabled:opacity-50"
                    title="Refresh coach information"
                  >
                      <RefreshCw className={`w-5 h-5 ${coachLoading ? 'animate-spin' : ''}`} />
                  </button>
                </h3>
                
                {coachLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : assignedCoach ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-bold mr-4">
                          {assignedCoach.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{assignedCoach.name}</h4>
                          <p className="text-gray-600 text-sm">{assignedCoach.email}</p>
                          <p className="text-gray-500 text-xs">Region: {assignedCoach.region}</p>
                          {assignedCoach.specialization && (
                            <p className="text-gray-500 text-xs">Specialization: {assignedCoach.specialization}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          assignedCoach.availability_status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            assignedCoach.availability_status === 'available' ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          {assignedCoach.availability_status === 'available' ? 'Available' : 'Unavailable'}
                        </div>
                        {coachAssignmentDate && (
                          <p className="text-gray-400 text-xs mt-1">
                            Assigned: {coachAssignmentDate.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Managing {assignedCoach.assigned_athletes.length}/3 Athletes
                      </div>
                      {assignedCoach.experience_years && (
                        <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {assignedCoach.experience_years} Years Experience
                        </div>
                      )}
                      {assignedCoach.rating && (
                        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          ⭐ {assignedCoach.rating.toFixed(1)} Rating
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => router.push('/chat')}
                        className="flex-1 bg-slate-700 hover:bg-slate-800 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
                      >
                        Contact Coach
                      </button>
                      <button 
                        onClick={() => router.push('/athlete')}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded text-sm font-medium transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-yellow-600 text-xl">⚠️</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-800">No Coach Assigned</h4>
                        <p className="text-yellow-700 text-sm">
                          You will be automatically assigned a coach when one becomes available in your region.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}


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

      {/* Voice Navigation */}
      <VoiceNavigationComponent 
        onCommandExecuted={(command) => {
          console.log('Voice command executed:', command);
        }}
      />
    </div>
  );
}