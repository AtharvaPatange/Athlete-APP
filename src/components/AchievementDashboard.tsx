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
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading achievements...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Progress Data</h3>
        <p className="text-gray-600">Start logging training sessions to track your progress!</p>
      </div>
    );
  }

  const levelProgress = getLevelProgress(progress.totalPoints);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-4 rounded-lg mr-4">
              <span className="text-4xl">🏆</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">Level {progress.level}</h2>
              <p className="text-yellow-100">Your Athletic Journey</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{progress.totalPoints.toLocaleString()}</p>
            <p className="text-yellow-100">Total Points</p>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress to Level {progress.level + 1}</span>
            <span className="text-sm">{levelProgress.pointsToNext} points to go</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-4">
            <div 
              className="bg-white h-4 rounded-full transition-all duration-300"
              style={{ width: `${levelProgress.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{progress.totalBadges}</p>
            <p className="text-yellow-100 text-sm">Badges Earned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{progress.completedQuests}</p>
            <p className="text-yellow-100 text-sm">Quests Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{progress.currentStreak}</p>
            <p className="text-yellow-100 text-sm">Current Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{progress.longestStreak}</p>
            <p className="text-yellow-100 text-sm">Best Streak</p>
          </div>
        </div>
      </div>

      {/* Badge Collection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="bg-purple-100 p-3 rounded-lg mr-4">
            <span className="text-2xl">🏅</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Badge Collection</h3>
            <p className="text-gray-600">Your earned achievements and milestones</p>
          </div>
        </div>

        {/* Badge Rarity Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {(['bronze', 'silver', 'gold', 'platinum', 'legendary'] as BadgeRarity[]).map((rarity) => {
            const rarityBadges = getBadgesByRarity(rarity);
            return (
              <div key={rarity} className={`p-4 rounded-lg border ${getRarityColor(rarity)}`}>
                <div className="text-center">
                  <div className="text-2xl mb-1">{getRarityIcon(rarity)}</div>
                  <p className="text-2xl font-bold">{rarityBadges.length}</p>
                  <p className="text-xs font-medium capitalize">{rarity}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Badge Grid */}
        {badges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((athleteBadge) => (
              <div 
                key={athleteBadge.id} 
                className={`p-4 rounded-lg border-2 ${getRarityColor(athleteBadge.badge.rarity)} hover:shadow-lg transition-all`}
              >
                <div className="flex items-start">
                  <div className="text-3xl mr-3">{athleteBadge.badge.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{athleteBadge.badge.name}</h4>
                      <span className="text-xs">{getRarityIcon(athleteBadge.badge.rarity)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{athleteBadge.badge.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
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

      {/* Achievement Milestones */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="bg-green-100 p-3 rounded-lg mr-4">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Achievement Milestones</h3>
            <p className="text-gray-600">Your progress towards major milestones</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Points Milestones */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-blue-900">Points Champion</h4>
              <span className="text-blue-600 text-sm">
                {progress.totalPoints}/1000 points
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min((progress.totalPoints / 1000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Badge Collector */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-purple-900">Badge Collector</h4>
              <span className="text-purple-600 text-sm">
                {progress.totalBadges}/10 badges
              </span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min((progress.totalBadges / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Quest Master */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-green-900">Quest Master</h4>
              <span className="text-green-600 text-sm">
                {progress.completedQuests}/25 quests
              </span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${Math.min((progress.completedQuests / 25) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Consistency King */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-orange-900">Consistency King</h4>
              <span className="text-orange-600 text-sm">
                {progress.longestStreak}/30 day streak
              </span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: `${Math.min((progress.longestStreak / 30) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
