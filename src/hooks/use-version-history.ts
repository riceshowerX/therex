/**
 * 版本历史管理 Hook
 */

import { useState, useCallback } from 'react';
import {
  saveDocumentVersion,
  getDocumentVersions,
  deleteDocumentVersion,
} from '@/lib/services/document-service';
import type { DocumentVersion } from '@/storage/database/schema';

export function useVersionHistory() {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载版本历史
  const loadVersions = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDocumentVersions(documentId);
      setVersions(result);
    } catch (err) {
      setError('加载版本历史失败');
      console.error('加载版本历史失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存新版本
  const saveVersion = useCallback(async (
    documentId: string,
    content: string,
    title: string,
    description?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const version = await saveDocumentVersion(documentId, content, title, description);
      setVersions((prev) => [version, ...prev]);
      return version;
    } catch (err) {
      setError('保存版本失败');
      console.error('保存版本失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除版本
  const removeVersion = useCallback(async (versionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await deleteDocumentVersion(versionId);
      if (success) {
        setVersions((prev) => prev.filter((v) => v.id !== versionId));
      }
    } catch (err) {
      setError('删除版本失败');
      console.error('删除版本失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    versions,
    loading,
    error,
    loadVersions,
    saveVersion,
    removeVersion,
  };
}
