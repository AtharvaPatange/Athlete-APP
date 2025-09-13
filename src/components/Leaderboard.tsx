"use client";
import { useState, useEffect } from "react";
import {
  getLeaderboard,
  LeaderboardEntry,
} from "@/services/gamificationService";

// Lucide React Icons
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Gem,
  Activity,
  Waves,
  Bike,
  Target,
  Dumbbell,
  Globe,
  TrendingUp,
  Info,
  Sparkles,
  Zap,
  Filter,
  Users
} from "lucide-react";

interface LeaderboardProps {
  athleteId: string;
  sport?: string;
  region?: string;
}

export default function Leaderboard({
  athleteId,
  sport,
  region,
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: sport || "",
    region: region || "",
  });
  const [availableFilters] = useState({
    sports: [
      "football",
      "basketball", 
      "tennis",
      "running",
      "swimming",
      "cycling",
      "weightlifting",
    ],
    regions: [
      "North America",
      "Europe", 
      "Asia",
      "Australia",
      "South America",
      "Africa",
    ],
  });

  useEffect(() => {
    fetchLeaderboard();
  }, [filters.sport, filters.region]);

  const fetchLeaderboard = async () => {
    setLoading(true);

    const result = await getLeaderboard(
      filters.sport || undefined,
      filters.region || undefined,
      100
    );

    if (result.success) {
      setLeaderboard(result.leaderboard);
    }

    setLoading(false);
  };

  const getCurrentAthleteRank = () => {
    return (
      leaderboard.find((entry) => entry.athleteId === athleteId)?.rank || null
    );
  };

  const getLevelBadge = (level: number) => {
    if (level >= 50) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (level >= 25) return <Gem className="w-4 h-4 text-cyan-400" />;
    if (level >= 15) return <Medal className="w-4 h-4 text-amber-500" />; // Gold-like
    if (level >= 10) return <Medal className="w-4 h-4 text-slate-400" />; // Silver-like
    if (level >= 5) return <Medal className="w-4 h-4 text-orange-600" />; // Bronze-like
    return <Award className="w-4 h-4 text-gray-400" />;
  };

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="w-8 h-8 text-amber-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-slate-400" />;
      case 3:
        return <Medal className="w-8 h-8 text-orange-600" />;
      default:
        return (
          <span className="text-2xl font-bold text-gray-600">#{rank}</span>
        );
    }
  };

  const getSportIcon = (sportName: string) => {
    switch (sportName) {
      case "football":
        return <Target className="w-4 h-4" />;
      case "basketball":
        return <Target className="w-4 h-4" />;
      case "tennis":
        return <Target className="w-4 h-4" />;
      case "running":
        return <Activity className="w-4 h-4" />;
      case "swimming":
        return <Waves className="w-4 h-4" />;
      case "cycling":
        return <Bike className="w-4 h-4" />;
      case "weightlifting":
        return <Dumbbell className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#0F172A] via-[#182031] to-[#303644] rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-32 w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-lg animate-pulse delay-500"></div>
        </div>
        
        <div className="flex items-center justify-center h-64 relative z-10">
          <div className="text-center">
            {/* Enhanced spinner with trophy */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-amber-400 border-r-purple-400 border-b-emerald-400 border-l-indigo-400 animate-spin"></div>
              <Trophy className="w-6 h-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Loading leaderboard...</h3>
            <p className="text-gray-300 text-sm flex items-center justify-center">
              <Users className="w-4 h-4 mr-2 animate-pulse" />
              Ranking the champions
            </p>
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#182031] to-[#303644] rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden group">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-8 right-8 w-32 h-32 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-8 left-8 w-24 h-24 bg-gradient-to-br from-purple-400/30 to-indigo-500/30 rounded-full blur-xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Floating sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Sparkles className="absolute top-12 left-24 w-4 h-4 text-amber-300 animate-bounce delay-200" />
          <Sparkles className="absolute top-20 right-32 w-3 h-3 text-purple-300 animate-bounce delay-700" />
          <Sparkles className="absolute bottom-24 right-16 w-5 h-5 text-emerald-300 animate-bounce delay-1200" />
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl mr-6 shadow-xl relative group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-10 h-10 text-white" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            </div>
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Leaderboard Arena
              </h2>
              <p className="text-gray-300 text-lg flex items-center">
                <Zap className="w-5 h-5 text-amber-400 mr-2 animate-pulse" />
                Rise through the ranks, champion!
              </p>
            </div>
          </div>

          {getCurrentAthleteRank() && (
            <div className="text-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-center mb-2">
                <Crown className="w-5 h-5 text-amber-400 mr-2" />
                <p className="text-xs text-gray-300 uppercase font-bold tracking-wider">Your Standing</p>
              </div>
              <div className="text-4xl font-extrabold mb-1">
                {getRankDisplay(getCurrentAthleteRank()!)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl mr-4 shadow-lg">
            <Filter className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Refine Your View</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sport Filter */}
          <div>
            <label className="block text-sm font-bold mb-3 text-gray-700 flex items-center">
              <Target className="w-4 h-4 mr-2 text-indigo-500" />
              Sport
            </label>
            <select
              value={filters.sport}
              onChange={(e) =>
                setFilters({ ...filters, sport: e.target.value })
              }
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all duration-300 bg-white text-gray-700 font-medium hover:border-gray-300"
            >
              <option value="">All Disciplines</option>
              {availableFilters.sports.map((sportOption) => (
                <option key={sportOption} value={sportOption}>
                  {sportOption.charAt(0).toUpperCase() +
                    sportOption.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-sm font-bold mb-3 text-gray-700 flex items-center">
              <Globe className="w-4 h-4 mr-2 text-indigo-500" />
              Region
            </label>
            <select
              value={filters.region}
              onChange={(e) =>
                setFilters({ ...filters, region: e.target.value })
              }
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all duration-300 bg-white text-gray-700 font-medium hover:border-gray-300"
            >
              <option value="">All Territories</option>
              {availableFilters.regions.map((regionOption) => (
                <option key={regionOption} value={regionOption}>
                  {regionOption}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Leaderboard */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-8 py-6 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center">
              <Users className="w-6 h-6 mr-3 text-indigo-500" />
              Elite Athletes{" "}
              {filters.sport &&
                `in ${
                  filters.sport.charAt(0).toUpperCase() + filters.sport.slice(1)
                }`}
              {filters.region && ` from ${filters.region}`}
            </h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-semibold text-gray-600">Based on total heroic points earned</span>
            </div>
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {leaderboard.slice(0, 50).map((entry) => (
              <div
                key={entry.athleteId}
                className={`p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-[1.02] group relative ${
                  entry.athleteId === athleteId
                    ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* Rank Display */}
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-indigo-100 group-hover:to-purple-100 transition-all duration-300">
                      {entry.rank <= 3 ? (
                        getRankDisplay(entry.rank)
                      ) : (
                        <span className="text-2xl font-bold text-gray-600">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Athlete Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">
                          {entry.athleteName}
                        </h4>
                        {entry.athleteId === athleteId && (
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-md">
                            <Sparkles className="w-3 h-3 mr-1" />
                            YOU
                          </div>
                        )}
                        <div className="text-2xl">
                          {getLevelBadge(entry.level)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          {getSportIcon(entry.sport)}
                          <span className="ml-1">{entry.sport}</span>
                        </div>
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-1 text-indigo-500" />
                          {entry.region}
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1 text-purple-500" />
                          Level {entry.level}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-6 text-right">
                    <div className="text-center bg-gradient-to-br from-amber-100 to-orange-100 px-4 py-3 rounded-xl border border-amber-200">
                      <p className="text-2xl font-bold text-amber-700">
                        {entry.totalPoints.toLocaleString()}
                      </p>
                      <p className="text-xs text-amber-600 font-semibold">POINTS</p>
                    </div>
                    <div className="text-center bg-gradient-to-br from-yellow-100 to-amber-100 px-4 py-3 rounded-xl border border-yellow-200">
                      <p className="text-xl font-bold text-yellow-700">
                        {entry.totalBadges}
                      </p>
                      <p className="text-xs text-yellow-600 font-semibold">BADGES</p>
                    </div>
                  </div>
                </div>
                
                {/* Hover effect indicator */}
                {entry.rank <= 3 && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 relative">
            {/* Background decoration */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No Champions Here Yet!</h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                {filters.sport || filters.region
                  ? "Try adjusting your filters to discover more aspiring athletes."
                  : "Be the first to carve your legend into the leaderboard by completing epic quests!"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Leaderboard Info */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-8 border border-emerald-200 shadow-xl relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-6 right-8 w-20 h-20 bg-gradient-to-br from-emerald-300 to-teal-400 rounded-full blur-xl"></div>
          <div className="absolute bottom-6 left-8 w-16 h-16 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full blur-lg"></div>
        </div>
        
        <div className="flex items-start relative z-10">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl mr-6 shadow-xl">
            <Info className="w-8 h-8 text-white" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <h4 className="text-2xl font-bold text-gray-800 mr-3">Ascend to Glory: Your Path to the Top</h4>
              <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tips Section */}
              <div className="space-y-3">
                {[
                  { text: "Conquer quests to amass points and earn valuable badges", icon: <Target className="w-4 h-4" /> },
                  { text: "Log your training consistently to unlock new challenges", icon: <Activity className="w-4 h-4" /> },
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-center group hover:scale-105 transition-transform">
                    <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2 rounded-lg mr-3 shadow-md text-white">
                      {tip.icon}
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">{tip.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                {[
                  { text: "Seek out higher difficulty quests for maximum point gains", icon: <Zap className="w-4 h-4" /> },
                  { text: "Maintain powerful training streaks for legendary bonuses!", icon: <Crown className="w-4 h-4" /> },
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-center group hover:scale-105 transition-transform">
                    <div className="bg-gradient-to-br from-teal-400 to-cyan-500 p-2 rounded-lg mr-3 shadow-md text-white">
                      {tip.icon}
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating motivational elements */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce delay-300" />
            <Sparkles className="w-3 h-3 text-teal-400 animate-bounce delay-700" />
            <Sparkles className="w-4 h-4 text-cyan-400 animate-bounce delay-1100" />
          </div>
        </div>
      </div>
    </div>
  );
}