/**
 * 文档管理 Hook
 *
 * 提供文档操作的 React 状态管理
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStorageManager } from '@/lib/storage/manager';
import type { Document, CreateDocumentParams, UpdateDocumentParams } from '@/types';

interface UseDocumentOptions {
  autoInit?: boolean;
  autoSaveInterval?: number;
}

interface UseDocumentReturn {
  // 状态
  documents: Document[];
  currentDoc: Document | null;
  loading: boolean;
  error: string | null;

  // 文档操作
  createDocument: (params?: CreateDocumentParams) => Document;
  switchDocument: (id: string) => Document | undefined;
  updateCurrentDocument: (updates: UpdateDocumentParams) => void;
  deleteDocument: (id: string) => boolean;
  duplicateDocument: (id: string) => Document | undefined;
  toggleFavorite: (id: string) => void;
  searchDocuments: (query: string) => Document[];
  moveDocument: (docId: string, folderId: string | null) => void;

  // 工具方法
  refreshDocuments: () => void;
  setCurrentDoc: (doc: Document | null) => void;
}

export function useDocument(options: UseDocumentOptions = {}): UseDocumentReturn {
  const { autoInit = true, autoSaveInterval = 500 } = options;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // 初始化
  useEffect(() => {
    if (!autoInit) return;

    const init = async () => {
      try {
        setLoading(true);
        const manager = getStorageManager();
        await manager.initialize();

        const docs = manager.getAllDocuments();
        setDocuments(docs);

        const current = manager.getCurrentDocument();
        if (current) {
          setCurrentDoc(current);
        }

        initializedRef.current = true;
      } catch (err) {
        setError('初始化失败');
        console.error('文档初始化失败:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [autoInit]);

  // 自动保存当前文档
  const saveCurrentDocument = useCallback((updates: UpdateDocumentParams) => {
    if (!currentDoc) return;

    // 防抖保存
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const manager = getStorageManager();
      const updated = manager.updateDocument(currentDoc.id, updates);
      if (updated) {
        setCurrentDoc(updated);
        setDocuments(manager.getAllDocuments());
      }
    }, autoSaveInterval);
  }, [currentDoc, autoSaveInterval]);

  // 创建文档
  const createDocument = useCallback((params?: CreateDocumentParams): Document => {
    const manager = getStorageManager();
    const doc = manager.createDocument(params);
    setDocuments(manager.getAllDocuments());
    setCurrentDoc(doc);
    return doc;
  }, []);

  // 切换文档
  const switchDocument = useCallback((id: string): Document | undefined => {
    const manager = getStorageManager();
    const doc = manager.setCurrentDocument(id);
    if (doc) {
      setCurrentDoc(doc);
      setDocuments(manager.getAllDocuments());
    }
    return doc;
  }, []);

  // 更新当前文档
  const updateCurrentDocument = useCallback((updates: UpdateDocumentParams) => {
    if (!currentDoc) return;

    const manager = getStorageManager();
    const updated = manager.updateDocument(currentDoc.id, updates);
    if (updated) {
      setCurrentDoc(updated);
      setDocuments(manager.getAllDocuments());
    }
  }, [currentDoc]);

  // 删除文档
  const deleteDocument = useCallback((id: string): boolean => {
    const manager = getStorageManager();
    const success = manager.deleteDocument(id);

    if (success) {
      setDocuments(manager.getAllDocuments());

      if (currentDoc?.id === id) {
        const docs = manager.getAllDocuments();
        if (docs.length > 0) {
          switchDocument(docs[0].id);
        } else {
          createDocument();
        }
      }
    }

    return success;
  }, [currentDoc, switchDocument, createDocument]);

  // 复制文档
  const duplicateDocument = useCallback((id: string): Document | undefined => {
    const manager = getStorageManager();
    const newDoc = manager.duplicateDocument(id);

    if (newDoc) {
      setDocuments(manager.getAllDocuments());
      switchDocument(newDoc.id);
    }

    return newDoc;
  }, [switchDocument]);

  // 切换收藏
  const toggleFavorite = useCallback((id: string) => {
    const manager = getStorageManager();
    manager.toggleFavorite(id);
    setDocuments(manager.getAllDocuments());

    if (currentDoc?.id === id) {
      setCurrentDoc(manager.getDocument(id) || null);
    }
  }, [currentDoc]);

  // 搜索文档
  const searchDocuments = useCallback((query: string): Document[] => {
    const manager = getStorageManager();
    return manager.searchDocuments(query);
  }, []);

  // 移动文档
  const moveDocument = useCallback((docId: string, folderId: string | null) => {
    const manager = getStorageManager();
    manager.moveDocumentToFolder(docId, folderId);
    setDocuments(manager.getAllDocuments());

    if (currentDoc?.id === docId) {
      setCurrentDoc(manager.getDocument(docId) || null);
    }
  }, [currentDoc]);

  // 刷新文档列表
  const refreshDocuments = useCallback(() => {
    const manager = getStorageManager();
    setDocuments(manager.getAllDocuments());
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    documents,
    currentDoc,
    loading,
    error,
    createDocument,
    switchDocument,
    updateCurrentDocument,
    deleteDocument,
    duplicateDocument,
    toggleFavorite,
    searchDocuments,
    moveDocument,
    refreshDocuments,
    setCurrentDoc,
  };
}
