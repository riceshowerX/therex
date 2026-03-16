/**
 * 版本历史管理 Hook
 *
 * 提供版本历史操作的 React 状态管理
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStorageManager } from '@/lib/storage/manager';
import type { Document, DocumentVersion } from '@/types';

interface UseVersionHistoryOptions {
  documentId?: string | null;
  autoSaveInterval?: number; // 自动保存间隔（毫秒），0 表示禁用
}

interface UseVersionHistoryReturn {
  // 状态
  versions: DocumentVersion[];
  loading: boolean;

  // 操作方法
  saveVersion: (description?: string) => DocumentVersion | undefined;
  restoreVersion: (versionId: string) => Document | undefined;
  deleteVersion: (versionId: string) => boolean;
  refreshVersions: () => void;

  // 自动保存控制
  enableAutoSave: () => void;
  disableAutoSave: () => void;
}

export function useVersionHistory(options: UseVersionHistoryOptions = {}): UseVersionHistoryReturn {
  const { documentId, autoSaveInterval = 5 * 60 * 1000 } = options; // 默认 5 分钟

  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const autoSaveEnabledRef = useRef(autoSaveInterval > 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 加载版本历史
  useEffect(() => {
    if (!documentId) {
      setVersions([]);
      return;
    }

    const manager = getStorageManager();
    setVersions(manager.getVersionHistory(documentId));
  }, [documentId]);

  // 自动保存
  useEffect(() => {
    if (!documentId || !autoSaveEnabledRef.current || autoSaveInterval <= 0) {
      return;
    }

    intervalRef.current = setInterval(() => {
      const manager = getStorageManager();
      const saved = manager.autoSaveVersion(documentId);
      if (saved) {
        setVersions(manager.getVersionHistory(documentId));
      }
    }, autoSaveInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [documentId, autoSaveInterval]);

  // 手动保存版本
  const saveVersion = useCallback((description?: string): DocumentVersion | undefined => {
    if (!documentId) return undefined;

    const manager = getStorageManager();
    const version = manager.saveVersion(documentId, description);

    if (version) {
      setVersions(manager.getVersionHistory(documentId));
    }

    return version;
  }, [documentId]);

  // 恢复版本
  const restoreVersion = useCallback((versionId: string): Document | undefined => {
    if (!documentId) return undefined;

    const manager = getStorageManager();
    const doc = manager.restoreVersion(documentId, versionId);

    if (doc) {
      setVersions(manager.getVersionHistory(documentId));
    }

    return doc;
  }, [documentId]);

  // 删除版本
  const deleteVersion = useCallback((versionId: string): boolean => {
    if (!documentId) return false;

    const manager = getStorageManager();
    const success = manager.deleteVersion(documentId, versionId);

    if (success) {
      setVersions(manager.getVersionHistory(documentId));
    }

    return success;
  }, [documentId]);

  // 刷新版本列表
  const refreshVersions = useCallback(() => {
    if (!documentId) return;

    const manager = getStorageManager();
    setVersions(manager.getVersionHistory(documentId));
  }, [documentId]);

  // 启用自动保存
  const enableAutoSave = useCallback(() => {
    autoSaveEnabledRef.current = true;
  }, []);

  // 禁用自动保存
  const disableAutoSave = useCallback(() => {
    autoSaveEnabledRef.current = false;
  }, []);

  return {
    versions,
    loading,
    saveVersion,
    restoreVersion,
    deleteVersion,
    refreshVersions,
    enableAutoSave,
    disableAutoSave,
  };
}
