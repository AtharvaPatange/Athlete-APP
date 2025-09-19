"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import AthleteProfileCard from "./AthleteProfileCard";
import { User, MapPin, Trophy, Target, Calendar, MessageCircle, TrendingUp } from "lucide-react";
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
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium">Error Loading Athletes</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
        <button
          onClick={() => fetchAthletes()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header & Stats */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Athletes in {coachRegion.charAt(0).toUpperCase() + coachRegion.slice(1)} Region
            </h2>
            <p className="text-gray-600">
              Manage and monitor athletes in your region
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 lg:mt-0">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{athleteStats.total}</div>
              <div className="text-xs text-blue-800">Total Athletes</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{athleteStats.sports}</div>
              <div className="text-xs text-green-800">Sports</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{athleteStats.avgAge}</div>
              <div className="text-xs text-purple-800">Avg Age</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{athleteStats.withDisabilities}</div>
              <div className="text-xs text-orange-800">Special Needs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search athletes by name, sport, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {sports.map(sport => (
              <option key={sport} value={sport}>
                {sport === "all" ? "All Sports" : sport.charAt(0).toUpperCase() + sport.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="age">Sort by Age</option>
            <option value="lastActive">Sort by Activity</option>
            <option value="performance">Sort by Performance</option>
          </select>
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
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Athletes Found</h3>
          <p className="text-gray-600 mb-4">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAthletes.map((athlete) => (
              <div key={athlete.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{athlete.name || "Unnamed Athlete"}</h3>
                      <p className="text-blue-100">{athlete.sport || "No Sport"}</p>
                      <div className="flex items-center text-blue-100 text-sm mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {athlete.region || "No Region"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Overview</h4>
                  <div className="h-32">
                    {athlete.performance ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { name: 'Speed', value: athlete.performance.speed || 0 },
                          { name: 'Strength', value: athlete.performance.strength || 0 },
                          { name: 'Endurance', value: athlete.performance.endurance || 0 },
                          { name: 'Agility', value: athlete.performance.agility || 0 }
                        ]}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <TrendingUp className="w-8 h-8 mb-2" />
                        <p className="text-sm">No performance data</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                      <div className="text-sm font-semibold text-gray-900">
                        {athlete.achievements?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Achievements</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
                      <div className="text-sm font-semibold text-gray-900">
                        {athlete.completedGoals || 0}
                      </div>
                      <div className="text-xs text-gray-500">Goals</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <div className="text-sm font-semibold text-gray-900">
                        {athlete.age || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">Age</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 pb-4 flex gap-2">
                  <button 
                    onClick={() => setSelectedAthlete(athlete)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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

      {/* Athlete Detail Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Athlete Profile
                </h3>
                <button
                  onClick={() => setSelectedAthlete(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Detailed athlete view will be implemented in the next component */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg">{selectedAthlete.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Age</label>
                    <p className="text-lg">{selectedAthlete.age} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sport</label>
                    <p className="text-lg">{selectedAthlete.sport}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-lg">{selectedAthlete.gender}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{selectedAthlete.email}</p>
                </div>
                {selectedAthlete.performance && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Performance Metrics</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-sm text-blue-600">Speed</div>
                        <div className="text-lg font-bold text-blue-700">{selectedAthlete.performance.speed}/100</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-sm text-green-600">Strength</div>
                        <div className="text-lg font-bold text-green-700">{selectedAthlete.performance.strength}/100</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded">
                        <div className="text-sm text-orange-600">Endurance</div>
                        <div className="text-lg font-bold text-orange-700">{selectedAthlete.performance.endurance}/100</div>
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