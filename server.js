const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// when using middleware hostname and port must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
const httpServer = createServer(handler);

const io = new Server(httpServer, {
cors: {
origin: "*",
methods: ["GET", "POST"]
}
});

// Store connected users and messages by room
const connectedUsers = new Map();
const messageHistory = new Map(); // roomId -> messages array
const roomUsers = new Map(); // roomId -> Set of socket IDs

// Initialize message history for each room
const rooms = ['general', 'training', 'nutrition', 'injuries', 'coaches', 'athletes'];
rooms.forEach(roomId => {
messageHistory.set(roomId, []);
roomUsers.set(roomId, new Set());
});

io.on('connection', (socket) => {
console.log('User connected:', socket.id);

// Handle user joining
socket.on('user-join', (data) => {
  connectedUsers.set(socket.id, {
    username: data.username,
    userType: data.userType,
    joinTime: Date.now(),
    roomId: data.roomId || 'general'
  });
  
  // Join the room
  socket.join(data.roomId || 'general');
  roomUsers.get(data.roomId || 'general').add(socket.id);
  
  // Broadcast user joined to room
  socket.to(data.roomId || 'general').emit('user-joined', {
    username: data.username,
    userType: data.userType,
    timestamp: Date.now()
  });
  
  // Send current users list for the room
  const roomUserList = Array.from(connectedUsers.values())
    .filter(user => user.roomId === (data.roomId || 'general'));
  socket.emit('users-list', roomUserList);
  
  // Send message history for the room
  const roomMessages = messageHistory.get(data.roomId || 'general') || [];
  socket.emit('message-history', roomMessages.slice(-50));
});

// Handle joining a room
socket.on('join-room', (data) => {
  const user = connectedUsers.get(socket.id);
  if (user) {
    // Leave previous room
    socket.leave(user.roomId);
    roomUsers.get(user.roomId).delete(socket.id);
    
    // Join new room
    user.roomId = data.roomId;
    socket.join(data.roomId);
    roomUsers.get(data.roomId).add(socket.id);
    
    // Send room-specific data
    const roomUserList = Array.from(connectedUsers.values())
      .filter(u => u.roomId === data.roomId);
    socket.emit('users-list', roomUserList);
    
    const roomMessages = messageHistory.get(data.roomId) || [];
    socket.emit('room-joined', {
      roomId: data.roomId,
      messageHistory: roomMessages.slice(-50)
    });
  }
});

// Handle new message
socket.on('send-message', (data) => {
  const user = connectedUsers.get(socket.id);
  if (user) {
    const messageData = {
      id: `${socket.id}-${Date.now()}`,
      username: user.username,
      message: data.message,
      timestamp: Date.now(),
      userType: user.userType,
      roomId: data.roomId || user.roomId
    };
    
    // Store message in room history
    const roomId = data.roomId || user.roomId;
    const roomMessages = messageHistory.get(roomId) || [];
    roomMessages.push(messageData);
    
    // Keep only last 100 messages per room
    if (roomMessages.length > 100) {
      roomMessages.shift();
    }
    messageHistory.set(roomId, roomMessages);
    
    // Broadcast message to room users only
    socket.to(roomId).emit('new-message', messageData);
    socket.emit('new-message', messageData); // Send to sender too
  }
});

// Handle typing indicator
socket.on('typing', (data) => {
  const user = connectedUsers.get(socket.id);
  if (user) {
    socket.broadcast.emit('user-typing', {
      username: user.username,
      isTyping: data.isTyping
    });
  }
});

// Handle user disconnect
socket.on('disconnect', () => {
  const user = connectedUsers.get(socket.id);
  if (user) {
    // Remove from room
    roomUsers.get(user.roomId).delete(socket.id);
    connectedUsers.delete(socket.id);
    
    // Broadcast user left to room
    socket.to(user.roomId).emit('user-left', {
      username: user.username,
      timestamp: Date.now()
    });
    
    // Update users list for the room
    const roomUserList = Array.from(connectedUsers.values())
      .filter(u => u.roomId === user.roomId);
    io.to(user.roomId).emit('users-list', roomUserList);
  }
  console.log('User disconnected:', socket.id);
});
});

httpServer
.once('error', (err) => {
console.error(err);
process.exit(1);
})
.listen(port, () => {
console.log(`> Ready on http://${hostname}:${port}`);
});
});