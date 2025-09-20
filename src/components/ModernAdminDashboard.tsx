"use client";
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getTrainingSessions, TrainingSession } from "@/services/performanceService";
import { 
  Users, Trophy, TrendingUp, Activity, Medal, Target, 
  ChevronRight, ArrowLeft, Star, Zap, Shield, Award,
  BarChart3, PieChart as PieChartIcon, User, Calendar,
  MapPin, Phone, Mail, Sparkles
} from "lucide-react";

interface AdminDashboardProps {
  adminId: string;
  adminRole: string;
}

interface AthleteStats {
  totalAthletes: number;
  activeAthletes: number;
  newRegistrations: number;
  byDisability: { enabled: number; disabled: number };
  byCategory: { [key: string]: number };
  byRegion: { [key: string]: number };
  byGender: { male: number; female: number; other: number };
}

interface AthleteProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender: string;
  sport: string;
  category: string;
  region?: string;
  city?: string;
  achievements?: string[];
  coachName?: string;
  emergencyContact?: string;
  medicalInfo?: string;
  performanceStats?: {
    strength: number;
    speed: number;
    endurance: number;
    agility: number;
    technique: number;
    mental: number;
  };
  trainingHours?: number;
  competitionsParticipated?: number;
  medals?: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

const COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
const GRADIENT_COLORS = [
  'from-blue-500 to-purple-600',
  'from-purple-500 to-pink-600', 
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-red-500 to-pink-600'
];

// Helper functions to fetch real athlete data
const fetchAthleteTrainingData = async (athleteId: string) => {
  try {
    console.log("🔍 Fetching training data for athlete:", athleteId);
    
    // Use the existing service to get training sessions
    const result = await getTrainingSessions(athleteId, 100); // Get up to 100 sessions
    
    if (!result.success || result.sessions.length === 0) {
      console.log("❌ No training sessions found for athlete:", athleteId);
      return { weeklyHours: 0, totalSessions: 0 };
    }
    
    console.log("📊 Total training sessions found:", result.sessions.length);
    
    let totalHours = 0;
    let sessionCount = 0;
    
    // Filter for last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    console.log("📅 Filtering sessions after:", fourWeeksAgo.toISOString());
    
    result.sessions.forEach((session: TrainingSession) => {
      const sessionDate = session.date;
      
      console.log("📅 Session date:", sessionDate.toISOString(), "Duration:", session.duration, "minutes");
      
      // Only count sessions from last 4 weeks
      if (sessionDate >= fourWeeksAgo) {
        const durationHours = (session.duration || 0) / 60; // Convert minutes to hours
        totalHours += durationHours;
        sessionCount++;
        console.log("✅ Valid session - Duration:", session.duration, "minutes =", durationHours, "hours");
      } else {
        console.log("❌ Session too old, skipping");
      }
    });
    
    const weeklyHours = Math.round((totalHours / 4) * 10) / 10;
    console.log("📈 Final calculation - Total hours:", totalHours, "Weekly average:", weeklyHours, "Sessions:", sessionCount);
    
    return {
      weeklyHours,
      totalSessions: sessionCount
    };
  } catch (error) {
    console.error("❌ Error fetching training data for athlete:", athleteId, error);
    return { weeklyHours: 0, totalSessions: 0 };
  }
};

const fetchAthleteQuestData = async (athleteId: string) => {
  try {
    // Check if athlete_quests collection exists and fetch completed quests
    const questQuery = query(
      collection(db, "athlete_quests"),
      where("athleteId", "==", athleteId),
      where("status", "==", "completed")
    );
    
    const questSnapshot = await getDocs(questQuery);
    let completedQuests = 0;
    let totalPoints = 0;
    
    questSnapshot.forEach((doc) => {
      const data = doc.data();
      completedQuests++;
      totalPoints += data.points || 0;
    });
    
    return {
      completedQuests,
      totalPoints
    };
  } catch (error) {
    // If collection doesn't exist or there's an error, return defaults
    console.log("No quest data available for athlete:", athleteId);
    return { completedQuests: 0, totalPoints: 0 };
  }
};

