"use client";
import { useState, useEffect } from "react";
import { 
  getAthleteProgress, 
  getAthleteBadges,
  getPointsForNextLevel,
  AthleteProgress, 
  AthleteBadge,
  getRarityColor,
  BadgeRarity 
} from "@/services/gamificationService";

interface AchievementDashboardProps {
  athleteId: string;
}

export default function AchievementDashboard({ athleteId }: AchievementDashboardProps) {
  const [progress, setProgress] = useState<AthleteProgress | null>(null);
  const [badges, setBadges] = useState<AthleteBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievementData();
  }, [athleteId]);

  const fetchAchievementData = async () => {
    setLoading(true);
    
    const [progressResult, badgesResult] = await Promise.all([
      getAthleteProgress(athleteId),
      getAthleteBadges(athleteId)
    ]);
    
    if (progressResult.success && progressResult.progress) {
      setProgress(progressResult.progress);
    }
    
    if (badgesResult.success) {
      setBadges(badgesResult.badges);
    }
    
    setLoading(false);
  };

  const getRarityIcon = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      case 'legendary': return '👑';
      default: return '🏅';
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

  if (loading) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading achievements...</p>
          <p className="text-gray-400 text-sm mt-1">Almost there! ✨</p>
        </div>
      </div>
    </div>
  );
}

if (!progress) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="text-6xl mb-4">📈</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No Progress Data</h3>
      <p className="text-gray-600">
        Start logging training sessions to unlock your journey!
      </p>
    </div>
  );
}

const levelProgress = getLevelProgress(progress.totalPoints);

return (
  <div className="space-y-8">
    {/* 🚀 Progress Overview */}
<div className="bg-gradient-to-r from-slate-600 via-slate-700 to-black rounded-xl shadow-xl p-6 text-white relative overflow-hidden">
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center">
      <div className="bg-white/20 p-4 rounded-xl mr-4 shadow-inner">
        <span className="text-4xl">🏆</span>
      </div>
      <div>
        <h2 className="text-3xl font-extrabold drop-shadow">
          Level {progress.level}
        </h2>
        <p className="text-purple-100">Your Athletic Journey</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-3xl font-bold">{progress.totalPoints.toLocaleString()}</p>
      <p className="text-purple-100 text-sm">Total Points</p>
    </div>
  </div>

  {/* Progress Bar */}
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium">
        Progress to Level {progress.level + 1}
      </span>
      <span className="text-sm text-purple-100">
        {levelProgress.pointsToNext} pts to go
      </span>
    </div>
    <div className="w-full bg-white/30 rounded-full h-4 overflow-hidden">
      <div
        className="bg-gradient-to-r from-pink-400 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${levelProgress.percentage}%` }}
      />
    </div>
  </div>

  {/* Quick Stats */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
    {[
      { label: "Badges Earned", value: progress.totalBadges },
      { label: "Quests Completed", value: progress.completedQuests },
      { label: "Current Streak", value: progress.currentStreak },
      { label: "Best Streak", value: progress.longestStreak },
    ].map((stat, idx) => (
      <div key={idx} className="text-center">
        <p className="text-3xl font-bold">{stat.value}</p>
        <p className="text-purple-100 text-sm">{stat.label}</p>
      </div>
    ))}
  </div>
</div>


    {/* 🏅 Badge Collection */}
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center mb-6">
        <div className="bg-purple-100 p-3 rounded-xl mr-4 shadow-inner">
          <span className="text-2xl">🏅</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Badge Collection</h3>
          <p className="text-gray-600">Your earned achievements & milestones</p>
        </div>
      </div>

      {/* Rarity Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {(["bronze", "silver", "gold", "platinum", "legendary"] as BadgeRarity[]).map(
          (rarity) => {
            const rarityBadges = getBadgesByRarity(rarity);
            return (
              <div
                key={rarity}
                className={`p-4 rounded-xl border ${getRarityColor(
                  rarity
                )} text-center hover:shadow-md transition`}
              >
                <div className="text-2xl mb-1">{getRarityIcon(rarity)}</div>
                <p className="text-2xl font-bold">{rarityBadges.length}</p>
                <p className="text-xs font-semibold capitalize">{rarity}</p>
              </div>
            );
          }
        )}
      </div>

      {/* Badge Grid */}
      {badges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((athleteBadge) => (
            <div
              key={athleteBadge.id}
              className={`p-5 rounded-xl border-2 ${getRarityColor(
                athleteBadge.badge.rarity
              )} hover:shadow-xl transition-transform transform hover:scale-105`}
            >
              <div className="flex items-start">
                <div className="text-3xl mr-4">{athleteBadge.badge.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900">
                      {athleteBadge.badge.name}
                    </h4>
                    <span className="text-sm">
                      {getRarityIcon(athleteBadge.badge.rarity)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {athleteBadge.badge.description}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>+{athleteBadge.badge.pointsAwarded} pts</span>
                    <span>{athleteBadge.earnedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏅</div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">No Badges Yet</h4>
          <p className="text-gray-600">Complete quests to earn your first badge!</p>
        </div>
      )}
    </div>

    {/* 🎯 Achievement Milestones */}
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center mb-6">
        <div className="bg-green-100 p-3 rounded-xl mr-4">
          <span className="text-2xl">🎯</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Achievement Milestones</h3>
          <p className="text-gray-600">Track your long-term journey</p>
        </div>
      </div>

      <div className="space-y-5">
        {[
          {
            title: "Points Champion",
            progress: progress.totalPoints,
            target: 1000,
            color: "blue",
          },
          {
            title: "Badge Collector",
            progress: progress.totalBadges,
            target: 10,
            color: "purple",
          },
          {
            title: "Quest Master",
            progress: progress.completedQuests,
            target: 25,
            color: "green",
          },
          {
            title: "Consistency King",
            progress: progress.longestStreak,
            target: 30,
            color: "orange",
          },
        ].map((milestone, idx) => (
          <div
            key={idx}
            className={`bg-${milestone.color}-50 p-5 rounded-xl border border-${milestone.color}-200`}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className={`font-semibold text-${milestone.color}-900`}>
                {milestone.title}
              </h4>
              <span className={`text-${milestone.color}-600 text-sm`}>
                {milestone.progress}/{milestone.target}
              </span>
            </div>
            <div className={`w-full bg-${milestone.color}-200 rounded-full h-2`}>
              <div
                className={`bg-${milestone.color}-600 h-2 rounded-full transition-all`}
                style={{
                  width: `${Math.min(
                    (milestone.progress / milestone.target) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
}