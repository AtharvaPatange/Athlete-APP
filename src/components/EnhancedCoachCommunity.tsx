"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  limit
} from "firebase/firestore";
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Calendar, 
  ExternalLink,
  UserPlus,
  Bell,
  Search,
  Activity,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: any;
  room: string;
}

interface Athlete {
  id: string;
  name: string;
  sport: string;
  region: string;
  lastActiveAt?: any;
  priority_level?: 'high' | 'medium' | 'low';
  injury_risk?: 'high' | 'medium' | 'low';
}

interface CoachCommunityProps {
  coachId: string;
  coachName: string;
  coachRegion: string;
}

const EnhancedCoachCommunity = ({ coachId, coachName, coachRegion }: CoachCommunityProps) => {
  const router = useRouter();
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAthletes, setActiveAthletes] = useState(0);
  const [priorityAthletes, setPriorityAthletes] = useState(0);

  // Fetch recent messages from chat
  useEffect(() => {
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setRecentMessages(messageData);
    });

    return () => unsubscribe();
  }, []);

  // Fetch athletes in coach's region
  useEffect(() => {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("role", "==", "athlete"),
      where("region", "==", coachRegion)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const athleteData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          sport: data.sport,
          region: data.region,
          lastActiveAt: data.lastActiveAt,
          priority_level: 'medium', // This would be calculated based on real data
          injury_risk: 'low' // This would be calculated based on real data
        };
      }) as Athlete[];
      
      setAthletes(athleteData);
      
      // Calculate stats
      const now = new Date();
      const activeSince = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      const activeCount = athleteData.filter(athlete => {
        const lastActive = athlete.lastActiveAt?.toDate ? athlete.lastActiveAt.toDate() : new Date(athlete.lastActiveAt || 0);
        return lastActive > activeSince;
      }).length;
      
      const priorityCount = athleteData.filter(athlete => athlete.priority_level === 'high').length;
      
      setActiveAthletes(activeCount);
      setPriorityAthletes(priorityCount);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [coachRegion]);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Community Hub</h2>
          <p className="text-gray-600">Connect with athletes and manage communications</p>
        </div>
        
        <Link
          href="/chat"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <MessageSquare className="w-5 h-5" />
          Open Full Chat
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Athletes</p>
              <p className="text-3xl font-bold">{athletes.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Today</p>
              <p className="text-3xl font-bold">{activeAthletes}</p>
            </div>
            <Activity className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Priority Cases</p>
              <p className="text-3xl font-bold">{priorityAthletes}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Messages</p>
              <p className="text-3xl font-bold">{recentMessages.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Chat Activity */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Recent Chat Activity
            </h3>
            <Link
              href="/chat"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 cursor-pointer"
            >
              View All
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentMessages.length > 0 ? (
              recentMessages.slice(0, 5).map((message) => (
                <div key={message.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      message.userRole === 'coach' ? 'bg-blue-600' :
                      message.userRole === 'athlete' ? 'bg-green-600' :
                      'bg-gray-600'
                    }`}>
                      {message.userName?.charAt(0) || 'U'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {message.userName}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        message.userRole === 'coach' ? 'bg-blue-100 text-blue-800' :
                        message.userRole === 'athlete' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.userRole}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{message.text}</p>
                    <p className="text-xs text-gray-400">{formatTimeAgo(message.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent messages</p>
                <Link
                  href="/chat"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                >
                  Start a conversation
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Athlete Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Athlete Status
            </h3>
            <button className="text-green-600 hover:text-green-700 text-sm font-medium cursor-pointer">
              View All Athletes
            </button>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : athletes.length > 0 ? (
              athletes.slice(0, 6).map((athlete) => (
                <div key={athlete.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-medium">
                      {athlete.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{athlete.name}</p>
                      <p className="text-xs text-gray-500">{athlete.sport} • {athlete.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      athlete.injury_risk === 'high' ? 'bg-red-100 text-red-800' :
                      athlete.injury_risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {athlete.injury_risk === 'low' ? <CheckCircle className="w-3 h-3" /> : 
                       <AlertTriangle className="w-3 h-3" />}
                      {athlete.injury_risk}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No athletes in your region</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/chat"
            className="flex items-center space-x-3 bg-white p-4 rounded-lg hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Join Chat Rooms</p>
              <p className="text-sm text-gray-600">Connect with athletes</p>
            </div>
          </Link>

          <button className="flex items-center space-x-3 bg-white p-4 rounded-lg hover:shadow-md transition-all cursor-pointer group">
            <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Schedule Session</p>
              <p className="text-sm text-gray-600">Book training time</p>
            </div>
          </button>

          <button className="flex items-center space-x-3 bg-white p-4 rounded-lg hover:shadow-md transition-all cursor-pointer group">
            <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Send Announcement</p>
              <p className="text-sm text-gray-600">Notify all athletes</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCoachCommunity;