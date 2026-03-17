/**
 * useEditorHistory Hook 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorHistory } from '../use-editor-history';

describe('useEditorHistory', () => {
  describe('初始状态', () => {
    it('应该使用初始内容初始化', () => {
      const { result } = renderHook(() => useEditorHistory('initial content'));
      
      expect(result.current.state.present).toBe('initial content');
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('应该支持空初始内容', () => {
      const { result } = renderHook(() => useEditorHistory());
      
      expect(result.current.state.present).toBe('');
    });
  });

  describe('pushState', () => {
    it('应该添加新状态到历史记录', () => {
      const { result } = renderHook(() => useEditorHistory('initial'));
      
      act(() => {
        result.current.pushState('new content');
      });
      
      expect(result.current.state.present).toBe('new content');
      expect(result.current.canUndo).toBe(true);
    });

    it('不应该添加相同内容', () => {
      const { result } = renderHook(() => useEditorHistory('same'));
      
      act(() => {
        result.current.pushState('same');
      });
      
      expect(result.current.canUndo).toBe(false);
    });

    it('应该限制历史记录大小', () => {
      const { result } = renderHook(() => useEditorHistory());
      
      act(() => {
        for (let i = 0; i < 60; i++) {
          result.current.pushState(`content ${i}`);
        }
      });
      
      expect(result.current.state.past.length).toBeLessThanOrEqual(50);
    });
  });

  describe('undo', () => {
    it('应该撤销到上一个状态', () => {
      const { result } = renderHook(() => useEditorHistory('a'));
      
      act(() => {
        result.current.pushState('b');
        result.current.pushState('c');
      });
      
      let undoneContent: string | null = null;
      act(() => {
        undoneContent = result.current.undo();
      });
      
      expect(undoneContent).toBe('b');
      expect(result.current.state.present).toBe('b');
      expect(result.current.canRedo).toBe(true);
    });

    it('当没有历史时应该返回 null', () => {
      const { result } = renderHook(() => useEditorHistory('only'));
      
      let undoneContent: string | null = null;
      act(() => {
        undoneContent = result.current.undo();
      });
      
      expect(undoneContent).toBeNull();
    });
  });

  describe('redo', () => {
    it('应该重做到下一个状态', () => {
      const { result } = renderHook(() => useEditorHistory('a'));
      
      act(() => {
        result.current.pushState('b');
      });
      
      act(() => {
        result.current.undo();
      });
      
      let redoneContent: string | null = null;
      act(() => {
        redoneContent = result.current.redo();
      });
      
      expect(redoneContent).toBe('b');
      expect(result.current.state.present).toBe('b');
    });

    it('新操作应该清空重做栈', () => {
      const { result } = renderHook(() => useEditorHistory('a'));
      
      act(() => {
        result.current.pushState('b');
        result.current.undo();
        result.current.pushState('c');
      });
      
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('应该清空历史记录', () => {
      const { result } = renderHook(() => useEditorHistory('a'));
      
      act(() => {
        result.current.pushState('b');
        result.current.pushState('c');
        result.current.clearHistory();
      });
      
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });
});
