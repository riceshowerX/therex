/**
 * 协作服务器端逻辑
 * 使用内存存储管理协作房间和用户
 * 
 * 注意：此模块用于 API Routes，不是 Server Actions
 */

import { randomUUID } from 'crypto';

// 类型定义
export interface ServerCollaborator {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  lastActive: number;
  isTyping: boolean;
}

export interface ServerRoom {
  id: string;
  documentId: string;
  documentTitle: string;
  documentContent: string;
  documentVersion: number;
  collaborators: Map<string, ServerCollaborator>;
  operations: ServerOperation[];
  createdAt: number;
  createdBy: string;
  maxCollaborators: number;
}

export interface ServerOperation {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

// 用户颜色池
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

// 内存存储
const rooms = new Map<string, ServerRoom>();
const userRooms = new Map<string, Set<string>>(); // userId -> roomIds

// 生成房间 ID
export function generateRoomId(): string {
  return randomUUID().substring(0, 8);
}

// 获取随机颜色
function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

// 创建房间
export function createRoom(
  documentId: string,
  documentTitle: string,
  documentContent: string,
  creatorName: string
): ServerRoom {
  const roomId = generateRoomId();
  const creatorId = randomUUID();
  
  const room: ServerRoom = {
    id: roomId,
    documentId,
    documentTitle,
    documentContent,
    documentVersion: 0,
    collaborators: new Map(),
    operations: [],
    createdAt: Date.now(),
    createdBy: creatorId,
    maxCollaborators: 10,
  };

  // 创建者加入房间
  const creator: ServerCollaborator = {
    id: creatorId,
    name: creatorName,
    color: getRandomColor(),
    lastActive: Date.now(),
    isTyping: false,
  };
  
  room.collaborators.set(creatorId, creator);
  userRooms.set(creatorId, new Set([roomId]));
  rooms.set(roomId, room);

  return room;
}

// 加入房间
export function joinRoom(
  roomId: string,
  userName: string
): { success: boolean; room?: ServerRoom; user?: ServerCollaborator; error?: string } {
  const room = rooms.get(roomId);
  
  if (!room) {
    return { success: false, error: '房间不存在' };
  }

  if (room.collaborators.size >= room.maxCollaborators) {
    return { success: false, error: '房间已满' };
  }

  const userId = randomUUID();
  const user: ServerCollaborator = {
    id: userId,
    name: userName,
    color: getRandomColor(),
    lastActive: Date.now(),
    isTyping: false,
  };

  room.collaborators.set(userId, user);
  
  // 更新用户房间映射
  if (!userRooms.has(userId)) {
    userRooms.set(userId, new Set());
  }
  userRooms.get(userId)!.add(roomId);

  return { success: true, room, user };
}

// 离开房间
export function leaveRoom(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  room.collaborators.delete(userId);
  
  // 清理用户房间映射
  const userRoomSet = userRooms.get(userId);
  if (userRoomSet) {
    userRoomSet.delete(roomId);
    if (userRoomSet.size === 0) {
      userRooms.delete(userId);
    }
  }

  // 如果房间为空，删除房间
  if (room.collaborators.size === 0) {
    rooms.delete(roomId);
  }

  return true;
}

// 获取房间信息
export function getRoom(roomId: string): ServerRoom | null {
  return rooms.get(roomId) || null;
}

// 更新文档内容
export function updateDocument(
  roomId: string,
  userId: string,
  content: string,
  operation?: Omit<ServerOperation, 'id' | 'userId' | 'timestamp'>
): { success: boolean; version?: number; error?: string } {
  const room = rooms.get(roomId);
  
  if (!room) {
    return { success: false, error: '房间不存在' };
  }

  if (!room.collaborators.has(userId)) {
    return { success: false, error: '用户不在房间中' };
  }

  // 记录操作
  if (operation) {
    const fullOperation: ServerOperation = {
      id: randomUUID(),
      ...operation,
      userId,
      timestamp: Date.now(),
    };
    room.operations.push(fullOperation);
    
    // 保留最近 100 个操作
    if (room.operations.length > 100) {
      room.operations = room.operations.slice(-100);
    }
  }

  room.documentContent = content;
  room.documentVersion++;

  return { success: true, version: room.documentVersion };
}

// 更新用户光标
export function updateCursor(
  roomId: string,
  userId: string,
  cursor: { line: number; column: number }
): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  const user = room.collaborators.get(userId);
  if (!user) return false;

  user.cursor = cursor;
  user.lastActive = Date.now();

  return true;
}

// 更新用户选区
export function updateSelection(
  roomId: string,
  userId: string,
  selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null
): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  const user = room.collaborators.get(userId);
  if (!user) return false;

  if (selection) {
    user.selection = selection;
  } else {
    delete user.selection;
  }
  user.lastActive = Date.now();

  return true;
}

// 更新用户输入状态
export function updateTypingStatus(
  roomId: string,
  userId: string,
  isTyping: boolean
): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  const user = room.collaborators.get(userId);
  if (!user) return false;

  user.isTyping = isTyping;
  user.lastActive = Date.now();

  return true;
}

// 获取房间所有协作者
export function getCollaborators(roomId: string): ServerCollaborator[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.collaborators.values());
}

// 清理过期房间（超过 24 小时无活动）
export function cleanupExpiredRooms(): number {
  const now = Date.now();
  const expireTime = 24 * 60 * 60 * 1000; // 24 小时
  let cleaned = 0;

  for (const [roomId, room] of rooms.entries()) {
    const lastActive = Math.max(
      ...Array.from(room.collaborators.values()).map(c => c.lastActive),
      room.createdAt
    );

    if (now - lastActive > expireTime) {
      rooms.delete(roomId);
      cleaned++;
    }
  }

  return cleaned;
}

// 导出房间数据（用于序列化）
export function exportRoom(roomId: string): object | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  return {
    id: room.id,
    documentId: room.documentId,
    documentTitle: room.documentTitle,
    documentContent: room.documentContent,
    documentVersion: room.documentVersion,
    collaborators: Array.from(room.collaborators.values()),
    operations: room.operations,
    createdAt: room.createdAt,
  };
}
