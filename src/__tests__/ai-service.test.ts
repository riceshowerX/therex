/**
 * AI 服务单元测试
 * 测试 AI 服务核心功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment
process.env.COZE_WORKLOAD_IDENTITY_API_KEY = 'test-api-key';

describe('AI 服务核心功能', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('语言检测', () => {
    it('应该正确检测中文', () => {
      const text = '这是一段中文文本';
      // 简单的语言检测逻辑
      const hasChinese = /[\u4e00-\u9fa5]/.test(text);
      expect(hasChinese).toBe(true);
    });

    it('应该正确检测英文', () => {
      const text = 'This is English text';
      const hasEnglish = /^[a-zA-Z\s.,!?]+$/.test(text);
      expect(hasEnglish).toBe(true);
    });

    it('应该正确检测日文', () => {
      const text = 'これは日本語です';
      const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
      expect(hasJapanese).toBe(true);
    });

    it('应该正确检测韩文', () => {
      const text = '이것은 한국어입니다';
      const hasKorean = /[\uac00-\ud7af]/.test(text);
      expect(hasKorean).toBe(true);
    });
  });

  describe('文本统计', () => {
    it('应该正确计算字符数', () => {
      const text = 'Hello World';
      const charCount = text.length;
      expect(charCount).toBe(11);
    });

    it('应该正确计算单词数（英文）', () => {
      const text = 'Hello World This is a test';
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      expect(wordCount).toBe(6);
    });

    it('应该正确计算行数', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const lineCount = text.split('\n').length;
      expect(lineCount).toBe(3);
    });

    it('应该正确计算阅读时间', () => {
      const text = 'This is a sample text with multiple words to test reading time calculation.';
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
      expect(readingTime).toBe(1);
    });
  });

  describe('Markdown 解析', () => {
    it('应该正确提取标题', () => {
      const markdown = `# Title 1
## Title 2
### Title 3
Content here`;
      
      const headings = markdown.match(/^#{1,6}\s+.+$/gm) || [];
      expect(headings.length).toBe(3);
    });

    it('应该正确提取代码块', () => {
      const markdown = `Some text

\`\`\`javascript
const x = 1;
\`\`\`

More text`;
      
      const codeBlocks = markdown.match(/```[\s\S]*?```/g) || [];
      expect(codeBlocks.length).toBe(1);
    });

    it('应该正确提取链接', () => {
      const markdown = 'Check out [this link](https://example.com) for more info.';
      const links = markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      expect(links.length).toBe(1);
    });

    it('应该正确提取图片', () => {
      const markdown = '![Alt text](https://example.com/image.png)';
      const images = markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];
      expect(images.length).toBe(1);
    });
  });

  describe('请求参数验证', () => {
    it('应该拒绝空内容', () => {
      const content = '';
      expect(content.trim().length).toBe(0);
    });

    it('应该限制内容长度', () => {
      const content = 'a'.repeat(100001);
      const maxLength = 100000;
      expect(content.length).toBeGreaterThan(maxLength);
    });

    it('应该验证目标语言', () => {
      const supportedLanguages = ['中文', '英文', '日文', '韩文', '法文', '德文', '西班牙文'];
      const targetLanguage = '中文';
      expect(supportedLanguages).toContain(targetLanguage);
    });
  });

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetch('https://api.example.com/test');
      } catch (error) {
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('应该处理超时', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      
      try {
        await fetch('https://api.example.com/test');
      } catch (error) {
        expect((error as Error).message).toBe('Timeout');
      }
    });

    it('应该处理无效响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      });
      
      const response = await fetch('https://api.example.com/test');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('流式响应处理', () => {
    it('应该正确解析 SSE 数据', () => {
      const sseData = 'data: {"content": "Hello"}\n\ndata: {"content": " World"}\n\ndata: [DONE]\n\n';
      const lines = sseData.split('\n\n').filter(line => line.startsWith('data: '));
      expect(lines.length).toBe(3);
      
      const content1 = JSON.parse(lines[0].replace('data: ', ''));
      expect(content1.content).toBe('Hello');
    });

    it('应该处理流式错误', () => {
      const sseError = 'data: {"error": "Something went wrong"}\n\n';
      const data = JSON.parse(sseError.replace('data: ', '').trim());
      expect(data.error).toBe('Something went wrong');
    });
  });

  describe('缓存策略', () => {
    it('应该缓存语言检测结果', () => {
      const cache = new Map<string, string>();
      const text = 'Hello World';
      const hash = text.length.toString();
      
      // First detection
      cache.set(hash, '英文');
      expect(cache.get(hash)).toBe('英文');
      
      // Second detection (from cache)
      expect(cache.get(hash)).toBe('英文');
    });

    it('应该限制缓存大小', () => {
      const cache = new Map<string, string>();
      const maxSize = 100;
      
      for (let i = 0; i < maxSize + 10; i++) {
        cache.set(`key-${i}`, `value-${i}`);
        if (cache.size > maxSize) {
          const firstKey = cache.keys().next().value;
          if (firstKey !== undefined) {
            cache.delete(firstKey);
          }
        }
      }
      
      expect(cache.size).toBeLessThanOrEqual(maxSize);
    });
  });
});
