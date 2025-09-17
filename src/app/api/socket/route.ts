import { NextRequest } from "next/server";
import { Server as SocketIOServer } from "socket.io";

// Global variable to store the Socket.IO server
let io: SocketIOServer | null = null;

export async function GET(req: NextRequest) {
  try {
    // For App Router, we need to handle Socket.IO differently
    // This endpoint will be used for Socket.IO handshake
    
    if (!io) {
      console.log("Socket.IO server not initialized yet");
      
      // Return a response indicating the server is initializing
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Socket.IO server is initializing. Please try again in a moment." 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Socket.IO server is running",
        connectedClients: io.engine.clientsCount
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error("Socket route error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error" 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}