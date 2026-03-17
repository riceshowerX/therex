/**
 * AI Features Hook
 * Handles AI-powered writing assistance
 */

import { useState, useCallback } from 'react';

export interface AIState {
  isLoading: boolean;
  error: string | null;
  suggestion: string | null;
}

export interface UseAIFeaturesReturn {
  state: AIState;
  improveText: (text: string) => Promise<string>;
  completeSentence: (text: string) => Promise<string>;
  generateSummary: (text: string) => Promise<string>;
  translateText: (text: string, targetLang: string) => Promise<string>;
  clearSuggestion: () => void;
}

export function useAIFeatures(): UseAIFeaturesReturn {
  const [state, setState] = useState<AIState>({
    isLoading: false,
    error: null,
    suggestion: null,
  });

  const improveText = useCallback(async (text: string): Promise<string> => {
    setState({ isLoading: true, error: null, suggestion: null });
    
    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'improve', text }),
      });

      if (!response.ok) throw new Error('Failed to improve text');

      const data = await response.json();
      setState({ isLoading: false, error: null, suggestion: data.result });
      return data.result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ isLoading: false, error: errorMessage, suggestion: null });
      throw error;
    }
  }, []);

  const completeSentence = useCallback(async (text: string): Promise<string> => {
    setState({ isLoading: true, error: null, suggestion: null });
    
    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', text }),
      });

      if (!response.ok) throw new Error('Failed to complete sentence');

      const data = await response.json();
      setState({ isLoading: false, error: null, suggestion: data.result });
      return data.result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ isLoading: false, error: errorMessage, suggestion: null });
      throw error;
    }
  }, []);

  const generateSummary = useCallback(async (text: string): Promise<string> => {
    setState({ isLoading: true, error: null, suggestion: null });
    
    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summarize', text }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      setState({ isLoading: false, error: null, suggestion: data.result });
      return data.result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ isLoading: false, error: errorMessage, suggestion: null });
      throw error;
    }
  }, []);

  const translateText = useCallback(async (text: string, targetLang: string): Promise<string> => {
    setState({ isLoading: true, error: null, suggestion: null });
    
    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'translate', text, targetLang }),
      });

      if (!response.ok) throw new Error('Failed to translate text');

      const data = await response.json();
      setState({ isLoading: false, error: null, suggestion: data.result });
      return data.result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ isLoading: false, error: errorMessage, suggestion: null });
      throw error;
    }
  }, []);

  const clearSuggestion = useCallback(() => {
    setState({ isLoading: false, error: null, suggestion: null });
  }, []);

  return {
    state,
    improveText,
    completeSentence,
    generateSummary,
    translateText,
    clearSuggestion,
  };
}
