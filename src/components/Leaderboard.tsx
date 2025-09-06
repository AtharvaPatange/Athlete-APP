"use client";
import { useState, useEffect } from "react";
import { 
  getLeaderboard,
  LeaderboardEntry 
} from "@/services/gamificationService";

interface LeaderboardProps {
  athleteId: string;
  sport?: string;
  region?: string;
}

export default function Leaderboard({ athleteId, sport, region }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: sport || '',
    region: region || ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    sports: ['football', 'basketball', 'tennis', 'running', 'swimming', 'cycling', 'weightlifting'],
    regions: ['North America', 'Europe', 'Asia', 'Australia', 'South America', 'Africa']
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
    return leaderboard.find(entry => entry.athleteId === athleteId)?.rank || null;
  };

  const getLevelIcon = (level: number) => {
    if (level >= 50) return '👑';
    if (level >= 25) return '💎';
    if (level >= 15) return '🥇';
    if (level >= 10) return '🥈';
    if (level >= 5) return '🥉';
    return '🏅';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getSportIcon = (sportName: string) => {
    switch (sportName) {
      case 'football': return '⚽';
      case 'basketball': return '🏀';
      case 'tennis': return '🎾';
      case 'running': return '🏃‍♂️';
      case 'swimming': return '🏊‍♂️';
      case 'cycling': return '🚴‍♂️';
      case 'weightlifting': return '🏋️‍♂️';
      default: return '🏆';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
              <span className="text-3xl">🏆</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Leaderboard</h2>
              <p className="text-blue-100">See how you rank against other athletes</p>
            </div>
          </div>
          
          {getCurrentAthleteRank() && (
            <div className="text-center bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-blue-100">Your Rank</p>
              <p className="text-3xl font-bold">{getRankIcon(getCurrentAthleteRank()!)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Leaderboard</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
            <select
              value={filters.sport}
              onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Sports</option>
              {availableFilters.sports.map((sportOption) => (
                <option key={sportOption} value={sportOption}>
                  {getSportIcon(sportOption)} {sportOption.charAt(0).toUpperCase() + sportOption.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Regions</option>
              {availableFilters.regions.map((regionOption) => (
                <option key={regionOption} value={regionOption}>
                  🌍 {regionOption}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Top Athletes {filters.sport && `in ${filters.sport.charAt(0).toUpperCase() + filters.sport.slice(1)}`}
            {filters.region && ` from ${filters.region}`}
          </h3>
          <p className="text-sm text-gray-600">Based on total points earned</p>
        </div>

        {leaderboard.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {leaderboard.slice(0, 50).map((entry, index) => (
              <div 
                key={entry.athleteId}
                className={`p-6 flex items-center justify-between transition-colors ${
                  entry.athleteId === athleteId 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center flex-1">
                  {/* Rank */}
                  <div className="w-16 text-center">
                    <span className={`text-2xl font-bold ${
                      entry.rank <= 3 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {getRankIcon(entry.rank)}
                    </span>
                  </div>

                  {/* Athlete Info */}
                  <div className="flex-1 ml-4">
                    <div className="flex items-center">
                      <h4 className={`text-lg font-semibold ${
                        entry.athleteId === athleteId ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {entry.athleteName}
                        {entry.athleteId === athleteId && (
                          <span className="ml-2 text-blue-600 text-sm">(You)</span>
                        )}
                      </h4>
                      <span className="ml-3 text-2xl">{getLevelIcon(entry.level)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        {getSportIcon(entry.sport)} {entry.sport}
                      </span>
                      <span>🌍 {entry.region}</span>
                      <span>📊 Level {entry.level}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {entry.totalPoints.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Points</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-yellow-600">
                          {entry.totalBadges}
                        </p>
                        <p className="text-xs text-gray-500">Badges</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Athletes Found</h3>
            <p className="text-gray-600">
              {filters.sport || filters.region 
                ? 'Try adjusting your filters to see more athletes.'
                : 'Be the first to join the leaderboard by completing quests!'
              }
            </p>
          </div>
        )}
      </div>

      {/* Leaderboard Info */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-start">
          <div className="bg-green-100 p-3 rounded-lg mr-4">
            <span className="text-2xl">💡</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">How to Climb the Leaderboard</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Complete quests to earn points and badges
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Log training sessions consistently to unlock new quests
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Aim for higher difficulty quests for more points
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Maintain training streaks for bonus achievements
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
