/**
 * 文件夹管理 Hook
 */

import { useState, useCallback } from 'react';
import {
  createFolder,
  getFolder,
  getAllFolders,
  updateFolder,
  deleteFolder,
} from '@/lib/services/document-service';
import type { Folder } from '@/storage/database/schema';

export function useFolderManager() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载所有文件夹
  const loadFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllFolders();
      setFolders(result);
    } catch (err) {
      setError('加载文件夹失败');
      console.error('加载文件夹失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建新文件夹
  const createNewFolder = useCallback(async (
    name: string,
    parentId: string | null = null,
    color?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const folder = await createFolder(name, parentId, color);
      setFolders((prev) => [folder, ...prev]);
      return folder;
    } catch (err) {
      setError('创建文件夹失败');
      console.error('创建文件夹失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新文件夹
  const updateCurrentFolder = useCallback(async (
    id: string,
    updates: Partial<Pick<Folder, 'name' | 'parentId' | 'color' | 'icon'>>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateFolder(id, updates);
      if (updated) {
        setFolders((prev) =>
          prev.map((folder) => (folder.id === updated.id ? updated : folder))
        );
      }
    } catch (err) {
      setError('更新文件夹失败');
      console.error('更新文件夹失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除文件夹
  const removeFolder = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await deleteFolder(id);
      if (success) {
        setFolders((prev) => prev.filter((folder) => folder.id !== id));
      }
    } catch (err) {
      setError('删除文件夹失败');
      console.error('删除文件夹失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 切换文件夹展开状态
  const toggleFolderExpand = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 获取根文件夹（没有父文件夹的文件夹）
  const rootFolders = folders.filter((folder) => !folder.parentId);

  // 获取指定文件夹的子文件夹
  const getSubFolders = useCallback((parentId: string): Folder[] => {
    return folders.filter((folder) => folder.parentId === parentId);
  }, [folders]);

  return {
    folders,
    expandedFolders,
    rootFolders,
    loading,
    error,
    loadFolders,
    createNewFolder,
    updateCurrentFolder,
    removeFolder,
    toggleFolderExpand,
    getSubFolders,
  };
}
