"use client";
import React from 'react';
import { FairnessBreakdown } from '@/services/scholarshipService';

interface FairnessExplanationCardProps {
  fairnessBreakdown: FairnessBreakdown;
  athleteName: string;
  opportunityTitle: string;
  onClose: () => void;
}

const FairnessExplanationCard: React.FC<FairnessExplanationCardProps> = ({
  fairnessBreakdown,
  athleteName,
  opportunityTitle,
  onClose
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Fairness Index Explanation</h2>
              <p className="text-slate-300 text-sm">
                How allocation decisions are made transparently
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Application Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-slate-800 mb-2">Application Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Athlete:</span>
                <span className="ml-2 font-medium text-slate-800">{athleteName}</span>
              </div>
              <div>
                <span className="text-gray-600">Opportunity:</span>
                <span className="ml-2 font-medium text-slate-800">{opportunityTitle}</span>
              </div>
              <div>
                <span className="text-gray-600">Final Score:</span>
                <span className={`ml-2 font-bold ${getScoreColor(fairnessBreakdown.totalScore)}`}>
                  {fairnessBreakdown.totalScore} {getScoreIcon(fairnessBreakdown.totalScore)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Priority Ranking:</span>
                <span className="ml-2 font-medium text-slate-800">
                  #{fairnessBreakdown.priorityRanking}
                </span>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-4">Score Breakdown</h3>
            <div className="space-y-3">
              {/* Base Score */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📊</span>
                  <div>
                    <p className="font-medium text-slate-800">Base Score</p>
                    <p className="text-xs text-gray-600">Standard allocation for all applicants</p>
                  </div>
                </div>
                <span className="font-bold text-slate-800">+{fairnessBreakdown.baseScore}</span>
              </div>

              {/* Rural Bonus */}
              {fairnessBreakdown.ruralBonus > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🌾</span>
                    <div>
                      <p className="font-medium text-slate-800">Rural Development Bonus</p>
                      <p className="text-xs text-gray-600">Promoting sports in rural areas</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">+{fairnessBreakdown.ruralBonus}</span>
                </div>
              )}

              {/* Income Bonus */}
              {fairnessBreakdown.incomeBonus > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">💰</span>
                    <div>
                      <p className="font-medium text-slate-800">Economic Support Bonus</p>
                      <p className="text-xs text-gray-600">Supporting economically disadvantaged athletes</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600">+{fairnessBreakdown.incomeBonus}</span>
                </div>
              )}

              {/* Disability Bonus */}
              {fairnessBreakdown.disabilityBonus > 0 && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">♿</span>
                    <div>
                      <p className="font-medium text-slate-800">Inclusion Bonus</p>
                      <p className="text-xs text-gray-600">Promoting disability sports inclusion</p>
                    </div>
                  </div>
                  <span className="font-bold text-purple-600">+{fairnessBreakdown.disabilityBonus}</span>
                </div>
              )}

              {/* Region Bonus */}
              {fairnessBreakdown.regionBonus > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🗺️</span>
                    <div>
                      <p className="font-medium text-slate-800">Priority Region Bonus</p>
                      <p className="text-xs text-gray-600">Focusing on underrepresented regions</p>
                    </div>
                  </div>
                  <span className="font-bold text-yellow-600">+{fairnessBreakdown.regionBonus}</span>
                </div>
              )}

              {/* Performance Score */}
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🏆</span>
                  <div>
                    <p className="font-medium text-slate-800">Performance Score</p>
                    <p className="text-xs text-gray-600">Based on athletic achievements and potential</p>
                  </div>
                </div>
                <span className="font-bold text-orange-600">+{fairnessBreakdown.performanceScore}</span>
              </div>
            </div>
          </div>

          {/* Fairness Explanation */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-4">Fairness Principles</h3>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="space-y-2">
                {fairnessBreakdown.explanation.map((explanation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <p className="text-sm text-blue-800">{explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transparency Statement */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 mb-2">🏅 Our Commitment to Fair Allocation</h4>
            <p className="text-sm text-slate-600 mb-3">
              Our Fairness Index ensures transparent and equitable distribution of opportunities. 
              We prioritize athletes from disadvantaged backgrounds while maintaining merit-based selection.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Transparent scoring system</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Equal opportunity promotion</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Inclusive allocation process</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>Merit-based foundation</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Got it
            </button>
            <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FairnessExplanationCard;
