"use client";
import { useState, useEffect, useMemo } from "react";
import { 
  getAthleteProgress, 
  getAthleteBadges,
  getPointsForNextLevel,
  AthleteProgress, 
  AthleteBadge,
  BadgeRarity 
} from "@/services/gamificationService";
import { 
  Trophy, 
  Award, 
  Medal, 
  Crown, 
  Diamond, 
  Target, 
  TrendingUp, 
  Calendar, 
  Flame, 
  Zap, 
  Sparkles,
  Star,
  BarChart3,
  Shield
} from "lucide-react";

interface AchievementDashboardProps {
  athleteId: string;
}

export default function AchievementDashboard({ athleteId }: AchievementDashboardProps) {
  const [progress, setProgress] = useState<AthleteProgress | null>(null);
  const [badges, setBadges] = useState<AthleteBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) {
      setLoading(false);
      setError("No athlete ID provided");
      return;
    }
    
    fetchAchievementData();
  }, [athleteId]);

  const fetchAchievementData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setError("Request timed out");
      }, 10000); // 10 second timeout
      
      const [progressResult, badgesResult] = await Promise.all([
        getAthleteProgress(athleteId),
        getAthleteBadges(athleteId)
      ]);
      
      clearTimeout(timeoutId);
      
      if (progressResult.success && progressResult.progress) {
        setProgress(progressResult.progress);
      } else {
        console.log("No progress data available");
        setProgress(null);
      }
      
      if (badgesResult.success) {
        setBadges(badgesResult.badges);
      } else {
        console.log("No badges data available");
        setBadges([]);
      }
      
    } catch (err: any) {
      console.error("Error fetching achievement data:", err);
      setError(err.message || "Failed to load achievement data");
    } finally {
      setLoading(false);
    }
  };

  const getRarityIcon = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'bronze': return <Medal className="w-4 h-4 text-amber-600" />;
      case 'silver': return <Medal className="w-4 h-4 text-gray-400" />;
      case 'gold': return <Medal className="w-4 h-4 text-yellow-500" />;
      case 'platinum': return <Diamond className="w-4 h-4 text-purple-500" />;
      case 'diamond': return <Crown className="w-4 h-4 text-orange-500" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getLevelProgress = (currentPoints: number) => {
    if (!progress) return { percentage: 0, pointsToNext: 0 };
    
    const pointsToNext = getPointsForNextLevel(currentPoints);
    const currentLevelPoints = currentPoints - (progress.level > 1 ? getLevelBasePoints(progress.level - 1) : 0);
    const nextLevelPoints = getLevelBasePoints(progress.level);
    const percentage = (currentLevelPoints / nextLevelPoints) * 100;
    
    return { percentage: Math.min(percentage, 100), pointsToNext };
  };

  const getLevelBasePoints = (level: number): number => {
    if (level <= 1) return 100;
    if (level <= 2) return 200;
    if (level <= 3) return 300;
    if (level <= 4) return 400;
    if (level <= 5) return 500;
    if (level <= 6) return 600;
    if (level <= 7) return 700;
    if (level <= 8) return 800;
    if (level <= 9) return 900;
    if (level <= 10) return 1000;
    return 1000; // Beyond level 10
  };

  const getBadgesByRarity = (rarity: BadgeRarity) => {
    return badges.filter(badge => badge.badge.rarity === rarity);
  };

  // Memoize expensive calculations to prevent re-computation on every render
  const levelProgress = useMemo(() => {
    if (!progress) return { percentage: 0, pointsToNext: 0 };
    return getLevelProgress(progress.totalPoints);
  }, [progress?.totalPoints]);

  const badgesByRarity = useMemo(() => {
    const rarities: BadgeRarity[] = ["bronze", "silver", "gold", "platinum", "diamond"];
    return rarities.reduce((acc, rarity) => {
      acc[rarity] = getBadgesByRarity(rarity);
      return acc;
    }, {} as Record<BadgeRarity, AthleteBadge[]>);
  }, [badges]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#0F172A] via-[#182031] to-[#303644] rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        <div className="flex items-center justify-center h-32 relative z-10">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4">
              <Trophy className="w-12 h-12 text-amber-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Loading achievements...</h3>
            <p className="text-gray-300 text-sm">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-xl p-8 text-center border border-red-200">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Achievements</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchAchievementData}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

if (!progress) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl p-8 text-center border border-gray-200">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
        <TrendingUp className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">No Progress Data</h3>
      <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-4">
        Start logging training sessions to unlock your journey and begin earning achievements!
      </p>
      <button 
        onClick={fetchAchievementData}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}

