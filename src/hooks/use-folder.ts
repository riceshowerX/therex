/**
 * 文件夹管理 Hook
 *
 * 提供文件夹操作的 React 状态管理
 */

import { useState, useEffect, useCallback } from 'react';
import { getStorageManager } from '@/lib/storage/manager';
import type { Folder, CreateFolderParams, UpdateFolderParams } from '@/types';

interface UseFolderReturn {
  // 状态
  folders: Folder[];
  currentFolderId: string | null;
  expandedFolders: Set<string>;
  loading: boolean;

  // 文件夹操作
  createFolder: (params: CreateFolderParams) => Folder;
  updateFolder: (id: string, updates: UpdateFolderParams) => Folder | undefined;
  deleteFolder: (id: string) => boolean;
  setCurrentFolderId: (id: string | null) => void;

  // 展开状态
  toggleFolderExpand: (id: string) => void;
  expandFolder: (id: string) => void;
  collapseFolder: (id: string) => void;
  expandAllFolders: () => void;
  collapseAllFolders: () => void;

  // 查询方法
  getDocumentsInFolder: (folderId: string | null) => number;
  getChildFolders: (parentId: string | null) => Folder[];
}

export function useFolder(): UseFolderReturn {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // 初始化
  useEffect(() => {
    const manager = getStorageManager();
    setFolders(manager.getAllFolders());
    setLoading(false);
  }, []);

  // 创建文件夹
  const createFolder = useCallback((params: CreateFolderParams): Folder => {
    const manager = getStorageManager();
    const folder = manager.createFolder(params);
    setFolders(manager.getAllFolders());
    return folder;
  }, []);

  // 更新文件夹
  const updateFolder = useCallback((id: string, updates: UpdateFolderParams): Folder | undefined => {
    const manager = getStorageManager();
    const folder = manager.updateFolder(id, updates);
    setFolders(manager.getAllFolders());
    return folder;
  }, []);

  // 删除文件夹
  const deleteFolder = useCallback((id: string): boolean => {
    const manager = getStorageManager();
    const success = manager.deleteFolder(id, 'root');

    if (success) {
      setFolders(manager.getAllFolders());
      if (currentFolderId === id) {
        setCurrentFolderId(null);
      }
    }

    return success;
  }, [currentFolderId]);

  // 切换展开状态
  const toggleFolderExpand = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // 展开文件夹
  const expandFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);

  // 折叠文件夹
  const collapseFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // 展开所有
  const expandAllFolders = useCallback(() => {
    setExpandedFolders(new Set(folders.map(f => f.id)));
  }, [folders]);

  // 折叠所有
  const collapseAllFolders = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  // 获取文件夹中的文档数量
  const getDocumentsInFolder = useCallback((folderId: string | null): number => {
    const manager = getStorageManager();
    return manager.getDocumentsByFolder(folderId).length;
  }, []);

  // 获取子文件夹
  const getChildFolders = useCallback((parentId: string | null): Folder[] => {
    return folders.filter(f => f.parentId === parentId);
  }, [folders]);

  return {
    folders,
    currentFolderId,
    expandedFolders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    setCurrentFolderId,
    toggleFolderExpand,
    expandFolder,
    collapseFolder,
    expandAllFolders,
    collapseAllFolders,
    getDocumentsInFolder,
    getChildFolders,
  };
}
