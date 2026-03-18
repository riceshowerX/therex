/**
 * 文档管理 Hook
 * 处理文档的创建、切换、删除、收藏等操作
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { documentManager, type Document } from '@/lib/storage/manager';
import { getTemplateById } from '@/lib/templates';

export interface UseDocumentsOptions {
  autoSaveDelay?: number;
}

export interface UseDocumentsReturn {
  // 状态
  currentDoc: Document | null;
  documents: Document[];
  content: string;
  title: string;
  
  // 操作
  createDocument: (templateId?: string, folderId?: string | null) => Document;
  switchDocument: (docId: string) => void;
  deleteDocument: (docId: string) => void;
  duplicateDocument: (docId: string) => Document | null;
  toggleFavorite: (docId: string) => void;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  moveDocumentToFolder: (docId: string, folderId: string | null) => void;
  
  // 辅助
  getDocumentsInFolder: (folderId: string | null) => Document[];
  refreshDocuments: () => void;
}

export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsReturn {
  const { autoSaveDelay = 500 } = options;
  
  // 状态
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  
  // 保存定时器引用
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 初始化
  useEffect(() => {
    const docs = documentManager.getAllDocuments();
    setDocuments(docs);
    
    const current = documentManager.getCurrentDocument();
    if (current) {
      setCurrentDoc(current);
      setContent(current.content);
      setTitle(current.title);
    }
  }, []);
  
  // 自动保存
  const scheduleAutoSave = useCallback((docId: string, newTitle: string, newContent: string) => {
    // 清理之前的定时器
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    const timer = setTimeout(() => {
      documentManager.updateDocument(docId, { title: newTitle, content: newContent });
      setDocuments(documentManager.getAllDocuments());
    }, autoSaveDelay);
    
    saveTimerRef.current = timer;
  }, [autoSaveDelay]); // 移除 saveTimer 依赖
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []); // 空依赖，只在卸载时清理
  
  // 创建文档
  const createDocument = useCallback((templateId?: string, folderId?: string | null): Document => {
    const template = templateId ? getTemplateById(templateId) : null;
    const doc = documentManager.createDocument(
      template?.name || 'Untitled',
      template?.content || '',
      folderId ?? null
    );
    
    setCurrentDoc(doc);
    setContent(doc.content);
    setTitle(doc.title);
    setDocuments(documentManager.getAllDocuments());
    toast.success('已创建新文档');
    
    return doc;
  }, []);
  
  // 切换文档
  const switchDocument = useCallback((docId: string) => {
    const doc = documentManager.setCurrentDocument(docId);
    if (doc) {
      setCurrentDoc(doc);
      setContent(doc.content);
      setTitle(doc.title);
      setDocuments(documentManager.getAllDocuments());
    }
  }, []);
  
  // 删除文档
  const deleteDocument = useCallback((docId: string) => {
    documentManager.deleteDocument(docId);
    const docs = documentManager.getAllDocuments();
    setDocuments(docs);
    
    // 如果删除的是当前文档，切换到其他文档
    if (currentDoc?.id === docId) {
      if (docs.length > 0) {
        switchDocument(docs[0].id);
      } else {
        createDocument();
      }
    }
    
    toast.success('文档已删除');
  }, [currentDoc, switchDocument, createDocument]);
  
  // 复制文档
  const duplicateDocument = useCallback((docId: string): Document | null => {
    const newDoc = documentManager.duplicateDocument(docId);
    if (newDoc) {
      setDocuments(documentManager.getAllDocuments());
      toast.success('文档已复制');
      return newDoc;
    }
    return null;
  }, []);
  
  // 切换收藏
  const toggleFavorite = useCallback((docId: string) => {
    documentManager.toggleFavorite(docId);
    setDocuments(documentManager.getAllDocuments());
    
    if (currentDoc?.id === docId) {
      setCurrentDoc(documentManager.getDocument(docId) || null);
    }
  }, [currentDoc]);
  
  // 更新内容
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    
    if (currentDoc) {
      scheduleAutoSave(currentDoc.id, title, newContent);
    }
  }, [currentDoc, title, scheduleAutoSave]);
  
  // 更新标题
  const updateTitle = useCallback((newTitle: string) => {
    setTitle(newTitle);
    
    if (currentDoc) {
      scheduleAutoSave(currentDoc.id, newTitle, content);
    }
  }, [currentDoc, content, scheduleAutoSave]);
  
  // 移动文档到文件夹
  const moveDocumentToFolder = useCallback((docId: string, folderId: string | null) => {
    documentManager.moveDocumentToFolder(docId, folderId);
    setDocuments(documentManager.getAllDocuments());
    
    if (currentDoc?.id === docId) {
      setCurrentDoc(documentManager.getDocument(docId) || null);
    }
    
    toast.success('文档已移动');
  }, [currentDoc]);
  
  // 获取文件夹中的文档
  const getDocumentsInFolder = useCallback((folderId: string | null): Document[] => {
    return documents.filter(doc => doc.folderId === folderId);
  }, [documents]);
  
  // 刷新文档列表
  const refreshDocuments = useCallback(() => {
    setDocuments(documentManager.getAllDocuments());
  }, []);
  
  return {
    currentDoc,
    documents,
    content,
    title,
    createDocument,
    switchDocument,
    deleteDocument,
    duplicateDocument,
    toggleFavorite,
    updateContent,
    updateTitle,
    moveDocumentToFolder,
    getDocumentsInFolder,
    refreshDocuments,
  };
}