const fetchAthletePerformanceStats = async (athleteId: string) => {
  try {
    console.log("🔍 Fetching performance stats for athlete:", athleteId);
    
    // Use the existing service to get training sessions
    const result = await getTrainingSessions(athleteId, 50); // Get last 50 sessions for stats
    
    if (!result.success || result.sessions.length === 0) {
      console.log("❌ No training sessions found for performance stats:", athleteId);
      return {
        strength: 60,
        speed: 60,
        endurance: 60,
        agility: 60,
        technique: 60,
        mental: 60
      };
    }
    
    console.log("📊 Total sessions for performance calculation:", result.sessions.length);
    
    // Take most recent 20 sessions for performance calculation
    const recentSessions = result.sessions.slice(0, 20);
    
    // Initialize stats
    const stats = {
      strength: 0,
      speed: 0,
      endurance: 0,
      agility: 0,
      technique: 0,
      mental: 0
    };
    
    let strengthSessions = 0;
    let cardioSessions = 0;
    let flexibilitySessions = 0;
    let coordinationSessions = 0;
    let totalIntensityPoints = 0;
    let totalSessions = recentSessions.length;
    
    recentSessions.forEach((session: TrainingSession) => {
      const category = session.category || 'cardio';
      const intensity = session.intensity || 'medium';
      
      // Map intensity to points
      const intensityPoints = {
        'low': 1,
        'medium': 2, 
        'high': 3,
        'peak': 4
      };
      
      totalIntensityPoints += intensityPoints[intensity as keyof typeof intensityPoints] || 2;
      
      // Count sessions by category
      switch (category) {
        case 'strength':
          strengthSessions++;
          break;
        case 'cardio':
          cardioSessions++;
          break;
        case 'flexibility':
          flexibilitySessions++;
          break;
        case 'coordination':
          coordinationSessions++;
          break;
      }
    });
    
    if (totalSessions > 0) {
      // Calculate stats based on training data
      stats.strength = Math.min(100, 50 + (strengthSessions / totalSessions) * 30 + (totalIntensityPoints / totalSessions) * 10);
      stats.speed = Math.min(100, 50 + (cardioSessions / totalSessions) * 25 + (totalIntensityPoints / totalSessions) * 15);
      stats.endurance = Math.min(100, 50 + (cardioSessions / totalSessions) * 30 + (totalIntensityPoints / totalSessions) * 10);
      stats.agility = Math.min(100, 50 + (coordinationSessions / totalSessions) * 25 + (flexibilitySessions / totalSessions) * 15);
      stats.technique = Math.min(100, 50 + (coordinationSessions / totalSessions) * 20 + (totalIntensityPoints / totalSessions) * 20);
      stats.mental = Math.min(100, 50 + (totalSessions / 20) * 30 + (totalIntensityPoints / totalSessions) * 10);
    } else {
      // Default stats if no training data
      stats.strength = 60;
      stats.speed = 60;
      stats.endurance = 60;
      stats.agility = 60;
      stats.technique = 60;
      stats.mental = 60;
    }
    
    // Round all stats
    Object.keys(stats).forEach(key => {
      stats[key as keyof typeof stats] = Math.round(stats[key as keyof typeof stats]);
    });
    
    console.log("📈 Performance stats calculated:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Error fetching performance stats for athlete:", athleteId, error);
    return {
      strength: 60,
      speed: 60,
      endurance: 60,
      agility: 60,
      technique: 60,
      mental: 60
    };
  }
};

