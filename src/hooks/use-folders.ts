/**
 * 文件夹管理 Hook
 * 处理文件夹的创建、删除、重命名等操作
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { documentManager, type Folder } from '@/lib/storage/manager';

export interface UseFoldersReturn {
  // 状态
  folders: Folder[];
  currentFolderId: string | null;
  expandedFolders: Set<string>;
  
  // 操作
  createFolder: (name: string, parentId?: string | null) => Folder | null;
  deleteFolder: (folderId: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  setCurrentFolder: (folderId: string | null) => void;
  toggleFolderExpand: (folderId: string) => void;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  expandAllFolders: () => void;
  collapseAllFolders: () => void;
  
  // 辅助
  getSubfolders: (parentId: string | null) => Folder[];
  getFolderPath: (folderId: string) => Folder[];
  refreshFolders: () => void;
}

export function useFolders(): UseFoldersReturn {
  // 状态
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // 初始化
  useEffect(() => {
    const foldersData = documentManager.getAllFolders();
    setFolders(foldersData);
  }, []);
  
  // 创建文件夹
  const createFolder = useCallback((name: string, parentId?: string | null): Folder | null => {
    if (!name.trim()) {
      toast.error('请输入文件夹名称');
      return null;
    }
    
    const folder = documentManager.createFolder(name.trim(), parentId ?? null);
    setFolders(documentManager.getAllFolders());
    toast.success('文件夹创建成功');
    
    return folder;
  }, []);
  
  // 删除文件夹
  const deleteFolder = useCallback((folderId: string) => {
    documentManager.deleteFolder(folderId, 'root');
    setFolders(documentManager.getAllFolders());
    
    if (currentFolderId === folderId) {
      setCurrentFolderId(null);
    }
    
    // 从展开列表中移除
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.delete(folderId);
      return newSet;
    });
    
    toast.success('文件夹已删除');
  }, [currentFolderId]);
  
  // 重命名文件夹
  const renameFolder = useCallback((folderId: string, name: string) => {
    if (!name.trim()) {
      toast.error('请输入文件夹名称');
      return;
    }
    
    documentManager.updateFolder(folderId, { name: name.trim() });
    setFolders(documentManager.getAllFolders());
    toast.success('文件夹已重命名');
  }, []);
  
  // 设置当前文件夹
  const setCurrentFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    
    // 如果选择了文件夹，确保它是展开的
    if (folderId) {
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.add(folderId);
        return newSet;
      });
    }
  }, []);
  
  // 切换文件夹展开状态
  const toggleFolderExpand = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);
  
  // 展开文件夹
  const expandFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.add(folderId);
      return newSet;
    });
  }, []);
  
  // 折叠文件夹
  const collapseFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.delete(folderId);
      return newSet;
    });
  }, []);
  
  // 展开所有文件夹
  const expandAllFolders = useCallback(() => {
    const allFolderIds = new Set(folders.map(f => f.id));
    setExpandedFolders(allFolderIds);
  }, [folders]);
  
  // 折叠所有文件夹
  const collapseAllFolders = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);
  
  // 获取子文件夹
  const getSubfolders = useCallback((parentId: string | null): Folder[] => {
    return folders.filter(f => f.parentId === parentId);
  }, [folders]);
  
  // 获取文件夹路径（从根到当前文件夹）
  const getFolderPath = useCallback((folderId: string): Folder[] => {
    const path: Folder[] = [];
    let currentFolder = folders.find(f => f.id === folderId);
    
    while (currentFolder) {
      path.unshift(currentFolder);
      currentFolder = folders.find(f => f.id === currentFolder!.parentId);
    }
    
    return path;
  }, [folders]);
  
  // 刷新文件夹列表
  const refreshFolders = useCallback(() => {
    setFolders(documentManager.getAllFolders());
  }, []);
  
  return {
    folders,
    currentFolderId,
    expandedFolders,
    createFolder,
    deleteFolder,
    renameFolder,
    setCurrentFolder,
    toggleFolderExpand,
    expandFolder,
    collapseFolder,
    expandAllFolders,
    collapseAllFolders,
    getSubfolders,
    getFolderPath,
    refreshFolders,
  };
}
