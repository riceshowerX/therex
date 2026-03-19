/**
 * AI 模型扩展支持
 * 支持 Claude、Gemini、文心一言、通义千问等
 */

import type { AIProvider, AIConfig } from './ai-config';

// 扩展的 AI 提供商类型
export type ExtendedAIProvider = AIProvider 
  | 'claude'
  | 'gemini'
  | 'wenxin'
  | 'qwen'
  | 'zhipu'
  | 'minimax'
  | 'baichuan';

// 提供商预设配置（扩展版）
export const extendedProviderPresets: Record<ExtendedAIProvider, {
  name: string;
  endpoint: string;
  models: string[];
  defaultModel: string;
  features: string[];
  contextWindow: number;
  pricing: { input: number; output: number }; // 每百万 token 价格（美元）
}> = {
  // 原有提供商
  doubao: {
    name: '豆包',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      'doubao-seed-1-6-flash-250615',
      'doubao-seed-1-6-pro-250615',
      'doubao-1-5-pro-32k-240115',
      'doubao-1-5-pro-256k-240115',
    ],
    defaultModel: 'doubao-seed-1-6-flash-250615',
    features: ['chat', 'streaming', 'function-calling'],
    contextWindow: 256000,
    pricing: { input: 0.3, output: 0.6 },
  },
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1',
    models: [
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-reasoner',
    ],
    defaultModel: 'deepseek-chat',
    features: ['chat', 'streaming', 'function-calling', 'reasoning'],
    contextWindow: 128000,
    pricing: { input: 0.14, output: 0.28 },
  },
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
    ],
    defaultModel: 'gpt-4o-mini',
    features: ['chat', 'streaming', 'function-calling', 'vision'],
    contextWindow: 128000,
    pricing: { input: 2.5, output: 10 },
  },
  kimi: {
    name: 'Kimi (月之暗面)',
    endpoint: 'https://api.moonshot.cn/v1',
    models: [
      'moonshot-v1-8k',
      'moonshot-v1-32k',
      'moonshot-v1-128k',
    ],
    defaultModel: 'moonshot-v1-8k',
    features: ['chat', 'streaming', 'long-context'],
    contextWindow: 128000,
    pricing: { input: 0.5, output: 0.5 },
  },
  
  // 新增提供商
  claude: {
    name: 'Claude (Anthropic)',
    endpoint: 'https://api.anthropic.com/v1',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    features: ['chat', 'streaming', 'function-calling', 'vision', 'artifacts'],
    contextWindow: 200000,
    pricing: { input: 3, output: 15 },
  },
  gemini: {
    name: 'Gemini (Google)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
    ],
    defaultModel: 'gemini-2.0-flash',
    features: ['chat', 'streaming', 'function-calling', 'vision', 'long-context'],
    contextWindow: 1000000,
    pricing: { input: 0.075, output: 0.3 },
  },
  wenxin: {
    name: '文心一言 (百度)',
    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    models: [
      'ernie-4.0-8k',
      'ernie-4.0-turbo-8k',
      'ernie-3.5-8k',
      'ernie-speed-8k',
    ],
    defaultModel: 'ernie-4.0-turbo-8k',
    features: ['chat', 'streaming', 'function-calling'],
    contextWindow: 8000,
    pricing: { input: 0.12, output: 0.12 },
  },
  qwen: {
    name: '通义千问 (阿里)',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1',
    models: [
      'qwen-turbo',
      'qwen-plus',
      'qwen-max',
      'qwen-max-longcontext',
      'qwen-vl-max',
    ],
    defaultModel: 'qwen-plus',
    features: ['chat', 'streaming', 'function-calling', 'vision', 'long-context'],
    contextWindow: 32000,
    pricing: { input: 0.4, output: 0.4 },
  },
  zhipu: {
    name: '智谱 AI',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      'glm-4-plus',
      'glm-4-0520',
      'glm-4-air',
      'glm-4-airx',
      'glm-4v',
    ],
    defaultModel: 'glm-4-plus',
    features: ['chat', 'streaming', 'function-calling', 'vision'],
    contextWindow: 128000,
    pricing: { input: 0.5, output: 0.5 },
  },
  minimax: {
    name: 'MiniMax',
    endpoint: 'https://api.minimax.chat/v1',
    models: [
      'abab6.5s-chat',
      'abab6.5g-chat',
      'abab6.5t-chat',
      'abab5.5-chat',
    ],
    defaultModel: 'abab6.5s-chat',
    features: ['chat', 'streaming', 'function-calling', 'voice'],
    contextWindow: 245000,
    pricing: { input: 0.1, output: 0.1 },
  },
  baichuan: {
    name: '百川智能',
    endpoint: 'https://api.baichuan-ai.com/v1',
    models: [
      'Baichuan4',
      'Baichuan3-Turbo',
      'Baichuan3-Turbo-128k',
      'Baichuan2-Turbo',
    ],
    defaultModel: 'Baichuan4',
    features: ['chat', 'streaming', 'function-calling'],
    contextWindow: 128000,
    pricing: { input: 0.1, output: 0.1 },
  },
  custom: {
    name: '自定义',
    endpoint: '',
    models: [],
    defaultModel: '',
    features: [],
    contextWindow: 4096,
    pricing: { input: 0, output: 0 },
  },
};

// 模型能力比较
export const modelCapabilities = {
  // 编程能力排名
  coding: [
    { model: 'claude-3-5-sonnet', score: 95 },
    { model: 'gpt-4o', score: 92 },
    { model: 'deepseek-coder', score: 90 },
    { model: 'gemini-1.5-pro', score: 88 },
    { model: 'qwen-max', score: 85 },
  ],
  
  // 写作能力排名
  writing: [
    { model: 'claude-3-5-sonnet', score: 94 },
    { model: 'gpt-4o', score: 91 },
    { model: 'doubao-seed-1-6-pro', score: 88 },
    { model: 'gemini-1.5-pro', score: 87 },
    { model: 'wenxin-ernie-4.0', score: 85 },
  ],
  
  // 推理能力排名
  reasoning: [
    { model: 'deepseek-reasoner', score: 95 },
    { model: 'claude-3-opus', score: 92 },
    { model: 'gpt-4o', score: 90 },
    { model: 'gemini-1.5-pro', score: 88 },
    { model: 'qwen-max', score: 86 },
  ],
  
  // 长文本处理
  longContext: [
    { model: 'gemini-1.5-pro', context: 1000000 },
    { model: 'claude-3-5-sonnet', context: 200000 },
    { model: 'doubao-1-5-pro-256k', context: 256000 },
    { model: 'kimi-moonshot-128k', context: 128000 },
    { model: 'gpt-4o', context: 128000 },
  ],
};

// 成本计算器
export function calculateCost(
  provider: ExtendedAIProvider,
  inputTokens: number,
  outputTokens: number
): number {
  const preset = extendedProviderPresets[provider];
  if (!preset) return 0;
  
  const inputCost = (inputTokens / 1000000) * preset.pricing.input;
  const outputCost = (outputTokens / 1000000) * preset.pricing.output;
  
  return inputCost + outputCost;
}

// 模型选择建议
export function getModelRecommendation(
  task: 'coding' | 'writing' | 'reasoning' | 'long-context' | 'general',
  budget?: 'low' | 'medium' | 'high'
): ExtendedAIProvider {
  switch (task) {
    case 'coding':
      return budget === 'low' ? 'deepseek' : 'claude';
    case 'writing':
      return budget === 'low' ? 'doubao' : 'claude';
    case 'reasoning':
      return budget === 'low' ? 'deepseek' : 'claude';
    case 'long-context':
      return 'gemini';
    default:
      return budget === 'low' ? 'doubao' : 'claude';
  }
}

// API 请求适配器
export interface AIRequestAdapter {
  buildRequest(config: AIConfig, prompt: string, systemPrompt?: string): unknown;
  parseResponse(response: unknown): string;
  buildStreamRequest(config: AIConfig, prompt: string, systemPrompt?: string): unknown;
  parseStreamChunk(chunk: string): string | null;
}

// OpenAI 兼容格式适配器
export const openAICompatibleAdapter: AIRequestAdapter = {
  buildRequest(config, prompt, systemPrompt) {
    const messages: Array<{ role: string; content: string }> = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return {
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false,
    };
  },

  parseResponse(response) {
    const data = response as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
  },

  buildStreamRequest(config, prompt, systemPrompt) {
    const request = this.buildRequest(config, prompt, systemPrompt) as Record<string, unknown>;
    return {
      ...request,
      stream: true,
    };
  },

  parseStreamChunk(chunk) {
    const lines = chunk.split('\n').filter(line => line.trim() !== '');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return null;
        try {
          const parsed = JSON.parse(data);
          return parsed.choices?.[0]?.delta?.content || null;
        } catch {
          return null;
        }
      }
    }
    return null;
  },
};

// Claude 适配器
export const claudeAdapter: AIRequestAdapter = {
  buildRequest(config, prompt, systemPrompt) {
    return {
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    };
  },

  parseResponse(response) {
    const data = response as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text || '';
  },

  buildStreamRequest(config, prompt, systemPrompt) {
    const request = this.buildRequest(config, prompt, systemPrompt) as Record<string, unknown>;
    return {
      ...request,
      stream: true,
    };
  },

  parseStreamChunk(chunk) {
    const lines = chunk.split('\n').filter(line => line.trim() !== '');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta') {
            return data.delta?.text || null;
          }
        } catch {
          return null;
        }
      }
    }
    return null;
  },
};

// 获取适配器
export function getAdapter(provider: ExtendedAIProvider): AIRequestAdapter {
  if (provider === 'claude') {
    return claudeAdapter;
  }
  return openAICompatibleAdapter;
}