const calculateAthleteMedals = async (athleteId: string) => {
  try {
    // Fetch completed quests to determine medals
    const questQuery = query(
      collection(db, "athlete_quests"),
      where("athleteId", "==", athleteId),
      where("status", "==", "completed")
    );
    
    const questSnapshot = await getDocs(questQuery);
    
    let gold = 0;
    let silver = 0;
    let bronze = 0;
    
    questSnapshot.forEach((doc) => {
      const data = doc.data();
      const tier = data.tier || 'bronze';
      const rarity = data.rarity || 'bronze';
      
      // Award medals based on quest tier/rarity
      switch (tier) {
        case 'diamond':
        case 'platinum':
          gold++;
          break;
        case 'gold':
          if (rarity === 'gold' || rarity === 'platinum' || rarity === 'diamond') {
            gold++;
          } else {
            silver++;
          }
          break;
        case 'silver':
          silver++;
          break;
        default:
          bronze++;
          break;
      }
    });
    
    // Also check achievements collection
    try {
      const achievementsQuery = query(
        collection(db, "achievements"),
        where("userId", "==", athleteId)
      );
      
      const achievementsSnapshot = await getDocs(achievementsQuery);
      
      achievementsSnapshot.forEach((doc) => {
        const data = doc.data();
        const type = data.type || 'milestone';
        
        // Award medals based on achievement type
        switch (type) {
          case 'performance':
            gold++;
            break;
          case 'training':
            silver++;
            break;
          default:
            bronze++;
            break;
        }
      });
    } catch (achievementError) {
      console.log("No achievements collection or error:", achievementError);
    }
    
    return { gold, silver, bronze };
  } catch (error) {
    console.log("Error calculating medals, using defaults");
    return { gold: 0, silver: 0, bronze: 0 };
  }
};

