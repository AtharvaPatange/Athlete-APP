"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  getTrainingSessions, 
  TrainingSession,
  getCoachFeedback,
  CoachFeedback
} from "@/services/performanceService";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Heart, 
  Zap, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Target,
  Flame,
  User,
  Star,
  TrendingUp,
  BarChart3
} from "lucide-react";

interface TrainingSessionsListProps {
  athleteId: string;
  refreshTrigger: number;
}

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'peak': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getIntensityIcon = (intensity: string) => {
  switch (intensity) {
    case 'low': return <Activity className="w-4 h-4" />;
    case 'medium': return <Target className="w-4 h-4" />;
    case 'high': return <Zap className="w-4 h-4" />;
    case 'peak': return <Flame className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const getExerciseIcon = (exerciseType: string) => {
  switch (exerciseType) {
    case 'running': return <TrendingUp className="w-6 h-6" />;
    case 'cycling': return <Target className="w-6 h-6" />;
    case 'swimming': return <Activity className="w-6 h-6" />;
    case 'weightlifting': return <BarChart3 className="w-6 h-6" />;
    case 'cardio': return <Heart className="w-6 h-6" />;
    case 'flexibility': return <User className="w-6 h-6" />;
    case 'sports_practice': return <Target className="w-6 h-6" />;
    default: return <Activity className="w-6 h-6" />;
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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading training sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#182031] to-[#303644] p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/20">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">Training Sessions</h3>
              <p className="text-gray-200">Your recent workouts and performance metrics</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
            <span className="text-sm font-semibold">{sessions.length} Sessions</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">No Training Sessions Yet</h4>
            <p className="text-gray-600 max-w-md mx-auto">Start logging your workouts to track your progress and see detailed analytics!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const sessionFeedback = getSessionFeedback(session.id || '');
              
              return (
                <div
                  key={session.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
                  onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
                        {getExerciseIcon(session.exerciseType)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{session.sport}</h4>
                          <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${getIntensityColor(session.intensity)}`}>
                            {getIntensityIcon(session.intensity)}
                            <span>{session.intensity.toUpperCase()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(session.date, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{session.duration} min</span>
                          </div>
                          {session.distance && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{session.distance} km</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {sessionFeedback.length > 0 && (
                        <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                          <MessageSquare className="w-4 h-4 text-blue-600 mr-1" />
                          <span className="text-sm font-semibold text-blue-700">{sessionFeedback.length}</span>
                        </div>
                      )}
                      
                      <div className="text-gray-400">
                        {selectedSession?.id === session.id ? 
                          <ChevronUp className="w-5 h-5" /> : 
                          <ChevronDown className="w-5 h-5" />
                        }
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedSession?.id === session.id && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Performance Metrics */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                          <div className="flex items-center mb-3">
                            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                            <h5 className="font-bold text-blue-900">Performance</h5>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Exercise:</span>
                              <span className="font-semibold text-gray-900">{session.exerciseType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-semibold text-gray-900">{session.duration} min</span>
                            </div>
                            {session.distance && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Distance:</span>
                                <span className="font-semibold text-gray-900">{session.distance} km</span>
                              </div>
                            )}
                            {session.caloriesBurned && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Calories:</span>
                                <span className="font-semibold text-gray-900">{session.caloriesBurned} kcal</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Heart Rate Data */}
                        {(session.heartRateAvg || session.heartRateMax) && (
                          <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl border border-red-200">
                            <div className="flex items-center mb-3">
                              <Heart className="w-5 h-5 text-red-600 mr-2" />
                              <h5 className="font-bold text-red-900">Heart Rate</h5>
                            </div>
                            <div className="space-y-2 text-sm">
                              {session.heartRateAvg && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Average:</span>
                                  <span className="font-semibold text-gray-900">{session.heartRateAvg} bpm</span>
                                </div>
                              )}
                              {session.heartRateMax && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Maximum:</span>
                                  <span className="font-semibold text-gray-900">{session.heartRateMax} bpm</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Session Info */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                          <div className="flex items-center mb-3">
                            <Calendar className="w-5 h-5 text-emerald-600 mr-2" />
                            <h5 className="font-bold text-emerald-900">Session Info</h5>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date:</span>
                              <span className="font-semibold text-gray-900">{format(session.date, 'MMM dd, yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Intensity:</span>
                              <div className="flex items-center space-x-1">
                                {getIntensityIcon(session.intensity)}
                                <span className="font-semibold text-gray-900">{session.intensity}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {session.notes && (
                        <div className="mb-6">
                          <div className="flex items-center mb-3">
                            <MessageSquare className="w-5 h-5 text-gray-600 mr-2" />
                            <h5 className="font-bold text-gray-900">Notes</h5>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed">{session.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Coach Feedback */}
                      {sessionFeedback.length > 0 && (
                        <div>
                          <div className="flex items-center mb-4">
                            <User className="w-5 h-5 text-indigo-600 mr-2" />
                            <h5 className="font-bold text-gray-900">Coach Feedback</h5>
                          </div>
                          <div className="space-y-4">
                            {sessionFeedback.map((fb) => (
                              <div key={fb.id} className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="bg-white p-2 rounded-lg">
                                      <User className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-indigo-900">{fb.coachName}</span>
                                      <div className="flex items-center mt-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={`w-4 h-4 ${i < fb.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-xs text-indigo-600 bg-white px-3 py-1 rounded-full">
                                    {format(fb.createdAt, 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                <p className="text-sm text-indigo-800 mb-3 leading-relaxed">{fb.feedback}</p>
                                {fb.recommendations && (
                                  <div className="bg-white/50 p-3 rounded-lg mb-3">
                                    <p className="text-sm text-indigo-700">
                                      <span className="font-semibold">Recommendations:</span> {fb.recommendations}
                                    </p>
                                  </div>
                                )}
                                {fb.focusAreas && fb.focusAreas.length > 0 && (
                                  <div>
                                    <span className="text-sm font-semibold text-indigo-700 mb-2 block">Focus Areas:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {fb.focusAreas.map((area, index) => (
                                        <span
                                          key={index}
                                          className="px-3 py-1 bg-white text-indigo-800 text-xs font-medium rounded-full border border-indigo-200"
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
    </div>
  );
}
