/**
 * 协作服务器端逻辑
 * 使用内存存储管理协作房间和用户
 * 
 * 限制说明：
 * - 此模块仅适用于单进程开发环境，多进程部署需改用 Redis/数据库持久化
 * - 房间上限 MAX_ROOMS，防止内存泄漏
 * - 用户每分钟创建房间上限 RATE_LIMIT_ROOMS_PER_USER，防止滥用
 * - cleanupScheduler 在模块加载时自动启动
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

// 房间/用户访问令牌（P1-3：协作 API 最小鉴权）
// roomTokens: roomId -> 创建房间时生成的房间令牌（预留，可作邀请码）
// userTokens: userId -> 该用户在房间中的访问令牌
// tokenToUser: token -> userId（用于 SSE 订阅等仅凭 token 的校验）
const roomTokens = new Map<string, string>();
const userTokens = new Map<string, string>();
const tokenToUser = new Map<string, string>();

// 安全限制
const MAX_ROOMS = 100; // 最大房间数
const MAX_OPERATIONS_PER_ROOM = 100; // 每个房间最大操作数
const MAX_DOCUMENT_CONTENT_LENGTH = 2 * 1024 * 1024; // 文档内容最大 2MB（P1-3）
const RATE_LIMIT_ROOMS_PER_USER = 5; // 每用户最多创建房间数
const RATE_LIMIT_WINDOW = 60 * 1000; // 速率限制窗口（1分钟）
const userRoomCreationLog = new Map<string, number[]>(); // userId -> 创建时间戳列表

// 生成房间 ID（完整 UUID，128 位随机，不可枚举，P1-3）
export function generateRoomId(): string {
  return randomUUID();
}

// 生成访问令牌
function generateToken(): string {
  return randomUUID();
}

// 校验用户访问令牌是否有效且属于该房间（P1-3）
export function verifyRoomToken(roomId: string, userId: string, token?: string): boolean {
  if (!token) return false;
  const expected = userTokens.get(userId);
  if (!expected || expected !== token) return false;
  if (tokenToUser.get(token) !== userId) return false;
  const room = rooms.get(roomId);
  return !!room && room.collaborators.has(userId);
}

// 获取用户访问令牌
export function getUserToken(userId: string): string | null {
  return userTokens.get(userId) ?? null;
}

// 根据令牌反查 userId（SSE 等仅凭 token 的场景）
export function getUserIdByToken(token: string): string | null {
  return tokenToUser.get(token) ?? null;
}

// 校验文档内容长度（P1-3）
export function isContentWithinLimit(content: string): boolean {
  return content.length <= MAX_DOCUMENT_CONTENT_LENGTH;
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
): ServerRoom | { error: string } {
  // 房间总数上限
  if (rooms.size >= MAX_ROOMS) {
    return { error: '房间数量已达上限，请稍后重试' };
  }

  // 用户速率限制
  const now = Date.now();
  const userCreationTimes = userRoomCreationLog.get(creatorName) || [];
  const recentCreations = userCreationTimes.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recentCreations.length >= RATE_LIMIT_ROOMS_PER_USER) {
    return { error: '创建房间过于频繁，请稍后重试' };
  }
  recentCreations.push(now);
  userRoomCreationLog.set(creatorName, recentCreations);

  const roomId = generateRoomId();
  const creatorId = randomUUID();
  const creatorToken = generateToken();
  
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
  roomTokens.set(roomId, creatorToken);
  userTokens.set(creatorId, creatorToken);
  tokenToUser.set(creatorToken, creatorId);
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
  const userToken = generateToken();
  const user: ServerCollaborator = {
    id: userId,
    name: userName,
    color: getRandomColor(),
    lastActive: Date.now(),
    isTyping: false,
  };

  room.collaborators.set(userId, user);
  userTokens.set(userId, userToken);
  tokenToUser.set(userToken, userId);
  
  // 更新用户房间映射
  if (!userRooms.has(userId)) {
    userRooms.set(userId, new Set());
  }
  userRooms.get(userId)!.add(roomId);

  return { success: true, room, user };
}

// 离开房间
export function leaveRoom(roomId: string, userId: string): { success: boolean; isEmpty: boolean } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, isEmpty: true };

  room.collaborators.delete(userId);
  
  // 清理用户房间映射
  const userRoomSet = userRooms.get(userId);
  if (userRoomSet) {
    userRoomSet.delete(roomId);
    if (userRoomSet.size === 0) {
      userRooms.delete(userId);
      // 用户不在任何房间时，清理其访问令牌
      const token = userTokens.get(userId);
      if (token) {
        userTokens.delete(userId);
        tokenToUser.delete(token);
      }
    }
  }

  // 注意：不再立即删除房间，让房间保持存在以便其他人可以加入
  // 房间会在 cleanupExpiredRooms 中被清理（超过 24 小时无活动）
  
  return { success: true, isEmpty: room.collaborators.size === 0 };
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
  operation?: Omit<ServerOperation, 'id' | 'userId' | 'timestamp'>,
  baseVersion?: number
): { success: boolean; version?: number; error?: string; conflict?: boolean } {
  const room = rooms.get(roomId);
  
  if (!room) {
    return { success: false, error: '房间不存在' };
  }

  if (!room.collaborators.has(userId)) {
    return { success: false, error: '用户不在房间中' };
  }

  // 版本冲突检测（保留 last-write-wins，但向客户端报告冲突，P1-3）
  const conflict = baseVersion !== undefined && baseVersion < room.documentVersion;

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

  return { success: true, version: room.documentVersion, conflict };
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
      roomTokens.delete(roomId);
      // 清理该房间内用户的令牌（仅当其不再属于任何房间时）
      for (const collaboratorId of room.collaborators.keys()) {
        const userRoomSet = userRooms.get(collaboratorId);
        userRoomSet?.delete(roomId);
        if (userRoomSet && userRoomSet.size === 0) {
          userRooms.delete(collaboratorId);
          const token = userTokens.get(collaboratorId);
          if (token) {
            userTokens.delete(collaboratorId);
            tokenToUser.delete(token);
          }
        }
      }
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

// 定时清理机制
let cleanupInterval: ReturnType<typeof setInterval> | null = null;
let cleanupStarted = false;

/**
 * 启动定时清理任务
 * 每小时清理一次过期房间
 */
