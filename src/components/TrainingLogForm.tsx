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
      className="max-w-4xl mx-auto rounded-2xl shadow-lg p-8"
      style={{ backgroundColor: COLORS.seasalt }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: COLORS.oxfordBlue }}>
            Log Training Session
          </h2>
          <p className="mt-2" style={{ color: COLORS.marianBlue }}>
            Record your workout details and performance metrics
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: COLORS.platinum }}>
          <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.oxfordBlue }}>
            Basic Information
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.marianBlue }}
              >
                Date
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2"
                style={{ borderColor: COLORS.platinum, color: COLORS.oxfordBlue }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.marianBlue }}
              >
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
                className="w-full px-4 py-3 border rounded-lg focus:ring-2"
                style={{ borderColor: COLORS.platinum, color: COLORS.oxfordBlue }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.marianBlue }}
              >
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
                className="w-full px-4 py-3 border rounded-lg focus:ring-2"
                style={{ borderColor: COLORS.platinum, color: COLORS.oxfordBlue }}
              />
            </div>
          </div>
        </div>

        {/* Sport and Exercise Type */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: COLORS.platinum }}>
          <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.oxfordBlue }}>
            Activity Details
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.marianBlue }}
              >
                Sport <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sport"
                value={form.sport}
                onChange={handleChange}
                placeholder="Football, Basketball, etc."
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2"
                style={{ borderColor: COLORS.platinum, color: COLORS.oxfordBlue }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.marianBlue }}
              >
                Exercise Type
              </label>
              <select
                name="exerciseType"
                value={form.exerciseType}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2"
                style={{ borderColor: COLORS.platinum, color: COLORS.oxfordBlue }}
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

        {/* Intensity */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: COLORS.platinum }}>
          <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.oxfordBlue }}>
            Intensity Level
          </h3>
          <div className="grid md:grid-cols-4 gap-3">
            {intensityLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, intensity: level.value as any }))}
                className="p-3 rounded-lg border text-sm font-medium transition-all"
                style={{
                  borderColor:
                    form.intensity === level.value ? COLORS.marianBlue : COLORS.platinum,
                  backgroundColor:
                    form.intensity === level.value ? COLORS.powderBlue : COLORS.seasalt,
                  color: COLORS.oxfordBlue
                }}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Heart Rate and Calories */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: COLORS.platinum }}>
          <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.oxfordBlue }}>
            Performance Metrics
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.marianBlue }}
              >
                Calories Burned
              </label>
              <input
                type="number"
                name="caloriesBurned"
                value={form.caloriesBurned}
                onChange={handleChange}
                placeholder="250"
                min="0"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2"
                style={{ borderColor: COLORS.platinum, color: COLORS.oxfordBlue }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.marianBlue }}
              >
                Avg Heart Rate (bpm)
              </label>
              <input
                type="number"
                name="heartRateAvg"
                value={form.heartRateAvg}
                onChange={handleChange}
                placeholder="140"
                min="40"
                max="220"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2"
                style={{ borderColor: COLORS.platinum, color: COLORS.oxfordBlue }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.marianBlue }}
              >
                Max Heart Rate (bpm)
              </label>
              <input
                type="number"
                name="heartRateMax"
                value={form.heartRateMax}
                onChange={handleChange}
                placeholder="170"
                min="40"
                max="220"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2"
                style={{ borderColor: COLORS.platinum, color: COLORS.oxfordBlue }}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: COLORS.platinum }}>
          <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.oxfordBlue }}>
            Notes
          </h3>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="How did you feel? Any observations or goals for next session..."
            rows={3}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 placeholder-gray-500 resize-none"
            style={{ borderColor: COLORS.platinum, color: COLORS.oxfordBlue }}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-4">
            {success && (
              <div className="text-green-600">Training session logged successfully!</div>
            )}
            {error && <div className="text-red-600">{error}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, ${COLORS.oxfordBlue}, ${COLORS.marianBlue})`,
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