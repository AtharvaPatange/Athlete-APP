"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import io, { Socket } from "socket.io-client";

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: any;
  room: string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: "general" | "regional" | "sport" | "coach_only";
  participants: string[];
  region?: string;
  sport?: string;
}

interface CoachCommunityProps {
  coachId: string;
  coachName: string;
  coachRegion: string;
}

const CoachCommunity = ({ coachId, coachName, coachRegion }: CoachCommunityProps) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [activeRoom, setActiveRoom] = useState("general");
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    type: "regional" as "general" | "regional" | "sport" | "coach_only",
    isPrivate: false
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeChat();
    fetchAthletes();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    if (!user) return;

    try {
      // Check if Socket.IO server is available before connecting
      const isServerAvailable = await fetch("http://localhost:3001/health").catch(() => null);
      
      if (!isServerAvailable) {
        console.warn("Chat server not available, running in offline mode");
        setIsConnected(false);
        await loadChatRooms();
        return;
      }

      // Initialize socket connection
      const newSocket = io("http://localhost:3001", {
        auth: {
          userId: user.uid,
          userName: coachName,
          userRole: "coach"
        }
      });

      newSocket.on("connect", () => {
        console.log("Connected to chat server");
        setIsConnected(true);
        newSocket.emit("join-room", activeRoom);
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from chat server");
        setIsConnected(false);
      });

      newSocket.on("message", (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      newSocket.on("previous-messages", (previousMessages: Message[]) => {
        setMessages(previousMessages);
      });

      newSocket.on("online-users", (users: any[]) => {
        setOnlineUsers(users);
      });

      setSocket(newSocket);

      // Load default chat rooms
      await loadChatRooms();

    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  };

  const loadChatRooms = async () => {
    const defaultRooms: ChatRoom[] = [
      {
        id: "general",
        name: "General Chat",
        description: "General discussion for all users",
        type: "general",
        participants: []
      },
      {
        id: `regional-${coachRegion}`,
        name: `${coachRegion.charAt(0).toUpperCase() + coachRegion.slice(1)} Region`,
        description: `Discussion for ${coachRegion} region athletes and coaches`,
        type: "regional",
        participants: [],
        region: coachRegion
      },
      {
        id: "coaches-only",
        name: "Coaches Only",
        description: "Private discussion for coaches",
        type: "coach_only",
        participants: []
      }
    ];

    setChatRooms(defaultRooms);
  };

  const fetchAthletes = async () => {
    try {
      const usersRef = collection(db, "users");
      const athletesQuery = query(
        usersRef,
        where("role", "==", "athlete"),
        where("region", "==", coachRegion)
      );
      
      const snapshot = await getDocs(athletesQuery);
      const athletesList: any[] = [];
      
      snapshot.forEach((doc) => {
        athletesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setAthletes(athletesList);
    } catch (error) {
      console.error("Error fetching athletes:", error);
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !socket || !isConnected) return;

    const messageData = {
      text: inputMessage.trim(),
      room: activeRoom,
      userId: user?.uid,
      userName: coachName,
      userRole: "coach"
    };

    socket.emit("send-message", messageData);
    setInputMessage("");
  };

  const joinRoom = (roomId: string) => {
    if (socket && roomId !== activeRoom) {
      socket.emit("leave-room", activeRoom);
      socket.emit("join-room", roomId);
      setActiveRoom(roomId);
      setMessages([]);
    }
  };

  const sendDirectMessage = async (athleteId: string) => {
    if (!selectedAthlete || !inputMessage.trim()) return;

    const athlete = athletes.find(a => a.id === athleteId);
    if (!athlete) return;

    try {
      // Create or find existing DM room
      const dmRoomId = [coachId, athleteId].sort().join("-");
      
      const messageData = {
        text: inputMessage.trim(),
        room: dmRoomId,
        userId: coachId,
        userName: coachName,
        userRole: "coach",
        isDirectMessage: true,
        recipientId: athleteId,
        recipientName: athlete.name
      };

      if (socket) {
        socket.emit("send-direct-message", messageData);
      }

      // Also save to Firestore for persistence
      const messagesRef = collection(db, "messages");
      await addDoc(messagesRef, {
        ...messageData,
        timestamp: serverTimestamp()
      });

      setInputMessage("");
    } catch (error) {
      console.error("Error sending direct message:", error);
    }
  };

  const createRoom = async () => {
    try {
      const roomData: ChatRoom = {
        id: `${newRoom.type}-${Date.now()}`,
        name: newRoom.name,
        description: newRoom.description,
        type: newRoom.type,
        participants: [coachId],
        ...(newRoom.type === "regional" && { region: coachRegion })
      };

      // Add to local state
      setChatRooms(prev => [...prev, roomData]);
      
      // Save to Firestore
      const roomsRef = collection(db, "chatRooms");
      await addDoc(roomsRef, {
        ...roomData,
        createdAt: serverTimestamp(),
        createdBy: coachId
      });

      setShowCreateRoom(false);
      setNewRoom({ name: "", description: "", type: "regional", isPrivate: false });
      
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    switch (room.type) {
      case "regional":
        return `🌍 ${room.name}`;
      case "coach_only":
        return `👨‍🏫 ${room.name}`;
      case "sport":
        return `🏆 ${room.name}`;
      default:
        return `💬 ${room.name}`;
    }
  };

  const filteredRooms = chatRooms.filter(room => {
    if (room.type === "coach_only") return true; // Coaches can access all coach rooms
    if (room.type === "regional") return room.region === coachRegion;
    return true; // General rooms accessible to all
  });

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Coach Community
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Chat Rooms</h4>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Create
              </button>
            </div>
            
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => joinRoom(room.id)}
                className={`w-full text-left p-2 rounded-lg mb-1 transition-colors ${
                  activeRoom === room.id
                    ? "bg-blue-100 text-blue-900"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div className="font-medium text-sm">{getRoomDisplayName(room)}</div>
                <div className="text-xs text-gray-500 truncate">{room.description}</div>
              </button>
            ))}
          </div>

          {/* Athletes List for Direct Messages */}
          <div className="border-t border-gray-200 p-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Your Athletes</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {athletes.map((athlete) => (
                <button
                  key={athlete.id}
                  onClick={() => setSelectedAthlete(selectedAthlete === athlete.id ? null : athlete.id)}
                  className={`w-full text-left p-2 rounded text-sm transition-colors ${
                    selectedAthlete === athlete.id
                      ? "bg-green-100 text-green-900"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>{athlete.name}</span>
                  </div>
                  <div className="text-xs text-gray-500">{athlete.sport}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Online Users */}
          {onlineUsers.length > 0 && (
            <div className="border-t border-gray-200 p-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Online ({onlineUsers.length})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {onlineUsers.map((user, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{user.userName}</span>
                    <span className="text-xs bg-gray-200 px-1 rounded">{user.userRole}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {selectedAthlete 
                  ? `Direct Message: ${athletes.find(a => a.id === selectedAthlete)?.name || 'Unknown'}`
                  : chatRooms.find(r => r.id === activeRoom)?.name || 'General Chat'
                }
              </h3>
              <p className="text-sm text-gray-600">
                {selectedAthlete 
                  ? `Private conversation with ${athletes.find(a => a.id === selectedAthlete)?.sport || ''} athlete`
                  : chatRooms.find(r => r.id === activeRoom)?.description || 'Chat with community'
                }
              </p>
            </div>
            {selectedAthlete && (
              <button
                onClick={() => setSelectedAthlete(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.userId === coachId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.userId === coachId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium">
                      {message.userName}
                    </span>
                    {message.userRole && (
                      <span className={`text-xs px-1 rounded ${
                        message.userRole === 'coach' 
                          ? 'bg-purple-100 text-purple-800' 
                          : message.userRole === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {message.userRole}
                      </span>
                    )}
                    <span className="text-xs opacity-75">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (selectedAthlete) {
                    sendDirectMessage(selectedAthlete);
                  } else {
                    sendMessage();
                  }
                }
              }}
              placeholder={
                selectedAthlete 
                  ? `Message ${athletes.find(a => a.id === selectedAthlete)?.name || 'athlete'}...`
                  : "Type your message..."
              }
              disabled={!isConnected}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
            <button
              onClick={selectedAthlete ? () => sendDirectMessage(selectedAthlete) : sendMessage}
              disabled={!inputMessage.trim() || !isConnected}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          {!isConnected && (
            <p className="text-xs text-red-600 mt-1">
              Disconnected from chat server. Trying to reconnect...
            </p>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Chat Room
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter room name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Brief description of the room"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type
                </label>
                <select
                  value={newRoom.type}
                  onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="regional">Regional (Your Region)</option>
                  <option value="coach_only">Coaches Only</option>
                  <option value="sport">Sport Specific</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={createRoom}
                disabled={!newRoom.name.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Room
              </button>
              <button
                onClick={() => {
                  setShowCreateRoom(false);
                  setNewRoom({ name: "", description: "", type: "regional", isPrivate: false });
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachCommunity;