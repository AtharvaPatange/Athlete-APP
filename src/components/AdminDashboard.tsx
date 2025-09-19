"use client";
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { collection, getDocs, query, where, orderBy, limit, addDoc, Timestamp } from "firebase/firestore";
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
  byCategory: { [key: string]: number };
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

// Scholarship Management Form Component
const ScholarshipManagementForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'scholarship', // scholarship, sponsorship, government_scheme
    amount: '',
    currency: 'INR',
    deadline: '',
    provider: {
      name: '',
      type: 'government', // government, private, ngo, corporate
      contact: {
        email: '',
        phone: '',
        website: ''
      }
    },
    eligibility: {
      minAge: '',
      maxAge: '',
      sports: [] as string[],
      achievements: [] as string[],
      academicRequirements: '',
      incomeRequirements: '',
      residencyRequirements: ''
    },
    benefits: {
      amount: '',
      duration: '',
      additionalBenefits: [] as string[]
    },
    applicationProcess: {
      documentsRequired: [] as string[],
      selectionCriteria: '',
      contactInfo: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const scholarshipTypes = [
    { value: 'scholarship', label: 'Scholarship' },
    { value: 'sponsorship', label: 'Sponsorship' },
    { value: 'government_scheme', label: 'Government Scheme' }
  ];

  const providerTypes = [
    { value: 'government', label: 'Government' },
    { value: 'private', label: 'Private Organization' },
    { value: 'ngo', label: 'NGO' },
    { value: 'corporate', label: 'Corporate' }
  ];

  const sportsOptions = [
    'Cricket', 'Football', 'Hockey', 'Badminton', 'Tennis', 'Wrestling', 'Boxing', 
    'Athletics', 'Swimming', 'Weightlifting', 'Shooting', 'Archery', 'Table Tennis',
    'Kabaddi', 'Volleyball', 'Basketball'
  ];

  const handleInputChange = (field: string, value: any, section?: string) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev as any)[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleNestedInputChange = (section: string, subsection: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [subsection]: {
          ...((prev as any)[section] as any)[subsection],
          [field]: value
        }
      }
    }));
  };

  const handleArrayInput = (section: string, field: string, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    handleInputChange(field, items, section);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Create the scholarship opportunity document matching ScholarshipOpportunity interface
      const opportunityData = {
        title: formData.title,
        description: formData.description,
        type: formData.type as 'scholarship' | 'government_scheme' | 'sponsorship',
        category: formData.eligibility.sports.length > 0 ? formData.eligibility.sports[0] : 'General Sports',
        eligibility: {
          minAge: parseInt(formData.eligibility.minAge) || 18,
          maxAge: parseInt(formData.eligibility.maxAge) || 35,
          regions: ['All India'], // Default to all India, can be made configurable
          sports: formData.eligibility.sports,
          incomeRequirement: formData.eligibility.incomeRequirements ? [formData.eligibility.incomeRequirements] : [],
          disabilityFlag: false, // Can be made configurable
          minPerformanceScore: 0
        },
        benefits: {
          amount: parseFloat(formData.benefits.amount) || 0,
          currency: 'INR',
          type: 'one_time' as const,
          additionalBenefits: formData.benefits.additionalBenefits
        },
        provider: {
          name: formData.provider.name,
          type: formData.provider.type as 'government' | 'private' | 'ngo' | 'corporate',
          contact: formData.provider.contact.email || formData.provider.contact.phone || 'Contact provider',
          website: formData.provider.contact.website
        },
        applicationDeadline: Timestamp.fromDate(new Date(formData.deadline)),
        maxApplicants: 100, // Default, can be made configurable
        currentApplicants: 0,
        fairnessWeighting: {
          ruralPreference: 20,
          incomeWeighting: 30,
          disabilityBonus: 25,
          regionPriority: ['Rural', 'Semi-Urban', 'Urban']
        },
        status: 'active' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'scholarships'), opportunityData);
      
      setMessage({ type: 'success', text: 'Scholarship opportunity created successfully!' });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'scholarship',
        amount: '',
        currency: 'INR',
        deadline: '',
        provider: {
          name: '',
          type: 'government',
          contact: { email: '', phone: '', website: '' }
        },
        eligibility: {
          minAge: '', maxAge: '', sports: [], achievements: [],
          academicRequirements: '', incomeRequirements: '', residencyRequirements: ''
        },
        benefits: { amount: '', duration: '', additionalBenefits: [] },
        applicationProcess: { documentsRequired: [], selectionCriteria: '', contactInfo: '' }
      });

    } catch (error) {
      console.error('Error creating scholarship:', error);
      setMessage({ type: 'error', text: 'Failed to create scholarship. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Create New Scholarship Opportunity</h3>
        
        {message && (
          <div className={`p-4 rounded-lg mb-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="e.g., National Sports Scholarship 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {scholarshipTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Detailed description of the opportunity..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
              <input
                type="number"
                required
                value={formData.benefits.amount}
                onChange={(e) => handleInputChange('amount', e.target.value, 'benefits')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="e.g., 50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline *</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          {/* Provider Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-slate-800 mb-4">Provider Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider Name *</label>
                <input
                  type="text"
                  required
                  value={formData.provider.name}
                  onChange={(e) => handleInputChange('name', e.target.value, 'provider')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="e.g., Ministry of Sports"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider Type *</label>
                <select
                  required
                  value={formData.provider.type}
                  onChange={(e) => handleInputChange('type', e.target.value, 'provider')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {providerTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.provider.contact.email}
                  onChange={(e) => handleNestedInputChange('provider', 'contact', 'email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="contact@provider.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.provider.contact.website}
                  onChange={(e) => handleNestedInputChange('provider', 'contact', 'website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="https://provider.com"
                />
              </div>
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-slate-800 mb-4">Eligibility Criteria</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Age</label>
                <input
                  type="number"
                  value={formData.eligibility.minAge}
                  onChange={(e) => handleInputChange('minAge', e.target.value, 'eligibility')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="18"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Age</label>
                <input
                  type="number"
                  value={formData.eligibility.maxAge}
                  onChange={(e) => handleInputChange('maxAge', e.target.value, 'eligibility')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="25"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Sports (comma-separated)</label>
                <input
                  type="text"
                  value={formData.eligibility.sports.join(', ')}
                  onChange={(e) => handleArrayInput('eligibility', 'sports', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Cricket, Football, Hockey"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Requirements</label>
                <input
                  type="text"
                  value={formData.eligibility.academicRequirements}
                  onChange={(e) => handleInputChange('academicRequirements', e.target.value, 'eligibility')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Minimum 60% in 12th grade"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setFormData({
                title: '', description: '', type: 'scholarship', amount: '', currency: 'INR', deadline: '',
                provider: { name: '', type: 'government', contact: { email: '', phone: '', website: '' } },
                eligibility: { minAge: '', maxAge: '', sports: [], achievements: [], academicRequirements: '', incomeRequirements: '', residencyRequirements: '' },
                benefits: { amount: '', duration: '', additionalBenefits: [] },
                applicationProcess: { documentsRequired: [], selectionCriteria: '', contactInfo: '' }
              })}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-md font-medium ${
                loading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              {loading ? 'Creating...' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminDashboard({ adminId, adminRole }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'athletes' | 'fairness' | 'injuries' | 'allocations' | 'scholarships'>('overview');
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
        byCategory: {},
        byRegion: {},
        byGender: {
          male: athletes.filter((a: any) => a.gender === 'Male').length,
          female: athletes.filter((a: any) => a.gender === 'Female').length,
          other: athletes.filter((a: any) => a.gender === 'Other').length
        }
      };

      // Count by category and region
      athletes.forEach((athlete: any) => {
        // Use category or map from sport for backward compatibility
        let category = athlete.category;
        if (!category && athlete.sport) {
          // Comprehensive mapping of exercises to the 4 main categories
          const sportToCategory: Record<string, string> = {
            'Running': 'cardio',
            'Cycling': 'cardio', 
            'Swimming': 'cardio',
            'Jogging': 'cardio',
            'Treadmill': 'cardio',
            'Basketball': 'cardio',
            'Soccer': 'cardio',
            'Push-ups': 'strength',
            'Squats': 'strength',
            'Pull-ups': 'strength',
            'Deadlifts': 'strength',
            'Bench Press': 'strength',
            'Planks': 'strength',
            'Lunges': 'strength',
            'Burpees': 'strength',
            'Weightlifting': 'strength',
            'Powerlifting': 'strength',
            'Yoga': 'flexibility',
            'Stretching': 'flexibility',
            'Balance Training': 'flexibility',
            'Mobility Work': 'flexibility',
            'Pilates': 'flexibility',
            'Agility Drills': 'coordination',
            'Ball Handling': 'coordination',
            'Throwing Practice': 'coordination',
            'Catching Drills': 'coordination',
            'Ladder Drills': 'coordination',
            'Cone Drills': 'coordination',
            'Reaction Training': 'coordination',
            'Gymnastics': 'coordination',
            'Martial Arts': 'coordination'
          };
          category = sportToCategory[athlete.sport] || 'cardio'; // default fallback
        }
        
        if (category) {
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
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
            { id: 'allocations', label: 'Allocations', icon: '💰' },
            { id: 'scholarships', label: 'Scholarships', icon: '🎓' }
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

          {/* Exercise Categories Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Athletes by Exercise Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(athleteStats.byCategory).map(([category, count]) => {
                const categoryDisplayNames: Record<string, string> = {
                  'cardio': 'Cardio',
                  'strength': 'Strength',
                  'flexibility': 'Flexibility & Balance',
                  'coordination': 'Coordination'
                };
                return { 
                  category: categoryDisplayNames[category] || category, 
                  count 
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
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

      {/* Scholarships Tab */}
      {activeTab === 'scholarships' && (
        <ScholarshipManagementForm />
      )}
    </div>
  );
}
