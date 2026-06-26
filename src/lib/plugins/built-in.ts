/**
 * 内置插件定义
 * 提供开箱即用的插件功能
 */

'use client';

import type { PluginDefinition, PluginAPI } from './manager';

// 字数统计插件
const wordCounterPlugin: PluginDefinition = {
  manifest: {
    id: 'word-counter',
    name: '字数统计',
    version: '1.0.0',
    description: '实时统计文档字数、字符数、段落数',
    author: 'Therex Team',
    main: 'word-counter.js',
    icon: 'FileText',
    permissions: ['editor'],
    keywords: ['统计', '字数', 'counter'],
    contributes: {
      commands: [
        {
          id: 'word-counter.show',
          title: '显示统计',
          icon: 'FileText',
          handler: 'showStats',
        },
      ],
    },
  },
  async activate(api: PluginAPI) {
    // 监听内容变化，更新统计
    api.editor.onContentChange((content) => {
      const stats = calculateStats(content);
      // 可以发送通知或更新 UI
      api.logger.debug('Stats updated:', stats);
    });

    // 添加 showStats 方法
    (api as unknown as Record<string, () => void>).showStats = () => {
      const content = api.editor.getContent();
      const stats = calculateStats(content);
      api.notifications.show(
        `字数: ${stats.words} | 字符: ${stats.chars} | 段落: ${stats.paragraphs}`,
        'info'
      );
    };
  },
};

// 代码高亮增强插件
const codeHighlightPlugin: PluginDefinition = {
  manifest: {
    id: 'code-highlight',
    name: '代码高亮增强',
    version: '1.2.0',
    description: '为代码块提供更丰富的语法高亮和行号显示',
    author: 'Therex Team',
    main: 'code-highlight.js',
    icon: 'Code',
    permissions: ['editor', 'storage'],
    keywords: ['代码', '高亮', 'syntax'],
  },
  async activate(api: PluginAPI) {
    api.logger.info('Code highlight plugin activated');
    // 实际实现需要修改渲染逻辑
  },
};

// 图片压缩插件
const imageCompressorPlugin: PluginDefinition = {
  manifest: {
    id: 'image-compressor',
    name: '图片压缩',
    version: '1.0.0',
    description: '自动压缩上传的图片，减少存储空间占用',
    author: 'Therex Team',
    main: 'image-compressor.js',
    icon: 'Image',
    permissions: ['storage', 'files'],
    keywords: ['图片', '压缩', '优化'],
  },
  async activate(api: PluginAPI) {
    api.logger.info('Image compressor plugin activated');
    // 实际实现需要拦截图片上传
  },
};

// Mermaid 图表插件
const mermaidRendererPlugin: PluginDefinition = {
  manifest: {
    id: 'mermaid-renderer',
    name: 'Mermaid 图表',
    version: '2.0.0',
    description: '支持 Mermaid 语法渲染流程图、时序图等',
    author: 'Therex Team',
    main: 'mermaid-renderer.js',
    icon: 'Sparkles',
    permissions: ['editor', 'network'],
    keywords: ['mermaid', '图表', '流程图'],
  },
  async activate(api: PluginAPI) {
    api.logger.info('Mermaid renderer plugin activated');
    // 实际实现需要扩展 Markdown 渲染器
  },
};

// AI 翻译助手插件
const aiTranslatorPlugin: PluginDefinition = {
  manifest: {
    id: 'ai-translator',
    name: 'AI 翻译助手',
    version: '1.5.0',
    description: '使用 AI 自动翻译选中文本到多种语言',
    author: 'Therex Team',
    main: 'ai-translator.js',
    icon: 'Globe',
    permissions: ['ai', 'editor', 'clipboard'],
    keywords: ['翻译', 'AI', '多语言'],
    contributes: {
      commands: [
        {
          id: 'ai-translator.translate',
          title: '翻译选中文本',
          icon: 'Globe',
          handler: 'translateSelection',
        },
        {
          id: 'ai-translator.toEnglish',
          title: '翻译为英文',
          handler: 'toEnglish',
        },
        {
          id: 'ai-translator.toChinese',
          title: '翻译为中文',
          handler: 'toChinese',
        },
      ],
    },
  },
  async activate(api: PluginAPI) {
    // 翻译选中文本
    (api as unknown as Record<string, (targetLang?: string) => Promise<void>>).translateSelection = async (targetLang?: string) => {
      const selection = api.editor.getSelection();
      if (!selection.text) {
        api.notifications.show('请先选中文本', 'warning');
        return;
      }

      try {
        api.notifications.show('正在翻译...', 'info');
        const result = await api.ai.complete(
          `请将以下文本翻译为${targetLang || '英文'}，只返回翻译结果：\n\n${selection.text}`
        );
        
        // 替换选中文本
        api.editor.insertText(result);
        api.notifications.show('翻译完成', 'success');
      } catch (error) {
        api.notifications.show('翻译失败', 'error');
        api.logger.error('Translation failed', error);
      }
    };

    (api as unknown as Record<string, () => Promise<void>>).toEnglish = async () => {
      const translateSelection = (api as unknown as Record<string, (targetLang?: string) => Promise<void>>).translateSelection;
      if (translateSelection) {
        await translateSelection('英文');
      }
    };

    (api as unknown as Record<string, () => Promise<void>>).toChinese = async () => {
      const translateSelection = (api as unknown as Record<string, (targetLang?: string) => Promise<void>>).translateSelection;
      if (translateSelection) {
        await translateSelection('中文');
      }
    };
  },
};

// 专注模式插件
const focusModePlugin: PluginDefinition = {
  manifest: {
    id: 'focus-mode',
    name: '专注模式',
    version: '1.0.0',
    description: '隐藏界面干扰元素，提供沉浸式写作体验',
    author: 'Therex Team',
    main: 'focus-mode.js',
    icon: 'Shield',
    permissions: ['editor'],
    keywords: ['专注', '沉浸', '写作'],
    contributes: {
      commands: [
        {
          id: 'focus-mode.toggle',
          title: '切换专注模式',
          icon: 'Shield',
          handler: 'toggle',
        },
      ],
    },
  },
  async activate(api: PluginAPI) {
    let isFocusMode = false;

    (api as unknown as Record<string, () => void>).toggle = () => {
      isFocusMode = !isFocusMode;
      
      if (isFocusMode) {
        document.body.classList.add('focus-mode');
        api.notifications.show('专注模式已开启', 'success');
      } else {
        document.body.classList.remove('focus-mode');
        api.notifications.show('专注模式已关闭', 'info');
      }
    };
  },
  deactivate() {
    document.body.classList.remove('focus-mode');
  },
};

// 辅助函数
function calculateStats(content: string): { words: number; chars: number; paragraphs: number } {
  // 统计字符数（不含空格）
  const chars = content.replace(/\s/g, '').length;
  
  // 统计字数（中英文混合）
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  const words = chineseChars + englishWords;
  
  // 统计段落数
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim()).length || 1;
  
  return { words, chars, paragraphs };
}

// 所有内置插件
export const builtInPlugins: PluginDefinition[] = [
  wordCounterPlugin,
  codeHighlightPlugin,
  imageCompressorPlugin,
  mermaidRendererPlugin,
  aiTranslatorPlugin,
  focusModePlugin,
];

// 注册所有内置插件
export function registerBuiltInPlugins(): void {
  const { pluginManager } = require('./manager');
  
  for (const plugin of builtInPlugins) {
    pluginManager.registerBuiltIn(plugin);
  }
}
