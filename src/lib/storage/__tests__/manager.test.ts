/**
 * 存储管理器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStorageManager } from '@/lib/storage/manager';

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
    // 重置单例
    vi.resetModules();
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
      
      expect(doc.wordCount).toBe(4);
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
});
