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
  <div className="bg-white rounded-2xl shadow-lg p-8">
    {/* Header */}
    <div className="flex items-center mb-6">
      <div className="bg-[#EEEFF1] p-3 rounded-lg mr-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#1E2537]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0118 20.944M6 20.944a12.083 12.083 0 01-.16-10.366L12 14z" />
        </svg>
      </div>
      <div>
        <h3 className="text-xl font-bold text-[#1E2537]">Coach Feedback</h3>
        <p className="text-[#303848]">Provide guidance and feedback to the athlete</p>
      </div>
    </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-[#303848] mb-3">Overall Rating</label>
        <div className="flex space-x-2 items-center">
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
          <span className="ml-3 text-sm text-[#303848]">
            {form.rating}/5 stars
          </span>
        </div>
      </div>

      {/* Feedback */}
      <div>
        <label className="block text-sm font-medium text-[#303848] mb-2">Feedback *</label>
        <textarea
          name="feedback"
          value={form.feedback}
          onChange={handleChange}
          placeholder="Provide detailed feedback on the athlete's performance, technique, and areas for improvement..."
          rows={4}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2537] focus:border-[#1E2537] resize-none"
        />
      </div>

      {/* Recommendations */}
      <div>
        <label className="block text-sm font-medium text-[#303848] mb-2">Recommendations</label>
        <textarea
          name="recommendations"
          value={form.recommendations}
          onChange={handleChange}
          placeholder="Specific recommendations for next training sessions, techniques to practice, or goals to focus on..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2537] focus:border-[#1E2537] resize-none"
        />
      </div>

      {/* Focus Areas */}
      <div>
        <label className="block text-sm font-medium text-[#303848] mb-3">Focus Areas for Improvement</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {focusAreaOptions.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => handleFocusAreaToggle(area)}
              className={`p-2 rounded-lg text-sm font-medium transition-all ${
                form.focusAreas.includes(area)
                  ? 'bg-[#1E2537] text-white border-2 border-[#1E2537]'
                  : 'bg-[#EEEFF1] text-[#303848] hover:bg-[#d9dbe0] border-2 border-transparent'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
        {form.focusAreas.length > 0 && (
          <p className="text-xs text-[#60687a] mt-2">
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
          className="bg-gradient-to-r from-[#1E2537] to-[#303848] text-white px-6 py-3 rounded-lg font-medium hover:from-[#11192C] hover:to-[#1E2537] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Submitting...
            </div>
          ) : (
            "Submit Feedback"
          )}
        </button>
      </div>
    </form>
  </div>
);
}
