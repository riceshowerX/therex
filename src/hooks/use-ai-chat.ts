/**
 * AI 对话 Hook
 *
 * 提供与 AI 进行对话交互的状态管理
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { aiConfigManager } from '@/lib/ai-config';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface UseAIChatOptions {
  maxHistory?: number;
  onMessageAdded?: (message: ChatMessage) => void;
}

interface UseAIChatReturn {
  // 状态
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;

  // 操作方法
  setInput: (input: string) => void;
  sendMessage: () => Promise<void>;
  clearMessages: () => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;

  // AI 操作
  continueWriting: (content: string) => Promise<string | null>;
  polishText: (text: string) => Promise<string | null>;
  expandText: (text: string) => Promise<string | null>;
  summarizeText: (content: string) => Promise<string | null>;
  translateText: (text: string) => Promise<string | null>;
  fixText: (text: string) => Promise<string | null>;
  generateTitle: (content: string) => Promise<string | null>;
  generateOutline: (content: string) => Promise<string | null>;
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const { maxHistory = 50, onMessageAdded } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 添加消息
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: ChatMessage = {
      role,
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => {
      const newMessages = [...prev, message];
      return newMessages.slice(-maxHistory);
    });

    onMessageAdded?.(message);
  }, [maxHistory, onMessageAdded]);

  // 调用 AI API
  const callAI = useCallback(async (
    action: string,
    content: string,
    selection?: string,
    userMessage?: string
  ): Promise<string | null> => {
    const config = aiConfigManager.getConfig();

    if (!config.apiKey) {
      setError('请先在设置中配置 AI');
      toast.error('请先在设置中配置 AI');
      return null;
    }

    setLoading(true);
    setError(null);

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          content,
          selection,
          userMessage,
          config: {
            provider: config.provider,
            apiKey: config.apiKey,
            apiEndpoint: config.apiEndpoint,
            model: config.model,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI 请求失败');
      }

      const data = await response.json();
      return data.result || data.content || null;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }

      const errorMessage = err instanceof Error ? err.message : 'AI 请求失败';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 发送对话消息
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);

    const result = await callAI('chat', '', undefined, userMessage);

    if (result) {
      addMessage('assistant', result);
    }
  }, [input, loading, addMessage, callAI]);

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // AI 操作方法
  const continueWriting = useCallback(async (content: string): Promise<string | null> => {
    return callAI('continue', content);
  }, [callAI]);

  const polishText = useCallback(async (text: string): Promise<string | null> => {
    return callAI('polish', '', text);
  }, [callAI]);

  const expandText = useCallback(async (text: string): Promise<string | null> => {
    return callAI('expand', '', text);
  }, [callAI]);

  const summarizeText = useCallback(async (content: string): Promise<string | null> => {
    return callAI('summarize', content);
  }, [callAI]);

  const translateText = useCallback(async (text: string): Promise<string | null> => {
    return callAI('translate', '', text);
  }, [callAI]);

  const fixText = useCallback(async (text: string): Promise<string | null> => {
    return callAI('fix', '', text);
  }, [callAI]);

  const generateTitle = useCallback(async (content: string): Promise<string | null> => {
    return callAI('title', content);
  }, [callAI]);

  const generateOutline = useCallback(async (content: string): Promise<string | null> => {
    return callAI('outline', content);
  }, [callAI]);

  // 清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    input,
    loading,
    error,
    setInput,
    sendMessage,
    clearMessages,
    addMessage,
    continueWriting,
    polishText,
    expandText,
    summarizeText,
    translateText,
    fixText,
    generateTitle,
    generateOutline,
  };
}