export function startCleanupScheduler(): void {
  if (cleanupInterval) return; // 避免重复启动
  
  // 每小时执行一次清理
  cleanupInterval = setInterval(() => {
    const cleaned = cleanupExpiredRooms();
    if (cleaned > 0) {
      console.log(`[Collaboration] Cleaned ${cleaned} expired rooms`);
    }
    // 同时清理过期的速率限制记录
    const now = Date.now();
    for (const [user, times] of userRoomCreationLog.entries()) {
      const recent = times.filter(t => now - t < RATE_LIMIT_WINDOW);
      if (recent.length === 0) {
        userRoomCreationLog.delete(user);
      } else {
        userRoomCreationLog.set(user, recent);
      }
    }
  }, 60 * 60 * 1000); // 1 小时

  // 启动时立即清理一次
  cleanupExpiredRooms();
  cleanupStarted = true;
}

/**
 * 停止定时清理任务
 */
export function stopCleanupScheduler(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  cleanupStarted = false;
}

/**
 * 自动启动清理（模块加载时调用一次）
 */
if (!cleanupStarted && typeof globalThis !== 'undefined') {
  // 延迟启动，避免影响模块初始化
  setTimeout(() => {
    startCleanupScheduler();
  }, 5000);
}

/**
 * 获取房间统计信息
 */
export function getStats(): { totalRooms: number; totalUsers: number } {
  return {
    totalRooms: rooms.size,
    totalUsers: userRooms.size,
  };
}
