/**
 * localStorage 存储适配器
 *
 * 默认存储方案，无需任何配置
 * 数据存储在浏览器 localStorage 中
 *
 * 优点：
 * - 无需配置，开箱即用
 * - 完全离线可用
 * - 零服务器成本
 *
 * 限制：
 * - 数据仅存储在当前浏览器
 * - 容量限制约 5-10MB
 * - 无法跨设备同步
 */

import type {
  IStorageAdapter,
  StorageProvider,
  StorageDocument,
  StorageFolder,
  StorageDocumentVersion,
  LocalStorageConfig,
} from '../types';

// 默认配置
const DEFAULT_CONFIG: LocalStorageConfig = {
  provider: 'local',
  prefix: 'therex',
};

// 存储键名
const getStorageKey = (prefix: string, key: string) => `${prefix}-${key}`;

export class LocalStorageAdapter implements IStorageAdapter {
  readonly provider: StorageProvider = 'local';
  
  private config: LocalStorageConfig;
  private initialized: boolean = false;
  
  // 内存缓存
  private documentsCache: Map<string, StorageDocument> = new Map();
  private foldersCache: Map<string, StorageFolder> = new Map();
  private versionsCache: Map<string, StorageDocumentVersion[]> = new Map();

  constructor(config: Partial<LocalStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==================== 初始化 ====================

  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      this.loadFromStorage();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('LocalStorage 初始化失败:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async close(): Promise<void> {
    this.saveToStorage();
    this.initialized = false;
  }

  // ==================== 私有方法 ====================

  private getKey(key: string): string {
    return getStorageKey(this.config.prefix!, key);
  }

  private loadFromStorage(): void {
    // 加载文档
    const docsKey = this.getKey('documents');
    const docsData = localStorage.getItem(docsKey);
    if (docsData) {
      try {
        const docs = JSON.parse(docsData) as StorageDocument[];
        docs.forEach(doc => {
          // 转换日期
          doc.createdAt = new Date(doc.createdAt);
          doc.updatedAt = new Date(doc.updatedAt);
          if (doc.deletedAt) doc.deletedAt = new Date(doc.deletedAt);
          this.documentsCache.set(doc.id, doc);
        });
      } catch (e) {
        console.error('加载文档数据失败:', e);
      }
    }

    // 加载文件夹
    const foldersKey = this.getKey('folders');
    const foldersData = localStorage.getItem(foldersKey);
    if (foldersData) {
      try {
        const folders = JSON.parse(foldersData) as StorageFolder[];
        folders.forEach(folder => {
          folder.createdAt = new Date(folder.createdAt);
          folder.updatedAt = new Date(folder.updatedAt);
          if (folder.deletedAt) folder.deletedAt = new Date(folder.deletedAt);
          this.foldersCache.set(folder.id, folder);
        });
      } catch (e) {
        console.error('加载文件夹数据失败:', e);
      }
    }

    // 加载版本历史
    const versionsKey = this.getKey('versions');
    const versionsData = localStorage.getItem(versionsKey);
    if (versionsData) {
      try {
        const versionsMap = JSON.parse(versionsData) as Record<string, StorageDocumentVersion[]>;
        Object.entries(versionsMap).forEach(([docId, versions]) => {
          versions.forEach(v => {
            v.savedAt = new Date(v.savedAt);
          });
          this.versionsCache.set(docId, versions);
        });
      } catch (e) {
        console.error('加载版本历史失败:', e);
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // 保存文档
      const docs = Array.from(this.documentsCache.values())
        .filter(d => !d.deletedAt);
      localStorage.setItem(this.getKey('documents'), JSON.stringify(docs));

      // 保存文件夹
      const folders = Array.from(this.foldersCache.values())
        .filter(f => !f.deletedAt);
      localStorage.setItem(this.getKey('folders'), JSON.stringify(folders));

      // 保存版本历史
      const versionsMap: Record<string, StorageDocumentVersion[]> = {};
      this.versionsCache.forEach((versions, docId) => {
        versionsMap[docId] = versions;
      });
      localStorage.setItem(this.getKey('versions'), JSON.stringify(versionsMap));
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  }

  private generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateWordCount(content: string): number {
    if (!content || !content.trim()) return 0;
    const words = content.trim().match(/[\w\u4e00-\u9fa5]+/g);
    return words ? words.length : 0;
  }

  // ==================== 文档操作 ====================

  async createDocument(doc: Omit<StorageDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageDocument> {
    const now = new Date();
    const newDoc: StorageDocument = {
      ...doc,
      id: this.generateId('doc'),
      createdAt: now,
      updatedAt: now,
      wordCount: this.calculateWordCount(doc.content),
    };

    this.documentsCache.set(newDoc.id, newDoc);
    this.saveToStorage();
    return newDoc;
  }

  async getDocument(id: string): Promise<StorageDocument | null> {
    const doc = this.documentsCache.get(id);
    if (doc && !doc.deletedAt) {
      return doc;
    }
    return null;
  }

  async updateDocument(id: string, updates: Partial<StorageDocument>): Promise<StorageDocument | null> {
    const doc = this.documentsCache.get(id);
    if (!doc || doc.deletedAt) return null;

    const updatedDoc: StorageDocument = {
      ...doc,
      ...updates,
      updatedAt: new Date(),
      wordCount: updates.content !== undefined 
        ? this.calculateWordCount(updates.content) 
        : doc.wordCount,
    };

    this.documentsCache.set(id, updatedDoc);
    this.saveToStorage();
    return updatedDoc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const doc = this.documentsCache.get(id);
    if (!doc) return false;

    // 软删除
    doc.deletedAt = new Date();
    this.documentsCache.set(id, doc);
    this.saveToStorage();
    return true;
  }

  async getAllDocuments(folderId?: string | null): Promise<StorageDocument[]> {
    let docs = Array.from(this.documentsCache.values())
      .filter(d => !d.deletedAt);

    if (folderId !== undefined) {
      docs = docs.filter(d => d.folderId === folderId);
    }

    return docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async searchDocuments(query: string): Promise<StorageDocument[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.documentsCache.values())
      .filter(d => 
        !d.deletedAt && 
        (d.title.toLowerCase().includes(lowerQuery) || 
         d.content.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // ==================== 文件夹操作 ====================

  async createFolder(folder: Omit<StorageFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageFolder> {
    const now = new Date();
    const newFolder: StorageFolder = {
      ...folder,
      id: this.generateId('folder'),
      createdAt: now,
      updatedAt: now,
    };

    this.foldersCache.set(newFolder.id, newFolder);
    this.saveToStorage();
    return newFolder;
  }

  async getFolder(id: string): Promise<StorageFolder | null> {
    const folder = this.foldersCache.get(id);
    if (folder && !folder.deletedAt) {
      return folder;
    }
    return null;
  }

  async updateFolder(id: string, updates: Partial<StorageFolder>): Promise<StorageFolder | null> {
    const folder = this.foldersCache.get(id);
    if (!folder || folder.deletedAt) return null;

    const updatedFolder: StorageFolder = {
      ...folder,
      ...updates,
      updatedAt: new Date(),
    };

    this.foldersCache.set(id, updatedFolder);
    this.saveToStorage();
    return updatedFolder;
  }

  async deleteFolder(id: string): Promise<boolean> {
    const folder = this.foldersCache.get(id);
    if (!folder) return false;

    // 软删除
    folder.deletedAt = new Date();
    this.foldersCache.set(id, folder);
    this.saveToStorage();
    return true;
  }

  async getAllFolders(): Promise<StorageFolder[]> {
    return Array.from(this.foldersCache.values())
      .filter(f => !f.deletedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ==================== 版本历史操作 ====================

  async saveDocumentVersion(version: Omit<StorageDocumentVersion, 'id' | 'savedAt'>): Promise<StorageDocumentVersion> {
    const newVersion: StorageDocumentVersion = {
      ...version,
      id: this.generateId('ver'),
      savedAt: new Date(),
      wordCount: this.calculateWordCount(version.content),
    };

    const versions = this.versionsCache.get(version.documentId) || [];
    versions.unshift(newVersion);
    
    // 限制版本数量（最多 20 个）
    if (versions.length > 20) {
      versions.pop();
    }
    
    this.versionsCache.set(version.documentId, versions);
    this.saveToStorage();
    return newVersion;
  }

  async getDocumentVersions(documentId: string): Promise<StorageDocumentVersion[]> {
    return this.versionsCache.get(documentId) || [];
  }

  async deleteDocumentVersion(versionId: string): Promise<boolean> {
    for (const [docId, versions] of this.versionsCache.entries()) {
      const index = versions.findIndex(v => v.id === versionId);
      if (index !== -1) {
        versions.splice(index, 1);
        this.versionsCache.set(docId, versions);
        this.saveToStorage();
        return true;
      }
    }
    return false;
  }

  // ==================== 数据迁移 ====================

  async exportAllData(): Promise<{
    documents: StorageDocument[];
    folders: StorageFolder[];
    versions: StorageDocumentVersion[];
  }> {
    const allVersions: StorageDocumentVersion[] = [];
    this.versionsCache.forEach(versions => {
      allVersions.push(...versions);
    });

    return {
      documents: Array.from(this.documentsCache.values()).filter(d => !d.deletedAt),
      folders: Array.from(this.foldersCache.values()).filter(f => !f.deletedAt),
      versions: allVersions,
    };
  }

  async importData(data: {
    documents?: StorageDocument[];
    folders?: StorageFolder[];
    versions?: StorageDocumentVersion[];
  }): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // 导入文档
    if (data.documents) {
      for (const doc of data.documents) {
        try {
          this.documentsCache.set(doc.id, doc);
          success++;
        } catch {
          failed++;
        }
      }
    }

    // 导入文件夹
    if (data.folders) {
      for (const folder of data.folders) {
        try {
          this.foldersCache.set(folder.id, folder);
          success++;
        } catch {
          failed++;
        }
      }
    }

    // 导入版本历史
    if (data.versions) {
      const versionsMap = new Map<string, StorageDocumentVersion[]>();
      for (const version of data.versions) {
        const existing = versionsMap.get(version.documentId) || [];
        existing.push(version);
        versionsMap.set(version.documentId, existing);
      }
      versionsMap.forEach((versions, docId) => {
        this.versionsCache.set(docId, versions);
      });
    }

    this.saveToStorage();
    return { success, failed };
  }
}
