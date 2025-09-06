"use client";
import { useState } from "react";
import { addCoachFeedback, CoachFeedback } from "@/services/performanceService";

interface CoachFeedbackFormProps {
  athleteId: string;
  coachId: string;
  coachName: string;
  sessionId?: string;
  onFeedbackAdded: () => void;
}

const focusAreaOptions = [
  "Technique", "Endurance", "Strength", "Speed", "Flexibility", 
  "Mental Focus", "Recovery", "Nutrition", "Consistency", "Goal Setting"
];

export default function CoachFeedbackForm({ 
  athleteId, 
  coachId, 
  coachName, 
  sessionId, 
  onFeedbackAdded 
}: CoachFeedbackFormProps) {
  const [form, setForm] = useState({
    feedback: "",
    rating: 3,
    recommendations: "",
    focusAreas: [] as string[]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (rating: number) => {
    setForm(prev => ({ ...prev, rating }));
  };

  const handleFocusAreaToggle = (area: string) => {
    setForm(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!form.feedback.trim()) {
      setError("Feedback is required");
      setLoading(false);
      return;
    }

    const feedbackData: Omit<CoachFeedback, 'id' | 'createdAt'> = {
      athleteId,
      coachId,
      coachName,
      sessionId,
      feedback: form.feedback,
      rating: form.rating,
      recommendations: form.recommendations || undefined,
      focusAreas: form.focusAreas.length > 0 ? form.focusAreas : undefined
    };

    const result = await addCoachFeedback(feedbackData);
    
    if (result.success) {
      setSuccess(true);
      setForm({
        feedback: "",
        rating: 3,
        recommendations: "",
        focusAreas: []
      });
      onFeedbackAdded();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to save feedback");
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-3 rounded-lg mr-4">
          <span className="text-2xl">👨‍🏫</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Coach Feedback</h3>
          <p className="text-gray-600">Provide guidance and feedback to the athlete</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Overall Rating</label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className={`text-3xl transition-colors ${
                  star <= form.rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ⭐
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-600 self-center">
              {form.rating}/5 stars
            </span>
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback *
          </label>
          <textarea
            name="feedback"
            value={form.feedback}
            onChange={handleChange}
            placeholder="Provide detailed feedback on the athlete's performance, technique, and areas for improvement..."
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Recommendations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recommendations
          </label>
          <textarea
            name="recommendations"
            value={form.recommendations}
            onChange={handleChange}
            placeholder="Specific recommendations for next training sessions, techniques to practice, or goals to focus on..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Focus Areas for Improvement
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {focusAreaOptions.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => handleFocusAreaToggle(area)}
                className={`p-2 rounded-lg text-sm font-medium transition-all ${
                  form.focusAreas.includes(area)
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
          {form.focusAreas.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Selected: {form.focusAreas.join(', ')}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {success && (
              <div className="flex items-center text-green-600">
                <span className="mr-2">✅</span>
                Feedback submitted successfully!
              </div>
            )}
            {error && (
              <div className="flex items-center text-red-600">
                <span className="mr-2">⚠️</span>
                {error}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </div>
            ) : (
              "📝 Submit Feedback"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
