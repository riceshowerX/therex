/**
 * AI 配置管理模块
 * 支持多种 AI 提供商的自定义配置
 *
 * 安全设计：
 * - API Key 仅存储在后端数据库中，前端不持有明文 Key
 * - 前端仅存储非敏感配置（provider、model、temperature 等）
 * - AI 请求统一通过后端 API 代理，避免 Key 暴露给客户端
 */

import type { AIProvider, AIConfig } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ai-config');

// 重新导出类型，保持向后兼容
export type { AIProvider, AIConfig };

// 提供商预设配置
export const providerPresets: Record<AIProvider, {
  name: string;
  endpoint: string;
  models: string[];
  defaultModel: string;
  features?: string[];
  contextWindow?: number;
  pricing?: { input: number; output: number };
}> = {
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
      'glm-4-flash',
    ],
    defaultModel: 'glm-4-flash',
    features: ['chat', 'streaming', 'function-calling'],
    contextWindow: 128000,
    pricing: { input: 0.1, output: 0.1 },
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
    features: ['chat', 'streaming', 'function-calling'],
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
  },
};

// 默认系统提示词
export const defaultSystemPrompts: Record<string, string> = {
  continue: `你是一个专业的写作助手。请根据用户提供的文档内容，自然地续写后续内容。
要求：
- 保持原文的语气、风格和格式
- 内容要自然流畅，与原文紧密衔接
- 如果原文是技术文档，保持专业性
- 如果原文是创意写作，保持创意性
- 只输出续写的内容，不要输出任何解释或说明`,
  
  polish: `你是一个专业的文字编辑。请帮助用户润色选中的文本，使其更加通顺、专业、有表现力。
要求：
- 保持原文的核心意思不变
- 改善语言表达，使其更加流畅
- 修正语法错误和不通顺的表达
- 只输出润色后的内容，不要输出任何解释或说明`,
  
  expand: `你是一个专业的内容创作助手。请帮助用户扩展选中的文本，添加更多细节和内容。
要求：
- 保持原文的核心意思和风格
- 添加相关的细节、例子或解释
- 使内容更加丰富和完整
- 只输出扩展后的内容，不要输出任何解释或说明`,
  
  summarize: `你是一个专业的文档摘要助手。请帮助用户总结文档的主要内容。
要求：
- 提取核心要点
- 保持简洁明了
- 使用列表形式展示
- 只输出摘要内容`,
  
  translate: `你是一个专业的翻译助手。请将用户选中的文本翻译成目标语言。
目标语言：中文（如果是中文则翻译成英文）
要求：
- 保持原文的意思和语气
- 使用自然流畅的表达
- 只输出翻译结果`,
  
  fix: `你是一个专业的文字校对助手。请帮助用户修正选中文本中的错误。
要求：
- 修正语法错误、拼写错误、标点错误
- 保持原文意思不变
- 只输出修正后的内容`,
  
  outline: `你是一个专业的写作规划助手。请根据用户提供的主题或内容，生成一个详细的写作大纲。
要求：
- 结构清晰，层次分明
- 每个要点简洁明确
- 适合作为写作参考
- 只输出大纲内容`,
  
  title: `你是一个专业的标题创作助手。请根据文档内容，生成几个合适的标题建议。
要求：
- 标题要吸引人且准确概括内容
- 提供3-5个不同风格的标题选项
- 每个标题一行
- 只输出标题，不要编号`,
  
  explain: `你是一个专业的技术讲解助手。请用简单易懂的语言解释选中的内容。
要求：
- 使用通俗易懂的语言
- 必要时举例说明
- 只输出解释内容`,
  
  rewrite: `你是一个专业的写作助手。请帮助用户改写选中的文本，使其表达方式不同但意思相同。
要求：
- 完全重写，使用不同的表达方式
- 保持原文核心意思不变
- 可以调整句子结构
- 只输出改写后的内容`,
};

// 默认配置
export const defaultAIConfig: AIConfig = {
  provider: 'doubao',
  apiKey: '',
  apiEndpoint: providerPresets.doubao.endpoint,
  model: providerPresets.doubao.defaultModel,
  temperature: 0.7,
  maxTokens: 2048,
  enableSystemPrompt: true,
  systemPrompt: '你是一个专业的写作助手。',
};

// 存储键名
const STORAGE_KEY = 'markdown-editor-ai-config';

