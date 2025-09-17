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
  const { signUp, signInWithGoogle } = useAuth();
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
  const [googleLoading, setGoogleLoading] = useState(false);

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
      
      // Redirect based on role
      switch (profile.role) {
        case 'admin':
          router.push("/admin");
          break;
        case 'coach':
          router.push("/coach");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Failed to save profile");
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError("");

    const result = await signInWithGoogle();
    if (result.error || !result.user) {
      setError(result.error || "Google sign-up failed");
      setGoogleLoading(false);
      return;
    }

    try {
      // Check if user already exists
      const { getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (userDoc.exists()) {
        // User already exists, redirect based on role
        const userData = userDoc.data();
        switch (userData.role) {
          case 'admin':
            router.push("/admin");
            break;
          case 'coach':
            router.push("/coach");
            break;
          default:
            router.push("/dashboard");
        }
      } else {
        // Create a default profile for new Google users
        const defaultProfile = {
          name: result.user.displayName || "Google User",
          email: result.user.email || "",
          age: "",
          gender: "male",
          sport: "football",
          region: "north",
          disability_flag: false,
          income_band: "low",
          role: "athlete",
          uid: result.user.uid,
          createdAt: new Date(),
          signUpMethod: "google"
        };

        await setDoc(doc(db, "users", result.user.uid), defaultProfile);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Failed to save profile after Google sign-up");
      console.error('Google sign-up error:', err);
    }
    
    setGoogleLoading(false);
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

          {/* Google Sign Up Option */}
          {step === 1 && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading || loading}
                  className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Sign up with Google
                </button>
              </div>
            </div>
          )}

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