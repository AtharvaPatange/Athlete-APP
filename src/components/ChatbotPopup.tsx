"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, X, MessageCircle, Minimize2, Maximize2, User, Users } from "lucide-react"
import ReactMarkdown from "react-markdown"
import "./App.css"

type ChatMessage = {
  sender: "user" | "bot"
  text: string
}

type WeatherData = {
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  city: string
  country: string
  feelsLike: number
  visibility: number
}

type UserRole = "athlete" | "coach"

const GEMINI_API_KEY = "AIzaSyAerBoGRKAl_AMK4uGDG1re1u86sNxa28o"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
const OPENWEATHER_API_KEY = "2bed468ad9cd7cec460b4ec6dfd2f58c"
const OPENWEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"

const VOICE_LANG_CODES = {
  english: "en-US",
  spanish: "es-ES",
  french: "fr-FR",
  german: "de-DE",
  hindi: "hi-IN",
  marathi: "mr-IN",
  gujarati: "gu-IN",
  bengali: "bn-IN",
  tamil: "ta-IN",
  japanese: "ja-JP"
} as const

const VOICE_NAMES = {
  english: "en-US-Wavenet-D",
  spanish: "es-ES-Wavenet-A",
  french: "fr-FR-Wavenet-A",
  german: "de-DE-Wavenet-A",
  hindi: "hi-IN-Wavenet-A",
  marathi: "mr-IN-Wavenet-A",
  gujarati: "gu-IN-Wavenet-A",
  bengali: "bn-IN-Wavenet-A",
  tamil: "ta-IN-Wavenet-A",
  japanese: "ja-JP-Wavenet-A"
} as const

const STT_LANG_CODES = {
  english: "en-US",
  spanish: "es-ES",
  french: "fr-FR",
  german: "de-DE",
  hindi: "hi-IN",
  marathi: "mr-IN",
  gujarati: "gu-IN",
  bengali: "bn-IN",
  tamil: "ta-IN",
  japanese: "ja-JP"
} as const

const ChatbotPopup = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState("")
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [language, setLanguage] = useState<keyof typeof STT_LANG_CODES>("english")
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [userRole, setUserRole] = useState<UserRole>("athlete")

  const toggleChatbot = () => {
    console.log('Chatbot toggle clicked, current state:', isOpen)
    setIsOpen(!isOpen)
    if (isOpen) {
      setIsMinimized(false)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  // Cleanup on component unmount to ensure page accessibility
  useEffect(() => {
    return () => {
      // Always restore body scroll on unmount
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.maxAlternatives = 1

      recognitionInstance.onstart = () => setIsListening(true)
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }
      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
        alert("Speech recognition error: " + event.error)
      }
      recognitionInstance.onend = () => setIsListening(false)
      setRecognition(recognitionInstance)
    }

    // Get user's location for weather data
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.log("Location access denied or unavailable:", error)
          // Fallback to a default location (Mumbai, India)
          setUserLocation({ lat: 19.0760, lon: 72.8777 })
        }
      )
    } else {
      // Fallback location
      setUserLocation({ lat: 19.0760, lon: 72.8777 })
    }
  }, [])

  // Handle keyboard events for popup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setIsMinimized(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Always ensure body scroll is restored
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Fetch weather data when location is available
  useEffect(() => {
    if (userLocation) {
      fetchWeatherData(userLocation.lat, userLocation.lon)
    }
  }, [userLocation])

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `${OPENWEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      )
      const data = await response.json()
      
      if (response.ok) {
        setWeatherData({
          temperature: Math.round(data.main.temp),
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          city: data.name,
          country: data.sys.country,
          feelsLike: Math.round(data.main.feels_like),
          visibility: data.visibility / 1000 // Convert to km
        })
      }
    } catch (error) {
      console.error("Weather fetch error:", error)
    }
  }

  const fetchWeatherByCity = async (cityName: string) => {
    try {
      const response = await fetch(
        `${OPENWEATHER_API_URL}?q=${cityName}&appid=${OPENWEATHER_API_KEY}&units=metric`
      )
      const data = await response.json()
      
      if (response.ok) {
        return {
          temperature: Math.round(data.main.temp),
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          city: data.name,
          country: data.sys.country,
          feelsLike: Math.round(data.main.feels_like),
          visibility: data.visibility / 1000
        }
      }
      return null
    } catch (error) {
      console.error("Weather fetch error:", error)
      return null
    }
  }

  const isWeatherQuery = (text: string) => {
    const weatherKeywords = [
      'weather', 'temperature', 'rain', 'storm', 'wind', 'humidity', 'climate',
      'मौसम', 'बारिश', 'तापमान', 'हवा',
      'हवामान', 'पाऊस', 'वारा', 'तापमान',
      'હવામાન', 'વરસાદ', 'તાપમાન', 'પવન'
    ]
    return weatherKeywords.some(keyword => text.toLowerCase().includes(keyword))
  }

  const extractCityFromQuery = (text: string) => {
    const cityPatterns = [
      /weather in ([a-zA-Z\s]+)/i,
      /([a-zA-Z\s]+) weather/i,
      /temperature in ([a-zA-Z\s]+)/i,
      /climate of ([a-zA-Z\s]+)/i
    ]
    
    for (const pattern of cityPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    return null
  }

  const formatWeatherInfo = (weather: WeatherData, requestedCity?: string) => {
    const weatherTranslations = {
      english: {
        current: "Current Weather",
        in: "in",
        temperature: "Temperature",
        feels_like: "Feels like",
        condition: "Condition",
        humidity: "Humidity",
        wind_speed: "Wind Speed",
        visibility: "Visibility",
        safety_tips: "Weather Safety Tips"
      },
      spanish: {
        current: "Clima Actual",
        in: "en",
        temperature: "Temperatura",
        feels_like: "Se siente como",
        condition: "Condición",
        humidity: "Humedad",
        wind_speed: "Velocidad del Viento",
        visibility: "Visibilidad",
        safety_tips: "Consejos de Seguridad del Clima"
      },
      french: {
        current: "Météo Actuelle",
        in: "à",
        temperature: "Température",
        feels_like: "Ressenti",
        condition: "Condition",
        humidity: "Humidité",
        wind_speed: "Vitesse du Vent",
        visibility: "Visibilité",
        safety_tips: "Conseils de Sécurité Météo"
      },
      german: {
        current: "Aktuelles Wetter",
        in: "in",
        temperature: "Temperatur",
        feels_like: "Gefühlt",
        condition: "Zustand",
        humidity: "Luftfeuchtigkeit",
        wind_speed: "Windgeschwindigkeit",
        visibility: "Sichtweite",
        safety_tips: "Wettersicherheitstipps"
      },
      hindi: {
        current: "वर्तमान मौसम",
        in: "में",
        temperature: "तापमान",
        feels_like: "महसूस होता है",
        condition: "स्थिति",
        humidity: "नमी",
        wind_speed: "हवा की गति",
        visibility: "दृश्यता",
        safety_tips: "मौसम सुरक्षा सुझाव"
      },
      marathi: {
        current: "सध्याचे हवामान",
        in: "मध्ये",
        temperature: "तापमान",
        feels_like: "वाटते",
        condition: "स्थिती",
        humidity: "आर्द्रता",
        wind_speed: "वाऱ्याची गती",
        visibility: "दृश्यता",
        safety_tips: "हवामान सुरक्षा सल्ले"
      },
      gujarati: {
        current: "વર્તમાન હવામાન",
        in: "માં",
        temperature: "તાપમાન",
        feels_like: "લાગે છે",
        condition: "સ્થિતિ",
        humidity: "ભેજ",
        wind_speed: "પવનની ઝડપ",
        visibility: "દૃશ્યતા",
        safety_tips: "હવામાન સલામતી સૂચનો"
      },
      bengali: {
        current: "বর্তমান আবহাওয়া",
        in: "এ",
        temperature: "তাপমাত্রা",
        feels_like: "মনে হয়",
        condition: "অবস্থা",
        humidity: "আর্দ্রতা",
        wind_speed: "বাতাসের গতি",
        visibility: "দৃশ্যমানতা",
        safety_tips: "আবহাওয়া নিরাপত্তা পরামর্শ"
      },
      tamil: {
        current: "தற்போதைய வானிலை",
        in: "இல்",
        temperature: "வெப்பநிலை",
        feels_like: "என உணரப்படுகிறது",
        condition: "நிலை",
        humidity: "ஈரப்பதம்",
        wind_speed: "காற்றின் வேகம்",
        visibility: "காட்சி",
        safety_tips: "வானிலை பாதுகாப்பு குறிப்புகள்"
      },
      japanese: {
        current: "現在の天気",
        in: "の",
        temperature: "気温",
        feels_like: "体感温度",
        condition: "状態",
        humidity: "湿度",
        wind_speed: "風速",
        visibility: "視界",
        safety_tips: "天気の安全のヒント"
      }
    }

    const t = weatherTranslations[language]
    const cityName = requestedCity || weather.city

    return `## ${t.current} ${t.in} ${cityName}, ${weather.country}
**${t.temperature}:** ${weather.temperature}°C (${t.feels_like} ${weather.feelsLike}°C)
**${t.condition}:** ${weather.description}
**${t.humidity}:** ${weather.humidity}%
**${t.wind_speed}:** ${weather.windSpeed} m/s
**${t.visibility}:** ${weather.visibility} km`
  }

  const getRoleSpecificPrompt = (userRole: UserRole) => {
    const rolePrompts = {
      athlete: `You are a specialized AI assistant for athletes. You provide guidance on:
- Training optimization and performance enhancement
- Injury prevention and recovery strategies
- Nutrition and hydration for athletic performance
- Mental preparation and sports psychology
- Equipment and gear recommendations
- Competition preparation and strategy
- Recovery techniques and sleep optimization
- Goal setting and progress tracking
- Sports-specific techniques and form improvement
- Motivation and mental toughness
Focus on practical, actionable advice that helps athletes improve their performance, prevent injuries, and achieve their goals.`,
      
      coach: `You are a specialized AI assistant for sports coaches. You provide guidance on:
- Training program design and periodization
- Athlete development and talent identification
- Team management and leadership strategies
- Performance analysis and data interpretation
- Injury prevention protocols and rehabilitation
- Communication and motivation techniques
- Competition strategy and game planning
- Equipment and facility management
- Sports science and technology integration
- Professional development and certification
Focus on strategic, evidence-based coaching methods that help develop athletes and build successful teams.`
    }
    
    return rolePrompts[userRole]
  }

  const getGeminiReply = async (text: string) => {
    const languageInstructions = {
      english: "Respond ENTIRELY in English language. Do not use any other language.",
      spanish: "Respond ENTIRELY in Spanish language. Do not use any other language.",
      french: "Respond ENTIRELY in French language. Do not use any other language.",
      german: "Respond ENTIRELY in German language. Do not use any other language.",
      hindi: "Respond ENTIRELY in Hindi language. Do not use any other language. Use Devanagari script.",
      marathi: "Respond ENTIRELY in Marathi language. Do not use any other language. Use Devanagari script.",
      gujarati: "Respond ENTIRELY in Gujarati language. Do not use any other language. Use Gujarati script.",
      bengali: "Respond ENTIRELY in Bengali language. Do not use any other language. Use Bengali script.",
      tamil: "Respond ENTIRELY in Tamil language. Do not use any other language. Use Tamil script.",
      japanese: "Respond ENTIRELY in Japanese language. Do not use any other language. Use Japanese script."
    };

    let weatherInfo = ""

    // Check if user is asking about weather in a specific city
    if (isWeatherQuery(text)) {
      const cityName = extractCityFromQuery(text)
      if (cityName) {
        const cityWeather = await fetchWeatherByCity(cityName)
        if (cityWeather) {
          weatherInfo = formatWeatherInfo(cityWeather, cityName)
        }
      } else if (weatherData) {
        weatherInfo = formatWeatherInfo(weatherData)
      }
    }

    let contextualInfo = ""
    // Only include weather context if the user is asking about weather
    if (isWeatherQuery(text) && weatherData) {
      contextualInfo = `Current weather context: Temperature ${weatherData.temperature}°C, ${weatherData.description}, Humidity ${weatherData.humidity}%, Wind ${weatherData.windSpeed} m/s in ${weatherData.city}.`
    }

    const roleSpecificPrompt = getRoleSpecificPrompt(userRole)

    const prompt = `${roleSpecificPrompt}
