/**
 * Therex 存储抽象层
 *
 * 支持多种存储后端：
 * - localStorage：默认，无需配置，数据存储在浏览器
 * - IndexedDB：大容量本地存储
 * - Supabase：云数据库
 * - PostgreSQL：自建数据库
 * - MongoDB：文档数据库
 */

// ==================== 从统一类型导入 ====================
import type {
  StorageProvider,
  Document,
  Folder,
  DocumentVersion,
} from '@/types';

// 重新导出统一类型，保持向后兼容
export type {
  StorageProvider,
  Document,
  Folder,
  DocumentVersion,
};

// ==================== 存储配置类型 ====================

/**
 * 存储配置基础接口
 */
export interface StorageConfig {
  provider: StorageProvider;
}

/**
 * localStorage 配置
 */
export interface LocalStorageConfig extends StorageConfig {
  provider: 'local';
  prefix?: string; // 键名前缀，避免冲突
}

/**
 * IndexedDB 配置
 */
export interface IndexedDBStorageConfig extends StorageConfig {
  provider: 'indexeddb';
  dbName: string;
  version?: number;
}

/**
 * Supabase 配置
 */
export interface SupabaseStorageConfig extends StorageConfig {
  provider: 'supabase';
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * PostgreSQL 配置
 */
export interface PostgreSQLStorageConfig extends StorageConfig {
  provider: 'postgresql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

/**
 * MongoDB 配置
 */
export interface MongoDBStorageConfig extends StorageConfig {
  provider: 'mongodb';
  uri: string;
  database: string;
}

/**
 * 文档数据结构
 */
export interface StorageDocument {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  tags: string[];
  wordCount: number;
  folderId: string | null;
  deletedAt?: Date | null;
}

/**
 * 文件夹数据结构
 */
export interface StorageFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
  icon?: string;
  deletedAt?: Date | null;
}

/**
 * 文档版本数据结构
 */
export interface StorageDocumentVersion {
  id: string;
  documentId: string;
  content: string;
  title: string;
  savedAt: Date;
  wordCount: number;
  description?: string;
}

/**
 * AI 配置数据结构
 */
export interface StorageAIConfig {
  id: string;
  provider: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enableSystemPrompt: boolean;
  systemPrompt: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 存储适配器接口 ====================

/**
 * 存储适配器接口
 * 所有存储实现必须遵循此接口
 */
export interface IStorageAdapter {
  /**
   * 存储提供商标识
   */
  readonly provider: StorageProvider;

  /**
   * 初始化存储连接
   */
  initialize(): Promise<boolean>;

  /**
   * 检查存储是否已初始化
   */
  isInitialized(): boolean;

  /**
   * 关闭存储连接
   */
  close(): Promise<void>;

  // ==================== 文档操作 ====================

  /**
   * 创建文档
   */
  createDocument(doc: Omit<StorageDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageDocument>;

  /**
   * 获取文档
   */
  getDocument(id: string): Promise<StorageDocument | null>;

  /**
   * 更新文档
   */
  updateDocument(id: string, updates: Partial<StorageDocument>): Promise<StorageDocument | null>;

  /**
   * 删除文档（软删除）
   */
  deleteDocument(id: string): Promise<boolean>;

  /**
   * 获取所有文档
   */
  getAllDocuments(folderId?: string | null): Promise<StorageDocument[]>;

  /**
   * 搜索文档
   */
  searchDocuments(query: string): Promise<StorageDocument[]>;

  // ==================== 文件夹操作 ====================

  /**
   * 创建文件夹
   */
  createFolder(folder: Omit<StorageFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageFolder>;

  /**
   * 获取文件夹
   */
  getFolder(id: string): Promise<StorageFolder | null>;

  /**
   * 更新文件夹
   */
  updateFolder(id: string, updates: Partial<StorageFolder>): Promise<StorageFolder | null>;

  /**
   * 删除文件夹
   */
  deleteFolder(id: string): Promise<boolean>;

  /**
   * 获取所有文件夹
   */
  getAllFolders(): Promise<StorageFolder[]>;

  // ==================== 版本历史操作 ====================

  /**
   * 保存文档版本
   */
  saveDocumentVersion(version: Omit<StorageDocumentVersion, 'id' | 'savedAt'>): Promise<StorageDocumentVersion>;

  /**
   * 获取文档版本历史
   */
  getDocumentVersions(documentId: string): Promise<StorageDocumentVersion[]>;

  /**
   * 删除文档版本
   */
  deleteDocumentVersion(versionId: string): Promise<boolean>;

  // ==================== 数据迁移 ====================

  /**
   * 导出所有数据
   */
  exportAllData(): Promise<{
    documents: StorageDocument[];
    folders: StorageFolder[];
    versions: StorageDocumentVersion[];
  }>;

  /**
   * 导入数据
   */
  importData(data: {
    documents?: StorageDocument[];
    folders?: StorageFolder[];
    versions?: StorageDocumentVersion[];
  }): Promise<{ success: number; failed: number }>;
}

// ==================== 存储管理器接口 ====================

/**
 * 存储管理器接口
 */
export interface IStorageManager {
  /**
   * 获取当前存储适配器
   */
  getAdapter(): IStorageAdapter;

  /**
   * 切换存储适配器
   */
  switchAdapter(config: StorageConfig): Promise<boolean>;

  /**
   * 获取当前存储配置
   */
  getConfig(): StorageConfig | null;

  /**
   * 检查存储是否可用
   */
  isAvailable(): Promise<boolean>;

  /**
   * 迁移数据到新存储
   */
  migrateTo(newConfig: StorageConfig): Promise<{ success: number; failed: number }>;
}
