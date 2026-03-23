/**
 * 协作功能导出
 */

// 类型导出
export type {
  Collaborator,
  CursorPosition,
  SelectionRange,
  Operation,
  DocumentState,
  CollaborationRoom,
  WSMessageType,
  WSMessage,
  JoinMessage,
  LeaveMessage,
  CursorMessage,
  SelectionMessage,
  OperationMessage,
  SyncMessage,
  ChatMessage,
} from './types';

export {
  USER_COLORS,
  getRandomUserColor,
  generateId,
} from './types';

// 重命名导出以避免冲突
export type {
  CollaborationSession as CollaborationSessionState,
} from './types';

// 管理器导出
export {
  CollaborationManager,
  getCollaborationManager,
  resetCollaborationManager,
  type CollaborationEvent,
  type CollaborationEventHandler,
  type CollaborationManagerConfig,
  type CollaborationSession,
} from './manager';