return (
  <div className="space-y-8">
    {/* 🚀 Enhanced Progress Overview */}
    <div className="bg-gradient-to-br from-[#0F172A] via-[#182031] to-[#303644] rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl mr-6 shadow-xl">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent flex items-center">
              Level {progress.level}
              <Crown className="w-8 h-8 text-amber-400 ml-3" />
            </h2>
            <p className="text-gray-300 text-lg flex items-center">
              <Flame className="w-5 h-5 text-orange-400 mr-2" />
              Your Athletic Journey
            </p>
          </div>
        </div>
        <div className="text-right bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-purple-400 mr-2" />
            <p className="text-xs text-gray-300 uppercase font-bold tracking-wider">Total Points</p>
          </div>
          <p className="text-4xl font-extrabold text-transparent bg-gradient-to-br from-purple-300 to-indigo-400 bg-clip-text">
            {progress.totalPoints.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold flex items-center">
            <Target className="w-5 h-5 text-emerald-400 mr-2" />
            Progress to Level {progress.level + 1}
          </span>
          <span className="text-sm text-gray-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20 flex items-center">
            <Zap className="w-4 h-4 mr-1" />
            {levelProgress.pointsToNext} pts to go
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-6 overflow-hidden backdrop-blur-sm border border-white/30">
          <div
            className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 h-6 rounded-full transition-all duration-1000 ease-out shadow-lg"
            style={{ width: `${levelProgress.percentage}%` }}
          >
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 relative z-10">
        {[
          { label: "Badges Earned", value: progress.totalBadges, icon: <Award className="w-6 h-6" />, gradient: "from-amber-400 to-orange-500" },
          { label: "Quests Completed", value: progress.completedQuests, icon: <Target className="w-6 h-6" />, gradient: "from-emerald-400 to-teal-500" },
          { label: "Current Streak", value: progress.currentStreak, icon: <Flame className="w-6 h-6" />, gradient: "from-red-400 to-pink-500" },
          { label: "Best Streak", value: progress.longestStreak, icon: <Zap className="w-6 h-6" />, gradient: "from-purple-400 to-indigo-500" },
        ].map((stat, idx) => (
          <div key={idx} className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} text-white mb-3 shadow-lg`}>
              {stat.icon}
            </div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-gray-300 text-sm font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>


    {/* 🏅 Enhanced Badge Collection */}
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-xl p-8 border border-gray-300">
      <div className="flex items-center mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl mr-6 shadow-xl">
          <Award className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">Badge Collection</h3>
          <p className="text-gray-600 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
            Your earned achievements & milestones
          </p>
        </div>
      </div>

      {/* Enhanced Rarity Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {(["bronze", "silver", "gold", "platinum", "diamond"] as BadgeRarity[]).map(
          (rarity) => {
            const rarityBadges = badgesByRarity[rarity] || [];
            
            // Static class mappings to avoid dynamic class generation
            const rarityStyles = {
              bronze: {
                border: "border-amber-200 bg-amber-50",
                gradient: "from-amber-400 to-orange-500"
              },
              silver: {
                border: "border-gray-200 bg-gray-50",
                gradient: "from-gray-300 to-gray-500"
              },
              gold: {
                border: "border-yellow-200 bg-yellow-50",
                gradient: "from-yellow-400 to-amber-500"
              },
              platinum: {
                border: "border-purple-200 bg-purple-50",
                gradient: "from-purple-400 to-indigo-500"
              },
              diamond: {
                border: "border-orange-200 bg-orange-50",
                gradient: "from-orange-400 to-red-500"
              }
            };

            const styles = rarityStyles[rarity];
            
            return (
              <div
                key={rarity}
                className={`p-6 rounded-2xl border-2 ${styles.border} text-center hover:shadow-xl transition-all duration-300`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${styles.gradient} text-white mb-3 shadow-lg`}>
                  {getRarityIcon(rarity)}
                </div>
                <p className="text-3xl font-extrabold mb-1">{rarityBadges.length}</p>
                <p className="text-sm font-bold capitalize text-gray-700">{rarity}</p>
              </div>
            );
          }
        )}
      </div>

      {/* Enhanced Badge Grid */}
      {badges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((athleteBadge) => {
            // Static class mappings based on rarity to avoid dynamic class generation
            const rarityStyles = {
              bronze: "border-amber-200 bg-amber-50",
              silver: "border-gray-200 bg-gray-50", 
              gold: "border-yellow-200 bg-yellow-50",
              platinum: "border-purple-200 bg-purple-50",
              diamond: "border-orange-200 bg-orange-50"
            };

            const rarityClass = rarityStyles[athleteBadge.badge.rarity as keyof typeof rarityStyles] || rarityStyles.bronze;
            
            return (
              <div
                key={athleteBadge.id}
                className={`p-6 rounded-2xl border-2 ${rarityClass} hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex items-start">
                  <div className="text-4xl mr-4">
                    {athleteBadge.badge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-800 text-lg">
                        {athleteBadge.badge.name}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {getRarityIcon(athleteBadge.badge.rarity)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {athleteBadge.badge.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center bg-emerald-100 px-3 py-1 rounded-full">
                        <Star className="w-3 h-3 text-emerald-600 mr-1" />
                        <span className="text-xs font-semibold text-emerald-700">+{athleteBadge.badge.pointsAwarded} pts</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{athleteBadge.earnedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Award className="w-12 h-12 text-white" />
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-3">No Badges Yet</h4>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            Complete quests to earn your first badge and start building your collection!
          </p>
        </div>
      )}
    </div>
  </div>
);
}