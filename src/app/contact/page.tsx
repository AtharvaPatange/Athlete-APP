"use client";

import React from "react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 flex flex-col">

      {/* Back Navigation Button */}
      <div className="w-full flex items-center px-6 pt-8 pb-2">
        <a
          href="/"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold text-base transition-colors rounded-lg px-3 py-2 bg-[#10172a]/60 hover:bg-[#10172a]/80 shadow-sm"
          style={{ boxShadow: '0 2px 8px 0 #1e293b33' }}
        >
          <svg className="mr-2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </a>
      </div>

      {/* Hero/Title Section for Contact Page */}
      <section className="w-full px-6 pt-4 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          <span className="text-white">Contact Us</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          We'd love to hear from you. Fill out the form or use the info below to get in touch with our team.
        </p>
      </section>

      {/* Contact Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* LEFT: Contact Form */}
        <div className="bg-[#0b0f19] border border-gray-800 rounded-2xl p-10 shadow-xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Let's <span className="text-blue-400">Connect</span>
          </h2>
          <p className="text-gray-400 mb-8">
            Have a question or ready to transform your business? Reach out to our team of experts.
          </p>

          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full rounded-lg bg-transparent border border-gray-700 px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="your.email@example.com"
                className="w-full rounded-lg bg-transparent border border-gray-700 px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Phone Number"
                className="w-full rounded-lg bg-transparent border border-gray-700 px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Your Location"
                className="w-full rounded-lg bg-transparent border border-gray-700 px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <textarea
              placeholder="How can we help you?"
              rows={5}
              className="w-full rounded-lg bg-transparent border border-gray-700 px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg hover:scale-[1.02] transition-transform"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* RIGHT: Contact Info */}
        <aside className="bg-[#0b0f19] border border-gray-800 rounded-2xl p-10 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-400">Email</p>
            <a href="mailto:athletex01@gmail.com" className="font-medium text-blue-400 hover:underline">athletex01@gmail.com</a>
            </div>
            <div>
              <p className="text-sm text-gray-400">Phone</p>
              <p className="font-medium text-gray-200">+91 7758920990</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Office</p>
              <p className="font-medium text-gray-200">Vasant Vihar, Solapur</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Business Hours</p>
              <p className="font-medium text-gray-200">Mon - Fri: 9:00 AM - 6:00 PM</p>
              <p className="font-medium text-gray-200">Sat: 10:00 AM - 4:00 PM</p>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Banner */}
      <footer className="bg-gradient-to-r from-[#0a1325] to-[#06111d] py-12 mt-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h4 className="text-white text-2xl font-semibold">
            Everything You Need to Excel
          </h4>
        </div>
      </footer>
    </div>
  );
}