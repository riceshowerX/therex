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
    if (state.past.length === 0) return null;

    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);

    lastContentRef.current = previous;

    setState({
      past: newPast,
      present: previous,
      future: [state.present, ...state.future],
    });

    return previous;
  }, [state]);

  const redo = useCallback((): string | null => {
    if (state.future.length === 0) return null;

    const next = state.future[0];
    const newFuture = state.future.slice(1);

    lastContentRef.current = next;

    setState({
      past: [...state.past, state.present],
      present: next,
      future: newFuture,
    });

    return next;
  }, [state]);

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
