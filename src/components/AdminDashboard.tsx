"use client";
import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { collection, getDocs, query, where, orderBy, limit, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { seedAdminUsers, seedAdminDemoData } from "@/services/seedAdminData";

// Icons (using simple Unicode icons for now)
const DashboardIcon = () => <span className="text-xl">📊</span>;
const UsersIcon = () => <span className="text-xl">👥</span>;
const ContentIcon = () => <span className="text-xl">📄</span>;
const AnalyticsIcon = () => <span className="text-xl">📈</span>;
const AllocationsIcon = () => <span className="text-xl">💰</span>;
const ScholarshipsIcon = () => <span className="text-xl">🎓</span>;
const SearchIcon = () => <span className="text-xl">🔍</span>;
const BellIcon = () => <span className="text-xl">🔔</span>;
const ProfileIcon = () => <span className="text-xl">👤</span>;
const MenuIcon = () => <span className="text-xl">☰</span>;
const CloseIcon = () => <span className="text-xl">✕</span>;

interface AdminDashboardProps {
  adminId: string;
  adminRole: string;
}

// Theme context and types
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

// Custom hook for theme
const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

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

// Custom Color Palette - Byzantium/Violet Theme
const COLORS = {
  platinum: '#eaeaeaff',      // Light background/text
  byzantium: '#893168ff',     // Primary accent color
  violetJtc: '#4a1942ff',     // Secondary accent
  darkPurple: '#2e1c2bff',    // Dark background
  black: '#050404ff',         // Darkest text/backgrounds
  
  // Light mode colors
  light: {
    background: '#eaeaeaff',
    surface: '#ffffff',
    text: '#050404ff',
    textSecondary: '#4a1942ff',
    accent: '#893168ff',
    accentSecondary: '#4a1942ff',
    border: '#eaeaeaff',
    hover: '#f5f5f5'
  },
  
  // Dark mode colors
  dark: {
    background: '#050404ff',
    surface: '#2e1c2bff',
    text: '#eaeaeaff',
    textSecondary: '#893168ff',
    accent: '#893168ff',
    accentSecondary: '#4a1942ff',
    border: '#4a1942ff',
    hover: '#2e1c2bff'
  }
};

// Chart colors using our custom palette
const CHART_COLORS = [
  COLORS.byzantium,
  COLORS.violetJtc,
  COLORS.darkPurple,
  '#893168',
  '#4a1942',
  '#2e1c2b'
];

// Sidebar Component
const Sidebar: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  activeTab: string; 
  setActiveTab: (tab: 'overview' | 'athletes' | 'fairness' | 'injuries' | 'allocations' | 'scholarships') => void; 
  isDark: boolean 
}> = ({ 
  isOpen, onClose, activeTab, setActiveTab, isDark 
}) => {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: DashboardIcon },
    { id: 'athletes', label: 'Users', icon: UsersIcon },
    { id: 'fairness', label: 'Content', icon: ContentIcon },
    { id: 'injuries', label: 'Analytics', icon: AnalyticsIcon },
    { id: 'allocations', label: 'Allocations', icon: AllocationsIcon },
    { id: 'scholarships', label: 'Scholarships', icon: ScholarshipsIcon }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          shadow-xl lg:shadow-none
        `}
        style={{
          backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
          borderRight: `1px solid ${isDark ? COLORS.dark.border : COLORS.light.border}`
        }}
      >
        <div 
          className="flex items-center justify-between p-6"
          style={{ borderBottom: `1px solid ${isDark ? COLORS.dark.border : COLORS.light.border}` }}
        >
          <h2 
            className="text-xl font-bold"
            style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
          >
            Admin Panel
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md transition-colors duration-200"
            style={{
              backgroundColor: 'transparent',
              color: isDark ? COLORS.dark.text : COLORS.light.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.hover : COLORS.light.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <CloseIcon />
          </button>
        </div>
        
        <nav className="mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as 'overview' | 'athletes' | 'fairness' | 'injuries' | 'allocations' | 'scholarships');
                  onClose();
                }}
                className="w-full flex items-center px-6 py-3 text-left transition-colors duration-200"
                style={{
                  backgroundColor: isActive 
                    ? (isDark ? COLORS.dark.accent : COLORS.light.accent)
                    : 'transparent',
                  color: isActive 
                    ? COLORS.platinum
                    : (isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary),
                  borderRight: isActive ? `3px solid ${COLORS.byzantium}` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.hover : COLORS.light.hover;
                    e.currentTarget.style.color = isDark ? COLORS.dark.text : COLORS.light.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary;
                  }
                }}
              >
                <Icon />
                <span className="ml-3 font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

// Notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

// Navbar Component
const Navbar: React.FC<{ 
  isDark: boolean; 
  toggleTheme: () => void; 
  onMenuClick: () => void;
  notifications: Notification[];
}> = ({ isDark, toggleTheme, onMenuClick, notifications }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header 
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b shadow-sm"
      style={{
        backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
        borderBottomColor: isDark ? COLORS.dark.border : COLORS.light.border
      }}
    >
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md transition-colors duration-200"
          style={{
            backgroundColor: 'transparent',
            color: isDark ? COLORS.dark.text : COLORS.light.text
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.hover : COLORS.light.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <MenuIcon />
        </button>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 rounded-lg border focus:outline-none transition-colors duration-200"
            style={{
              backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background,
              borderColor: isDark ? COLORS.dark.border : COLORS.light.border,
              color: isDark ? COLORS.dark.text : COLORS.light.text
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.byzantium;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.byzantium}20`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = isDark ? COLORS.dark.border : COLORS.light.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors duration-200"
          style={{
            backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background,
            color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary,
            border: `1px solid ${isDark ? COLORS.dark.border : COLORS.light.border}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.hover : COLORS.light.hover;
            e.currentTarget.style.color = isDark ? COLORS.dark.text : COLORS.light.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.background : COLORS.light.background;
            e.currentTarget.style.color = isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary;
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background,
              color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary,
              border: `1px solid ${isDark ? COLORS.dark.border : COLORS.light.border}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.hover : COLORS.light.hover;
              e.currentTarget.style.color = isDark ? COLORS.dark.text : COLORS.light.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.background : COLORS.light.background;
              e.currentTarget.style.color = isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary;
            }}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                style={{ backgroundColor: COLORS.byzantium }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg border z-50"
              style={{
                backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
                borderColor: isDark ? COLORS.dark.border : COLORS.light.border
              }}
            >
              <div 
                className="p-4 border-b"
                style={{ borderBottomColor: isDark ? COLORS.dark.border : COLORS.light.border }}
              >
                <h3 
                  className="font-semibold"
                  style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                >
                  Notifications
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4">
                    <p 
                      className="text-sm"
                      style={{ color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }}
                    >
                      No notifications
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b transition-colors duration-200"
                      style={{
                        borderBottomColor: isDark ? COLORS.dark.border : COLORS.light.border,
                        backgroundColor: !notification.read 
                          ? (isDark ? `${COLORS.byzantium}20` : `${COLORS.byzantium}10`)
                          : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.hover : COLORS.light.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = !notification.read 
                          ? (isDark ? `${COLORS.byzantium}20` : `${COLORS.byzantium}10`)
                          : 'transparent';
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-2 h-2 rounded-full mt-2"
                          style={{
                            backgroundColor: notification.type === 'success' ? COLORS.violetJtc :
                            notification.type === 'warning' ? '#f59e0b' :
                            notification.type === 'error' ? '#ef4444' :
                            COLORS.byzantium
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-sm font-medium"
                            style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                          >
                            {notification.title}
                          </p>
                          <p 
                            className="text-sm"
                            style={{ color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }}
                          >
                            {notification.message}
                          </p>
                          <p 
                            className="text-xs mt-1"
                            style={{ color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }}
                          >
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background,
              color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary,
              border: `1px solid ${isDark ? COLORS.dark.border : COLORS.light.border}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.hover : COLORS.light.hover;
              e.currentTarget.style.color = isDark ? COLORS.dark.text : COLORS.light.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.background : COLORS.light.background;
              e.currentTarget.style.color = isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary;
            }}
          >
            <ProfileIcon />
            <span className="hidden md:block">Admin User</span>
            <span className="text-sm">▼</span>
          </button>
          
          {showProfile && (
            <div 
              className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50"
              style={{
                backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
                borderColor: isDark ? COLORS.dark.border : COLORS.light.border
              }}
            >
              <div className="py-2">
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm transition-colors duration-200"
                  style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.hover : COLORS.light.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Profile Settings
                </a>
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm transition-colors duration-200"
                  style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.hover : COLORS.light.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Account Settings
                </a>
                <hr 
                  className="my-2"
                  style={{ borderColor: isDark ? COLORS.dark.border : COLORS.light.border }}
                />
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm transition-colors duration-200"
                  style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? COLORS.dark.hover : COLORS.light.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Sign Out
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Scholarship Management Form Component
const ScholarshipManagementForm: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  // Helper function for input styling
  const getInputClasses = () => `
    w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
    ${isDark 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
    }
  `;

  const getLabelClasses = () => `
    block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}
  `;

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
      <div className={`rounded-xl shadow-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New Scholarship Opportunity</h3>
        
        {message && (
          <div className={`p-4 rounded-lg mb-4 ${
            message.type === 'success' 
              ? isDark 
                ? 'bg-green-900 text-green-200 border border-green-700' 
                : 'bg-green-50 text-green-800 border border-green-200'
              : isDark
                ? 'bg-red-900 text-red-200 border border-red-700'
            : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={getLabelClasses()}>Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={getInputClasses()}
                placeholder="e.g., National Sports Scholarship 2024"
              />
            </div>

            <div>
              <label className={getLabelClasses()}>Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={getInputClasses()}
              >
                {scholarshipTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={getLabelClasses()}>Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={getInputClasses()}
                placeholder="Detailed description of the opportunity..."
              />
            </div>

            <div>
              <label className={getLabelClasses()}>Amount (₹) *</label>
              <input
                type="number"
                required
                value={formData.benefits.amount}
                onChange={(e) => handleInputChange('amount', e.target.value, 'benefits')}
                className={getInputClasses()}
                placeholder="e.g., 50000"
              />
            </div>

            <div>
              <label className={getLabelClasses()}>Application Deadline *</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className={getInputClasses()}
              />
            </div>
          </div>

          {/* Provider Information */}
          <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Provider Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={getLabelClasses()}>Provider Name *</label>
                <input
                  type="text"
                  required
                  value={formData.provider.name}
                  onChange={(e) => handleInputChange('name', e.target.value, 'provider')}
                  className={getInputClasses()}
                  placeholder="e.g., Ministry of Sports"
                />
              </div>

              <div>
                <label className={getLabelClasses()}>Provider Type *</label>
                <select
                  required
                  value={formData.provider.type}
                  onChange={(e) => handleInputChange('type', e.target.value, 'provider')}
                  className={getInputClasses()}
                >
                  {providerTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={getLabelClasses()}>Contact Email</label>
                <input
                  type="email"
                  value={formData.provider.contact.email}
                  onChange={(e) => handleNestedInputChange('provider', 'contact', 'email', e.target.value)}
                  className={getInputClasses()}
                  placeholder="contact@provider.com"
                />
              </div>

              <div>
                <label className={getLabelClasses()}>Website</label>
                <input
                  type="url"
                  value={formData.provider.contact.website}
                  onChange={(e) => handleNestedInputChange('provider', 'contact', 'website', e.target.value)}
                  className={getInputClasses()}
                  placeholder="https://provider.com"
                />
              </div>
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className={`p-6 rounded-lg ${isDark ? 'bg-blue-900' : 'bg-blue-50'}`}>
            <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Eligibility Criteria</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={getLabelClasses()}>Min Age</label>
                <input
                  type="number"
                  value={formData.eligibility.minAge}
                  onChange={(e) => handleInputChange('minAge', e.target.value, 'eligibility')}
                  className={getInputClasses()}
                  placeholder="18"
                />
              </div>

              <div>
                <label className={getLabelClasses()}>Max Age</label>
                <input
                  type="number"
                  value={formData.eligibility.maxAge}
                  onChange={(e) => handleInputChange('maxAge', e.target.value, 'eligibility')}
                  className={getInputClasses()}
                  placeholder="25"
                />
              </div>

              <div className="md:col-span-2">
                <label className={getLabelClasses()}>Eligible Sports (comma-separated)</label>
                <input
                  type="text"
                  value={formData.eligibility.sports.join(', ')}
                  onChange={(e) => handleArrayInput('eligibility', 'sports', e.target.value)}
                  className={getInputClasses()}
                  placeholder="Cricket, Football, Hockey"
                />
              </div>

              <div className="md:col-span-2">
                <label className={getLabelClasses()}>Academic Requirements</label>
                <input
                  type="text"
                  value={formData.eligibility.academicRequirements}
                  onChange={(e) => handleInputChange('academicRequirements', e.target.value, 'eligibility')}
                  className={getInputClasses()}
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
              className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-200 border-2
                ${isDark 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }
              `}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`
                px-8 py-3 rounded-lg font-medium transition-all duration-200
                ${loading 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }
              `}
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
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Athlete Registration',
      message: '5 new athletes registered in the last hour',
      type: 'info',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false
    },
    {
      id: '2',
      title: 'System Update',
      message: 'Dashboard has been updated with new features',
      type: 'success',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false
    }
  ]);
  const [filters, setFilters] = useState({
    sport: 'all',
    region: 'all',
    disability: 'all',
    timeRange: '6months'
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

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
      <div className={`flex items-center justify-center h-64 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`w-8 h-8 border-4 ${isDark ? 'border-blue-400' : 'border-blue-600'} border-t-transparent rounded-full animate-spin`}></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background
      }}
    >
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isDark={isDark}
        />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Navbar */}
          <Navbar 
            isDark={isDark} 
            toggleTheme={toggleTheme} 
            onMenuClick={() => setSidebarOpen(true)}
            notifications={notifications}
          />
          
          {/* Dashboard Content */}
          <main className="p-6 space-y-6">
      {/* Header with Export Options */}
            <div 
              className="rounded-xl shadow-lg p-6 border"
              style={{
                backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
                borderColor: isDark ? COLORS.dark.border : COLORS.light.border
              }}
            >
        <div className="flex justify-between items-center">
          <div>
                  <h1 
                    className="text-3xl font-bold mb-2"
                    style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                  >
                    Admin Dashboard
                  </h1>
                  <p style={{ color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }}>
                    Sports Ministry Administration Console
                  </p>
          </div>
                <div className="flex space-x-3">
            <button
              onClick={() => exportData('csv')}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    style={{ backgroundColor: COLORS.violetJtc, color: COLORS.platinum }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.darkPurple;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.violetJtc;
                    }}
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => exportData('pdf')}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    style={{ backgroundColor: COLORS.byzantium, color: COLORS.platinum }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.violetJtc;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.byzantium;
                    }}
            >
              📄 Export PDF
            </button>
            {(!athleteStats || athleteStats.totalAthletes === 0) && (
              <button
                onClick={handleSeedAdminData}
                disabled={seeding}
                      className="px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                      style={{ 
                        backgroundColor: seeding ? COLORS.violetJtc : COLORS.darkPurple, 
                        color: COLORS.platinum 
                      }}
                      onMouseEnter={(e) => {
                        if (!seeding) {
                          e.currentTarget.style.backgroundColor = COLORS.black;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!seeding) {
                          e.currentTarget.style.backgroundColor = COLORS.darkPurple;
                        }
                      }}
              >
                {seeding ? 'Seeding...' : '🌱 Seed Admin Data'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
            <div className={`rounded-xl shadow-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Sport</label>
            <select
              value={filters.sport}
              onChange={(e) => setFilters(prev => ({ ...prev, sport: e.target.value }))}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                      }
                    `}
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
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Region</label>
            <select
              value={filters.region}
              onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                      }
                    `}
            >
              <option value="all">All Regions</option>
              <option value="Haryana">Haryana</option>
              <option value="Kerala">Kerala</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
            </select>
          </div>
          <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Disability Status</label>
            <select
              value={filters.disability}
              onChange={(e) => setFilters(prev => ({ ...prev, disability: e.target.value }))}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                      }
                    `}
            >
              <option value="all">All Athletes</option>
              <option value="enabled">Enabled Athletes</option>
              <option value="disabled">Athletes with Disabilities</option>
            </select>
          </div>
          <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                      }
                    `}
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {/* Overview Tab */}
      {activeTab === 'overview' && athleteStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div 
                  className="rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-200"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.byzantium}, ${COLORS.violetJtc})`,
                    color: COLORS.platinum
                  }}
                >
            <h4 className="text-sm opacity-80 mb-2">Total Athletes</h4>
            <p className="text-3xl font-bold">{athleteStats.totalAthletes.toLocaleString('en-IN')}</p>
            <p className="text-xs opacity-70 mt-1">Registered athletes</p>
          </div>
                <div 
                  className="rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-200"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.violetJtc}, ${COLORS.darkPurple})`,
                    color: COLORS.platinum
                  }}
                >
            <h4 className="text-sm opacity-80 mb-2">Active Athletes</h4>
            <p className="text-3xl font-bold">{athleteStats.activeAthletes.toLocaleString('en-IN')}</p>
            <p className="text-xs opacity-70 mt-1">Currently active</p>
          </div>
                <div 
                  className="rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-200"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.darkPurple}, ${COLORS.black})`,
                    color: COLORS.platinum
                  }}
                >
            <h4 className="text-sm opacity-80 mb-2">New Registrations</h4>
            <p className="text-3xl font-bold">{athleteStats.newRegistrations}</p>
            <p className="text-xs opacity-70 mt-1">Last 6 months</p>
          </div>
                <div 
                  className="rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-200"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.black}, ${COLORS.byzantium})`,
                    color: COLORS.platinum
                  }}
                >
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
                  {/* Gender Distribution Pie Chart */}
                  <div 
                    className="rounded-xl shadow-lg p-6 border"
                    style={{
                      backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
                      borderColor: isDark ? COLORS.dark.border : COLORS.light.border
                    }}
                  >
                    <h3 
                      className="text-xl font-semibold mb-4"
                      style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                    >
                      Gender Distribution
                    </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                            { name: 'Male', value: athleteStats.byGender.male, color: COLORS.byzantium },
                            { name: 'Female', value: athleteStats.byGender.female, color: COLORS.violetJtc },
                            { name: 'Other', value: athleteStats.byGender.other, color: COLORS.darkPurple }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(1)}%)`}
                          outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
                            border: `1px solid ${isDark ? COLORS.dark.border : COLORS.light.border}`,
                            borderRadius: '8px',
                            color: isDark ? COLORS.dark.text : COLORS.light.text
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            color: isDark ? COLORS.dark.text : COLORS.light.text,
                            fontSize: '14px'
                          }}
                        />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Disability Status */}
                  <div className={`rounded-xl shadow-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Disability Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { category: 'Enabled', count: athleteStats.byDisability.enabled },
                  { category: 'Disabled', count: athleteStats.byDisability.disabled }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                        <Bar dataKey="count" fill={COLORS.byzantium} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sports Distribution */}
                <div 
                  className="rounded-xl shadow-lg p-6 border"
                  style={{
                    backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
                    borderColor: isDark ? COLORS.dark.border : COLORS.light.border
                  }}
                >
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                  >
                    Athletes by Sport
                  </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(athleteStats.bySport).map(([sport, count]) => ({ sport, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sport" />
                <YAxis />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
                          border: `1px solid ${isDark ? COLORS.dark.border : COLORS.light.border}`,
                          borderRadius: '8px',
                          color: isDark ? COLORS.dark.text : COLORS.light.text
                        }}
                      />
                      <Legend 
                        wrapperStyle={{
                          color: isDark ? COLORS.dark.text : COLORS.light.text,
                          fontSize: '14px'
                        }}
                      />
                      <Bar dataKey="count" fill={COLORS.byzantium} name="Athletes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

                {/* Comprehensive Gender Analysis */}
                <div 
                  className="rounded-xl shadow-lg p-6 border"
                  style={{
                    backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
                    borderColor: isDark ? COLORS.dark.border : COLORS.light.border
                  }}
                >
                  <h3 
                    className="text-xl font-semibold mb-6"
                    style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                  >
                    Gender Distribution Analysis
                  </h3>
                  
                  {/* Gender Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div 
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: isDark ? `${COLORS.byzantium}20` : `${COLORS.byzantium}10`,
                        borderColor: isDark ? COLORS.byzantium : `${COLORS.byzantium}30`
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS.byzantium }}
                        />
                        <div>
                          <p 
                            className="text-sm font-medium"
                            style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                          >
                            Male Athletes
                          </p>
                          <p 
                            className="text-2xl font-bold"
                            style={{ color: COLORS.byzantium }}
                          >
                            {athleteStats.byGender.male}
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }}
                          >
                            {((athleteStats.byGender.male / athleteStats.totalAthletes) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: isDark ? `${COLORS.violetJtc}20` : `${COLORS.violetJtc}10`,
                        borderColor: isDark ? COLORS.violetJtc : `${COLORS.violetJtc}30`
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS.violetJtc }}
                        />
                        <div>
                          <p 
                            className="text-sm font-medium"
                            style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                          >
                            Female Athletes
                          </p>
                          <p 
                            className="text-2xl font-bold"
                            style={{ color: COLORS.violetJtc }}
                          >
                            {athleteStats.byGender.female}
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }}
                          >
                            {((athleteStats.byGender.female / athleteStats.totalAthletes) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: isDark ? `${COLORS.darkPurple}20` : `${COLORS.darkPurple}10`,
                        borderColor: isDark ? COLORS.darkPurple : `${COLORS.darkPurple}30`
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS.darkPurple }}
                        />
                        <div>
                          <p 
                            className="text-sm font-medium"
                            style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                          >
                            Other
                          </p>
                          <p 
                            className="text-2xl font-bold"
                            style={{ color: COLORS.darkPurple }}
                          >
                            {athleteStats.byGender.other}
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }}
                          >
                            {((athleteStats.byGender.other / athleteStats.totalAthletes) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gender Distribution Bar Chart */}
                  <div className="mb-6">
                    <h4 
                      className="text-lg font-semibold mb-4"
                      style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                    >
                      Gender Distribution by Numbers
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[
                        { gender: 'Male', count: athleteStats.byGender.male, percentage: ((athleteStats.byGender.male / athleteStats.totalAthletes) * 100).toFixed(1) },
                        { gender: 'Female', count: athleteStats.byGender.female, percentage: ((athleteStats.byGender.female / athleteStats.totalAthletes) * 100).toFixed(1) },
                        { gender: 'Other', count: athleteStats.byGender.other, percentage: ((athleteStats.byGender.other / athleteStats.totalAthletes) * 100).toFixed(1) }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="gender" 
                          tick={{ fill: isDark ? COLORS.dark.text : COLORS.light.text }}
                        />
                        <YAxis 
                          tick={{ fill: isDark ? COLORS.dark.text : COLORS.light.text }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
                            border: `1px solid ${isDark ? COLORS.dark.border : COLORS.light.border}`,
                            borderRadius: '8px',
                            color: isDark ? COLORS.dark.text : COLORS.light.text
                          }}
                          formatter={(value, name, props) => [
                            `${value} athletes (${props.payload.percentage}%)`,
                            'Count'
                          ]}
                        />
                        <Bar 
                          dataKey="count" 
                          fill={COLORS.byzantium}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gender Distribution Doughnut Chart */}
                  <div>
                    <h4 
                      className="text-lg font-semibold mb-4"
                      style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                    >
                      Gender Distribution Overview
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Male', value: athleteStats.byGender.male, fill: COLORS.byzantium },
                            { name: 'Female', value: athleteStats.byGender.female, fill: COLORS.violetJtc },
                            { name: 'Other', value: athleteStats.byGender.other, fill: COLORS.darkPurple }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface,
                            border: `1px solid ${isDark ? COLORS.dark.border : COLORS.light.border}`,
                            borderRadius: '8px',
                            color: isDark ? COLORS.dark.text : COLORS.light.text
                          }}
                          formatter={(value: any, name: any, props: any) => [
                            `${value} athletes (${((Number(value) / athleteStats.totalAthletes) * 100).toFixed(1)}%)`,
                            name
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{
                            color: isDark ? COLORS.dark.text : COLORS.light.text,
                            fontSize: '14px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
        </div>
      )}

      {/* Fairness Reports Tab */}
      {activeTab === 'fairness' && (
        <div className="space-y-6">
          {/* Fairness Scores by Region */}
                <div className={`rounded-xl shadow-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Fairness Index by Region</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fairnessReports}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                      <Bar dataKey="avgFairnessScore" fill={COLORS.byzantium} name="Avg Fairness Score" />
                      <Bar dataKey="totalApplications" fill={COLORS.violetJtc} name="Total Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fairness Reports Table */}
                <div className={`rounded-xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Detailed Fairness Reports</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                      <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Region</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Applications</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Fairness Score</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>ST %</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>SC %</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>OBC %</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Women %</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Rural %</th>
                  </tr>
                </thead>
                      <tbody className={`divide-y ${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                  {fairnessReports.map((report, index) => (
                          <tr key={index} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{report.region}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{report.totalApplications}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{report.avgFairnessScore.toFixed(1)}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{report.stPercentage.toFixed(1)}%</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{report.scPercentage.toFixed(1)}%</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{report.obcPercentage.toFixed(1)}%</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{report.womenPercentage.toFixed(1)}%</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{report.ruralPercentage.toFixed(1)}%</td>
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
                <div className={`rounded-xl shadow-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Monthly Injury Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={injuryTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                      <Line type="monotone" dataKey="injuries" stroke={COLORS.byzantium} name="New Injuries" strokeWidth={2} />
                      <Line type="monotone" dataKey="recoveries" stroke={COLORS.violetJtc} name="Recoveries" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Injury Severity Breakdown */}
                <div className={`rounded-xl shadow-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Injury Severity Distribution</h3>
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
              <div className={`rounded-xl shadow-lg p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Opportunity Allocations</h3>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>This section shows scholarship and opportunity allocation details.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                    className="p-6 rounded-lg"
                    style={{
                      backgroundColor: isDark ? `${COLORS.byzantium}20` : `${COLORS.byzantium}10`,
                      border: `1px solid ${isDark ? COLORS.byzantium : COLORS.byzantium}30`
                    }}
                  >
                    <h4 
                      className="font-semibold mb-2"
                      style={{ color: isDark ? COLORS.byzantium : COLORS.violetJtc }}
                    >
                      Total Budget
                    </h4>
                    <p 
                      className="text-2xl font-bold"
                      style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                    >
                      ₹158.8 Cr
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }}
                    >
                      FY 2024-25
                    </p>
            </div>
                  <div 
                    className="p-6 rounded-lg"
                    style={{
                      backgroundColor: isDark ? `${COLORS.violetJtc}20` : `${COLORS.violetJtc}10`,
                      border: `1px solid ${isDark ? COLORS.violetJtc : COLORS.violetJtc}30`
                    }}
                  >
                    <h4 
                      className="font-semibold mb-2"
                      style={{ color: isDark ? COLORS.violetJtc : COLORS.darkPurple }}
                    >
                      Allocated
                    </h4>
                    <p 
                      className="text-2xl font-bold"
                      style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                    >
                      ₹142.3 Cr
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }}
                    >
                      89.6% utilized
                    </p>
            </div>
                  <div 
                    className="p-6 rounded-lg"
                    style={{
                      backgroundColor: isDark ? `${COLORS.darkPurple}20` : `${COLORS.darkPurple}10`,
                      border: `1px solid ${isDark ? COLORS.darkPurple : COLORS.darkPurple}30`
                    }}
                  >
                    <h4 
                      className="font-semibold mb-2"
                      style={{ color: isDark ? COLORS.darkPurple : COLORS.black }}
                    >
                      Remaining
                    </h4>
                    <p 
                      className="text-2xl font-bold"
                      style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}
                    >
                      ₹16.5 Cr
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }}
                    >
                      Available for Q3-Q4
                    </p>
            </div>
          </div>
        </div>
      )}

      {/* Scholarships Tab */}
      {activeTab === 'scholarships' && (
              <ScholarshipManagementForm isDark={isDark} />
      )}
          </main>
        </div>
      </div>
    </div>
  );
}
