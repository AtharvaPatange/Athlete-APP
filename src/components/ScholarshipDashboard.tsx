"use client";
import React, { useState, useEffect } from 'react';
import { scholarshipService, ScholarshipOpportunity, ScholarshipApplication, AthleteEligibilityCheck } from '@/services/scholarshipService';
import { seedScholarships, checkExistingOpportunities } from '@/services/seedScholarships';
import { useAuth } from '@/hooks/useAuth';
import OpportunityCard from './OpportunityCard';
import FairnessExplanationCard from './FairnessExplanationCard';

const ScholarshipDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'opportunities' | 'applications' | 'analytics'>('opportunities');
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

  useEffect(() => {
    if (user) {
      loadData();
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
      case 'opportunities': return '🔍';
      case 'applications': return '📋';
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

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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
              { id: 'opportunities', label: 'Browse Opportunities' },
              { id: 'applications', label: 'My Applications' },
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

        {activeTab === 'opportunities' && (
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

        {activeTab === 'applications' && (
          <>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Applications Yet</h3>
                <p className="text-gray-600 mb-4">You haven't applied for any opportunities yet.</p>
                <button
                  onClick={() => setActiveTab('opportunities')}
                  className="px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700"
                >
                  Browse Opportunities
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{application.opportunity.title}</h3>
                        <p className="text-gray-600 text-sm">{application.opportunity.provider.name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {application.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <p className="text-gray-500 text-xs mt-1">
                          Applied: {application.appliedAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Benefit Amount</p>
                        <p className="font-bold text-slate-800">
                          ₹{new Intl.NumberFormat('en-IN').format(application.opportunity.benefits.amount)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Fairness Score</p>
                        <p className="font-bold text-slate-800">{application.fairnessScore}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Priority Ranking</p>
                        <p className="font-bold text-slate-800">#{application.fairnessBreakdown.priorityRanking || 'TBD'}</p>
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
