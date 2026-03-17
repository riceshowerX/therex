/**
 * 统一存储管理器
 *
 * 这是唯一的数据访问入口点，所有组件都应通过此模块访问数据
 * 支持多种存储后端：localStorage、IndexedDB、Supabase
 */

import type {
  Document,
  CreateDocumentParams,
  UpdateDocumentParams,
  Folder,
  CreateFolderParams,
  UpdateFolderParams,
  DocumentVersion,
  StorageProvider,
  StorageStatus,
  ExportData,
} from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('storage');

// ==================== 存储配置 ====================

interface StorageConfig {
  provider: StorageProvider;
}

interface LocalStorageConfig extends StorageConfig {
  provider: 'local';
  prefix: string;
}

interface IndexedDBConfig extends StorageConfig {
  provider: 'indexeddb';
  dbName: string;
}

interface SupabaseConfig extends StorageConfig {
  provider: 'supabase';
  url: string;
  anonKey: string;
}

type AnyStorageConfig = LocalStorageConfig | IndexedDBConfig | SupabaseConfig;

// ==================== 常量 ====================

const STORAGE_CONFIG_KEY = 'therex-storage-config';
const DEFAULT_PREFIX = 'therex';
const MAX_VERSIONS = 20;
const APP_VERSION = '1.0.0';

// ==================== 工具函数 ====================

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function calculateWordCount(content: string): number {
  if (!content || !content.trim()) return 0;
  const words = content.trim().match(/[\w\u4e00-\u9fa5]+/g);
  return words ? words.length : 0;
}

function now(): number {
  return Date.now();
}

// ==================== 存储管理器类 ====================

class StorageManager {
  private status: StorageStatus = 'uninitialized';
  private config: AnyStorageConfig;
  private documents: Map<string, Document> = new Map();
  private folders: Map<string, Folder> = new Map();
  private versions: Map<string, DocumentVersion[]> = new Map();
  private currentDocumentId: string | null = null;

  constructor() {
    // 默认使用 localStorage
    this.config = {
      provider: 'local',
      prefix: DEFAULT_PREFIX,
    };
  }

  // ==================== 初始化 ====================

  /**
   * 初始化存储
   */
  async initialize(): Promise<boolean> {
    if (this.status === 'ready') return true;

    this.status = 'initializing';

    try {
      // 加载保存的配置
      this.loadConfig();

      // 根据配置加载数据
      await this.loadData();

      this.status = 'ready';
      return true;
    } catch (error) {
      logger.error('存储初始化失败', error instanceof Error ? error : undefined);
      this.status = 'error';
      return false;
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): StorageStatus {
    return this.status;
  }

  /**
   * 获取当前配置
   */
  getConfig(): StorageProvider {
    return this.config.provider;
  }

  // ==================== 文档操作 ====================

  /**
   * 创建文档
   */
  createDocument(params: CreateDocumentParams = {}): Document {
    const timestamp = now();
    const doc: Document = {
      id: generateId('doc'),
      title: params.title || 'Untitled',
      content: params.content || '',
      folderId: params.folderId ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      isFavorite: false,
      tags: [],
      wordCount: calculateWordCount(params.content || ''),
      versions: [],
    };

    this.documents.set(doc.id, doc);
    this.currentDocumentId = doc.id;
    this.saveData();

    return doc;
  }

  /**
   * 获取文档
   */
  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  /**
   * 获取当前文档
   */
  getCurrentDocument(): Document | undefined {
    if (!this.currentDocumentId) {
      return this.createDocument();
    }
    return this.documents.get(this.currentDocumentId);
  }

  /**
   * 更新文档
   */
  updateDocument(id: string, updates: UpdateDocumentParams): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;

    const updatedDoc: Document = {
      ...doc,
      ...updates,
      updatedAt: now(),
      wordCount: updates.content !== undefined
        ? calculateWordCount(updates.content)
        : doc.wordCount,
    };

    this.documents.set(id, updatedDoc);
    this.saveData();

    return updatedDoc;
  }

  /**
   * 删除文档
   */
  deleteDocument(id: string): boolean {
    if (!this.documents.has(id)) return false;

    this.documents.delete(id);
    this.versions.delete(id);

    if (this.currentDocumentId === id) {
      this.currentDocumentId = null;
    }

    this.saveData();
    return true;
  }

