"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, limit, startAfter, onSnapshot } from "firebase/firestore";
import AthleteProfileCard from "./AthleteProfileCard";
import { User, MapPin, Trophy, Target, Calendar, MessageCircle, TrendingUp, Search, Filter, AlertTriangle, X, Users, BarChart3, Award, Zap, Activity, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line } from "recharts";
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
  achievements?: any[];
  completedGoals?: number;
  lastActiveAt?: any;
  createdAt?: any;
  injury_risk?: 'low' | 'medium' | 'high';
  recent_injuries?: any[];
  performance_trend?: 'improving' | 'stable' | 'declining';
  priority_level?: 'high' | 'medium' | 'low';
}

interface RegionalAthletesViewProps {
  coachRegion: string;
  coachSport: string;
  coachId: string;
}

const RegionalAthletesView = ({ coachRegion, coachSport, coachId }: RegionalAthletesViewProps) => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "age" | "lastActive" | "performance" | "priority">("priority");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [injuryRiskFilter, setInjuryRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  
  // Pagination
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
    const lastActive = athlete.lastActiveAt?.toDate ? athlete.lastActiveAt.toDate() : new Date(athlete.lastActiveAt);
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

  const sports = [
    "all", "football", "basketball", "tennis", "swimming", 
    "running", "cycling", "weightlifting", "other"
  ];

  // Real-time data fetching with priority calculations
  useEffect(() => {
    const usersRef = collection(db, "users");
    let q = query(
      usersRef,
      where("role", "==", "athlete"),
      where("region", "==", coachRegion)
    );

    if (selectedSport !== "all") {
      q = query(
        usersRef,
        where("role", "==", "athlete"),
        where("region", "==", coachRegion),
        where("sport", "==", selectedSport)
      );
    }

    // Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const athleteData = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<Athlete, 'id'>;
        const athlete = { ...data, id: doc.id };
        
        // Calculate priority and injury risk
        athlete.priority_level = calculatePriorityLevel(athlete);
        athlete.injury_risk = calculateInjuryRisk(athlete);
        
        return athlete;
      });

      // Apply filters and sorting
      let filteredAthletes = athleteData.filter(athlete => {
        const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority = priorityFilter === "all" || athlete.priority_level === priorityFilter;
        const matchesInjuryRisk = injuryRiskFilter === "all" || athlete.injury_risk === injuryRiskFilter;
        return matchesSearch && matchesPriority && matchesInjuryRisk;
      });

      // Sort athletes
      filteredAthletes.sort((a, b) => {
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

      setAthletes(filteredAthletes);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching athletes:", error);
      setError("Failed to fetch athletes");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [coachRegion, selectedSport, sortBy, searchTerm, priorityFilter, injuryRiskFilter]);

  const fetchAthletes = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const usersRef = collection(db, "users");
      
      // Simplified query to avoid composite index requirements
      let q = query(
        usersRef,
        where("role", "==", "athlete"),
        where("region", "==", coachRegion)
      );

      // Add sport filter if not "all" - but only if we haven't added other filters
      if (selectedSport !== "all") {
        q = query(
          usersRef,
          where("role", "==", "athlete"),
          where("region", "==", coachRegion),
          where("sport", "==", selectedSport)
        );
      }

      // Add pagination
      q = query(q, limit(20));
      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      let athletesList: Athlete[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        athletesList.push({
          id: doc.id,
          name: data.name || "Unknown",
          age: data.age || 0,
          sport: data.sport || "Unknown",
          region: data.region || "Unknown",
          email: data.email || "",
          gender: data.gender || "Unknown",
          disability_flag: data.disability_flag || false,
          income_band: data.income_band || "Unknown",
          performance: data.performance || { speed: 0, strength: 0, endurance: 0 },
          lastActiveAt: data.lastActiveAt,
          createdAt: data.createdAt
        });
      });

      // Apply client-side sorting since we can't use orderBy with multiple where clauses
      switch (sortBy) {
        case "name":
          athletesList.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "age":
          athletesList.sort((a, b) => a.age - b.age);
          break;
        case "lastActive":
          athletesList.sort((a, b) => {
            const aTime = a.lastActiveAt?.toMillis?.() || 0;
            const bTime = b.lastActiveAt?.toMillis?.() || 0;
            return bTime - aTime; // Descending order
          });
          break;
        default:
          athletesList.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime; // Descending order
          });
      }

      if (isLoadMore) {
        setAthletes(prev => [...prev, ...athletesList]);
      } else {
        setAthletes(athletesList);
      }

      // Set pagination state
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length === 20);

    } catch (err: any) {
      console.error("Error fetching athletes:", err);
      setError(err.message || "Failed to fetch athletes");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreAthletes = () => {
    if (!loadingMore && hasMore) {
      fetchAthletes(true);
    }
  };

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const athleteStats = {
    total: filteredAthletes.length,
    sports: [...new Set(filteredAthletes.map(a => a.sport))].length,
    avgAge: filteredAthletes.length > 0 
      ? Math.round(filteredAthletes.reduce((sum, a) => sum + a.age, 0) / filteredAthletes.length)
      : 0,
    withDisabilities: filteredAthletes.filter(a => a.disability_flag).length
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-[#F6F7F7] min-h-screen">
        <div className="bg-white rounded-xl shadow-sm border border-[#182031]/10 p-8 max-w-md mx-auto">
          <div className="text-[#0F172A] mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium">Error Loading Athletes</p>
            <p className="text-sm text-[#303644] mt-2">{error}</p>
          </div>
          <button
            onClick={() => fetchAthletes()}
            className="px-6 py-3 bg-[#0F172A] text-white rounded-lg hover:bg-[#182031] transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F6F7F7] min-h-screen relative">
      {/* Grid Background */}
      <div 
        className="fixed inset-0 opacity-100 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 2px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)",
          backgroundSize: '32px 32px'
        }}
      ></div>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Header & Stats */}
        <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2 flex items-center gap-3">
              <Users className="w-7 h-7 text-[#182031]" />
              Athletes in {coachRegion.charAt(0).toUpperCase() + coachRegion.slice(1)} Region
            </h2>
            <p className="text-[#303644] text-lg">
              Manage and monitor athletes in your region
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 lg:mt-0">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-[#182031]/10">
              <div className="text-2xl font-bold text-[#0F172A]">{athleteStats.total}</div>
              <div className="text-sm text-[#303644] font-medium">Total Athletes</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-[#182031]/10">
              <div className="text-2xl font-bold text-[#0F172A]">{athleteStats.sports}</div>
              <div className="text-sm text-[#303644] font-medium">Sports</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-[#182031]/10">
              <div className="text-2xl font-bold text-[#0F172A]">20</div>
              {/* {athleteStats.avgAge} */}
              <div className="text-sm text-[#303644] font-medium">Avg Age</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-[#182031]/10">
              <div className="text-2xl font-bold text-[#0F172A]">{athleteStats.withDisabilities}</div>
              <div className="text-sm text-[#303644] font-medium">Special Needs</div>
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
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#303644]" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-[#182031]/20 rounded-lg leading-5 bg-white placeholder:text-gray-700 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-[#0F172A] transition-all"
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
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer">
                Mark Priority
              </button>
            </div>
          )}

          <Link 
            href="/chat"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="w-4 h-4" />
            Open Community Chat
          </Link>
        </div>
        
        {/* Filter Row */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="border border-[#182031]/20 rounded-lg px-4 py-2 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-[#0F172A] cursor-pointer transition-all min-w-[120px]"
            >
              {sports.map(sport => (
                <option key={sport} value={sport} className="text-[#0F172A]">
                  {sport === "all" ? "All Sports" : sport.charAt(0).toUpperCase() + sport.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="border border-[#182031]/20 rounded-lg px-4 py-2 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-[#0F172A] cursor-pointer transition-all min-w-[140px]"
            >
              <option value="all">All Priority</option>
              <option value="high">🔴 High Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="low">🟢 Low Priority</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={injuryRiskFilter}
              onChange={(e) => setInjuryRiskFilter(e.target.value as any)}
              className="border border-[#182031]/20 rounded-lg px-4 py-2 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-[#0F172A] cursor-pointer transition-all min-w-[140px]"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">⚠️ High Risk</option>
              <option value="medium">⚡ Medium Risk</option>
              <option value="low">✅ Low Risk</option>
            </select>
          </div>
          
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-[#182031]/20 rounded-lg px-4 py-2 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-[#0F172A] cursor-pointer transition-all min-w-[140px]"
            >
              <option value="priority">Sort by Priority</option>
              <option value="name">Sort by Name</option>
              <option value="age">Sort by Age</option>
              <option value="performance">Sort by Performance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Athletes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      ) : filteredAthletes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-[#182031]/10">
          <Users className="w-16 h-16 mx-auto text-[#303644] mb-4" />
          <h3 className="text-lg font-medium text-[#0F172A] mb-2">No Athletes Found</h3>
          <p className="text-[#303644] mb-4">
            {searchTerm || selectedSport !== "all"
              ? "Try adjusting your search or filters"
              : "No athletes registered in your region yet"
            }
          </p>
          {(searchTerm || selectedSport !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSport("all");
              }}
              className="px-6 py-3 bg-[#0F172A] text-white rounded-lg hover:bg-[#182031] transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {athletes.map((athlete) => (
              <div key={athlete.id} className="bg-white rounded-xl shadow-sm border border-[#182031]/10 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] relative">
                {/* Priority Indicator */}
                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold ${
                  athlete.priority_level === 'high' ? 'bg-red-100 text-red-800' :
                  athlete.priority_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {athlete.priority_level === 'high' ? '🔴 HIGH' :
                   athlete.priority_level === 'medium' ? '🟡 MED' : '🟢 LOW'}
                </div>

                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4">
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
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Profile Header */}
                <div className={`bg-gradient-to-r p-6 text-white ${
                  athlete.priority_level === 'high' ? 'from-red-600 to-red-700' :
                  athlete.priority_level === 'medium' ? 'from-yellow-600 to-yellow-700' :
                  'from-[#0F172A] to-[#182031]'
                }`}>
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                      <User className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{athlete.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-white/80 text-sm">{athlete.age} years</span>
                        <span className="text-white/60">•</span>
                        <span className="text-white/80 text-sm capitalize">{athlete.sport}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Injury Risk Alert */}
                {athlete.injury_risk === 'high' && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-3">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                      <p className="text-red-800 text-xs font-medium">High Injury Risk - Requires Attention</p>
                    </div>
                  </div>
                )}

                {/* Profile Body */}
                <div className="p-6 space-y-4">
                  {/* Performance Indicators */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[#303644]">Performance</div>
                    <div className={`text-sm font-medium ${
                      athlete.performance_trend === 'improving' ? 'text-green-600' :
                      athlete.performance_trend === 'declining' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {athlete.performance_trend === 'improving' ? '📈 Improving' :
                       athlete.performance_trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                    </div>
                  </div>

                  {/* Performance Stats */}
                  {athlete.performance && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#F6F7F7] rounded-lg p-3">
                        <div className="text-lg font-bold text-[#0F172A]">{athlete.performance.speed}/10</div>
                        <div className="text-xs text-[#303644]">Speed</div>
                      </div>
                      <div className="bg-[#F6F7F7] rounded-lg p-3">
                        <div className="text-lg font-bold text-[#0F172A]">{athlete.performance.strength}/10</div>
                        <div className="text-xs text-[#303644]">Strength</div>
                      </div>
                      <div className="bg-[#F6F7F7] rounded-lg p-3">
                        <div className="text-lg font-bold text-[#0F172A]">{athlete.performance.endurance}/10</div>
                        <div className="text-xs text-[#303644]">Endurance</div>
                      </div>
                    </div>
                  )}

                  {/* Quick Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-[#303644]">
                      <MapPin className="w-4 h-4 mr-2 text-[#182031]" />
                      <span>{athlete.region} Region</span>
                    </div>
                    <div className="flex items-center text-[#303644]">
                      <Trophy className="w-4 h-4 mr-2 text-[#182031]" />
                      <span>{athlete.achievements?.length || 0} Achievements</span>
                    </div>
                    <div className="flex items-center text-[#303644]">
                      <Target className="w-4 h-4 mr-2 text-[#182031]" />
                      <span>{athlete.completedGoals || 0} Goals Completed</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 space-y-2">
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer">
                        <MessageCircle className="w-3 h-3 inline mr-1" />
                        Message
                      </button>
                      <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Schedule
                      </button>
                    </div>
                    <button 
                      onClick={() => setSelectedAthlete(athlete)}
                      className="w-full bg-[#0F172A] hover:bg-[#182031] text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      View Details & Analytics
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMoreAthletes}
                disabled={loadingMore}
                className="px-6 py-3 bg-[#0F172A] text-white rounded-lg hover:bg-[#182031] transition-colors cursor-pointer disabled:opacity-50 font-medium"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                    Loading...
                  </>
                ) : (
                  "Load More Athletes"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Load More Button */}
      {hasMore && !searchTerm && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMoreAthletes}
            disabled={loadingMore}
            className="px-8 py-3 bg-[#0F172A] text-white rounded-lg hover:bg-[#182031] disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto transition-all cursor-pointer"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading Athletes...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Load More Athletes
              </>
            )}
          </button>
        </div>
      )}
    </div>

      {/* Athlete Detail Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#182031]/10">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-3">
                  <User className="w-6 h-6 text-[#182031]" />
                  Athlete Profile
                </h3>
                <button
                  onClick={() => setSelectedAthlete(null)}
                  className="text-[#303644] hover:text-[#0F172A] transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-[#303644] mb-1 block">Name</label>
                    <p className="text-lg font-semibold text-[#0F172A]">{selectedAthlete.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#303644] mb-1 block">Age</label>
                    <p className="text-lg font-semibold text-[#0F172A]">{selectedAthlete.age} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#303644] mb-1 block">Sport</label>
                    <p className="text-lg font-semibold text-[#0F172A]">{selectedAthlete.sport}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#303644] mb-1 block">Gender</label>
                    <p className="text-lg font-semibold text-[#0F172A]">{selectedAthlete.gender}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#303644] mb-1 block">Email</label>
                  <p className="text-lg font-semibold text-[#0F172A]">{selectedAthlete.email}</p>
                </div>
                
                {selectedAthlete.performance && (
                  <div>
                    <label className="text-sm font-medium text-[#303644] mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Performance Metrics
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#F6F7F7] p-4 rounded-lg border border-[#182031]/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-[#0F172A]" />
                          <div className="text-sm text-[#303644] font-medium">Speed</div>
                        </div>
                        <div className="text-xl font-bold text-[#0F172A]">{selectedAthlete.performance.speed}/100</div>
                      </div>
                      <div className="bg-[#F6F7F7] p-4 rounded-lg border border-[#182031]/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-[#0F172A]" />
                          <div className="text-sm text-[#303644] font-medium">Strength</div>
                        </div>
                        <div className="text-xl font-bold text-[#0F172A]">{selectedAthlete.performance.strength}/100</div>
                      </div>
                      <div className="bg-[#F6F7F7] p-4 rounded-lg border border-[#182031]/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-[#0F172A]" />
                          <div className="text-sm text-[#303644] font-medium">Endurance</div>
                        </div>
                        <div className="text-xl font-bold text-[#0F172A]">{selectedAthlete.performance.endurance}/100</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionalAthletesView;