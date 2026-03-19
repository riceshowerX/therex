/**
 * AI 使用统计追踪器
 * 记录 Token 使用量、成本和请求历史
 */

export interface AIUsageRecord {
  id: string;
  timestamp: number;
  provider: string;
  model: string;
  action: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  documentId?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AIUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { requests: number; tokens: number; cost: number }>;
  byModel: Record<string, { requests: number; tokens: number; cost: number }>;
  byAction: Record<string, { requests: number; tokens: number; cost: number }>;
  dailyUsage: Array<{ date: string; requests: number; tokens: number; cost: number }>;
}

// 模型定价（每 1K tokens）
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  
  // Claude
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  
  // DeepSeek
  'deepseek-chat': { input: 0.0001, output: 0.0002 },
  'deepseek-coder': { input: 0.0001, output: 0.0002 },
  
  // Kimi
  'moonshot-v1-8k': { input: 0.012, output: 0.012 },
  'moonshot-v1-32k': { input: 0.024, output: 0.024 },
  'moonshot-v1-128k': { input: 0.06, output: 0.06 },
  
  // 豆包
  'doubao-pro-32k': { input: 0.0008, output: 0.002 },
  'doubao-lite-32k': { input: 0.0003, output: 0.0006 },
  
  // 默认
  'default': { input: 0.001, output: 0.002 },
};

const STORAGE_KEY = 'ai-usage-records';
const MAX_RECORDS = 1000; // 最多保存1000条记录

class AIUsageTracker {
  private records: AIUsageRecord[] = [];
  
  constructor() {
    this.loadRecords();
  }
  
  private loadRecords(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.records = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load AI usage records:', error);
      this.records = [];
    }
  }
  
  private saveRecords(): void {
    if (typeof window === 'undefined') return;
    try {
      // 只保留最近的记录
      if (this.records.length > MAX_RECORDS) {
        this.records = this.records.slice(-MAX_RECORDS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (error) {
      console.error('Failed to save AI usage records:', error);
    }
  }
  
  /**
   * 估算 token 数量
   * 简单估算：英文约 4 字符 = 1 token，中文约 1.5 字符 = 1 token
   */
  estimateTokens(text: string): number {
    if (!text) return 0;
    
    // 统计中文字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 统计英文和其他字符
    const otherChars = text.length - chineseChars;
    
    // 中文约 1.5 字符 = 1 token
    const chineseTokens = Math.ceil(chineseChars / 1.5);
    // 英文约 4 字符 = 1 token
    const otherTokens = Math.ceil(otherChars / 4);
    
    return chineseTokens + otherTokens;
  }
  
  /**
   * 计算成本
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    return Number((inputCost + outputCost).toFixed(6));
  }
  
  /**
   * 记录一次 AI 请求
   */
  recordUsage(params: {
    provider: string;
    model: string;
    action: string;
    inputText: string;
    outputText: string;
    documentId?: string;
    success: boolean;
    errorMessage?: string;
  }): AIUsageRecord {
    const inputTokens = this.estimateTokens(params.inputText);
    const outputTokens = this.estimateTokens(params.outputText);
    const totalTokens = inputTokens + outputTokens;
    const cost = this.calculateCost(params.model, inputTokens, outputTokens);
    
    const record: AIUsageRecord = {
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      provider: params.provider,
      model: params.model,
      action: params.action,
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      documentId: params.documentId,
      success: params.success,
      errorMessage: params.errorMessage,
    };
    
    this.records.push(record);
    this.saveRecords();
    
    return record;
  }
  
  /**
   * 获取统计数据
   */
  getStats(startDate?: number, endDate?: number): AIUsageStats {
    let filteredRecords = this.records;
    
    if (startDate) {
      filteredRecords = filteredRecords.filter(r => r.timestamp >= startDate);
    }
    if (endDate) {
      filteredRecords = filteredRecords.filter(r => r.timestamp <= endDate);
    }
    
    const stats: AIUsageStats = {
      totalRequests: filteredRecords.length,
      successfulRequests: filteredRecords.filter(r => r.success).length,
      failedRequests: filteredRecords.filter(r => !r.success).length,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {},
      byModel: {},
      byAction: {},
      dailyUsage: [],
    };
    
    // 按日期统计
    const dailyMap = new Map<string, { requests: number; tokens: number; cost: number }>();
    
    for (const record of filteredRecords) {
      stats.totalInputTokens += record.inputTokens;
      stats.totalOutputTokens += record.outputTokens;
      stats.totalTokens += record.totalTokens;
      stats.totalCost += record.cost;
      
      // 按 provider 统计
      if (!stats.byProvider[record.provider]) {
        stats.byProvider[record.provider] = { requests: 0, tokens: 0, cost: 0 };
      }
      stats.byProvider[record.provider].requests++;
      stats.byProvider[record.provider].tokens += record.totalTokens;
      stats.byProvider[record.provider].cost += record.cost;
      
      // 按 model 统计
      if (!stats.byModel[record.model]) {
        stats.byModel[record.model] = { requests: 0, tokens: 0, cost: 0 };
      }
      stats.byModel[record.model].requests++;
      stats.byModel[record.model].tokens += record.totalTokens;
      stats.byModel[record.model].cost += record.cost;
      
      // 按 action 统计
      if (!stats.byAction[record.action]) {
        stats.byAction[record.action] = { requests: 0, tokens: 0, cost: 0 };
      }
      stats.byAction[record.action].requests++;
      stats.byAction[record.action].tokens += record.totalTokens;
      stats.byAction[record.action].cost += record.cost;
      
      // 按日期统计
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      const daily = dailyMap.get(date) || { requests: 0, tokens: 0, cost: 0 };
      daily.requests++;
      daily.tokens += record.totalTokens;
      daily.cost += record.cost;
      dailyMap.set(date, daily);
    }
    
    // 转换 dailyUsage
    stats.dailyUsage = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return stats;
  }
  
  /**
   * 获取最近的记录
   */
  getRecentRecords(limit: number = 50): AIUsageRecord[] {
    return this.records.slice(-limit).reverse();
  }
  
  /**
   * 清除所有记录
   */
  clearRecords(): void {
    this.records = [];
    this.saveRecords();
  }
  
  /**
   * 导出记录为 JSON
   */
  exportRecords(): string {
    return JSON.stringify(this.records, null, 2);
  }
  
  /**
   * 导入记录
   */
  importRecords(json: string): boolean {
    try {
      const records = JSON.parse(json);
      if (Array.isArray(records)) {
        this.records = records;
        this.saveRecords();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

// 单例导出
export const aiUsageTracker = new AIUsageTracker();
