/**
 * useDocuments Hook 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocuments } from '../use-documents';
import type { Document } from '@/lib/storage/manager';

// Mock documentManager
vi.mock('@/lib/storage/manager', () => ({
  documentManager: {
    getAllDocuments: vi.fn(() => []),
    getCurrentDocument: vi.fn(() => undefined),
    setCurrentDocument: vi.fn(),
    createDocument: vi.fn((title, content, folderId) => ({
      id: 'test-doc-id',
      title,
      content,
      folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      versions: [],
      isFavorite: false,
      wordCount: content.split(/\s+/).length,
      tags: [],
    })),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    duplicateDocument: vi.fn(),
    toggleFavorite: vi.fn(),
    moveDocumentToFolder: vi.fn(),
    getDocument: vi.fn(),
  },
}));

// Mock templates
vi.mock('@/lib/templates', () => ({
  getTemplateById: vi.fn((id) => {
    if (id === 'test-template') {
      return { id: 'test-template', name: 'Test Template', content: '# Template Content' };
    }
    return null;
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { documentManager } from '@/lib/storage/manager';

const mockDocumentManager = vi.mocked(documentManager);

// 创建完整的文档对象
function createMockDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    title: 'Test Document',
    content: '# Test Content',
    folderId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    isFavorite: false,
    wordCount: 2,
    tags: [],
    ...overrides,
  };
}

describe('useDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('初始化', () => {
    it('应该正确初始化状态', () => {
      mockDocumentManager.getAllDocuments.mockReturnValue([]);
      mockDocumentManager.getCurrentDocument.mockReturnValue(undefined);

      const { result } = renderHook(() => useDocuments());

      expect(result.current.currentDoc).toBeNull();
      expect(result.current.documents).toEqual([]);
      expect(result.current.content).toBe('');
      expect(result.current.title).toBe('');
    });

    it('应该加载当前文档', () => {
      const mockDoc = createMockDoc();

      mockDocumentManager.getAllDocuments.mockReturnValue([mockDoc]);
      mockDocumentManager.getCurrentDocument.mockReturnValue(mockDoc);

      const { result } = renderHook(() => useDocuments());

      expect(result.current.currentDoc).toEqual(mockDoc);
      expect(result.current.content).toBe('# Test Content');
      expect(result.current.title).toBe('Test Document');
    });
  });

  describe('创建文档', () => {
    it('应该创建新文档', () => {
      mockDocumentManager.getAllDocuments.mockReturnValue([]);

      const { result } = renderHook(() => useDocuments());

      act(() => {
        result.current.createDocument();
      });

      expect(mockDocumentManager.createDocument).toHaveBeenCalled();
    });

    it('应该使用模板创建文档', () => {
      mockDocumentManager.getAllDocuments.mockReturnValue([]);

      const { result } = renderHook(() => useDocuments());

      act(() => {
        result.current.createDocument('test-template');
      });

      expect(mockDocumentManager.createDocument).toHaveBeenCalledWith(
        'Test Template',
        '# Template Content',
        null
      );
    });
  });

  describe('切换文档', () => {
    it('应该切换到指定文档', () => {
      const doc1 = createMockDoc({ id: 'doc-1', title: 'Document 1', content: 'Content 1' });
      const doc2 = createMockDoc({ id: 'doc-2', title: 'Document 2', content: 'Content 2' });

      mockDocumentManager.getAllDocuments.mockReturnValue([doc1, doc2]);
      mockDocumentManager.setCurrentDocument.mockReturnValue(doc2);

      const { result } = renderHook(() => useDocuments());

      act(() => {
        result.current.switchDocument('doc-2');
      });

      expect(mockDocumentManager.setCurrentDocument).toHaveBeenCalledWith('doc-2');
    });
  });

  describe('更新内容', () => {
    it('应该更新内容并触发自动保存', async () => {
      const mockDoc = createMockDoc();

      mockDocumentManager.getAllDocuments.mockReturnValue([mockDoc]);
      mockDocumentManager.getCurrentDocument.mockReturnValue(mockDoc);

      const { result } = renderHook(() => useDocuments({ autoSaveDelay: 100 }));

      act(() => {
        result.current.updateContent('Updated content');
      });

      expect(result.current.content).toBe('Updated content');

      // 快进时间触发自动保存
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(mockDocumentManager.updateDocument).toHaveBeenCalled();
    });
  });

  describe('删除文档', () => {
    it('应该删除指定文档', () => {
      const doc1 = createMockDoc({ id: 'doc-1' });

      mockDocumentManager.getAllDocuments.mockReturnValue([doc1]);

      const { result } = renderHook(() => useDocuments());

      act(() => {
        result.current.deleteDocument('doc-1');
      });

      expect(mockDocumentManager.deleteDocument).toHaveBeenCalledWith('doc-1');
    });
  });

  describe('收藏功能', () => {
    it('应该切换文档收藏状态', () => {
      const mockDoc = createMockDoc({ id: 'doc-1' });

      mockDocumentManager.getAllDocuments.mockReturnValue([mockDoc]);

      const { result } = renderHook(() => useDocuments());

      act(() => {
        result.current.toggleFavorite('doc-1');
      });

      expect(mockDocumentManager.toggleFavorite).toHaveBeenCalledWith('doc-1');
    });
  });

  describe('辅助函数', () => {
    it('getDocumentsInFolder 应该返回指定文件夹的文档', () => {
      const docs = [
        createMockDoc({ id: 'doc-1', folderId: 'folder-1' }),
        createMockDoc({ id: 'doc-2', folderId: 'folder-1' }),
        createMockDoc({ id: 'doc-3', folderId: 'folder-2' }),
      ];

      mockDocumentManager.getAllDocuments.mockReturnValue(docs);
      mockDocumentManager.getCurrentDocument.mockReturnValue(undefined);

      const { result } = renderHook(() => useDocuments());

      const folderDocs = result.current.getDocumentsInFolder('folder-1');
      expect(folderDocs).toHaveLength(2);
    });
  });
});
