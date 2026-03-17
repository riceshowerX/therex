/**
 * Hooks 统一导出
 */

// 文档管理
export { useDocuments } from './use-documents';
export type { UseDocumentsOptions, UseDocumentsReturn } from './use-documents';

// 文件夹管理
export { useFolders } from './use-folders';
export type { UseFoldersReturn } from './use-folders';

// 版本历史
export { useVersions } from './use-versions';
export type { UseVersionsOptions, UseVersionsReturn } from './use-versions';

// AI 功能
export { useAIChat } from './use-ai-chat';
export type { UseAIChatOptions, UseAIChatReturn, ChatMessage } from './use-ai-chat';

export { useAIAssist } from './use-ai-assist';
export type { UseAIAssistOptions, UseAIAssistReturn, AIAction } from './use-ai-assist';

// 编辑器功能
export { useEditorCore } from './use-editor-core';
export type {
  UseEditorCoreOptions,
  UseEditorCoreReturn,
  EditorMode,
  EditorUIState,
} from './use-editor-core';

export { useEditorHistory } from './use-editor-history';
export type { UseEditorHistoryReturn, HistoryState } from './use-editor-history';

// 通用功能
export { useAutoSave } from './use-auto-save';
export type { UseAutoSaveOptions, UseAutoSaveReturn } from './use-auto-save';

export { useKeyboardShortcuts, useEditorShortcuts } from './use-keyboard-shortcuts';
export type {
  KeyboardShortcut,
  UseKeyboardShortcutsOptions,
} from './use-keyboard-shortcuts';
