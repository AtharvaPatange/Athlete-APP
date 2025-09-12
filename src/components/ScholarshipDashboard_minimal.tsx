"use client";
import React, { useState, useEffect } from 'react';
import { scholarshipService, ScholarshipOpportunity, ScholarshipApplication, AthleteEligibilityCheck } from '@/services/scholarshipService';
import { refreshScholarshipsWithAI, getScholarships, generateApplicationForm, validateApplication, Scholarship } from '@/services/scholarshipAIService';
import { seedScholarships, checkExistingOpportunities } from '@/services/seedScholarships';
import { useAuth } from '@/hooks/useAuth';

const ScholarshipDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'browse' | 'ai-discover' | 'apply' | 'track' | 'analytics'>('browse');
  const [opportunities, setOpportunities] = useState<ScholarshipOpportunity[]>([]);
  const [applications, setApplications] = useState<(ScholarshipApplication & { opportunity: ScholarshipOpportunity })[]>([]);
  const [aiScholarships, setAiScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Minimal data loading for testing
      setOpportunities([]);
      setApplications([]);
      setAiScholarships([]);
      setLoading(false);
    }
  }, [user]);

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

  // Minimal safe render to test if the basic component works
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-4">Scholarship Dashboard - Test Mode</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p><strong>User:</strong> {user?.email || 'Unknown'}</p>
        <p><strong>Active Tab:</strong> {activeTab}</p>
        <p><strong>Opportunities:</strong> {opportunities.length}</p>
        <p><strong>Applications:</strong> {applications.length}</p>
        <p><strong>AI Scholarships:</strong> {aiScholarships.length}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
      </div>
    </div>
  );
};

export default ScholarshipDashboard;
