"use client";
import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { 
  getSessionsByDateRange, 
  TrainingSession, 
  calculateWeeklyStats, 
  calculateMonthlyStats 
} from "@/services/performanceService";
import ConsistencyCalendar from './ConsistencyCalendar';

interface PerformanceAnalyticsProps {
  athleteId: string;
  refreshTrigger: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PerformanceAnalytics({ athleteId, refreshTrigger }: PerformanceAnalyticsProps) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [chartType, setChartType] = useState<'duration' | 'distance' | 'intensity'>('duration');

  useEffect(() => {
    fetchAnalyticsData();
  }, [athleteId, timeRange, refreshTrigger]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = subWeeks(now, 4); // Last 4 weeks
        break;
      case 'month':
        startDate = subMonths(now, 3); // Last 3 months
        break;
      case 'quarter':
        startDate = subMonths(now, 12); // Last 12 months
        break;
    }

    const result = await getSessionsByDateRange(athleteId, startDate, now);
    if (result.success) {
      setSessions(result.sessions);
    }
    setLoading(false);
  };

  const getChartData = () => {
    if (timeRange === 'week') {
      return calculateWeeklyStats(sessions);
    } else {
      return calculateMonthlyStats(sessions);
    }
  };

  const getIntensityDistribution = () => {
    const distribution = sessions.reduce((acc, session) => {
      acc[session.intensity] = (acc[session.intensity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([intensity, count]) => ({
      name: intensity.charAt(0).toUpperCase() + intensity.slice(1),
      value: count,
      percentage: ((count / sessions.length) * 100).toFixed(1)
    }));
  };

  const getSportDistribution = () => {
    const distribution = sessions.reduce((acc, session) => {
      acc[session.sport] = (acc[session.sport] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([sport, count]) => ({
      name: sport,
      value: count,
      percentage: ((count / sessions.length) * 100).toFixed(1)
    }));
  };

  const getTotalStats = () => {
    return {
      totalSessions: sessions.length,
      totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
      totalDistance: sessions.reduce((sum, s) => sum + (s.distance || 0), 0),
      avgDuration: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length : 0,
      avgDistance: sessions.length > 0 ? sessions.reduce((sum, s) => sum + (s.distance || 0), 0) / sessions.length : 0
    };
  };

  const chartData = getChartData();
  const intensityData = getIntensityDistribution();
  const sportData = getSportDistribution();
  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consistency Calendar */}
      <ConsistencyCalendar athleteId={athleteId} />
      
      {/* Header Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Performance Analytics</h3>
              <p className="text-gray-600">Track your training progress and insights</p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { value: 'week', label: '4 Weeks' },
                { value: 'month', label: '3 Months' },
                { value: 'quarter', label: '12 Months' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    timeRange === option.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Chart Type Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { value: 'duration', label: '⏱️' },
                { value: 'distance', label: '📏' },
                { value: 'intensity', label: '🔥' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setChartType(option.value as any)}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    chartType === option.value
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-gray-200'
                  }`}
                  title={option.value.charAt(0).toUpperCase() + option.value.slice(1)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-blue-600 text-sm font-medium">Total Sessions</p>
            <p className="text-2xl font-bold text-blue-900">{stats.totalSessions}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-green-600 text-sm font-medium">Total Duration</p>
            <p className="text-2xl font-bold text-green-900">{Math.round(stats.totalDuration / 60)}h</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-purple-600 text-sm font-medium">Total Distance</p>
            <p className="text-2xl font-bold text-purple-900">{stats.totalDistance.toFixed(1)}km</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <p className="text-orange-600 text-sm font-medium">Avg Duration</p>
            <p className="text-2xl font-bold text-orange-900">{Math.round(stats.avgDuration)}min</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg text-center">
            <p className="text-pink-600 text-sm font-medium">Avg Distance</p>
            <p className="text-2xl font-bold text-pink-900">{stats.avgDistance.toFixed(1)}km</p>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Trends
        </h4>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={timeRange === 'week' ? 'week' : 'month'}
                tickFormatter={(value) => timeRange === 'week' ? `Week ${value}` : value}
                tick={{ fill: '#374151', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => timeRange === 'week' ? `Week of ${value}` : `Month ${value}`}
                formatter={(value: any, name: string) => {
                  if (name === 'totalDuration') return [`${value} min`, 'Duration'];
                  if (name === 'totalDistance') return [`${value} km`, 'Distance'];
                  if (name === 'avgIntensity') return [`${value.toFixed(1)}`, 'Avg Intensity'];
                  return [value, name];
                }}
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  color: '#374151'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={
                  chartType === 'duration' ? 'totalDuration' :
                  chartType === 'distance' ? 'totalDistance' : 'avgIntensity'
                }
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#1d4ed8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-lg font-medium">No training data available for the selected period</p>
              <p className="text-sm text-gray-600 mt-2">Try logging some training sessions first!</p>
            </div>
          </div>
        )}
      </div>

      {/* Distribution Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Intensity Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Intensity Distribution</h4>
          {intensityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={intensityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#3b82f6"
                  dataKey="value"
                  style={{ fontSize: '12px', fill: '#374151' }}
                >
                  {intensityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} sessions`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    color: '#374151'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-700">
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <p className="font-medium">No intensity data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Sport Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Sport Distribution</h4>
        {sportData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" /> 
              <XAxis dataKey="name" tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis tick={{ fill: '#374151', fontSize: 12 }} />

              <Tooltip 
                formatter={(value: any) => [`${value} sessions`, 'Count']}
                contentStyle={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '10px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                  color: '#374151'
                }}
              />

                  <Bar 
                    dataKey="value" 
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                    animationDuration={800}
                  >
                    {sportData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={["#3b82f6", "#a855f7", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"][index % 6]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
  ) : (
    <div className="h-48 flex items-center justify-center text-gray-700">
      <div className="text-center">
        <div className="text-3xl mb-2">🏃‍♂️</div>
        <p className="font-medium">No sport data available</p>
      </div>
    </div>
  )}
</div>
      </div>
    </div>
  );
}
