/**
 * AI 服务核心模块
 * 使用 coze-coding-dev-sdk 提供深度 AI 功能
 * 
 * 功能包括：
 * - 智能写作助手
 * - 文档问答 (RAG)
 * - 智能补全
 * - 文档生成
 * - 多语言翻译
 * - 写作风格分析
 * - 思维导图生成
 * - 图像理解
 */

import { 
  LLMClient, 
  Config, 
  HeaderUtils,
  KnowledgeClient,
  KnowledgeDocument,
  DataSourceType,
  ChunkConfig,
  type Message
} from 'coze-coding-dev-sdk';

// AI 服务配置
export interface AIServiceConfig {
  model?: string;
  temperature?: number;
  thinking?: 'enabled' | 'disabled';
  caching?: 'enabled' | 'disabled';
}

// 默认配置
const defaultConfig: AIServiceConfig = {
  model: 'doubao-seed-2-0-pro-260215',
  temperature: 0.7,
  thinking: 'disabled',
  caching: 'disabled',
};

// AI 服务类
export class AIService {
  private llmClient: LLMClient;
  private knowledgeClient: KnowledgeClient;
  private config: AIServiceConfig;
  private customHeaders: Record<string, string>;

  constructor(config: Partial<AIServiceConfig> = {}, customHeaders?: Record<string, string>) {
    this.config = { ...defaultConfig, ...config };
    this.customHeaders = customHeaders || {};
    
    const sdkConfig = new Config();
    this.llmClient = new LLMClient(sdkConfig, this.customHeaders);
    this.knowledgeClient = new KnowledgeClient(sdkConfig, this.customHeaders);
  }

  // ==================== 智能写作助手 ====================