  /**
   * 获取所有文档
   */
  getAllDocuments(folderId?: string | null): Document[] {
    const docs = Array.from(this.documents.values())
      .filter(doc => !doc.deletedAt);

    if (folderId !== undefined) {
      return docs.filter(doc => doc.folderId === folderId);
    }

    return docs.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 获取收藏的文档
   */
  getFavoriteDocuments(): Document[] {
    return this.getAllDocuments().filter(doc => doc.isFavorite);
  }

  /**
   * 切换收藏状态
   */
  toggleFavorite(id: string): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;

    return this.updateDocument(id, { isFavorite: !doc.isFavorite });
  }

  /**
   * 设置当前文档
   */
  setCurrentDocument(id: string): Document | undefined {
    if (!this.documents.has(id)) return undefined;
    this.currentDocumentId = id;
    this.saveData();
    return this.documents.get(id);
  }

  /**
   * 复制文档
   */
  duplicateDocument(id: string): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;

    return this.createDocument({
      title: `${doc.title} (Copy)`,
      content: doc.content,
      folderId: doc.folderId,
    });
  }

  /**
   * 搜索文档
   */
  searchDocuments(query: string): Document[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllDocuments().filter(doc =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery) ||
      doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 移动文档到文件夹
   */
  moveDocumentToFolder(documentId: string, folderId: string | null): Document | undefined {
    return this.updateDocument(documentId, { folderId });
  }

  // ==================== 文件夹操作 ====================

  /**
   * 创建文件夹
   */
  createFolder(params: CreateFolderParams): Folder {
    const timestamp = now();
    const folder: Folder = {
      id: generateId('folder'),
      name: params.name,
      parentId: params.parentId ?? null,
      color: params.color,
      icon: params.icon,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.folders.set(folder.id, folder);
    this.saveData();

    return folder;
  }

  /**
   * 获取文件夹
   */
  getFolder(id: string): Folder | undefined {
    return this.folders.get(id);
  }

  /**
   * 更新文件夹
   */
  updateFolder(id: string, updates: UpdateFolderParams): Folder | undefined {
    const folder = this.folders.get(id);
    if (!folder) return undefined;

    const updatedFolder: Folder = {
      ...folder,
      ...updates,
      updatedAt: now(),
    };

    this.folders.set(id, updatedFolder);
    this.saveData();

    return updatedFolder;
  }

  /**
   * 删除文件夹
   */
  deleteFolder(id: string, mode: 'root' | 'cascade' = 'root'): boolean {
    if (!this.folders.has(id)) return false;

    if (mode === 'cascade') {
      // 级联删除所有子文档
      this.documents.forEach((doc, docId) => {
        if (doc.folderId === id) {
          this.documents.delete(docId);
          this.versions.delete(docId);
        }
      });
    } else {
      // 将文档移到根目录
      this.documents.forEach((doc, docId) => {
        if (doc.folderId === id) {
          this.updateDocument(docId, { folderId: null });
        }
      });
    }

    // 删除子文件夹
    this.folders.forEach((folder, folderId) => {
      if (folder.parentId === id) {
        this.folders.delete(folderId);
      }
    });

    this.folders.delete(id);
    this.saveData();

    return true;
  }

  /**
   * 获取所有文件夹
   */
  getAllFolders(): Folder[] {
    return Array.from(this.folders.values())
      .filter(f => !f.deletedAt)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * 获取文件夹中的文档
   */
  getDocumentsByFolder(folderId: string | null): Document[] {
    return this.getAllDocuments().filter(doc => doc.folderId === folderId);
  }

  // ==================== 版本历史 ====================

  /**
   * 保存版本
   */
  saveVersion(documentId: string, description?: string): DocumentVersion | undefined {
    const doc = this.documents.get(documentId);
    if (!doc) return undefined;

    const version: DocumentVersion = {
      id: generateId('ver'),
      documentId,
      content: doc.content,
      title: doc.title,
      savedAt: now(),
      wordCount: doc.wordCount,
      description,
    };

    const versions = this.versions.get(documentId) || [];
    versions.unshift(version);

    // 限制版本数量
    if (versions.length > MAX_VERSIONS) {
      versions.pop();
    }

    this.versions.set(documentId, versions);
    this.saveData();

    return version;
  }

  /**
   * 获取版本历史
   */
  getVersionHistory(documentId: string): DocumentVersion[] {
    return this.versions.get(documentId) || [];
  }

  /**
   * 恢复版本
   */
  restoreVersion(documentId: string, versionId: string): Document | undefined {
    const doc = this.documents.get(documentId);
    if (!doc) return undefined;

    const versions = this.versions.get(documentId) || [];
    const version = versions.find(v => v.id === versionId);
    if (!version) return undefined;

    // 先保存当前状态
    this.saveVersion(documentId, '恢复前自动保存');

    // 恢复到指定版本
    return this.updateDocument(documentId, {
      content: version.content,
      title: version.title,
    });
  }

  /**
   * 删除版本
   */
  deleteVersion(documentId: string, versionId: string): boolean {
    const versions = this.versions.get(documentId);
    if (!versions) return false;

    const filtered = versions.filter(v => v.id !== versionId);
    this.versions.set(documentId, filtered);
    this.saveData();

    return true;
  }

  /**
   * 自动保存版本
   */
  autoSaveVersion(documentId: string): DocumentVersion | undefined {
    const doc = this.documents.get(documentId);
    if (!doc) return undefined;

    const versions = this.versions.get(documentId) || [];
    const lastVersion = versions[0];
    const nowTime = now();

    // 如果 5 分钟内已有自动保存，跳过
    if (lastVersion && (nowTime - lastVersion.savedAt) < 5 * 60 * 1000) {
      return undefined;
    }

    // 检查内容是否有变化
    if (lastVersion && lastVersion.content === doc.content) {
      return undefined;
    }

    return this.saveVersion(documentId, '自动保存');
  }

  // ==================== 数据导入导出 ====================

  /**
   * 导出所有数据
   */
  exportAllData(): ExportData {
    const versionsMap: Record<string, DocumentVersion[]> = {};
    this.versions.forEach((v, k) => {
      versionsMap[k] = v;
    });

    return {
      documents: Array.from(this.documents.values()),
      folders: Array.from(this.folders.values()),
      versions: versionsMap,
      exportedAt: now(),
      version: APP_VERSION,
    };
  }

  /**
   * 导入数据
   */
  importData(data: ExportData): { success: number; failed: number } {
    let success = 0;
    let failed = 0;

    // 导入文件夹
    for (const folder of data.folders) {
      try {
        this.folders.set(folder.id, folder);
        success++;
      } catch {
        failed++;
      }
    }

    // 导入文档
    for (const doc of data.documents) {
      try {
        this.documents.set(doc.id, doc);
        success++;
      } catch {
        failed++;
      }
    }

    // 导入版本历史
    for (const [docId, versions] of Object.entries(data.versions)) {
      this.versions.set(docId, versions);
    }

    this.saveData();
    return { success, failed };
  }

  /**
   * 切换存储并迁移数据
   */
  async migrateTo(newProvider: StorageProvider, _config?: unknown): Promise<{ success: number; failed: number }> {
    // 导出当前数据
    const data = this.exportAllData();

    // 切换到新的存储后端（目前仅支持 localStorage）
    // 未来可以扩展支持 IndexedDB、Supabase 等

    // 清空当前数据
    this.documents.clear();
    this.folders.clear();
    this.versions.clear();

    // 重新导入数据
    const result = this.importData(data);

    return result;
  }

  // ==================== 私有方法 ====================

  private loadConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) {
        this.config = JSON.parse(saved) as AnyStorageConfig;
      }
    } catch (error) {
      logger.error('加载存储配置失败', error instanceof Error ? error : undefined);
    }
  }

  private saveConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      logger.error('保存存储配置失败', error instanceof Error ? error : undefined);
    }
  }

  private async loadData(): Promise<void> {
    if (typeof window === 'undefined') return;

    const prefix = (this.config as LocalStorageConfig).prefix || DEFAULT_PREFIX;

    try {
      // 加载文档
      const docsData = localStorage.getItem(`${prefix}-documents`);
      if (docsData) {
        const docs = JSON.parse(docsData) as Document[];
        docs.forEach(doc => {
          // 兼容旧数据
          if (doc.folderId === undefined) doc.folderId = null;
          this.documents.set(doc.id, doc);
        });
      }

      // 加载文件夹
      const foldersData = localStorage.getItem(`${prefix}-folders`);
      if (foldersData) {
        const folders = JSON.parse(foldersData) as Folder[];
        folders.forEach(folder => {
          this.folders.set(folder.id, folder);
        });
      }

      // 加载版本历史
      const versionsData = localStorage.getItem(`${prefix}-versions`);
      if (versionsData) {
        const versionsMap = JSON.parse(versionsData) as Record<string, DocumentVersion[]>;
        for (const [docId, versions] of Object.entries(versionsMap)) {
          this.versions.set(docId, versions);
        }
      }

      // 加载当前文档ID
      const currentId = localStorage.getItem(`${prefix}-current-document`);
      if (currentId && this.documents.has(currentId)) {
        this.currentDocumentId = currentId;
      }
    } catch (error) {
      logger.error('加载数据失败', error instanceof Error ? error : undefined);
    }
  }

  private saveData(): void {
    if (typeof window === 'undefined') return;

    const prefix = (this.config as LocalStorageConfig).prefix || DEFAULT_PREFIX;

    try {
      // 使用防抖保存，避免频繁写入
      this.debouncedSave(prefix);
    } catch (error) {
      logger.error('保存数据失败', error instanceof Error ? error : undefined);
    }
  }

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  private debouncedSave(prefix: string): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.doSave(prefix);
    }, 300);
  }

  private doSave(prefix: string): void {
    try {
      localStorage.setItem(`${prefix}-documents`, JSON.stringify(Array.from(this.documents.values())));
      localStorage.setItem(`${prefix}-folders`, JSON.stringify(Array.from(this.folders.values())));

      const versionsMap: Record<string, DocumentVersion[]> = {};
      this.versions.forEach((v, k) => {
        versionsMap[k] = v;
      });
      localStorage.setItem(`${prefix}-versions`, JSON.stringify(versionsMap));

      if (this.currentDocumentId) {
        localStorage.setItem(`${prefix}-current-document`, this.currentDocumentId);
      }

      this.saveConfig();
    } catch (error) {
      logger.error('保存数据失败', error instanceof Error ? error : undefined);
    }
  }
}

