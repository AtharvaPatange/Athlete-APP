'use client';
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    if (!qrCodeUrl) return;

    try {
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

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/athlete/${athleteId}`;
    navigator.clipboard.writeText(profileUrl);
    alert('Profile link copied to clipboard!');
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
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* QR Code Section - Left Side */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex-shrink-0">
        {isGenerating ? (
          <div className="flex items-center justify-center h-64 w-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          </div>
        ) : qrCodeUrl ? (
          <div className="text-center space-y-4">
            {/* Clean QR Code Container */}
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 shadow-sm">
              <img 
                src={qrCodeUrl} 
                alt="Athlete QR Code" 
                className="w-52 h-52 mx-auto rounded-lg shadow-sm"
              />
            </div>
            
            {/* QR Code Label */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">Scan to View Profile</h3>
              <p className="text-sm text-gray-600">
                ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{athleteId}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 w-64">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <p className="text-gray-500 mb-4">Generate your QR Code</p>
            <button
              onClick={() => athleteId && generateQRCode(athleteId)}
              className="px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
            >
              Generate QR Code
            </button>
          </div>
        )}
      </div>

      {/* Profile Information - Right Side */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {athleteProfile?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Share My Profile</h2>
                <p className="text-gray-600 text-sm">
                  @{athleteProfile?.name?.toLowerCase().replace(/\s+/g, '_') || 'athlete'}
                </p>
              </div>
            </div>
            
            <button
              onClick={copyProfileLink}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <span>🔗</span>
              <span>Copy Link</span>
            </button>
          </div>

          {athleteProfile && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Sport</p>
                <p className="font-semibold text-slate-800">{athleteProfile.sport}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Region</p>
                <p className="font-semibold text-slate-800">{athleteProfile.region}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Share Options</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={shareQRCode}
              className="flex items-center justify-center space-x-3 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <span>📤</span>
              <span>Share QR Code</span>
            </button>
            
            <button
              onClick={shareQRCode}
              className="flex items-center justify-center space-x-3 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span>💾</span>
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 text-lg">ℹ️</span>
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">How it works</h4>
              <p className="text-sm text-blue-700">
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