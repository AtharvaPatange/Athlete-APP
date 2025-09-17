"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

interface CoachAnalyticsDashboardProps {
  coachRegion: string;
  coachSport: string;
  coachId: string;
}

interface AnalyticsData {
  totalAthletes: number;
  activeSports: string[];
  averageAge: number;
  performanceDistribution: {
    excellent: number;
    good: number;
    average: number;
    needsImprovement: number;
  };
  monthlyTrends: {
    month: string;
    newAthletes: number;
    activeSessions: number;
    averagePerformance: number;
  }[];
  topPerformers: {
    id: string;
    name: string;
    sport: string;
    overallScore: number;
  }[];
  injuryStats: {
    total: number;
    recovered: number;
    inRecovery: number;
    awaitingApproval: number;
  };
  regionComparison: {
    region: string;
    athleteCount: number;
    avgPerformance: number;
  }[];
}

const CoachAnalyticsDashboard = ({ coachRegion, coachSport, coachId }: CoachAnalyticsDashboardProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "3months" | "1year">("30days");
  const [selectedMetric, setSelectedMetric] = useState<"performance" | "activity" | "growth">("performance");

  useEffect(() => {
    fetchAnalytics();
  }, [coachRegion, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all athletes in coach's region
      const usersRef = collection(db, "users");
      const athletesQuery = query(
        usersRef,
        where("role", "==", "athlete"),
        where("region", "==", coachRegion)
      );
      
      const athletesSnapshot = await getDocs(athletesQuery);
      const athletes: any[] = [];
      
      athletesSnapshot.forEach((doc) => {
        athletes.push({ id: doc.id, ...doc.data() });
      });

      // Calculate basic stats
      const totalAthletes = athletes.length;
      const activeSports = [...new Set(athletes.map(a => a.sport))];
      const averageAge = athletes.length > 0 
        ? Math.round(athletes.reduce((sum, a) => sum + (a.age || 0), 0) / athletes.length)
        : 0;

      // Performance distribution
      const performanceDistribution = {
        excellent: 0,
        good: 0,
        average: 0,
        needsImprovement: 0
      };

      const topPerformers: any[] = [];

      athletes.forEach(athlete => {
        if (athlete.performance) {
          const { speed, strength, endurance } = athlete.performance;
          const overallScore = Math.round((speed + strength + endurance) / 3);
          
          if (overallScore >= 85) performanceDistribution.excellent++;
          else if (overallScore >= 70) performanceDistribution.good++;
          else if (overallScore >= 55) performanceDistribution.average++;
          else performanceDistribution.needsImprovement++;

          topPerformers.push({
            id: athlete.id,
            name: athlete.name || "Unknown",
            sport: athlete.sport || "Unknown",
            overallScore
          });
        } else {
          performanceDistribution.needsImprovement++;
        }
      });

      // Sort and limit top performers
      topPerformers.sort((a, b) => b.overallScore - a.overallScore);
      
      // Fetch training sessions for trends
      const sessionsRef = collection(db, "trainingSessions");
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      const monthlyData: { [key: string]: { sessions: number; performance: number[]; newAthletes: Set<string> } } = {};
      const now = new Date();
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyData[key] = { sessions: 0, performance: [], newAthletes: new Set() };
      }

      sessionsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date && data.athleteId) {
          const sessionDate = data.date.toDate ? data.date.toDate() : new Date(data.date);
          const monthKey = sessionDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].sessions++;
            if (data.performance) {
              const { speed, strength, endurance } = data.performance;
              monthlyData[monthKey].performance.push((speed + strength + endurance) / 3);
            }
          }
        }
      });

      // Track new athletes by creation date
      athletes.forEach(athlete => {
        if (athlete.createdAt) {
          const createdDate = athlete.createdAt.toDate ? athlete.createdAt.toDate() : new Date(athlete.createdAt);
          const monthKey = createdDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].newAthletes.add(athlete.id);
          }
        }
      });

      const monthlyTrends = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        newAthletes: data.newAthletes.size,
        activeSessions: data.sessions,
        averagePerformance: data.performance.length > 0 
          ? Math.round(data.performance.reduce((sum, p) => sum + p, 0) / data.performance.length)
          : 0
      }));

      // Fetch injury stats (simulated for now - you can implement actual injury tracking)
      const injuryStats = {
        total: Math.floor(totalAthletes * 0.15), // 15% injury rate
        recovered: Math.floor(totalAthletes * 0.10),
        inRecovery: Math.floor(totalAthletes * 0.04),
        awaitingApproval: Math.floor(totalAthletes * 0.01)
      };

      // Region comparison (fetch other regions for comparison)
      const allRegions = ["north", "south", "east", "west", "central"];
      const regionComparison = await Promise.all(
        allRegions.map(async (region) => {
          const regionQuery = query(
            usersRef,
            where("role", "==", "athlete"),
            where("region", "==", region)
          );
          const regionSnapshot = await getDocs(regionQuery);
          const regionAthletes: any[] = [];
          
          regionSnapshot.forEach((doc) => {
            regionAthletes.push(doc.data());
          });

          const avgPerformance = regionAthletes.length > 0
            ? Math.round(regionAthletes.reduce((sum, a) => {
                if (a.performance) {
                  const { speed, strength, endurance } = a.performance;
                  return sum + (speed + strength + endurance) / 3;
                }
                return sum;
              }, 0) / regionAthletes.length)
            : 0;

          return {
            region: region.charAt(0).toUpperCase() + region.slice(1),
            athleteCount: regionAthletes.length,
            avgPerformance
          };
        })
      );

      const analyticsData: AnalyticsData = {
        totalAthletes,
        activeSports,
        averageAge,
        performanceDistribution,
        monthlyTrends,
        topPerformers: topPerformers.slice(0, 5),
        injuryStats,
        regionComparison
      };

      setAnalytics(analyticsData);

    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      setError(err.message || "Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (category: string) => {
    switch (category) {
      case "excellent": return "bg-green-500";
      case "good": return "bg-blue-500";
      case "average": return "bg-yellow-500";
      case "needsImprovement": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-300 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-300 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M6.938 4h10.124c1.54 0 2.502 1.667 1.732 2.5L13.732 20c-.77.833-1.964.833-2.732 0L4.082 6.5C3.312 5.167 4.273 4 5.812 4z" />
          </svg>
          <p className="text-lg font-medium">Error Loading Analytics</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600">
            Performance insights for {coachRegion.charAt(0).toUpperCase() + coachRegion.slice(1)} region
          </p>
        </div>
        
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="1year">Last Year</option>
          </select>
          
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="performance">Performance</option>
            <option value="activity">Activity</option>
            <option value="growth">Growth</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Athletes</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalAthletes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Sports</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeSports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Age</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageAge} yrs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Excellent Performers</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.performanceDistribution.excellent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Distribution */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Distribution
          </h3>
          
          <div className="space-y-4">
            {Object.entries(analytics.performanceDistribution).map(([level, count]) => {
              const percentage = analytics.totalAthletes > 0 
                ? Math.round((count / analytics.totalAthletes) * 100)
                : 0;
              
              return (
                <div key={level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize font-medium text-gray-700">
                      {level.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-gray-500">{count} athletes ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getPerformanceColor(level)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Trends (Last 6 Months)
          </h3>
          
          <div className="space-y-4">
            {analytics.monthlyTrends.map((month, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-900">{month.month}</span>
                  <span className="text-sm text-gray-500">Avg Performance: {month.averagePerformance}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="mr-4">🏃 {month.activeSessions} sessions</span>
                  <span>👥 {month.newAthletes} new athletes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performers
          </h3>
          
          <div className="space-y-3">
            {analytics.topPerformers.map((athlete, index) => (
              <div key={athlete.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{athlete.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{athlete.sport}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{athlete.overallScore}</p>
                  <p className="text-xs text-gray-500">Overall Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Injury Statistics */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Injury & Recovery Stats
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analytics.injuryStats.total}</div>
              <div className="text-sm text-red-800">Total Injuries</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.injuryStats.recovered}</div>
              <div className="text-sm text-green-800">Fully Recovered</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{analytics.injuryStats.inRecovery}</div>
              <div className="text-sm text-yellow-800">In Recovery</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.injuryStats.awaitingApproval}</div>
              <div className="text-sm text-blue-800">Awaiting Approval</div>
            </div>
          </div>
        </div>
      </div>

      {/* Region Comparison */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Regional Comparison
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {analytics.regionComparison.map((region) => (
              <div key={region.region} className={`p-4 rounded-lg border-2 ${
                region.region.toLowerCase() === coachRegion 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="text-center">
                  <h4 className="font-bold text-gray-900">{region.region}</h4>
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-blue-600">{region.athleteCount}</div>
                    <div className="text-xs text-gray-500">Athletes</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-semibold text-green-600">{region.avgPerformance}</div>
                    <div className="text-xs text-gray-500">Avg Performance</div>
                  </div>
                  {region.region.toLowerCase() === coachRegion && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Your Region
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachAnalyticsDashboard;