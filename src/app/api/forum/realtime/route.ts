import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  // Enable SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId');
  const courseId = searchParams.get('courseId');

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectEvent = {
        type: 'connected',
        timestamp: new Date().toISOString(),
        data: { threadId, courseId },
      };
      controller.enqueue(`data: ${JSON.stringify(connectEvent)}\n\n`);

      // Store the controller for later use
      const controllerId = Math.random().toString(36);
      
      // Add controller to global store (in production, use Redis or similar)
      if (!global.sseConnections) {
        global.sseConnections = new Map();
      }
      global.sseConnections.set(controllerId, {
        controller,
        threadId,
        courseId,
        connectedAt: new Date(),
      });

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        global.sseConnections.delete(controllerId);
        controller.close();
      });

      // Send periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          };
          controller.enqueue(`data: ${JSON.stringify(heartbeat)}\n\n`);
        } catch (error) {
          clearInterval(heartbeatInterval);
          global.sseConnections.delete(controllerId);
        }
      }, 30000); // Every 30 seconds

      // Cleanup heartbeat on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
      });
    },
  });

  return new Response(stream, { headers });
}

// Helper function to broadcast events to connected clients
export function broadcastForumEvent(event: {
  type: 'thread_created' | 'thread_updated' | 'post_created' | 'post_updated' | 'post_deleted';
  data: any;
  threadId?: string;
  courseId?: string;
}) {
  if (!global.sseConnections) return;

  const eventData = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  let sentCount = 0;
  
  global.sseConnections.forEach((connection, controllerId) => {
    // Send to relevant connections
    const shouldSend = 
      (!event.threadId || connection.threadId === event.threadId) ||
      (!event.courseId || connection.courseId === event.courseId);

    if (shouldSend) {
      try {
        connection.controller.enqueue(`data: ${JSON.stringify(eventData)}\n\n`);
        sentCount++;
      } catch (error) {
        // Connection is dead, remove it
        global.sseConnections.delete(controllerId);
      }
    }
  });

  console.log(`Broadcasted forum event to ${sentCount} clients:`, event.type);
}

// Type declarations for global SSE connections
declare global {
  var sseConnections: Map<string, {
    controller: ReadableStreamDefaultController;
    threadId?: string;
    courseId?: string;
    connectedAt: Date;
  }> | undefined;
}
