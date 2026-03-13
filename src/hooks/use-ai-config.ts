/**
 * AI 配置管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface AIConfig {
  id: string;
  provider: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enableSystemPrompt: boolean;
  systemPrompt: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useAIConfig() {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载 AI 配置列表
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-config');
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setConfigs(result.data || []);
    } catch (err) {
      setError('加载 AI 配置失败');
      console.error('加载 AI 配置失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建 AI 配置
  const createConfig = useCallback(async (config: Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setConfigs((prev) => [result.data, ...prev]);
      toast.success('AI 配置创建成功');
      return result.data;
    } catch (err) {
      setError('创建 AI 配置失败');
      toast.error('创建 AI 配置失败');
      console.error('创建 AI 配置失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新 AI 配置
  const updateConfig = useCallback(async (id: string, updates: Partial<AIConfig>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setConfigs((prev) =>
        prev.map((config) => (config.id === result.data.id ? result.data : config))
      );
      toast.success('AI 配置更新成功');
      return result.data;
    } catch (err) {
      setError('更新 AI 配置失败');
      toast.error('更新 AI 配置失败');
      console.error('更新 AI 配置失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除 AI 配置
  const removeConfig = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai-config?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setConfigs((prev) => prev.filter((config) => config.id !== id));
      toast.success('AI 配置删除成功');
    } catch (err) {
      setError('删除 AI 配置失败');
      toast.error('删除 AI 配置失败');
      console.error('删除 AI 配置失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取默认配置
  const getDefaultConfig = useCallback((): AIConfig | null => {
    return configs.find((config) => config.isDefault) || configs[0] || null;
  }, [configs]);

  // 测试连接
  const testConnection = useCallback(async (config: {
    apiKey: string;
    apiEndpoint: string;
    model: string;
  }) => {
    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          config,
        }),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
        return false;
      }

      toast.success(result.message);
      return true;
    } catch (err) {
      toast.error('连接测试失败');
      console.error('连接测试失败:', err);
      return false;
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  return {
    configs,
    loading,
    error,
    loadConfigs,
    createConfig,
    updateConfig,
    removeConfig,
    getDefaultConfig,
    testConnection,
  };
}
