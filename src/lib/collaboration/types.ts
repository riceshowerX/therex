/**
 * 实时协作编辑类型定义
 */

import { generateId as generateIdUtil } from '@/lib/utils';

// 用户信息
export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastActive: number;
  isTyping: boolean;
}

// 光标位置
export interface CursorPosition {
  line: number;
  column: number;
}

// 选区范围
export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
}

// 操作类型
export type OperationType = 'insert' | 'delete' | 'retain';

// 操作记录
export interface Operation {
  type: OperationType;
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

// 文档状态
export interface DocumentState {
  content: string;
  version: number;
  operations: Operation[];
}

// 协作房间
export interface CollaborationRoom {
  id: string;
  documentId: string;
  documentTitle: string;
  collaborators: Collaborator[];
  createdAt: number;
  createdBy: string;
  maxCollaborators: number;
}

// WebSocket 消息类型
export type WSMessageType = 
  | 'join'
  | 'leave'
  | 'cursor'
  | 'selection'
  | 'operation'
  | 'sync'
  | 'chat'
  | 'presence';

// WebSocket 消息
export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  userId: string;
  timestamp: number;
}

// 加入房间消息
export interface JoinMessage extends WSMessage {
  type: 'join';
  payload: {
    roomId: string;
    user: Collaborator;
  };
}

// 离开房间消息
export interface LeaveMessage extends WSMessage {
  type: 'leave';
  payload: {
    roomId: string;
    userId: string;
  };
}

// 光标更新消息
export interface CursorMessage extends WSMessage {
  type: 'cursor';
  payload: {
    roomId: string;
    cursor: CursorPosition;
  };
}

// 选区更新消息
export interface SelectionMessage extends WSMessage {
  type: 'selection';
  payload: {
    roomId: string;
    selection: SelectionRange | null;
  };
}

// 操作消息
export interface OperationMessage extends WSMessage {
  type: 'operation';
  payload: {
    roomId: string;
    operation: Operation;
    documentVersion: number;
  };
}

// 同步消息
export interface SyncMessage extends WSMessage {
  type: 'sync';
  payload: {
    roomId: string;
    documentState: DocumentState;
    collaborators: Collaborator[];
  };
}

// 聊天消息
export interface ChatMessage extends WSMessage {
  type: 'chat';
  payload: {
    roomId: string;
    message: {
      id: string;
      content: string;
      userId: string;
      userName: string;
      timestamp: number;
    };
  };
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

// 用户颜色池
export const USER_COLORS = [
  '#FF6B6B', // 红
  '#4ECDC4', // 青
  '#45B7D1', // 蓝
  '#96CEB4', // 绿
  '#FFEAA7', // 黄
  '#DDA0DD', // 紫
  '#98D8C8', // 薄荷
  '#F7DC6F', // 金
  '#BB8FCE', // 淡紫
  '#85C1E9', // 天蓝
];

// 获取随机用户颜色
export function getRandomUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

// 生成唯一 ID（包装统一的工具函数）
export function generateId(): string {
  return generateIdUtil('collab');
}
