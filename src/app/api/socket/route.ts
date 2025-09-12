import { NextRequest } from 'next/server'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
if (process.env.NODE_ENV === 'development') {
const { Server } = await import('socket.io')
const { createServer } = await import('http')

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Store connected users
const connectedUsers = new Map()
const messageHistory: Array<{
  id: string
  username: string
  message: string
  timestamp: number
  userType: 'athlete' | 'coach'
}> = []

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Handle user joining
  socket.on('user-join', (data: { username: string; userType: 'athlete' | 'coach' }) => {
    connectedUsers.set(socket.id, {
      username: data.username,
      userType: data.userType,
      joinTime: Date.now()
    })
    
    // Broadcast user joined
    socket.broadcast.emit('user-joined', {
      username: data.username,
      userType: data.userType,
      timestamp: Date.now()
    })
    
    // Send current users list
    socket.emit('users-list', Array.from(connectedUsers.values()))
    
    // Send message history
    socket.emit('message-history', messageHistory.slice(-50)) // Last 50 messages
  })

  // Handle new message
  socket.on('send-message', (data: { message: string }) => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      const messageData = {
        id: `${socket.id}-${Date.now()}`,
        username: user.username,
        message: data.message,
        timestamp: Date.now(),
        userType: user.userType
      }
      
      messageHistory.push(messageData)
      
      // Broadcast message to all users
      io.emit('new-message', messageData)
    }
  })

  // Handle typing indicator
  socket.on('typing', (data: { isTyping: boolean }) => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      socket.broadcast.emit('user-typing', {
        username: user.username,
        isTyping: data.isTyping
      })
    }
  })

  // Handle user disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      connectedUsers.delete(socket.id)
      
      // Broadcast user left
      socket.broadcast.emit('user-left', {
        username: user.username,
        timestamp: Date.now()
      })
      
      // Update users list
      io.emit('users-list', Array.from(connectedUsers.values()))
    }
    console.log('User disconnected:', socket.id)
  })
})

return new Response('WebSocket server initialized', { status: 200 })
}

return new Response('WebSocket server not available in production', { status: 200 })
}