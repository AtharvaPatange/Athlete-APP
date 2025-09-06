"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  getTrainingSessions, 
  TrainingSession,
  getCoachFeedback,
  CoachFeedback
} from "@/services/performanceService";

interface TrainingSessionsListProps {
  athleteId: string;
  refreshTrigger: number;
}

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'peak': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getExerciseIcon = (exerciseType: string) => {
  switch (exerciseType) {
    case 'running': return '🏃‍♂️';
    case 'cycling': return '🚴‍♂️';
    case 'swimming': return '🏊‍♂️';
    case 'weightlifting': return '🏋️‍♂️';
    case 'cardio': return '❤️';
    case 'flexibility': return '🧘‍♀️';
    case 'sports_practice': return '⚽';
    default: return '🏆';
  }
};

export default function TrainingSessionsList({ athleteId, refreshTrigger }: TrainingSessionsListProps) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [feedback, setFeedback] = useState<CoachFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);

  useEffect(() => {
    fetchSessions();
    fetchFeedback();
  }, [athleteId, refreshTrigger]);

  const fetchSessions = async () => {
    setLoading(true);
    const result = await getTrainingSessions(athleteId, 10);
    if (result.success) {
      setSessions(result.sessions);
    }
    setLoading(false);
  };

  const fetchFeedback = async () => {
    const result = await getCoachFeedback(athleteId);
    if (result.success) {
      setFeedback(result.feedback);
    }
  };

  const getSessionFeedback = (sessionId: string) => {
    return feedback.filter(f => f.sessionId === sessionId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="bg-green-100 p-3 rounded-lg mr-4">
          <span className="text-2xl">📋</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Recent Training Sessions</h3>
          <p className="text-gray-600">Your latest workouts and performance metrics</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏃‍♂️</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Training Sessions Yet</h4>
          <p className="text-gray-600">Start logging your workouts to track your progress!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const sessionFeedback = getSessionFeedback(session.id || '');
            
            return (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getExerciseIcon(session.exerciseType)}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-gray-900">{session.sport}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntensityColor(session.intensity)}`}>
                          {session.intensity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(session.date, 'MMM dd, yyyy')} • {session.duration} min
                        {session.distance && ` • ${session.distance} km`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {sessionFeedback.length > 0 && (
                      <div className="flex items-center text-blue-600">
                        <span className="text-sm mr-1">💬</span>
                        <span className="text-sm font-medium">{sessionFeedback.length}</span>
                      </div>
                    )}
                    
                    <div className="text-gray-400">
                      {selectedSession?.id === session.id ? '▲' : '▼'}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedSession?.id === session.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Performance Metrics */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900">Performance</h5>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-600">Exercise:</span> <span className="font-medium text-gray-900">{session.exerciseType}</span></p>
                          <p><span className="text-gray-600">Duration:</span> <span className="font-medium text-gray-900">{session.duration} minutes</span></p>
                          {session.distance && (
                            <p><span className="text-gray-600">Distance:</span> <span className="font-medium text-gray-900">{session.distance} km</span></p>
                          )}
                          {session.caloriesBurned && (
                            <p><span className="text-gray-600">Calories:</span> <span className="font-medium text-gray-900">{session.caloriesBurned} kcal</span></p>
                          )}
                        </div>
                      </div>

                      {/* Heart Rate Data */}
                      {(session.heartRateAvg || session.heartRateMax) && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900">Heart Rate</h5>
                          <div className="space-y-1 text-sm">
                            {session.heartRateAvg && (
                              <p><span className="text-gray-600">Average:</span> <span className="font-medium text-gray-900">{session.heartRateAvg} bpm</span></p>
                            )}
                            {session.heartRateMax && (
                              <p><span className="text-gray-600">Maximum:</span> <span className="font-medium text-gray-900">{session.heartRateMax} bpm</span></p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Session Info */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900">Session Info</h5>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-600">Date:</span> <span className="font-medium text-gray-900">{format(session.date, 'EEEE, MMM dd, yyyy')}</span></p>
                          <p><span className="text-gray-600">Intensity:</span> <span className="font-medium text-gray-900">{session.intensity}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {session.notes && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{session.notes}</p>
                      </div>
                    )}

                    {/* Coach Feedback */}
                    {sessionFeedback.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Coach Feedback</h5>
                        <div className="space-y-3">
                          {sessionFeedback.map((fb) => (
                            <div key={fb.id} className="bg-blue-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-blue-900">{fb.coachName}</span>
                                  <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i}>{i < fb.rating ? '⭐' : '☆'}</span>
                                    ))}
                                  </div>
                                </div>
                                <span className="text-xs text-blue-600">
                                  {format(fb.createdAt, 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <p className="text-sm text-blue-800 mb-2">{fb.feedback}</p>
                              {fb.recommendations && (
                                <p className="text-sm text-blue-700">
                                  <span className="font-medium">Recommendations:</span> {fb.recommendations}
                                </p>
                              )}
                              {fb.focusAreas && fb.focusAreas.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-sm font-medium text-blue-700">Focus Areas:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {fb.focusAreas.map((area, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full"
                                      >
                                        {area}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