// ==================== 单例导出 ====================

let storageManagerInstance: StorageManager | null = null;

export function getStorageManager(): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager();
  }
  return storageManagerInstance;
}

// 为了向后兼容，导出一个 documentManager 别名
export const documentManager = {
  get instance(): StorageManager {
    return getStorageManager();
  },

  // 文档操作
  createDocument: (title?: string, content?: string, folderId?: string | null) =>
    getStorageManager().createDocument({ title, content, folderId }),
  getDocument: (id: string) => getStorageManager().getDocument(id),
  getCurrentDocument: () => getStorageManager().getCurrentDocument(),
  updateDocument: (id: string, updates: UpdateDocumentParams) =>
    getStorageManager().updateDocument(id, updates),
  deleteDocument: (id: string) => getStorageManager().deleteDocument(id),
  getAllDocuments: (folderId?: string | null) => getStorageManager().getAllDocuments(folderId),
  getFavoriteDocuments: () => getStorageManager().getFavoriteDocuments(),
  toggleFavorite: (id: string) => getStorageManager().toggleFavorite(id),
  setCurrentDocument: (id: string) => getStorageManager().setCurrentDocument(id),
  duplicateDocument: (id: string) => getStorageManager().duplicateDocument(id),
  searchDocuments: (query: string) => getStorageManager().searchDocuments(query),
  moveDocumentToFolder: (docId: string, folderId: string | null) =>
    getStorageManager().moveDocumentToFolder(docId, folderId),

  // 文件夹操作
  createFolder: (name: string, parentId?: string | null, color?: string, icon?: string) =>
    getStorageManager().createFolder({ name, parentId, color, icon }),
  getFolder: (id: string) => getStorageManager().getFolder(id),
  updateFolder: (id: string, updates: UpdateFolderParams) =>
    getStorageManager().updateFolder(id, updates),
  deleteFolder: (id: string, mode?: 'root' | 'cascade') =>
    getStorageManager().deleteFolder(id, mode),
  getAllFolders: () => getStorageManager().getAllFolders(),
  getDocumentsByFolder: (folderId: string | null) =>
    getStorageManager().getDocumentsByFolder(folderId),

  // 版本历史
  saveVersion: (documentId: string, description?: string) =>
    getStorageManager().saveVersion(documentId, description),
  getVersionHistory: (documentId: string) => getStorageManager().getVersionHistory(documentId),
  restoreVersion: (documentId: string, versionId: string) =>
    getStorageManager().restoreVersion(documentId, versionId),
  deleteVersion: (documentId: string, versionId: string) =>
    getStorageManager().deleteVersion(documentId, versionId),
  autoSaveVersion: (documentId: string) => getStorageManager().autoSaveVersion(documentId),

  // 初始化
  initialize: () => getStorageManager().initialize(),
};

// 导出类型
export type { Document, Folder, DocumentVersion, CreateDocumentParams, UpdateDocumentParams };
