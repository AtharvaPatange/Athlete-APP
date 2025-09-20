import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Type definitions for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
  category: string;
}

interface VoiceNavigationState {
  isListening: boolean;
  isSupported: boolean;
  lastCommand: string;
  transcript: string;
  confidence: number;
  error: string | null;
}

interface UseVoiceNavigationProps {
  commands?: VoiceCommand[];
  onCommandExecuted?: (command: string) => void;
  onTranscriptChange?: (transcript: string) => void;
}

export const useVoiceNavigation = ({
  commands = [],
  onCommandExecuted,
  onTranscriptChange
}: UseVoiceNavigationProps = {}) => {
  const router = useRouter();
  const [state, setState] = useState<VoiceNavigationState>({
    isListening: false,
    isSupported: false,
    lastCommand: '',
    transcript: '',
    confidence: 0,
    error: null
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const lastCommandTimeRef = useRef<number>(0);
  const maxRetries = 2;

  // Default navigation commands
  const defaultCommands: VoiceCommand[] = [
    // Dashboard navigation - Simple keywords
    {
      command: 'dashboard',
      action: () => router.push('/dashboard'),
      description: 'Navigate to dashboard',
      category: 'Navigation'
    },
    {
      command: 'overview',
      action: () => {
        const event = new CustomEvent('voice-tab-change', { detail: 'overview' });
        window.dispatchEvent(event);
      },
      description: 'Switch to overview tab',
      category: 'Dashboard'
    },
    {
      command: 'performance',
      action: () => {
        const event = new CustomEvent('voice-tab-change', { detail: 'performance' });
        window.dispatchEvent(event);
      },
      description: 'Switch to performance tab',
      category: 'Dashboard'
    },
    {
      command: 'transparency',
      action: () => {
        const event = new CustomEvent('voice-tab-change', { detail: 'transparency' });
        window.dispatchEvent(event);
      },
      description: 'Switch to transparency tab',
      category: 'Dashboard'
    },
    // General navigation - Simple keywords
    {
      command: 'chat',
      action: () => router.push('/chat'),
      description: 'Navigate to community chat',
      category: 'Navigation'
    },
    {
      command: 'community',
      action: () => router.push('/chat'),
      description: 'Navigate to community chat',
      category: 'Navigation'
    },
    {
      command: 'coach',
      action: () => router.push('/coach'),
      description: 'Navigate to coach dashboard',
      category: 'Navigation'
    },
    {
      command: 'athlete',
      action: () => router.push('/athlete'),
      description: 'Navigate to athlete profile',
      category: 'Navigation'
    },
    {
      command: 'admin',
      action: () => router.push('/admin'),
      description: 'Navigate to admin panel',
      category: 'Navigation'
    },
    {
      command: 'home',
      action: () => router.push('/'),
      description: 'Navigate to home page',
      category: 'Navigation'
    },
    // Performance & Training Navigation
    {
      command: 'training',
      action: () => {
        const combinedEvent = new CustomEvent('voice-navigation-combined', { 
          detail: { section: 'performance', subTab: 'log' } 
        });
        window.dispatchEvent(combinedEvent);
      },
      description: 'Switch to training log',
      category: 'Performance'
    },
    {
      command: 'log training',
      action: () => {
        const performanceEvent = new CustomEvent('voice-tab-change', { detail: 'performance' });
        window.dispatchEvent(performanceEvent);
        setTimeout(() => {
          const trainingEvent = new CustomEvent('voice-performance-tab-change', { detail: 'log' });
          window.dispatchEvent(trainingEvent);
        }, 200);
      },
      description: 'Switch to training log',
      category: 'Performance'
    },
    {
      command: 'analytics',
      action: () => {
        const performanceEvent = new CustomEvent('voice-tab-change', { detail: 'performance' });
        window.dispatchEvent(performanceEvent);
        setTimeout(() => {
          const analyticsEvent = new CustomEvent('voice-performance-tab-change', { detail: 'analytics' });
          window.dispatchEvent(analyticsEvent);
        }, 200);
      },
      description: 'Switch to analytics view',
      category: 'Performance'
    },
    {
      command: 'history',
      action: () => {
        const performanceEvent = new CustomEvent('voice-tab-change', { detail: 'performance' });
        window.dispatchEvent(performanceEvent);
        setTimeout(() => {
          const historyEvent = new CustomEvent('voice-performance-tab-change', { detail: 'sessions' });
          window.dispatchEvent(historyEvent);
        }, 200);
      },
      description: 'Switch to training history',
      category: 'Performance'
    },
    {
      command: 'nutrition',
      action: () => {
        console.log('Voice: Executing nutrition command');
        // Create a combined event that handles both navigation steps
        const combinedEvent = new CustomEvent('voice-navigation-combined', { 
          detail: { section: 'performance', subTab: 'nutrition' } 
        });
        window.dispatchEvent(combinedEvent);
      },
      description: 'Switch to nutrition dashboard',
      category: 'Performance'
    },
    {
      command: 'scholarships',
      action: () => {
        const performanceEvent = new CustomEvent('voice-tab-change', { detail: 'performance' });
        window.dispatchEvent(performanceEvent);
        setTimeout(() => {
          const scholarshipEvent = new CustomEvent('voice-performance-tab-change', { detail: 'scholarships' });
          window.dispatchEvent(scholarshipEvent);
        }, 200);
      },
      description: 'Switch to scholarships',
      category: 'Opportunities'
    },
    {
      command: 'challenges',
      action: () => {
        console.log('Voice: Switching to challenges');
        const performanceEvent = new CustomEvent('voice-tab-change', { detail: 'performance' });
        window.dispatchEvent(performanceEvent);
        setTimeout(() => {
          console.log('Voice: Setting challenges sub-tab');
          const challengeEvent = new CustomEvent('voice-performance-tab-change', { detail: 'gamification' });
          window.dispatchEvent(challengeEvent);
        }, 200);
      },
      description: 'Switch to challenges',
      category: 'Performance'
    },
    {
      command: 'recovery',
      action: () => {
        const performanceEvent = new CustomEvent('voice-tab-change', { detail: 'performance' });
        window.dispatchEvent(performanceEvent);
        setTimeout(() => {
          const recoveryEvent = new CustomEvent('voice-performance-tab-change', { detail: 'injury' });
          window.dispatchEvent(recoveryEvent);
        }, 200);
      },
      description: 'Switch to recovery tracker',
      category: 'Performance'
    },
    {
      command: 'recovery tracker',
      action: () => {
        const performanceEvent = new CustomEvent('voice-tab-change', { detail: 'performance' });
        window.dispatchEvent(performanceEvent);
        setTimeout(() => {
          const recoveryEvent = new CustomEvent('voice-performance-tab-change', { detail: 'injury' });
          window.dispatchEvent(recoveryEvent);
        }, 200);
      },
      description: 'Switch to recovery tracker',
      category: 'Performance'
    },
    {
      command: 'logout',
      action: () => {
        const event = new CustomEvent('voice-logout');
        window.dispatchEvent(event);
      },
      description: 'Log out from the application',
      category: 'Account'
    },
    // Coach dashboard specific commands
    {
      command: 'athletes',
      action: () => {
        const event = new CustomEvent('voice-tab-change', { detail: 'athletes' });
        window.dispatchEvent(event);
      },
      description: 'Switch to athletes view',
      category: 'Coach Dashboard'
    },
    {
      command: 'coach analytics',
      action: () => {
        const event = new CustomEvent('voice-tab-change', { detail: 'analytics' });
        window.dispatchEvent(event);
      },
      description: 'Switch to coach analytics view',
      category: 'Coach Dashboard'
    },
    {
      command: 'injuries',
      action: () => {
        const event = new CustomEvent('voice-tab-change', { detail: 'injuries' });
        window.dispatchEvent(event);
      },
      description: 'Switch to injury management',
      category: 'Coach Dashboard'
    },
    {
      command: 'toggle availability',
      action: () => {
        const event = new CustomEvent('voice-availability', { detail: 'toggle' });
        window.dispatchEvent(event);
      },
      description: 'Toggle your availability status',
      category: 'Coach Actions'
    },
    // Control commands
    {
      command: 'stop listening',
      action: () => {
        // Will be handled by the component
      },
      description: 'Stop voice recognition',
      category: 'Control'
    },
    {
      command: 'help',
      action: () => {
        const event = new CustomEvent('voice-show-help');
        window.dispatchEvent(event);
      },
      description: 'Show available voice commands',
      category: 'Control'
    },
    {
      command: 'show commands',
      action: () => {
        const event = new CustomEvent('voice-show-help');
        window.dispatchEvent(event);
      },
      description: 'Show available voice commands',
      category: 'Control'
    }
  ];

  // Combine default and custom commands
  const allCommands = [...defaultCommands, ...commands];

  // Initialize speech recognition with network error handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        try {
          recognitionRef.current = new SpeechRecognition();
          
          if (recognitionRef.current) {
            // Configure for better network handling
            recognitionRef.current.continuous = false; // Prevent long-running network connections
            recognitionRef.current.interimResults = false; // Reduce network requests
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.maxAlternatives = 1;

            recognitionRef.current.onstart = () => {
              setState(prev => ({ 
                ...prev, 
                isListening: true, 
                error: null,
                transcript: '' 
              }));
              retryCountRef.current = 0;
            };

            recognitionRef.current.onend = () => {
              setState(prev => ({ ...prev, isListening: false }));
            };

            recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
              let errorMessage = '';
              let shouldRetry = false;
              
              switch (event.error) {
                case 'network':
                  if (retryCountRef.current < maxRetries) {
                    errorMessage = 'Connection issue. Retrying...';
                    shouldRetry = true;
                  } else {
                    errorMessage = 'Network error. Please check your connection or try offline mode.';
                  }
                  break;
                case 'not-allowed':
                  errorMessage = 'Microphone access denied. Please allow microphone permissions.';
                  break;
                case 'no-speech':
                  errorMessage = 'No speech detected. Please try again.';
                  shouldRetry = true;
                  break;
                case 'aborted':
                  errorMessage = 'Voice recognition stopped.';
                  break;
                case 'audio-capture':
                  errorMessage = 'Audio capture failed. Check your microphone.';
                  break;
                case 'service-not-allowed':
                  errorMessage = 'Voice service temporarily unavailable.';
                  shouldRetry = true;
                  break;
                default:
                  errorMessage = `Error: ${event.error}`;
                  shouldRetry = true;
              }
              
              setState(prev => ({ 
                ...prev, 
                isListening: false, 
                error: errorMessage 
              }));
              
              // Auto-retry with delay for certain errors
              if (shouldRetry && retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                setTimeout(() => {
                  setState(prev => ({ ...prev, error: null }));
                  // Will be retried when user clicks microphone again
                }, 2000);
              }
            };

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
              let transcript = '';
              let confidence = 0;

              for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript = event.results[i][0].transcript.toLowerCase().trim();
                confidence = event.results[i][0].confidence || 0.8;
                
                if (event.results[i].isFinal) {
                  processCommand(transcript, confidence);
                  // Stop recognition after processing to prevent continuous listening
                  setTimeout(() => {
                    if (recognitionRef.current && state.isListening) {
                      recognitionRef.current.stop();
                    }
                  }, 100);
                }
              }

              setState(prev => ({ 
                ...prev, 
                transcript,
                confidence
              }));
              
              onTranscriptChange?.(transcript);
            };
          }

          setState(prev => ({ ...prev, isSupported: true }));
        } catch (error) {
          console.error('Speech recognition setup failed:', error);
          setState(prev => ({ 
            ...prev, 
            isSupported: false, 
            error: 'Voice recognition initialization failed.' 
          }));
        }
      } else {
        setState(prev => ({ 
          ...prev, 
          isSupported: false, 
          error: 'Voice recognition not supported. Please use Chrome or Edge browser.' 
        }));
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Process voice command with improved matching
  const processCommand = useCallback((transcript: string, confidence: number) => {
    // Stricter validation - higher confidence and minimum length
    if (confidence < 0.7 || transcript.length < 3) return; 
    
    // Prevent rapid consecutive commands (2 second cooldown)
    const now = Date.now();
    if (now - lastCommandTimeRef.current < 2000) {
      return;
    }
    
    // Clean transcript - remove extra spaces and common filler words
    const cleanTranscript = transcript.toLowerCase()
      .replace(/\b(um|uh|er|ah)\b/g, '') // Remove filler words
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    if (cleanTranscript.length < 3) return; // Check again after cleaning

    // Find matching command with keyword-focused criteria
    const matchedCommand = allCommands.find(cmd => {
      const commandWords = cmd.command.toLowerCase().split(' ');
      const transcriptWords = cleanTranscript.split(' ');
      
      // For single-word commands (keywords), check for exact or close match
      if (commandWords.length === 1) {
        const keyword = commandWords[0];
        return transcriptWords.some(tWord => {
          // Exact match
          if (tWord === keyword) return true;
          
          // Close match for longer words (allow 1-2 character difference)
          if (keyword.length >= 4 && Math.abs(keyword.length - tWord.length) <= 2) {
            return tWord.includes(keyword.slice(0, -1)) || keyword.includes(tWord.slice(0, -1));
          }
          
          // Partial match for very similar words
          if (keyword.length >= 5 && tWord.length >= 5) {
            const commonLength = Math.min(keyword.length, tWord.length);
            const matchingChars = keyword.slice(0, commonLength) === tWord.slice(0, commonLength);
            return matchingChars && Math.abs(keyword.length - tWord.length) <= 1;
          }
          
          return false;
        });
      }
      
      // For multi-word commands, require exact phrase match or high similarity
      if (commandWords.length > 1) {
        // Exact phrase match
        if (cleanTranscript.includes(cmd.command.toLowerCase())) {
          return true;
        }
        
        // All words must be present for multi-word commands
        const matchingWords = commandWords.filter(word => {
          if (word.length <= 2) return true; // Skip very short words like "to"
          return transcriptWords.some(tWord => 
            tWord === word || 
            (word.length >= 4 && tWord.includes(word))
          );
        });
        
        return matchingWords.length === commandWords.length;
      }
      
      return false;
    });

    if (matchedCommand) {
      // Update last command time to prevent rapid execution
      lastCommandTimeRef.current = now;
      
      setState(prev => ({ 
        ...prev, 
        lastCommand: matchedCommand.command,
        transcript: '',
        error: null
      }));
      
      // Quick audio feedback
      speak(`Executing: ${matchedCommand.command}`);
      
      // Execute command
      try {
        if (matchedCommand.command === 'stop listening') {
          stopListening();
        } else {
          matchedCommand.action();
        }
        onCommandExecuted?.(matchedCommand.command);
      } catch (error) {
        console.error('Command execution error:', error);
        speak('Command failed to execute.');
      }
    } else if (cleanTranscript.length >= 5) { // Only show error for longer transcripts
      setState(prev => ({ ...prev, error: `"${cleanTranscript}" not recognized` }));
      setTimeout(() => setState(prev => ({ ...prev, error: null })), 3000);
    }
  }, [allCommands, onCommandExecuted]);

  // Improved text-to-speech
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window && text.trim()) {
      speechSynthesis.cancel(); // Cancel any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1;
      utterance.volume = 0.6;
      utterance.lang = 'en-US';
      
      // Ensure it works by adding a small delay
      setTimeout(() => {
        speechSynthesis.speak(utterance);
      }, 50);
    }
  }, []);

  // Start listening with network-aware approach
  const startListening = useCallback(() => {
    if (!state.isSupported || !recognitionRef.current) {
      setState(prev => ({ 
        ...prev, 
        error: 'Voice recognition not supported. Use Chrome or Edge browser.' 
      }));
      return;
    }

    if (state.isListening) {
      stopListening();
      return;
    }

    try {
      // Reset state
      setState(prev => ({ ...prev, error: null, transcript: '' }));
      retryCountRef.current = 0;
      
      recognitionRef.current.start();
      
      // Auto-stop after shorter duration to prevent network issues
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 8000); // 8 seconds instead of 30
      
    } catch (error) {
      console.error('Start listening failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start. Please try again.' 
      }));
    }
  }, [state.isSupported, state.isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Ignore stop errors
      }
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState(prev => ({ ...prev, isListening: false, transcript: '' }));
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    commands: allCommands,
    speak
  };
};

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

export default useVoiceNavigation;