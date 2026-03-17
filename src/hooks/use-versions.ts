/**
 * 版本历史管理 Hook
 * 处理文档版本的保存、恢复、删除等操作
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { documentManager, type DocumentVersion } from '@/lib/storage/manager';
import { AUTO_SAVE_INTERVAL_MS } from '@/lib/constants';

export interface UseVersionsOptions {
  autoSaveInterval?: number;
}

export interface UseVersionsReturn {
  // 状态
  versions: DocumentVersion[];
  
  // 操作
  saveVersion: (description?: string) => DocumentVersion | null;
  restoreVersion: (versionId: string) => { content: string; title: string } | null;
  deleteVersion: (versionId: string) => void;
  clearAllVersions: () => void;
  
  // 辅助
  getVersion: (versionId: string) => DocumentVersion | null;
  hasVersions: boolean;
  latestVersion: DocumentVersion | null;
  refreshVersions: () => void;
}

export function useVersions(
  documentId: string | null,
  options: UseVersionsOptions = {}
): UseVersionsReturn {
  const { autoSaveInterval = AUTO_SAVE_INTERVAL_MS } = options;
  
  // 状态
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  
  // 更新版本列表
  const refreshVersions = useCallback(() => {
    if (documentId) {
      const versionHistory = documentManager.getVersionHistory(documentId);
      setVersions(versionHistory);
    } else {
      setVersions([]);
    }
  }, [documentId]);
  
  // 初始化和文档切换时更新版本列表
  useEffect(() => {
    refreshVersions();
  }, [refreshVersions]);
  
  // 自动保存版本
  useEffect(() => {
    if (!documentId) return;
    
    const interval = setInterval(() => {
      const savedVersion = documentManager.autoSaveVersion(documentId);
      if (savedVersion) {
        refreshVersions();
      }
    }, autoSaveInterval);
    
    return () => clearInterval(interval);
  }, [documentId, autoSaveInterval, refreshVersions]);
  
  // 手动保存版本
  const saveVersion = useCallback((description?: string): DocumentVersion | null => {
    if (!documentId) return null;
    
    const version = documentManager.saveVersion(documentId, description || 'Manual save');
    if (version) {
      refreshVersions();
      toast.success('版本已保存');
      return version;
    }
    
    return null;
  }, [documentId, refreshVersions]);
  
  // 恢复到指定版本
  const restoreVersion = useCallback((versionId: string): { content: string; title: string } | null => {
    if (!documentId) return null;
    
    const restored = documentManager.restoreVersion(documentId, versionId);
    if (restored) {
      refreshVersions();
      toast.success('已恢复到指定版本');
      return {
        content: restored.content,
        title: restored.title,
      };
    }
    
    return null;
  }, [documentId, refreshVersions]);
  
  // 删除指定版本
  const deleteVersion = useCallback((versionId: string) => {
    if (!documentId) return;
    
    documentManager.deleteVersion(documentId, versionId);
    refreshVersions();
    toast.success('版本已删除');
  }, [documentId, refreshVersions]);
  
  // 清除所有版本
  const clearAllVersions = useCallback(() => {
    if (!documentId) return;
    
    versions.forEach(version => {
      documentManager.deleteVersion(documentId, version.id);
    });
    
    refreshVersions();
    toast.success('已清除所有版本');
  }, [documentId, versions, refreshVersions]);
  
  // 获取指定版本
  const getVersion = useCallback((versionId: string): DocumentVersion | null => {
    return versions.find(v => v.id === versionId) || null;
  }, [versions]);
  
  // 计算属性
  const hasVersions = versions.length > 0;
  const latestVersion = versions.length > 0 ? versions[0] : null;
  
  return {
    versions,
    saveVersion,
    restoreVersion,
    deleteVersion,
    clearAllVersions,
    getVersion,
    hasVersions,
    latestVersion,
    refreshVersions,
  };
}
