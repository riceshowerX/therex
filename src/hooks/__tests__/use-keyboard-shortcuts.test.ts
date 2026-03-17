/**
 * useKeyboardShortcuts Hook 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, useEditorShortcuts } from '../use-keyboard-shortcuts';

// 创建键盘事件辅助函数
function createKeyboardEvent(
  key: string,
  options: Partial<KeyboardEvent> = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本功能', () => {
    it('应该在按键匹配时触发回调', () => {
      const action = vi.fn();
      
      renderHook(() =>
        useKeyboardShortcuts([{ key: 's', action }])
      );

      window.dispatchEvent(createKeyboardEvent('s'));
      
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('应该支持 Ctrl 修饰键', () => {
      const action = vi.fn();
      
      renderHook(() =>
        useKeyboardShortcuts([{ key: 's', ctrl: true, action }])
      );

      // 不带 Ctrl 不应触发
      window.dispatchEvent(createKeyboardEvent('s'));
      expect(action).not.toHaveBeenCalled();

      // 带 Ctrl 应该触发
      window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('应该支持 Shift 修饰键', () => {
      const action = vi.fn();
      
      renderHook(() =>
        useKeyboardShortcuts([{ key: 's', shift: true, action }])
      );

      window.dispatchEvent(createKeyboardEvent('s', { shiftKey: true }));
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('应该支持组合修饰键', () => {
      const action = vi.fn();
      
      renderHook(() =>
        useKeyboardShortcuts([
          { key: 's', ctrl: true, shift: true, action },
        ])
      );

      // 只有 Ctrl
      window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
      expect(action).not.toHaveBeenCalled();

      // Ctrl + Shift
      window.dispatchEvent(
        createKeyboardEvent('s', { ctrlKey: true, shiftKey: true })
      );
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('enabled 选项', () => {
    it('disabled 时不应该触发回调', () => {
      const action = vi.fn();
      
      renderHook(() =>
        useKeyboardShortcuts(
          [{ key: 's', action }],
          { enabled: false }
        )
      );

      window.dispatchEvent(createKeyboardEvent('s'));
      expect(action).not.toHaveBeenCalled();
    });
  });

  describe('preventDefault 选项', () => {
    it('应该阻止默认行为', () => {
      const action = vi.fn();
      
      renderHook(() =>
        useKeyboardShortcuts(
          [{ key: 's', action }],
          { preventDefault: true }
        )
      );

      const event = createKeyboardEvent('s');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      window.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('清理', () => {
    it('卸载时应该移除事件监听', () => {
      const action = vi.fn();
      
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts([{ key: 's', action }])
      );

      unmount();

      window.dispatchEvent(createKeyboardEvent('s'));
      expect(action).not.toHaveBeenCalled();
    });
  });
});

describe('useEditorShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该注册撤销快捷键', () => {
    const onUndo = vi.fn();
    
    renderHook(() => useEditorShortcuts({ onUndo }));

    window.dispatchEvent(createKeyboardEvent('z', { ctrlKey: true }));
    expect(onUndo).toHaveBeenCalled();
  });

  it('应该注册重做快捷键 (Ctrl+Shift+Z)', () => {
    const onRedo = vi.fn();
    
    renderHook(() => useEditorShortcuts({ onRedo }));

    window.dispatchEvent(
      createKeyboardEvent('z', { ctrlKey: true, shiftKey: true })
    );
    expect(onRedo).toHaveBeenCalled();
  });

  it('应该注册重做快捷键 (Ctrl+Y)', () => {
    const onRedo = vi.fn();
    
    renderHook(() => useEditorShortcuts({ onRedo }));

    window.dispatchEvent(createKeyboardEvent('y', { ctrlKey: true }));
    expect(onRedo).toHaveBeenCalled();
  });

  it('应该注册保存快捷键', () => {
    const onSave = vi.fn();
    
    renderHook(() => useEditorShortcuts({ onSave }));

    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(onSave).toHaveBeenCalled();
  });

  it('应该注册查找快捷键', () => {
    const onSearch = vi.fn();
    
    renderHook(() => useEditorShortcuts({ onSearch }));

    window.dispatchEvent(createKeyboardEvent('f', { ctrlKey: true }));
    expect(onSearch).toHaveBeenCalled();
  });

  it('应该注册 AI 对话快捷键', () => {
    const onAIChat = vi.fn();
    
    renderHook(() => useEditorShortcuts({ onAIChat }));

    window.dispatchEvent(createKeyboardEvent('k', { ctrlKey: true }));
    expect(onAIChat).toHaveBeenCalled();
  });
});
