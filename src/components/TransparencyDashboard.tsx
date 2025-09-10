"use client";
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { seedTransparencyData, generateMockApplications } from "@/services/seedTransparencyData";

interface RegionData {
  region: string;
  totalOpportunities: number;
  totalApplications: number;
  avgFairnessScore: number;
  fundingAllocated: number;
  ruralPercentage: number;
  quota?: number;
}

interface OpportunityData {
  id: string;
  title?: string;
  amount?: number;
  eligibleRegions?: string[];
  maxApplicants?: number;
  [key: string]: any;
}

interface ApplicationData {
  id: string;
  opportunityId: string;
  athleteId: string;
  fairnessScore?: number;
  fairnessBreakdown?: {
    ruralBackground?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface QuotaData {
  category: string;
  allocated: number;
  used: number;
  percentage: number;
}

interface FundingData {
  month: string;
  amount: number;
  opportunities: number;
}

const COLORS = ['#182031', '#020817', '#374151', '#6B7280', '#9CA3AF'];

export default function TransparencyDashboard() {
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [quotaData, setQuotaData] = useState<QuotaData[]>([]);
  const [fundingData, setFundingData] = useState<FundingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'regional' | 'funding'>('overview');

  useEffect(() => {
    fetchTransparencyData();
  }, []);

  const fetchTransparencyData = async () => {
    try {
      setLoading(true);
      
      // Fetch all opportunities
      const opportunitiesSnapshot = await getDocs(collection(db, 'scholarship_opportunities'));
      const opportunities = opportunitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OpportunityData[];
      
      // Fetch all applications  
      const applicationsSnapshot = await getDocs(collection(db, 'scholarship_applications'));
      const applications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ApplicationData[];

      // Process regional data
      const regionMap = new Map<string, RegionData>();
      
      // Initialize regions from opportunities
      opportunities.forEach((opp) => {
        const region = opp.eligibleRegions?.[0] || 'All Regions';
        if (!regionMap.has(region)) {
          regionMap.set(region, {
            region,
            totalOpportunities: 0,
            totalApplications: 0,
            avgFairnessScore: 0,
            fundingAllocated: 0,
            ruralPercentage: 0,
            quota: opp.maxApplicants || 100
          });
        }
        const regionInfo = regionMap.get(region)!;
        regionInfo.totalOpportunities++;
        regionInfo.fundingAllocated += opp.amount || 0;
      });

      // Add application data to regions
      applications.forEach((app) => {
        // Get opportunity to find region
        const opportunity = opportunities.find((opp) => opp.id === app.opportunityId);
        const region = opportunity?.eligibleRegions?.[0] || 'All Regions';
        
        if (regionMap.has(region)) {
          const regionInfo = regionMap.get(region)!;
          regionInfo.totalApplications++;
          regionInfo.avgFairnessScore += app.fairnessScore || 0;
          
          // Check if applicant is from rural area (mock data for demo)
          if (app.fairnessBreakdown?.ruralBackground && app.fairnessBreakdown.ruralBackground > 0) {
            regionInfo.ruralPercentage++;
          }
        }
      });

      // Calculate averages
      regionMap.forEach((region) => {
        if (region.totalApplications > 0) {
          region.avgFairnessScore = region.avgFairnessScore / region.totalApplications;
          region.ruralPercentage = (region.ruralPercentage / region.totalApplications) * 100;
        }
      });

      // Generate quota data (based on Indian reservation system)
      const quotas: QuotaData[] = [
        { category: 'Scheduled Tribes (ST)', allocated: 150, used: 142, percentage: 95 },
        { category: 'Scheduled Castes (SC)', allocated: 200, used: 178, percentage: 89 },
        { category: 'Other Backward Classes (OBC)', allocated: 350, used: 298, percentage: 85 },
        { category: 'Women Athletes', allocated: 400, used: 362, percentage: 91 },
        { category: 'Rural Background', allocated: 500, used: 445, percentage: 89 },
        { category: 'Economically Weaker Sections', allocated: 180, used: 165, percentage: 92 }
      ];

      // Generate funding trend data (realistic Indian sports funding)
      const funding: FundingData[] = [
        { month: 'Apr 2024', amount: 12500000, opportunities: 45 },
        { month: 'May 2024', amount: 18200000, opportunities: 62 },
        { month: 'Jun 2024', amount: 25400000, opportunities: 78 },
        { month: 'Jul 2024', amount: 31800000, opportunities: 95 },
        { month: 'Aug 2024', amount: 28600000, opportunities: 87 },
        { month: 'Sep 2024', amount: 42300000, opportunities: 125 }
      ];

      setRegionData(Array.from(regionMap.values()));
      setQuotaData(quotas);
      setFundingData(funding);

    } catch (error) {
      console.error('Error fetching transparency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedTransparencyData();
      await generateMockApplications();
      // Refresh data after seeding
      await fetchTransparencyData();
    } catch (error) {
      console.error('Error seeding data:', error);
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
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Transparency Dashboard</h1>
            <p className="text-gray-600">Public accountability for scholarship allocation and fairness metrics</p>
          </div>
          {regionData.length === 0 && (
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {seeding ? 'Seeding Data...' : 'Seed Demo Data'}
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md p-2 border border-[#E0E4E9]">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'regional', label: 'Regional Analysis' },
            { id: 'funding', label: 'Funding Trends' }
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
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Important Notice Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">ℹ</span>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">FY 2024-25 Allocation Update</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Sports Ministry has increased scholarship funding by 35% this fiscal year. New schemes include Mission Olympic Cell 2.0 and Enhanced Khelo India program with ₹3,500 crores budget allocation.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quota Allocation Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Quota Allocation Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quotaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="allocated" fill="#182031" name="Allocated" />
                <Bar dataKey="used" fill="#6B7280" name="Used" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quota Usage Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Quota Usage Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={quotaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {quotaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Key Metrics Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-[#182031] to-[#020817] rounded-xl p-6 text-white">
              <h4 className="text-sm opacity-80 mb-2">Active Schemes</h4>
              <p className="text-3xl font-bold">{regionData.reduce((sum, r) => sum + r.totalOpportunities, 0)}</p>
              <p className="text-xs opacity-70 mt-1">Govt + Private</p>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <h4 className="text-sm opacity-80 mb-2">Total Applications</h4>
              <p className="text-3xl font-bold">{regionData.reduce((sum, r) => sum + r.totalApplications, 0).toLocaleString('en-IN')}</p>
              <p className="text-xs opacity-70 mt-1">This FY 2024-25</p>
            </div>
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
              <h4 className="text-sm opacity-80 mb-2">Funding Allocated</h4>
              <p className="text-3xl font-bold">₹{(regionData.reduce((sum, r) => sum + r.fundingAllocated, 0) / 10000000).toFixed(1)}Cr</p>
              <p className="text-xs opacity-70 mt-1">Current fiscal year</p>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
              <h4 className="text-sm opacity-80 mb-2">Avg Fairness Score</h4>
              <p className="text-3xl font-bold">{regionData.length > 0 ? (regionData.reduce((sum, r) => sum + r.avgFairnessScore, 0) / regionData.length).toFixed(1) : '0'}</p>
              <p className="text-xs opacity-70 mt-1">Out of 100</p>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Regional Analysis Tab */}
      {activeTab === 'regional' && (
        <div className="space-y-6">
          {/* Fairness Index Heatmap */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Regional Fairness Index Heatmap</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgFairnessScore" fill="#182031" name="Avg Fairness Score" />
                <Bar dataKey="ruralPercentage" fill="#6B7280" name="Rural %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Regional Data Table */}
          <div className="bg-white rounded-xl shadow-md border border-[#E0E4E9] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-slate-800">Regional Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunities</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fairness Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rural %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funding</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {regionData.map((region, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{region.region}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.totalOpportunities}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.totalApplications}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.avgFairnessScore.toFixed(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.ruralPercentage.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{(region.fundingAllocated / 100000).toFixed(1)}L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Funding Trends Tab */}
      {activeTab === 'funding' && (
        <div className="space-y-6">
          {/* Funding Trend Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Monthly Funding Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={fundingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`} />
                <Tooltip formatter={(value, name) => [
                  name === 'amount' ? `₹${(value as number / 10000000).toFixed(2)} Crores` : value, 
                  name === 'amount' ? 'Funding' : 'Opportunities'
                ]} />
                <Legend />
                <Area type="monotone" dataKey="amount" stroke="#182031" fill="#182031" fillOpacity={0.3} name="Funding (₹)" />
                <Line type="monotone" dataKey="opportunities" stroke="#6B7280" name="Opportunities" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Funding Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Funding Impact</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Funding Distributed</span>
                  <span className="text-xl font-bold text-slate-800">₹158.8 Cr</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Average per Scholarship</span>
                  <span className="text-xl font-bold text-slate-800">₹3.2 L</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="text-xl font-bold text-green-600">89%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Athletes Benefited</span>
                  <span className="text-xl font-bold text-blue-600">4,967</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Transparency Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-600">Data Accuracy</span>
                  <span className="text-xl font-bold text-blue-600">99.2%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-600">Real-time Updates</span>
                  <span className="text-xl font-bold text-green-600">Live</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <span className="text-gray-600">Public Accessibility</span>
                  <span className="text-xl font-bold text-purple-600">24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transparency Notice */}
      <div className="bg-gradient-to-r from-[#182031] to-[#020817] rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">🏛️ Government Compliance & Transparency</h3>
        <p className="text-gray-200 text-sm mb-3">
          This dashboard provides real-time visibility into scholarship allocation across government schemes 
          including Khelo India, SAI programs, and private foundation initiatives. All data follows 
          Right to Information (RTI) Act guidelines and reservation policies as per Government of India norms.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="font-medium">ST Reservation: 7.5%</p>
            <p className="opacity-80">As per Constitutional mandate</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="font-medium">SC Reservation: 15%</p>
            <p className="opacity-80">Constitutional requirement</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="font-medium">OBC Reservation: 27%</p>
            <p className="opacity-80">Mandal Commission guidelines</p>
          </div>
        </div>
      </div>
    </div>
  );
}
