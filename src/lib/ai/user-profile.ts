/**
 * AI 个性化学习系统
 * 学习用户写作习惯，提供个性化建议
 */

// 用户写作习惯数据结构
export interface WritingProfile {
  // 偏好风格
  preferredStyle: 'professional' | 'casual' | 'academic' | 'creative';
  
  // 常用词汇
  frequentWords: Map<string, number>;
  
  // 句子平均长度偏好
  averageSentenceLength: number;
  
  // 段落平均长度偏好
  averageParagraphLength: number;
  
  // 标点使用习惯
  punctuationUsage: {
    periods: number;
    commas: number;
    exclamation: number;
    question: number;
    semicolons: number;
    colons: number;
  };
  
  // 常用表达模式
  commonPatterns: string[];
  
  // 写作主题偏好
  topicPreferences: Map<string, number>;
  
  // 语言偏好
  languagePreference: string;
  
  // 使用时间统计
  usageStats: {
    totalDocuments: number;
    totalWords: number;
    totalSessions: number;
    averageSessionDuration: number;
  };
  
  // 最近使用的功能
  recentFeatures: Array<{
    feature: string;
    timestamp: number;
  }>;
  
  // 最后更新时间
  lastUpdated: number;
}

// 默认用户画像
const defaultProfile: WritingProfile = {
  preferredStyle: 'professional',
  frequentWords: new Map(),
  averageSentenceLength: 15,
  averageParagraphLength: 100,
  punctuationUsage: {
    periods: 0,
    commas: 0,
    exclamation: 0,
    question: 0,
    semicolons: 0,
    colons: 0,
  },
  commonPatterns: [],
  topicPreferences: new Map(),
  languagePreference: '中文',
  usageStats: {
    totalDocuments: 0,
    totalWords: 0,
    totalSessions: 0,
    averageSessionDuration: 0,
  },
  recentFeatures: [],
  lastUpdated: Date.now(),
};

// 存储键
const STORAGE_KEY = 'therex_writing_profile';

/**
 * 用户画像管理类
 */
export class UserProfileManager {
  private profile: WritingProfile;
  private static instance: UserProfileManager;

  private constructor() {
    this.profile = this.loadProfile();
  }

  static getInstance(): UserProfileManager {
    if (!UserProfileManager.instance) {
      UserProfileManager.instance = new UserProfileManager();
    }
    return UserProfileManager.instance;
  }

  // 加载用户画像
  private loadProfile(): WritingProfile {
    if (typeof window === 'undefined') {
      return { ...defaultProfile };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 转换 Map 对象
        parsed.frequentWords = new Map(Object.entries(parsed.frequentWords || {}));
        parsed.topicPreferences = new Map(Object.entries(parsed.topicPreferences || {}));
        return { ...defaultProfile, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }

    return { ...defaultProfile };
  }

  // 保存用户画像
  private saveProfile(): void {
    if (typeof window === 'undefined') return;

    try {
      const toStore = {
        ...this.profile,
        frequentWords: Object.fromEntries(this.profile.frequentWords),
        topicPreferences: Object.fromEntries(this.profile.topicPreferences),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }

  // 获取用户画像
  getProfile(): WritingProfile {
    return this.profile;
  }

  // 分析并更新用户写作习惯
  analyzeText(text: string): void {
    if (!text.trim()) return;

    // 分词（简单实现，实际可使用更复杂的分词算法）
    const words = text.split(/[\s\n]+/).filter(w => w.length > 0);
    
    // 更新常用词汇
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '');
      if (cleanWord.length > 1) {
        const count = this.profile.frequentWords.get(cleanWord) || 0;
        this.profile.frequentWords.set(cleanWord, count + 1);
      }
    });

    // 计算句子平均长度
    const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const totalLength = sentences.reduce((sum, s) => sum + s.length, 0);
      this.profile.averageSentenceLength = Math.round(totalLength / sentences.length);
    }

    // 计算段落平均长度
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    if (paragraphs.length > 0) {
      const totalLength = paragraphs.reduce((sum, p) => sum + p.length, 0);
      this.profile.averageParagraphLength = Math.round(totalLength / paragraphs.length);
    }

