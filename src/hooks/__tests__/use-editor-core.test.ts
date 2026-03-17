/**
 * useEditorCore Hook 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEditorCore } from '../use-editor-core';

// Mock 所有依赖的 hooks
vi.mock('../use-documents', () => ({
  useDocuments: vi.fn(() => ({
    currentDoc: null,
    documents: [],
    content: '',
    title: '',
    createDocument: vi.fn(),
    switchDocument: vi.fn(),
    deleteDocument: vi.fn(),
    duplicateDocument: vi.fn(),
    toggleFavorite: vi.fn(),
    updateContent: vi.fn(),
    updateTitle: vi.fn(),
    refreshDocuments: vi.fn(),
    getDocumentsInFolder: vi.fn(() => []),
  })),
}));

vi.mock('../use-folders', () => ({
  useFolders: vi.fn(() => ({
    folders: [],
    currentFolderId: null,
    expandedFolders: new Set(),
    createFolder: vi.fn(),
    deleteFolder: vi.fn(),
    renameFolder: vi.fn(),
    setCurrentFolder: vi.fn(),
    toggleFolderExpand: vi.fn(),
  })),
}));

vi.mock('../use-versions', () => ({
  useVersions: vi.fn(() => ({
    versions: [],
    saveVersion: vi.fn(),
    restoreVersion: vi.fn(),
    deleteVersion: vi.fn(),
    hasVersions: false,
    latestVersion: null,
  })),
}));

vi.mock('../use-ai-chat', () => ({
  useAIChat: vi.fn(() => ({
    messages: [],
    input: '',
    isLoading: false,
    isOpen: false,
    needsConfig: false,
    sendMessage: vi.fn(),
    setInput: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
    clearHistory: vi.fn(),
    applyLastMessage: vi.fn(),
  })),
}));

vi.mock('../use-ai-assist', () => ({
  useAIAssist: vi.fn(() => ({
    result: '',
    isLoading: false,
    currentAction: null,
    isOpen: false,
    needsConfig: false,
    execute: vi.fn(),
    apply: vi.fn(),
    reject: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock('../use-keyboard-shortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

describe('useEditorCore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化', () => {
    it('应该正确初始化所有状态', () => {
      const { result } = renderHook(() => useEditorCore());

      expect(result.current.documents).toEqual([]);
      expect(result.current.content).toBe('');
      expect(result.current.title).toBe('');
      expect(result.current.folders).toEqual([]);
      expect(result.current.versions).toEqual([]);
    });

    it('应该有默认的编辑器模式', () => {
      const { result } = renderHook(() => useEditorCore());

      expect(result.current.editorMode.mode).toBe('live');
      expect(result.current.editorMode.fontSize).toBe(14);
      expect(result.current.editorMode.isFullscreen).toBe(false);
    });

    it('应该有默认的 UI 状态', () => {
      const { result } = renderHook(() => useEditorCore());

      expect(result.current.uiState.showSidebar).toBe(true);
      expect(result.current.uiState.sidebarTab).toBe('documents');
      expect(result.current.uiState.showTemplates).toBe(false);
      expect(result.current.uiState.showSearchReplace).toBe(false);
      expect(result.current.uiState.showVersionHistory).toBe(false);
    });
  });

  describe('编辑器模式', () => {
    it('setEditorMode 应该更新模式', () => {
      const { result } = renderHook(() => useEditorCore());

      act(() => {
        result.current.setEditorMode('edit');
      });

      expect(result.current.editorMode.mode).toBe('edit');
    });

    it('setFontSize 应该更新字体大小', () => {
      const { result } = renderHook(() => useEditorCore());

      act(() => {
        result.current.setFontSize(18);
      });

      expect(result.current.editorMode.fontSize).toBe(18);
    });

    it('toggleFullscreen 应该切换全屏状态', () => {
      const { result } = renderHook(() => useEditorCore());

      expect(result.current.editorMode.isFullscreen).toBe(false);

      act(() => {
        result.current.toggleFullscreen();
      });

      expect(result.current.editorMode.isFullscreen).toBe(true);

      act(() => {
        result.current.toggleFullscreen();
      });

      expect(result.current.editorMode.isFullscreen).toBe(false);
    });
  });

  describe('UI 状态切换', () => {
    it('toggleSidebar 应该切换侧边栏显示', () => {
      const { result } = renderHook(() => useEditorCore());

      expect(result.current.uiState.showSidebar).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.uiState.showSidebar).toBe(false);
    });

    it('setSidebarTab 应该更新侧边栏标签', () => {
      const { result } = renderHook(() => useEditorCore());

      act(() => {
        result.current.setSidebarTab('folders');
      });

      expect(result.current.uiState.sidebarTab).toBe('folders');
    });

    it('toggleTemplates 应该切换模板显示', () => {
      const { result } = renderHook(() => useEditorCore());

      expect(result.current.uiState.showTemplates).toBe(false);

      act(() => {
        result.current.toggleTemplates();
      });

      expect(result.current.uiState.showTemplates).toBe(true);
    });

    it('toggleSearchReplace 应该切换搜索替换显示', () => {
      const { result } = renderHook(() => useEditorCore());

      expect(result.current.uiState.showSearchReplace).toBe(false);

      act(() => {
        result.current.toggleSearchReplace();
      });

      expect(result.current.uiState.showSearchReplace).toBe(true);
    });

    it('toggleVersionHistory 应该切换版本历史显示', () => {
      const { result } = renderHook(() => useEditorCore());

      expect(result.current.uiState.showVersionHistory).toBe(false);

      act(() => {
        result.current.toggleVersionHistory();
      });

      expect(result.current.uiState.showVersionHistory).toBe(true);
    });
  });

  describe('统计信息', () => {
    it('应该正确计算统计信息', () => {
      const { useDocuments } = require('../use-documents');
      vi.mocked(useDocuments).mockReturnValue({
        currentDoc: null,
        documents: [],
        content: '# Hello\n\nThis is a test.',
        title: 'Test',
        createDocument: vi.fn(),
        switchDocument: vi.fn(),
        deleteDocument: vi.fn(),
        duplicateDocument: vi.fn(),
        toggleFavorite: vi.fn(),
        updateContent: vi.fn(),
        updateTitle: vi.fn(),
      });

      const { result } = renderHook(() => useEditorCore());

      expect(result.current.stats.chars).toBe(22);
      expect(result.current.stats.lines).toBe(3);
    });
  });

  describe('目录', () => {
    it('应该正确解析目录', () => {
      const { useDocuments } = require('../use-documents');
      vi.mocked(useDocuments).mockReturnValue({
        currentDoc: null,
        documents: [],
        content: '# Title 1\n## Title 2\n### Title 3',
        title: 'Test',
        createDocument: vi.fn(),
        switchDocument: vi.fn(),
        deleteDocument: vi.fn(),
        duplicateDocument: vi.fn(),
        toggleFavorite: vi.fn(),
        updateContent: vi.fn(),
        updateTitle: vi.fn(),
      });

      const { result } = renderHook(() => useEditorCore());

      expect(result.current.toc).toHaveLength(3);
      expect(result.current.toc[0].level).toBe(1);
      expect(result.current.toc[1].level).toBe(2);
      expect(result.current.toc[2].level).toBe(3);
    });

    it('没有标题时应该返回空数组', () => {
      const { result } = renderHook(() => useEditorCore());

      expect(result.current.toc).toEqual([]);
    });
  });

  describe('撤销/重做', () => {
    it('初始状态应该不能撤销或重做', () => {
      const { result } = renderHook(() => useEditorCore());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });
});
