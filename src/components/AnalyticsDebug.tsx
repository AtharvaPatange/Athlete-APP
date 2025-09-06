"use client";
import { useState, useEffect } from "react";
import { getTrainingSessions, getSessionsByDateRange } from "@/services/performanceService";
import { subMonths } from "date-fns";

interface AnalyticsDebugProps {
  athleteId: string;
}

export default function AnalyticsDebug({ athleteId }: AnalyticsDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const debugAnalytics = async () => {
      setLoading(true);
      
      // Check recent sessions
      const recentSessions = await getTrainingSessions(athleteId, 50);
      
      // Check sessions in last 3 months
      const now = new Date();
      const threeMonthsAgo = subMonths(now, 3);
      const rangeResult = await getSessionsByDateRange(athleteId, threeMonthsAgo, now);
      
      setDebugInfo({
        athleteId,
        recentSessions: {
          success: recentSessions.success,
          count: recentSessions.sessions.length,
          error: recentSessions.error,
          sessions: recentSessions.sessions.slice(0, 3) // First 3 for preview
        },
        rangeResult: {
          success: rangeResult.success,
          count: rangeResult.sessions.length,
          error: rangeResult.error,
          sessions: rangeResult.sessions.slice(0, 3) // First 3 for preview
        },
        dateRange: {
          from: threeMonthsAgo.toISOString(),
          to: now.toISOString()
        }
      });
      
      setLoading(false);
    };

    if (athleteId) {
      debugAnalytics();
    }
  }, [athleteId]);

  if (loading) {
    return <div className="p-4 bg-yellow-50 rounded-lg">Loading debug info...</div>;
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">🐛 Analytics Debug Info</h3>
      
      <div className="space-y-4 text-sm">
        <div>
          <strong>Athlete ID:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{debugInfo.athleteId}</code>
        </div>
        
        <div>
          <strong>Recent Sessions Query:</strong>
          <div className="ml-4 mt-2">
            <p>✅ Success: {debugInfo.recentSessions.success ? 'Yes' : 'No'}</p>
            <p>📊 Count: {debugInfo.recentSessions.count}</p>
            {debugInfo.recentSessions.error && (
              <p className="text-red-600">❌ Error: {debugInfo.recentSessions.error}</p>
            )}
          </div>
        </div>
        
        <div>
          <strong>Date Range Query (Last 3 Months):</strong>
          <div className="ml-4 mt-2">
            <p>📅 From: {new Date(debugInfo.dateRange.from).toLocaleDateString()}</p>
            <p>📅 To: {new Date(debugInfo.dateRange.to).toLocaleDateString()}</p>
            <p>✅ Success: {debugInfo.rangeResult.success ? 'Yes' : 'No'}</p>
            <p>📊 Count: {debugInfo.rangeResult.count}</p>
            {debugInfo.rangeResult.error && (
              <p className="text-red-600">❌ Error: {debugInfo.rangeResult.error}</p>
            )}
          </div>
        </div>
        
        {debugInfo.recentSessions.sessions.length > 0 && (
          <div>
            <strong>Sample Sessions (First 3):</strong>
            <div className="ml-4 mt-2 space-y-2">
              {debugInfo.recentSessions.sessions.map((session: any, index: number) => (
                <div key={index} className="bg-black p-3 rounded border">
                  <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                  <p><strong>Sport:</strong> {session.sport}</p>
                  <p><strong>Duration:</strong> {session.duration} minutes</p>
                  <p><strong>Distance:</strong> {session.distance || 'N/A'} km</p>
                  <p><strong>Intensity:</strong> {session.intensity}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {debugInfo.recentSessions.count === 0 && (
          <div className="bg-yellow-100 p-4 rounded border border-yellow-300">
            <p className="text-yellow-800">
              ⚠️ <strong>No training sessions found!</strong> This could mean:
            </p>
            <ul className="list-disc list-inside mt-2 text-yellow-700">
              <li>No training sessions have been logged yet</li>
              <li>Sessions were logged with a different athlete ID</li>
              <li>There's an issue with the Firestore query</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
