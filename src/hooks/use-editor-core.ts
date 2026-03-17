/**
 * 编辑器核心逻辑组合 Hook
 * 将所有编辑器相关的 Hooks 组合在一起，提供统一的状态管理
 */

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDocuments } from './use-documents';
import { useFolders } from './use-folders';
import { useVersions } from './use-versions';
import { useAIChat } from './use-ai-chat';
import { useAIAssist, type AIAction } from './use-ai-assist';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';

export interface EditorMode {
  mode: 'edit' | 'preview' | 'live';
  fontSize: number;
  isFullscreen: boolean;
}

export interface EditorUIState {
  showSidebar: boolean;
  sidebarTab: 'documents' | 'folders';
  showTemplates: boolean;
  showSearchReplace: boolean;
  showVersionHistory: boolean;
}

export interface UseEditorCoreOptions {
  autoSaveDelay?: number;
  autoSaveVersionInterval?: number;
  maxHistorySize?: number;
}

export interface HistoryState {
  past: string[];
  present: string;
  future: string[];
}

export interface UseEditorCoreReturn {
  // 文档状态
  currentDoc: ReturnType<typeof useDocuments>['currentDoc'];
  documents: ReturnType<typeof useDocuments>['documents'];
  content: string;
  title: string;
  
  // 文档操作
  createDocument: ReturnType<typeof useDocuments>['createDocument'];
  switchDocument: ReturnType<typeof useDocuments>['switchDocument'];
  deleteDocument: ReturnType<typeof useDocuments>['deleteDocument'];
  duplicateDocument: ReturnType<typeof useDocuments>['duplicateDocument'];
  toggleFavorite: ReturnType<typeof useDocuments>['toggleFavorite'];
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  
  // 文件夹状态
  folders: ReturnType<typeof useFolders>['folders'];
  currentFolderId: ReturnType<typeof useFolders>['currentFolderId'];
  expandedFolders: ReturnType<typeof useFolders>['expandedFolders'];
  
  // 文件夹操作
  createFolder: ReturnType<typeof useFolders>['createFolder'];
  deleteFolder: ReturnType<typeof useFolders>['deleteFolder'];
  renameFolder: ReturnType<typeof useFolders>['renameFolder'];
  setCurrentFolder: ReturnType<typeof useFolders>['setCurrentFolder'];
  toggleFolderExpand: ReturnType<typeof useFolders>['toggleFolderExpand'];
  
  // 版本历史
  versions: ReturnType<typeof useVersions>['versions'];
  saveVersion: ReturnType<typeof useVersions>['saveVersion'];
  restoreVersion: ReturnType<typeof useVersions>['restoreVersion'];
  deleteVersion: ReturnType<typeof useVersions>['deleteVersion'];
  
  // AI 功能
  aiChat: ReturnType<typeof useAIChat>;
  aiAssist: ReturnType<typeof useAIAssist>;
  
  // 编辑器模式
  editorMode: EditorMode;
  setEditorMode: (mode: 'edit' | 'preview' | 'live') => void;
  setFontSize: (size: number) => void;
  toggleFullscreen: () => void;
  
  // UI 状态
  uiState: EditorUIState;
  toggleSidebar: () => void;
  setSidebarTab: (tab: 'documents' | 'folders') => void;
  toggleTemplates: () => void;
  toggleSearchReplace: () => void;
  toggleVersionHistory: () => void;
  
  // 统计信息
  stats: {
    chars: number;
    words: number;
    lines: number;
    readingTime: number;
  };
  
  // 目录
  toc: Array<{ level: number; text: string; id: string }>;
  
  // 撤销/重做
  history: HistoryState;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  
  // 初始化完成
  isReady: boolean;
}

