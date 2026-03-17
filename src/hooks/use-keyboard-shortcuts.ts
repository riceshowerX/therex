/**
 * 键盘快捷键 Hook
 * 处理编辑器中所有的键盘快捷键
 */

'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * 键盘快捷键 Hook
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const {
          key,
          ctrl = false,
          shift = false,
          alt = false,
          meta = false,
          action,
        } = shortcut;

        // 检查修饰键
        const matchCtrl = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const matchShift = shift ? event.shiftKey : !event.shiftKey;
        const matchAlt = alt ? event.altKey : !event.altKey;
        const matchMeta = meta ? event.metaKey : true;
        const matchKey = event.key.toLowerCase() === key.toLowerCase();

        if (matchCtrl && matchShift && matchAlt && matchMeta && matchKey) {
          if (preventDefault) {
            event.preventDefault();
          }
          action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled, preventDefault]);
}

/**
 * 编辑器快捷键预设
 */
export function useEditorShortcuts({
  onUndo,
  onRedo,
  onSave,
  onSaveVersion,
  onSearch,
  onAIChat,
  onNewDocument,
  onBold,
  onItalic,
  onHeading,
}: {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onSaveVersion?: () => void;
  onSearch?: () => void;
  onAIChat?: () => void;
  onNewDocument?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
  onHeading?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onUndo) {
    shortcuts.push({
      key: 'z',
      ctrl: true,
      action: onUndo,
      description: '撤销',
    });
  }

  if (onRedo) {
    shortcuts.push(
      {
        key: 'z',
        ctrl: true,
        shift: true,
        action: onRedo,
        description: '重做',
      },
      {
        key: 'y',
        ctrl: true,
        action: onRedo,
        description: '重做',
      }
    );
  }

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      action: onSave,
      description: '保存',
    });
  }

  if (onSaveVersion) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      shift: true,
      action: onSaveVersion,
      description: '保存版本',
    });
  }

  if (onSearch) {
    shortcuts.push({
      key: 'f',
      ctrl: true,
      action: onSearch,
      description: '查找',
    });
  }

  if (onAIChat) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      action: onAIChat,
      description: 'AI 对话',
    });
  }

  if (onNewDocument) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      action: onNewDocument,
      description: '新建文档',
    });
  }

  if (onBold) {
    shortcuts.push({
      key: 'b',
      ctrl: true,
      action: onBold,
      description: '加粗',
    });
  }

  if (onItalic) {
    shortcuts.push({
      key: 'i',
      ctrl: true,
      action: onItalic,
      description: '斜体',
    });
  }

  if (onHeading) {
    shortcuts.push({
      key: 'h',
      ctrl: true,
      action: onHeading,
      description: '标题',
    });
  }

  useKeyboardShortcuts(shortcuts);
}

/**
 * 全局快捷键配置
 */
export const EDITOR_SHORTCUTS = {
  undo: { key: 'Ctrl+Z', description: '撤销' },
  redo: { key: 'Ctrl+Shift+Z / Ctrl+Y', description: '重做' },
  save: { key: 'Ctrl+S', description: '保存' },
  saveVersion: { key: 'Ctrl+Shift+S', description: '保存版本' },
  search: { key: 'Ctrl+F', description: '查找替换' },
  aiChat: { key: 'Ctrl+K', description: 'AI 对话' },
  newDocument: { key: 'Ctrl+N', description: '新建文档' },
  bold: { key: 'Ctrl+B', description: '加粗' },
  italic: { key: 'Ctrl+I', description: '斜体' },
} as const;
