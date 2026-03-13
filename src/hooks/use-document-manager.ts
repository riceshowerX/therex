/**
 * 文档管理 Hook
 *
 * 封装文档管理的状态和逻辑
 */

import { useState, useEffect, useCallback } from 'react';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getAllDocuments,
  searchDocuments,
  toggleDocumentFavorite,
} from '@/lib/services/document-service';
import type { Document } from '@/storage/database/schema';

export function useDocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载所有文档
  const loadDocuments = useCallback(async (folderId: string | null = null) => {
    setLoading(true);
    setError(null);
    try {
      const docs = await getAllDocuments(folderId);
      setDocuments(docs);
    } catch (err) {
      setError('加载文档失败');
      console.error('加载文档失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载当前文档
  const loadDocument = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const doc = await getDocument(id);
      if (doc) {
        setCurrentDoc(doc);
      } else {
        setError('文档不存在');
      }
    } catch (err) {
      setError('加载文档失败');
      console.error('加载文档失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建新文档
  const createNewDocument = useCallback(async (
    title?: string,
    content?: string,
    folderId?: string | null
  ) => {
    setLoading(true);
    setError(null);
    try {
      const doc = await createDocument(title, content, folderId);
      setDocuments((prev) => [doc, ...prev]);
      setCurrentDoc(doc);
      return doc;
    } catch (err) {
      setError('创建文档失败');
      console.error('创建文档失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新文档
  const updateCurrentDocument = useCallback(async (
    updates: Partial<Pick<Document, 'title' | 'content' | 'folderId' | 'isFavorite' | 'tags'>>
  ) => {
    if (!currentDoc) return;

    setLoading(true);
    setError(null);
    try {
      const updated = await updateDocument(currentDoc.id, updates);
      if (updated) {
        setCurrentDoc(updated);
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === updated.id ? updated : doc))
        );
      }
    } catch (err) {
      setError('更新文档失败');
      console.error('更新文档失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDoc]);

  // 删除文档
  const removeDocument = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await deleteDocument(id);
      if (success) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
        if (currentDoc?.id === id) {
          setCurrentDoc(null);
        }
      }
    } catch (err) {
      setError('删除文档失败');
      console.error('删除文档失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDoc]);

  // 切换收藏
  const toggleFavorite = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await toggleDocumentFavorite(id);
      if (updated) {
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === updated.id ? updated : doc))
        );
        if (currentDoc?.id === id) {
          setCurrentDoc(updated);
        }
      }
    } catch (err) {
      setError('切换收藏失败');
      console.error('切换收藏失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDoc]);

  // 搜索文档
  const searchDocs = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchDocuments(query);
      setDocuments(results);
      return results;
    } catch (err) {
      setError('搜索文档失败');
      console.error('搜索文档失败:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    documents,
    currentDoc,
    loading,
    error,
    loadDocuments,
    loadDocument,
    createNewDocument,
    updateCurrentDocument,
    removeDocument,
    toggleFavorite,
    searchDocs,
    setCurrentDoc,
  };
}
