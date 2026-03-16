/**
 * Therex 统一类型定义
 *
 * 所有核心类型都在此文件中定义，确保一致性
 */

// ==================== 文档类型 ====================

/**
 * 文档接口
 */
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  tags: string[];
  wordCount: number;
  folderId: string | null;
  deletedAt?: number | null;
  versions?: DocumentVersion[];
}

/**
 * 创建文档参数
 */
export interface CreateDocumentParams {
  title?: string;
  content?: string;
  folderId?: string | null;
}

/**
 * 更新文档参数
 */
export interface UpdateDocumentParams {
  title?: string;
  content?: string;
  folderId?: string | null;
  isFavorite?: boolean;
  tags?: string[];
}

// ==================== 文件夹类型 ====================

/**
 * 文件夹接口
 */
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  color?: string;
  icon?: string;
  deletedAt?: number | null;
}

/**
 * 创建文件夹参数
 */
export interface CreateFolderParams {
  name: string;
  parentId?: string | null;
  color?: string;
  icon?: string;
}

/**
 * 更新文件夹参数
 */
export interface UpdateFolderParams {
  name?: string;
  parentId?: string | null;
  color?: string;
  icon?: string;
}

// ==================== 版本历史类型 ====================

/**
 * 文档版本接口
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  title: string;
  savedAt: number;
  wordCount: number;
  description?: string;
}

// ==================== AI 配置类型 ====================

/**
 * AI 提供商类型
 */
export type AIProvider = 'doubao' | 'deepseek' | 'openai' | 'kimi' | 'custom';

/**
 * AI 配置接口
 */
export interface AIConfig {
  id?: string;
  provider: AIProvider;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enableSystemPrompt: boolean;
  systemPrompt: string;
  isDefault?: boolean;
}

// ==================== 存储类型 ====================

/**
 * 存储提供商标识
 */
export type StorageProvider = 'local' | 'indexeddb' | 'supabase' | 'postgresql' | 'mongodb';

/**
 * 存储状态
 */
export type StorageStatus = 'uninitialized' | 'initializing' | 'ready' | 'error';

/**
 * 导出数据格式
 */
export interface ExportData {
  documents: Document[];
  folders: Folder[];
  versions: Record<string, DocumentVersion[]>;
  exportedAt: number;
  version: string;
}

// ==================== UI 状态类型 ====================

/**
 * 编辑器视图模式
 */
export type EditorMode = 'edit' | 'preview' | 'live';

/**
 * 侧边栏标签
 */
export type SidebarTab = 'documents' | 'folders';

/**
 * 自动保存状态
 */
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ==================== 工具类型 ====================

/**
 * 可选属性的递归类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 时间戳类型（兼容 Date 和 number）
 */
export type Timestamp = Date | number;

/**
 * 将类型的时间戳字段转换为 Date
 */
export type WithDate<T> = {
  [K in keyof T]: T[K] extends Timestamp ? Date : T[K];
};

/**
 * 将类型的时间戳字段转换为 number
 */
export type WithNumber<T> = {
  [K in keyof T]: T[K] extends Timestamp ? number : T[K];
};
