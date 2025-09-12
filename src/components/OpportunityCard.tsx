"use client";
import React, { useState, useEffect } from 'react';
import { scholarshipService, ScholarshipOpportunity, ScholarshipApplication, AthleteEligibilityCheck } from '@/services/scholarshipService';
import { useAuth } from '@/hooks/useAuth';
import { Timestamp } from 'firebase/firestore';

interface OpportunityCardProps {
  opportunity: ScholarshipOpportunity;
  onApply: (opportunityId: string) => void;
  eligibilityCheck?: AthleteEligibilityCheck;
  hasApplied?: boolean;
  loading?: boolean;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ 
  opportunity, 
  onApply, 
  eligibilityCheck, 
  hasApplied = false,
  loading = false 
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scholarship': return 'bg-blue-100 text-blue-800';
      case 'government_scheme': return 'bg-green-100 text-green-800';
      case 'sponsorship': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scholarship': return '🎓';
      case 'government_scheme': return '🏛️';
      case 'sponsorship': return '🤝';
      default: return '📋';
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string, type: string) => {
    const formattedAmount = new Intl.NumberFormat('en-IN').format(amount);
    return `₹${formattedAmount} ${type === 'monthly' ? '/month' : type === 'yearly' ? '/year' : ''}`;
  };

  const isDeadlineNear = () => {
    const deadline = opportunity.applicationDeadline.toDate();
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7;
  };

  const getEligibilityStatus = () => {
    if (eligibilityCheck?.isEligible) {
      return { text: 'Eligible', color: 'text-green-600' };
    } else {
      return { text: 'Not Eligible', color: 'text-red-600' };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getTypeIcon(opportunity.type)}</span>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{opportunity.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(opportunity.type)}`}>
                {opportunity.type.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">by {opportunity.provider.name}</span>
            </div>
          </div>
        </div>
        
        {/* Deadline warning */}
        {isDeadlineNear() && (
          <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
            ⏰ Deadline Soon
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{opportunity.description}</p>

      {/* Key Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Benefit Amount</p>
          <p className="font-bold text-slate-800">
            {formatAmount(opportunity.benefits.amount, opportunity.benefits.currency, opportunity.benefits.type)}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Application Deadline</p>
          <p className="font-bold text-slate-800">{formatDate(opportunity.applicationDeadline)}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Eligibility</p>
          <p className="text-sm text-slate-800">
            {opportunity.eligibility.minAge}-{opportunity.eligibility.maxAge} years
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Eligibility</p>
          <p className={`text-sm font-medium ${getEligibilityStatus().color}`}>
            {getEligibilityStatus().text}
          </p>
        </div>
      </div>

      {/* Additional Benefits */}
      {opportunity.benefits.additionalBenefits.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Additional Benefits</p>
          <div className="flex flex-wrap gap-1">
            {opportunity.benefits.additionalBenefits.slice(0, 3).map((benefit, index) => (
              <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                {benefit}
              </span>
            ))}
            {opportunity.benefits.additionalBenefits.length > 3 && (
              <span className="text-gray-500 text-xs">+{opportunity.benefits.additionalBenefits.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Eligibility Status */}
      {eligibilityCheck && (
        <div className={`p-3 rounded-lg mb-4 ${
          eligibilityCheck.isEligible 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              eligibilityCheck.isEligible ? 'text-green-800' : 'text-red-800'
            }`}>
              {eligibilityCheck.isEligible ? '✅ Eligible' : '❌ Not Eligible'}
            </span>
            {eligibilityCheck.isEligible && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Fairness Score: {eligibilityCheck.fairnessScore}
              </span>
            )}
          </div>
          {!eligibilityCheck.isEligible && (
            <ul className="text-xs text-red-700 space-y-1">
              {eligibilityCheck.reasons.map((reason, index) => (
                <li key={index}>• {reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="flex space-x-2">
        {hasApplied ? (
          <button className="w-full bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed">
            ✅ Applied
          </button>
        ) : eligibilityCheck?.isEligible === false ? (
          <button className="w-full bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed">
            Not Eligible
          </button>
        ) : (
          <button
            onClick={() => {
              const website = opportunity.provider.website;
              if (website) {
                // Open the provider's website in a new tab
                window.open(website.startsWith('http') ? website : `https://${website}`, '_blank');
              } else {
                // Fallback: search for the opportunity on a government portal
                const searchQuery = encodeURIComponent(`${opportunity.title} ${opportunity.provider.name}`);
                window.open(`https://scholarships.gov.in/search?q=${searchQuery}`, '_blank');
              }
            }}
            disabled={loading || opportunity.currentApplicants >= opportunity.maxApplicants}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Opening...' : 'Apply Now'}</span>
            <span className="text-xs">🔗</span>
          </button>
        )}
        <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
          Details
        </button>
      </div>
    </div>
  );
};

export default OpportunityCard;