export function useEditorCore(options: UseEditorCoreOptions = {}): UseEditorCoreReturn {
  const { 
    autoSaveDelay = 500, 
    autoSaveVersionInterval = 5 * 60 * 1000,
    maxHistorySize = 50,
  } = options;
  
  // 文档管理
  const documents = useDocuments({ autoSaveDelay });
  
  // 文件夹管理
  const folders = useFolders();
  
  // 版本历史
  const versions = useVersions(documents.currentDoc?.id || null, {
    autoSaveInterval: autoSaveVersionInterval,
  });
  
  // AI 功能
  const aiChat = useAIChat(documents.content);
  const aiAssist = useAIAssist(documents.content, {
    onApply: (result, action) => {
      handleApplyAIResult(result, action);
    },
  });
  
  // 撤销/重做历史 - 本地状态管理
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: '',
    future: [],
  });
  const lastContentRef = useRef<string>('');
  const isUndoRedoRef = useRef(false);
  
  // 编辑器模式
  const [editorMode, setEditorModeState] = useState<EditorMode>({
    mode: 'live',
    fontSize: 14,
    isFullscreen: false,
  });
  
  // UI 状态
  const [uiState, setUIState] = useState<EditorUIState>({
    showSidebar: true,
    sidebarTab: 'documents',
    showTemplates: false,
    showSearchReplace: false,
    showVersionHistory: false,
  });
  
  // 初始化状态
  const [isReady, setIsReady] = useState(false);
  
  // 更新内容（同时更新历史）
  const updateContent = useCallback((newContent: string) => {
    documents.updateContent(newContent);
    
    // 只有非撤销/重做操作才记录历史
    if (!isUndoRedoRef.current && newContent !== lastContentRef.current) {
      lastContentRef.current = newContent;
      setHistory(prev => ({
        past: [...prev.past, prev.present].slice(-maxHistorySize),
        present: newContent,
        future: [],
      }));
    }
    
    isUndoRedoRef.current = false;
  }, [documents, maxHistorySize]);
  
  // 更新标题
  const updateTitle = useCallback((newTitle: string) => {
    documents.updateTitle(newTitle);
  }, [documents]);
  
  // 撤销
  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    isUndoRedoRef.current = true;
    lastContentRef.current = previous;
    
    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future],
    });
    
    documents.updateContent(previous);
  }, [history, documents]);
  
  // 重做
  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    isUndoRedoRef.current = true;
    lastContentRef.current = next;
    
    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture,
    });
    
    documents.updateContent(next);
  }, [history, documents]);
  
  // 设置编辑器模式
  const setEditorMode = useCallback((mode: 'edit' | 'preview' | 'live') => {
    setEditorModeState(prev => ({ ...prev, mode }));
  }, []);
  
  // 设置字体大小
  const setFontSize = useCallback((size: number) => {
    setEditorModeState(prev => ({ ...prev, fontSize: size }));
  }, []);
  
  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setEditorModeState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);
  
  // UI 状态切换函数
  const toggleSidebar = useCallback(() => {
    setUIState(prev => ({ ...prev, showSidebar: !prev.showSidebar }));
  }, []);
  
  const setSidebarTab = useCallback((tab: 'documents' | 'folders') => {
    setUIState(prev => ({ ...prev, sidebarTab: tab }));
  }, []);
  
  const toggleTemplates = useCallback(() => {
    setUIState(prev => ({ ...prev, showTemplates: !prev.showTemplates }));
  }, []);
  
  const toggleSearchReplace = useCallback(() => {
    setUIState(prev => ({ ...prev, showSearchReplace: !prev.showSearchReplace }));
  }, []);
  
  const toggleVersionHistory = useCallback(() => {
    setUIState(prev => ({ ...prev, showVersionHistory: !prev.showVersionHistory }));
  }, []);
  
  // 处理 AI 结果应用
  const handleApplyAIResult = useCallback((result: string, action: AIAction) => {
    const currentContent = documents.content;
    
    switch (action) {
      case 'continue':
        updateContent(currentContent + '\n\n' + result);
        break;
      case 'outline':
      case 'summarize':
      case 'title':
        updateContent(result + '\n\n---\n\n' + currentContent);
        break;
      default:
        updateContent(currentContent + result);
    }
  }, [documents.content, updateContent]);
  
  // 同步文档内容到历史
  useEffect(() => {
    if (documents.content && documents.content !== history.present && !isUndoRedoRef.current) {
      lastContentRef.current = documents.content;
      setHistory(prev => ({
        past: [...prev.past, prev.present].slice(-maxHistorySize),
        present: documents.content,
        future: [],
      }));
    }
  }, [documents.content, maxHistorySize]);
  
  // 统计信息
  const stats = useMemo(() => {
    const content = documents.content;
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    const readingTime = Math.ceil(words / 200);
    
    return { chars, words, lines, readingTime };
  }, [documents.content]);
  
  // 目录
  const toc = useMemo(() => {
    const content = documents.content;
    const headings = content.match(/^#{1,6}\s+.+$/gm);
    
    if (!headings) return [];
    
    return headings.map((heading) => {
      const level = heading.match(/^#+/)?.[0].length || 1;
      const text = heading.replace(/^#+\s+/, '');
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
      return { level, text, id };
    });
  }, [documents.content]);
  
  // 初始化完成标记
  useEffect(() => {
    if (documents.currentDoc !== undefined) {
      setIsReady(true);
    }
  }, [documents.currentDoc]);
  
  // 键盘快捷键
  useKeyboardShortcuts([
    { key: 's', ctrl: true, action: () => versions.saveVersion() },
    { key: 'z', ctrl: true, action: undo },
    { key: 'z', ctrl: true, shift: true, action: redo },
    { key: 'y', ctrl: true, action: redo },
    { key: 'f', ctrl: true, action: toggleSearchReplace },
    { key: 'k', ctrl: true, action: aiChat.toggle },
  ], { enabled: isReady });
  
  return {
    // 文档状态
    currentDoc: documents.currentDoc,
    documents: documents.documents,
    content: documents.content,
    title: documents.title,
    
    // 文档操作
    createDocument: documents.createDocument,
    switchDocument: documents.switchDocument,
    deleteDocument: documents.deleteDocument,
    duplicateDocument: documents.duplicateDocument,
    toggleFavorite: documents.toggleFavorite,
    updateContent,
    updateTitle,
    
    // 文件夹状态
    folders: folders.folders,
    currentFolderId: folders.currentFolderId,
    expandedFolders: folders.expandedFolders,
    
    // 文件夹操作
    createFolder: folders.createFolder,
    deleteFolder: folders.deleteFolder,
    renameFolder: folders.renameFolder,
    setCurrentFolder: folders.setCurrentFolder,
    toggleFolderExpand: folders.toggleFolderExpand,
    
    // 版本历史
    versions: versions.versions,
    saveVersion: versions.saveVersion,
    restoreVersion: versions.restoreVersion,
    deleteVersion: versions.deleteVersion,
    
    // AI 功能
    aiChat,
    aiAssist,
    
    // 编辑器模式
    editorMode,
    setEditorMode,
    setFontSize,
    toggleFullscreen,
    
    // UI 状态
    uiState,
    toggleSidebar,
    setSidebarTab,
    toggleTemplates,
    toggleSearchReplace,
    toggleVersionHistory,
    
    // 统计信息
    stats,
    
    // 目录
    toc,
    
    // 撤销/重做
    history,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    
    // 初始化完成
    isReady,
  };
}
