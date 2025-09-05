import Image from "next/image";
import FirebaseStatus from "@/components/FirebaseStatus";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl">🏃‍♂️</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AthleteApp
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Your digital sports companion. Track performance, connect with coaches, 
                and showcase your athletic journey with a unique Digital Athlete ID.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                🚀 Get Started
              </Link>
              <Link
                href="/login"
                className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all border border-gray-200 shadow-lg"
              >
                👋 Sign In
              </Link>
            </div>

            {/* Firebase Status */}
            <div className="max-w-md mx-auto mb-12">
              <FirebaseStatus />
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Tracking</h3>
                <p className="text-gray-600">Monitor your athletic progress with detailed analytics and insights.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-3xl mb-4">📱</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Digital Athlete ID</h3>
                <p className="text-gray-600">Generate a QR code with your complete athletic profile to share instantly.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-3xl mb-4">🤝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect & Collaborate</h3>
                <p className="text-gray-600">Network with coaches, teammates, and other athletes in your region.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-8 rounded-lg mr-3 flex items-center justify-center">
                  <span className="text-white text-sm">🏃‍♂️</span>
                </div>
                <span className="text-xl font-bold text-gray-900">AthleteApp</span>
              </div>
              <p className="text-gray-600 mb-4">
                Empowering athletes worldwide with digital tools for performance tracking and networking.
              </p>
              <p className="text-sm text-gray-500">
                Built with Next.js and Firebase for a seamless athletic experience.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">API</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2025 AthleteApp. All rights reserved. Empowering athletes globally.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
