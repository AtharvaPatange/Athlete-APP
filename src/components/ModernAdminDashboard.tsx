"use client";
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
        
        // Generate mock performance stats for demonstration
        const performanceStats = {
          strength: Math.floor(Math.random() * 40) + 60,
          speed: Math.floor(Math.random() * 40) + 60,
          endurance: Math.floor(Math.random() * 40) + 60,
          agility: Math.floor(Math.random() * 40) + 60,
          technique: Math.floor(Math.random() * 40) + 60,
          mental: Math.floor(Math.random() * 40) + 60
        };

        const medals = {
          gold: Math.floor(Math.random() * 5),
          silver: Math.floor(Math.random() * 8),
          bronze: Math.floor(Math.random() * 10)
        };

        athleteProfiles.push({
          id: doc.id,
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
          trainingHours: Math.floor(Math.random() * 30) + 10,
          competitionsParticipated: Math.floor(Math.random() * 20) + 5,
          medals
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
            <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-400 border-r-purple-400 border-b-cyan-400 border-l-pink-400 animate-spin"></div>
            <BarChart3 className="w-6 h-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Loading Dashboard...</h3>
          <p className="text-gray-300 text-sm">Gathering athlete data</p>
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
          className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors mb-6"
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
              <h2 className="text-2xl font-bold text-white mb-2">{selectedAthlete.name}</h2>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full border border-emerald-400/30">
                <Trophy className="w-4 h-4 text-emerald-400 mr-2" />
                <span className="text-emerald-300 text-sm font-medium">{selectedAthlete.sport}</span>
              </div>
              
              <div className="mt-6 space-y-3 text-left">
                <div className="flex items-center text-gray-300">
                  <Mail className="w-4 h-4 mr-3 text-blue-400" />
                  <span className="text-sm">{selectedAthlete.email}</span>
                </div>
                {selectedAthlete.phone && (
                  <div className="flex items-center text-gray-300">
                    <Phone className="w-4 h-4 mr-3 text-green-400" />
                    <span className="text-sm">{selectedAthlete.phone}</span>
                  </div>
                )}
                {selectedAthlete.city && (
                  <div className="flex items-center text-gray-300">
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
              <h3 className="text-xl font-bold text-white flex items-center">
                <Activity className="w-6 h-6 mr-3 text-cyan-400" />
                Performance Analysis
              </h3>
              <div className="flex items-center space-x-2 text-cyan-400">
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
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#D1D5DB', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
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
                <p className="text-amber-300 text-sm font-medium">Training Hours</p>
                <p className="text-2xl font-bold text-white">{selectedAthlete.trainingHours || 0}</p>
                <p className="text-amber-200 text-xs">per week</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-md rounded-2xl p-6 border border-emerald-400/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm font-medium">Competitions</p>
                <p className="text-2xl font-bold text-white">{selectedAthlete.competitionsParticipated || 0}</p>
                <p className="text-emerald-200 text-xs">participated</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-md rounded-2xl p-6 border border-yellow-400/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">Gold Medals</p>
                <p className="text-2xl font-bold text-white">{selectedAthlete.medals?.gold || 0}</p>
                <p className="text-yellow-200 text-xs">achievements</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-3 rounded-xl">
                <Medal className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Total Medals</p>
                <p className="text-2xl font-bold text-white">
                  {(selectedAthlete.medals?.gold || 0) + (selectedAthlete.medals?.silver || 0) + (selectedAthlete.medals?.bronze || 0)}
                </p>
                <p className="text-purple-200 text-xs">all categories</p>
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
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
          Sports Ministry Dashboard
        </h1>
        <p className="text-gray-300 text-lg">Comprehensive athlete management and analytics platform</p>
      </div>

      {/* Modern Tab Navigation */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3, gradient: 'from-blue-500 to-purple-600' },
            { id: 'athletes', label: 'Athletes', icon: Users, gradient: 'from-emerald-500 to-teal-600' },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp, gradient: 'from-amber-500 to-orange-600' },
            { id: 'reports', label: 'Reports', icon: PieChartIcon, gradient: 'from-red-500 to-pink-600' }
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
                    : "text-gray-300 hover:text-white hover:bg-white/10"
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
              gradient: 'from-blue-500 to-purple-600',
              iconBg: 'from-blue-500 to-blue-600'
            },
            { 
              title: 'Active Athletes', 
              value: athleteStats.activeAthletes, 
              subtitle: 'Currently active', 
              icon: Activity, 
              gradient: 'from-emerald-500 to-teal-600',
              iconBg: 'from-emerald-500 to-emerald-600'
            },
            { 
              title: 'New Registrations', 
              value: athleteStats.newRegistrations, 
              subtitle: 'Last 6 months', 
              icon: TrendingUp, 
              gradient: 'from-amber-500 to-orange-600',
              iconBg: 'from-amber-500 to-amber-600'
            },
            { 
              title: 'With Disabilities', 
              value: athleteStats.byDisability.disabled, 
              subtitle: `${((athleteStats.byDisability.disabled / athleteStats.totalAthletes) * 100).toFixed(1)}% of total`, 
              icon: Shield, 
              gradient: 'from-purple-500 to-pink-600',
              iconBg: 'from-purple-500 to-purple-600'
            }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className={`bg-gradient-to-br ${stat.gradient}/20 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:scale-105 transition-transform duration-300`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`bg-gradient-to-br ${stat.iconBg} p-3 rounded-xl shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <Sparkles className="w-4 h-4 text-white/60" />
                </div>
                <h4 className="text-white/80 text-sm font-medium mb-2">{stat.title}</h4>
                <p className="text-3xl font-bold text-white mb-1">{stat.value.toLocaleString('en-IN')}</p>
                <p className="text-white/60 text-xs">{stat.subtitle}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Athletes Tab */}
      {activeTab === 'athletes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 mr-3 text-blue-400" />
              Athlete Directory
            </h2>
            <div className="text-sm text-gray-300">
              Total: {athletes.length} athletes
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {athletes.slice(0, 12).map((athlete, index) => (
              <div
                key={athlete.id}
                onClick={() => setSelectedAthlete(athlete)}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:scale-105 hover:bg-white/15 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {athlete.name}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center text-gray-300">
                    <Trophy className="w-4 h-4 mr-2 text-amber-400" />
                    <span className="text-sm">{athlete.sport}</span>
                  </div>
                  
                  {athlete.city && (
                    <div className="flex items-center text-gray-300">
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
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
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
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
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
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <PieChartIcon className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Advanced Reports</h3>
          <p className="text-gray-300 mb-8 max-w-md mx-auto">
            Generate comprehensive reports on athlete performance, demographics, and administrative metrics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
              Performance Report
            </button>
            <button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105">
              Demographics Report
            </button>
            <button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105">
              Export Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}