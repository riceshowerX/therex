/**
 * AI 功能 Hook
 * 提供前端调用 AI 服务的便捷接口
 */

import { useState, useCallback, useRef } from 'react';

// AI 操作类型
export type AIAction =
  | 'continue'
  | 'polish'
  | 'expand'
  | 'summarize'
  | 'outline'
  | 'ask'
  | 'complete'
  | 'generate-from-outline'
  | 'generate-by-topic'
  | 'translate'
  | 'analyze-style'
  | 'optimize'
  | 'mindmap'
  | 'analyze-image'
  | 'image-description'
  | 'deep-analysis'
  | 'chat';

// AI 请求参数
export interface AIRequestParams {
  action: AIAction;
  content?: string;
  text?: string;
  selection?: string;
  topic?: string;
  outline?: string;
  question?: string;
  imageUrl?: string;
  targetLanguage?: string;
  sourceLanguage?: string;
  style?: 'professional' | 'casual' | 'academic' | 'creative';
  format?: 'bullet' | 'paragraph' | 'outline';
  type?: 'article' | 'report' | 'essay' | 'tutorial';
  expandType?: 'detail' | 'example' | 'explanation';
  analysisType?: 'critical' | 'creative' | 'comparative' | 'structural';
  focusArea?: 'clarity' | 'conciseness' | 'engagement' | 'professionalism';
  cursorPosition?: number;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// AI 响应状态
export interface AIResponse {
  content: string;
  isLoading: boolean;
  error: string | null;
}

// Hook 返回类型
export interface UseAIReturn {
  response: AIResponse;
  execute: (params: AIRequestParams) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

// 默认状态
const defaultResponse: AIResponse = {
  content: '',
  isLoading: false,
  error: null,
};

/**
 * AI 功能 Hook
 */
export function useAI(): UseAIReturn {
  const [response, setResponse] = useState<AIResponse>(defaultResponse);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 执行 AI 请求
  const execute = useCallback(async (params: AIRequestParams) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    setResponse({
      content: '',
      isLoading: true,
      error: null,
    });

    try {
      const res = await fetch('/api/ai/service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '请求失败');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后可能不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              setResponse({
                content: accumulatedContent,
                isLoading: false,
                error: null,
              });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                setResponse({
                  content: accumulatedContent,
                  isLoading: false,
                  error: parsed.error,
                });
                return;
              }
              if (parsed.content) {
                accumulatedContent += parsed.content;
                setResponse({
                  content: accumulatedContent,
                  isLoading: true,
                  error: null,
                });
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 处理缓冲区中剩余的数据
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim();
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulatedContent += parsed.content;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

      setResponse({
        content: accumulatedContent,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 用户主动取消，不显示错误
        return;
      }

      setResponse({
        content: '',
        isLoading: false,
        error: error instanceof Error ? error.message : '请求失败',
      });
    }
  }, []);

  // 停止请求
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setResponse(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setResponse(defaultResponse);
  }, []);

  return { response, execute, stop, reset };
}

/**
 * AI 对话 Hook（支持多轮对话）
 */
export function useAIChat() {
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    context?: string
  ) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // 添加用户消息
    setHistory(prev => [...prev, { role: 'user', content: message }]);
    setCurrentResponse('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'chat',
          question: message,
          content: context,
          chatHistory: history,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '请求失败');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || ''; // 保留最后可能不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              // 添加助手回复到历史
              setHistory(prev => [...prev, { role: 'assistant', content: accumulatedContent }]);
              setCurrentResponse('');
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                setError(parsed.error);
                setIsLoading(false);
                return;
              }
              if (parsed.content) {
                accumulatedContent += parsed.content;
                setCurrentResponse(accumulatedContent);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 处理缓冲区中剩余的数据
      if (sseBuffer.startsWith('data: ')) {
        const data = sseBuffer.slice(6).trim();
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulatedContent += parsed.content;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

      setHistory(prev => [...prev, { role: 'assistant', content: accumulatedContent }]);
      setCurrentResponse('');
      setIsLoading(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setError(err instanceof Error ? err.message : '请求失败');
      setIsLoading(false);
    }
  }, [history]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentResponse('');
    setError(null);
  }, []);

  return {
    history,
    currentResponse,
    isLoading,
    error,
    sendMessage,
    stop,
    clearHistory,
  };
}

/**
 * AI 智能补全 Hook
 */
export function useAICompletion() {
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const complete = useCallback(async (
    text: string,
    cursorPosition: number,
    delay: number = 500
  ) => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 设置防抖
    debounceTimerRef.current = setTimeout(async () => {
      if (!text.trim()) {
        setSuggestion('');
        return;
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);

      try {
        const res = await fetch('/api/ai/service', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'complete',
            content: text,
            cursorPosition,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setIsLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setSuggestion(accumulatedContent);
                setIsLoading(false);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  setSuggestion(accumulatedContent);
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }

        setSuggestion(accumulatedContent);
        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    }, delay);
  }, []);

  const clearSuggestion = useCallback(() => {
    setSuggestion('');
  }, []);

  const stop = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  return {
    suggestion,
    isLoading,
    complete,
    clearSuggestion,
    stop,
  };
}

/**
 * 语言检测 Hook
 */
export function useLanguageDetection() {
  const [language, setLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const detect = useCallback(async (text: string) => {
    if (!text.trim()) {
      setLanguage('');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/ai/service?text=${encodeURIComponent(text.slice(0, 500))}`);
      const data = await res.json();

      if (data.language) {
        setLanguage(data.language);
      }
    } catch {
      setLanguage('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { language, isLoading, detect };
}
