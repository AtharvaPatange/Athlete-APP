"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getAthleteAchievements } from "@/services/injuryService";
import { User, MapPin, Trophy, Target, Calendar, MessageCircle, TrendingUp, Search, AlertTriangle, Users, CheckCircle2, AlertCircle, X, Heart, Activity, Shield, UserCheck, UserX, Zap, Circle, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Athlete {
  id: string;
  name: string;
  age: number;
  sport: string;
  region: string;
  email: string;
  gender: string;
  disability_flag?: boolean;
  income_band?: string;
  performance?: {
    speed: number;
    strength: number;
    endurance: number;
    agility?: number;
  };
  achievements?: {
    totalChallenges: number;
    completedChallenges: number;
    totalPoints: number;
    achievements: any[];
    recentActivity: any[];
    currentTier?: string;
    tierProgress?: number;
  };
  completedGoals?: number;
  priority_level?: 'high' | 'medium' | 'low';
  injury_risk?: 'high' | 'medium' | 'low';
  performance_trend?: 'improving' | 'declining' | 'stable';
  injury_status?: 'injured' | 'recovering' | 'healthy';
  injury_severity?: 'low' | 'medium' | 'severe';
  recovery_progress?: number; // 0-100
  recovery_start_date?: string;
  estimated_return_date?: string;
  injury_type?: string;
  medical_notes?: string;
  lastActiveAt?: any;
  createdAt?: any;
  recent_injuries?: any[];
}

interface RegionalAthletesViewProps {
  coachRegion: string;
  coachSport: string;
  coachId: string;
  assignedAthletes?: string[];
  availabilityStatus?: 'available' | 'unavailable';
}

export const EnhancedRegionalAthletesView: React.FC<RegionalAthletesViewProps> = ({ 
  coachRegion, 
  coachSport, 
  coachId,
  assignedAthletes = [],
  availabilityStatus = 'unavailable'
}) => {
  const router = useRouter();
  const [rawAthletes, setRawAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "age" | "performance" | "priority">("priority");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [injuryRiskFilter, setInjuryRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'compact' | 'detailed'>('table');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const sports = [
    "all", "football", "basketball", "tennis", "swimming", 
    "running", "cycling", "weightlifting", "other"
  ];

  // Priority and injury risk calculation
  const calculatePriorityLevel = (athlete: Athlete): 'high' | 'medium' | 'low' => {
    let score = 0;
    
    // Injury risk factors
    if (athlete.injury_risk === 'high') score += 3;
    else if (athlete.injury_risk === 'medium') score += 2;
    else score += 1;
    
    // Performance trend
    if (athlete.performance_trend === 'declining') score += 2;
    else if (athlete.performance_trend === 'stable') score += 1;
    
    // Activity level
    const lastActive = athlete.lastActiveAt?.toDate ? athlete.lastActiveAt.toDate() : new Date(athlete.lastActiveAt || Date.now());
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive > 7) score += 2;
    else if (daysSinceActive > 3) score += 1;
    
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  };

  const calculateInjuryRisk = (athlete: Athlete): 'high' | 'medium' | 'low' => {
    // Mock calculation - in real app this would use ML model or complex logic
    const recentInjuries = athlete.recent_injuries?.length || 0;
    const performance = athlete.performance;
    
    if (recentInjuries >= 2 || (performance && (performance.speed < 3 || performance.endurance < 3))) {
      return 'high';
    } else if (recentInjuries >= 1 || (performance && (performance.speed < 5 || performance.endurance < 5))) {
      return 'medium';
    }
    return 'low';
  };

  // Memoized filtered and sorted athletes
  const filteredAthletes = useMemo(() => {
    // Apply filters and sorting
    let filtered = rawAthletes.filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === "all" || athlete.priority_level === priorityFilter;
      const matchesInjuryRisk = injuryRiskFilter === "all" || athlete.injury_risk === injuryRiskFilter;
      return matchesSearch && matchesPriority && matchesInjuryRisk;
    });

    // Sort athletes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority_level || 'low'] - priorityOrder[a.priority_level || 'low'];
        case "name":
          return a.name.localeCompare(b.name);
        case "age":
          return a.age - b.age;
        case "performance":
          const aPerf = (a.performance?.speed || 0) + (a.performance?.strength || 0) + (a.performance?.endurance || 0);
          const bPerf = (b.performance?.speed || 0) + (b.performance?.strength || 0) + (b.performance?.endurance || 0);
          return bPerf - aPerf;
        default:
          return 0;
      }
    });

    return filtered;
  }, [rawAthletes, searchTerm, priorityFilter, injuryRiskFilter, sortBy]);

  // Paginated athletes
  const athletes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAthletes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAthletes, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil(filteredAthletes.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, injuryRiskFilter, sortBy]);

  // Real-time data fetching with priority calculations
  useEffect(() => {
    if (!coachRegion) return;

    const usersRef = collection(db, "users");
    let q;

    // If coach is available and has assigned athletes, show only those
    if (availabilityStatus === 'available' && assignedAthletes.length > 0) {
      // Query only the assigned athletes
      q = query(
        usersRef,
        where("role", "==", "athlete"),
        where("__name__", "in", assignedAthletes.slice(0, 10)) // Firestore 'in' has a limit of 10
      );
    } else {
      // Show message that coach needs to be available to see athletes
      setRawAthletes([]);
      setLoading(false);
      return;
    }

    // Real-time listener
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const athleteData = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<Athlete, 'id'>;
        const athlete = { ...data, id: doc.id };
        
        // Calculate priority and injury risk
        athlete.priority_level = calculatePriorityLevel(athlete);
        athlete.injury_risk = calculateInjuryRisk(athlete);
        athlete.performance_trend = athlete.performance_trend || 'stable';
        
        return athlete;
      });

      // Fetch achievement data for all athletes
      const athleteIds = athleteData.map(athlete => athlete.id);
      if (athleteIds.length > 0) {
        try {
          const achievementResult = await getAthleteAchievements(athleteIds);
          if (achievementResult.success) {
            // Add achievement data to each athlete
            athleteData.forEach(athlete => {
              const athleteAchievements = (achievementResult.achievements as { [key: string]: any })[athlete.id];
              if (athleteAchievements) {
                athlete.achievements = athleteAchievements;
              } else {
                // Default achievement data if none found
                athlete.achievements = {
                  totalChallenges: 0,
                  completedChallenges: 0,
                  totalPoints: 0,
                  achievements: [],
                  recentActivity: [],
                  currentTier: 'Bronze',
                  tierProgress: 0
                };
              }
            });
          }
        } catch (error) {
          console.error('Error fetching achievement data:', error);
          // Set default achievement data for all athletes
          athleteData.forEach(athlete => {
            athlete.achievements = {
              totalChallenges: 0,
              completedChallenges: 0,
              totalPoints: 0,
              achievements: [],
              recentActivity: [],
              currentTier: 'Bronze',
              tierProgress: 0
            };
          });
        }
      }

      setRawAthletes(athleteData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching athletes:", error);
      setError("Failed to fetch athletes");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [coachRegion, availabilityStatus, assignedAthletes]);

  const athleteStats = {
    total: filteredAthletes.length,
    highPriority: filteredAthletes.filter(a => a.priority_level === 'high').length,
    highRisk: filteredAthletes.filter(a => a.injury_risk === 'high').length,
    avgAge: filteredAthletes.length > 0 
      ? Math.round(filteredAthletes.reduce((sum, a) => sum + a.age, 0) / filteredAthletes.length)
      : 0,
  };

  // Handler functions
  const handleMessage = (athlete: Athlete) => {
    // Navigate to chat with specific athlete
    router.push(`/chat?athleteId=${athlete.id}&athleteName=${encodeURIComponent(athlete.name)}`);
  };

  const handleViewDetails = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setShowDetailModal(true);
  };

  const getInjuryStatusTag = (athlete: Athlete) => {
    if (athlete.injury_status === 'injured' && athlete.injury_severity) {
      const severityColors = {
        low: 'bg-amber-100 text-amber-800 border border-amber-200',
        medium: 'bg-orange-100 text-orange-800 border border-orange-200',
        severe: 'bg-red-100 text-red-800 border border-red-200'
      };
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${severityColors[athlete.injury_severity]}`}>
          <AlertTriangle className="w-3 h-3 mr-1" />
          Injured ({athlete.injury_severity})
        </span>
      );
    } else if (athlete.injury_status === 'recovering') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200">
          <RefreshCw className="w-3 h-3 mr-1" />
          Recovering {athlete.recovery_progress ? `(${athlete.recovery_progress}%)` : ''}
        </span>
      );
    }
    return null;
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-lg font-medium text-red-600">Error Loading Athletes</p>
        <p className="text-sm text-gray-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">

        {/* Grid Background */}
        <div 
          className="fixed inset-0 opacity-100 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 2px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)",
            backgroundSize: '32px 32px'
          }}
        ></div>
        
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-8 p-8 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-300 shadow-lg">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {availabilityStatus === 'available' ? 'My Assigned Athletes' : 'Athlete Management'}
            </h2>
            <p className="text-gray-600 text-lg">
              {availabilityStatus === 'available' 
                ? `${coachRegion} Region • Managing ${assignedAthletes.length}/3 assigned athletes`
                : `${coachRegion} Region • Set availability status to manage athletes`
              }
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-5 text-center border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-blue-600 mb-1">{athleteStats.total}</div>
              <div className="text-sm text-blue-600 font-medium">Total Athletes</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-5 text-center border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-rose-600 mb-1">{athleteStats.highPriority}</div>
              <div className="text-sm text-rose-600 font-medium">High Priority</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-5 text-center border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-amber-600 mb-1">{athleteStats.highRisk}</div>
              <div className="text-sm text-amber-600 font-medium">Injury Risk</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-5 text-center border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-emerald-600 mb-1">21</div>
              {/*{athleteStats.avgAge} */}
              <div className="text-sm text-emerald-600 font-medium">Avg Age</div>
            </div>
          </div>
        </div>
    </div>

      {/* Search and Filters with Priority Management */}
      <div className="mb-6 space-y-4">
        {/* Top Row - Search and Quick Actions */}
        <div className="lg:flex lg:items-center lg:justify-between lg:space-x-4">
          <div className="flex-1 mb-4 lg:mb-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-[#303644]"
                placeholder="Search athletes by name, sport, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedAthletes.length > 0 && (
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {selectedAthletes.length} selected
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer">
                Send Message
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer">
                Schedule Training
              </button>
            </div>
          )}

          <Link 
            href="/chat"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="w-4 h-4" />
            Open Community Chat
          </Link>
        </div>
        
        {/* Filter Row */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer text-gray-800"
          >
            {sports.map(sport => (
              <option className="text-gray-800" key={sport} value={sport}>
                {sport === "all" ? "All Sports" : sport.charAt(0).toUpperCase() + sport.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer text-gray-800"
          >
            <option className="text-gray-800" value="all">All Priority</option>
            <option className="text-gray-800" value="high">◾ High Priority</option>
            <option className="text-gray-800" value="medium">◾ Medium Priority</option>
            <option className="text-gray-800" value="low">◾ Low Priority</option>
          </select>

          <select
            value={injuryRiskFilter}
            onChange={(e) => setInjuryRiskFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer text-gray-800"
          >
            <option className="text-gray-800" value="all">All Risk Levels</option>
            <option className="text-gray-800" value="high">⚡ High Risk</option>
            <option className="text-gray-800" value="medium">⚡ Medium Risk</option>
            <option className="text-gray-800" value="low">⚡ Low Risk</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer text-gray-800"
          >
            <option className="text-gray-800" value="priority">Sort by Priority</option>
            <option className="text-gray-800" value="name">Sort by Name</option>
            <option className="text-gray-800" value="age">Sort by Age</option>
            <option className="text-gray-800" value="performance">Sort by Performance</option>
          </select>
          
          {/* View Mode Toggle */}
          <div className="ml-4 flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                viewMode === 'compact' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Athletes Display */}
      {loading ? (
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg border p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : athletes.length === 0 ? (
        <div className="text-center py-12 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg border">
          {availabilityStatus === 'unavailable' ? (
            <>
              <UserX className="w-16 h-16 mx-auto text-orange-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Set Your Availability Status</h3>
              <p className="text-gray-600 mb-4">
                Toggle your availability status to "Available" in the header to be assigned 3 athletes to manage.
              </p>
              <p className="text-sm text-gray-700">
                Athletes will be automatically assigned based on priority (injury risk, performance needs).
              </p>
            </>
          ) : assignedAthletes.length === 0 ? (
            <>
              <UserCheck className="w-16 h-16 mx-auto text-blue-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Athletes Being Assigned</h3>
              <p className="text-gray-600 mb-4">
                You're available for coaching! Athletes are being assigned to you based on their priority needs.
              </p>
            </>
          ) : (
            <>
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Athletes Match Filters</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filters to see your assigned athletes.
              </p>
            </>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Optimal Table View */
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAthletes.length === athletes.length && athletes.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAthletes(athletes.map(a => a.id));
                        } else {
                          setSelectedAthletes([]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Athlete
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Injury Risk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {athletes.map((athlete, index) => (
                  <tr key={athlete.id} className={`hover:bg-gray-50 transition-colors ${
                    selectedAthletes.includes(athlete.id) ? 'bg-blue-50' : ''
                  }`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedAthletes.includes(athlete.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAthletes(prev => [...prev, athlete.id]);
                          } else {
                            setSelectedAthletes(prev => prev.filter(id => id !== athlete.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm mr-3 shadow-sm ${
                          ['bg-blue-600', 'bg-purple-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-teal-600', 'bg-orange-600'][athlete.name.charCodeAt(0) % 8]
                        }`}>
                          {athlete.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{athlete.name}</div>
                          <div className="text-sm text-gray-700">{athlete.age}y • {athlete.region}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        athlete.priority_level === 'high' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        athlete.priority_level === 'medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {athlete.priority_level === 'high' ? (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            High
                          </>
                        ) : athlete.priority_level === 'medium' ? (
                          <>
                            <Circle className="w-3 h-3 mr-1" />
                            Medium
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Low
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getInjuryStatusTag(athlete) || (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        athlete.injury_risk === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                        athlete.injury_risk === 'medium' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                        'bg-cyan-100 text-cyan-800 border border-cyan-200'
                      }`}>
                        {athlete.injury_risk === 'high' ? (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            High
                          </>
                        ) : athlete.injury_risk === 'medium' ? (
                          <>
                            <Zap className="w-3 h-3 mr-1" />
                            Medium
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Low
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {athlete.performance ? (
                        <div className="flex space-x-1">
                          <div className="text-xs">
                            <div className="font-medium">S: {athlete.performance.speed}</div>
                            <div className="text-gray-700">St: {athlete.performance.strength}</div>
                            <div className="text-gray-700">E: {athlete.performance.endurance}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No data</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center text-sm font-medium ${
                        athlete.performance_trend === 'improving' ? 'text-green-600' :
                        athlete.performance_trend === 'declining' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {athlete.performance_trend === 'improving' ? <TrendingUp className="w-4 h-4 mr-1" /> :
                         athlete.performance_trend === 'declining' ? <AlertCircle className="w-4 h-4 mr-1" /> : 
                         <CheckCircle2 className="w-4 h-4 mr-1" />}
                        {athlete.performance_trend || 'Stable'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Trophy className="w-3 h-3 mr-1" />
                          {athlete.achievements?.achievements?.length || 0}
                        </div>
                        <div className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          {athlete.completedGoals || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end space-x-1">
                        <button 
                          onClick={() => handleMessage(athlete)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded cursor-pointer transition-colors"
                          title="Message Athlete"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded cursor-pointer transition-colors">
                          <Calendar className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleViewDetails(athlete)}
                          className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded cursor-pointer transition-colors"
                          title="View Details"
                        >
                          <TrendingUp className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Compact List View */
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
          <div className="divide-y divide-slate-200">
            {athletes.map((athlete) => (
              <div key={athlete.id} className="p-5 hover:bg-slate-50 transition-all duration-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedAthletes.includes(athlete.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAthletes(prev => [...prev, athlete.id]);
                        } else {
                          setSelectedAthletes(prev => prev.filter(id => id !== athlete.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                    />
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium shadow-sm ${
                      ['bg-blue-600', 'bg-purple-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-teal-600', 'bg-orange-600'][athlete.name.charCodeAt(0) % 8]
                    }`}>
                      {athlete.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{athlete.name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          athlete.priority_level === 'high' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          athlete.priority_level === 'medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {athlete.priority_level === 'high' ? (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              High Priority
                            </>
                          ) : athlete.priority_level === 'medium' ? (
                            <>
                              <Circle className="w-3 h-3 mr-1" />
                              Medium
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Low
                            </>
                          )}
                        </span>
                        {getInjuryStatusTag(athlete)}
                        {athlete.injury_risk === 'high' && !getInjuryStatusTag(athlete) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Injury Risk
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-700">
                        <span>{athlete.age} years</span>
                        <span>{athlete.region}</span>
                        {athlete.performance && (
                          <span>Performance: {Math.round((athlete.performance.speed + athlete.performance.strength + athlete.performance.endurance) / 3)}/10</span>
                        )}
                        <div className={`flex items-center ${
                          athlete.performance_trend === 'improving' ? 'text-green-600' :
                          athlete.performance_trend === 'declining' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {athlete.performance_trend === 'improving' ? <TrendingUp className="w-3 h-3 mr-1" /> :
                           athlete.performance_trend === 'declining' ? <AlertCircle className="w-3 h-3 mr-1" /> : 
                           <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {athlete.performance_trend || 'Stable'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleMessage(athlete)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium cursor-pointer transition-colors"
                    >
                      Message
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium cursor-pointer transition-colors">
                      Schedule
                    </button>
                    <button 
                      onClick={() => handleViewDetails(athlete)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium cursor-pointer transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredAthletes.length > itemsPerPage && (
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 mt-6 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAthletes.length)} of {filteredAthletes.length} athletes
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!hasPrevPage}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  hasPrevPage 
                    ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  const isCurrentPage = page === currentPage;
                  const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  
                  if (!showPage && page !== currentPage - 2 && page !== currentPage + 2) {
                    return null;
                  }
                  
                  if ((page === currentPage - 2 && currentPage > 3) || (page === currentPage + 2 && currentPage < totalPages - 2)) {
                    return (
                      <span key={page} className="px-2 py-1 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        isCurrentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={!hasNextPage}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  hasNextPage 
                    ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Athlete Profile Modal */}
      {showDetailModal && selectedAthlete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${
                  ['bg-blue-600', 'bg-purple-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-teal-600', 'bg-orange-600'][selectedAthlete.name.charCodeAt(0) % 8]
                }`}>
                  {selectedAthlete.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedAthlete.name}</h2>
                  <p className="text-gray-600 text-lg">{selectedAthlete.age} years • {selectedAthlete.region}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-3 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8">
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Priority Level</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedAthlete.priority_level === 'high' ? 'bg-red-100 text-red-800' :
                      selectedAthlete.priority_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedAthlete.priority_level === 'high' ? (
                        <>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          High
                        </>
                      ) : selectedAthlete.priority_level === 'medium' ? (
                        <>
                          <Circle className="w-3 h-3 mr-1" />
                          Medium
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Low
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Health Status</span>
                    {getInjuryStatusTag(selectedAthlete) || (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Healthy
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Injury Risk</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedAthlete.injury_risk === 'high' ? 'bg-red-100 text-red-800' :
                      selectedAthlete.injury_risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedAthlete.injury_risk === 'high' ? (
                        <>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          High
                        </>
                      ) : selectedAthlete.injury_risk === 'medium' ? (
                        <>
                          <Zap className="w-3 h-3 mr-1" />
                          Medium
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Low
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              {selectedAthlete.performance && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Activity className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{selectedAthlete.performance.speed}/10</div>
                      <div className="text-sm text-gray-600">Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Shield className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{selectedAthlete.performance.strength}/10</div>
                      <div className="text-sm text-gray-600">Strength</div>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Heart className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{selectedAthlete.performance.endurance}/10</div>
                      <div className="text-sm text-gray-600">Endurance</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <div className={`inline-flex items-center text-sm font-medium ${
                      selectedAthlete.performance_trend === 'improving' ? 'text-green-600' :
                      selectedAthlete.performance_trend === 'declining' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {selectedAthlete.performance_trend === 'improving' ? <TrendingUp className="w-4 h-4 mr-1" /> :
                       selectedAthlete.performance_trend === 'declining' ? <AlertCircle className="w-4 h-4 mr-1" /> : 
                       <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Performance Trend: {selectedAthlete.performance_trend === 'improving' ? 'Improving' :
                       selectedAthlete.performance_trend === 'declining' ? 'Declining' : 'Stable'}
                    </div>
                  </div>
                </div>
              )}

              {/* Recovery Progress */}
              {selectedAthlete.injury_status === 'recovering' && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-900 mb-1">
                        <span>Recovery Progress</span>
                        <span>{selectedAthlete.recovery_progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${selectedAthlete.recovery_progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    {selectedAthlete.injury_type && (
                      <p className="text-sm text-gray-600">
                        <strong>Injury Type:</strong> {selectedAthlete.injury_type}
                      </p>
                    )}
                    {selectedAthlete.estimated_return_date && (
                      <p className="text-sm text-gray-600">
                        <strong>Estimated Return:</strong> {selectedAthlete.estimated_return_date}
                      </p>
                    )}
                    {selectedAthlete.medical_notes && (
                      <p className="text-sm text-gray-600">
                        <strong>Medical Notes:</strong> {selectedAthlete.medical_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Achievements & Goals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                    Achievements
                  </h3>
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {selectedAthlete.achievements?.achievements?.length || 0}
                  </div>
                  <p className="text-sm text-gray-600">Total achievements earned</p>
                  <div className="mt-3 text-xs text-gray-700">
                    <div>Total Points: {selectedAthlete.achievements?.totalPoints || 0}</div>
                    {selectedAthlete.achievements?.currentTier && (
                      <div>Current Tier: {selectedAthlete.achievements.currentTier}</div>
                    )}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    Challenges Completed
                  </h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {selectedAthlete.achievements?.completedChallenges || 0}
                  </div>
                  <p className="text-sm text-gray-600">Challenges completed successfully</p>
                  <div className="mt-3 text-xs text-gray-700">
                    <div>Total Challenges: {selectedAthlete.achievements?.totalChallenges || 0}</div>
                    <div>Recent Activity: {selectedAthlete.achievements?.recentActivity?.length || 0} items</div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="ml-2 text-gray-900">{selectedAthlete.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Region:</span>
                    <span className="ml-2 text-gray-900">{selectedAthlete.region}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Gender:</span>
                    <span className="ml-2 text-gray-900">{selectedAthlete.gender}</span>
                  </div>
                  {selectedAthlete.disability_flag && (
                    <div>
                      <span className="font-medium text-gray-600">Special Needs:</span>
                      <span className="ml-2 text-blue-600">Yes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button 
                  onClick={() => {
                    handleMessage(selectedAthlete);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Send Message
                </button>
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Training
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRegionalAthletesView;