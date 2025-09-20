"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { 
  HiChatBubbleLeftRight, 
  HiFire, 
  HiHeart, 
  HiMiniUserGroup, 
  HiAcademicCap,
  HiUsers,
  HiArrowLeft,
  HiPaperAirplane,
  HiWifi,
  HiExclamationTriangle
} from "react-icons/hi2";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  userType: string;
  roomId: string;
}

interface ConnectedUser {
  username: string;
  userType: string;
  joinTime: number;
  roomId: string;
}

interface TypingUser {
  username: string;
  isTyping: boolean;
}

let socket: Socket;

const rooms = [
  { 
    id: 'general', 
    name: 'General', 
    icon: HiChatBubbleLeftRight, 
    description: 'General discussion',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    hoverColor: 'hover:bg-blue-50'
  },
  { 
    id: 'training', 
    name: 'Training', 
    icon: HiFire, 
    description: 'Training discussions',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    hoverColor: 'hover:bg-orange-50'
  },
  { 
    id: 'nutrition', 
    name: 'Nutrition', 
    icon: HiHeart, 
    description: 'Nutrition advice',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    hoverColor: 'hover:bg-green-50'
  },
  { 
    id: 'injuries', 
    name: 'Injuries', 
    icon: HiMiniUserGroup, 
    description: 'Injury prevention & recovery',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    hoverColor: 'hover:bg-red-50'
  },
  { 
    id: 'coaches', 
    name: 'Coaches', 
    icon: HiAcademicCap, 
    description: 'Coach discussions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    hoverColor: 'hover:bg-purple-50'
  },
  { 
    id: 'athletes', 
    name: 'Athletes', 
    icon: HiUsers, 
    description: 'Athlete discussions',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    hoverColor: 'hover:bg-indigo-50'
  }
];

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string>('general');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user profile from database
  useEffect(() => {
    const loadUserProfile = async () => {
      // Wait for auth loading to complete
      if (loading) {
        return;
      }
      
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          // Create a basic profile if none exists
          console.log('Chat: No profile found in database, using default');
          setUserProfile({
            name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            role: 'athlete',
            email: user.email
          });
        }
      } catch (error) {
        console.error("Chat: Error loading user profile:", error);
        setUserProfile({
          name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          role: 'athlete',
          email: user.email
        });
      } finally {
        console.log('Chat: Profile loading complete');
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !userProfile || isLoadingProfile) {
      return;
    }

    // Initialize socket connection with retry logic
    socket = io({
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Connected to chat server:", socket.id);
      setIsConnected(true);
      
      // Join the chat with user info from profile
      socket.emit('user-join', {
        username: userProfile.name || user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userType: userProfile.role || 'athlete',
        roomId: currentRoom
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from chat server:", reason);
      setIsConnected(false);
      
      // Add system message about disconnection
      const disconnectMessage: ChatMessage = {
        id: `disconnect-${Date.now()}`,
        username: 'System',
        message: 'Connection lost. Attempting to reconnect...',
        timestamp: Date.now(),
        userType: 'system',
        roomId: currentRoom
      };
      setMessages(prev => [...prev, disconnectMessage]);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      
      // Add system message about reconnection
      const reconnectMessage: ChatMessage = {
        id: `reconnect-${Date.now()}`,
        username: 'System',
        message: 'Reconnected to chat server!',
        timestamp: Date.now(),
        userType: 'system',
        roomId: currentRoom
      };
      setMessages(prev => [...prev, reconnectMessage]);
      
      // Rejoin the room
      socket.emit('user-join', {
        username: userProfile.name || user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userType: userProfile.role || 'athlete',
        roomId: currentRoom
      });
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
      
      // Add system message about connection error
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        username: 'System',
        message: 'Unable to connect to chat server. Please check your internet connection.',
        timestamp: Date.now(),
        userType: 'system',
        roomId: currentRoom
      };
      setMessages(prev => [...prev, errorMessage]);
    });

    // Handle general errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
      
      const errorMessage: ChatMessage = {
        id: `socket-error-${Date.now()}`,
        username: 'System',
        message: `Error: ${error}`,
        timestamp: Date.now(),
        userType: 'system',
        roomId: currentRoom
      };
      setMessages(prev => [...prev, errorMessage]);
    });

    // Handle message history when joining
    socket.on("message-history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    // Handle new messages
    socket.on("new-message", (messageData: ChatMessage) => {
      setMessages(prev => [...prev, messageData]);
    });

    // Handle users list updates
    socket.on("users-list", (users: ConnectedUser[]) => {
      setConnectedUsers(users);
    });

    // Handle room joining
    socket.on("room-joined", (data: { roomId: string, messageHistory: ChatMessage[] }) => {
      setCurrentRoom(data.roomId);
      setMessages(data.messageHistory);
    });

    // Handle user join/leave notifications
    socket.on("user-joined", (data: { username: string, userType: string, timestamp: number }) => {
      const notification: ChatMessage = {
        id: `join-${Date.now()}`,
        username: 'System',
        message: `${data.username} joined the chat`,
        timestamp: data.timestamp,
        userType: 'system',
        roomId: currentRoom
      };
      setMessages(prev => [...prev, notification]);
    });

    socket.on("user-left", (data: { username: string, timestamp: number }) => {
      const notification: ChatMessage = {
        id: `leave-${Date.now()}`,
        username: 'System',
        message: `${data.username} left the chat`,
        timestamp: data.timestamp,
        userType: 'system',
        roomId: currentRoom
      };
      setMessages(prev => [...prev, notification]);
    });

    // Handle typing indicators
    socket.on("user-typing", (data: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.username !== data.username);
        if (data.isTyping) {
          return [...filtered, data];
        }
        return filtered;
      });
    });

    return () => {
      socket?.disconnect();
    };
  }, [user, userProfile, isLoadingProfile, currentRoom]);

  // Handle typing indicator
  useEffect(() => {
    if (isTyping) {
      socket?.emit('typing', { isTyping: true });
      const timeout = setTimeout(() => {
        setIsTyping(false);
        socket?.emit('typing', { isTyping: false });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isTyping]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit("send-message", { 
        message: message.trim(),
        roomId: currentRoom 
      });
      setMessage("");
      setIsTyping(false);
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket && roomId !== currentRoom) {
      socket.emit('join-room', { roomId });
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserColor = (userType: string) => {
    switch (userType) {
      case 'admin': return 'text-red-600 font-semibold';
      case 'coach': return 'text-blue-600 font-semibold';
      case 'athlete': return 'text-green-600';
      case 'system': return 'text-gray-500 italic';
      default: return 'text-gray-700';
    }
  };

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-semibold">Checking Authentication...</div>
          <div className="text-gray-600">Please wait</div>
        </div>
      </div>
    );
  }

  // Show authentication required only after loading is complete
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Authentication Required</div>
          <div className="text-gray-600 mb-4">Please log in to access the chat.</div>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading while profile is being loaded
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-semibold">Loading Chat...</div>
          <div className="text-gray-600">Setting up your profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar with rooms */}
      <div className="w-72 md:w-80 lg:w-72 bg-white shadow-2xl border-r border-gray-200 hidden md:flex md:flex-col">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-800 to-gray-900">
          <h2 className="text-xl font-bold text-white mb-2">Chat Rooms</h2>
          <div className={`text-sm flex items-center gap-2 ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
            <HiWifi className="w-4 h-4" />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {rooms.map((room) => {
              const IconComponent = room.icon;
              const isActive = currentRoom === room.id;
              
              return (
                <button
                  key={room.id}
                  onClick={() => joinRoom(room.id)}
                  className={`w-full text-left p-4 rounded-xl mb-2 transition-all duration-300 transform hover:scale-105 cursor-pointer group ${
                    isActive 
                      ? `${room.bgColor} border-2 border-opacity-50 shadow-lg ${room.color.replace('text-', 'border-')}` 
                      : `hover:bg-gray-50 border-2 border-transparent ${room.hoverColor}`
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${isActive ? 'bg-white bg-opacity-50' : 'bg-gray-100 group-hover:bg-gray-200'} transition-colors`}>
                      <IconComponent className={`w-5 h-5 ${isActive ? room.color : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${isActive ? room.color : 'text-gray-800 group-hover:text-gray-900'}`}>
                        {room.name}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>
                        {room.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Connected Users */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <HiUsers className="w-4 h-4" />
            Online ({connectedUsers.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {connectedUsers.map((connectedUser, index) => (
              <div key={index} className="text-sm text-gray-700 flex items-center p-2 rounded-lg bg-white shadow-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                <span className="font-medium truncate flex-1">{connectedUser.username}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {connectedUser.userType}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="bg-white p-4 md:p-6 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              {(() => {
                const currentRoomData = rooms.find(r => r.id === currentRoom);
                const IconComponent = currentRoomData?.icon;
                return (
                  <div className="flex items-center">
                    <div className={`p-2 md:p-3 rounded-xl mr-3 md:mr-4 ${currentRoomData?.bgColor || 'bg-gray-100'}`}>
                      {IconComponent && <IconComponent className={`w-5 h-5 md:w-6 md:h-6 ${currentRoomData?.color || 'text-gray-600'}`} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">
                        {currentRoomData?.name || 'Chat'}
                      </h1>
                      <div className="text-xs md:text-sm text-gray-600 truncate">
                        {currentRoomData?.description || 'Welcome to the chat'}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full flex items-center gap-1 md:gap-2 ${
                isConnected ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
              }`}>
                <HiWifi className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-3 md:px-6 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-1 md:gap-2 cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
              >
                <HiArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-gradient-to-b from-gray-50 to-white" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${msg.userType === 'system' ? 'text-center' : ''}`}>
              {msg.userType === 'system' ? (
                <div className="text-xs md:text-sm text-gray-500 italic bg-gray-100 px-3 md:px-4 py-2 rounded-full inline-block">
                  {msg.message}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold text-sm md:text-base ${getUserColor(msg.userType)} flex items-center gap-2`}>
                      <div className={`w-2 h-2 rounded-full ${
                        msg.userType === 'admin' ? 'bg-red-500' :
                        msg.userType === 'coach' ? 'bg-blue-500' :
                        msg.userType === 'athlete' ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="text-gray-800 leading-relaxed text-sm md:text-base">{msg.message}</div>
                </div>
              )}
            </div>
          ))}
          
          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="text-xs md:text-sm text-gray-500 italic bg-blue-50 px-3 md:px-4 py-2 rounded-full inline-block animate-pulse">
              {typingUsers.map(u => u.username).join(', ')} 
              {typingUsers.length === 1 ? ' is' : ' are'} typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="bg-white p-3 md:p-6 border-t border-gray-200 shadow-lg">
          <form onSubmit={sendMessage} className="flex space-x-2 md:space-x-4">
            <div className="flex-1 relative">
              <input
                className="w-full border-2 border-gray-200 rounded-xl px-4 md:px-6 py-2 md:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-500 text-sm md:text-base"
                value={message}
                onChange={handleMessageChange}
                placeholder={`Type a message in ${rooms.find(r => r.id === currentRoom)?.name || 'chat'}...`}
                disabled={!isConnected}
              />
              {!isConnected && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <HiExclamationTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!message.trim() || !isConnected}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-8 py-2 md:py-3 rounded-xl font-semibold transition-all duration-300 disabled:cursor-not-allowed cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-1 md:gap-2 text-sm md:text-base"
            >
              <HiPaperAirplane className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Room Selector - visible on small screens */}
      <div className="md:hidden fixed bottom-20 right-4 z-50">
        <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2">
          <select 
            value={currentRoom}
            onChange={(e) => joinRoom(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium cursor-pointer"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}