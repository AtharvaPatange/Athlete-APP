"use client";
import { useState } from "react";
import { createTrainingSession, TrainingSession } from "@/services/performanceService";
import { updateQuestProgress } from "@/services/gamificationService";

// 🎨 Shared palette
const COLORS = {
  oxfordBlue: "#14213D",
  marianBlue: "#2C5282",
  powderBlue: "#B8C5D6",
  platinum: "#E5E5E5",
  seasalt: "#FFFFFF"
};

interface TrainingLogFormProps {
  athleteId: string;
  onSessionAdded: () => void;
}

const exerciseTypes = [
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
  { value: "swimming", label: "Swimming" },
  { value: "weightlifting", label: "Weight Lifting" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibility" },
  { value: "sports_practice", label: "Sports Practice" },
  { value: "other", label: "Other" }
];

const intensityLevels = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "peak", label: "Peak" }
];

export default function TrainingLogForm({ athleteId, onSessionAdded }: TrainingLogFormProps) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
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
    setForm((prev) => ({ ...prev, [name]: value }));
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

    const sessionData: Omit<TrainingSession, "id" | "createdAt" | "updatedAt"> = {
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
      await updateQuestProgressForSession(sessionData);
      setSuccess(true);
      setForm({
        date: new Date().toISOString().split("T")[0],
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

  const updateQuestProgressForSession = async (
    session: Omit<TrainingSession, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await updateQuestProgress(athleteId, "sessions_quest", 1);
      if (session.duration > 0) {
        await updateQuestProgress(athleteId, "duration_quest", session.duration);
      }
      if (session.distance && session.distance > 0) {
        await updateQuestProgress(athleteId, "distance_quest", session.distance);
      }
      if (session.sport) {
        await updateQuestProgress(athleteId, `${session.sport}_quest`, 1);
      }
      if (session.intensity === "high" || session.intensity === "peak") {
        await updateQuestProgress(athleteId, "intensity_quest", 1);
      }
    } catch (error) {
      console.error("Error updating quest progress:", error);
    }
  };

  return (
  <div
    className="max-w-5xl mx-auto rounded-xl shadow-md p-6"
    style={{ backgroundColor: COLORS.seasalt }}
  >
    {/* Header */}
    <div className="mb-6">
      <h2 className="text-2xl font-bold" style={{ color: COLORS.oxfordBlue }}>
        Log Training Session
      </h2>
      <p className="text-sm mt-1" style={{ color: COLORS.marianBlue }}>
        Record your workout details and performance metrics
      </p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Grid wrapper to align sections tighter */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-semibold mb-3" style={{ color: COLORS.oxfordBlue }}>
            Basic Info
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: COLORS.marianBlue }}>
                Date
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-1"
                style={{ borderColor: COLORS.oxfordBlue, color: COLORS.oxfordBlue }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: COLORS.marianBlue }}>
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="45"
                min="1"
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-1 placeholder:text-gray-500"
                style={{ borderColor: COLORS.oxfordBlue, color: COLORS.oxfordBlue }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: COLORS.marianBlue }}>
                Distance (km)
              </label>
              <input
                type="number"
                name="distance"
                value={form.distance}
                onChange={handleChange}
                placeholder="5.2"
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border rounded-md focus:ring-1 placeholder:text-gray-500"
                style={{ borderColor: COLORS.oxfordBlue, color: COLORS.oxfordBlue }}
              />
            </div>
          </div>
        </div>

        {/* Activity Details */}
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-semibold mb-3" style={{ color: COLORS.oxfordBlue }}>
            Activity
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: COLORS.marianBlue }}>
                Sport <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sport"
                value={form.sport}
                onChange={handleChange}
                placeholder="Football, Basketball, etc."
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-1 placeholder:text-gray-500"
                style={{ borderColor: COLORS.oxfordBlue, color: COLORS.oxfordBlue }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: COLORS.marianBlue }}>
                Exercise Type
              </label>
              <select
                name="exerciseType"
                value={form.exerciseType}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-1"
                style={{ borderColor: COLORS.oxfordBlue, color: COLORS.oxfordBlue }}
              >
                {exerciseTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Intensity */}
      <div className="p-4 border rounded-lg bg-white">
        <h3 className="text-lg font-semibold mb-3" style={{ color: COLORS.oxfordBlue }}>
          Intensity
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {intensityLevels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, intensity: level.value as any }))}
              className="p-2 rounded-md border text-xs font-medium transition-all"
              style={{
                borderColor: form.intensity === level.value ? COLORS.marianBlue : COLORS.oxfordBlue,
                backgroundColor: form.intensity === level.value ? COLORS.powderBlue : COLORS.seasalt,
                color: COLORS.oxfordBlue,
              }}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div className="p-4 border rounded-lg bg-white">
        <h3 className="text-lg font-semibold mb-3" style={{ color: COLORS.oxfordBlue }}>
          Performance
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Calories Burned", name: "caloriesBurned", placeholder: "250" },
            { label: "Avg Heart Rate (bpm)", name: "heartRateAvg", placeholder: "140" },
            { label: "Max Heart Rate (bpm)", name: "heartRateMax", placeholder: "170" },
          ].map((metric) => (
            <div key={metric.name}>
              <label className="block text-xs font-medium mb-1" style={{ color: COLORS.marianBlue }}>
                {metric.label}
              </label>
              <input
                type="number"
                name={metric.name}
                value={form[metric.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={metric.placeholder}
                className="w-full px-3 py-2 border rounded-md focus:ring-1 placeholder:text-gray-500"
                style={{ borderColor: COLORS.oxfordBlue, color: COLORS.oxfordBlue }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="p-4 border rounded-lg bg-white">
        <h3 className="text-lg font-semibold mb-3" style={{ color: COLORS.oxfordBlue }}>
          Notes
        </h3>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="How did you feel? Any observations..."
          className="w-full px-3 py-2 border rounded-md focus:ring-1 placeholder:text-gray-500 resize-none"
          style={{ borderColor: COLORS.oxfordBlue, color: COLORS.oxfordBlue }}
        />
      </div>

      {/* Submit */}
      <div className="cursor : pointer flex items-center justify-between pt-4">
        <div className="flex items-center space-x-4">
          {success && (
            <div className="text-green-600">Training session logged successfully!</div>
          )}
          {error && <div className="text-red-600">{error}</div>}
        </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 rounded-xl  cursor : pointer font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: COLORS.oxfordBlue, // 🔹 solid color instead of gradient
                  color: COLORS.seasalt
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                  ) : (
                    "Log Session"
                      )}
              </button>
            </div>
    </form>
  </div>
);
}