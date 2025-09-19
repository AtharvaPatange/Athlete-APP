"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import FirebaseStatus from "@/components/FirebaseStatus";
import ChatbotPopup from "@/components/ChatbotPopup";



const COLORS = {
  primary: "#0f172a", // slate-900
  secondary: "#1e293b", // slate-800
  accent: "#3b82f6", // blue-500
  accentLight: "#60a5fa", // blue-400
  text: "#f1f5f9", // slate-100
  textMuted: "#94a3b8", // slate-400
  cardBg: "#1e293b", // slate-800
  border: "#334155", // slate-700
};

export default function Home() {
  return (
    <main 
      className="min-h-screen w-full relative overflow-hidden"
    >
      <div className="min-h-screen w-full bg-black relative">
    {/* Midnight Aurora Glow Background */}
    <div
      className="fixed inset-0 z-0"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, 
            rgba(58, 123, 255, 0.25) 0%, 
            rgba(100, 149, 237, 0.15) 25%, 
            rgba(123, 104, 238, 0.07) 35%, 
            transparent 50%
          )
        `,
      }}
    />
    
      {/* Navigation */}
      <nav className="relative z-10 px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Image
              src="/AthleteXBlack.png"
              alt="AthleteX Logo"
              width={180}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="transition-colors hover:opacity-80" style={{ color: COLORS.textMuted }}>
              Features
            </a>
            <a href="contact" className="transition-colors hover:opacity-80" style={{ color: COLORS.textMuted }}>
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-20 pb-32 px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1
              className="text-6xl sm:text-7xl font-bold tracking-tight mb-8 leading-tight"
              style={{ color: COLORS.text }}
            >
              Transform Your
              <br />
              <span 
                className="bg-gradient-to-r bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`
                }}
              >
                Athletic Journey
              </span>
            </h1>
            
            <p 
              className="text-xl md:text-2xl mb-12 leading-relaxed max-w-3xl mx-auto"
              style={{ color: COLORS.textMuted }}
            >
              Access world-class performance tracking, connect with elite coaches, and showcase your athletic achievements with our revolutionary Digital Athlete ID system.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link
                href="/register"
                className="group px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer flex items-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`,
                  color: COLORS.text,
                  boxShadow: `0 10px 30px ${COLORS.accent}33`
                }}
              >
                Get Started Today
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              
              <a 
                href="https://drive.google.com/file/d/1xB5zjFSF9j01K0qUPAocaX8rONxiME51/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center px-8 py-4 font-semibold text-lg transition-all duration-300 cursor-pointer"
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform"
                  style={{ 
                    border: `2px solid ${COLORS.accent}`,
                    color: COLORS.accent
                  }}
                >
                  <Play size={20} fill="currentColor" />
                </div>
                <span style={{ color: COLORS.text }}>Watch Demo</span>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="group cursor-pointer">
                <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text }}>10K+</div>
                <div className="text-sm font-medium" style={{ color: COLORS.textMuted }}>Active Athletes</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text }}>500+</div>
                <div className="text-sm font-medium" style={{ color: COLORS.textMuted }}>Sports Covered</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text }}>95%</div>
                <div className="text-sm font-medium" style={{ color: COLORS.textMuted }}>Success Rate</div>
              </div>
              <div className="group cursor-pointer">
                <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text }}>24/7</div>
                <div className="text-sm font-medium" style={{ color: COLORS.textMuted }}>Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="px-6 lg:px-8 max-w-6xl mx-auto pb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6" style={{ color: COLORS.text }}>
              Everything You Need to Excel
            </h2>
            <p className="text-xl" style={{ color: COLORS.textMuted }}>
              Comprehensive tools designed for the modern athlete
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Existing features */}
            {/* Existing features with accent color theme icons */}
            <article
              className="group p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
              style={{
                backgroundColor: `${COLORS.cardBg}cc`,
                border: `1px solid ${COLORS.border}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div 
                className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})` }}
              >
                {/* Performance Analytics Icon - White inner */}
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                  <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h10a4 4 0 014 4v2" />
                  <circle cx="12" cy="7" r="4" stroke="#fff" strokeWidth="2" />
                </svg>
              </div>
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: COLORS.text }}
              >
                Performance Analytics
              </h3>
              <p style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                Advanced AI-powered insights track your progress, identify improvement areas, and optimize your training with data-driven recommendations.
              </p>
            </article>

            <article
              className="group p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
              style={{
                backgroundColor: `${COLORS.cardBg}cc`,
                border: `1px solid ${COLORS.border}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div 
                className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})` }}
              >
                {/* Digital Athlete ID Icon - White inner */}
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="4" stroke="#fff" strokeWidth="2" />
                  <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01" />
                </svg>
              </div>
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: COLORS.text }}
              >
                Digital Athlete ID
              </h3>
              <p style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                Instantly shareable QR codes containing your verified athletic profile, achievements, and performance metrics for scouts and coaches.
              </p>
            </article>

            <article
              className="group p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
              style={{
                backgroundColor: `${COLORS.cardBg}cc`,
                border: `1px solid ${COLORS.border}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div 
                className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})` }}
              >
                {/* Elite Network Icon - White inner */}
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="2" />
                  <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.93 4.93a10 10 0 0114.14 0M4.93 19.07a10 10 0 0114.14 0" />
                </svg>
              </div>
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: COLORS.text }}
              >
                Elite Network
              </h3>
              <p style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                Connect with top-tier coaches, professional teams, and sports organizations worldwide to accelerate your athletic career.
              </p>
            </article>

            {/* New features */}
            {/* New features with accent color theme icons */}
            <article
              className="group p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
              style={{
                backgroundColor: `${COLORS.cardBg}cc`,
                border: `1px solid ${COLORS.border}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})` }}>
                {/* Nutrition Icon - White inner */}
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                  <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 0a7 7 0 017 7c0 3.866-3.134 7-7 7s-7-3.134-7-7a7 7 0 017-7zm0 0v2m0 0a5 5 0 015 5c0 2.761-2.239 5-5 5s-5-2.239-5-5a5 5 0 015-5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.text }}>
                Nutrition & Diet Planning
              </h3>
              <p style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                Personalized meal plans and nutrition tracking to optimize your athletic performance.
              </p>
            </article>

            <article
              className="group p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
              style={{
                backgroundColor: `${COLORS.cardBg}cc`,
                border: `1px solid ${COLORS.border}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})` }}>
                {/* Gamification Hub Icon - PS5 Controller */}
                <svg className="w-8 h-8" viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="12" width="48" height="12" rx="6" stroke="#fff" strokeWidth="2" fill="none"/>
                  <rect x="16" y="18" width="8" height="6" rx="3" stroke="#fff" strokeWidth="2" fill="#fff"/>
                  <rect x="40" y="18" width="8" height="6" rx="3" stroke="#fff" strokeWidth="2" fill="#fff"/>
                  <circle cx="24" cy="24" r="2" fill="#fff"/>
                  <circle cx="40" cy="24" r="2" fill="#fff"/>
                  <rect x="28" y="20" width="8" height="4" rx="2" stroke="#fff" strokeWidth="2" fill="none"/>
                  <circle cx="32" cy="24" r="1" fill="#fff"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.text }}>
                Gamification Hub
              </h3>
              <p style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                Earn badges, complete challenges, and compete on leaderboards to stay motivated.
              </p>
            </article>

            <article
              className="group p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
              style={{
                backgroundColor: `${COLORS.cardBg}cc`,
                border: `1px solid ${COLORS.border}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})` }}>
                {/* Injury Management Icon - White inner */}
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                  <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414-1.414M12 8v8m0 0a4 4 0 100-8 4 4 0 000 8zm0 0v2m0-2v-2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.text }}>
                Injury Management
              </h3>
              <p style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                Track injuries, recovery progress, and get expert advice for safe return to play.
              </p>
            </article>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="mx-6 lg:mx-8 mb-32 max-w-6xl lg:mx-auto rounded-3xl p-16 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`,
          }}
        >
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: COLORS.text }}>
              Ready to Transform Your Performance?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto" style={{ color: COLORS.text }}>
              Join thousands of athletes who are already using ATHLETEx to track their progress, connect with coaches, and achieve their goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: COLORS.text,
                  color: COLORS.primary
                }}
              >
                Start Your Journey
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl font-semibold text-lg border-2 transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{
                  borderColor: COLORS.text,
                  color: COLORS.text,
                  backgroundColor: 'transparent'
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-10 right-10 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: COLORS.text }}></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: COLORS.text }}></div>
        </section>

        {/* FOOTER */}
        <footer
          className="py-16 border-t"
          style={{
            backgroundColor: `${COLORS.secondary}cc`,
            borderColor: COLORS.border,
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-2xl font-bold" style={{ color: COLORS.text }}>
                    ATHLETEx
                  </span>
                </div>
                <p className="mb-4 leading-relaxed" style={{ color: COLORS.textMuted }}>
                  Empowering athletes worldwide with cutting-edge digital tools for performance tracking, networking, and career advancement.
                </p>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  Built with Next.js and Firebase for a seamless athletic experience.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold mb-6" style={{ color: COLORS.text }}>Platform</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: COLORS.textMuted }}>Features</a></li>
                  <li><a href="#" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: COLORS.textMuted }}>Pricing</a></li>
                  <li><a href="#" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: COLORS.textMuted }}>Support</a></li>
                  <li><a href="#" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: COLORS.textMuted }}>Mobile App</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-6" style={{ color: COLORS.text }}>Resources</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: COLORS.textMuted }}>Documentation</a></li>
                  <li><a href="#" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: COLORS.textMuted }}>API</a></li>
                  <li><a href="#" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: COLORS.textMuted }}>Community</a></li>
                  <li><a href="#" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: COLORS.textMuted }}>Blog</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t mt-12 pt-8 text-center" style={{ borderColor: COLORS.border }}>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                &copy; {new Date().getFullYear()} ATHLETEx. All rights reserved. | Privacy Policy | Terms of Service
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(120deg);
          }
          66% {
            transform: translateY(10px) rotate(240deg);
          }
        }
      `}</style>
    </div>
    <ChatbotPopup />
    </main>
  );
}