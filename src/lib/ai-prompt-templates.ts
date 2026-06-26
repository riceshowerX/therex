/**
 * AI 提示词模板库
 * 用户可自定义和管理提示词模板
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  systemPrompt: string;
  userPromptTemplate: string; // 使用 {{selection}} {{content}} 等占位符
  variables: PromptVariable[];
  isBuiltIn: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface PromptVariable {
  name: string;
  label: string;
  type: 'text' | 'select' | 'number';
  defaultValue?: string;
  options?: string[]; // for select type
  placeholder?: string;
  required?: boolean;
}

export interface PromptCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const STORAGE_KEY = 'ai-prompt-templates';

// 预设变量
const BUILTIN_VARIABLES = {
  selection: { name: 'selection', label: '选中文本', type: 'text' as const },
  content: { name: 'content', label: '文档内容', type: 'text' as const },
  title: { name: 'title', label: '文档标题', type: 'text' as const },
  language: { name: 'language', label: '目标语言', type: 'select' as const, options: ['英语', '日语', '韩语', '法语', '德语', '西班牙语'], defaultValue: '英语' },
  tone: { name: 'tone', label: '语气风格', type: 'select' as const, options: ['正式', '随意', '幽默', '严肃', '友好'], defaultValue: '正式' },
  length: { name: 'length', label: '输出长度', type: 'select' as const, options: ['简短', '适中', '详细'], defaultValue: '适中' },
};

// 内置模板分类
export const PROMPT_CATEGORIES: PromptCategory[] = [
  { id: 'writing', name: '写作辅助', icon: '✍️', description: '续写、润色、改写等写作相关功能' },
  { id: 'analysis', name: '内容分析', icon: '🔍', description: '摘要、大纲、解释等分析功能' },
  { id: 'translation', name: '翻译转换', icon: '🌐', description: '多语言翻译和格式转换' },
  { id: 'code', name: '代码相关', icon: '💻', description: '代码生成、优化、解释' },
  { id: 'creative', name: '创意生成', icon: '💡', description: '头脑风暴、创意写作' },
  { id: 'academic', name: '学术写作', icon: '📚', description: '论文、报告、研究相关' },
  { id: 'business', name: '商务文档', icon: '📊', description: '邮件、方案、报告等' },
  { id: 'custom', name: '自定义', icon: '⚙️', description: '用户自定义模板' },
];

// 内置模板
const BUILTIN_TEMPLATES: PromptTemplate[] = [
  // 写作辅助
  {
    id: 'builtin-continue',
    name: '续写内容',
    description: '根据当前内容继续写作',
    category: 'writing',
    icon: '✍️',
    systemPrompt: '你是一位专业的写作助手，擅长根据已有内容自然地续写。请保持原有风格和语气，确保内容连贯流畅。',
    userPromptTemplate: '请根据以下内容续写，保持风格一致：\n\n{{content}}\n\n请继续写作：',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-polish',
    name: '润色文本',
    description: '优化文字表达，提升流畅度',
    category: 'writing',
    icon: '✨',
    systemPrompt: '你是一位文字润色专家。请优化文本的表达，使其更加流畅、专业，但不要改变原意。注意保持作者的写作风格。',
    userPromptTemplate: '请润色以下文本，语气风格为{{tone}}：\n\n{{selection}}',
    variables: [BUILTIN_VARIABLES.tone],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-rewrite',
    name: '改写内容',
    description: '用不同的方式重新表达',
    category: 'writing',
    icon: '🔄',
    systemPrompt: '你是一位擅长改写的文字专家。请用不同的表达方式重新组织文本，保持原意但改变表达形式。',
    userPromptTemplate: '请改写以下内容，使用不同的表达方式：\n\n{{selection}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-expand',
    name: '扩展内容',
    description: '丰富和扩展文本内容',
    category: 'writing',
    icon: '📖',
    systemPrompt: '你是一位善于扩展内容的写作专家。请在保持原意的基础上，添加更多细节、例子或说明，使内容更加丰富。',
    userPromptTemplate: '请扩展以下内容，使其更加详细，输出长度{{length}}：\n\n{{selection}}',
    variables: [BUILTIN_VARIABLES.length],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-simplify',
    name: '简化内容',
    description: '精简和简化复杂表达',
    category: 'writing',
    icon: '📝',
    systemPrompt: '你是一位擅长简化的编辑专家。请在保持核心信息的前提下，删除冗余内容，使表达更加简洁明了。',
    userPromptTemplate: '请简化以下内容，保留核心信息：\n\n{{selection}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // 内容分析
  {
    id: 'builtin-summarize',
    name: '生成摘要',
    description: '提取内容的核心要点',
    category: 'analysis',
    icon: '📋',
    systemPrompt: '你是一位专业的摘要撰写专家。请提取文本的核心要点，生成简洁明了的摘要。',
    userPromptTemplate: '请为以下内容生成摘要，输出长度{{length}}：\n\n{{content}}',
    variables: [BUILTIN_VARIABLES.length],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-outline',
    name: '生成大纲',
    description: '创建结构化的大纲框架',
    category: 'analysis',
    icon: '📑',
    systemPrompt: '你是一位结构化思维专家。请分析内容并生成清晰的层次化大纲。',
    userPromptTemplate: '请为以下内容生成结构化大纲：\n\n{{content}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-explain',
    name: '解释内容',
    description: '详细解释复杂概念',
    category: 'analysis',
    icon: '💡',
    systemPrompt: '你是一位善于解释复杂概念的专家。请用通俗易懂的语言解释内容，必要时举例说明。',
    userPromptTemplate: '请详细解释以下内容：\n\n{{selection}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-keywords',
    name: '提取关键词',
    description: '提取文本的关键词和标签',
    category: 'analysis',
    icon: '🏷️',
    systemPrompt: '你是一位关键词提取专家。请分析文本并提取最重要的关键词和标签。',
    userPromptTemplate: '请从以下内容中提取关键词和标签（最多10个）：\n\n{{content}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // 翻译转换
  {
    id: 'builtin-translate',
    name: '翻译文本',
    description: '将文本翻译成目标语言',
    category: 'translation',
    icon: '🌐',
    systemPrompt: '你是一位专业的翻译专家，精通多种语言。请准确翻译文本，保持原文的语气和风格。',
    userPromptTemplate: '请将以下内容翻译成{{language}}，语气风格为{{tone}}：\n\n{{selection}}',
    variables: [BUILTIN_VARIABLES.language, BUILTIN_VARIABLES.tone],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-grammar-check',
    name: '语法检查',
    description: '检查并修正语法错误',
    category: 'translation',
    icon: '✅',
    systemPrompt: '你是一位语法检查专家。请检查文本中的语法、拼写和标点错误，并提供修正建议。',
    userPromptTemplate: '请检查以下文本的语法错误并提供修正版本：\n\n{{selection}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // 代码相关
  {
    id: 'builtin-code-explain',
    name: '解释代码',
    description: '解释代码的功能和逻辑',
    category: 'code',
    icon: '💻',
    systemPrompt: '你是一位编程专家。请详细解释代码的功能、逻辑和关键部分，使用通俗易懂的语言。',
    userPromptTemplate: '请解释以下代码的功能：\n\n{{selection}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-code-optimize',
    name: '优化代码',
    description: '优化代码性能和可读性',
    category: 'code',
    icon: '⚡',
    systemPrompt: '你是一位代码优化专家。请优化代码的性能、可读性和最佳实践，并解释优化点。',
    userPromptTemplate: '请优化以下代码并解释优化点：\n\n{{selection}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-code-comment',
    name: '添加注释',
    description: '为代码添加详细注释',
    category: 'code',
    icon: '📝',
    systemPrompt: '你是一位代码注释专家。请为代码添加清晰的注释，解释关键逻辑和功能。',
    userPromptTemplate: '请为以下代码添加详细注释：\n\n{{selection}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // 创意生成
  {
    id: 'builtin-brainstorm',
    name: '头脑风暴',
    description: '生成创意想法和灵感',
    category: 'creative',
    icon: '💡',
    systemPrompt: '你是一位创意专家。请基于给定主题，生成多个创新想法和解决方案。',
    userPromptTemplate: '请针对以下主题进行头脑风暴，生成至少5个创意想法：\n\n{{selection}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-title',
    name: '生成标题',
    description: '生成吸引人的标题建议',
    category: 'creative',
    icon: '📌',
    systemPrompt: '你是一位标题创作专家。请为内容生成多个吸引人的标题建议。',
    userPromptTemplate: '请为以下内容生成5个吸引人的标题建议：\n\n{{content}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // 学术写作
  {
    id: 'builtin-abstract',
    name: '生成摘要',
    description: '生成学术论文摘要',
    category: 'academic',
    icon: '📄',
    systemPrompt: '你是一位学术写作专家。请按照学术论文摘要的格式，撰写结构化的摘要。',
    userPromptTemplate: '请为以下内容生成学术摘要（包含目的、方法、结果、结论）：\n\n{{content}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-literature',
    name: '文献综述',
    description: '生成文献综述框架',
    category: 'academic',
    icon: '📚',
    systemPrompt: '你是一位学术研究专家。请帮助生成文献综述的框架和关键点。',
    userPromptTemplate: '请为以下主题生成文献综述框架：\n\n{{selection}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // 商务文档
  {
    id: 'builtin-email',
    name: '撰写邮件',
    description: '生成专业的商务邮件',
    category: 'business',
    icon: '📧',
    systemPrompt: '你是一位商务邮件撰写专家。请根据内容生成专业、得体的商务邮件。',
    userPromptTemplate: '请根据以下内容撰写一封{{tone}}的商务邮件：\n\n{{selection}}',
    variables: [BUILTIN_VARIABLES.tone],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'builtin-report',
    name: '生成报告',
    description: '生成工作报告或分析报告',
    category: 'business',
    icon: '📊',
    systemPrompt: '你是一位报告撰写专家。请生成结构清晰、内容详实的专业报告。',
    userPromptTemplate: '请根据以下内容生成一份结构化的报告：\n\n{{content}}',
    variables: [],
    isBuiltIn: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

class PromptTemplateManager {
  private templates: PromptTemplate[] = [];
  
  constructor() {
    this.loadTemplates();
  }
  
  private loadTemplates(): void {
    if (typeof window === 'undefined') {
      this.templates = [...BUILTIN_TEMPLATES];
      return;
    }
    
    try {
      // 加载内置模板
      this.templates = [...BUILTIN_TEMPLATES];
      
      // 加载用户自定义模板
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const customTemplates = JSON.parse(stored) as PromptTemplate[];
        this.templates.push(...customTemplates);
      }
    } catch (error) {
      console.error('Failed to load prompt templates:', error);
      this.templates = [...BUILTIN_TEMPLATES];
    }
  }
  
  private saveCustomTemplates(): void {
    if (typeof window === 'undefined') return;
    try {
      const customTemplates = this.templates.filter(t => !t.isBuiltIn);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates));
    } catch (error) {
      console.error('Failed to save prompt templates:', error);
    }
  }
  
  /**
   * 获取所有模板
   */
  getAllTemplates(): PromptTemplate[] {
    return [...this.templates].sort((a, b) => {
      // 置顶优先
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      // 按使用次数排序
      return b.usageCount - a.usageCount;
    });
  }
  
  /**
   * 按分类获取模板
   */
  getTemplatesByCategory(category: string): PromptTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }
  
  /**
   * 获取单个模板
   */
  getTemplate(id: string): PromptTemplate | null {
    return this.templates.find(t => t.id === id) || null;
  }
  
  /**
   * 创建自定义模板
   */
  createTemplate(template: Omit<PromptTemplate, 'id' | 'isBuiltIn' | 'isFavorite' | 'usageCount' | 'createdAt' | 'updatedAt'>): PromptTemplate {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      isBuiltIn: false,
      isFavorite: false,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.templates.push(newTemplate);
    this.saveCustomTemplates();
    return newTemplate;
  }
  
  /**
   * 更新模板
   */
  updateTemplate(id: string, updates: Partial<PromptTemplate>): PromptTemplate | null {
    const template = this.templates.find(t => t.id === id);
    if (!template) return null;
    if (template.isBuiltIn && (updates.systemPrompt || updates.userPromptTemplate)) {
      // 内置模板不能修改核心内容，但可以修改收藏状态
      if (updates.isFavorite !== undefined) {
        template.isFavorite = updates.isFavorite;
        template.updatedAt = Date.now();
      }
      return template;
    }
    
    Object.assign(template, updates, { updatedAt: Date.now() });
    this.saveCustomTemplates();
    return template;
  }
  
  /**
   * 删除模板
   */
  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    const template = this.templates[index];
    if (template.isBuiltIn) return false; // 不能删除内置模板
    
    this.templates.splice(index, 1);
    this.saveCustomTemplates();
    return true;
  }
  
  /**
   * 收藏/取消收藏
   */
  toggleFavorite(id: string): boolean {
    const template = this.templates.find(t => t.id === id);
    if (!template) return false;
    
    template.isFavorite = !template.isFavorite;
    template.updatedAt = Date.now();
    
    if (!template.isBuiltIn) {
      this.saveCustomTemplates();
    }
    return true;
  }
  
  /**
   * 记录使用
   */
  recordUsage(id: string): void {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      template.usageCount++;
      template.updatedAt = Date.now();
      if (!template.isBuiltIn) {
        this.saveCustomTemplates();
      }
    }
  }
  
  /**
   * 应用模板 - 生成最终的提示词
   */
  applyTemplate(id: string, variables: Record<string, string>): { systemPrompt: string; userPrompt: string } | null {
    const template = this.getTemplate(id);
    if (!template) return null;
    
    this.recordUsage(id);
    
    let userPrompt = template.userPromptTemplate;
    
    // 替换变量
    for (const variable of template.variables) {
      const value = variables[variable.name] || variable.defaultValue || '';
      userPrompt = userPrompt.replace(new RegExp(`{{${variable.name}}}`, 'g'), value);
    }
    
    // 替换内置变量
    userPrompt = userPrompt
      .replace(/{{selection}}/g, variables.selection || '')
      .replace(/{{content}}/g, variables.content || '')
      .replace(/{{title}}/g, variables.title || '');
    
    return {
      systemPrompt: template.systemPrompt,
      userPrompt,
    };
  }
  
  /**
   * 搜索模板
   */
  searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * 导出模板
   */
  exportTemplate(id: string): string | null {
    const template = this.getTemplate(id);
    if (!template) return null;
    return JSON.stringify(template, null, 2);
  }
  
  /**
   * 导入模板
   */
  importTemplate(json: string): PromptTemplate | null {
    try {
      const template = JSON.parse(json) as PromptTemplate;
      if (template.name && template.userPromptTemplate) {
        return this.createTemplate({
          name: template.name,
          description: template.description || '',
          category: template.category || 'custom',
          icon: template.icon || '📝',
          systemPrompt: template.systemPrompt || '',
          userPromptTemplate: template.userPromptTemplate,
          variables: template.variables || [],
        });
      }
      return null;
    } catch {
      return null;
    }
  }
}

// 单例导出
export const promptTemplateManager = new PromptTemplateManager();
