/**
 * 编辑器状态上下文
 * 使用 React Context 统一管理编辑器状态，避免 prop drilling
 */

'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { getStorageManager } from '@/lib/storage/manager';
import type { Document, Folder, DocumentVersion } from '@/types';
import {
  CONTENT_SAVE_DEBOUNCE_MS,
  MAX_UNDO_HISTORY,
  AUTO_SAVE_INTERVAL_MS,
} from '@/lib/constants';

// ==================== 类型定义 ====================

export interface EditorState {
  // 文档状态
  currentDoc: Document | null;
  documents: Document[];
  content: string;
  title: string;
  
  // 文件夹状态
  folders: Folder[];
  currentFolderId: string | null;
  expandedFolders: Set<string>;
  
  // 版本历史
  versions: DocumentVersion[];
  
  // 编辑器状态
  mode: 'edit' | 'preview' | 'live';
  fontSize: number;
  isFullscreen: boolean;
  
  // UI 状态
  showSidebar: boolean;
  sidebarTab: 'documents' | 'folders';
  showAIPanel: boolean;
  showVersionHistory: boolean;
  
  // 撤销/重做
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
}

interface HistoryEntry {
  content: string;
  timestamp: number;
}

type EditorAction =
  | { type: 'SET_DOCUMENT'; payload: Document | null }
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_FOLDERS'; payload: Folder[] }
  | { type: 'SET_CURRENT_FOLDER'; payload: string | null }
  | { type: 'TOGGLE_FOLDER_EXPAND'; payload: string }
  | { type: 'SET_VERSIONS'; payload: DocumentVersion[] }
  | { type: 'SET_MODE'; payload: 'edit' | 'preview' | 'live' }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_TAB'; payload: 'documents' | 'folders' }
  | { type: 'TOGGLE_AI_PANEL' }
  | { type: 'TOGGLE_VERSION_HISTORY' }
  | { type: 'PUSH_UNDO'; payload: HistoryEntry }
  | { type: 'PUSH_REDO'; payload: HistoryEntry }
  | { type: 'CLEAR_REDO' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// ==================== 初始状态 ====================

const initialState: EditorState = {
  currentDoc: null,
  documents: [],
  content: '',
  title: '',
  folders: [],
  currentFolderId: null,
  expandedFolders: new Set(),
  versions: [],
  mode: 'live',
  fontSize: 14,
  isFullscreen: false,
  showSidebar: true,
  sidebarTab: 'documents',
  showAIPanel: false,
  showVersionHistory: false,
  undoStack: [],
  redoStack: [],
  isLoading: true,
  error: null,
};

// ==================== Reducer ====================

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_DOCUMENT':
      return { ...state, currentDoc: action.payload };
    
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
    
    case 'SET_CONTENT':
      return { ...state, content: action.payload };
    
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    
    case 'SET_FOLDERS':
      return { ...state, folders: action.payload };
    
    case 'SET_CURRENT_FOLDER':
      return { ...state, currentFolderId: action.payload };
    
    case 'TOGGLE_FOLDER_EXPAND': {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedFolders: newExpanded };
    }
    
    case 'SET_VERSIONS':
      return { ...state, versions: action.payload };
    
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.payload };
    
    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullscreen: !state.isFullscreen };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, showSidebar: !state.showSidebar };
    
    case 'SET_SIDEBAR_TAB':
      return { ...state, sidebarTab: action.payload };
    
    case 'TOGGLE_AI_PANEL':
      return { ...state, showAIPanel: !state.showAIPanel };
    
    case 'TOGGLE_VERSION_HISTORY':
      return { ...state, showVersionHistory: !state.showVersionHistory };
    
    case 'PUSH_UNDO': {
      const newStack = [...state.undoStack, action.payload];
      return {
        ...state,
        undoStack: newStack.slice(-MAX_UNDO_HISTORY),
      };
    }
    
    case 'PUSH_REDO':
      return { ...state, redoStack: [...state.redoStack, action.payload] };
    
    case 'CLEAR_REDO':
      return { ...state, redoStack: [] };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    default:
      return state;
  }
}

// ==================== Context ====================

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  actions: EditorActions;
}

const EditorContext = createContext<EditorContextValue | null>(null);

// ==================== Actions ====================

interface EditorActions {
  // 文档操作
  createDocument: (title?: string, content?: string, folderId?: string | null) => Document;
  switchDocument: (id: string) => void;
  deleteDocument: (id: string) => void;
  duplicateDocument: (id: string) => Document | undefined;
  toggleFavorite: (id: string) => void;
  saveDocument: () => void;
  
  // 文件夹操作
  createFolder: (name: string, parentId?: string | null) => Folder;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  
  // 编辑器操作
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  undo: () => void;
  redo: () => void;
  
