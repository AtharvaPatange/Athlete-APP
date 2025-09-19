"use client";
import { useState, useEffect } from "react";
import { Trophy, Award, Star, Sparkles, Zap } from "lucide-react";
import { BadgeRarity, getRarityColor } from "@/services/gamificationService";

interface QuestCompletionAnimationProps {
  isVisible: boolean;
  questTitle: string;
  pointsEarned: number;
  badgeRarity: BadgeRarity;
  questIcon: string;
  onAnimationComplete: () => void;
}

export default function QuestCompletionAnimation({
  isVisible,
  questTitle,
  pointsEarned,
  badgeRarity,
  questIcon,
  onAnimationComplete
}: QuestCompletionAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState<'entrance' | 'showcase' | 'exit'>('entrance');

  useEffect(() => {
    if (!isVisible) return;

    const phases = [
      { phase: 'entrance', duration: 800 },
      { phase: 'showcase', duration: 2500 },
      { phase: 'exit', duration: 700 }
    ];

    let currentPhaseIndex = 0;

    const runPhases = () => {
      if (currentPhaseIndex < phases.length) {
        const currentPhase = phases[currentPhaseIndex];
        setAnimationPhase(currentPhase.phase as any);

        setTimeout(() => {
          currentPhaseIndex++;
          if (currentPhaseIndex < phases.length) {
            runPhases();
          } else {
            onAnimationComplete();
          }
        }, currentPhase.duration);
      }
    };

    runPhases();
  }, [isVisible, onAnimationComplete]);

  if (!isVisible) return null;

  const getRarityGradient = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'bronze': return 'from-amber-400 via-amber-500 to-amber-600';
      case 'silver': return 'from-gray-300 via-gray-400 to-gray-500';
      case 'gold': return 'from-yellow-400 via-yellow-500 to-yellow-600';
      case 'platinum': return 'from-purple-400 via-purple-500 to-purple-600';
      case 'diamond': return 'from-red-400 via-orange-500 to-yellow-500';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  const getRarityGlow = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'bronze': return 'shadow-amber-500/50';
      case 'silver': return 'shadow-gray-400/50';
      case 'gold': return 'shadow-yellow-500/50';
      case 'platinum': return 'shadow-purple-500/50';
      case 'diamond': return 'shadow-orange-500/50';
      default: return 'shadow-gray-500/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r ${getRarityGradient(badgeRarity)} rounded-full opacity-70 animate-ping`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main animation container */}
      <div 
        className={`relative transform transition-all duration-800 ease-out ${
          animationPhase === 'entrance' 
            ? 'scale-0 rotate-180 opacity-0' 
            : animationPhase === 'showcase'
            ? 'scale-100 rotate-0 opacity-100'
            : 'scale-75 opacity-0'
        }`}
      >
        {/* Outer rotating ring */}
        <div className={`absolute inset-0 rounded-full border-4 border-gradient-to-r ${getRarityGradient(badgeRarity)} animate-spin`} 
             style={{ width: '200px', height: '200px', margin: '-100px' }}
        />
        
        {/* Inner pulsing glow */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getRarityGradient(badgeRarity)} opacity-20 animate-pulse blur-xl`}
             style={{ width: '300px', height: '300px', margin: '-150px' }}
        />

        {/* Main content card */}
        <div className={`relative bg-white rounded-2xl shadow-2xl ${getRarityGlow(badgeRarity)} p-8 max-w-md mx-4 text-center transform ${
          animationPhase === 'showcase' ? 'animate-pulse' : ''
        }`}>
          
          {/* Completion icon with rotation */}
          <div className="relative mb-6">
            <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-r ${getRarityGradient(badgeRarity)} flex items-center justify-center text-white text-4xl shadow-lg transform ${
              animationPhase === 'showcase' ? 'animate-spin-slow' : ''
            }`}>
              {questIcon}
            </div>
            
            {/* Sparkles around the icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(8)].map((_, i) => (
                <Sparkles
                  key={i}
                  className={`absolute w-6 h-6 text-yellow-400 opacity-80 animate-ping`}
                  style={{
                    transform: `rotate(${i * 45}deg) translateY(-50px)`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Quest completion text */}
          <div className="space-y-4">
            <div className="text-green-600 font-bold text-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 mr-2 animate-bounce" />
              QUEST COMPLETED!
            </div>
            
            <h3 className="text-2xl font-bold text-[#0F172A]">{questTitle}</h3>
            
            {/* Badge rarity indicator */}
            <div className="flex items-center justify-center">
              <div className={`px-4 py-2 rounded-full ${getRarityColor(badgeRarity)} flex items-center gap-2 font-semibold transform ${
                animationPhase === 'showcase' ? 'animate-bounce' : ''
              }`}>
                <Award className="w-4 h-4" />
                {badgeRarity.toUpperCase()} BADGE EARNED
              </div>
            </div>

            {/* Points earned */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-center text-green-700">
                <Star className="w-5 h-5 mr-2 animate-spin" />
                <span className="text-lg font-bold">+{pointsEarned} Points Earned!</span>
              </div>
            </div>

            {/* Celebration elements */}
            <div className="flex items-center justify-center space-x-4 text-[#303644]">
              <Zap className="w-5 h-5 animate-pulse" />
              <span className="font-medium">Amazing Work!</span>
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Additional particle effects around the card */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-gradient-to-r ${getRarityGradient(badgeRarity)} rounded-full animate-ping`}
              style={{
                left: `${25 + Math.random() * 50}%`,
                top: `${25 + Math.random() * 50}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random()}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Add custom animation in globals.css */
const customStyles = `
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
`;