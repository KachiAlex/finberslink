// Enhanced WebSocket Manager for Chat System
import { verifyToken } from '@/lib/auth/jwt';

export interface ChatMessage {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  sentAt: string;
  author?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  attachments?: any[];
  mentions?: string[];
  parentId?: string;
}

export interface PresenceData {
  userId: string;
  threadId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
}

export interface TypingData {
  userId: string;
  threadId: string;
  isTyping: boolean;
}

export interface WebSocketMessage {
  type: 'message' | 'presence' | 'typing' | 'reaction' | 'read_receipt' | 'error';
  payload: any;
  threadId?: string;
  userId?: string;
  timestamp: string;
}

class ChatWebSocketManager {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  private subscriptions: Set<string> = new Set();
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.setupEventListeners();
  }

  // Connection Management
  async connect(token: string): Promise<void> {
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.token = token;
    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.getWebSocketUrl()}?token=${encodeURIComponent(token)}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connected', null);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.NODE_ENV === 'development' ? '4000' : window.location.port;
    return `${protocol}//${host}:${port}/ws/chat`;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.token) {
        this.connect(this.token).catch(error => {
          console.error('Reconnect failed:', error);
        });
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'heartbeat', payload: {}, timestamp: new Date().toISOString() });
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Message Handling
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'message':
          this.emit('message', message.payload);
          break;
        case 'presence':
          this.emit('presence', message.payload);
          break;
        case 'typing':
          this.emit('typing', message.payload);
          break;
        case 'reaction':
          this.emit('reaction', message.payload);
          break;
        case 'read_receipt':
          this.emit('read_receipt', message.payload);
          break;
        case 'heartbeat':
          // Respond to server heartbeat
          this.send({ type: 'heartbeat_ack', payload: {}, timestamp: new Date().toISOString() });
          break;
        case 'error':
          this.emit('error', message.payload);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  // Subscription Management
  subscribe(threadId: string): void {
    if (!this.subscriptions.has(threadId)) {
      this.subscriptions.add(threadId);
      this.send({
        type: 'subscribe',
        payload: { threadId },
        threadId,
        timestamp: new Date().toISOString()
      });
    }
  }

  unsubscribe(threadId: string): void {
    if (this.subscriptions.has(threadId)) {
      this.subscriptions.delete(threadId);
      this.send({
        type: 'unsubscribe',
        payload: { threadId },
        threadId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Message Sending
  sendMessage(threadId: string, content: string, options: {
    attachments?: any[];
    mentions?: string[];
    parentId?: string;
  } = {}): void {
    const message: WebSocketMessage = {
      type: 'message',
      payload: {
        content,
        ...options
      },
      threadId,
      timestamp: new Date().toISOString()
    };

    this.send(message);
  }

  sendTypingIndicator(threadId: string, isTyping: boolean): void {
    this.send({
      type: 'typing',
      payload: { isTyping },
      threadId,
      timestamp: new Date().toISOString()
    });
  }

  sendPresenceUpdate(status: 'online' | 'away' | 'offline'): void {
    this.send({
      type: 'presence',
      payload: { status },
      timestamp: new Date().toISOString()
    });
  }

  sendReadReceipt(threadId: string, messageId: string): void {
    this.send({
      type: 'read_receipt',
      payload: { messageId },
      threadId,
      timestamp: new Date().toISOString()
    });
  }

  private send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
      
      // Try to reconnect if not already connecting
      if (!this.isConnecting && this.token) {
        this.connect(this.token).catch(error => {
          console.error('Failed to reconnect for queued message:', error);
        });
      }
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  // Event Management
  on(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  private setupEventListeners(): void {
    // Handle page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.sendPresenceUpdate('away');
        } else {
          this.sendPresenceUpdate('online');
        }
      });

      // Handle page unload
      window.addEventListener('beforeunload', () => {
        this.sendPresenceUpdate('offline');
        this.disconnect();
      });
    }
  }

  // Disconnection
  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.token = null;
    this.userId = null;
    this.subscriptions.clear();
    this.messageQueue.length = 0;
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  // Getters
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get isConnecting(): boolean {
    return this.isConnecting;
  }

  get subscribedThreads(): string[] {
    return Array.from(this.subscriptions);
  }
}

// Singleton instance
export const chatWebSocketManager = new ChatWebSocketManager();

// Hook for React components
export function useChatWebSocket(token: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setIsConnecting(true);
    setError(null);

    const unsubscribeConnected = chatWebSocketManager.on('connected', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    const unsubscribeDisconnected = chatWebSocketManager.on('disconnected', () => {
      setIsConnected(false);
      setIsConnecting(false);
    });

    const unsubscribeError = chatWebSocketManager.on('error', (error: any) => {
      setError(error.message || 'Connection error');
      setIsConnecting(false);
    });

    chatWebSocketManager.connect(token).catch(error => {
      setError(error.message);
      setIsConnecting(false);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
    };
  }, [token]);

  const disconnect = useCallback(() => {
    chatWebSocketManager.disconnect();
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    disconnect,
    subscribe: chatWebSocketManager.subscribe.bind(chatWebSocketManager),
    unsubscribe: chatWebSocketManager.unsubscribe.bind(chatWebSocketManager),
    sendMessage: chatWebSocketManager.sendMessage.bind(chatWebSocketManager),
    sendTypingIndicator: chatWebSocketManager.sendTypingIndicator.bind(chatWebSocketManager),
    sendPresenceUpdate: chatWebSocketManager.sendPresenceUpdate.bind(chatWebSocketManager),
    sendReadReceipt: chatWebSocketManager.sendReadReceipt.bind(chatWebSocketManager),
    on: chatWebSocketManager.on.bind(chatWebSocketManager),
  };
}
