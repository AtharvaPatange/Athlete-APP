"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
  AreaChart
} from "recharts";

// Color palettes for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];
const SPORT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

interface AthleteSchemeData {
  scheme: string;
  allocated: number;
  disbursed: number;
  pending: number;
  beneficiaries: number;
}

interface SportWiseData {
  sport: string;
  athletes: number;
  funding: number;
  medals: number;
  performance: number;
}

interface RegionData {
  region: string;
  athletes: number;
  funding: number;
  schemes: number;
}

interface FundingTrend {
  month: string;
  totalFunding: number;
  athleteCount: number;
  schemes: number;
}

interface PerformanceMetrics {
  metric: string;
  value: number;
  target: number;
  achievement: number;
}

interface SystemHealth {
  component: string;
  status: number;
  uptime: number;
}

export default function AthleteTransparencyDashboard() {
  const [athleteSchemes, setAthleteSchemes] = useState<AthleteSchemeData[]>([]);
  const [sportWiseData, setSportWiseData] = useState<SportWiseData[]>([]);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [fundingTrends, setFundingTrends] = useState<FundingTrend[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string>("");

  const GEMINI_API_KEY = "AIzaSyCE9DNXLCebiANMcQE9mktuK9nm6bxECjk";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  const callGeminiAPI = async (prompt: string) => {
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  const fetchAthleteSchemes = async () => {
    const prompt = `Generate realistic JSON data for Indian athlete funding schemes. Return ONLY valid JSON array with exactly this structure:
[
  {
    "scheme": "Target Olympic Podium",
    "allocated": 50000000,
    "disbursed": 35000000,
    "pending": 15000000,
    "beneficiaries": 150
  }
]
Include 5 real Indian sports schemes like TOP, Khelo India, SAI Training Centers, TOPS Development, Sports Scholarship. Use realistic funding amounts in rupees (10M-100M range). Make disbursed + pending = allocated. No additional text, just JSON.`;

    try {
      const response = await callGeminiAPI(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setAthleteSchemes(data);
      }
    } catch (error) {
      console.error('Error fetching athlete schemes:', error);
    }
  };

  const fetchSportWiseData = async () => {
    const prompt = `Generate realistic JSON data for Indian sports performance. Return ONLY valid JSON array with exactly this structure:
[
  {
    "sport": "Cricket",
    "athletes": 45,
    "funding": 25000000,
    "medals": 8,
    "performance": 85
  }
]
Include 7 popular Indian sports: Cricket, Badminton, Hockey, Wrestling, Athletics, Boxing, Swimming. Use realistic numbers: athletes (20-60), funding in rupees (5M-30M), medals (3-20), performance score (70-95). No additional text, just JSON.`;

    try {
      const response = await callGeminiAPI(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setSportWiseData(data);
      }
    } catch (error) {
      console.error('Error fetching sport-wise data:', error);
    }
  };

  const fetchRegionData = async () => {
    const prompt = `Generate realistic JSON data for Indian regional sports distribution. Return ONLY valid JSON array with exactly this structure:
[
  {
    "region": "North",
    "athletes": 120,
    "funding": 45000000,
    "schemes": 15
  }
]
Include 6 regions: North, South, West, East, Central, Northeast. Use realistic numbers: athletes (30-150), funding in rupees (15M-50M), schemes (5-20). No additional text, just JSON.`;

    try {
      const response = await callGeminiAPI(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setRegionData(data);
      }
    } catch (error) {
      console.error('Error fetching region data:', error);
    }
  };

  const fetchFundingTrends = async () => {
    const prompt = `Generate realistic JSON data for 12 months of Indian sports funding trends. Return ONLY valid JSON array with exactly this structure:
[
  {
    "month": "Jan",
    "totalFunding": 15000000,
    "athleteCount": 220,
    "schemes": 18
  }
]
Include all 12 months (Jan to Dec). Use realistic numbers: totalFunding (10M-25M rupees), athleteCount (180-280), schemes (12-25). Show seasonal variations. No additional text, just JSON.`;

    try {
      const response = await callGeminiAPI(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setFundingTrends(data);
      }
    } catch (error) {
      console.error('Error fetching funding trends:', error);
    }
  };

  const fetchPerformanceMetrics = async () => {
    const prompt = `Generate realistic JSON data for Indian sports performance metrics. Return ONLY valid JSON array with exactly this structure:
[
  {
    "metric": "Training Quality",
    "value": 85,
    "target": 90,
    "achievement": 94
  }
]
Include 6 metrics: Training Quality, Equipment Access, Coaching Standards, Nutrition Support, Medical Support, Mental Health. Use realistic scores (70-95) where target > value, achievement varies. No additional text, just JSON.`;

    try {
      const response = await callGeminiAPI(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setPerformanceMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    }
  };

  // Function to fetch system health data
  const fetchSystemHealth = async () => {
    const prompt = `Generate realistic JSON data for sports dashboard system health. Return ONLY valid JSON array with exactly this structure:
[
  {
    "component": "Data Accuracy",
    "status": 95,
    "uptime": 99.8
  }
]
Include 5 components: Data Accuracy, API Response, Database, User Portal, Payment System. Use realistic status (80-98%) and uptime (99.0-99.9%). No additional text, just JSON.`;

    try {
      const response = await callGeminiAPI(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  const fetchAllDataFromGemini = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log("🚀 Fetching data from Gemini API...");
      
      await Promise.all([
        fetchAthleteSchemes(),
        fetchSportWiseData(),
        fetchRegionData(),
        fetchFundingTrends(),
        fetchPerformanceMetrics(),
        fetchSystemHealth()
      ]);
      
      setLastUpdated(new Date().toLocaleString());
      console.log("✅ All data successfully fetched from Gemini API");
      
    } catch (error) {
      console.error("❌ Error fetching data from Gemini API:", error);
      setError("Failed to fetch data from Gemini API. Please check your API key and connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDataFromGemini();
    
    const interval = setInterval(() => {
      console.log("🔄 Scheduled 3-hour update triggered");
      fetchAllDataFromGemini();
    }, 3 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Loading Athlete Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching real-time data from Gemini API</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">API Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchAllDataFromGemini}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            🏆 Athlete Transparency Dashboard
          </h1>
          <p className="text-gray-600">Real-time insights powered by Gemini AI</p>
          {lastUpdated && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
              <p className="text-xs text-green-600">✅ Data fetched from Gemini API • Next update in 3 hours</p>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <button 
            onClick={fetchAllDataFromGemini}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "🔄 Refreshing..." : "🔄 Refresh Data Now"}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Athletes</h3>
            <p className="text-3xl font-bold text-blue-600">
              {regionData.reduce((sum, region) => sum + region.athletes, 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Funding</h3>
            <p className="text-3xl font-bold text-green-600">
              ₹{(athleteSchemes.reduce((sum, scheme) => sum + scheme.allocated, 0) / 10000000).toFixed(1)}Cr
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Schemes</h3>
            <p className="text-3xl font-bold text-purple-600">{athleteSchemes.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Beneficiaries</h3>
            <p className="text-3xl font-bold text-orange-600">
              {athleteSchemes.reduce((sum, scheme) => sum + scheme.beneficiaries, 0)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">💰 Athlete Scheme Funding</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={athleteSchemes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scheme" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${(value as number / 1000000).toFixed(1)}M`, '']} />
                <Legend />
                <Bar dataKey="allocated" fill="#3b82f6" name="Allocated" />
                <Bar dataKey="disbursed" fill="#10b981" name="Disbursed" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">⚽ Sport-wise Athlete Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sportWiseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ sport, athletes }) => `${sport}: ${athletes}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="athletes"
                >
                  {sportWiseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SPORT_COLORS[index % SPORT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">📊 Performance Metrics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" fontSize={12} />
                <PolarRadiusAxis domain={[0, 100]} tickCount={5} />
                <Radar name="Current" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Radar name="Target" dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">🗺️ Region-wise Analysis</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => [
                  name === 'funding' ? `₹${(value as number / 1000000).toFixed(1)}M` : value,
                  name
                ]} />
                <Legend />
                <Bar yAxisId="left" dataKey="athletes" fill="#3b82f6" name="Athletes" />
                <Line yAxisId="right" type="monotone" dataKey="funding" stroke="#10b981" strokeWidth={3} name="Funding" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">📈 Funding Trends (12 Months)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={fundingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'totalFunding' ? `₹${(value as number / 1000000).toFixed(1)}M` : value,
                  name
                ]} />
                <Legend />
                <Area type="monotone" dataKey="totalFunding" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Total Funding" />
                <Area type="monotone" dataKey="athleteCount" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Athlete Count" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">🏅 Sport-wise Performance & Funding</h2>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={sportWiseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sport" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => [
                  name === 'funding' ? `₹${(value as number / 1000000).toFixed(1)}M` : value,
                  name
                ]} />
                <Legend />
                <Bar yAxisId="left" dataKey="medals" fill="#f59e0b" name="Medals Won" />
                <Bar yAxisId="left" dataKey="performance" fill="#8b5cf6" name="Performance Score" />
                <Line yAxisId="right" type="monotone" dataKey="funding" stroke="#ef4444" strokeWidth={3} name="Funding Allocated" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">🔧 System Health Monitoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {systemHealth.map((component, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className={`text-3xl font-bold ${component.status >= 90 ? 'text-green-600' : component.status >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {component.status}%
                </div>
                <p className="text-sm text-gray-600 mt-1">{component.component}</p>
                <p className="text-xs text-gray-500">Uptime: {component.uptime}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-6 text-gray-500 text-sm">
          <p>🤖 Powered by Gemini API • Auto-updates every 3 hours • Real-time AI-generated athlete data</p>
        </div>
      </div>
    </div>
  );
}