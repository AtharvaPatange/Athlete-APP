"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { User, Users, Shield } from "lucide-react";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'athlete' | 'coach' | 'admin'>('athlete');

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    const result = await signIn(form.email, form.password);
    if (result.error || !result.user) {
      setError(result.error || "Invalid credentials");
      setLoading(false);
      return;
    }
    
    // Redirect based on login type
    if (loginType === 'admin') {
      router.push("/admin");
    } else if (loginType === 'coach') {
      router.push("/coach");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    const result = await signInWithGoogle();
    if (result.error || !result.user) {
      setError(result.error || "Google sign-in failed");
      setGoogleLoading(false);
      return;
    }
    
    try {
      // Check if user exists in database and get their role
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Redirect based on existing user role and login type selection
        if (userData.role === 'admin' || loginType === 'admin') {
          router.push("/admin");
        } else if (userData.role === 'coach' || loginType === 'coach') {
          router.push("/coach");
        } else {
          router.push("/dashboard");
        }
      } else {
        // New user - redirect to complete profile (register page handles this)
        router.push("/register");
      }
    } catch (err) {
      // Fallback to dashboard if there's an error checking user data
      console.error('Error checking user data:', err);
      router.push("/dashboard");
    }
    
    setGoogleLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-[#E0E4E9] fixed inset-0 overflow-auto"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Grid Background */}
      <div 
        className="fixed inset-0 opacity-100 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 2px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)",
          backgroundSize: '32px 32px',
          backgroundAttachment: 'fixed'
        }}
      ></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#182031] mb-2">
            Welcome Back
          </h1>
          <p className="text-[#020817]/70">
            Sign in to your ATHLETEx account
          </p>
        </div>

        {/* Login Type Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-2 border border-[#E0E4E9] mb-6">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setLoginType('athlete')}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium text-sm transition-all ${
                loginType === 'athlete'
                  ? "bg-gradient-to-r from-[#182031] to-[#020817] text-white shadow"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <User className="w-4 h-4" />
              Athlete
            </button>
            <button
              onClick={() => setLoginType('coach')}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium text-sm transition-all ${
                loginType === 'coach'
                  ? "bg-gradient-to-r from-[#182031] to-[#020817] text-white shadow"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Users className="w-4 h-4" />
              Coach
            </button>
            <button
              onClick={() => setLoginType('admin')}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium text-sm transition-all ${
                loginType === 'admin'
                  ? "bg-gradient-to-r from-[#182031] to-[#020817] text-white shadow"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E0E4E9]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#182031] mb-2">
                Email Address
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#182031] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-16 rounded-lg bg-white text-[#020817] placeholder-gray-400 border border-gray-300 focus:ring-2 focus:ring-[#182031] focus:border-[#182031] outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm text-gray-500 hover:text-[#182031] transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-[#182031] rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="text-sm text-[#182031] hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#182031] to-[#020817] text-white py-3 rounded-lg font-medium shadow hover:opacity-90 transition transform hover:scale-[1.01] focus:ring-2 focus:ring-offset-2 focus:ring-[#182031] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </form>

          {/* Social Login */}
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

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button 
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#182031] hover:underline font-medium"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <a href="#" className="text-[#182031] hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#182031] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};