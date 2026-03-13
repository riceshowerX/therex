// 文件夹类型定义
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;  // 支持嵌套文件夹
  createdAt: number;
  updatedAt: number;
  color?: string;  // 文件夹颜色
  icon?: string;   // 文件夹图标
}

// 版本历史类型定义
export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  title: string;
  savedAt: number;
  wordCount: number;
  description?: string;  // 版本描述
}

// 文档类型定义
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  tags: string[];
  wordCount: number;
  folderId: string | null;  // 所属文件夹
  versions?: DocumentVersion[];  // 版本历史
}

// 文档管理类
class DocumentManager {
  private readonly STORAGE_KEY = 'markflow-documents';
  private readonly FOLDERS_KEY = 'markflow-folders';
  private documents: Map<string, Document> = new Map();
  private folders: Map<string, Folder> = new Map();
  private currentDocumentId: string | null = null;
  private readonly MAX_VERSIONS = 20;  // 每个文档最多保存的版本数

  constructor() {
    this.loadFromStorage();
  }

  // 从 localStorage 加载数据
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // 加载文档
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const docs = JSON.parse(data) as Document[];
        docs.forEach(doc => {
          // 兼容旧数据，添加缺失字段
          if (doc.folderId === undefined) doc.folderId = null;
          if (doc.versions === undefined) doc.versions = [];
          this.documents.set(doc.id, doc);
        });
      }
      
      // 加载文件夹
      const foldersData = localStorage.getItem(this.FOLDERS_KEY);
      if (foldersData) {
        const folders = JSON.parse(foldersData) as Folder[];
        folders.forEach(folder => {
          this.folders.set(folder.id, folder);
        });
      }
      
      const currentId = localStorage.getItem('current-document-id');
      if (currentId && this.documents.has(currentId)) {
        this.currentDocumentId = currentId;
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }

  // 保存到 localStorage
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const docs = Array.from(this.documents.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(docs));
      
      const folders = Array.from(this.folders.values());
      localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
      
      if (this.currentDocumentId) {
        localStorage.setItem('current-document-id', this.currentDocumentId);
      }
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  // 生成唯一 ID
  private generateId(prefix: string = 'doc'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== 文档操作 ====================

  // 创建新文档
  createDocument(title: string = 'Untitled', content: string = '', folderId: string | null = null): Document {
    const now = Date.now();
    const doc: Document = {
      id: this.generateId('doc'),
      title,
      content,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      tags: [],
      wordCount: content.trim() ? content.trim().split(/\s+/).length : 0,
      folderId,
      versions: [],
    };
    
    this.documents.set(doc.id, doc);
    this.currentDocumentId = doc.id;
    this.saveToStorage();
    return doc;
  }

  // 获取文档
  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  // 获取当前文档
  getCurrentDocument(): Document | undefined {
    if (!this.currentDocumentId) {
      return this.createDocument();
    }
    return this.documents.get(this.currentDocumentId);
  }

  // 更新文档
  updateDocument(id: string, updates: Partial<Document>): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    const updatedDoc: Document = {
      ...doc,
      ...updates,
      updatedAt: Date.now(),
      wordCount: updates.content !== undefined 
        ? (updates.content.trim() ? updates.content.trim().split(/\s+/).length : 0)
        : doc.wordCount,
    };
    
    this.documents.set(id, updatedDoc);
    this.saveToStorage();
    return updatedDoc;
  }

  // 删除文档
  deleteDocument(id: string): boolean {
    if (!this.documents.has(id)) return false;
    
    this.documents.delete(id);
    if (this.currentDocumentId === id) {
      this.currentDocumentId = null;
    }
    this.saveToStorage();
    return true;
  }

  // 复制文档
  duplicateDocument(id: string): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    return this.createDocument(`${doc.title} (Copy)`, doc.content, doc.folderId);
  }

  // 设置当前文档
  setCurrentDocument(id: string): Document | undefined {
    if (!this.documents.has(id)) return undefined;
    this.currentDocumentId = id;
    this.saveToStorage();
    return this.documents.get(id);
  }

  // 获取所有文档
  getAllDocuments(): Document[] {
    return Array.from(this.documents.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // 获取指定文件夹的文档
  getDocumentsByFolder(folderId: string | null): Document[] {
    return this.getAllDocuments().filter(doc => doc.folderId === folderId);
  }

  // 获取收藏的文档
  getFavoriteDocuments(): Document[] {
    return this.getAllDocuments().filter(doc => doc.isFavorite);
  }

  // 切换收藏状态
  toggleFavorite(id: string): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    return this.updateDocument(id, { isFavorite: !doc.isFavorite });
  }

  // 移动文档到文件夹
  moveDocumentToFolder(documentId: string, folderId: string | null): Document | undefined {
    return this.updateDocument(documentId, { folderId });
  }

  // 搜索文档
  searchDocuments(query: string): Document[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllDocuments().filter(doc => 
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery) ||
      doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // ==================== 版本历史 ====================

  // 保存版本
  saveVersion(id: string, description?: string): DocumentVersion | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    const version: DocumentVersion = {
      id: this.generateId('ver'),
      documentId: id,
      content: doc.content,
      title: doc.title,
      savedAt: Date.now(),
      wordCount: doc.wordCount,
      description,
    };
    
    const versions = doc.versions || [];
    versions.unshift(version);
    
    // 限制版本数量
    if (versions.length > this.MAX_VERSIONS) {
      versions.pop();
    }
    
    this.updateDocument(id, { versions });
    return version;
  }

  // 获取版本历史
  getVersionHistory(id: string): DocumentVersion[] {
    const doc = this.documents.get(id);
    return doc?.versions || [];
  }

  // 恢复到指定版本
  restoreVersion(documentId: string, versionId: string): Document | undefined {
    const doc = this.documents.get(documentId);
    if (!doc || !doc.versions) return undefined;
    
    const version = doc.versions.find(v => v.id === versionId);
    if (!version) return undefined;
    
    // 先保存当前版本
    this.saveVersion(documentId, 'Before restore');
    
    // 恢复到指定版本
    return this.updateDocument(documentId, {
      content: version.content,
      title: version.title,
    });
  }

  // 删除版本
  deleteVersion(documentId: string, versionId: string): Document | undefined {
    const doc = this.documents.get(documentId);
    if (!doc || !doc.versions) return undefined;
    
    const versions = doc.versions.filter(v => v.id !== versionId);
    return this.updateDocument(documentId, { versions });
  }

  // 自动保存版本（每 5 分钟自动保存一次）
  autoSaveVersion(id: string): DocumentVersion | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    const lastVersion = doc.versions?.[0];
    const now = Date.now();
    
    // 如果 5 分钟内已有自动保存，跳过
    if (lastVersion && (now - lastVersion.savedAt) < 5 * 60 * 1000) {
      return undefined;
    }
    
    // 检查内容是否有变化
    if (lastVersion && lastVersion.content === doc.content) {
      return undefined;
    }
    
    return this.saveVersion(id, 'Auto-saved');
  }

  // ==================== 文件夹操作 ====================

  // 创建文件夹
  createFolder(name: string, parentId: string | null = null, color?: string, icon?: string): Folder {
    const now = Date.now();
    const folder: Folder = {
      id: this.generateId('folder'),
      name,
      parentId,
      createdAt: now,
      updatedAt: now,
      color,
      icon,
    };
    
    this.folders.set(folder.id, folder);
    this.saveToStorage();
    return folder;
  }

  // 获取文件夹
  getFolder(id: string): Folder | undefined {
    return this.folders.get(id);
  }

  // 更新文件夹
  updateFolder(id: string, updates: Partial<Folder>): Folder | undefined {
    const folder = this.folders.get(id);
    if (!folder) return undefined;
    
    const updatedFolder: Folder = {
      ...folder,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.folders.set(id, updatedFolder);
    this.saveToStorage();
    return updatedFolder;
  }

  // 删除文件夹
  deleteFolder(id: string, moveDocumentsTo: 'root' | 'parent' = 'root'): boolean {
    if (!this.folders.has(id)) return false;
    
    const folder = this.folders.get(id);
    
    // 移动文件夹内的文档
    const targetFolderId = moveDocumentsTo === 'parent' && folder?.parentId 
      ? folder.parentId 
      : null;
    
    this.documents.forEach(doc => {
      if (doc.folderId === id) {
        doc.folderId = targetFolderId;
      }
    });
    
    // 移动子文件夹到父文件夹或根目录
    this.folders.forEach(f => {
      if (f.parentId === id) {
        f.parentId = targetFolderId;
      }
    });
    
    this.folders.delete(id);
    this.saveToStorage();
    return true;
  }

  // 获取所有文件夹
  getAllFolders(): Folder[] {
    return Array.from(this.folders.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // 获取根文件夹
  getRootFolders(): Folder[] {
    return this.getAllFolders().filter(f => f.parentId === null);
  }

  // 获取子文件夹
  getChildFolders(parentId: string): Folder[] {
    return this.getAllFolders().filter(f => f.parentId === parentId);
  }

  // 获取文件夹路径
  getFolderPath(folderId: string): Folder[] {
    const path: Folder[] = [];
    let current = this.folders.get(folderId);
    
    while (current) {
      path.unshift(current);
      current = current.parentId ? this.folders.get(current.parentId) : undefined;
    }
    
    return path;
  }

  // ==================== 标签操作 ====================

  // 添加标签
  addTag(id: string, tag: string): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    if (!doc.tags.includes(tag)) {
      return this.updateDocument(id, { tags: [...doc.tags, tag] });
    }
    return doc;
  }

  // 移除标签
  removeTag(id: string, tag: string): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    return this.updateDocument(id, { 
      tags: doc.tags.filter(t => t !== tag) 
    });
  }

  // 获取所有标签
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.documents.forEach(doc => {
      doc.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  // ==================== 统计信息 ====================

  // 获取统计信息
  getStats(): { totalDocs: number; totalWords: number; totalChars: number; totalFolders: number } {
    let totalWords = 0;
    let totalChars = 0;
    
    this.documents.forEach(doc => {
      totalWords += doc.wordCount;
      totalChars += doc.content.length;
    });
    
    return {
      totalDocs: this.documents.size,
      totalWords,
      totalChars,
      totalFolders: this.folders.size,
    };
  }

  // ==================== 导入导出 ====================

  // 导出所有数据
  exportAllData(): string {
    const data = {
      documents: Array.from(this.documents.values()),
      folders: Array.from(this.folders.values()),
      exportedAt: Date.now(),
      version: '1.0',
    };
    return JSON.stringify(data, null, 2);
  }

  // 导入数据
  importData(jsonData: string): { docs: number; folders: number } {
    try {
      const data = JSON.parse(jsonData);
      let docsImported = 0;
      let foldersImported = 0;
      
      // 导入文件夹
      if (data.folders && Array.isArray(data.folders)) {
        data.folders.forEach((folder: Folder) => {
          if (folder.id && folder.name) {
            this.folders.set(folder.id, {
              ...folder,
              id: this.generateId('folder'), // 生成新 ID 避免冲突
            });
            foldersImported++;
          }
        });
      }
      
      // 导入文档
      if (data.documents && Array.isArray(data.documents)) {
        data.documents.forEach((doc: Document) => {
          if (doc.id && doc.title) {
            this.documents.set(doc.id, {
              ...doc,
              id: this.generateId('doc'), // 生成新 ID 避免冲突
              folderId: null, // 导入的文档放到根目录
              versions: [],
            });
            docsImported++;
          }
        });
      }
      
      this.saveToStorage();
      return { docs: docsImported, folders: foldersImported };
    } catch (e) {
      console.error('Failed to import data:', e);
      return { docs: 0, folders: 0 };
    }
  }

  // 清空所有数据
  clearAllData(): void {
    this.documents.clear();
    this.folders.clear();
    this.currentDocumentId = null;
    this.saveToStorage();
  }
}

// 导出单例
export const documentManager = new DocumentManager();
