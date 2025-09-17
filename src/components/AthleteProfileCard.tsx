"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";

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
  };
  lastActiveAt?: any;
  createdAt?: any;
}

interface AthleteProfileCardProps {
  athlete: Athlete;
  onViewDetails: () => void;
}

interface TrainingSession {
  date: any;
  sport: string;
  duration: number;
  performance: {
    speed: number;
    strength: number;
    endurance: number;
  };
}

const AthleteProfileCard = ({ athlete, onViewDetails }: AthleteProfileCardProps) => {
  const [recentSessions, setRecentSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentSessions();
  }, [athlete.id]);

  const fetchRecentSessions = async () => {
    try {
      const sessionsRef = collection(db, "trainingSessions");
      const q = query(
        sessionsRef,
        where("athleteId", "==", athlete.id),
        limit(10) // Get more and sort client-side
      );
      
      const snapshot = await getDocs(q);
      const sessions: TrainingSession[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          date: data.date,
          sport: data.sport || athlete.sport,
          duration: data.duration || 0,
          performance: data.performance || { speed: 0, strength: 0, endurance: 0 }
        });
      });

      // Sort by date (most recent first) and limit to 3
      sessions.sort((a, b) => {
        const aTime = a.date?.toMillis?.() || 0;
        const bTime = b.date?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      setRecentSessions(sessions.slice(0, 3));
    } catch (error) {
      console.error("Error fetching training sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "No data";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 80) return "text-green-600 bg-green-100";
    if (value >= 60) return "text-yellow-600 bg-yellow-100";
    if (value >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getOverallPerformance = () => {
    if (!athlete.performance) return 0;
    const { speed, strength, endurance } = athlete.performance;
    return Math.round((speed + strength + endurance) / 3);
  };

  const getSportEmoji = (sport: string) => {
    const emojiMap: { [key: string]: string } = {
      football: "⚽",
      basketball: "🏀",
      tennis: "🎾",
      swimming: "🏊‍♂️",
      running: "🏃‍♂️",
      cycling: "🚴‍♂️",
      weightlifting: "🏋️‍♂️",
      other: "🏆"
    };
    return emojiMap[sport.toLowerCase()] || "🏆";
  };

  const getActivityStatus = () => {
    if (recentSessions.length === 0) return { text: "Inactive", color: "text-red-600 bg-red-100" };
    if (recentSessions.length >= 2) return { text: "Very Active", color: "text-green-600 bg-green-100" };
    return { text: "Moderately Active", color: "text-yellow-600 bg-yellow-100" };
  };

  const activityStatus = getActivityStatus();
  const overallPerformance = getOverallPerformance();

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-2">
              <span className="text-2xl">{getSportEmoji(athlete.sport)}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white truncate">
                {athlete.name}
              </h3>
              <p className="text-blue-100 text-sm">
                {athlete.age} years • {athlete.gender}
              </p>
            </div>
          </div>
          
          {athlete.disability_flag && (
            <div className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
              ♿ Special Needs
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Sport and Activity Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Sport</p>
            <p className="font-medium text-gray-900 capitalize">
              {athlete.sport}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Activity</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${activityStatus.color}`}>
              {activityStatus.text}
            </span>
          </div>
        </div>

        {/* Performance Overview */}
        {athlete.performance && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Overall Performance</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(overallPerformance)}`}>
                {overallPerformance}/100
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-xs text-gray-500">Speed</div>
                <div className="text-sm font-medium text-blue-600">
                  {athlete.performance.speed}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Strength</div>
                <div className="text-sm font-medium text-green-600">
                  {athlete.performance.strength}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Endurance</div>
                <div className="text-sm font-medium text-orange-600">
                  {athlete.performance.endurance}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <p className="text-sm text-gray-500 mb-2">Recent Training</p>
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 rounded h-4"></div>
              ))}
            </div>
          ) : recentSessions.length > 0 ? (
            <div className="space-y-1">
              {recentSessions.slice(0, 2).map((session, index) => (
                <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                  <div className="flex justify-between">
                    <span>{formatDate(session.date)}</span>
                    <span className="font-medium">{session.duration}min</span>
                  </div>
                </div>
              ))}
              {recentSessions.length > 2 && (
                <p className="text-xs text-gray-400">
                  +{recentSessions.length - 2} more sessions
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 bg-gray-50 rounded p-2">
              No recent training data
            </p>
          )}
        </div>

        {/* Contact Info */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">Contact</p>
          <p className="text-sm text-gray-700 truncate">{athlete.email}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            View Full Profile
          </button>
          <button 
            className="flex-1 bg-white text-gray-700 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            onClick={() => window.location.href = `mailto:${athlete.email}`}
          >
            Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default AthleteProfileCard;