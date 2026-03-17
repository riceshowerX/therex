/**
 * useVersions Hook 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVersions } from '../use-versions';

// Mock documentManager
vi.mock('@/lib/storage/manager', () => ({
  documentManager: {
    getVersionHistory: vi.fn(() => []),
    autoSaveVersion: vi.fn(() => undefined),
    saveVersion: vi.fn(() => undefined),
    restoreVersion: vi.fn(() => undefined),
    deleteVersion: vi.fn(),
  },
}));

// Mock constants
vi.mock('@/lib/constants', () => ({
  AUTO_SAVE_INTERVAL_MS: 60000,
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

describe('useVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('初始化', () => {
    it('应该正确初始化状态', () => {
      mockDocumentManager.getVersionHistory.mockReturnValue([]);

      const { result } = renderHook(() => useVersions(null));

      expect(result.current.versions).toEqual([]);
      expect(result.current.hasVersions).toBe(false);
      expect(result.current.latestVersion).toBeNull();
    });

    it('应该加载版本历史', () => {
      const mockVersions = [
        {
          id: 'v1',
          content: 'Content 1',
          title: 'Title 1',
          timestamp: Date.now(),
          description: 'First version',
        },
        {
          id: 'v2',
          content: 'Content 2',
          title: 'Title 2',
          timestamp: Date.now(),
          description: 'Second version',
        },
      ];

      mockDocumentManager.getVersionHistory.mockReturnValue(mockVersions as any);

      const { result } = renderHook(() => useVersions('doc-1'));

      expect(result.current.versions).toHaveLength(2);
      expect(result.current.hasVersions).toBe(true);
      expect(result.current.latestVersion).toEqual(mockVersions[0]);
    });

    it('文档 ID 变化时应该刷新版本历史', () => {
      mockDocumentManager.getVersionHistory.mockReturnValue([]);

      const { result, rerender } = renderHook(
        ({ docId }) => useVersions(docId),
        { initialProps: { docId: 'doc-1' } }
      );

      expect(mockDocumentManager.getVersionHistory).toHaveBeenCalledWith('doc-1');

      // 切换文档
      rerender({ docId: 'doc-2' });

      expect(mockDocumentManager.getVersionHistory).toHaveBeenCalledWith('doc-2');
    });
  });

  describe('保存版本', () => {
    it('saveVersion 应该保存新版本', () => {
      const mockVersion = {
        id: 'v1',
        content: 'Content',
        title: 'Title',
        timestamp: Date.now(),
        description: 'Test save',
      };

      mockDocumentManager.getVersionHistory.mockReturnValue([]);
      mockDocumentManager.saveVersion.mockReturnValue(mockVersion as any);

      const { result } = renderHook(() => useVersions('doc-1'));

      act(() => {
        result.current.saveVersion('Test save');
      });

      expect(mockDocumentManager.saveVersion).toHaveBeenCalledWith('doc-1', 'Test save');
    });

    it('没有文档 ID 时不应该保存', () => {
      mockDocumentManager.getVersionHistory.mockReturnValue([]);

      const { result } = renderHook(() => useVersions(null));

      act(() => {
        result.current.saveVersion('Test');
      });

      expect(mockDocumentManager.saveVersion).not.toHaveBeenCalled();
    });
  });

  describe('恢复版本', () => {
    it('restoreVersion 应该恢复指定版本', () => {
      const mockRestored = {
        content: 'Restored content',
        title: 'Restored title',
      };

      mockDocumentManager.getVersionHistory.mockReturnValue([]);
      mockDocumentManager.restoreVersion.mockReturnValue(mockRestored as any);

      const { result } = renderHook(() => useVersions('doc-1'));

      let restored: any = null;
      act(() => {
        restored = result.current.restoreVersion('v1');
      });

      expect(mockDocumentManager.restoreVersion).toHaveBeenCalledWith('doc-1', 'v1');
      expect(restored).toEqual(mockRestored);
    });

    it('恢复失败时应该返回 null', () => {
      mockDocumentManager.getVersionHistory.mockReturnValue([]);
      mockDocumentManager.restoreVersion.mockReturnValue(undefined);

      const { result } = renderHook(() => useVersions('doc-1'));

      let restored: any = null;
      act(() => {
        restored = result.current.restoreVersion('v1');
      });

      expect(restored).toBeNull();
    });
  });

  describe('删除版本', () => {
    it('deleteVersion 应该删除指定版本', () => {
      mockDocumentManager.getVersionHistory.mockReturnValue([]);

      const { result } = renderHook(() => useVersions('doc-1'));

      act(() => {
        result.current.deleteVersion('v1');
      });

      expect(mockDocumentManager.deleteVersion).toHaveBeenCalledWith('doc-1', 'v1');
    });
  });

  describe('自动保存', () => {
    it('应该定期自动保存版本', async () => {
      mockDocumentManager.getVersionHistory.mockReturnValue([]);
      mockDocumentManager.autoSaveVersion.mockReturnValue({
        id: 'auto-v1',
        content: 'Auto content',
        title: 'Auto title',
        timestamp: Date.now(),
        description: 'Auto save',
      } as any);

      renderHook(() => useVersions('doc-1', { autoSaveInterval: 1000 }));

      // 快进时间
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockDocumentManager.autoSaveVersion).toHaveBeenCalledWith('doc-1');
    });

    it('没有文档 ID 时不应该自动保存', async () => {
      mockDocumentManager.getVersionHistory.mockReturnValue([]);

      renderHook(() => useVersions(null, { autoSaveInterval: 1000 }));

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockDocumentManager.autoSaveVersion).not.toHaveBeenCalled();
    });
  });

  describe('辅助函数', () => {
    it('getVersion 应该返回指定版本', () => {
      const mockVersions = [
        { id: 'v1', content: 'Content 1', title: 'Title 1', timestamp: Date.now(), description: '' },
        { id: 'v2', content: 'Content 2', title: 'Title 2', timestamp: Date.now(), description: '' },
      ];

      mockDocumentManager.getVersionHistory.mockReturnValue(mockVersions as any);

      const { result } = renderHook(() => useVersions('doc-1'));

      const version = result.current.getVersion('v1');
      expect(version?.id).toBe('v1');

      const notFound = result.current.getVersion('v3');
      expect(notFound).toBeNull();
    });

    it('refreshVersions 应该刷新版本列表', () => {
      mockDocumentManager.getVersionHistory.mockReturnValue([]);

      const { result } = renderHook(() => useVersions('doc-1'));

      act(() => {
        result.current.refreshVersions();
      });

      expect(mockDocumentManager.getVersionHistory).toHaveBeenCalledTimes(2);
    });
  });
});
