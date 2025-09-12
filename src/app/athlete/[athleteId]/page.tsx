'use client';
import React, { useState, useEffect, use } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AthleteProfile {
  id: string;
  name: string;
  sport: string;
  age: number;
  region: string;
  athleteId: string;
  achievements?: string[];
  profileImage?: string;
  bio?: string;
  experience?: string;
  specialization?: string;
  coachingHistory?: string[];
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

interface AthleteProfilePageProps {
  params: Promise<{
    athleteId: string;
  }>;
}

const AthleteProfilePage: React.FC<AthleteProfilePageProps> = ({ params }) => {
  const resolvedParams = use(params);
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAthleteProfile();
  }, [resolvedParams.athleteId]);

  const loadAthleteProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query users collection to find athlete by athleteId
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('athleteId', '==', resolvedParams.athleteId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Athlete profile not found');
        return;
      }

      const athleteDoc = querySnapshot.docs[0];
      const athleteData = athleteDoc.data();

      const profile: AthleteProfile = {
        id: athleteDoc.id,
        name: athleteData.displayName || athleteData.name || 'Athlete',
        sport: athleteData.sport || 'Not specified',
        age: athleteData.age || 0,
        region: athleteData.region || 'Not specified',
        athleteId: athleteData.athleteId,
        achievements: athleteData.achievements || [],
        profileImage: athleteData.profileImage || '',
        bio: athleteData.bio || '',
        experience: athleteData.experience || '',
        specialization: athleteData.specialization || '',
        coachingHistory: athleteData.coachingHistory || [],
        socialMedia: athleteData.socialMedia || {}
      };

      setAthlete(profile);
    } catch (error) {
      console.error('Error loading athlete profile:', error);
      setError('Failed to load athlete profile');
    } finally {
      setLoading(false);
    }
  };

  const getSportIcon = (sport: string) => {
    const sportIcons: { [key: string]: string } = {
      'Football': '⚽',
      'Basketball': '🏀',
      'Cricket': '🏏',
      'Tennis': '🎾',
      'Swimming': '🏊‍♂️',
      'Athletics': '🏃‍♂️',
      'Badminton': '🏸',
      'Hockey': '🏑',
      'Wrestling': '🤼‍♂️',
      'Boxing': '🥊',
      'Volleyball': '🏐',
      'Table Tennis': '🏓',
    };
    return sportIcons[sport] || '🏆';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !athlete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The athlete profile you are looking for could not be found.'}</p>
          <a 
            href="/" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {athlete.profileImage ? (
                    <img 
                      src={athlete.profileImage} 
                      alt={athlete.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    athlete.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-800">{athlete.name}</h1>
                  <span className="text-2xl">{getSportIcon(athlete.sport)}</span>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                  <div className="bg-blue-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-blue-800">{athlete.sport}</span>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-green-800">Age: {athlete.age}</span>
                  </div>
                  <div className="bg-purple-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-purple-800">{athlete.region}</span>
                  </div>
                </div>

                <div className="bg-gray-100 px-4 py-2 rounded-lg inline-block">
                  <span className="text-sm text-gray-600">Athlete ID: </span>
                  <span className="text-sm font-mono font-bold text-gray-800">{athlete.athleteId}</span>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {athlete.bio && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                <p className="text-gray-700">{athlete.bio}</p>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Achievements */}
            {athlete.achievements && athlete.achievements.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  🏆 Achievements
                </h3>
                <ul className="space-y-2">
                  {athlete.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span className="text-gray-700">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Experience & Specialization */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                💪 Experience
              </h3>
              
              {athlete.experience && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-1">Experience Level</h4>
                  <p className="text-gray-600">{athlete.experience}</p>
                </div>
              )}
              
              {athlete.specialization && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-1">Specialization</h4>
                  <p className="text-gray-600">{athlete.specialization}</p>
                </div>
              )}

              {athlete.coachingHistory && athlete.coachingHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Coaching History</h4>
                  <ul className="space-y-1">
                    {athlete.coachingHistory.map((coach, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {coach}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Social Media & Contact */}
          {athlete.socialMedia && Object.keys(athlete.socialMedia).length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📱 Connect
              </h3>
              <div className="flex flex-wrap gap-4">
                {athlete.socialMedia.instagram && (
                  <a 
                    href={`https://instagram.com/${athlete.socialMedia.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
                  >
                    📷 Instagram
                  </a>
                )}
                {athlete.socialMedia.twitter && (
                  <a 
                    href={`https://twitter.com/${athlete.socialMedia.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    🐦 Twitter
                  </a>
                )}
                {athlete.socialMedia.linkedin && (
                  <a 
                    href={`https://linkedin.com/in/${athlete.socialMedia.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    💼 LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 p-6 bg-white rounded-xl shadow-lg">
            <p className="text-gray-600 text-sm mb-2">
              This profile was generated via QR code scan
            </p>
            <p className="text-gray-500 text-xs">
              Powered by AthleteX Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteProfilePage;