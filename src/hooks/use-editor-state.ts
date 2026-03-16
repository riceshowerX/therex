/**
 * 编辑器状态 Hook
 *
 * 管理编辑器的 UI 状态和配置
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

type EditorMode = 'edit' | 'preview' | 'live';

interface EditorState {
  mode: EditorMode;
  isFullscreen: boolean;
  fontSize: number;
  showSidebar: boolean;
  showSearchReplace: boolean;
  searchQuery: string;
  replaceQuery: string;
}

interface UseEditorStateReturn {
  // 状态
  mode: EditorMode;
  isFullscreen: boolean;
  fontSize: number;
  showSidebar: boolean;
  showSearchReplace: boolean;
  searchQuery: string;
  replaceQuery: string;

  // 主题
  theme: string | undefined;
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;

  // 视图控制
  setMode: (mode: EditorMode) => void;
  toggleFullscreen: () => void;
  setFontSize: (size: number) => void;
  adjustFontSize: (delta: number) => void;
  toggleSidebar: () => void;

  // 搜索替换
  setSearchQuery: (query: string) => void;
  setReplaceQuery: (query: string) => void;
  toggleSearchReplace: () => void;
  closeSearchReplace: () => void;

  // 撤销/重做
  undoStack: string[];
  redoStack: string[];
  pushUndo: (content: string) => void;
  undo: () => string | undefined;
  redo: () => string | undefined;
  clearHistory: () => void;
}

const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 24;
const FONT_SIZE_DEFAULT = 14;
const HISTORY_MAX = 50;

export function useEditorState(): UseEditorStateReturn {
  const { theme, resolvedTheme, setTheme } = useTheme();

  // 基础状态
  const [mode, setMode] = useState<EditorMode>('live');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(FONT_SIZE_DEFAULT);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  // 撤销/重做栈
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // 加载保存的设置
  useEffect(() => {
    const savedFontSize = localStorage.getItem('editor-font-size');
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize, 10));
    }

    const savedSidebar = localStorage.getItem('editor-sidebar');
    if (savedSidebar !== null) {
      setShowSidebar(savedSidebar === 'true');
    }
  }, []);

  // 保存设置
  useEffect(() => {
    localStorage.setItem('editor-font-size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('editor-sidebar', showSidebar.toString());
  }, [showSidebar]);

  // 全屏控制
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 字体大小调整
  const adjustFontSize = useCallback((delta: number) => {
    setFontSize(prev => {
      const newSize = prev + delta;
      return Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, newSize));
    });
  }, []);

  // 侧边栏切换
  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  // 搜索替换切换
  const toggleSearchReplace = useCallback(() => {
    setShowSearchReplace(prev => !prev);
  }, []);

  const closeSearchReplace = useCallback(() => {
    setShowSearchReplace(false);
    setSearchQuery('');
    setReplaceQuery('');
  }, []);

  // 撤销/重做操作
  const pushUndo = useCallback((content: string) => {
    setUndoStack(prev => {
      const newStack = [...prev, content];
      return newStack.slice(-HISTORY_MAX);
    });
    // 清空重做栈
    setRedoStack([]);
  }, []);

  const undo = useCallback((): string | undefined => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;

      const last = prev[prev.length - 1];
      setRedoStack(r => [...r, last]);
      return prev.slice(0, -1);
    });

    return undoStack[undoStack.length - 1];
  }, [undoStack]);

  const redo = useCallback((): string | undefined => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;

      const last = prev[prev.length - 1];
      setUndoStack(u => [...u, last]);
      return prev.slice(0, -1);
    });

    return redoStack[redoStack.length - 1];
  }, [redoStack]);

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    mode,
    isFullscreen,
    fontSize,
    showSidebar,
    showSearchReplace,
    searchQuery,
    replaceQuery,
    theme,
    resolvedTheme,
    setTheme,
    setMode,
    toggleFullscreen,
    setFontSize,
    adjustFontSize,
    toggleSidebar,
    setSearchQuery,
    setReplaceQuery,
    toggleSearchReplace,
    closeSearchReplace,
    undoStack,
    redoStack,
    pushUndo,
    undo,
    redo,
    clearHistory,
  };
}
