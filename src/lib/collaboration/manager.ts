/**
 * 实时协作编辑管理器
 * 处理 WebSocket 连接、操作同步、冲突解决
 */

'use client';

import { createLogger } from '@/lib/logger';
import type {
  Collaborator,
  Operation,
  DocumentState,
  CollaborationSession,
  WSMessage,
  CursorPosition,
  SelectionRange,
  USER_COLORS,
  getRandomUserColor,
  generateId,
} from './types';

const logger = createLogger('collaboration');

// 用户颜色
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 事件类型
export type CollaborationEvent = 
  | 'connected'
  | 'disconnected'
  | 'collaborator_joined'
  | 'collaborator_left'
  | 'cursor_moved'
  | 'selection_changed'
  | 'operation_applied'
  | 'document_synced'
  | 'error';

export type CollaborationEventHandler = (data: unknown) => void;

// 协作管理器配置
export interface CollaborationManagerConfig {
  wsUrl?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

// 协作管理器
export class CollaborationManager {
  private ws: WebSocket | null = null;
  private session: CollaborationSession | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private eventHandlers: Map<CollaborationEvent, Set<CollaborationEventHandler>> = new Map();
  private config: Required<CollaborationManagerConfig>;
  private currentUser: Collaborator | null = null;
  private pendingOperations: Operation[] = [];
  private documentVersion = 0;

  constructor(config?: CollaborationManagerConfig) {
    this.config = {
      wsUrl: config?.wsUrl || this.getDefaultWsUrl(),
      reconnectInterval: config?.reconnectInterval || 3000,
      maxReconnectAttempts: config?.maxReconnectAttempts || 5,
      heartbeatInterval: config?.heartbeatInterval || 30000,
    };
  }

  private getDefaultWsUrl(): string {
    if (typeof window === 'undefined') return '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/collaboration`;
  }

  // 连接到协作房间
  async joinRoom(roomId: string, documentId: string, userName: string): Promise<void> {
    if (this.session?.isConnected) {
      await this.leaveRoom();
    }

    this.currentUser = {
      id: generateUniqueId(),
      name: userName,
      color: getRandomColor(),
      lastActive: Date.now(),
      isTyping: false,
    };

    this.session = {
      roomId,
      documentId,
      isConnected: false,
      collaborators: [this.currentUser],
      lastSyncedVersion: 0,
      pendingOperations: [],
    };

    return this.connect();
  }

