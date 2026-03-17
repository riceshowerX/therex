/**
 * 编辑器模块导出
 */

// Context 和 Hooks
export { EditorProvider, useEditor, useCurrentDocument, useDocuments, useEditorMode, useUndoRedo } from './EditorContext';
export type { EditorState } from './EditorContext';

// 组件
export { DocumentSidebar } from './DocumentSidebar';
export type { DocumentSidebarProps } from './DocumentSidebar';

export { AIPanel } from './AIPanel';
export type { AIPanelProps, ChatMessage } from './AIPanel';

export { VersionHistory } from './VersionHistory';
export type { VersionHistoryProps } from './VersionHistory';

export { SearchReplace } from './SearchReplace';
export type { SearchReplaceProps } from './SearchReplace';

export { TableOfContents, TocSidebar } from './TableOfContents';
export type { TableOfContentsProps, TocSidebarProps, TocItem } from './TableOfContents';
