/**
 * 存储管理器入口
 *
 * 统一管理存储适配器，支持：
 * - 自动选择默认存储
 * - 切换存储后端
 * - 数据迁移
 */

// 导出统一存储管理器
export { getStorageManager, documentManager } from './manager';
export type { Document, Folder, DocumentVersion } from './manager';

// 导出类型
export type {
  StorageProvider,
  StorageConfig,
  StorageDocument,
  StorageFolder,
  StorageDocumentVersion,
  StorageAIConfig,
  IStorageAdapter,
  IStorageManager,
  LocalStorageConfig,
  IndexedDBStorageConfig,
  SupabaseStorageConfig,
  PostgreSQLStorageConfig,
  MongoDBStorageConfig,
} from './types';

// 导出适配器
export { LocalStorageAdapter } from './adapters/local-storage';
export { IndexedDBStorageAdapter } from './adapters/indexeddb-storage';
export { SupabaseStorageAdapter } from './adapters/supabase-storage';