export default function ModernAdminDashboard({ adminId, adminRole }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'athletes' | 'analytics' | 'reports'>('overview');
  const [athleteStats, setAthleteStats] = useState<AthleteStats | null>(null);
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch athlete profiles
      const athletesRef = collection(db, "users");
      const athletesQuery = query(athletesRef, where("role", "==", "athlete"), limit(100));
      const athletesSnapshot = await getDocs(athletesQuery);
      
      const athleteProfiles: AthleteProfile[] = [];
      
      for (const doc of athletesSnapshot.docs) {
        const data = doc.data();
        const athleteId = doc.id;
        
        // Fetch real training data
        const trainingData = await fetchAthleteTrainingData(athleteId);
        
        // Fetch real quest/challenge data
        const questData = await fetchAthleteQuestData(athleteId);
        
        // Fetch performance stats
        const performanceStats = await fetchAthletePerformanceStats(athleteId);
        
        // Calculate medals based on completed quests/achievements
        const medals = await calculateAthleteMedals(athleteId);

        athleteProfiles.push({
          id: athleteId,
          name: data.name || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || 'Not specified',
          sport: data.sport || 'General',
          category: data.category || 'Open',
          region: data.region || '',
          city: data.city || '',
          achievements: data.achievements || [],
          coachName: data.coachName || '',
          emergencyContact: data.emergencyContact || '',
          medicalInfo: data.medicalInfo || '',
          performanceStats,
          trainingHours: trainingData.weeklyHours || 0,
          competitionsParticipated: questData.completedQuests || 0,
          medals: {
            gold: medals.gold || 0,
            silver: medals.silver || 0,
            bronze: medals.bronze || 0
          }
        });
      }

      setAthletes(athleteProfiles);

      // Calculate stats
      const stats: AthleteStats = {
        totalAthletes: athleteProfiles.length,
        activeAthletes: Math.floor(athleteProfiles.length * 0.8),
        newRegistrations: Math.floor(athleteProfiles.length * 0.15),
        byDisability: {
          enabled: Math.floor(athleteProfiles.length * 0.85),
          disabled: Math.floor(athleteProfiles.length * 0.15)
        },
        byCategory: {},
        byRegion: {},
        byGender: {
          male: athleteProfiles.filter(a => a.gender?.toLowerCase() === 'male').length,
          female: athleteProfiles.filter(a => a.gender?.toLowerCase() === 'female').length,
          other: athleteProfiles.filter(a => a.gender?.toLowerCase() === 'other').length
        }
      };

      // Group by category (with backward compatibility for sport)
      athleteProfiles.forEach(athlete => {
        // Map old sport values to new categories for backward compatibility
        let category = athlete.category || athlete.sport || 'Other';
        
        // Comprehensive mapping of exercises to the 4 main categories
        const categoryMapping: { [key: string]: string } = {
          // Main categories (normalize naming)
          'cardio': 'cardio',
          'strength': 'strength', 
          'flexibility': 'flexibility',
          'flexibility_balance': 'flexibility', // Normalize this variant
          'coordination': 'coordination',
          // Exercise mappings
          'Running': 'cardio',
          'Cycling': 'cardio',
          'Swimming': 'cardio',
          'Jogging': 'cardio',
          'Treadmill': 'cardio',
          'Basketball': 'cardio',
          'Soccer': 'cardio',
          'Push-ups': 'strength',
          'Squats': 'strength',
          'Pull-ups': 'strength',
          'Deadlifts': 'strength',
          'Bench Press': 'strength',
          'Planks': 'strength',
          'Lunges': 'strength',
          'Burpees': 'strength',
          'Weightlifting': 'strength',
          'Powerlifting': 'strength',
          'Yoga': 'flexibility',
          'Stretching': 'flexibility',
          'Balance Training': 'flexibility',
          'Mobility Work': 'flexibility',
          'Pilates': 'flexibility',
          'Agility Drills': 'coordination',
          'Ball Handling': 'coordination',
          'Throwing Practice': 'coordination',
          'Catching Drills': 'coordination',
          'Ladder Drills': 'coordination',
          'Cone Drills': 'coordination',
          'Reaction Training': 'coordination',
          'Gymnastics': 'coordination',
          'Martial Arts': 'coordination'
        };
        
        // Map to one of the 4 main categories
        category = categoryMapping[category] || 'cardio'; // Default to cardio if unknown
        
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      });

      // Group by region
      athleteProfiles.forEach(athlete => {
        const region = athlete.region || 'Not specified';
        stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
      });

      setAthleteStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-300/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-black border-r-gray-800 border-b-gray-600 border-l-gray-900 animate-spin"></div>
            <BarChart3 className="w-6 h-6 text-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">Loading Dashboard...</h3>
          <p className="text-gray-600 text-sm">Gathering athlete data</p>
        </div>
      </div>
    );
  }

  if (selectedAthlete) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedAthlete(null)}
          className="flex items-center space-x-2 text-black hover:text-gray-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Athletes</span>
        </button>

        {/* Athlete Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">{selectedAthlete.name}</h2>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full border border-emerald-400/30">
                <Trophy className="w-4 h-4 text-emerald-400 mr-2" />
                <span className="text-emerald-700 text-sm font-medium">{selectedAthlete.sport}</span>
              </div>
              
              <div className="mt-6 space-y-3 text-left">
                <div className="flex items-center text-gray-700">
                  <Mail className="w-4 h-4 mr-3 text-blue-400" />
                  <span className="text-sm">{selectedAthlete.email}</span>
                </div>
                {selectedAthlete.phone && (
                  <div className="flex items-center text-gray-700">
                    <Phone className="w-4 h-4 mr-3 text-green-400" />
                    <span className="text-sm">{selectedAthlete.phone}</span>
                  </div>
                )}
                {selectedAthlete.city && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-4 h-4 mr-3 text-red-400" />
                    <span className="text-sm">{selectedAthlete.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Radar Chart */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black flex items-center">
                <Activity className="w-6 h-6 mr-3 text-cyan-400" />
                Performance Analysis
              </h3>
              <div className="flex items-center space-x-2 text-cyan-600">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Real-time Data</span>
              </div>
            </div>
            
            {selectedAthlete.performanceStats && (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { subject: 'Strength', A: selectedAthlete.performanceStats.strength },
                  { subject: 'Speed', A: selectedAthlete.performanceStats.speed },
                  { subject: 'Endurance', A: selectedAthlete.performanceStats.endurance },
                  { subject: 'Agility', A: selectedAthlete.performanceStats.agility },
                  { subject: 'Technique', A: selectedAthlete.performanceStats.technique },
                  { subject: 'Mental', A: selectedAthlete.performanceStats.mental }
                ]}>
                  <PolarGrid gridType="polygon" stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#000000', fontSize: 12, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#000000', fontSize: 10 }} />
                  <Radar name="Performance" dataKey="A" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-6 border border-amber-400/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-700 text-sm font-medium">Training Hours</p>
                <p className="text-2xl font-bold text-black">{selectedAthlete.trainingHours || 0}</p>
                <p className="text-amber-600 text-xs">per week</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-md rounded-2xl p-6 border border-emerald-400/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 text-sm font-medium">Competitions</p>
                <p className="text-2xl font-bold text-black">{selectedAthlete.competitionsParticipated || 0}</p>
                <p className="text-emerald-600 text-xs">participated</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-md rounded-2xl p-6 border border-yellow-400/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 text-sm font-medium">Gold Medals</p>
                <p className="text-2xl font-bold text-black">{selectedAthlete.medals?.gold || 0}</p>
                <p className="text-yellow-600 text-xs">achievements</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-3 rounded-xl">
                <Medal className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-medium">Total Medals</p>
                <p className="text-2xl font-bold text-black">
                  {(selectedAthlete.medals?.gold || 0) + (selectedAthlete.medals?.silver || 0) + (selectedAthlete.medals?.bronze || 0)}
                </p>
                <p className="text-purple-600 text-xs">all categories</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-black">
          Sports Ministry Dashboard
        </h1>
        <p className="text-gray-600 text-lg">Comprehensive athlete management and analytics platform</p>
      </div>

      {/* Modern Tab Navigation */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3, gradient: 'from-black to-gray-900' },
            { id: 'athletes', label: 'Athletes', icon: Users, gradient: 'from-black to-gray-900' },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp, gradient: 'from-black to-gray-900' },
            { id: 'reports', label: 'Reports', icon: PieChartIcon, gradient: 'from-black to-gray-900' }
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative p-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  isActive
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                    : "text-gray-700 hover:text-black hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center space-x-3">
                  <IconComponent className="w-5 h-5" />
                  <span>{tab.label}</span>
                </div>
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {/* Overview Tab */}
      {activeTab === 'overview' && athleteStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: 'Total Athletes', 
              value: athleteStats.totalAthletes, 
              subtitle: 'Registered athletes', 
              icon: Users, 
              gradient: 'from-blue-500 via-indigo-600 to-purple-700',
              iconBg: 'from-blue-600 to-indigo-700',
              bgPattern: 'from-blue-50/90 via-indigo-50/80 to-purple-100/90',
              textColor: 'text-blue-800',
              valueColor: 'text-blue-900',
              subtitleColor: 'text-blue-600'
            },
            { 
              title: 'Active Athletes', 
              value: athleteStats.activeAthletes, 
              subtitle: 'Currently active', 
              icon: Activity, 
              gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
              iconBg: 'from-emerald-600 to-teal-700',
              bgPattern: 'from-emerald-50/90 via-teal-50/80 to-cyan-100/90',
              textColor: 'text-emerald-800',
              valueColor: 'text-emerald-900',
              subtitleColor: 'text-emerald-600'
            },
            { 
              title: 'New Registrations', 
              value: athleteStats.newRegistrations, 
              subtitle: 'Last 6 months', 
              icon: TrendingUp, 
              gradient: 'from-amber-500 via-orange-600 to-red-700',
              iconBg: 'from-amber-600 to-orange-700',
              bgPattern: 'from-amber-50/90 via-orange-50/80 to-red-100/90',
              textColor: 'text-amber-800',
              valueColor: 'text-amber-900',
              subtitleColor: 'text-amber-600'
            },
            { 
              title: 'With Disabilities', 
              value: athleteStats.byDisability.disabled, 
              subtitle: `${((athleteStats.byDisability.disabled / athleteStats.totalAthletes) * 100).toFixed(1)}% of total`, 
              icon: Shield, 
              gradient: 'from-purple-500 via-pink-600 to-rose-700',
              iconBg: 'from-purple-600 to-pink-700',
              bgPattern: 'from-purple-50/90 via-pink-50/80 to-rose-100/90',
              textColor: 'text-purple-800',
              valueColor: 'text-purple-900',
              subtitleColor: 'text-purple-600'
            }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className={`bg-gradient-to-br ${stat.bgPattern} backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-2xl hover:scale-105 hover:shadow-3xl transition-all duration-500 relative overflow-hidden group`}>
                {/* Animated background overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`bg-gradient-to-br ${stat.iconBg} p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                    <Sparkles className={`w-5 h-5 ${stat.textColor} group-hover:animate-pulse`} />
                  </div>
                  
                  <h4 className={`${stat.textColor} text-sm font-bold mb-3 group-hover:scale-105 transition-transform duration-300`}>{stat.title}</h4>
                  <p className={`text-4xl font-black ${stat.valueColor} mb-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-sm`}>
                    {stat.value.toLocaleString('en-IN')}
                  </p>
                  <p className={`${stat.subtitleColor} text-xs font-medium`}>{stat.subtitle}</p>
                </div>
                
                {/* Decorative gradient border */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.gradient} opacity-20 blur-sm group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`}></div>
              </div>
            );
          })}
        </div>
      )}

      {/* Athletes Tab */}
      {activeTab === 'athletes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-black flex items-center">
              <Users className="w-6 h-6 mr-3 text-blue-400" />
              Athlete Directory
            </h2>
            <div className="text-sm text-gray-600">
              Total: {athletes.length} athletes
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {athletes.slice(0, 12).map((athlete, index) => (
              <div
                key={athlete.id}
                onClick={() => setSelectedAthlete(athlete)}
                className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-300 shadow-xl hover:scale-105 hover:bg-white transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </div>
                
                <h3 className="text-lg font-semibold text-black mb-2 group-hover:text-blue-600 transition-colors">
                  {athlete.name}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-rose-500" />
                    <span className="text-sm">{athlete.region}</span>
                  </div>
                  
                  {athlete.city && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-red-400" />
                      <span className="text-sm">{athlete.city}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-emerald-400">
                      <Medal className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">
                        {(athlete.medals?.gold || 0) + (athlete.medals?.silver || 0) + (athlete.medals?.bronze || 0)} medals
                      </span>
                    </div>
                    
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-500'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && athleteStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gender Distribution */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-300 shadow-xl">
            <h3 className="text-xl font-semibold text-black mb-6 flex items-center">
              <PieChartIcon className="w-6 h-6 mr-3 text-purple-400" />
              Gender Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Male', value: athleteStats.byGender.male },
                    { name: 'Female', value: athleteStats.byGender.female },
                    { name: 'Other', value: athleteStats.byGender.other }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Exercise Category Distribution */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-300 shadow-xl">
            <h3 className="text-xl font-semibold text-black mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-cyan-400" />
              Exercise Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(athleteStats.byCategory).map(([category, count]) => {
                const categoryDisplayNames: { [key: string]: string } = {
                  'cardio': 'Cardio',
                  'strength': 'Strength', 
                  'flexibility_balance': 'Flexibility & Balance',
                  'coordination': 'Coordination'
                };
                return { 
                  category: categoryDisplayNames[category] || category, 
                  count 
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" tick={{ fill: '#D1D5DB', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151', 
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl text-center relative overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-gray-800/30 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 via-gray-800 to-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ring-2 ring-gray-600/50">
              <PieChartIcon className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Advanced Reports</h3>
            <p className="text-gray-300 mb-8 max-w-md mx-auto drop-shadow-sm">
              Generate comprehensive reports on athlete performance, demographics, and administrative metrics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-gradient-to-r from-white to-gray-100 text-black px-6 py-3 rounded-xl hover:from-gray-100 hover:to-white transition-all duration-300 transform hover:scale-105 font-medium shadow-lg hover:shadow-xl">
                Performance Report
              </button>
              <button className="bg-gradient-to-r from-gray-100 to-white text-black px-6 py-3 rounded-xl hover:from-white hover:to-gray-100 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg hover:shadow-xl">
                Demographics Report
              </button>
              <button className="bg-gradient-to-r from-white to-gray-100 text-black px-6 py-3 rounded-xl hover:from-gray-100 hover:to-white transition-all duration-300 transform hover:scale-105 font-medium shadow-lg hover:shadow-xl">
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}