  // 离开协作房间
  async leaveRoom(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        type: 'leave',
        payload: { roomId: this.session?.roomId },
        userId: this.currentUser?.id || '',
        timestamp: Date.now(),
      });
    }

    this.disconnect();
    this.session = null;
    this.currentUser = null;
    this.pendingOperations = [];
    this.documentVersion = 0;
  }

  // 建立连接
  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.wsUrl);

        this.ws.onopen = () => {
          logger.info('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();

          // 发送加入房间消息
          this.send({
            type: 'join',
            payload: {
              roomId: this.session?.roomId,
              user: this.currentUser,
            },
            userId: this.currentUser?.id || '',
            timestamp: Date.now(),
          });

          if (this.session) {
            this.session.isConnected = true;
          }

          this.emit('connected', { session: this.session });
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = () => {
          logger.error('WebSocket error');
          this.emit('error', { error: 'WebSocket connection error' });
        };

        this.ws.onclose = () => {
          logger.info('WebSocket disconnected');
          this.stopHeartbeat();
          
          if (this.session) {
            this.session.isConnected = false;
          }
          
          this.emit('disconnected', {});
          
          // 尝试重连
          this.attemptReconnect();
        };
      } catch (error) {
        logger.error('Failed to connect', error instanceof Error ? error : undefined);
        reject(error);
      }
    });
  }

  // 断开连接
  private disconnect(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // 尝试重连
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.warn('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Reconnecting... (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        logger.error('Reconnect failed', error instanceof Error ? error : undefined);
      });
    }, this.config.reconnectInterval);
  }

  // 心跳检测
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'presence',
          payload: { timestamp: Date.now() },
          userId: this.currentUser?.id || '',
          timestamp: Date.now(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 发送消息
  private send(message: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // 处理消息
  private handleMessage(data: string): void {
    try {
      const message: WSMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'join':
          this.handleCollaboratorJoined(message.payload as { user: Collaborator });
          break;
        case 'leave':
          this.handleCollaboratorLeft(message.payload as { userId: string });
          break;
        case 'cursor':
          this.handleCursorMoved(message.payload as { userId: string; cursor: CursorPosition });
          break;
        case 'selection':
          this.handleSelectionChanged(message.payload as { userId: string; selection: SelectionRange | null });
          break;
        case 'operation':
          this.handleOperation(message.payload as { operation: Operation; documentVersion: number });
          break;
        case 'sync':
          this.handleSync(message.payload as { documentState: DocumentState; collaborators: Collaborator[] });
          break;
        case 'chat':
        case 'presence':
          // 这些消息类型暂不处理
          break;
        default:
          logger.debug('Unknown message type', message.type);
      }
    } catch (error) {
      logger.error('Failed to handle message', error instanceof Error ? error : undefined);
    }
  }

  // 处理协作者加入
  private handleCollaboratorJoined(payload: { user: Collaborator }): void {
    if (!this.session) return;
    
    const existingIndex = this.session.collaborators.findIndex(c => c.id === payload.user.id);
    if (existingIndex === -1) {
      this.session.collaborators.push(payload.user);
      this.emit('collaborator_joined', { collaborator: payload.user });
    }
  }

  // 处理协作者离开
  private handleCollaboratorLeft(payload: { userId: string }): void {
    if (!this.session) return;
    
    const index = this.session.collaborators.findIndex(c => c.id === payload.userId);
    if (index !== -1) {
      const [left] = this.session.collaborators.splice(index, 1);
      this.emit('collaborator_left', { collaborator: left });
    }
  }

  // 处理光标移动
  private handleCursorMoved(payload: { userId: string; cursor: CursorPosition }): void {
    if (!this.session) return;
    
    const collaborator = this.session.collaborators.find(c => c.id === payload.userId);
    if (collaborator) {
      collaborator.cursor = payload.cursor;
      collaborator.lastActive = Date.now();
      this.emit('cursor_moved', { collaborator, cursor: payload.cursor });
    }
  }

  // 处理选区变化
  private handleSelectionChanged(payload: { userId: string; selection: SelectionRange | null }): void {
    if (!this.session) return;
    
    const collaborator = this.session.collaborators.find(c => c.id === payload.userId);
    if (collaborator) {
      collaborator.selection = payload.selection || undefined;
      this.emit('selection_changed', { collaborator, selection: payload.selection });
    }
  }

  // 处理操作
  private handleOperation(payload: { operation: Operation; documentVersion: number }): void {
    if (payload.documentVersion > this.documentVersion) {
      this.documentVersion = payload.documentVersion;
      this.emit('operation_applied', payload);
    }
  }

  // 处理同步
  private handleSync(payload: { documentState: DocumentState; collaborators: Collaborator[] }): void {
    if (!this.session) return;
    
    this.documentVersion = payload.documentState.version;
    this.session.lastSyncedVersion = payload.documentState.version;
    this.session.collaborators = payload.collaborators;
    
    this.emit('document_synced', payload);
  }

  // 公共 API

  // 发送光标位置
  sendCursor(cursor: CursorPosition): void {
    if (!this.session?.isConnected || !this.currentUser) return;
    
    this.send({
      type: 'cursor',
      payload: { roomId: this.session.roomId, cursor },
      userId: this.currentUser.id,
      timestamp: Date.now(),
    });
  }

  // 发送选区
  sendSelection(selection: SelectionRange | null): void {
    if (!this.session?.isConnected || !this.currentUser) return;
    
    this.send({
      type: 'selection',
      payload: { roomId: this.session.roomId, selection },
      userId: this.currentUser.id,
      timestamp: Date.now(),
    });
  }

  // 发送操作
  sendOperation(operation: Omit<Operation, 'userId' | 'timestamp'>): void {
    if (!this.session?.isConnected || !this.currentUser) return;
    
    const fullOperation: Operation = {
      ...operation,
      userId: this.currentUser.id,
      timestamp: Date.now(),
    };

    this.documentVersion++;
    
    this.send({
      type: 'operation',
      payload: {
        roomId: this.session.roomId,
        operation: fullOperation,
        documentVersion: this.documentVersion,
      },
      userId: this.currentUser.id,
      timestamp: Date.now(),
    });
  }

  // 事件订阅
  on(event: CollaborationEvent, handler: CollaborationEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  // 触发事件
  private emit(event: CollaborationEvent, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error('Event handler error', error instanceof Error ? error : undefined);
        }
      });
    }
  }

  // 获取当前状态
  getSession(): CollaborationSession | null {
    return this.session;
  }

  getCurrentUser(): Collaborator | null {
    return this.currentUser;
  }

  isConnected(): boolean {
    return this.session?.isConnected ?? false;
  }

  getCollaborators(): Collaborator[] {
    return this.session?.collaborators ?? [];
  }
}

// 单例实例
let collaborationManagerInstance: CollaborationManager | null = null;

export function getCollaborationManager(config?: CollaborationManagerConfig): CollaborationManager {
  if (!collaborationManagerInstance) {
    collaborationManagerInstance = new CollaborationManager(config);
  }
  return collaborationManagerInstance;
}
