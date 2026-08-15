/**
 * 实时协作编辑管理器
 * 使用 REST API + SSE 实现实时同步
 */

'use client';

import { createLogger } from '@/lib/logger';
import type {
  Collaborator,
  Operation,
  CursorPosition,
  SelectionRange,
} from './types';

const logger = createLogger('collaboration');

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
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

// 协作会话状态
export interface CollaborationSession {
  roomId: string;
  documentId: string;
  isConnected: boolean;
  collaborators: Collaborator[];
  lastSyncedVersion: number;
  pendingOperations: Operation[];
}

// 协作管理器
export class CollaborationManager {
  private session: CollaborationSession | null = null;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private eventHandlers: Map<CollaborationEvent, Set<CollaborationEventHandler>> = new Map();
  private config: Required<CollaborationManagerConfig>;
  private currentUser: Collaborator | null = null;
  private documentVersion = 0;
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;
  private roomToken: string | null = null;

  constructor(config?: CollaborationManagerConfig) {
    this.config = {
      reconnectInterval: config?.reconnectInterval || 3000,
      maxReconnectAttempts: config?.maxReconnectAttempts || 5,
      heartbeatInterval: config?.heartbeatInterval || 30000,
    };
  }

  // 创建房间
  async createRoom(
    documentId: string,
    documentTitle: string,
    documentContent: string,
    userName: string
  ): Promise<{ roomId: string; userId: string }> {
    try {
      const response = await fetch('/api/collaboration/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          documentTitle,
          documentContent,
          userName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '创建房间失败');
      }

      this.currentUser = {
        id: data.room.collaborators[0].id,
        name: userName,
        color: data.room.collaborators[0].color,
        lastActive: Date.now(),
        isTyping: false,
      };

      this.roomToken = data.roomToken || null;

      this.session = {
        roomId: data.room.id,
        documentId: data.room.documentId,
        isConnected: true,
        collaborators: data.room.collaborators,
        lastSyncedVersion: 0,
        pendingOperations: [],
      };

      this.documentVersion = data.room.documentVersion;

      // 连接 SSE
      this.connectSSE(data.room.id);

      return {
        roomId: data.room.id,
        userId: this.currentUser.id,
      };
    } catch (error) {
      logger.error('Failed to create room', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  // 加入房间
  async joinRoom(roomId: string, documentId: string, userName: string): Promise<void> {
    if (this.session?.isConnected) {
      await this.leaveRoom();
    }

    try {
      const response = await fetch('/api/collaboration/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, userName }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '加入房间失败');
      }

      this.currentUser = data.user;
      this.roomToken = data.roomToken || null;
      this.session = {
        roomId,
        documentId,
        isConnected: true,
        collaborators: data.room.collaborators,
        lastSyncedVersion: data.room.documentVersion,
        pendingOperations: [],
      };

      this.documentVersion = data.room.documentVersion;

      // 连接 SSE
      this.connectSSE(roomId);

      this.emit('connected', { session: this.session });
    } catch (error) {
      logger.error('Failed to join room', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  // 连接 SSE 事件流
  private connectSSE(roomId: string): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`/api/collaboration/events?roomId=${roomId}`);

    this.eventSource.onopen = () => {
      logger.info('SSE connected');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleSSEMessage(data);
      } catch (error) {
        logger.error('Failed to parse SSE message', error instanceof Error ? error : undefined);
      }
    };

    this.eventSource.onerror = () => {
      logger.error('SSE connection error');
      this.emit('error', { error: 'SSE connection error' });
      
      if (this.session) {
        this.session.isConnected = false;
      }
      
      this.emit('disconnected', {});
      this.attemptReconnect(roomId);
    };
  }

  // 处理 SSE 消息
  private handleSSEMessage(data: { type: string; [key: string]: unknown }): void {
    switch (data.type) {
      case 'init':
        if (this.session) {
          this.session.collaborators = (data.collaborators as Collaborator[]) || [];
          this.emit('document_synced', data);
        }
        break;

      case 'heartbeat':
        if (this.session) {
          const newCollaborators = (data.collaborators as Collaborator[]) || [];
          
          // 检测协作者变化
          const oldIds = new Set(this.session.collaborators.map(c => c.id));
          const newIds = new Set(newCollaborators.map(c => c.id));
          
          // 新加入的协作者
          for (const collaborator of newCollaborators) {
            if (!oldIds.has(collaborator.id) && collaborator.id !== this.currentUser?.id) {
              this.emit('collaborator_joined', { collaborator });
            }
          }
          
          // 离开的协作者
          for (const collaborator of this.session.collaborators) {
            if (!newIds.has(collaborator.id) && collaborator.id !== this.currentUser?.id) {
              this.emit('collaborator_left', { collaborator });
            }
          }
          
          this.session.collaborators = newCollaborators;
          
          // 检测版本变化
          if (typeof data.documentVersion === 'number' && data.documentVersion > this.documentVersion) {
            this.documentVersion = data.documentVersion;
            this.emit('document_synced', data);
          }
        }
        break;

      case 'room_closed':
        this.emit('error', { error: '房间已关闭' });
        this.leaveRoom();
        break;
    }
  }

  // 尝试重连
  private attemptReconnect(roomId: string): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.warn('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Reconnecting... (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connectSSE(roomId);
    }, this.config.reconnectInterval);
  }

