/**
 * useAutoSave Hook 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach, MockedFunction } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '../use-auto-save';

describe('useAutoSave', () => {
  let saveFn: MockedFunction<(data: string) => Promise<void>>;

  beforeEach(() => {
    saveFn = vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该以 idle 状态开始', () => {
      const { result } = renderHook(() =>
        useAutoSave('initial data', { saveFn })
      );

      expect(result.current.status).toBe('idle');
      expect(result.current.lastSavedAt).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.hasPendingChanges).toBe(false);
    });
  });

  describe('自动保存', () => {
    it('数据变化后应该触发保存', async () => {
      const { rerender } = renderHook(
        ({ data }) => useAutoSave(data, { saveFn, debounceMs: 500 }),
        { initialProps: { data: 'initial' } }
      );

      // 数据变化
      rerender({ data: 'changed' });

      // 快进防抖时间
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // 验证保存函数被调用
      expect(saveFn).toHaveBeenCalledWith('changed');
    });

    it('应该防抖保存请求', async () => {
      const { rerender } = renderHook(
        ({ data }) => useAutoSave(data, { saveFn, debounceMs: 500 }),
        { initialProps: { data: 'initial' } }
      );

      // 快速变化多次
      rerender({ data: 'change1' });
      rerender({ data: 'change2' });
      rerender({ data: 'change3' });

      // 短时间内不应触发保存
      expect(saveFn).not.toHaveBeenCalled();

      // 快进防抖时间
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // 应该只保存最后一次数据
      expect(saveFn).toHaveBeenCalledTimes(1);
      expect(saveFn).toHaveBeenCalledWith('change3');
    });
  });

  describe('手动保存', () => {
    it('saveNow 应该立即保存', async () => {
      const { result } = renderHook(() =>
        useAutoSave('data', { saveFn, debounceMs: 500 })
      );

      await act(async () => {
        await result.current.saveNow();
      });

      expect(saveFn).toHaveBeenCalledWith('data');
      expect(result.current.status).toBe('saved');
    });
  });

  describe('错误处理', () => {
    it('保存失败应该设置错误状态', async () => {
      const errorFn = vi.fn<(data: string) => Promise<void>>().mockRejectedValue(new Error('Save failed'));
      const onSaveError = vi.fn();

      const { result } = renderHook(() =>
        useAutoSave('data', {
          saveFn: errorFn,
          maxRetries: 0,
          onSaveError,
        })
      );

      await act(async () => {
        await result.current.saveNow();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Save failed');
      expect(onSaveError).toHaveBeenCalled();
    });
  });

  describe('重试机制', () => {
    it('失败后应该自动重试', async () => {
      let callCount = 0;
      const retryFn = vi.fn<(data: string) => Promise<void>>().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Retry needed');
        }
      });

      const { result } = renderHook(() =>
        useAutoSave('data', {
          saveFn: retryFn,
          maxRetries: 3,
          retryDelayMs: 100,
        })
      );

      await act(async () => {
        // 第一次调用
        await result.current.saveNow();
        // 等待重试
        vi.advanceTimersByTime(500);
      });

      // 初始调用 + 重试
      expect(retryFn.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('状态管理', () => {
    it('保存成功后应该更新状态', async () => {
      const { result } = renderHook(() =>
        useAutoSave('data', { saveFn })
      );

      expect(result.current.status).toBe('idle');

      await act(async () => {
        await result.current.saveNow();
      });

      expect(result.current.status).toBe('saved');
      expect(result.current.lastSavedAt).toBeInstanceOf(Date);
    });
  });

  describe('清理', () => {
    it('卸载时应该取消待处理的保存', async () => {
      const { unmount, rerender } = renderHook(
        ({ data }) => useAutoSave(data, { saveFn, debounceMs: 500 }),
        { initialProps: { data: 'initial' } }
      );

      // 触发数据变化
      rerender({ data: 'changed' });

      // 在保存前卸载
      unmount();

      // 快进时间
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // 不应该调用保存
      expect(saveFn).not.toHaveBeenCalled();
    });
  });
});
