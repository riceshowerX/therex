/**
 * IndexedDB 存储适配器
 *
 * 大容量本地存储方案
 * 数据存储在浏览器 IndexedDB 中
 *
 * 优点：
 * - 大容量存储（可达数百 MB 甚至 GB）
 * - 完全离线可用
 * - 零服务器成本
 * - 支持索引和高效查询
 *
 * 限制：
 * - 数据仅存储在当前浏览器
 * - API 较复杂
 */

import type {
  IStorageAdapter,
  StorageProvider,
  StorageDocument,
  StorageFolder,
  StorageDocumentVersion,
  IndexedDBStorageConfig,
} from '../types';

// 默认配置
const DEFAULT_CONFIG: IndexedDBStorageConfig = {
  provider: 'indexeddb',
  dbName: 'therex-db',
  version: 1,
};

// 数据库结构
const STORES = {
  DOCUMENTS: 'documents',
  FOLDERS: 'folders',
  VERSIONS: 'versions',
};

export class IndexedDBStorageAdapter implements IStorageAdapter {
  readonly provider: StorageProvider = 'indexeddb';
  
  private config: IndexedDBStorageConfig;
  private db: IDBDatabase | null = null;
  private initialized: boolean = false;

  constructor(config: Partial<IndexedDBStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==================== 初始化 ====================

  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.error('IndexedDB 不可用');
      return false;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        console.error('IndexedDB 打开失败:', request.error);
        resolve(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建文档存储
        if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
          const docStore = db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
          docStore.createIndex('folderId', 'folderId', { unique: false });
          docStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          docStore.createIndex('isFavorite', 'isFavorite', { unique: false });
          docStore.createIndex('deletedAt', 'deletedAt', { unique: false });
        }

        // 创建文件夹存储
        if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
          const folderStore = db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' });
          folderStore.createIndex('parentId', 'parentId', { unique: false });
          folderStore.createIndex('deletedAt', 'deletedAt', { unique: false });
        }

