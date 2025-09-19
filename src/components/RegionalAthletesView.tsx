"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import AthleteProfileCard from "./AthleteProfileCard";
import { User, MapPin, Trophy, Target, Calendar, MessageCircle, TrendingUp, Search, Filter, AlertTriangle, X, Users, BarChart3, Award, Zap, Activity, UserCheck } from "lucide-react";
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line } from "recharts";

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
  const [sortBy, setSortBy] = useState<"name" | "age" | "lastActive" | "performance">("name");
  
  // Pagination
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const sports = [
    "all", "football", "basketball", "tennis", "swimming", 
    "running", "cycling", "weightlifting", "other"
  ];

  const regions = [
    "north", "south", "east", "west", "central"
  ];

  useEffect(() => {
    fetchAthletes();
  }, [coachRegion, selectedSport, sortBy]);

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

      {/* Search and Filters */}
      <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#303644]" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-[#182031]/20 rounded-lg leading-5 bg-white placeholder-[#303644] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-[#0F172A] transition-all"
              placeholder="Search athletes by name, sport, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <div className="relative">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="border border-[#182031]/20 rounded-lg px-4 py-3 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-[#0F172A] cursor-pointer transition-all min-w-[120px]"
            >
              {sports.map(sport => (
                <option key={sport} value={sport} className="text-[#0F172A]">
                  {sport === "all" ? "All Sports" : sport.charAt(0).toUpperCase() + sport.slice(1)}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#303644] pointer-events-none" />
          </div>
          
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-[#182031]/20 rounded-lg px-4 py-3 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-[#0F172A] cursor-pointer transition-all min-w-[140px]"
            >
              <option value="name" className="text-[#0F172A]">Sort by Name</option>
              <option value="age" className="text-[#0F172A]">Sort by Age</option>
              <option value="lastActive" className="text-[#0F172A]">Sort by Activity</option>
              <option value="performance" className="text-[#0F172A]">Sort by Performance</option>
            </select>
            <BarChart3 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#303644] pointer-events-none" />
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
            {filteredAthletes.map((athlete) => (
              <div key={athlete.id} className="bg-white rounded-xl shadow-sm border border-[#182031]/10 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-[#0F172A] to-[#182031] p-6 text-white">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white">{athlete.name || "Unnamed Athlete"}</h3>
                      <div className="flex items-center text-white/60 text-sm mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {athlete.region || "No Region"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="p-4">
                  <h4 className="text-sm font-medium text-[#0F172A] mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#182031]" />
                    Performance Overview
                  </h4>
                  <div className="h-32">
                    {athlete.performance ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { name: 'Speed', value: athlete.performance.speed || 0 },
                          { name: 'Strength', value: athlete.performance.strength || 0 },
                          { name: 'Endurance', value: athlete.performance.endurance || 0 },
                          { name: 'Agility', value: athlete.performance.agility || 0 }
                        ]}>
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#303644' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#303644' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0F172A', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: 'white'
                            }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#0F172A" 
                            strokeWidth={3}
                            dot={{ fill: '#0F172A', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[#303644]">
                        <TrendingUp className="w-8 h-8 mb-2" />
                        <p className="text-sm">No performance data</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-[#F6F7F7] rounded-lg border border-[#182031]/5">
                      <Award className="w-5 h-5 text-[#0F172A] mx-auto mb-1" />
                      <div className="text-sm font-semibold text-[#0F172A]">
                        {athlete.achievements?.length || 0}
                      </div>
                      <div className="text-xs text-[#303644]">Achievements</div>
                    </div>
                    <div className="text-center p-3 bg-[#F6F7F7] rounded-lg border border-[#182031]/5">
                      <Target className="w-5 h-5 text-[#0F172A] mx-auto mb-1" />
                      <div className="text-sm font-semibold text-[#0F172A]">
                        {athlete.completedGoals || 0}
                      </div>
                      <div className="text-xs text-[#303644]">Goals</div>
                    </div>
                    <div className="text-center p-3 bg-[#F6F7F7] rounded-lg border border-[#182031]/5">
                      <UserCheck className="w-5 h-5 text-[#0F172A] mx-auto mb-1" />
                      <div className="text-sm font-semibold text-[#0F172A]">
                        {athlete.age || "N/A"}
                      </div>
                      <div className="text-xs text-[#303644]">Age</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 pb-4 flex gap-2">
                  <button 
                    onClick={() => setSelectedAthlete(athlete)}
                    className="flex-1 bg-[#0F172A] hover:bg-[#182031] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                  <button className="px-4 py-2.5 border border-[#182031]/20 text-[#303644] rounded-lg text-sm font-medium hover:bg-[#F6F7F7] transition-colors cursor-pointer">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

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
        </>
      )}

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
    </div>
  );
};

export default RegionalAthletesView;