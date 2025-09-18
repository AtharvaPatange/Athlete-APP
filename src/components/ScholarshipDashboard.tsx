"use client";
import { useState, useEffect } from "react";
import { scholarshipService, ScholarshipOpportunity, ScholarshipApplication, AthleteEligibilityCheck } from "@/services/scholarshipService";
import { refreshScholarshipsWithAI } from "@/services/scholarshipAIService";
import OpportunityCard from "./OpportunityCard";
import { useAuth } from "@/hooks/useAuth";

export default function ScholarshipDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("browse");
  const [opportunities, setOpportunities] = useState<ScholarshipOpportunity[]>([]);
  const [applications, setApplications] = useState<(ScholarshipApplication & { opportunity: ScholarshipOpportunity })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eligibilityById, setEligibilityById] = useState<Record<string, AthleteEligibilityCheck>>({});

  // Load data on component mount
  useEffect(() => {
    loadOpportunities();
    if (user?.uid) {
      loadApplications();
    }
  }, [user]);

  useEffect(() => {
    // When opportunities or user changes, fetch eligibility from backend (age-only criteria)
    const fetchEligibility = async () => {
      if (!user?.uid || opportunities.length === 0) return;
      const entries = await Promise.all(
        opportunities.map(async (opp) => {
          try {
            const result = await scholarshipService.checkEligibility(opp.id, user.uid);
            return [opp.id, result] as const;
          } catch (e) {
            return [opp.id, { isEligible: false, reasons: ["Could not determine eligibility"], fairnessScore: 0, fairnessBreakdown: {
              baseScore: 0,
              ruralBonus: 0,
              incomeBonus: 0,
              disabilityBonus: 0,
              regionBonus: 0,
              performanceScore: 0,
              totalScore: 0,
              explanation: [],
              priorityRanking: 0
            }} as AthleteEligibilityCheck] as const;
          }
        })
      );
      const map: Record<string, AthleteEligibilityCheck> = {};
      entries.forEach(([id, res]) => { map[id] = res; });
      setEligibilityById(map);
    };
    fetchEligibility();
  }, [opportunities, user]);

  const loadOpportunities = async () => {
    try {
      setIsLoading(true);
      const data = await scholarshipService.getActiveOpportunities();
      
      // Only show admin-created scholarships - no sample data creation
      setOpportunities(data);
    } catch (error) {
      console.error("Error loading opportunities:", error);
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadApplications = async () => {
    if (!user?.uid) return;
    
    try {
      const apps = await scholarshipService.getAthleteApplications(user.uid);
      setApplications(apps);
    } catch (error) {
      console.error("Error loading applications:", error);
      setApplications([]);
    }
  };

  const handleApplyClick = async (opportunityId: string) => {
    // This function is no longer used since Apply button redirects to provider website
    // Keeping it as a placeholder to maintain compatibility with OpportunityCard props
    console.log(`Apply clicked for opportunity: ${opportunityId} - Redirecting to provider website`);
  };

  const handleRefreshAI = async () => {
    try {
      setIsRefreshing(true);
      await refreshScholarshipsWithAI();
      loadOpportunities(); // Refresh after AI update
    } catch (error) {
      console.error("Error refreshing AI scholarships:", error);
      alert("Failed to refresh scholarships");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getApplicationStatus = (opportunityId: string) => {
    return applications.find(app => app.opportunityId === opportunityId);
  };

  const totalOpportunities = opportunities.length;
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => 
    app.status === 'pending' || app.status === 'under_review'
  ).length;

  return (
    <div className="space-y-6" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header with Analytics */}
      <div className="bg-gradient-to-r from-[#182031] to-[#020817] rounded-xl shadow-md p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Scholarship Opportunities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{totalOpportunities}</p>
            <p className="text-sm opacity-80">Available Opportunities</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{totalApplications}</p>
            <p className="text-sm opacity-80">Your Applications</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{pendingApplications}</p>
            <p className="text-sm opacity-80">Pending Reviews</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md p-2 border border-[#E0E4E9]">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "browse"
                ? "bg-gradient-to-r from-[#182031] to-[#020817] text-white shadow"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Browse Opportunities
          </button>
          <button
            onClick={() => setActiveTab("ai-discover")}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "ai-discover"
                ? "bg-gradient-to-r from-[#182031] to-[#020817] text-white shadow"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            AI Discovery
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "analytics"
                ? "bg-gradient-to-r from-[#182031] to-[#020817] text-white shadow"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            My Applications
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "browse" && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#182031]"></div>
                <p className="mt-2 text-gray-600">Loading opportunities...</p>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <span className="text-4xl mb-4 block">📋</span>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Scholarships Available</h3>
                  <p className="text-gray-500 mb-4">Scholarships will appear here once added by administrators through the Admin Dashboard.</p>
                </div>
                <button
                  onClick={loadOpportunities}
                  className="px-4 py-2 bg-[#182031] text-white rounded-lg hover:bg-[#020817] transition-colors"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {opportunities.map((opportunity) => {
                  const hasApplied = getApplicationStatus(opportunity.id);
                  return (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      onApply={handleApplyClick}
                      eligibilityCheck={eligibilityById[opportunity.id]}
                      hasApplied={!!hasApplied}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "ai-discover" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
              <h3 className="text-lg font-semibold mb-4">AI-Powered Opportunity Discovery</h3>
              <p className="text-gray-600 mb-4">
                Use AI to discover new scholarship opportunities tailored to your profile and sport.
              </p>
              <button
                onClick={handleRefreshAI}
                disabled={isRefreshing}
                className="px-6 py-3 bg-gradient-to-r from-[#182031] to-[#020817] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isRefreshing ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Discovering...
                  </>
                ) : (
                  "Discover New Opportunities"
                )}
              </button>
            </div>
            
            {/* Show opportunities here as well after AI refresh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {opportunities.filter(opp => 
                opp.provider.type === 'government' || 
                opp.title.toLowerCase().includes('ai') ||
                opp.description.toLowerCase().includes('talent')
              ).map((opportunity) => {
                const hasApplied = getApplicationStatus(opportunity.id);
                return (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onApply={handleApplyClick}
                    hasApplied={!!hasApplied}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
              <h3 className="text-lg font-semibold mb-4">Application Status</h3>
              <div className="space-y-3">
                {applications.length === 0 ? (
                  <p className="text-gray-500">No applications yet</p>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{app.opportunity?.title || 'Unknown Opportunity'}</p>
                        <p className="text-sm text-gray-600">
                          Applied: {app.appliedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Fairness Score: {app.fairnessScore}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        app.status === 'waitlisted' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E9]">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Success Rate</span>
                  <span className="font-semibold">
                    {applications.length > 0 
                      ? `${Math.round((applications.filter(app => app.status === 'approved').length / applications.length) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response Time</span>
                  <span className="font-semibold">2-4 weeks</span>
                </div>
                <div className="flex justify-between">
                  <span>Categories Applied</span>
                  <span className="font-semibold">
                    {new Set(applications.map(app => 
                      app.opportunity?.category
                    ).filter(Boolean)).size}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Fairness Score</span>
                  <span className="font-semibold">
                    {applications.length > 0
                      ? Math.round(applications.reduce((sum, app) => sum + app.fairnessScore, 0) / applications.length)
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}