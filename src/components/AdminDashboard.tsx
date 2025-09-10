"use client";
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { seedAdminUsers, seedAdminDemoData } from "@/services/seedAdminData";

interface AdminDashboardProps {
  adminId: string;
  adminRole: string;
}

interface AthleteStats {
  totalAthletes: number;
  activeAthletes: number;
  newRegistrations: number;
  byDisability: { enabled: number; disabled: number };
  bySport: { [key: string]: number };
  byRegion: { [key: string]: number };
  byGender: { male: number; female: number; other: number };
}

interface InjuryTrends {
  month: string;
  injuries: number;
  recoveries: number;
  severity: {
    minor: number;
    moderate: number;
    severe: number;
  };
}

interface FairnessReport {
  region: string;
  totalApplications: number;
  avgFairnessScore: number;
  stPercentage: number;
  scPercentage: number;
  obcPercentage: number;
  womenPercentage: number;
  ruralPercentage: number;
}

const COLORS = ['#182031', '#020817', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];

export default function AdminDashboard({ adminId, adminRole }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'athletes' | 'fairness' | 'injuries' | 'allocations'>('overview');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: 'all',
    region: 'all',
    disability: 'all',
    timeRange: '6months'
  });

  // Data states
  const [athleteStats, setAthleteStats] = useState<AthleteStats | null>(null);
  const [injuryTrends, setInjuryTrends] = useState<InjuryTrends[]>([]);
  const [fairnessReports, setFairnessReports] = useState<FairnessReport[]>([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [filters]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAthleteStats(),
        fetchInjuryTrends(),
        fetchFairnessReports()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAthleteStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const athletes = users.filter((user: any) => user.role === 'athlete');
      
      // Process athlete statistics
      const stats: AthleteStats = {
        totalAthletes: athletes.length,
        activeAthletes: athletes.filter((a: any) => a.isActive !== false).length,
        newRegistrations: athletes.filter((a: any) => {
          const createdAt = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return createdAt > sixMonthsAgo;
        }).length,
        byDisability: {
          enabled: athletes.filter((a: any) => !a.disability_flag).length,
          disabled: athletes.filter((a: any) => a.disability_flag).length
        },
        bySport: {},
        byRegion: {},
        byGender: {
          male: athletes.filter((a: any) => a.gender === 'Male').length,
          female: athletes.filter((a: any) => a.gender === 'Female').length,
          other: athletes.filter((a: any) => a.gender === 'Other').length
        }
      };

      // Count by sport and region
      athletes.forEach((athlete: any) => {
        if (athlete.sport) {
          stats.bySport[athlete.sport] = (stats.bySport[athlete.sport] || 0) + 1;
        }
        if (athlete.region) {
          stats.byRegion[athlete.region] = (stats.byRegion[athlete.region] || 0) + 1;
        }
      });

      setAthleteStats(stats);
    } catch (error) {
      console.error('Error fetching athlete stats:', error);
    }
  };

  const fetchInjuryTrends = async () => {
    try {
      // Mock injury data for demo - in real app, fetch from injury_reports collection
      const mockInjuryTrends: InjuryTrends[] = [
        {
          month: 'Apr 2024',
          injuries: 45,
          recoveries: 38,
          severity: { minor: 25, moderate: 15, severe: 5 }
        },
        {
          month: 'May 2024',
          injuries: 52,
          recoveries: 41,
          severity: { minor: 30, moderate: 18, severe: 4 }
        },
        {
          month: 'Jun 2024',
          injuries: 38,
          recoveries: 47,
          severity: { minor: 22, moderate: 12, severe: 4 }
        },
        {
          month: 'Jul 2024',
          injuries: 61,
          recoveries: 35,
          severity: { minor: 35, moderate: 20, severe: 6 }
        },
        {
          month: 'Aug 2024',
          injuries: 42,
          recoveries: 53,
          severity: { minor: 28, moderate: 10, severe: 4 }
        },
        {
          month: 'Sep 2024',
          injuries: 37,
          recoveries: 44,
          severity: { minor: 24, moderate: 9, severe: 4 }
        }
      ];
      
      setInjuryTrends(mockInjuryTrends);
    } catch (error) {
      console.error('Error fetching injury trends:', error);
    }
  };

  const fetchFairnessReports = async () => {
    try {
      // Fetch scholarship applications for fairness analysis
      const applicationsSnapshot = await getDocs(collection(db, 'scholarship_applications'));
      const applications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Mock fairness data for demo
      const mockFairnessReports: FairnessReport[] = [
        {
          region: 'Haryana',
          totalApplications: 245,
          avgFairnessScore: 87.3,
          stPercentage: 8.2,
          scPercentage: 16.1,
          obcPercentage: 28.6,
          womenPercentage: 42.4,
          ruralPercentage: 68.9
        },
        {
          region: 'Kerala',
          totalApplications: 198,
          avgFairnessScore: 82.7,
          stPercentage: 2.5,
          scPercentage: 8.6,
          obcPercentage: 45.2,
          womenPercentage: 38.9,
          ruralPercentage: 34.3
        },
        {
          region: 'Maharashtra',
          totalApplications: 312,
          avgFairnessScore: 85.1,
          stPercentage: 7.1,
          scPercentage: 13.5,
          obcPercentage: 31.7,
          womenPercentage: 40.7,
          ruralPercentage: 55.8
        },
        {
          region: 'Karnataka',
          totalApplications: 267,
          avgFairnessScore: 84.9,
          stPercentage: 6.7,
          scPercentage: 15.4,
          obcPercentage: 29.2,
          womenPercentage: 44.2,
          ruralPercentage: 48.7
        }
      ];

      setFairnessReports(mockFairnessReports);
    } catch (error) {
      console.error('Error fetching fairness reports:', error);
    }
  };

  const exportData = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    // Create CSV data based on active tab
    let csvData = '';
    let filename = '';

    switch (activeTab) {
      case 'athletes':
        if (athleteStats) {
          csvData = 'Metric,Value\\n';
          csvData += `Total Athletes,${athleteStats.totalAthletes}\\n`;
          csvData += `Active Athletes,${athleteStats.activeAthletes}\\n`;
          csvData += `New Registrations,${athleteStats.newRegistrations}\\n`;
          csvData += `Male Athletes,${athleteStats.byGender.male}\\n`;
          csvData += `Female Athletes,${athleteStats.byGender.female}\\n`;
          csvData += `Athletes with Disabilities,${athleteStats.byDisability.disabled}\\n`;
          filename = 'athlete_stats.csv';
        }
        break;
      case 'fairness':
        csvData = 'Region,Total Applications,Avg Fairness Score,ST %,SC %,OBC %,Women %,Rural %\\n';
        fairnessReports.forEach(report => {
          csvData += `${report.region},${report.totalApplications},${report.avgFairnessScore},${report.stPercentage},${report.scPercentage},${report.obcPercentage},${report.womenPercentage},${report.ruralPercentage}\\n`;
        });
        filename = 'fairness_reports.csv';
        break;
      case 'injuries':
        csvData = 'Month,Injuries,Recoveries,Minor,Moderate,Severe\\n';
        injuryTrends.forEach(trend => {
          csvData += `${trend.month},${trend.injuries},${trend.recoveries},${trend.severity.minor},${trend.severity.moderate},${trend.severity.severe}\\n`;
        });
        filename = 'injury_trends.csv';
        break;
      default:
        csvData = 'No data available for export';
        filename = 'export.csv';
    }

    // Create and download CSV file
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // For PDF export, you would typically use a library like jsPDF
    // For now, we'll just show an alert
    alert('PDF export feature would be implemented with jsPDF library in production');
  };

  const handleSeedAdminData = async () => {
    setSeeding(true);
    try {
      await seedAdminUsers();
      await seedAdminDemoData();
      // Refresh data after seeding
      await fetchAdminData();
    } catch (error) {
      console.error('Error seeding admin data:', error);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header with Export Options */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Sports Ministry Administration Console</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => exportData('csv')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => exportData('pdf')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📄 Export PDF
            </button>
            {(!athleteStats || athleteStats.totalAthletes === 0) && (
              <button
                onClick={handleSeedAdminData}
                disabled={seeding}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {seeding ? 'Seeding...' : '🌱 Seed Admin Data'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
            <select
              value={filters.sport}
              onChange={(e) => setFilters(prev => ({ ...prev, sport: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
            >
              <option value="all">All Sports</option>
              <option value="Cricket">Cricket</option>
              <option value="Athletics">Athletics</option>
              <option value="Wrestling">Wrestling</option>
              <option value="Swimming">Swimming</option>
              <option value="Hockey">Hockey</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
            <select
              value={filters.region}
              onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
            >
              <option value="all">All Regions</option>
              <option value="Haryana">Haryana</option>
              <option value="Kerala">Kerala</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Disability Status</label>
            <select
              value={filters.disability}
              onChange={(e) => setFilters(prev => ({ ...prev, disability: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
            >
              <option value="all">All Athletes</option>
              <option value="enabled">Enabled Athletes</option>
              <option value="disabled">Athletes with Disabilities</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md p-2 border border-[#E0E4E9]">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'athletes', label: 'Athlete Stats', icon: '🏃‍♂️' },
            { id: 'fairness', label: 'Fairness Reports', icon: '⚖️' },
            { id: 'injuries', label: 'Injury Trends', icon: '🏥' },
            { id: 'allocations', label: 'Allocations', icon: '💰' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#182031] to-[#020817] text-white shadow"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {/* Overview Tab */}
      {activeTab === 'overview' && athleteStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-[#182031] to-[#020817] rounded-xl p-6 text-white">
            <h4 className="text-sm opacity-80 mb-2">Total Athletes</h4>
            <p className="text-3xl font-bold">{athleteStats.totalAthletes.toLocaleString('en-IN')}</p>
            <p className="text-xs opacity-70 mt-1">Registered athletes</p>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
            <h4 className="text-sm opacity-80 mb-2">Active Athletes</h4>
            <p className="text-3xl font-bold">{athleteStats.activeAthletes.toLocaleString('en-IN')}</p>
            <p className="text-xs opacity-70 mt-1">Currently active</p>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h4 className="text-sm opacity-80 mb-2">New Registrations</h4>
            <p className="text-3xl font-bold">{athleteStats.newRegistrations}</p>
            <p className="text-xs opacity-70 mt-1">Last 6 months</p>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
            <h4 className="text-sm opacity-80 mb-2">With Disabilities</h4>
            <p className="text-3xl font-bold">{athleteStats.byDisability.disabled}</p>
            <p className="text-xs opacity-70 mt-1">{((athleteStats.byDisability.disabled / athleteStats.totalAthletes) * 100).toFixed(1)}% of total</p>
          </div>
        </div>
      )}

      {/* Athletes Tab */}
      {activeTab === 'athletes' && athleteStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Distribution */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Gender Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Male', value: athleteStats.byGender.male },
                      { name: 'Female', value: athleteStats.byGender.female },
                      { name: 'Other', value: athleteStats.byGender.other }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Disability Status */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Disability Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { category: 'Enabled', count: athleteStats.byDisability.enabled },
                  { category: 'Disabled', count: athleteStats.byDisability.disabled }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#182031" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sports Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Athletes by Sport</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(athleteStats.bySport).map(([sport, count]) => ({ sport, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sport" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#182031" name="Athletes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Fairness Reports Tab */}
      {activeTab === 'fairness' && (
        <div className="space-y-6">
          {/* Fairness Scores by Region */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Fairness Index by Region</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fairnessReports}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgFairnessScore" fill="#182031" name="Avg Fairness Score" />
                <Bar dataKey="totalApplications" fill="#6B7280" name="Total Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fairness Reports Table */}
          <div className="bg-white rounded-xl shadow-md border border-[#E0E4E9] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-slate-800">Detailed Fairness Reports</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fairness Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ST %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SC %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OBC %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Women %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rural %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fairnessReports.map((report, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.region}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.totalApplications}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.avgFairnessScore.toFixed(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.stPercentage.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.scPercentage.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.obcPercentage.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.womenPercentage.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.ruralPercentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Injury Trends Tab */}
      {activeTab === 'injuries' && (
        <div className="space-y-6">
          {/* Injury Trends Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Monthly Injury Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={injuryTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="injuries" stroke="#DC2626" name="New Injuries" strokeWidth={2} />
                <Line type="monotone" dataKey="recoveries" stroke="#059669" name="Recoveries" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Injury Severity Breakdown */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Injury Severity Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={injuryTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="severity.minor" stackId="1" stroke="#FCD34D" fill="#FCD34D" name="Minor" />
                <Area type="monotone" dataKey="severity.moderate" stackId="1" stroke="#F97316" fill="#F97316" name="Moderate" />
                <Area type="monotone" dataKey="severity.severe" stackId="1" stroke="#DC2626" fill="#DC2626" name="Severe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Allocations Tab */}
      {activeTab === 'allocations' && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Opportunity Allocations</h3>
          <p className="text-gray-600 mb-4">This section shows scholarship and opportunity allocation details.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Total Budget</h4>
              <p className="text-2xl font-bold text-blue-900">₹158.8 Cr</p>
              <p className="text-sm text-blue-600">FY 2024-25</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Allocated</h4>
              <p className="text-2xl font-bold text-green-900">₹142.3 Cr</p>
              <p className="text-sm text-green-600">89.6% utilized</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Remaining</h4>
              <p className="text-2xl font-bold text-orange-900">₹16.5 Cr</p>
              <p className="text-sm text-orange-600">Available for Q3-Q4</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