  // 版本操作
  saveVersion: (description?: string) => DocumentVersion | undefined;
  restoreVersion: (versionId: string) => void;
}

// ==================== Provider ====================

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  
  // 初始化
  useEffect(() => {
    const storageManager = getStorageManager();
    
    const docs = storageManager.getAllDocuments();
    dispatch({ type: 'SET_DOCUMENTS', payload: docs });
    
    const foldersData = storageManager.getAllFolders();
    dispatch({ type: 'SET_FOLDERS', payload: foldersData });
    
    const current = storageManager.getCurrentDocument();
    if (current) {
      dispatch({ type: 'SET_DOCUMENT', payload: current });
      dispatch({ type: 'SET_CONTENT', payload: current.content });
      dispatch({ type: 'SET_TITLE', payload: current.title });
      dispatch({ type: 'SET_CURRENT_FOLDER', payload: current.folderId });
      dispatch({ type: 'SET_VERSIONS', payload: current.versions || [] });
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);
  
  // 自动保存
  useEffect(() => {
    if (!state.currentDoc) return;
    
    const timer = setTimeout(() => {
      const storageManager = getStorageManager();
      storageManager.updateDocument(state.currentDoc!.id, {
        title: state.title,
        content: state.content,
      });
      dispatch({
        type: 'SET_DOCUMENTS',
        payload: storageManager.getAllDocuments(),
      });
    }, CONTENT_SAVE_DEBOUNCE_MS);
    
    return () => clearTimeout(timer);
  }, [state.title, state.content, state.currentDoc]);
  
  // 自动版本保存
  useEffect(() => {
    if (!state.currentDoc) return;
    
    const interval = setInterval(() => {
      const storageManager = getStorageManager();
      const savedVersion = storageManager.autoSaveVersion(state.currentDoc!.id);
      if (savedVersion) {
        dispatch({
          type: 'SET_VERSIONS',
          payload: storageManager.getVersionHistory(state.currentDoc!.id),
        });
      }
    }, AUTO_SAVE_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, [state.currentDoc]);
  
  // Actions
  const actions: EditorActions = {
    createDocument: useCallback((title = 'Untitled', content = '', folderId = null) => {
      const storageManager = getStorageManager();
      const doc = storageManager.createDocument({ title, content, folderId });
      
      dispatch({ type: 'SET_DOCUMENT', payload: doc });
      dispatch({ type: 'SET_CONTENT', payload: doc.content });
      dispatch({ type: 'SET_TITLE', payload: doc.title });
      dispatch({ type: 'SET_CURRENT_FOLDER', payload: doc.folderId });
      dispatch({ type: 'SET_DOCUMENTS', payload: storageManager.getAllDocuments() });
      dispatch({ type: 'SET_VERSIONS', payload: [] });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return doc;
    }, []),
    
    switchDocument: useCallback((id: string) => {
      const storageManager = getStorageManager();
      const doc = storageManager.setCurrentDocument(id);
      if (doc) {
        dispatch({ type: 'SET_DOCUMENT', payload: doc });
        dispatch({ type: 'SET_CONTENT', payload: doc.content });
        dispatch({ type: 'SET_TITLE', payload: doc.title });
        dispatch({ type: 'SET_CURRENT_FOLDER', payload: doc.folderId });
        dispatch({ type: 'SET_VERSIONS', payload: doc.versions || [] });
        dispatch({ type: 'SET_DOCUMENTS', payload: storageManager.getAllDocuments() });
      }
    }, []),
    
    deleteDocument: useCallback((id: string) => {
      const storageManager = getStorageManager();
      storageManager.deleteDocument(id);
      const docs = storageManager.getAllDocuments();
      dispatch({ type: 'SET_DOCUMENTS', payload: docs });
      
      if (state.currentDoc?.id === id) {
        if (docs.length > 0) {
          actions.switchDocument(docs[0].id);
        } else {
          actions.createDocument();
        }
      }
    }, [state.currentDoc]),
    
    duplicateDocument: useCallback((id: string) => {
      const storageManager = getStorageManager();
      const newDoc = storageManager.duplicateDocument(id);
      if (newDoc) {
        dispatch({ type: 'SET_DOCUMENTS', payload: storageManager.getAllDocuments() });
      }
      return newDoc;
    }, []),
    
    toggleFavorite: useCallback((id: string) => {
      const storageManager = getStorageManager();
      storageManager.toggleFavorite(id);
      dispatch({ type: 'SET_DOCUMENTS', payload: storageManager.getAllDocuments() });
      
      if (state.currentDoc?.id === id) {
        dispatch({
          type: 'SET_DOCUMENT',
          payload: storageManager.getDocument(id) || null,
        });
      }
    }, [state.currentDoc]),
    
    saveDocument: useCallback(() => {
      if (!state.currentDoc) return;
      const storageManager = getStorageManager();
      storageManager.updateDocument(state.currentDoc.id, {
        title: state.title,
        content: state.content,
      });
      dispatch({ type: 'SET_DOCUMENTS', payload: storageManager.getAllDocuments() });
    }, [state.currentDoc, state.title, state.content]),
    
    createFolder: useCallback((name: string, parentId: string | null = null) => {
      const storageManager = getStorageManager();
      const folder = storageManager.createFolder({ name, parentId });
      dispatch({ type: 'SET_FOLDERS', payload: storageManager.getAllFolders() });
      return folder;
    }, []),
    
    deleteFolder: useCallback((id: string) => {
      const storageManager = getStorageManager();
      storageManager.deleteFolder(id, 'root');
      dispatch({ type: 'SET_FOLDERS', payload: storageManager.getAllFolders() });
      dispatch({ type: 'SET_DOCUMENTS', payload: storageManager.getAllDocuments() });
      
      if (state.currentFolderId === id) {
        dispatch({ type: 'SET_CURRENT_FOLDER', payload: null });
      }
    }, [state.currentFolderId]),
    
    renameFolder: useCallback((id: string, name: string) => {
      const storageManager = getStorageManager();
      storageManager.updateFolder(id, { name });
      dispatch({ type: 'SET_FOLDERS', payload: storageManager.getAllFolders() });
    }, []),
    
    updateContent: useCallback((content: string) => {
      // 保存到撤销栈
      if (state.content !== content) {
        dispatch({
          type: 'PUSH_UNDO',
          payload: { content: state.content, timestamp: Date.now() },
        });
        dispatch({ type: 'CLEAR_REDO' });
      }
      dispatch({ type: 'SET_CONTENT', payload: content });
    }, [state.content]),
    
    updateTitle: useCallback((title: string) => {
      dispatch({ type: 'SET_TITLE', payload: title });
    }, []),
    
    undo: useCallback(() => {
      if (state.undoStack.length <= 1) return;
      
      const current = state.undoStack[state.undoStack.length - 1];
      const previous = state.undoStack[state.undoStack.length - 2];
      
      dispatch({ type: 'PUSH_REDO', payload: current });
      dispatch({
        type: 'PUSH_UNDO',
        payload: { content: previous.content, timestamp: Date.now() },
      });
      dispatch({ type: 'SET_CONTENT', payload: previous.content });
    }, [state.undoStack]),
    
    redo: useCallback(() => {
      if (state.redoStack.length === 0) return;
      
      const next = state.redoStack[state.redoStack.length - 1];
      dispatch({
        type: 'PUSH_UNDO',
        payload: { content: next.content, timestamp: Date.now() },
      });
      dispatch({ type: 'SET_CONTENT', payload: next.content });
    }, [state.redoStack]),
    
    saveVersion: useCallback((description?: string) => {
      if (!state.currentDoc) return undefined;
      
      const storageManager = getStorageManager();
      const version = storageManager.saveVersion(state.currentDoc.id, description);
      if (version) {
        dispatch({
          type: 'SET_VERSIONS',
          payload: storageManager.getVersionHistory(state.currentDoc.id),
        });
      }
      return version;
    }, [state.currentDoc]),
    
    restoreVersion: useCallback((versionId: string) => {
      if (!state.currentDoc) return;
      
      const storageManager = getStorageManager();
      const restored = storageManager.restoreVersion(state.currentDoc.id, versionId);
      if (restored) {
        dispatch({ type: 'SET_CONTENT', payload: restored.content });
        dispatch({ type: 'SET_TITLE', payload: restored.title });
        dispatch({
          type: 'SET_VERSIONS',
          payload: storageManager.getVersionHistory(state.currentDoc.id),
        });
      }
    }, [state.currentDoc]),
  };
  
  return (
    <EditorContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </EditorContext.Provider>
  );
}

// ==================== Hook ====================

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}

// ==================== 选择器 Hooks ====================

export function useCurrentDocument() {
  const { state } = useEditor();
  return state.currentDoc;
}

export function useDocuments() {
  const { state } = useEditor();
  return state.documents;
}

export function useEditorMode() {
  const { state, dispatch } = useEditor();
  
  const setMode = useCallback((mode: 'edit' | 'preview' | 'live') => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, [dispatch]);
  
  return { mode: state.mode, setMode };
}

export function useUndoRedo() {
  const { state, actions } = useEditor();
  
  return {
    canUndo: state.undoStack.length > 1,
    canRedo: state.redoStack.length > 0,
    undo: actions.undo,
    redo: actions.redo,
  };
}
