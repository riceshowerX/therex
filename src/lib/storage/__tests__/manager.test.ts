/**
 * 存储管理器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStorageManager, resetStorageManager } from '@/lib/storage/manager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('StorageManager', () => {
  let storageManager: ReturnType<typeof getStorageManager>;

  beforeEach(() => {
    localStorageMock.clear();
    // 重置单例（注意：静态 import 绑定指向首个模块实例，需用 resetStorageManager 真正重置）
    resetStorageManager();
    storageManager = getStorageManager();
  });

  describe('createDocument', () => {
    it('should create a document with default values', () => {
      const doc = storageManager.createDocument({});
      
      expect(doc).toBeDefined();
      expect(doc.id).toMatch(/^doc_/);
      expect(doc.title).toBe('Untitled');
      expect(doc.content).toBe('');
      expect(doc.isFavorite).toBe(false);
      expect(doc.tags).toEqual([]);
    });

    it('should create a document with custom values', () => {
      const doc = storageManager.createDocument({
        title: 'Test Document',
        content: '# Hello World',
        folderId: 'folder-123',
      });
      
      expect(doc.title).toBe('Test Document');
      expect(doc.content).toBe('# Hello World');
      expect(doc.folderId).toBe('folder-123');
    });

    it('should calculate word count correctly', () => {
      const doc = storageManager.createDocument({
        content: 'Hello world 你好世界',
      });
      
      // 连续的字母或汉字被当作一个词
      // Hello, world, 你好世界 = 3
      expect(doc.wordCount).toBe(3);
    });
  });

  describe('getDocument', () => {
    it('should return undefined for non-existent document', () => {
      const doc = storageManager.getDocument('non-existent');
      expect(doc).toBeUndefined();
    });

    it('should return the correct document', () => {
      const created = storageManager.createDocument({ title: 'Test' });
      const retrieved = storageManager.getDocument(created.id);
      
      expect(retrieved).toEqual(created);
    });
  });

  describe('updateDocument', () => {
    it('should update document properties', () => {
      const doc = storageManager.createDocument({ title: 'Original' });
      const updated = storageManager.updateDocument(doc.id, {
        title: 'Updated',
        content: 'New content',
      });
      
      expect(updated?.title).toBe('Updated');
      expect(updated?.content).toBe('New content');
    });

    it('should return undefined for non-existent document', () => {
      const result = storageManager.updateDocument('non-existent', { title: 'Test' });
      expect(result).toBeUndefined();
    });

    it('should update word count when content changes', () => {
      const doc = storageManager.createDocument({ content: 'Hello' });
      const updated = storageManager.updateDocument(doc.id, {
        content: 'Hello world test',
      });
      
      expect(updated?.wordCount).toBe(3);
    });
  });

  describe('deleteDocument', () => {
    it('should delete an existing document', () => {
      const doc = storageManager.createDocument({});
      const result = storageManager.deleteDocument(doc.id);
      
      expect(result).toBe(true);
      expect(storageManager.getDocument(doc.id)).toBeUndefined();
    });

    it('should return false for non-existent document', () => {
      const result = storageManager.deleteDocument('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', () => {
      const doc = storageManager.createDocument({});
      expect(doc.isFavorite).toBe(false);
      
      const updated = storageManager.toggleFavorite(doc.id);
      expect(updated?.isFavorite).toBe(true);
      
      const updated2 = storageManager.toggleFavorite(doc.id);
      expect(updated2?.isFavorite).toBe(false);
    });
  });

  describe('Folder operations', () => {
    it('should create a folder', () => {
      const folder = storageManager.createFolder({ name: 'Test Folder' });
      
      expect(folder).toBeDefined();
      expect(folder.id).toMatch(/^folder_/);
      expect(folder.name).toBe('Test Folder');
    });

    it('should create nested folders', () => {
      const parent = storageManager.createFolder({ name: 'Parent' });
      const child = storageManager.createFolder({
        name: 'Child',
        parentId: parent.id,
      });
      
      expect(child.parentId).toBe(parent.id);
    });
  });

  describe('Version history', () => {
    it('should save version', () => {
      const doc = storageManager.createDocument({
        title: 'Test',
        content: 'Original content',
      });
      
      const version = storageManager.saveVersion(doc.id, 'Initial version');
      
      expect(version).toBeDefined();
      expect(version?.description).toBe('Initial version');
      expect(version?.content).toBe('Original content');
    });

    it('should restore version', () => {
      const doc = storageManager.createDocument({
        title: 'Test',
        content: 'Original',
      });
      
      storageManager.saveVersion(doc.id, 'v1');
      storageManager.updateDocument(doc.id, { content: 'Modified' });
      const v2 = storageManager.saveVersion(doc.id, 'v2');
      
      const restored = storageManager.restoreVersion(doc.id, v2!.id);
      expect(restored?.content).toBe('Modified');
    });
  });

  describe('initialize / loadData / saveData（P0-1 数据持久化）', () => {
    it('initialize 后应能从 localStorage 载入已有文档', async () => {
      // 预置持久层数据（模拟上一次会话保存的文档）
      const persisted = [{
        id: 'doc_persisted_1',
        title: '已存在文档',
        content: '# 内容',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
        tags: [],
        wordCount: 2,
        folderId: null,
      }];
      localStorageMock.setItem('therex-documents', JSON.stringify(persisted));

      await storageManager.initialize();

      expect(storageManager.isInitialized()).toBe(true);
      const docs = storageManager.getAllDocuments();
      expect(docs).toHaveLength(1);
      expect(docs[0].id).toBe('doc_persisted_1');
      expect(storageManager.getDocument('doc_persisted_1')?.title).toBe('已存在文档');
    });

    it('initialize 后 getCurrentDocument 不再隐式创建文档', async () => {
      await storageManager.initialize();
      expect(storageManager.getCurrentDocument()).toBeUndefined();
    });

    it('未初始化时 doSave 不会用空内存覆盖持久层已有数据', async () => {
      // 预置持久层数据
      const persisted = [{
        id: 'doc_keep_1',
        title: '不能丢',
        content: 'x',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
        tags: [],
        wordCount: 1,
        folderId: null,
      }];
      localStorageMock.setItem('therex-documents', JSON.stringify(persisted));

      // 不调用 initialize，直接触发一次保存（模拟旧 bug 场景）
      storageManager.createDocument({ title: '新文档' });
      // 手动触发防抖后的实际写入（forceSave 同步执行）
      storageManager.forceSave();

      const saved = JSON.parse(localStorageMock.getItem('therex-documents') as string);
      const ids = (saved as Array<{ id: string }>).map(d => d.id);
      // 持久层已有文档必须保留（不再被覆盖丢失），且新文档一并写入
      expect(ids).toContain('doc_keep_1');
      expect(saved).toHaveLength(2);
    });

    it('初始化后保存的数据应能再次载入', async () => {
      await storageManager.initialize();
      const doc = storageManager.createDocument({ title: '持久化测试', content: 'hello world' });
      storageManager.updateDocument(doc.id, { content: 'updated content' });
      storageManager.forceSave();

      // 模拟新的管理器实例（重置单例后重新获取）
      resetStorageManager();
      const freshManager = getStorageManager();
      await freshManager.initialize();

      const loaded = freshManager.getDocument(doc.id);
      expect(loaded).toBeDefined();
      expect(loaded?.content).toBe('updated content');
    });
  });
});
