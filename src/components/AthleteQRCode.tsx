'use client';
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { incrementQRScans } from '@/services/statsService';

interface AthleteProfile {
  id: string;
  name: string;
  email: string;
  sport: string;
  age: number;
  region: string;
  achievements?: string[];
  athleteId?: string;
  profileImage?: string;
}

const AthleteQRCode: React.FC = () => {
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [athleteId, setAthleteId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate unique athlete ID
  const generateAthleteId = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ATH${timestamp}${random}`.toUpperCase();
  };

  // Load athlete profile and generate QR code
  useEffect(() => {
    if (user?.uid) {
      loadAthleteProfile();
    }
  }, [user]);

  const loadAthleteProfile = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let currentAthleteId = userData.athleteId;

        // Generate athlete ID if it doesn't exist
        if (!currentAthleteId) {
          currentAthleteId = generateAthleteId();
          await updateDoc(doc(db, 'users', user.uid), {
            athleteId: currentAthleteId
          });
        }

        const profile: AthleteProfile = {
          id: user.uid,
          name: userData.displayName || userData.name || 'Athlete',
          email: userData.email || user.email || '',
          sport: userData.sport || 'Not specified',
          age: userData.age || 0,
          region: userData.region || 'Not specified',
          achievements: userData.achievements || [],
          athleteId: currentAthleteId,
          profileImage: userData.profileImage || ''
        };

        setAthleteProfile(profile);
        setAthleteId(currentAthleteId);
        generateQRCode(currentAthleteId);
      }
    } catch (error) {
      console.error('Error loading athlete profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (athleteId: string) => {
    try {
      setIsGenerating(true);
      
      // Create URL that points to public profile page
      const profileUrl = `${window.location.origin}/athlete/${athleteId}`;
      
      // Generate QR code with high error correction and clean design
      const qrOptions = {
        errorCorrectionLevel: 'H' as const,
        type: 'image/png' as const,
        quality: 0.92,
        margin: 2,
        width: 220,
        color: {
          dark: '#1e293b', // slate-800 to match app theme
          light: '#ffffff' // Clean white background
        }
      };

      const qrDataUrl = await QRCode.toDataURL(profileUrl, qrOptions);
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareQRCode = async () => {
    if (!qrCodeUrl || !user) return;

    try {
      // Track QR scan when shared
      await incrementQRScans(user.uid);
      
      // Convert data URL to blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], `${athleteProfile?.name}-QRCode.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${athleteProfile?.name}'s Athlete Profile`,
          text: `Check out ${athleteProfile?.name}'s athlete profile!`,
          files: [file]
        });
      } else {
        // Fallback: download the QR code
        const link = document.createElement('a');
        link.download = `${athleteProfile?.name}-QRCode.png`;
        link.href = qrCodeUrl;
        link.click();
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      // Fallback: copy profile URL to clipboard
      const profileUrl = `${window.location.origin}/athlete/${athleteId}`;
      navigator.clipboard.writeText(profileUrl);
      alert('Profile link copied to clipboard!');
    }
  };

  const copyProfileLink = async () => {
    if (!user) return;
    
    try {
      // Track QR scan when link is copied
      await incrementQRScans(user.uid);
      
      const profileUrl = `${window.location.origin}/athlete/${athleteId}`;
      navigator.clipboard.writeText(profileUrl);
      alert('Profile link copied to clipboard!');
    } catch (error) {
      console.error('Error copying profile link:', error);
      const profileUrl = `${window.location.origin}/athlete/${athleteId}`;
      navigator.clipboard.writeText(profileUrl);
      alert('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {/* QR Code Section - Compact Left Side */}
      <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {isGenerating ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
          </div>
        ) : qrCodeUrl ? (
          <div className="text-center space-y-3">
            {/* Compact QR Code Container */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <img 
                src={qrCodeUrl} 
                alt="Athlete QR Code" 
                className="w-40 h-40 mx-auto rounded-md"
              />
            </div>
            
            {/* Compact QR Code Label */}
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-800">Scan to View Profile</h3>
              <p className="text-xs text-gray-600">
                ID: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">{athleteId}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">📱</span>
            </div>
            <p className="text-gray-500 mb-3 text-sm">Generate QR Code</p>
            <button
              onClick={() => athleteId && generateQRCode(athleteId)}
              className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Generate
            </button>
          </div>
        )}
      </div>

      {/* Profile Information - Expanded Right Side */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {athleteProfile?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Share My Profile</h2>
                <p className="text-gray-600 text-xs">
                  @{athleteProfile?.name?.toLowerCase().replace(/\s+/g, '_') || 'athlete'}
                </p>
              </div>
            </div>
            
            <button
              onClick={copyProfileLink}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1"
            >
              <span>🔗</span>
              <span>Copy Link</span>
            </button>
          </div>

          {athleteProfile && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <div className="text-center p-2 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-600">Sport</p>
                <p className="font-semibold text-slate-800 text-sm">{athleteProfile.sport}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-600">Region</p>
                <p className="font-semibold text-slate-800 text-sm">{athleteProfile.region}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Share Options</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={shareQRCode}
              className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
              <span>📤</span>
              <span>Share QR Code</span>
            </button>
            
            <button
              onClick={shareQRCode}
              className="flex items-center justify-center space-x-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors text-sm"
            >
              <span>💾</span>
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 text-base">ℹ️</span>
            <div>
              <h4 className="font-semibold text-blue-800 mb-1 text-sm">How it works</h4>
              <p className="text-xs text-blue-700">
                People can scan your QR code to instantly view your athlete profile, including your sport, achievements, and contact information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteQRCode;