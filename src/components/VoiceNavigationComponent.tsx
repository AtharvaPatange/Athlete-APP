"use client";
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, HelpCircle, X } from 'lucide-react';
import { useVoiceNavigation } from '@/hooks/useVoiceNavigation';

interface VoiceNavigationComponentProps {
  className?: string;
  commands?: Array<{
    command: string;
    action: () => void;
    description: string;
    category: string;
  }>;
  onCommandExecuted?: (command: string) => void;
}

const VoiceNavigationComponent: React.FC<VoiceNavigationComponentProps> = ({
  className = '',
  commands = [],
  onCommandExecuted
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const {
    isListening,
    isSupported,
    transcript,
    lastCommand,
    confidence,
    error,
    toggleListening,
    commands: allCommands,
    speak
  } = useVoiceNavigation({
    commands,
    onCommandExecuted: (command) => {
      onCommandExecuted?.(command);
    }
  });

  // Listen for custom events from voice commands
  useEffect(() => {
    const handleShowHelp = () => setShowHelp(true);
    
    window.addEventListener('voice-show-help', handleShowHelp);
    
    return () => {
      window.removeEventListener('voice-show-help', handleShowHelp);
    };
  }, []);

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (soundEnabled) {
      // Disable speech synthesis
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    } else {
      speak('Voice feedback enabled');
    }
  };

  const handleShowHelp = () => {
    setShowHelp(true);
    if (soundEnabled) {
      speak('Here are the available voice commands');
    }
  };

  if (!isSupported) {
    return (
      <div className={`fixed bottom-20 right-4 z-50 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm shadow-lg">
          <div className="flex items-center text-red-800">
            <MicOff className="w-4 h-4 mr-2" />
            <div className="text-sm">
              <div className="font-medium mb-1">Voice Navigation Unavailable</div>
              <div className="text-xs">Please use Chrome, Edge, or Chromium-based browser for voice features.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group commands by category
  const groupedCommands = allCommands.reduce((acc: Record<string, typeof allCommands>, command: any) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, typeof allCommands>);

  return (
    <>
      {/* Main Voice Control Button */}
      <div className={`fixed bottom-20 right-4 z-50 ${className}`}>
        <div className="flex flex-col items-end space-y-2">
          {/* Transcript Display */}
          {(isListening && transcript) && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 max-w-xs">
              <div className="text-xs text-gray-600 mb-1">Listening...</div>
              <div className="text-sm font-medium text-gray-900">{transcript}</div>
              {confidence > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
          )}

          {/* Last Command Display */}
          {lastCommand && !isListening && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 max-w-xs">
              <div className="text-sm font-medium text-green-800">
                Last command: "{lastCommand}"
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className={`rounded-lg p-2 max-w-xs border ${
              error.includes('Network') || error.includes('network') 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-sm font-medium ${
                error.includes('Network') || error.includes('network')
                  ? 'text-orange-800'
                  : 'text-red-800'
              }`}>
                {error}
              </div>
              {(error.includes('Network') || error.includes('network')) && (
                <div className="text-xs text-orange-600 mt-1">
                  Try clicking the microphone again or check your internet connection.
                </div>
              )}
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-full shadow-lg transition-colors ${
                soundEnabled 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-400 hover:bg-gray-500 text-white'
              }`}
              title={soundEnabled ? 'Disable voice feedback' : 'Enable voice feedback'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Help Button */}
            <button
              onClick={handleShowHelp}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg transition-colors"
              title="Show voice commands"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Main Microphone Button */}
            <button
              onClick={toggleListening}
              className={`p-3 rounded-full shadow-xl transition-all transform hover:scale-105 ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title={isListening ? 'Stop voice recognition' : 'Start voice recognition'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          {/* Status Text */}
          <div className="text-xs text-gray-500 text-center">
            {isListening ? 'Listening...' : 'Click to start voice navigation'}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Mic className="w-6 h-6 mr-2 text-green-600" />
                  Voice Commands
                </h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Click the microphone button to start listening</li>
                  <li>2. Speak clearly and say one of the commands below</li>
                  <li>3. Wait for the command to be executed</li>
                  <li>4. Say "stop listening" to stop voice recognition</li>
                </ol>
              </div>

              {/* Command Categories */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        category === 'Navigation' ? 'bg-blue-500' :
                        category === 'Dashboard' ? 'bg-green-500' :
                        category === 'Control' ? 'bg-purple-500' :
                        category === 'Account' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></span>
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {(categoryCommands as Array<{command: string; description: string}>).map((command, index) => (
                        <div key={index} className="bg-white rounded p-3 border border-gray-200">
                          <div className="font-mono text-sm text-gray-900 font-medium">
                            "{command.command}"
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {command.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowHelp(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceNavigationComponent;