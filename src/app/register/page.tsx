"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import FirebaseDebug from "@/components/FirebaseDebug";

const roles = [
  { value: "athlete", label: "🏃‍♂️ Athlete", description: "Compete and track performance" },
  { value: "coach", label: "🏋️‍♂️ Coach", description: "Train and guide athletes" },
  { value: "admin", label: "👨‍💼 Admin", description: "Manage platform and users" }
];

const genders = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" }
];

const sports = [
  { value: "football", label: "⚽ Football" },
  { value: "basketball", label: "🏀 Basketball" },
  { value: "tennis", label: "🎾 Tennis" },
  { value: "swimming", label: "🏊‍♂️ Swimming" },
  { value: "running", label: "🏃‍♂️ Running" },
  { value: "cycling", label: "🚴‍♂️ Cycling" },
  { value: "weightlifting", label: "🏋️‍♂️ Weightlifting" },
  { value: "other", label: "🏆 Other" }
];

const regions = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "central", label: "Central" }
];

const incomeBands = [
  { value: "low", label: "Under $30k" },
  { value: "medium", label: "$30k - $70k" },
  { value: "high", label: "Over $70k" }
];

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    age: "",
    gender: "male",
    sport: "football",
    region: "north",
    disability_flag: false,
    income_band: "low",
    role: "athlete"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateStep1 = () => {
    if (!form.email || !form.password || !form.confirmPassword || !form.name) {
      setError("Please fill in all required fields");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError("");
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const { email, password, confirmPassword, ...profile } = form;
    const result = await signUp(email, password);
    
    if (result.error || !result.user) {
      setError(result.error || "Unknown error");
      setLoading(false);
      return;
    }
    
    try {
      await setDoc(doc(db, "users", result.user.uid), {
        ...profile,
        uid: result.user.uid,
        createdAt: new Date()
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError("Failed to save profile");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-[#E0E4E9] relative"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Grid Background */}
      <div 
        className="fixed inset-0 opacity-100 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 2px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      ></div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#182031] mb-2">
            Create Account
          </h1>
          <p className="text-[#020817]/70">
            Join AthleteApp and build your profile
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? "bg-[#182031] text-white" : "bg-gray-200 text-gray-600"
            }`}>1</div>
            <div className={`h-1 w-16 ${step >= 2 ? "bg-[#182031]" : "bg-gray-200"}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? "bg-[#182031] text-white" : "bg-gray-200 text-gray-600"
            }`}>2</div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 px-4">
            <span>Account</span>
            <span>Profile</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E0E4E9]">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#182031] mb-6">
                  Account Information
                </h2>

                <div>
                  <label className="block text-sm font-medium text-[#182031] mb-2">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white text-[#020817] placeholder-gray-400 border border-gray-300 focus:ring-2 focus:ring-[#182031] focus:border-[#182031] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#182031] mb-2">
                    Full Name
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white text-[#020817] placeholder-gray-400 border border-gray-300 focus:ring-2 focus:ring-[#182031] focus:border-[#182031] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#182031] mb-2">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white text-[#020817] placeholder-gray-400 border border-gray-300 focus:ring-2 focus:ring-[#182031] focus:border-[#182031] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#182031] mb-2">
                    Confirm Password
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white text-[#020817] placeholder-gray-400 border border-gray-300 focus:ring-2 focus:ring-[#182031] focus:border-[#182031] outline-none transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-gradient-to-r from-[#182031] to-[#020817] text-white py-3 rounded-lg font-medium shadow hover:opacity-90 transition transform hover:scale-[1.01] focus:ring-2 focus:ring-offset-2 focus:ring-[#182031]"
                >
                  Continue to Profile →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#182031]">
                    Profile Details
                  </h2>
                  <button
                    type="button"
                    onClick={prevStep}
                    className="text-[#182031] hover:underline text-sm font-medium"
                  >
                    ← Back
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#182031] mb-2">
                      Age
                    </label>
                    <input
                      name="age"
                      type="number"
                      required
                      placeholder="25"
                      value={form.age}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white text-[#020817] placeholder-gray-400 border border-gray-300 focus:ring-2 focus:ring-[#182031] focus:border-[#182031] outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#182031] mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white text-[#020817] border border-gray-300 focus:ring-2 focus:ring-[#182031] focus:border-[#182031] outline-none transition"
                    >
                      {genders.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#182031] mb-2">
                    Sport
                  </label>
                  <select
                    name="sport"
                    value={form.sport}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white text-[#020817] border border-gray-300 focus:ring-2 focus:ring-[#182031] focus:border-[#182031] outline-none transition"
                  >
                    {sports.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#182031] mb-2">
                    Region
                  </label>
                  <select
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white text-[#020817] border border-gray-300 focus:ring-2 focus:ring-[#182031] focus:border-[#182031] outline-none transition"
                  >
                    {regions.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#182031] mb-2">
                    Income Band
                  </label>
                  <select
                    name="income_band"
                    value={form.income_band}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-white text-[#020817] border border-gray-300 focus:ring-2 focus:ring-[#182031] focus:border-[#182031] outline-none transition"
                  >
                    {incomeBands.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#182031] mb-2">
                    Role
                  </label>
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <label key={role.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={form.role === role.value}
                          onChange={handleChange}
                          className="mr-3 text-[#182031]"
                        />
                        <div>
                          <div className="font-medium text-[#182031]">{role.label}</div>
                          <div className="text-sm text-gray-500">{role.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="flex items-start space-x-3">
                    <input
                      name="disability_flag"
                      type="checkbox"
                      checked={form.disability_flag}
                      onChange={handleChange}
                      className="mt-1 text-[#182031]"
                    />
                    <div>
                      <div className="font-medium text-[#182031]">Accessibility Support</div>
                      <div className="text-sm text-gray-600">Check if you require disability accommodations</div>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#182031] to-[#020817] text-white py-3 rounded-lg font-medium shadow hover:opacity-90 transition transform hover:scale-[1.01] focus:ring-2 focus:ring-offset-2 focus:ring-[#182031] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account 🚀"
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-[#182031] hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}