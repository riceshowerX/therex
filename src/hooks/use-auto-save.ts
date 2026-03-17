/**
 * 自动保存 Hook
 * 提供智能的自动保存功能，支持防抖、错误重试和状态反馈
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CONTENT_SAVE_DEBOUNCE_MS } from '@/lib/constants';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'pending';

export interface UseAutoSaveOptions<T> {
  /** 保存函数 */
  saveFn: (data: T) => Promise<void>;
  /** 防抖延迟（毫秒） */
  debounceMs?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelayMs?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 保存成功回调 */
  onSaveSuccess?: () => void;
  /** 保存失败回调 */
  onSaveError?: (error: Error) => void;
}

export interface UseAutoSaveReturn {
  /** 当前保存状态 */
  status: SaveStatus;
  /** 最后保存时间 */
  lastSavedAt: Date | null;
  /** 错误信息 */
  error: string | null;
  /** 手动保存 */
  saveNow: () => Promise<void>;
  /** 重试保存 */
  retry: () => Promise<void>;
  /** 重置状态 */
  reset: () => void;
  /** 是否有待保存的更改 */
  hasPendingChanges: boolean;
}

/**
 * 简单防抖函数
 */
function debounce<A extends unknown[], R>(
  fn: (...args: A) => R,
  delay: number
): ((...args: A) => void) & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: A | null = null;

  const debounced = (...args: A) => {
    lastArgs = args;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      lastArgs = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn(...lastArgs);
      lastArgs = null;
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * 自动保存 Hook
 */
export function useAutoSave<T>(
  data: T,
  options: UseAutoSaveOptions<T>
): UseAutoSaveReturn {
  const {
    saveFn,
    debounceMs = CONTENT_SAVE_DEBOUNCE_MS,
    maxRetries = 3,
    retryDelayMs = 1000,
    enabled = true,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const retryCountRef = useRef(0);
  const lastDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  // 执行保存
  const doSave = useCallback(async (dataToSave: T) => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setStatus('saving');
    setError(null);

    try {
      await saveFn(dataToSave);
      setStatus('saved');
      setLastSavedAt(new Date());
      setHasPendingChanges(false);
      retryCountRef.current = 0;
      lastDataRef.current = dataToSave;
      onSaveSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败';
      setError(errorMessage);
      
      if (retryCountRef.current < maxRetries) {
        setStatus('pending');
        retryCountRef.current++;
        // 自动重试
        setTimeout(() => {
          doSave(dataToSave);
        }, retryDelayMs * retryCountRef.current);
      } else {
        setStatus('error');
        onSaveError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFn, maxRetries, retryDelayMs, onSaveSuccess, onSaveError]);

  // 防抖保存函数引用
  const debouncedSaveRef = useRef<((data: T) => void) & { cancel: () => void; flush: () => void } | null>(null);

  // 创建防抖保存函数
  useEffect(() => {
    debouncedSaveRef.current = debounce(doSave, debounceMs);
    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, [doSave, debounceMs]);

  // 数据变化时自动保存
  useEffect(() => {
    if (!enabled) return;

    // 检查数据是否变化
    if (JSON.stringify(data) !== JSON.stringify(lastDataRef.current)) {
      setHasPendingChanges(true);
      setStatus('pending');
      debouncedSaveRef.current?.(data);
    }
  }, [data, enabled]);

  // 手动保存
  const saveNow = useCallback(async () => {
    debouncedSaveRef.current?.cancel();
    await doSave(data);
  }, [data, doSave]);

  // 重试保存
  const retry = useCallback(async () => {
    retryCountRef.current = 0;
    await doSave(data);
  }, [data, doSave]);

  // 重置状态
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setHasPendingChanges(false);
    retryCountRef.current = 0;
    debouncedSaveRef.current?.cancel();
  }, []);

  // 页面关闭前保存
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasPendingChanges) {
        event.preventDefault();
        event.returnValue = '有未保存的更改，确定要离开吗？';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, hasPendingChanges]);

  return {
    status,
    lastSavedAt,
    error,
    saveNow,
    retry,
    reset,
    hasPendingChanges,
  };
}

/**
 * 格式化最后保存时间
 */
export function formatLastSaved(date: Date | null): string {
  if (!date) return '未保存';

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚保存';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前保存`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前保存`;

  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
