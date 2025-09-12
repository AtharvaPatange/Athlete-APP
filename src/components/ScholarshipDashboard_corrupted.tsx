"use client";
import React, { useState, useEffect } from 'react';
import { scholarshipService, ScholarshipOpportunity, ScholarshipApplication, AthleteEligibilityCheck } from '@/services/scholarshipService';
import { refreshScholarshipsWithAI, getScholarships, generateApplicationForm, validateApplication, Scholarship } from '@/services/scholarshipAIService';
import { seedScholarships, checkExistingOpportunities } from '@/services/seedScholarships';
import { useAuth } from '@/hooks/useAuth';
import OpportunityCard from './OpportunityCard';
import FairnessExplanationCard from './FairnessExplanationCard';
import ScholarshipApplicationForm from './ScholarshipApplicationForm';

const ScholarshipDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'browse' | 'ai-discover' | 'apply' | 'track' | 'analytics'>('browse');
  const [activeFilter, setActiveFilter] = useState<'all' | 'scholarship' | 'government_scheme' | 'sponsorship'>('all');
  const [opportunities, setOpportunities] = useState<ScholarshipOpportunity[]>([]);
  const [applications, setApplications] = useState<(ScholarshipApplication & { opportunity: ScholarshipOpportunity })[]>([]);
  const [eligibilityChecks, setEligibilityChecks] = useState<{ [key: string]: AthleteEligibilityCheck }>({});
  const [appliedOpportunities, setAppliedOpportunities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [showFairnessCard, setShowFairnessCard] = useState<{
    show: boolean;
    application?: ScholarshipApplication & { opportunity: ScholarshipOpportunity };
  }>({ show: false });
  const [error, setError] = useState<string | null>(null);
  
  // AI-specific state
  const [aiScholarships, setAiScholarships] = useState<Scholarship[]>([]);
  const [refreshingAI, setRefreshingAI] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [applicationForm, setApplicationForm] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadData();
      loadAIScholarships();
    }
  }, [user, activeFilter]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Load opportunities based on filter
      let opportunitiesData: ScholarshipOpportunity[];
      if (activeFilter === 'all') {
        opportunitiesData = await scholarshipService.getActiveOpportunities();
      } else {
        opportunitiesData = await scholarshipService.getOpportunitiesByType(activeFilter);
      }
      
      // If no opportunities exist, seed some sample data
      if (opportunitiesData.length === 0) {
        console.log('No opportunities found, creating sample data...');
        const hasExisting = await checkExistingOpportunities();
        if (!hasExisting) {
          await seedScholarships();
          // Reload opportunities after seeding
          if (activeFilter === 'all') {
            opportunitiesData = await scholarshipService.getActiveOpportunities();
          } else {
            opportunitiesData = await scholarshipService.getOpportunitiesByType(activeFilter);
          }
        }
      }
      
      setOpportunities(opportunitiesData);

      // Load athlete's applications
      const applicationsData = await scholarshipService.getAthleteApplications(user.uid);
      setApplications(applicationsData);

      // Track applied opportunities
      const appliedIds = new Set(applicationsData.map(app => app.opportunityId));
      setAppliedOpportunities(appliedIds);

      // Check eligibility for each opportunity
      const eligibilityPromises = opportunitiesData.map(async (opportunity) => {
        try {
          const check = await scholarshipService.checkEligibility(opportunity.id, user.uid);
          return { opportunityId: opportunity.id, check };
        } catch (error) {
          console.error(`Error checking eligibility for ${opportunity.id}:`, error);
          return null;
        }
      });

      const eligibilityResults = await Promise.all(eligibilityPromises);
      const eligibilityMap: { [key: string]: AthleteEligibilityCheck } = {};
      eligibilityResults.forEach(result => {
        if (result) {
          eligibilityMap[result.opportunityId] = result.check;
        }
      });
      setEligibilityChecks(eligibilityMap);

    } catch (error) {
      console.error('Error loading scholarship data:', error);
      setError('Failed to load scholarship data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAIScholarships = async () => {
    try {
      console.log('Loading AI scholarships...');
      const response = await getScholarships();
      console.log('AI scholarships response:', response);
      if (response.success) {
        console.log('AI scholarships loaded:', response.scholarships.length, 'scholarships');
        setAiScholarships(response.scholarships);
      } else {
        console.error('Error loading AI scholarships:', response.error);
        setError('Failed to load AI scholarships: ' + response.error);
      }
    } catch (error) {
      console.error('Error loading AI scholarships:', error);
      setError('Failed to load AI scholarships');
    }
  };

  const handleRefreshAI = async () => {
    try {
      setRefreshingAI(true);
      await refreshScholarshipsWithAI();
      await loadAIScholarships();
      alert('AI scholarship data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing AI scholarships:', error);
      alert('Failed to refresh AI data. Please try again.');
    } finally {
      setRefreshingAI(false);
    }
  };

  const handleGenerateForm = (scholarship: Scholarship) => {
    const form = generateApplicationForm(scholarship);
    setApplicationForm(form);
    setSelectedScholarship(scholarship);
    setActiveTab('apply');
  };

  const handleTrackApplication = async () => {
    if (!trackingNumber.trim()) {
      alert('Please enter a tracking number');
      return;
    }

    try {
      const response = await fetch('/api/scholarship-applications/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackingNumber: trackingNumber.trim() })
      });

      if (response.ok) {
        const result = await response.json();
        setTrackingResult(result);
      } else {
        const error = await response.json();
        alert(error.error || 'Tracking number not found');
        setTrackingResult(null);
      }
    } catch (error) {
      console.error('Error tracking application:', error);
      alert('Failed to track application. Please try again.');
    }
  };

  const handleSubmitApplication = async (formData: any) => {
    if (!selectedScholarship || !user) return;

    try {
      const validation = validateApplication(formData, selectedScholarship);
      if (!validation.isValid) {
        alert('Form validation failed:\n' + validation.errors.join('\n'));
        return;
      }

      const response = await fetch('/api/scholarship-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scholarshipId: selectedScholarship.id,
          applicantId: user.uid,
          formData: formData
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Application submitted successfully!\nTracking Number: ${result.trackingNumber}`);
        setActiveTab('track');
        setTrackingNumber(result.trackingNumber);
        await handleTrackApplication();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    }
  };

  const handleApply = async (opportunityId: string) => {
    if (!user) return;

    try {
      setApplying(opportunityId);
      await scholarshipService.submitApplication(opportunityId, user.uid);
      
      // Reload data to reflect the new application
      await loadData();
      
      // Show success message (you could add a toast notification here)
      alert('Application submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      alert(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'browse': return '🔍';
      case 'ai-discover': return '🤖';
      case 'apply': return '📝';
      case 'track': return '📋';
      case 'analytics': return '📊';
      default: return '📄';
    }
  };

  const getFilterIcon = (filter: string) => {
    switch (filter) {
      case 'all': return '📚';
      case 'scholarship': return '🎓';
      case 'government_scheme': return '🏛️';
      case 'sponsorship': return '🤝';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waitlisted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const createSampleData = async () => {
    try {
      await scholarshipService.createSampleOpportunities();
      await loadData();
      alert('Sample data created successfully!');
    } catch (error) {
      console.error('Error creating sample data:', error);
      alert('Failed to create sample data.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scholarships...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view scholarships.</p>
        </div>
      </div>
    );
  }



  // Temporary debugging: render minimal content to isolate error
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1>Scholarship Dashboard - Debug Mode</h1>
      <p>User: {user?.email || 'Unknown'}</p>
      <p>Active Tab: {activeTab}</p>
      <p>Opportunities: {opportunities.length}</p>
      <p>Applications: {applications.length}</p>
      <p>AI Scholarships: {aiScholarships.length}</p>
    </div>
  );
};

export default ScholarshipDashboard;
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Scholarships & Opportunities</h1>
            <p className="text-gray-600">Find scholarships, government schemes, and sponsorship opportunities tailored for you</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'browse', label: 'Browse Opportunities' },
              { id: 'ai-discover', label: 'AI Discover' },
              { id: 'apply', label: 'Apply' },
              { id: 'track', label: 'Track Applications' },
              { id: 'analytics', label: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-gray-500 hover:text-slate-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{getTabIcon(tab.id)}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {activeTab === 'browse' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between mb-6">
              <div className="flex space-x-2">
                {[
                  { id: 'all', label: 'All Opportunities' },
                  { id: 'scholarship', label: 'Scholarships' },
                  { id: 'government_scheme', label: 'Government Schemes' },
                  { id: 'sponsorship', label: 'Sponsorships' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter === filter.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{getFilterIcon(filter.id)}</span>
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Sample Data Button (for testing) */}
              {opportunities.length === 0 && (
                <button
                  onClick={createSampleData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Create Sample Data
                </button>
              )}
            </div>

            {/* Opportunities Grid */}
            {opportunities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Opportunities Found</h3>
                <p className="text-gray-600 mb-4">
                  {activeFilter === 'all' 
                    ? 'No scholarship opportunities are currently available.' 
                    : `No ${activeFilter.replace('_', ' ')} opportunities are currently available.`
                  }
                </p>
                <button
                  onClick={createSampleData}
                  className="px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700"
                >
                  Load Sample Opportunities
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onApply={handleApply}
                    eligibilityCheck={eligibilityChecks[opportunity.id]}
                    hasApplied={appliedOpportunities.has(opportunity.id)}
                    loading={applying === opportunity.id}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'ai-discover' && (
          <>
            {/* AI Discovery Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">🤖 AI-Powered Scholarship Discovery</h2>
                  <p className="text-gray-600">Let our AI agent search for the latest scholarship opportunities in India</p>
                </div>
                <button
                  onClick={handleRefreshAI}
                  disabled={refreshingAI}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    refreshingAI
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {refreshingAI ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>🔄 Update Data</>
                  )}
                </button>
              </div>
            </div>

            {/* AI Scholarships Grid */}
            {refreshingAI ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">AI is discovering new scholarships...</p>
              </div>
            ) : aiScholarships.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No AI Scholarships Found</h3>
                <p className="text-gray-600 mb-4">Click "Update Data" to let our AI discover new opportunities</p>
                <button
                  onClick={handleRefreshAI}
                  disabled={refreshingAI}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  🤖 Start AI Discovery
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiScholarships.map((scholarship) => (
                  <div key={scholarship.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        🤖 AI Discovered
                      </span>
                      <span className="text-xs text-gray-500">{scholarship.category || 'General'}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{scholarship.title || 'Untitled Scholarship'}</h3>
                    <p className="text-gray-600 text-sm mb-3">{scholarship.provider || 'Unknown Provider'}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-medium text-green-600">{scholarship.amount || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Deadline:</span>
                        <span className="font-medium">{scholarship.deadline || 'Not specified'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Sports:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(scholarship.sports || []).slice(0, 3).map((sport, idx) => (
                            <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {sport}
                            </span>
                          ))}
                          {(scholarship.sports || []).length > 3 && (
                            <span className="text-xs text-gray-500">+{(scholarship.sports || []).length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGenerateForm(scholarship)}
                        className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                      >
                        📝 Apply Now
                      </button>
                      <button
                        onClick={() => window.open(`https://scholarships.gov.in/search?q=${encodeURIComponent(scholarship.title)}`, '_blank')}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                      >
                        🔗 Website
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'apply' && (
          <>
            {selectedScholarship && applicationForm ? (
              <ScholarshipApplicationForm
                scholarship={selectedScholarship}
                formStructure={applicationForm}
                onSubmit={handleSubmitApplication}
                onCancel={() => setActiveTab('ai-discover')}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Application Selected</h3>
                <p className="text-gray-600 mb-4">Please select a scholarship from AI Discovery to generate an application form</p>
                <button
                  onClick={() => setActiveTab('ai-discover')}
                  className="px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700"
                >
                  🤖 Go to AI Discovery
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'track' && (
          <>
            {/* Tracking Section */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">📋 Track Your Application</h2>
                <p className="text-gray-600 mb-6">Enter your tracking number to check application status</p>
                
                <div className="flex space-x-4 mb-6">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number (e.g., APP-2024-12345)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                  <button
                    onClick={handleTrackApplication}
                    className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700"
                  >
                    🔍 Track
                  </button>
                </div>
                
                {trackingResult && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Application Status</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking Number:</span>
                        <span className="font-medium">{trackingResult.trackingNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trackingResult.status)}`}>
                          {trackingResult.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-medium">{new Date(trackingResult.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{new Date(trackingResult.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* My Applications from old section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">My Applications</h3>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-600">No applications submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{application.opportunity.title}</h3>
                          <p className="text-gray-600 text-sm">
                            {(() => {
                              try {
                                const provider = application.opportunity.provider;
                                if (typeof provider === 'string') {
                                  return provider;
                                } else if (provider && typeof provider === 'object' && provider.name) {
                                  return provider.name;
                                } else {
                                  return 'Unknown Provider';
                                }
                              } catch (e) {
                                return 'Unknown Provider';
                              }
                            })()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {application.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <p className="text-gray-500 text-xs mt-1">
                            Applied: {application.appliedAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Benefit Amount</p>
                          <p className="font-bold text-slate-800">
                            {application.opportunity.benefits?.amount 
                              ? `₹${new Intl.NumberFormat('en-IN').format(application.opportunity.benefits.amount)}`
                              : 'Not specified'
                            }
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Fairness Score</p>
                          <p className="font-bold text-slate-800">{application.fairnessScore || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Priority Ranking</p>
                          <p className="font-bold text-slate-800">#{application.fairnessBreakdown?.priorityRanking || 'TBD'}</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowFairnessCard({ show: true, application })}
                          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200"
                        >
                          🏅 View Fairness Breakdown
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}



        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Applications</p>
                  <p className="text-2xl font-bold text-slate-800">{applications.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {applications.filter(app => app.status === 'approved').length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {applications.filter(app => ['pending', 'under_review'].includes(app.status)).length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Average Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {applications.length > 0 
                      ? Math.round(applications.reduce((sum, app) => sum + app.fairnessScore, 0) / applications.length)
                      : 0
                    }
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fairness Explanation Modal */}
      {showFairnessCard.show && showFairnessCard.application && (
        <FairnessExplanationCard
          fairnessBreakdown={showFairnessCard.application.fairnessBreakdown}
          athleteName={user?.displayName || user?.email || 'Athlete'}
          opportunityTitle={showFairnessCard.application.opportunity.title}
          onClose={() => setShowFairnessCard({ show: false })}
        />
      )}
    </div>
  );
};

export default ScholarshipDashboard;
