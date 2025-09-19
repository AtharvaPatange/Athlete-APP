"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { 
  BarChart3, 
  Users, 
  Activity, 
  Calendar, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Filter,
  Target,
  Zap,
  Heart,
  Clock,
  Trophy,
  MapPin,
  RefreshCw
} from "lucide-react";

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
      case "excellent": return "bg-[#0F172A]";
      case "good": return "bg-[#182031]";
      case "average": return "bg-[#303644]";
      case "needsImprovement": return "bg-gray-400";
      default: return "bg-[#303644]";
    }
  };

  if (loading) {
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
        
        <div className="relative z-10 animate-pulse space-y-6">
          <div className="flex items-center justify-center mb-8">
            <RefreshCw className="w-8 h-8 text-[#0F172A] animate-spin mr-3" />
            <span className="text-lg font-medium text-[#0F172A]">Loading Analytics...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-32 shadow-sm border border-[#182031]/10"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-64 shadow-sm border border-[#182031]/10"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
        
        <div className="relative z-10 text-center">
          <div className="bg-white rounded-xl shadow-sm border border-[#182031]/10 p-8 max-w-md mx-auto">
            <div className="text-[#0F172A] mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-lg font-medium">Error Loading Analytics</p>
              <p className="text-sm text-[#303644] mt-2">{error}</p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-6 py-3 bg-[#0F172A] text-white rounded-lg hover:bg-[#182031] transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

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
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-[#182031]" />
              Analytics Dashboard
            </h2>
            <p className="text-[#303644] text-lg">
              Performance insights for {coachRegion.charAt(0).toUpperCase() + coachRegion.slice(1)} region
            </p>
          </div>
          
          <div className="flex space-x-3 mt-4 lg:mt-0">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="border border-[#182031]/20 rounded-lg px-4 py-3 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-[#0F172A] cursor-pointer transition-all min-w-[140px]"
              >
                <option value="7days" className="text-[#0F172A]">Last 7 Days</option>
                <option value="30days" className="text-[#0F172A]">Last 30 Days</option>
                <option value="3months" className="text-[#0F172A]">Last 3 Months</option>
                <option value="1year" className="text-[#0F172A]">Last Year</option>
              </select>
              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#303644] pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="border border-[#182031]/20 rounded-lg px-4 py-3 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-[#0F172A] cursor-pointer transition-all min-w-[120px]"
              >
                <option value="performance" className="text-[#0F172A]">Performance</option>
                <option value="activity" className="text-[#0F172A]">Activity</option>
                <option value="growth" className="text-[#0F172A]">Growth</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#303644] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#182031]/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#0F172A] rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#303644]">Total Athletes</p>
                <p className="text-2xl font-bold text-[#0F172A]">{analytics.totalAthletes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#182031]/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#0F172A] rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#303644]">Active Sports</p>
                <p className="text-2xl font-bold text-[#0F172A]">{analytics.activeSports.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#182031]/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#0F172A] rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#303644]">Average Age</p>
                <p className="text-2xl font-bold text-[#0F172A]"> 20 Years</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#182031]/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#0F172A] rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#303644]">Excellent Performers</p>
                <p className="text-2xl font-bold text-[#0F172A]">{analytics.performanceDistribution.excellent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#182031]/10">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#182031]" />
              Performance Distribution
            </h3>
            
            <div className="space-y-4">
              {Object.entries(analytics.performanceDistribution).map(([level, count]) => {
                const percentage = analytics.totalAthletes > 0 
                  ? Math.round((count / analytics.totalAthletes) * 100)
                  : 0;
                
                return (
                  <div key={level}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="capitalize font-medium text-[#0F172A]">
                        {level.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-[#303644]">{count} athletes ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-[#F6F7F7] rounded-full h-3 border border-[#182031]/10">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getPerformanceColor(level)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#182031]/10">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#182031]" />
              Monthly Trends (Last 6 Months)
            </h3>
            
            <div className="space-y-4">
              {analytics.monthlyTrends.map((month, index) => (
                <div key={index} className="border-l-4 border-[#0F172A] pl-4 bg-[#F6F7F7] p-3 rounded-r-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-[#0F172A]">{month.month}</span>
                    <span className="text-sm text-[#303644]">Avg Performance: {month.averagePerformance}</span>
                  </div>
                  <div className="text-sm text-[#303644] flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      {month.activeSessions} sessions
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {month.newAthletes} new athletes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#182031]/10">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#182031]" />
              Top Performers
            </h3>
            
            <div className="space-y-3">
              {analytics.topPerformers.map((athlete, index) => (
                <div key={athlete.id} className="flex items-center justify-between p-3 bg-[#F6F7F7] rounded-lg border border-[#182031]/10">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-[#0F172A]' : 
                      index === 1 ? 'bg-[#182031]' : 
                      index === 2 ? 'bg-[#303644]' : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[#0F172A]">{athlete.name}</p>
                      <p className="text-sm text-[#303644] capitalize">{athlete.sport}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#0F172A]">{athlete.overallScore}</p>
                    <p className="text-xs text-[#303644]">Overall Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Injury Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#182031]/10">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#182031]" />
              Injury & Recovery Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-[#F6F7F7] rounded-lg border border-[#182031]/10">
                <div className="text-2xl font-bold text-[#0F172A]">{analytics.injuryStats.total}</div>
                <div className="text-sm text-[#303644] font-medium">Total Injuries</div>
              </div>
              <div className="text-center p-4 bg-[#F6F7F7] rounded-lg border border-[#182031]/10">
                <div className="text-2xl font-bold text-[#0F172A]">{analytics.injuryStats.recovered}</div>
                <div className="text-sm text-[#303644] font-medium">Fully Recovered</div>
              </div>
              <div className="text-center p-4 bg-[#F6F7F7] rounded-lg border border-[#182031]/10">
                <div className="text-2xl font-bold text-[#0F172A]">{analytics.injuryStats.inRecovery}</div>
                <div className="text-sm text-[#303644] font-medium">In Recovery</div>
              </div>
              <div className="text-center p-4 bg-[#F6F7F7] rounded-lg border border-[#182031]/10">
                <div className="text-2xl font-bold text-[#0F172A]">{analytics.injuryStats.awaitingApproval}</div>
                <div className="text-sm text-[#303644] font-medium">Awaiting Approval</div>
              </div>
            </div>
          </div>
        </div>

        {/* Region Comparison */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#182031]/10">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#182031]" />
              Regional Comparison
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {analytics.regionComparison.map((region) => (
                <div key={region.region} className={`p-4 rounded-lg border-2 transition-all ${
                  region.region.toLowerCase() === coachRegion 
                    ? 'border-[#0F172A] bg-[#0F172A]/5' 
                    : 'border-[#182031]/20 bg-white hover:bg-[#F6F7F7]'
                }`}>
                  <div className="text-center">
                    <h4 className="font-bold text-[#0F172A]">{region.region}</h4>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-[#0F172A]">{region.athleteCount}</div>
                      <div className="text-xs text-[#303644]">Athletes</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-lg font-semibold text-[#182031]">{region.avgPerformance}</div>
                      <div className="text-xs text-[#303644]">Avg Performance</div>
                    </div>
                    {region.region.toLowerCase() === coachRegion && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#0F172A] text-white">
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
    </div>
  );
};

export default CoachAnalyticsDashboard;