"use client";
import { useState } from "react";
import TrainingLogForm from "./TrainingLogForm";
import PerformanceAnalytics from "./PerformanceAnalytics";
import TrainingSessionsList from "./TrainingSessionsList";
import GamificationDashboard from "./GamificationDashboard";
import InjuryManagement from "./InjuryManagement";
import NutritionDashboard from "./NutritionDashboard";
import ScholarshipDashboard from "./ScholarshipDashboard";

interface PerformanceTabsProps {
  athleteId: string;
  sport?: string;
  region?: string;
}

const tabs = [
  { id: "log", label: "Log Training" },
  { id: "analytics", label: "Analytics" },
  { id: "sessions", label: "History" },
  { id: "nutrition", label: "Nutrition" },
  { id: "scholarships", label: "Scholarships" },
  { id: "gamification", label: "Challenges" },
  { id: "injury", label: "Recovery Tracker" },
];

export default function PerformanceTabs({
  athleteId,
  sport,
  region,
}: PerformanceTabsProps) {
  const [activeTab, setActiveTab] = useState("log");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSessionAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab("analytics");
  };

  return (
    <div
      className="space-y-6"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md p-2 border border-[#E0E4E9]">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "log" && (
          <TrainingLogForm
            athleteId={athleteId}
            onSessionAdded={handleSessionAdded}
          />
        )}

        {activeTab === "analytics" && (
          <PerformanceAnalytics
            athleteId={athleteId}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === "sessions" && (
          <TrainingSessionsList
            athleteId={athleteId}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === "nutrition" && (
          <NutritionDashboard athleteId={athleteId} sport={sport} />
        )}

        {activeTab === "scholarships" && <ScholarshipDashboard />}

        {activeTab === "gamification" && (
          <GamificationDashboard
            athleteId={athleteId}
            sport={sport}
            region={region}
          />
        )}

        {activeTab === "injury" && <InjuryManagement />}
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-[#182031] to-[#020817] rounded-xl shadow-md p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm opacity-80">Weekly Goal</p>
            <p className="text-lg font-semibold">5 Sessions</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Streak</p>
            <p className="text-lg font-semibold">7 Days</p>
          </div>
          <div>
            <p className="text-sm opacity-80">This Month</p>
            <p className="text-lg font-semibold">18 Sessions</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Avg Intensity</p>
            <p className="text-lg font-semibold">Medium</p>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-gradient-to-r from-gray-50 to-[#E0E4E9] rounded-xl p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          Performance Tips
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
            Log your training consistently to track progress patterns
          </li>
          <li className="flex items-center">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
            Include heart rate data for better intensity monitoring
          </li>
          <li className="flex items-center">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
            Add detailed notes about how you felt during training
          </li>
          <li className="flex items-center">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
            Review weekly/monthly trends to optimize your training plan
          </li>
        </ul>
      </div>
    </div>
  );
}