// AI 配置管理类
export class AIConfigManager {
  private config: AIConfig;
  private static instance: AIConfigManager;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): AIConfigManager {
    if (!AIConfigManager.instance) {
      AIConfigManager.instance = new AIConfigManager();
    }
    return AIConfigManager.instance;
  }

  // 加载配置（不包含 apiKey，apiKey 由后端管理）
  private loadConfig(): AIConfig {
    if (typeof window === 'undefined') {
      return { ...defaultAIConfig, apiKey: '' };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 确保 apiKey 不从 localStorage 恢复
        const { apiKey: _storedKey, ...safeParsed } = parsed;
        return { ...defaultAIConfig, ...safeParsed, apiKey: '' };
      }
    } catch (error) {
      logger.error('Failed to load AI config', error instanceof Error ? error : undefined);
    }

    return { ...defaultAIConfig, apiKey: '' };
  }

  // 保存配置（apiKey 不存入 localStorage，仅通过后端 API 管理）
  saveConfig(config: Partial<AIConfig>): void {
    // 分离敏感与非敏感配置
    const { apiKey: _apiKey, ...safeConfig } = config as AIConfig & { apiKey?: string };
    this.config = { ...this.config, ...safeConfig };

    // 如果传入了 apiKey，通过后端 API 保存
    if (config.apiKey !== undefined) {
      this.saveApiKeyToBackend(config.apiKey);
    }

    this.persistConfig();
  }

  /**
   * 异步保存配置（等待后端保存完成；失败时抛出/返回，供设置页判断）
   */
  async saveConfigAsync(config: Partial<AIConfig>): Promise<void> {
    this.saveConfig(config);
    if (config.apiKey !== undefined) {
      await this.saveApiKeyToBackend(config.apiKey);
    }
  }

  /**
   * 将非敏感配置持久化到 localStorage（apiKey 不落盘）
   */
  private persistConfig(): void {
    if (typeof window === 'undefined') return;
    try {
      const { apiKey: _storedKey, ...configToStore } = this.config;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToStore));
    } catch (error) {
      logger.error('Failed to save AI config', error instanceof Error ? error : undefined);
    }
  }

  /**
   * 向后端发起请求所需的认证头。
   * - Supabase JWT 模式：由外部登录态注入 access token（此处未接入登录，后续接入时走 Authorization 头）
   * - 本机/内网共享密钥模式：发送专用请求头 x-ai-config-key，值来自 NEXT_PUBLIC_AI_CONFIG_ADMIN_KEY
   *   （与后端服务端 env AI_CONFIG_ADMIN_KEY 保持一致；注意该值会暴露给浏览器，仅限单用户/内网部署）
   */
  private authHeaders(): Record<string, string> {
    const sharedKey = process.env.NEXT_PUBLIC_AI_CONFIG_ADMIN_KEY;
    if (sharedKey) {
      return { 'x-ai-config-key': sharedKey };
    }
    return {};
  }

  /**
   * 确保后端存在 AI 配置记录，返回其 id；不存在则创建。
   */
  private async ensureConfigSaved(): Promise<string | null> {
    try {
      if (this.config.id) return this.config.id;

      const response = await fetch('/api/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
        body: JSON.stringify({
          provider: this.config.provider,
          api_endpoint: this.config.apiEndpoint,
          model: this.config.model,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          enable_system_prompt: this.config.enableSystemPrompt,
          system_prompt: this.config.systemPrompt,
          is_default: this.config.isDefault ?? false,
        }),
      });

      if (!response.ok) {
        logger.error(`Failed to create AI config in backend: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const id = data?.data?.id as string | undefined;
      if (id) {
        this.config = { ...this.config, id };
        this.persistConfig();
      }
      return id ?? null;
    } catch (error) {
      logger.error('Failed to ensure AI config saved', error instanceof Error ? error : undefined);
      return null;
    }
  }

  /**
   * 获取后端 AI 配置 id（用于 /api/ai-assist 的 configId 契约，P1-1）。
   * 优先使用本地已缓存 id；否则从 GET /api/ai-config 取第一条。
   */
  async getConfigId(): Promise<string | null> {
    if (this.config.id) return this.config.id;

    try {
      const response = await fetch('/api/ai-config', { headers: this.authHeaders() });
      if (!response.ok) return null;
      const data = await response.json();
      const configs = Array.isArray(data?.data) ? data.data : [];
      const first = configs[0] as { id?: string } | undefined;
      if (first?.id) {
        this.config = { ...this.config, id: first.id };
        this.persistConfig();
        return first.id;
      }
    } catch (error) {
      logger.error('Failed to fetch AI config id', error instanceof Error ? error : undefined);
    }
    return null;
  }

  // 通过后端 API 保存 API Key
  private async saveApiKeyToBackend(apiKey: string): Promise<void> {
    try {
      const id = await this.ensureConfigSaved();
      if (!id) {
        logger.error('Failed to save API key to backend: no config id');
        return;
      }
      const response = await fetch('/api/ai-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
        body: JSON.stringify({
          id,
          api_key: apiKey,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          system_prompt: this.config.systemPrompt,
        }),
      });
      if (!response.ok) {
        logger.error(`Failed to save API key to backend: ${response.status}`);
      }
    } catch (error) {
      logger.error('Failed to save API key to backend', error instanceof Error ? error : undefined);
    }
  }

  // 获取配置（不包含 apiKey）
  getConfig(): AIConfig {
    return { ...this.config, apiKey: '' };
  }

  // 重置为默认配置
  resetConfig(): void {
    this.config = defaultAIConfig;

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        logger.error('Failed to reset AI config', error instanceof Error ? error : undefined);
      }
    }
  }

  // 检查配置是否有效（apiKey 由后端管理，此处仅检查 provider 和 model）
  isConfigValid(): boolean {
    if (this.config.provider === 'custom') {
      return !!(this.config.apiEndpoint && this.config.model);
    }
    return !!this.config.provider;
  }

  // 通过后端检查 API Key 是否已配置
  async isApiKeyConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/ai-config', { headers: this.authHeaders() });
      if (response.ok) {
        const data = await response.json();
        const configs = Array.isArray(data?.data) ? data.data : [];
        // GET 接口不返回 api_key 明文，仅返回 api_key_set 布尔
        return configs.some((c: { api_key_set?: boolean }) => !!c.api_key_set);
      }
    } catch {
      // 后端不可用时回退到检查本地标志
    }
    return false;
  }

  // 更新提供商
  setProvider(provider: AIProvider): void {
    const preset = providerPresets[provider];
    this.saveConfig({
      provider,
      apiEndpoint: preset.endpoint,
      model: preset.defaultModel,
    });
  }
}

// 导出单例实例
export const aiConfigManager = AIConfigManager.getInstance();