IMPORTANT LANGUAGE REQUIREMENT: ${languageInstructions[language as keyof typeof languageInstructions]}
${contextualInfo}
User query: ${text}
${weatherInfo ? `Weather Information:\n${weatherInfo}\n\n` : ''}
Provide clear, practical guidance tailored to the ${userRole} role.${isWeatherQuery(text) ? ' Include relevant weather considerations for athletic performance or coaching decisions.' : ''}
Please respond using markdown formatting with:
- **Bold text** for important points
- Bullet points for lists
- Clear headings for different sections
- Proper spacing for readability
CRITICAL: Your ENTIRE response must be in ${language} language only. Do not mix languages or use English words.`
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })
    const data = await response.json()
    const fallbackMessages = {
      english: "Sorry, I couldn't process that.",
      hindi: "माफ़ करें, मैं इसे प्रोसेस नहीं कर सका।",
      marathi: "माफ करा, मी याला प्रक्रिया करू शकलो नाही.",
      gujarati: "માફ કરો, હું આને પ્રક્રિયા કરી શક્યો નથી."
    };
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? fallbackMessages[language as keyof typeof fallbackMessages]
  }

  const speak = async (text: string) => {
    try {
      const ttsResponse = await fetch(
        "https://texttospeech.googleapis.com/v1/text:synthesize?key=AIzaSyCpu960hVq_cy_dZYf1DUVNrBaWJnpBCuk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: VOICE_LANG_CODES[language],
              name: VOICE_NAMES[language],
            },
            audioConfig: { audioEncoding: "MP3" },
          }),
        },
      )
      const ttsData = await ttsResponse.json()
      if (ttsData?.audioContent) {
        const audio = new Audio("data:audio/mp3;base64," + ttsData.audioContent)
        audio.play()
      }
    } catch (err) {
      console.error("TTS Error:", err)
    }
  }

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.lang = STT_LANG_CODES[language]
      recognition.start()
    }
  }
  const stopListening = () => {
    if (recognition && isListening) recognition.stop()
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const userMessage: ChatMessage = { sender: "user", text: input }
    setChat((prev) => [...prev, userMessage])
    setLoading(true)
    try {
      const reply = await getGeminiReply(input)
      const botMessage: ChatMessage = { sender: "bot", text: reply }
      setChat((prev) => [...prev, botMessage])
      await speak(reply)
    } catch (err) {
      console.error(err)
      const errorMessages = {
        english: "Error while talking to the model or TTS.",
        hindi: "मॉडल या TTS से बात करते समय त्रुटि।",
        marathi: "मॉडेल किंवा TTS शी बोलताना त्रुटी।",
        gujarati: "મોડેલ અથવા TTS સાથે વાત કરતી વખતે ભૂલ।"
      };
      alert(errorMessages[language as keyof typeof errorMessages])
    }
    setInput("")
    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) handleSend()
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 z-50 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group border-2"
        style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#0A101F',
          color: 'white',
          padding: '12px',
          borderRadius: '50%',
          border: '2px solid #182031',
          boxShadow: '0 8px 20px rgba(10,16,31,0.2)',
          cursor: 'pointer'
        }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        >
          <MessageCircle size={20} className="text-white" />
        </motion.div>
        
        {/* Pulse ring animation */}
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.7, 0, 0.7]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: '#BCC1C8' }}
        />
        
        {/* Tooltip */}
        <div 
          className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
          style={{ backgroundColor: '#182031' }}
        >
          AthleX
          <div 
            className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent"
            style={{ borderLeftColor: '#182031' }}
          ></div>
        </div>
      </motion.button>

      {/* Chatbot Popup */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - only shows behind popup, doesn't block entire screen */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-transparent z-40 pointer-events-none"
            />
            
            {/* Click outside to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                // Only close if clicking the backdrop, not the popup itself
                if (e.target === e.currentTarget) {
                  setIsOpen(false)
                  setIsMinimized(false)
                }
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                height: isMinimized ? 50 : 450
              }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-24 right-6 z-50 w-80 rounded-xl shadow-lg border overflow-hidden"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#BCC1C8' }}
            >
              {/* Header */}
              <div 
                className="p-3 flex items-center justify-between"
                style={{ backgroundColor: '#0A101F' }}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#BCC1C8' }}
                  >
                    <span 
                      className="font-bold text-xs"
                      style={{ color: '#0A101F' }}
                    >A</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs">AthleX</h3>
                    {weatherData && (
                      <p className="text-white/80 text-xs">{weatherData.temperature}°C {weatherData.city}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleMinimize}
                    className="p-1 rounded hover:opacity-80 transition-colors"
                    style={{ backgroundColor: '#182031' }}
                  >
                    {isMinimized ? (
                      <Maximize2 size={12} className="text-white" />
                    ) : (
                      <Minimize2 size={12} className="text-white" />
                    )}
                  </button>
                  <button
                    onClick={toggleChatbot}
                    className="p-1 rounded hover:opacity-80 transition-colors"
                    style={{ backgroundColor: '#182031' }}
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Chat Content */}
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="h-[370px] flex flex-col"
                >
                  {/* Role Selector - Top Bar */}
                  <div 
                    className="p-2 border-b"
                    style={{ backgroundColor: '#F9FAFB', borderColor: '#BCC1C8' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span 
                        className="text-xs font-medium"
                        style={{ color: '#182031' }}
                      >Select Role:</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUserRole("athlete")}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: userRole === "athlete" ? '#0A101F' : '#BCC1C8',
                          color: userRole === "athlete" ? '#FFFFFF' : '#182031'
                        }}
                      >
                        <User size={12} />
                        Athlete
                      </button>
                      <button
                        onClick={() => setUserRole("coach")}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: userRole === "coach" ? '#0A101F' : '#BCC1C8',
                          color: userRole === "coach" ? '#FFFFFF' : '#182031'
                        }}
                      >
                        <Users size={12} />
                        Coach
                      </button>
                    </div>
                  </div>

                  {/* Language Selector - Compact */}
                  <div 
                    className="p-2 border-b"
                    style={{ backgroundColor: '#F9FAFB', borderColor: '#BCC1C8' }}
                  >
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as keyof typeof STT_LANG_CODES)}
                      className="w-full text-xs border rounded px-2 py-1 focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: '#FFFFFF',
                        borderColor: '#BCC1C8',
                        color: '#182031'
                      }}
                    >
                      <option value="english">🇺🇸 English</option>
                      <option value="spanish">🇪🇸 Spanish</option>
                      <option value="french">🇫🇷 French</option>
                      <option value="german">🇩🇪 German</option>
                      <option value="hindi">🇮🇳 Hindi</option>
                      <option value="marathi">🇮🇳 Marathi</option>
                      <option value="gujarati">🇮🇳 Gujarati</option>
                      <option value="bengali">🇮🇳 Bengali</option>
                      <option value="tamil">🇮🇳 Tamil</option>
                      <option value="japanese">🇯🇵 Japanese</option>
                    </select>
                  </div>

                  {/* Chat Messages */}
                  <div 
                    className="flex-1 overflow-y-auto p-2 space-y-2"
                    style={{ backgroundColor: '#F9FAFB' }}
                  >
                    {chat.length === 0 && (
                      <div className="text-center py-4">
                        <Volume2 
                          size={24} 
                          className="mx-auto mb-1"
                          style={{ color: '#0A101F' }}
                        />
                        <h4 
                          className="font-semibold text-sm mb-1"
                          style={{ color: '#182031' }}
                        >
                          {userRole === "athlete" ? "AthleX" : "Coach AthleX"}
                        </h4>
                        <p 
                          className="text-xs"
                          style={{ color: '#BCC1C8' }}
                        >
                          {userRole === "athlete" 
                            ? "Ask about training, nutrition, recovery, and performance."
                            : "Ask about coaching strategies, team management, and athlete development."
                          }
                        </p>
                      </div>
                    )}

                    {chat.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div 
                          className="max-w-[85%] p-2 rounded-lg"
                          style={{
                            backgroundColor: msg.sender === "user" ? '#0A101F' : '#FFFFFF',
                            color: msg.sender === "user" ? '#FFFFFF' : '#182031',
                            border: msg.sender !== "user" ? `1px solid #BCC1C8` : 'none'
                          }}
                        >
                          <div className="text-xs font-medium mb-1 opacity-70">
                            {msg.sender === "user" ? "You" : "AthleX"}
                          </div>
                          <div className="text-xs">
                            {msg.sender === "user" ? (
                              msg.text
                            ) : (
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div 
                          className="p-2 rounded-lg border"
                          style={{ 
                            backgroundColor: '#FFFFFF',
                            borderColor: '#BCC1C8'
                          }}
                        >
                          <div 
                            className="flex items-center gap-2 text-xs"
                            style={{ color: '#182031' }}
                          >
                            <div 
                              className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                              style={{ borderColor: '#0A101F' }}
                            ></div>
                            Analyzing...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div 
                    className="p-2 border-t"
                    style={{ 
                      backgroundColor: '#F9FAFB',
                      borderColor: '#BCC1C8'
                    }}
                  >
                    <div className="flex gap-1">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 text-xs border rounded px-2 py-1 focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#BCC1C8',
                          color: '#182031'
                        }}
                        placeholder={`Ask about ${userRole === "athlete" ? "training, nutrition..." : "coaching, team management..."}`}
                        disabled={loading || isListening}
                      />
                      <button
                        onClick={isListening ? stopListening : startListening}
                        disabled={loading}
                        className="p-1 rounded transition-colors"
                        style={{
                          backgroundColor: isListening ? '#DC2626' : '#BCC1C8',
                        }}
                      >
                        {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                      </button>
                      <button 
                        onClick={handleSend} 
                        disabled={loading || !input.trim()} 
                        className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                        style={{
                          backgroundColor: '#0A101F',
                          color: '#FFFFFF'
                        }}
                      >
                        {loading ? "..." : "Send"}
                      </button>
                    </div>
                    {isListening && (
                      <p 
                        className="text-xs mt-1"
                        style={{ color: '#DC2626' }}
                      >Listening...</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Minimized State */}
              {isMinimized && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-10 flex items-center justify-center"
                  style={{ backgroundColor: '#F9FAFB' }}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#BCC1C8' }}
                    >
                      <span 
                        className="font-bold text-xs"
                        style={{ color: '#0A101F' }}
                      >A</span>
                    </div>
                    <span 
                      className="text-xs font-medium"
                      style={{ color: '#182031' }}
                    >
                      {userRole === "athlete" ? "Athlete Mode" : "Coach Mode"}
                    </span>
                    <div 
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: '#22C55E' }}
                    ></div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatbotPopup;