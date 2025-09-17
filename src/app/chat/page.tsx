"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

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
  { id: 'general', name: 'General', icon: '💬', description: 'General discussion' },
  { id: 'training', name: 'Training', icon: '🏋️', description: 'Training discussions' },
  { id: 'nutrition', name: 'Nutrition', icon: '🥗', description: 'Nutrition advice' },
  { id: 'injuries', name: 'Injuries', icon: '🏥', description: 'Injury prevention & recovery' },
  { id: 'coaches', name: 'Coaches', icon: '👨‍🏫', description: 'Coach discussions' },
  { id: 'athletes', name: 'Athletes', icon: '🏃', description: 'Athlete discussions' }
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with rooms */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Chat Rooms</h2>
          <div className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
        
        <div className="p-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => joinRoom(room.id)}
              className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                currentRoom === room.id 
                  ? 'bg-blue-100 border border-blue-300' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <span className="text-lg mr-2">{room.icon}</span>
                <div>
                  <div className="font-medium">{room.name}</div>
                  <div className="text-xs text-gray-500">{room.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Connected Users */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Online ({connectedUsers.length})
          </h3>
          <div className="space-y-1">
            {connectedUsers.map((connectedUser, index) => (
              <div key={index} className="text-sm text-gray-700 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                {connectedUser.username}
                <span className="text-xs text-gray-500 ml-1">
                  ({connectedUser.userType})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg mr-2">
                {rooms.find(r => r.id === currentRoom)?.icon}
              </span>
              <div>
                <h1 className="text-lg font-semibold">
                  {rooms.find(r => r.id === currentRoom)?.name}
                </h1>
                <div className="text-sm text-gray-500">
                  {rooms.find(r => r.id === currentRoom)?.description}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`${msg.userType === 'system' ? 'text-center' : ''}`}>
              {msg.userType === 'system' ? (
                <div className="text-sm text-gray-500 italic">
                  {msg.message}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className={getUserColor(msg.userType)}>
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="text-gray-800">{msg.message}</div>
                </div>
              )}
            </div>
          ))}
          
          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="text-sm text-gray-500 italic">
              {typingUsers.map(u => u.username).join(', ')} 
              {typingUsers.length === 1 ? ' is' : ' are'} typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="bg-white p-4 border-t border-gray-200">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={message}
              onChange={handleMessageChange}
              placeholder={`Type a message in ${rooms.find(r => r.id === currentRoom)?.name}...`}
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!message.trim() || !isConnected}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}