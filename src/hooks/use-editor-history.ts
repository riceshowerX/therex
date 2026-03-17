/**
 * Editor History Hook
 * Manages undo/redo functionality for the editor
 */

import { useState, useCallback, useRef } from 'react';

export interface HistoryState {
  past: string[];
  present: string;
  future: string[];
}

export interface UseEditorHistoryReturn {
  state: HistoryState;
  pushState: (content: string) => void;
  undo: () => string | null;
  redo: () => string | null;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 50;

export function useEditorHistory(initialContent: string = ''): UseEditorHistoryReturn {
  const [state, setState] = useState<HistoryState>({
    past: [],
    present: initialContent,
    future: [],
  });

  const lastContentRef = useRef<string>(initialContent);

  const pushState = useCallback((content: string) => {
    // Don't push if content hasn't changed
    if (content === lastContentRef.current) return;
    
    lastContentRef.current = content;
    
    setState((prevState) => {
      // Limit history size
      const newPast = [...prevState.past, prevState.present].slice(-MAX_HISTORY_SIZE);
      
      return {
        past: newPast,
        present: content,
        future: [], // Clear future on new action
      };
    });
  }, []);

  const undo = useCallback((): string | null => {
    let newContent: string | null = null;
    
    setState((prevState) => {
      if (prevState.past.length === 0) return prevState;

      const previous = prevState.past[prevState.past.length - 1];
      const newPast = prevState.past.slice(0, -1);

      newContent = previous;
      lastContentRef.current = previous;

      return {
        past: newPast,
        present: previous,
        future: [prevState.present, ...prevState.future],
      };
    });

    return newContent;
  }, []);

  const redo = useCallback((): string | null => {
    let newContent: string | null = null;
    
    setState((prevState) => {
      if (prevState.future.length === 0) return prevState;

      const next = prevState.future[0];
      const newFuture = prevState.future.slice(1);

      newContent = next;
      lastContentRef.current = next;

      return {
        past: [...prevState.past, prevState.present],
        present: next,
        future: newFuture,
      };
    });

    return newContent;
  }, []);

  const clearHistory = useCallback(() => {
    setState({
      past: [],
      present: lastContentRef.current,
      future: [],
    });
  }, []);

  return {
    state,
    pushState,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    clearHistory,
  };
}
