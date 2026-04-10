// Enhanced WebSocket server for chat with room management and authentication
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from "../lib/prisma";

interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  user?: any;
  subscriptions: Set<string>;
  lastPing: number;
}

interface ChatMessage {
  type: 'message' | 'presence' | 'typing' | 'reaction' | 'read_receipt' | 'heartbeat' | 'heartbeat_ack' | 'subscribe' | 'unsubscribe' | 'error';
  payload: any;
  threadId?: string;
  conversationId?: string;
  timestamp: string;
}

interface Room {
  id: string;
  type: 'thread' | 'conversation';
  members: Set<AuthenticatedWebSocket>;
  typingUsers: Map<string, { userId: string; lastTyped: number }>
}

class ChatWebSocketManager {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private pingInterval: NodeJS.Timeout;

  constructor() {
    const server = createServer();
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/chat',
      verifyClient: async (info: any, callback: (result: boolean, code?: number, reason?: string) => void) => {
        try {
          const token = this.extractToken(info.req);
          if (!token) {
            return callback(false, 4001, 'No token provided');
          }

          const decoded = verifyToken(token);
          if (!decoded) {
            return callback(false, 4003, 'Invalid token');
          }

          // Store user info for later use
          (info.req as any).user = decoded;
          callback(true);
        } catch (error) {
          callback(false, 4003, 'Authentication failed');
        }
      }
    });

    this.setupWebSocketServer();
    this.startPingInterval();

    const PORT = process.env.CHAT_WS_PORT || 4001;
    server.listen(PORT, () => {
      console.log(`Enhanced Chat WebSocket server running on port ${PORT}`);
    });
  }

  private extractToken(req: any): string | null {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('token') || 
           req.headers['authorization']?.replace('Bearer ', '') ||
           req.headers['sec-websocket-protocol'];
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const user = req.user;
      const authenticatedWs = ws as AuthenticatedWebSocket;
      
      // Attach user info to websocket
      authenticatedWs.userId = user.sub;
      authenticatedWs.user = user;
      authenticatedWs.subscriptions = new Set();
      authenticatedWs.lastPing = Date.now();

      // Store client
      this.clients.set(user.sub, authenticatedWs);

      console.log(`User ${user.sub} connected to chat`);

      // Send welcome message
      this.sendToClient(authenticatedWs, {
        type: 'welcome',
        payload: { message: 'Connected to enhanced chat server', userId: user.sub },
        timestamp: new Date().toISOString()
      });

      // Handle messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message: ChatMessage = JSON.parse(data.toString());
          await this.handleMessage(authenticatedWs, message);
        } catch (error) {
          console.error('Error parsing message:', error);
          this.sendToClient(authenticatedWs, {
            type: 'error',
            payload: { message: 'Invalid message format' },
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(authenticatedWs);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${user.sub}:`, error);
        this.handleDisconnection(authenticatedWs);
      });
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: ChatMessage): Promise<void> {
    switch (message.type) {
      case 'message':
        await this.handleChatMessage(ws, message);
        break;
      case 'typing':
        this.handleTypingIndicator(ws, message);
        break;
      case 'presence':
        this.handlePresenceUpdate(ws, message);
        break;
      case 'reaction':
        await this.handleReaction(ws, message);
        break;
      case 'read_receipt':
        await this.handleReadReceipt(ws, message);
        break;
      case 'subscribe':
        this.handleSubscribe(ws, message);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, message);
        break;
      case 'heartbeat':
        this.handleHeartbeat(ws);
        break;
      case 'heartbeat_ack':
        // Client response to our ping
        ws.lastPing = Date.now();
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private async handleChatMessage(ws: AuthenticatedWebSocket, message: ChatMessage): Promise<void> {
    const { threadId, conversationId, payload } = message;
    const roomId = threadId || conversationId;

    if (!roomId) {
      this.sendToClient(ws, {
        type: 'error',
        payload: { message: 'Missing threadId or conversationId' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      // Save message to database
      const savedMessage = await this.saveMessageToDatabase({
        authorId: ws.userId,
        content: payload.content,
        attachments: payload.attachments || [],
        mentions: payload.mentions || [],
        parentId: payload.parentId,
        threadId,
        conversationId
      });

      // Broadcast to room members
      this.broadcastToRoom(roomId, {
        type: 'message',
        payload: savedMessage,
        threadId,
        conversationId,
        timestamp: new Date().toISOString()
      }, ws);

      // Send notifications for mentions
      if (payload.mentions && payload.mentions.length > 0) {
        await this.sendMentionNotifications(payload.mentions, savedMessage);
      }

    } catch (error) {
      console.error('Error saving message:', error);
      this.sendToClient(ws, {
        type: 'error',
        payload: { message: 'Failed to send message' },
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleTypingIndicator(ws: AuthenticatedWebSocket, message: ChatMessage): void {
    const { threadId, conversationId, payload } = message;
    const roomId = threadId || conversationId;

    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    if (payload.isTyping) {
      room.typingUsers.set(ws.userId, { userId: ws.userId, lastTyped: Date.now() });
    } else {
      room.typingUsers.delete(ws.userId);
    }

    // Broadcast typing indicator to other room members
    this.broadcastToRoom(roomId, {
      type: 'typing',
      payload: {
        userId: ws.userId,
        isTyping: payload.isTyping,
        user: ws.user
      },
      threadId,
      conversationId,
      timestamp: new Date().toISOString()
    }, ws);

    // Clean up old typing indicators
    this.cleanupTypingIndicators(room);
  }

  private handlePresenceUpdate(ws: AuthenticatedWebSocket, message: ChatMessage): void {
    // Broadcast presence update to all rooms the user is in
    ws.subscriptions.forEach(roomId => {
      this.broadcastToRoom(roomId, {
        type: 'presence',
        payload: {
          userId: ws.userId,
          status: message.payload.status,
          user: ws.user
        },
        timestamp: new Date().toISOString()
      }, ws);
    });
  }

  private async handleReaction(ws: AuthenticatedWebSocket, message: ChatMessage): Promise<void> {
    // Handle message reactions
    this.broadcastToRoom(message.threadId || message.conversationId || '', {
      type: 'reaction',
      payload: message.payload,
      timestamp: new Date().toISOString()
    });
  }

  private async handleReadReceipt(ws: AuthenticatedWebSocket, message: ChatMessage): Promise<void> {
    // Handle read receipts
    this.broadcastToRoom(message.threadId || message.conversationId || '', {
      type: 'read_receipt',
      payload: message.payload,
      timestamp: new Date().toISOString()
    });
  }

  private handleSubscribe(ws: AuthenticatedWebSocket, message: ChatMessage): void {
    const roomId = message.threadId || message.conversationId;
    if (!roomId) return;

    // Add to room
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        type: message.threadId ? 'thread' : 'conversation',
        members: new Set(),
        typingUsers: new Map()
      };
      this.rooms.set(roomId, room);
    }

    room.members.add(ws);
    ws.subscriptions.add(roomId);

    console.log(`User ${ws.userId} subscribed to room ${roomId}`);
  }

  private handleUnsubscribe(ws: AuthenticatedWebSocket, message: ChatMessage): void {
    const roomId = message.threadId || message.conversationId;
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (room) {
      room.members.delete(ws);
      room.typingUsers.delete(ws.userId);
      
      // Clean up empty rooms
      if (room.members.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    ws.subscriptions.delete(roomId);
    console.log(`User ${ws.userId} unsubscribed from room ${roomId}`);
  }

  private handleHeartbeat(ws: AuthenticatedWebSocket): void {
    ws.lastPing = Date.now();
    this.sendToClient(ws, {
      type: 'heartbeat_ack',
      payload: {},
      timestamp: new Date().toISOString()
    });
  }

  private handleDisconnection(ws: AuthenticatedWebSocket): void {
    console.log(`User ${ws.userId} disconnected from chat`);

    // Remove from all rooms
    ws.subscriptions.forEach(roomId => {
      const room = this.rooms.get(roomId);
      if (room) {
        room.members.delete(ws);
        room.typingUsers.delete(ws.userId);
        
        // Clean up empty rooms
        if (room.members.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });

    // Remove from clients
    this.clients.delete(ws.userId);

    // Broadcast offline presence
    ws.subscriptions.forEach(roomId => {
      this.broadcastToRoom(roomId, {
        type: 'presence',
        payload: {
          userId: ws.userId,
          status: 'offline',
          user: ws.user
        },
        timestamp: new Date().toISOString()
      });
    });
  }

  private async saveMessageToDatabase(messageData: any): Promise<any> {
    // Implement actual database save logic
    // This would use your existing chat service
    try {
      // For now, return a mock message
      return {
        id: `msg_${Date.now()}`,
        ...messageData,
        sentAt: new Date().toISOString(),
        author: {
          id: messageData.authorId,
          firstName: 'User',
          lastName: 'Name'
        }
      };
    } catch (error) {
      throw new Error('Failed to save message');
    }
  }

  private async sendMentionNotifications(mentions: string[], message: any): Promise<void> {
    // Implement notification logic for mentions
    console.log('Sending mention notifications to:', mentions);
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcastToRoom(roomId: string, message: any, excludeWs?: AuthenticatedWebSocket): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.members.forEach(member => {
      if (member !== excludeWs && member.readyState === WebSocket.OPEN) {
        this.sendToClient(member, message);
      }
    });
  }

  private cleanupTypingIndicators(room: Room): void {
    const now = Date.now();
    const timeout = 10000; // 10 seconds

    room.typingUsers.forEach((typingUser, userId) => {
      if (now - typingUser.lastTyped > timeout) {
        room.typingUsers.delete(userId);
        
        // Broadcast that user stopped typing
        this.broadcastToRoom(room.id, {
          type: 'typing',
          payload: {
            userId,
            isTyping: false
          },
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      
      this.clients.forEach((ws, userId) => {
        // Check for timeout
        if (now - ws.lastPing > 60000) { // 60 seconds timeout
          console.log(`User ${userId} timed out, disconnecting`);
          ws.terminate();
          return;
        }
        
        // Send ping
        this.sendToClient(ws, {
          type: 'heartbeat',
          payload: {},
          timestamp: new Date().toISOString()
        });
      });
    }, 30000); // Every 30 seconds
  }
}

// Start the enhanced chat server
new ChatWebSocketManager();
