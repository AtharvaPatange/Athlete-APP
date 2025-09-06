"use client";
import { useState } from "react";
import { createTrainingSession, TrainingSession } from "@/services/performanceService";

interface TrainingLogFormProps {
  athleteId: string;
  onSessionAdded: () => void;
}

const exerciseTypes = [
  { value: "running", label: "🏃‍♂️ Running" },
  { value: "cycling", label: "🚴‍♂️ Cycling" },
  { value: "swimming", label: "🏊‍♂️ Swimming" },
  { value: "weightlifting", label: "🏋️‍♂️ Weight Lifting" },
  { value: "cardio", label: "❤️ Cardio" },
  { value: "flexibility", label: "🧘‍♀️ Flexibility" },
  { value: "sports_practice", label: "⚽ Sports Practice" },
  { value: "other", label: "🏆 Other" }
];

const intensityLevels = [
  { value: "low", label: "🟢 Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "🟡 Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "🟠 High", color: "bg-orange-100 text-orange-800" },
  { value: "peak", label: "🔴 Peak", color: "bg-red-100 text-red-800" }
];

export default function TrainingLogForm({ athleteId, onSessionAdded }: TrainingLogFormProps) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: "",
    distance: "",
    intensity: "medium" as const,
    sport: "",
    exerciseType: "running",
    notes: "",
    caloriesBurned: "",
    heartRateAvg: "",
    heartRateMax: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!form.duration || !form.sport) {
      setError("Duration and sport are required");
      setLoading(false);
      return;
    }

    const sessionData: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'> = {
      athleteId,
      date: new Date(form.date),
      duration: parseInt(form.duration),
      distance: form.distance ? parseFloat(form.distance) : undefined,
      intensity: form.intensity,
      sport: form.sport,
      exerciseType: form.exerciseType,
      notes: form.notes || undefined,
      caloriesBurned: form.caloriesBurned ? parseInt(form.caloriesBurned) : undefined,
      heartRateAvg: form.heartRateAvg ? parseInt(form.heartRateAvg) : undefined,
      heartRateMax: form.heartRateMax ? parseInt(form.heartRateMax) : undefined
    };

    const result = await createTrainingSession(sessionData);
    
    if (result.success) {
      setSuccess(true);
      setForm({
        date: new Date().toISOString().split('T')[0],
        duration: "",
        distance: "",
        intensity: "medium",
        sport: "",
        exerciseType: "running",
        notes: "",
        caloriesBurned: "",
        heartRateAvg: "",
        heartRateMax: ""
      });
      onSessionAdded();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to save training session");
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-3 rounded-lg mr-4">
          <span className="text-2xl">📝</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Log Training Session</h3>
          <p className="text-gray-600">Record your workout details and performance metrics</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
            <input
              type="number"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="45"
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
            <input
              type="number"
              name="distance"
              value={form.distance}
              onChange={handleChange}
              placeholder="5.2"
              step="0.1"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sport and Exercise Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sport *</label>
            <input
              type="text"
              name="sport"
              value={form.sport}
              onChange={handleChange}
              placeholder="Football, Basketball, etc."
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Type</label>
            <select
              name="exerciseType"
              value={form.exerciseType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {exerciseTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Intensity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Intensity Level</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {intensityLevels.map((level) => (
              <label key={level.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="intensity"
                  value={level.value}
                  checked={form.intensity === level.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`w-full p-3 rounded-lg text-center text-sm font-medium transition-all ${
                  form.intensity === level.value 
                    ? level.color + ' ring-2 ring-blue-500' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                  {level.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Heart Rate and Calories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Calories Burned</label>
            <input
              type="number"
              name="caloriesBurned"
              value={form.caloriesBurned}
              onChange={handleChange}
              placeholder="250"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avg Heart Rate (bpm)</label>
            <input
              type="number"
              name="heartRateAvg"
              value={form.heartRateAvg}
              onChange={handleChange}
              placeholder="140"
              min="40"
              max="220"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Heart Rate (bpm)</label>
            <input
              type="number"
              name="heartRateMax"
              value={form.heartRateMax}
              onChange={handleChange}
              placeholder="170"
              min="40"
              max="220"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="How did you feel? Any observations or goals for next session..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {success && (
              <div className="flex items-center text-green-600">
                <span className="mr-2">✅</span>
                Training session logged successfully!
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
                Saving...
              </div>
            ) : (
              "📊 Log Session"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