    // 统计标点使用
    const punctCount = (char: string) => (text.match(new RegExp(char, 'g')) || []).length;
    this.profile.punctuationUsage = {
      periods: punctCount('[。.]'),
      commas: punctCount('[，,]'),
      exclamation: punctCount('[！!]'),
      question: punctCount('[？?]'),
      semicolons: punctCount('[；;]'),
      colons: punctCount('[：:]'),
    };

    this.profile.lastUpdated = Date.now();
    this.saveProfile();
  }

  // 记录功能使用
  recordFeatureUsage(feature: string): void {
    this.profile.recentFeatures.push({
      feature,
      timestamp: Date.now(),
    });

    // 只保留最近 50 条记录
    if (this.profile.recentFeatures.length > 50) {
      this.profile.recentFeatures = this.profile.recentFeatures.slice(-50);
    }

    this.saveProfile();
  }

  // 更新使用统计
  updateUsageStats(stats: Partial<WritingProfile['usageStats']>): void {
    this.profile.usageStats = {
      ...this.profile.usageStats,
      ...stats,
    };
    this.saveProfile();
  }

  // 设置偏好风格
  setPreferredStyle(style: WritingProfile['preferredStyle']): void {
    this.profile.preferredStyle = style;
    this.saveProfile();
  }

  // 设置语言偏好
  setLanguagePreference(language: string): void {
    this.profile.languagePreference = language;
    this.saveProfile();
  }

  // 获取个性化建议
  getPersonalizedSuggestions(): {
    style: string;
    suggestions: string[];
    insights: string[];
  } {
    const suggestions: string[] = [];
    const insights: string[] = [];

    // 基于句子长度给出建议
    if (this.profile.averageSentenceLength > 30) {
      suggestions.push('您的句子偏长，建议适当拆分以提高可读性');
    } else if (this.profile.averageSentenceLength < 10) {
      suggestions.push('您的句子较短，可以考虑适当丰富表达');
    }

    // 基于段落长度给出建议
    if (this.profile.averageParagraphLength > 200) {
      suggestions.push('您的段落较长，建议分段以提高阅读体验');
    }

    // 基于标点使用给出洞察
    const { punctuationUsage } = this.profile;
    const totalPunctuation = Object.values(punctuationUsage).reduce((a, b) => a + b, 0);
    
    if (totalPunctuation > 0) {
      if (punctuationUsage.exclamation / totalPunctuation > 0.1) {
        insights.push('您喜欢使用感叹号，表达方式充满热情');
      }
      if (punctuationUsage.question / totalPunctuation > 0.1) {
        insights.push('您经常使用问号，善于引发读者思考');
      }
      if (punctuationUsage.semicolons / totalPunctuation > 0.05) {
        insights.push('您熟练使用分号，写作风格较为正式');
      }
    }

    // 基于常用词给出洞察
    const topWords = Array.from(this.profile.frequentWords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    if (topWords.length > 0) {
      insights.push(`您的高频词汇：${topWords.slice(0, 5).join('、')}`);
    }

    return {
      style: this.profile.preferredStyle,
      suggestions,
      insights,
    };
  }

  // 获取最常用的功能
  getMostUsedFeatures(limit: number = 5): Array<{ feature: string; count: number }> {
    const featureCounts = new Map<string, number>();
    
    this.profile.recentFeatures.forEach(({ feature }) => {
      featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
    });

    return Array.from(featureCounts.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // 重置用户画像
  resetProfile(): void {
    this.profile = { ...defaultProfile };
    this.saveProfile();
  }
}

// 导出单例
export const userProfileManager = UserProfileManager.getInstance();

/**
 * React Hook: 用户画像
 */
export function useUserProfile() {
  const manager = UserProfileManager.getInstance();

  const analyzeText = (text: string) => {
    manager.analyzeText(text);
  };

  const recordFeature = (feature: string) => {
    manager.recordFeatureUsage(feature);
  };

  const getSuggestions = () => {
    return manager.getPersonalizedSuggestions();
  };

  const getMostUsedFeatures = (limit?: number) => {
    return manager.getMostUsedFeatures(limit);
  };

  const setStyle = (style: WritingProfile['preferredStyle']) => {
    manager.setPreferredStyle(style);
  };

  const setLanguage = (language: string) => {
    manager.setLanguagePreference(language);
  };

  return {
    profile: manager.getProfile(),
    analyzeText,
    recordFeature,
    getSuggestions,
    getMostUsedFeatures,
    setStyle,
    setLanguage,
  };
}