  // 离开房间
  async leaveRoom(): Promise<void> {
    if (this.session && this.currentUser) {
      try {
        await fetch('/api/collaboration/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: this.session.roomId,
            userId: this.currentUser.id,
            roomToken: this.roomToken,
          }),
        });
      } catch {
        // 忽略错误
      }
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    this.session = null;
    this.currentUser = null;
    this.documentVersion = 0;
    this.reconnectAttempts = 0;
    this.roomToken = null;
  }

  // 发送光标位置
  async sendCursor(cursor: CursorPosition): Promise<void> {
    if (!this.session || !this.currentUser) return;

    try {
      await fetch('/api/collaboration/cursor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.session.roomId,
          userId: this.currentUser.id,
          cursor,
          roomToken: this.roomToken,
        }),
      });
    } catch (error) {
      logger.error('Failed to send cursor', error instanceof Error ? error : undefined);
    }
  }

  // 发送选区
  async sendSelection(selection: SelectionRange | null): Promise<void> {
    if (!this.session || !this.currentUser) return;

    try {
      await fetch('/api/collaboration/cursor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.session.roomId,
          userId: this.currentUser.id,
          selection,
          roomToken: this.roomToken,
        }),
      });
    } catch (error) {
      logger.error('Failed to send selection', error instanceof Error ? error : undefined);
    }
  }

  // 发送操作（文档更新）
  async sendOperation(content: string): Promise<void> {
    if (!this.session || !this.currentUser) return;

    // 防抖：延迟发送
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(async () => {
      try {
        const response = await fetch('/api/collaboration/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: this.session?.roomId,
            userId: this.currentUser?.id,
            content,
            roomToken: this.roomToken,
            baseVersion: this.documentVersion,
          }),
        });

        const data = await response.json();
        if (data.success && data.version) {
          this.documentVersion = data.version;
          if (this.session) {
            this.session.lastSyncedVersion = data.version;
          }
          // 版本冲突时提示（P1-3，last-write-wins 保留）
          if (data.conflict) {
            logger.warn(`Document version conflict detected, server version: ${data.serverVersion}`);
            this.emit('error', { error: '检测到文档版本冲突，当前内容以最近写入为准' });
          }
        }
      } catch (error) {
        logger.error('Failed to sync document', error instanceof Error ? error : undefined);
      }
    }, 300);
  }

  // 更新输入状态
  async updateTypingStatus(isTyping: boolean): Promise<void> {
    if (!this.session || !this.currentUser) return;

    try {
      await fetch('/api/collaboration/cursor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.session.roomId,
          userId: this.currentUser.id,
          isTyping,
          roomToken: this.roomToken,
        }),
      });
    } catch (error) {
      logger.error('Failed to update typing status', error instanceof Error ? error : undefined);
    }
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

  /**
   * 销毁管理器，清理所有资源
   */
  destroy(): void {
    this.leaveRoom();
    this.eventHandlers.clear();
    logger.info('CollaborationManager destroyed');
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

/**
 * 重置协作管理器实例
 */
export function resetCollaborationManager(): void {
  if (collaborationManagerInstance) {
    collaborationManagerInstance.destroy();
    collaborationManagerInstance = null;
  }
}
