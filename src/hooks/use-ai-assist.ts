/**
 * AI 写作助手 Hook
 * 处理 AI 写作辅助功能（续写、润色、翻译等）
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { aiConfigManager } from '@/lib/ai-config';
import type { AIConfig } from '@/types';

export type AIAction = 
  | 'continue'    // 续写
  | 'polish'      // 润色
  | 'translate'   // 翻译
  | 'summarize'   // 摘要
  | 'outline'     // 大纲
  | 'title'       // 标题
  | 'expand'      // 扩写
  | 'rewrite';    // 重写

export interface UseAIAssistOptions {
  onApply?: (result: string, action: AIAction) => void;
}

export interface UseAIAssistReturn {
  // 状态
  result: string;
  isLoading: boolean;
  currentAction: AIAction | null;
  isOpen: boolean;
  needsConfig: boolean;
  configAction: string;
  
  // 操作
  execute: (action: AIAction, selection?: string) => Promise<void>;
  apply: () => void;
  reject: () => void;
  open: () => void;
  close: () => void;
  
  // 配置
  checkConfig: (action?: string) => boolean;
}

export function useAIAssist(
  content: string,
  options: UseAIAssistOptions = {}
): UseAIAssistReturn {
  const { onApply } = options;
  
  // 状态
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [needsConfig, setNeedsConfig] = useState(false);
  const [configAction, setConfigAction] = useState('');
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 检查配置
  const checkConfig = useCallback((action?: string): boolean => {
    const config = aiConfigManager.getConfig();
    if (!config.apiKey) {
      setNeedsConfig(true);
      setConfigAction(action || '');
      return false;
    }
    setNeedsConfig(false);
    return true;
  }, []);
  
  // 打开面板
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  // 关闭面板
  const close = useCallback(() => {
    setIsOpen(false);
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  
  // 执行 AI 操作
  const execute = useCallback(async (action: AIAction, selection?: string) => {
    if (!checkConfig(action)) return;
    
    setResult('');
    setCurrentAction(action);
    setIsLoading(true);
    setIsOpen(true);
    
    const config = aiConfigManager.getConfig();
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          content,
          selection: selection || '',
          config: config.apiKey ? {
            provider: config.provider,
            apiKey: config.apiKey,
            apiEndpoint: config.apiEndpoint,
            model: config.model,
          } : undefined,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error('AI 服务请求失败');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  setResult(prev => prev + parsed.content);
                }
                if (parsed.error) {
                  toast.error(parsed.error);
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('AI assist error:', error);
      toast.error('AI 服务暂时不可用');
    } finally {
      setIsLoading(false);
    }
  }, [content, checkConfig]);
  
  // 应用结果
  const apply = useCallback(() => {
    if (!result || !currentAction) return;
    
    if (onApply) {
      onApply(result, currentAction);
    }
    
    close();
    setResult('');
    toast.success('已应用 AI 生成内容');
  }, [result, currentAction, onApply, close]);
  
  // 拒绝结果
  const reject = useCallback(() => {
    close();
    setResult('');
  }, [close]);
  
  // 清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return {
    result,
    isLoading,
    currentAction,
    isOpen,
    needsConfig,
    configAction,
    execute,
    apply,
    reject,
    open,
    close,
    checkConfig,
  };
}