  /**
   * 续写内容
   */
  async *continueWriting(
    content: string,
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的写作助手。请根据用户提供的文档内容，自然地续写后续内容。
要求：
- 保持原文的语气、风格和格式
- 内容要自然流畅，与原文紧密衔接
- 如果原文是技术文档，保持专业性
- 如果原文是创意写作，保持创意性
- 只输出续写的内容，不要输出任何解释或说明`
      },
      {
        role: 'user',
        content: `请续写以下内容：\n\n${content}`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.8,
      thinking: options?.thinking || 'disabled',
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  /**
   * 润色文本
   */
  async *polishText(
    text: string,
    style?: 'professional' | 'casual' | 'academic' | 'creative',
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const styleGuides = {
      professional: '使用专业、正式的语言风格',
      casual: '使用轻松、口语化的语言风格',
      academic: '使用学术、严谨的语言风格',
      creative: '使用创意、生动的语言风格'
    };

    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的文字编辑。请帮助用户润色文本，使其更加通顺、专业、有表现力。
${style ? `风格要求：${styleGuides[style]}` : ''}
要求：
- 保持原文的核心意思不变
- 改善语言表达，使其更加流畅
- 修正语法错误和不通顺的表达
- 只输出润色后的内容，不要输出任何解释或说明`
      },
      {
        role: 'user',
        content: `请润色以下文本：\n\n${text}`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.5,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  /**
   * 扩展内容
   */
  async *expandContent(
    text: string,
    expandType?: 'detail' | 'example' | 'explanation',
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const expandGuides = {
      detail: '添加更多细节描述',
      example: '添加具体例子和案例',
      explanation: '添加更详细的解释和说明'
    };

    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的内容创作助手。请帮助用户扩展文本内容。
${expandType ? `扩展方式：${expandGuides[expandType]}` : ''}
要求：
- 保持原文的核心意思和风格
- 添加相关的细节、例子或解释
- 使内容更加丰富和完整
- 只输出扩展后的内容，不要输出任何解释或说明`
      },
      {
        role: 'user',
        content: `请扩展以下内容：\n\n${text}`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.7,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  /**
   * 总结文档
   */
  async *summarizeDocument(
    content: string,
    format?: 'bullet' | 'paragraph' | 'outline',
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const formatGuides = {
      bullet: '使用项目符号列表格式',
      paragraph: '使用段落格式',
      outline: '使用大纲格式，带层级结构'
    };

    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的文档摘要助手。请帮助用户总结文档的主要内容。
${format ? `格式要求：${formatGuides[format]}` : '使用项目符号列表格式'}
要求：
- 提取核心要点
- 保持简洁明了
- 突出重点内容
- 只输出摘要内容`
      },
      {
        role: 'user',
        content: `请总结以下文档：\n\n${content}`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.3,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  /**
   * 生成大纲
   */
  async *generateOutline(
    topic: string,
    type?: 'article' | 'report' | 'essay' | 'tutorial',
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const typeGuides = {
      article: '文章大纲，适合博客和新闻稿',
      report: '报告大纲，适合工作汇报和分析报告',
      essay: '论文大纲，适合学术论文和研究报告',
      tutorial: '教程大纲，适合技术教程和操作指南'
    };

    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的写作规划助手。请根据用户提供的主题生成详细的写作大纲。
${type ? `文档类型：${typeGuides[type]}` : ''}
要求：
- 结构清晰，层次分明
- 每个要点简洁明确
- 包含主要章节和小节
- 使用 Markdown 格式输出`
      },
      {
        role: 'user',
        content: `请为以下主题生成写作大纲：\n\n${topic}`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.7,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  // ==================== 智能问答 (RAG) ====================

  /**
   * 添加文档到知识库
   */
  async addToKnowledgeBase(
    content: string,
    tableName: string = 'therex_knowledge'
  ): Promise<{ success: boolean; docId?: string; error?: string }> {
    try {
      const doc: KnowledgeDocument = {
        source: DataSourceType.TEXT,
        raw_data: content,
      };

      const chunkConfig: ChunkConfig = {
        separator: '\n\n',
        max_tokens: 1000,
        remove_extra_spaces: true,
      };

      const response = await this.knowledgeClient.addDocuments([doc], tableName, chunkConfig);

      if (response.code === 0 && response.doc_ids?.length) {
        return { success: true, docId: response.doc_ids[0] };
      }

      return { success: false, error: response.msg || '添加失败' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  /**
   * 从知识库搜索
   */
  async searchKnowledge(
    query: string,
    topK: number = 5,
    minScore: number = 0.5
  ): Promise<Array<{ content: string; score: number; docId?: string }>> {
    try {
      const response = await this.knowledgeClient.search(query, undefined, topK, minScore);

      if (response.code === 0 && response.chunks) {
        return response.chunks.map(chunk => ({
          content: chunk.content,
          score: chunk.score,
          docId: chunk.doc_id,
        }));
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * 基于 RAG 的文档问答
   */
  async *askWithContext(
    question: string,
    documentContent?: string,
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    let context = '';

    // M13：注释与实现对齐——当前实现仅搜索既有知识库，不自动入库文档内容。
    // 若希望"先添加文档到知识库再问答"，需先调用 addToKnowledgeBase 再搜索。
    if (documentContent) {
      const searchResults = await this.searchKnowledge(question, 3, 0.3);
      if (searchResults.length > 0) {
        context = searchResults.map(r => r.content).join('\n\n---\n\n');
      } else {
        context = documentContent.slice(0, 5000); // 限制上下文长度
      }
    }

    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的文档分析助手。请根据提供的文档内容回答用户的问题。
要求：
- 回答要准确、具体
- 如果文档中没有相关信息，请如实说明
- 可以引用文档中的具体内容
- 回答要简洁明了`
      },
      {
        role: 'user',
        content: context
          ? `文档内容：\n\`\`\`\n${context}\n\`\`\`\n\n问题：${question}`
          : question
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.3,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  // ==================== 智能补全 ====================

  /**
   * 智能文本补全
   */
  async *smartComplete(
    text: string,
    cursorPosition: number,
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);

    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个智能文本补全助手。请根据光标位置前的内容，预测并补全后续内容。
规则：
- 只输出补全的内容，不要包含原有内容
- 补全要自然流畅，与上下文一致
- 保持相同的写作风格和语气
- 如果是代码，保持代码风格一致
- 补全长度适中，通常1-3句话`
      },
      {
        role: 'user',
        content: `光标前内容：\n${beforeCursor}\n\n光标后内容：\n${afterCursor || '(空)'}\n\n请补全光标位置的内容：`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || 'doubao-seed-2-0-lite-260215', // 使用轻量模型
      temperature: options?.temperature || 0.5,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  // ==================== 文档生成 ====================

  /**
   * 从大纲生成完整文档
   */
  async *generateDocumentFromOutline(
    outline: string,
    style?: 'professional' | 'casual' | 'academic' | 'creative',
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const styleGuides: Record<string, string> = {
      professional: '专业、正式',
      casual: '轻松、口语化',
      academic: '学术、严谨',
      creative: '创意、生动'
    };

    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的内容创作者。请根据提供的大纲生成完整的文档内容。
${style ? `写作风格：${styleGuides[style]}` : '专业、正式'}
要求：
- 严格按照大纲结构展开
- 每个章节内容充实
- 使用 Markdown 格式
- 保持整体连贯性
- 适当使用列表、表格等格式增强可读性`
      },
      {
        role: 'user',
        content: `请根据以下大纲生成完整文档：\n\n${outline}`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.7,
      thinking: 'enabled', // 启用深度思考
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  /**
   * 根据主题生成文档
   */
  async *generateDocumentByTopic(
    topic: string,
    type: 'article' | 'report' | 'essay' | 'tutorial' = 'article',
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的内容创作者。请根据主题生成完整的${type === 'article' ? '文章' : type === 'report' ? '报告' : type === 'essay' ? '论文' : '教程'}。
要求：
- 内容结构完整，逻辑清晰
- 使用 Markdown 格式
- 包含标题、引言、正文和结论
- 内容详实，有理有据`
      },
      {
        role: 'user',
        content: `请以"${topic}"为主题，生成一篇完整的${type === 'article' ? '文章' : type === 'report' ? '报告' : type === 'essay' ? '论文' : '教程'}。`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.7,
      thinking: 'enabled',
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  // ==================== 多语言翻译 ====================

  /**
   * 智能翻译
   */
  async *translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的翻译助手。请将用户提供的文本翻译成${targetLanguage}。
${sourceLanguage ? `源语言：${sourceLanguage}` : '自动检测源语言'}
要求：
- 翻译准确，保持原文意思
- 使用自然流畅的表达
- 保持原文的格式（如 Markdown）
- 只输出翻译结果，不要解释`
      },
      {
        role: 'user',
        content: text
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.3,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  /**
   * 检测语言
   */
  async detectLanguage(text: string): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: '你是一个语言检测助手。请检测文本的语言，只输出语言名称（如：中文、英文、日文等）。'
      },
      {
        role: 'user',
        content: text.slice(0, 500)
      }
    ];

    try {
      const response = await this.llmClient.invoke(messages, { temperature: 0.1 });
      return response.content.trim();
    } catch {
      return '未知';
    }
  }

  // ==================== 写作风格分析 ====================

  /**
   * 分析写作风格
   */
  async *analyzeWritingStyle(
    text: string,
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的写作风格分析师。请分析用户文本的写作风格特点。
分析维度：
1. 语言风格（正式/非正式/口语化/书面化）
2. 句式特点（长句/短句/复杂句/简单句）
3. 用词特点（专业术语/日常用语/文学性表达）
4. 情感基调（客观/主观/积极/消极/中立）
5. 结构特点（总分/并列/递进/对比）
6. 可读性评估
7. 改进建议

请使用 Markdown 格式输出分析报告。`
      },
      {
        role: 'user',
        content: `请分析以下文本的写作风格：\n\n${text}`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.3,
      thinking: 'enabled',
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  /**
   * 优化建议
   */
  async *getOptimizationSuggestions(
    text: string,
    focusArea?: 'clarity' | 'conciseness' | 'engagement' | 'professionalism',
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const focusGuides = {
      clarity: '提高清晰度和可理解性',
      conciseness: '提高简洁性，去除冗余',
      engagement: '增强吸引力和感染力',
      professionalism: '提高专业性和权威性'
    };

    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的写作顾问。请针对用户文本提供具体的优化建议。
${focusArea ? `重点关注：${focusGuides[focusArea]}` : ''}
要求：
- 指出具体问题位置
- 提供修改建议
- 解释修改原因
- 使用 Markdown 格式`
      },
      {
        role: 'user',
        content: `请为以下文本提供优化建议：\n\n${text}`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.5,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  // ==================== 思维导图生成 ====================

  /**
   * 生成思维导图（Mermaid 格式）
   */
  async *generateMindMap(
    content: string,
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个思维导图生成助手。请根据用户提供的内容生成思维导图。
要求：
- 使用 Mermaid mindmap 语法
- 结构清晰，层次分明
- 主要节点不超过 7 个
- 每个分支深度适中
- 只输出 Mermaid 代码，放在 \`\`\`mermaid 代码块中`
      },
      {
        role: 'user',
        content: `请为以下内容生成思维导图：\n\n${content}`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.5,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  // ==================== 图像理解 ====================

  /**
   * 分析图像内容
   */
  async *analyzeImage(
    imageUrl: string,
    prompt?: string,
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const messages: Message[] = [
      {
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: prompt || '请详细描述这张图片的内容，包括：\n1. 主要对象和场景\n2. 颜色和构图\n3. 可能的上下文或含义\n4. 其他值得注意的细节'
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high'
            }
          }
        ]
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: 'doubao-seed-1-6-vision-250815',
      temperature: options?.temperature || 0.5,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  /**
   * 从图像生成 Markdown 描述
   */
  async *generateImageDescription(
    imageUrl: string,
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const messages: Message[] = [
      {
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: '请为这张图片生成适合插入 Markdown 文档的描述文字。描述要简洁但有信息量，适合作为图片的 alt 文本或图注。'
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'low'
            }
          }
        ]
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: 'doubao-seed-1-6-vision-250815',
      temperature: options?.temperature || 0.3,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  // ==================== 深度思考模式 ====================

  /**
   * 深度分析（启用思考模式）
   */
  async *deepAnalysis(
    content: string,
    analysisType: 'critical' | 'creative' | 'comparative' | 'structural',
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const analysisGuides = {
      critical: '批判性分析：评估论点、证据和逻辑',
      creative: '创意分析：探索可能性和创新点',
      comparative: '比较分析：对比不同观点和方案',
      structural: '结构分析：解构组织框架和逻辑流'
    };

    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个深度内容分析师。请对用户的内容进行${analysisGuides[analysisType]}。
要求：
- 分析要深入透彻
- 提供具体论据支撑
- 给出专业见解
- 使用 Markdown 格式`
      },
      {
        role: 'user',
        content: `请对以下内容进行深度分析：\n\n${content}`
      }
    ];

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.5,
      thinking: 'enabled',
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  // ==================== 对话式 AI ====================

  /**
   * 智能对话
   */
  async *chat(
    message: string,
    context?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: Partial<AIServiceConfig>
  ): AsyncGenerator<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `你是一个专业的写作助手。你会根据用户的问题提供帮助，包括：
- 写作建议和技巧
- 文档内容分析
- 文本修改建议
- Markdown 格式帮助
- 其他与写作相关的问题

${context ? `当前文档上下文：\n\`\`\`\n${context.slice(0, 3000)}\n\`\`\`` : ''}

请用中文回答用户的问题。如果用户的问题是关于当前文档的，请结合文档内容给出回答。`
      }
    ];

    // 添加对话历史
    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // 添加当前消息
    messages.push({
      role: 'user',
      content: message
    });

    const stream = this.llmClient.stream(messages, {
      model: options?.model || this.config.model,
      temperature: options?.temperature || 0.7,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }
}

// 导出工厂函数
export function createAIService(
  config?: Partial<AIServiceConfig>,
  customHeaders?: Record<string, string>
): AIService {
  return new AIService(config, customHeaders);
}
