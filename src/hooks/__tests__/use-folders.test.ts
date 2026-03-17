/**
 * useFolders Hook 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFolders } from '../use-folders';

// Mock documentManager
vi.mock('@/lib/storage/manager', () => ({
  documentManager: {
    getAllFolders: vi.fn(() => []),
    createFolder: vi.fn((name, parentId) => ({
      id: 'folder-test-id',
      name,
      parentId,
      createdAt: Date.now(),
    })),
    updateFolder: vi.fn(),
    deleteFolder: vi.fn(),
  },
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

describe('useFolders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该正确初始化状态', () => {
      mockDocumentManager.getAllFolders.mockReturnValue([]);

      const { result } = renderHook(() => useFolders());

      expect(result.current.folders).toEqual([]);
      expect(result.current.currentFolderId).toBeNull();
      expect(result.current.expandedFolders).toBeInstanceOf(Set);
      expect(result.current.expandedFolders.size).toBe(0);
    });

    it('应该加载已有文件夹', () => {
      const mockFolders = [
        { id: 'folder-1', name: 'Folder 1', parentId: null, createdAt: Date.now() },
        { id: 'folder-2', name: 'Folder 2', parentId: 'folder-1', createdAt: Date.now() },
      ];

      mockDocumentManager.getAllFolders.mockReturnValue(mockFolders as any);

      const { result } = renderHook(() => useFolders());

      expect(result.current.folders).toHaveLength(2);
    });
  });

  describe('创建文件夹', () => {
    it('应该创建新文件夹', () => {
      mockDocumentManager.getAllFolders.mockReturnValue([]);

      const { result } = renderHook(() => useFolders());

      let folder: any = null;
      act(() => {
        folder = result.current.createFolder('New Folder');
      });

      expect(mockDocumentManager.createFolder).toHaveBeenCalledWith('New Folder', null);
      expect(folder).not.toBeNull();
    });

    it('应该拒绝空名称', () => {
      mockDocumentManager.getAllFolders.mockReturnValue([]);

      const { result } = renderHook(() => useFolders());

      let folder: any = null;
      act(() => {
        folder = result.current.createFolder('');
      });

      expect(mockDocumentManager.createFolder).not.toHaveBeenCalled();
      expect(folder).toBeNull();
    });

    it('应该创建子文件夹', () => {
      mockDocumentManager.getAllFolders.mockReturnValue([]);

      const { result } = renderHook(() => useFolders());

      act(() => {
        result.current.createFolder('Sub Folder', 'parent-folder-id');
      });

      expect(mockDocumentManager.createFolder).toHaveBeenCalledWith('Sub Folder', 'parent-folder-id');
    });
  });

  describe('删除文件夹', () => {
    it('应该删除指定文件夹', () => {
      const mockFolder = {
        id: 'folder-1',
        name: 'Test Folder',
        parentId: null,
        createdAt: Date.now(),
      };

      mockDocumentManager.getAllFolders.mockReturnValue([mockFolder as any]);

      const { result } = renderHook(() => useFolders());

      act(() => {
        result.current.deleteFolder('folder-1');
      });

      expect(mockDocumentManager.deleteFolder).toHaveBeenCalledWith('folder-1', 'root');
    });

    it('删除当前文件夹时应该重置 currentFolderId', () => {
      const mockFolder = {
        id: 'folder-1',
        name: 'Test Folder',
        parentId: null,
        createdAt: Date.now(),
      };

      mockDocumentManager.getAllFolders.mockReturnValue([mockFolder as any]);

      const { result } = renderHook(() => useFolders());

      // 先设置当前文件夹
      act(() => {
        result.current.setCurrentFolder('folder-1');
      });

      expect(result.current.currentFolderId).toBe('folder-1');

      // 然后删除
      act(() => {
        result.current.deleteFolder('folder-1');
      });

      expect(result.current.currentFolderId).toBeNull();
    });
  });

  describe('重命名文件夹', () => {
    it('应该重命名文件夹', () => {
      mockDocumentManager.getAllFolders.mockReturnValue([]);

      const { result } = renderHook(() => useFolders());

      act(() => {
        result.current.renameFolder('folder-1', 'New Name');
      });

      expect(mockDocumentManager.updateFolder).toHaveBeenCalledWith('folder-1', { name: 'New Name' });
    });

    it('应该拒绝空名称', () => {
      mockDocumentManager.getAllFolders.mockReturnValue([]);

      const { result } = renderHook(() => useFolders());

      act(() => {
        result.current.renameFolder('folder-1', '');
      });

      expect(mockDocumentManager.updateFolder).not.toHaveBeenCalled();
    });
  });

  describe('展开/折叠', () => {
    it('toggleFolderExpand 应该切换展开状态', () => {
      mockDocumentManager.getAllFolders.mockReturnValue([]);

      const { result } = renderHook(() => useFolders());

      // 展开
      act(() => {
        result.current.toggleFolderExpand('folder-1');
      });

      expect(result.current.expandedFolders.has('folder-1')).toBe(true);

      // 折叠
      act(() => {
        result.current.toggleFolderExpand('folder-1');
      });

      expect(result.current.expandedFolders.has('folder-1')).toBe(false);
    });

    it('expandFolder 应该展开文件夹', () => {
      mockDocumentManager.getAllFolders.mockReturnValue([]);

      const { result } = renderHook(() => useFolders());

      act(() => {
        result.current.expandFolder('folder-1');
      });

      expect(result.current.expandedFolders.has('folder-1')).toBe(true);
    });

    it('collapseFolder 应该折叠文件夹', () => {
      mockDocumentManager.getAllFolders.mockReturnValue([]);

      const { result } = renderHook(() => useFolders());

      // 先展开
      act(() => {
        result.current.expandFolder('folder-1');
      });

      expect(result.current.expandedFolders.has('folder-1')).toBe(true);

      // 再折叠
      act(() => {
        result.current.collapseFolder('folder-1');
      });

      expect(result.current.expandedFolders.has('folder-1')).toBe(false);
    });

    it('expandAllFolders 应该展开所有文件夹', () => {
      const mockFolders = [
        { id: 'folder-1', name: 'Folder 1', parentId: null, createdAt: Date.now() },
        { id: 'folder-2', name: 'Folder 2', parentId: null, createdAt: Date.now() },
      ];

      mockDocumentManager.getAllFolders.mockReturnValue(mockFolders as any);

      const { result } = renderHook(() => useFolders());

      act(() => {
        result.current.expandAllFolders();
      });

      expect(result.current.expandedFolders.size).toBe(2);
    });

    it('collapseAllFolders 应该折叠所有文件夹', () => {
      mockDocumentManager.getAllFolders.mockReturnValue([]);

      const { result } = renderHook(() => useFolders());

      // 先展开一些
      act(() => {
        result.current.expandFolder('folder-1');
        result.current.expandFolder('folder-2');
      });

      expect(result.current.expandedFolders.size).toBe(2);

      // 然后全部折叠
      act(() => {
        result.current.collapseAllFolders();
      });

      expect(result.current.expandedFolders.size).toBe(0);
    });
  });

  describe('辅助函数', () => {
    it('getSubfolders 应该返回子文件夹', () => {
      const mockFolders = [
        { id: 'folder-1', name: 'Folder 1', parentId: null, createdAt: Date.now() },
        { id: 'folder-2', name: 'Folder 2', parentId: 'folder-1', createdAt: Date.now() },
        { id: 'folder-3', name: 'Folder 3', parentId: 'folder-1', createdAt: Date.now() },
        { id: 'folder-4', name: 'Folder 4', parentId: 'folder-2', createdAt: Date.now() },
      ];

      mockDocumentManager.getAllFolders.mockReturnValue(mockFolders as any);

      const { result } = renderHook(() => useFolders());

      const subfolders = result.current.getSubfolders('folder-1');
      expect(subfolders).toHaveLength(2);
      expect(subfolders.map(f => f.id)).toContain('folder-2');
      expect(subfolders.map(f => f.id)).toContain('folder-3');
    });

    it('getFolderPath 应该返回文件夹路径', () => {
      const mockFolders = [
        { id: 'folder-1', name: 'Root', parentId: null, createdAt: Date.now() },
        { id: 'folder-2', name: 'Child', parentId: 'folder-1', createdAt: Date.now() },
        { id: 'folder-3', name: 'Grandchild', parentId: 'folder-2', createdAt: Date.now() },
      ];

      mockDocumentManager.getAllFolders.mockReturnValue(mockFolders as any);

      const { result } = renderHook(() => useFolders());

      const path = result.current.getFolderPath('folder-3');
      expect(path).toHaveLength(3);
      expect(path[0].id).toBe('folder-1');
      expect(path[1].id).toBe('folder-2');
      expect(path[2].id).toBe('folder-3');
    });
  });
});
