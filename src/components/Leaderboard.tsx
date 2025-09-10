"use client";
import { useState, useEffect } from "react";
import {
  getLeaderboard,
  LeaderboardEntry,
} from "@/services/gamificationService";

// React Icons
import {
  FaTrophy,
  FaMedal,
  FaAward,
  FaCrown,
  FaGem,
  FaRunning,
  FaSwimmer,
  FaBiking,
  FaFootballBall,
  FaBasketballBall,
  FaWeight,
  FaGlobeAmericas,
  FaChartLine,
  FaInfoCircle,
} from "react-icons/fa";
import { MdSportsTennis } from "react-icons/md"; // ✅ Tennis
import { IoSparkles } from "react-icons/io5"; // Badges

interface LeaderboardProps {
  athleteId: string;
  sport?: string;
  region?: string;
}

const COLORS = {
  oxfordBlue: "#030C26",
  marianBlue: "#2D488B",
  seasalt: "#F9FAFB",
  powderBlue: "#9FAFDO",
  platinum: "#E0E4E9",
};

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
    if (level >= 50) return <FaCrown className="text-yellow-400" />;
    if (level >= 25) return <FaGem className="text-cyan-400" />;
    if (level >= 15) return <FaMedal className="text-amber-500" />; // Gold-like
    if (level >= 10) return <FaMedal className="text-slate-400" />; // Silver-like
    if (level >= 5) return <FaMedal className="text-orange-600" />; // Bronze-like
    return <FaAward className="text-gray-400" />;
  };

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaMedal className="text-amber-500 text-3xl" />;
      case 2:
        return <FaMedal className="text-slate-400 text-3xl" />;
      case 3:
        return <FaMedal className="text-orange-600 text-3xl" />;
      default:
        return (
          <span className="text-2xl font-bold text-gray-600">#{rank}</span>
        );
    }
  };

  const getSportIcon = (sportName: string) => {
    switch (sportName) {
      case "football":
        return <FaFootballBall />;
      case "basketball":
        return <FaBasketballBall />;
      case "tennis":
        return <MdSportsTennis />; // ✅ fixed
      case "running":
        return <FaRunning />;
      case "swimming":
        return <FaSwimmer />;
      case "cycling":
        return <FaBiking />;
      case "weightlifting":
        return <FaWeight />;
      default:
        return <FaTrophy />;
    }
  };

  if (loading) {
    return (
      <div
        className="rounded-xl shadow-lg p-8"
        style={{ backgroundColor: COLORS.seasalt }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div
              className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
              style={{
                borderColor: COLORS.marianBlue,
                borderTopColor: "transparent",
              }}
            ></div>
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-xl shadow-lg p-6 text-white"
        style={{
          background: `linear-gradient(to right, ${COLORS.oxfordBlue}, ${COLORS.marianBlue})`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className="p-3 rounded-lg mr-4"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <FaTrophy className="text-3xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Leaderboard Arena</h2>
              <p style={{ color: COLORS.powderBlue }}>
                Rise through the ranks, champion!
              </p>
            </div>
          </div>

          {getCurrentAthleteRank() && (
            <div
              className="text-center rounded-lg p-4"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <p className="text-sm" style={{ color: COLORS.powderBlue }}>
                Your Standing
              </p>
              <div className="text-3xl font-bold">
                {getRankDisplay(getCurrentAthleteRank()!)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl shadow-lg p-6"
        style={{ backgroundColor: COLORS.seasalt }}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: COLORS.oxfordBlue }}
        >
          Refine Your View
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Sport Filter */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.marianBlue }}
            >
              Sport
            </label>
            <select
              value={filters.sport}
              onChange={(e) =>
                setFilters({ ...filters, sport: e.target.value })
              }
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{
                borderColor: COLORS.platinum,
                backgroundColor: "white",
                color: COLORS.oxfordBlue,
              }}
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
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.marianBlue }}
            >
              Region
            </label>
            <select
              value={filters.region}
              onChange={(e) =>
                setFilters({ ...filters, region: e.target.value })
              }
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{
                borderColor: COLORS.platinum,
                backgroundColor: "white",
                color: COLORS.oxfordBlue,
              }}
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

      {/* Leaderboard */}
      <div
        className="rounded-xl shadow-lg overflow-hidden"
        style={{ backgroundColor: COLORS.seasalt }}
      >
        <div
          className="px-6 py-4 border-b"
          style={{
            backgroundColor: COLORS.platinum,
            borderColor: COLORS.powderBlue,
          }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ color: COLORS.oxfordBlue }}
          >
            Elite Athletes{" "}
            {filters.sport &&
              `in ${
                filters.sport.charAt(0).toUpperCase() + filters.sport.slice(1)
              }`}
            {filters.region && ` from ${filters.region}`}
          </h3>
          <p className="text-sm" style={{ color: COLORS.marianBlue }}>
            Based on total heroic points earned
          </p>
        </div>

        {leaderboard.length > 0 ? (
          <div className="divide-y" style={{ borderColor: COLORS.platinum }}>
            {leaderboard.slice(0, 50).map((entry) => (
              <div
                key={entry.athleteId}
                className={`p-6 flex items-center justify-between transition-colors ${
                  entry.athleteId === athleteId
                    ? "border-l-4"
                    : "hover:bg-opacity-50"
                }`}
                style={{
                  backgroundColor:
                    entry.athleteId === athleteId
                      ? COLORS.powderBlue + "40"
                      : COLORS.seasalt,
                  borderColor:
                    entry.athleteId === athleteId
                      ? COLORS.marianBlue
                      : "transparent",
                }}
              >
                <div className="flex items-center flex-1">
                  {/* Rank */}
                  <div className="w-16 text-center">
                    {getRankDisplay(entry.rank)}
                  </div>

                  {/* Athlete Info */}
                  <div className="flex-1 ml-4">
                    <div className="flex items-center">
                      <h4
                        className={`text-lg font-semibold ${
                          entry.athleteId === athleteId
                            ? "text-blue-900"
                            : "text-gray-900"
                        }`}
                        style={{
                          color:
                            entry.athleteId === athleteId
                              ? COLORS.marianBlue
                              : COLORS.oxfordBlue,
                        }}
                      >
                        {entry.athleteName}
                        {entry.athleteId === athleteId && (
                          <span
                            className="ml-2 text-sm"
                            style={{ color: COLORS.marianBlue }}
                          >
                            (You)
                          </span>
                        )}
                      </h4>
                      <span className="ml-3 text-2xl">
                        {getLevelBadge(entry.level)}
                      </span>
                    </div>
                    <div
                      className="flex items-center space-x-4 text-sm mt-1"
                      style={{ color: COLORS.marianBlue }}
                    >
                      <span className="flex items-center">
                        <span className="mr-1">
                          {getSportIcon(entry.sport)}
                        </span>{" "}
                        {entry.sport}
                      </span>
                      <span className="flex items-center">
                        <FaGlobeAmericas className="mr-1" /> {entry.region}
                      </span>
                      <span className="flex items-center">
                        <FaChartLine className="mr-1" /> Level {entry.level}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p
                          className="text-2xl font-bold"
                          style={{ color: COLORS.oxfordBlue }}
                        >
                          {entry.totalPoints.toLocaleString()}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: COLORS.marianBlue }}
                        >
                          Points
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-yellow-600">
                          {entry.totalBadges}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: COLORS.marianBlue }}
                        >
                          Badges
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FaTrophy
              className="text-6xl mb-4"
              style={{ color: COLORS.marianBlue }}
            />
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: COLORS.oxfordBlue }}
            >
              No Champions Here Yet!
            </h3>
            <p style={{ color: COLORS.marianBlue }}>
              {filters.sport || filters.region
                ? "Try adjusting your filters to discover more aspiring athletes."
                : "Be the first to carve your legend into the leaderboard by completing epic quests!"}
            </p>
          </div>
        )}
      </div>

      {/* Leaderboard Info */}
      <div
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: COLORS.seasalt,
          borderColor: COLORS.powderBlue,
        }}
      >
        <div className="flex items-start">
          <div
            className="p-3 rounded-lg mr-4"
            style={{ backgroundColor: COLORS.powderBlue }}
          >
            <FaInfoCircle
              className="text-2xl"
              style={{ color: COLORS.marianBlue }}
            />
          </div>
          <div>
            <h4
              className="text-lg font-semibold mb-2"
              style={{ color: COLORS.oxfordBlue }}
            >
              Ascend to Glory: Your Path to the Top
            </h4>
            <ul
              className="space-y-2 text-sm"
              style={{ color: COLORS.marianBlue }}
            >
              <li className="flex items-center">
                <IoSparkles className="text-yellow-500 mr-2" />
                Conquer quests to amass points and earn valuable badges.
              </li>
              <li className="flex items-center">
                <IoSparkles className="text-yellow-500 mr-2" />
                Log your training consistently to unlock new challenges and
                achievements.
              </li>
              <li className="flex items-center">
                <IoSparkles className="text-yellow-500 mr-2" />
                Seek out higher difficulty quests for maximum point gains.
              </li>
              <li className="flex items-center">
                <IoSparkles className="text-yellow-500 mr-2" />
                Maintain powerful training streaks for legendary bonus
                achievements!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}