        // 创建版本历史存储
        if (!db.objectStoreNames.contains(STORES.VERSIONS)) {
          const versionStore = db.createObjectStore(STORES.VERSIONS, { keyPath: 'id' });
          versionStore.createIndex('documentId', 'documentId', { unique: false });
          versionStore.createIndex('savedAt', 'savedAt', { unique: false });
        }
      };
    });
  }

  isInitialized(): boolean {
    return this.initialized && this.db !== null;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  // ==================== 私有方法 ====================

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  private generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateWordCount(content: string): number {
    if (!content || !content.trim()) return 0;
    const words = content.trim().match(/[\w\u4e00-\u9fa5]+/g);
    return words ? words.length : 0;
  }

  private async promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
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

    const store = this.getStore(STORES.DOCUMENTS, 'readwrite');
    await this.promisifyRequest(store.add(newDoc));
    return newDoc;
  }

  async getDocument(id: string): Promise<StorageDocument | null> {
    const store = this.getStore(STORES.DOCUMENTS);
    const doc = await this.promisifyRequest(store.get(id));
    if (doc && !doc.deletedAt) {
      return doc;
    }
    return null;
  }

  async updateDocument(id: string, updates: Partial<StorageDocument>): Promise<StorageDocument | null> {
    const doc = await this.getDocument(id);
    if (!doc) return null;

    const updatedDoc: StorageDocument = {
      ...doc,
      ...updates,
      updatedAt: new Date(),
      wordCount: updates.content !== undefined 
        ? this.calculateWordCount(updates.content) 
        : doc.wordCount,
    };

    const store = this.getStore(STORES.DOCUMENTS, 'readwrite');
    await this.promisifyRequest(store.put(updatedDoc));
    return updatedDoc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const doc = await this.getDocument(id);
    if (!doc) return false;

    // 软删除
    doc.deletedAt = new Date();
    const store = this.getStore(STORES.DOCUMENTS, 'readwrite');
    await this.promisifyRequest(store.put(doc));
    return true;
  }

  async getAllDocuments(folderId?: string | null): Promise<StorageDocument[]> {
    const store = this.getStore(STORES.DOCUMENTS);
    const allDocs = await this.promisifyRequest(store.getAll()) as StorageDocument[];
    
    let docs = allDocs.filter(d => !d.deletedAt);
    
    if (folderId !== undefined) {
      docs = docs.filter(d => d.folderId === folderId);
    }

    return docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async searchDocuments(query: string): Promise<StorageDocument[]> {
    const allDocs = await this.getAllDocuments();
    const lowerQuery = query.toLowerCase();
    return allDocs.filter(d => 
      d.title.toLowerCase().includes(lowerQuery) || 
      d.content.toLowerCase().includes(lowerQuery)
    );
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

    const store = this.getStore(STORES.FOLDERS, 'readwrite');
    await this.promisifyRequest(store.add(newFolder));
    return newFolder;
  }

  async getFolder(id: string): Promise<StorageFolder | null> {
    const store = this.getStore(STORES.FOLDERS);
    const folder = await this.promisifyRequest(store.get(id));
    if (folder && !folder.deletedAt) {
      return folder;
    }
    return null;
  }

  async updateFolder(id: string, updates: Partial<StorageFolder>): Promise<StorageFolder | null> {
    const folder = await this.getFolder(id);
    if (!folder) return null;

    const updatedFolder: StorageFolder = {
      ...folder,
      ...updates,
      updatedAt: new Date(),
    };

    const store = this.getStore(STORES.FOLDERS, 'readwrite');
    await this.promisifyRequest(store.put(updatedFolder));
    return updatedFolder;
  }

  async deleteFolder(id: string): Promise<boolean> {
    const folder = await this.getFolder(id);
    if (!folder) return false;

    // 软删除
    folder.deletedAt = new Date();
    const store = this.getStore(STORES.FOLDERS, 'readwrite');
    await this.promisifyRequest(store.put(folder));
    return true;
  }

  async getAllFolders(): Promise<StorageFolder[]> {
    const store = this.getStore(STORES.FOLDERS);
    const allFolders = await this.promisifyRequest(store.getAll()) as StorageFolder[];
    return allFolders
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

    const store = this.getStore(STORES.VERSIONS, 'readwrite');
    await this.promisifyRequest(store.add(newVersion));

    // 清理旧版本（保留最近 20 个）
    const allVersions = await this.getDocumentVersions(version.documentId);
    if (allVersions.length > 20) {
      const versionsToDelete = allVersions.slice(20);
      for (const v of versionsToDelete) {
        const deleteStore = this.getStore(STORES.VERSIONS, 'readwrite');
        await this.promisifyRequest(deleteStore.delete(v.id));
      }
    }

    return newVersion;
  }

  async getDocumentVersions(documentId: string): Promise<StorageDocumentVersion[]> {
    const store = this.getStore(STORES.VERSIONS);
    const index = store.index('documentId');
    const versions = await this.promisifyRequest(index.getAll(documentId)) as StorageDocumentVersion[];
    return versions.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
  }

  async deleteDocumentVersion(versionId: string): Promise<boolean> {
    const store = this.getStore(STORES.VERSIONS, 'readwrite');
    await this.promisifyRequest(store.delete(versionId));
    return true;
  }

  // ==================== 数据迁移 ====================

  async exportAllData(): Promise<{
    documents: StorageDocument[];
    folders: StorageFolder[];
    versions: StorageDocumentVersion[];
  }> {
    const [documents, folders] = await Promise.all([
      this.getAllDocuments(),
      this.getAllFolders(),
    ]);

    // 获取所有版本
    const versionStore = this.getStore(STORES.VERSIONS);
    const versions = await this.promisifyRequest(versionStore.getAll()) as StorageDocumentVersion[];

    return { documents, folders, versions };
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
      const store = this.getStore(STORES.DOCUMENTS, 'readwrite');
      for (const doc of data.documents) {
        try {
          await this.promisifyRequest(store.put(doc));
          success++;
        } catch {
          failed++;
        }
      }
    }

    // 导入文件夹
    if (data.folders) {
      const store = this.getStore(STORES.FOLDERS, 'readwrite');
      for (const folder of data.folders) {
        try {
          await this.promisifyRequest(store.put(folder));
          success++;
        } catch {
          failed++;
        }
      }
    }

    // 导入版本历史
    if (data.versions) {
      const store = this.getStore(STORES.VERSIONS, 'readwrite');
      for (const version of data.versions) {
        try {
          await this.promisifyRequest(store.put(version));
          success++;
        } catch {
          failed++;
        }
      }
    }

    return { success, failed };
  }
}
