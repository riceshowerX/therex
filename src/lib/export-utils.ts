/**
 * 文档导出工具
 * 支持 Markdown、HTML、PDF、Word 等多种格式导出
 */

import { marked } from 'marked';

export interface ExportOptions {
  filename: string;
  title?: string;
  author?: string;
  includeToc?: boolean;
  includeStyles?: boolean;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

/**
 * 导出为 Markdown 文件
 */
export function exportAsMarkdown(content: string, options: ExportOptions): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, `${options.filename}.md`);
}

/**
 * 导出为 HTML 文件
 */
export async function exportAsHtml(
  content: string,
  options: ExportOptions
): Promise<void> {
  const htmlContent = await generateHtml(content, options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, `${options.filename}.html`);
}

/**
 * 导出为 PDF
 * 使用浏览器打印功能生成 PDF
 */
export async function exportAsPdf(
  content: string,
  options: ExportOptions
): Promise<void> {
  const htmlContent = await generateHtml(content, {
    ...options,
    includeStyles: true,
  });

  // 创建新窗口用于打印
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('无法打开打印窗口，请检查浏览器弹窗设置');
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // 等待资源加载完成后打印
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // 打印后关闭窗口
      setTimeout(() => {
        printWindow.close();
      }, 100);
    }, 500);
  };
}

/**
 * 导出为 Word 文档 (HTML 格式，Word 可打开)
 */
export async function exportAsWord(
  content: string,
  options: ExportOptions
): Promise<void> {
  const htmlContent = await generateWordHtml(content, options);
  const blob = new Blob([htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  downloadBlob(blob, `${options.filename}.doc`);
}

/**
 * 导出为纯文本
 */
export function exportAsText(content: string, options: ExportOptions): void {
  // 移除 Markdown 语法，保留纯文本
  const text = content
    .replace(/#{1,6}\s/g, '') // 移除标题标记
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除加粗
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体
    .replace(/~~(.+?)~~/g, '$1') // 移除删除线
    .replace(/`(.+?)`/g, '$1') // 移除行内代码
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 移除图片
    .replace(/>\s/g, '') // 移除引用标记
    .replace(/^[-*+]\s/gm, '') // 移除列表标记
    .replace(/^\d+\.\s/gm, '') // 移除有序列表标记
    .replace(/\|/g, '\t') // 表格分隔符转为制表符
    .replace(/[-]{3,}/g, '') // 移除分隔线
    .trim();

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${options.filename}.txt`);
}

/**
 * 导出为 JSON (包含元数据)
 */
export function exportAsJson(
  content: string,
  options: ExportOptions & { metadata?: Record<string, unknown> }
): void {
  const data = {
    title: options.title || options.filename,
    content,
    metadata: {
      ...options.metadata,
      exportedAt: new Date().toISOString(),
      author: options.author,
      wordCount: calculateWordCount(content),
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  downloadBlob(blob, `${options.filename}.json`);
}

/**
 * 生成 HTML 内容
 */
async function generateHtml(
  content: string,
  options: ExportOptions
): Promise<string> {
  const parsedContent = await marked(content);
  const styles = options.includeStyles ? getInlineStyles() : '';

  const tocHtml = options.includeToc
    ? generateTableOfContents(parsedContent)
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || options.filename}</title>
  ${styles}
</head>
<body>
  <article class="markdown-body">
    ${options.title ? `<h1 class="title">${options.title}</h1>` : ''}
    ${options.author ? `<p class="author">作者: ${options.author}</p>` : ''}
    ${tocHtml}
    <div class="content">
      ${parsedContent}
    </div>
  </article>
  <script>
    // 代码块高亮
    document.querySelectorAll('pre code').forEach(block => {
      block.className = block.className || 'language-plaintext';
    });
  </script>
</body>
</html>`;
}

/**
 * 生成 Word 兼容的 HTML
 */
async function generateWordHtml(
  content: string,
  options: ExportOptions
): Promise<string> {
  const parsedContent = await marked(content);

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${options.title || options.filename}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: ${options.pageSize || 'A4'} ${options.orientation || 'portrait'};
      margin: 2.5cm;
    }
    body {
      font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24pt;
      margin-bottom: 6pt;
      font-weight: bold;
      color: #1a1a1a;
    }
    h1 { font-size: 24pt; }
    h2 { font-size: 18pt; }
    h3 { font-size: 14pt; }
    h4 { font-size: 12pt; }
    p { margin: 6pt 0; }
    pre {
      background: #f5f5f5;
      padding: 12pt;
      margin: 12pt 0;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
    }
    code {
      font-family: 'Courier New', monospace;
      background: #f5f5f5;
      padding: 2pt 4pt;
    }
    blockquote {
      margin: 12pt 0;
      padding-left: 12pt;
      border-left: 3pt solid #ddd;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }
    th, td {
      border: 1pt solid #ddd;
      padding: 6pt;
      text-align: left;
    }
    th {
      background: #f5f5f5;
      font-weight: bold;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    .title {
      text-align: center;
      font-size: 28pt;
      margin-bottom: 24pt;
    }
    .author {
      text-align: center;
      color: #666;
      margin-bottom: 36pt;
    }
  </style>
</head>
<body>
  ${options.title ? `<h1 class="title">${options.title}</h1>` : ''}
  ${options.author ? `<p class="author">作者: ${options.author}</p>` : ''}
  ${parsedContent}
</body>
</html>`;
}

/**
 * 生成目录
 */
function generateTableOfContents(html: string): string {
  const headings = html.match(/<h([1-6])[^>]*>(.+?)<\/h\1>/g) || [];

  if (headings.length === 0) return '';

  const items = headings.map(heading => {
    const match = heading.match(/<h([1-6])[^>]*>(.+?)<\/h\1>/);
    if (!match) return '';

    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]+>/g, ''); // 移除 HTML 标签
    const id = `heading-${Math.random().toString(36).substr(2, 9)}`;

    return `<li style="margin-left: ${(level - 1) * 20}px">
      <a href="#${id}">${text}</a>
    </li>`;
  });

  return `
    <nav class="toc">
      <h2>目录</h2>
      <ul>${items.join('')}</ul>
    </nav>
  `;
}

/**
 * 获取内联样式
 */
function getInlineStyles(): string {
  return `<style>
    :root {
      --bg-color: #ffffff;
      --text-color: #24292f;
      --heading-color: #1f2328;
      --link-color: #0969da;
      --border-color: #d0d7de;
      --code-bg: #f6f8fa;
      --quote-bg: #f6f8fa;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #0d1117;
        --text-color: #c9d1d9;
        --heading-color: #f0f6fc;
        --link-color: #58a6ff;
        --border-color: #30363d;
        --code-bg: #161b22;
        --quote-bg: #161b22;
      }
    }

    body {
      background: var(--bg-color);
      color: var(--text-color);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }

    .markdown-body {
      font-size: 16px;
    }

    .markdown-body h1,
    .markdown-body h2,
    .markdown-body h3,
    .markdown-body h4,
    .markdown-body h5,
    .markdown-body h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
      color: var(--heading-color);
    }

    .markdown-body h1 { font-size: 2em; border-bottom: 1px solid var(--border-color); padding-bottom: .3em; }
    .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid var(--border-color); padding-bottom: .3em; }
    .markdown-body h3 { font-size: 1.25em; }
    .markdown-body h4 { font-size: 1em; }

    .markdown-body p { margin-bottom: 16px; }

    .markdown-body a {
      color: var(--link-color);
      text-decoration: none;
    }

    .markdown-body a:hover { text-decoration: underline; }

    .markdown-body code {
      background: var(--code-bg);
      padding: 0.2em 0.4em;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
      font-size: 85%;
    }

    .markdown-body pre {
      background: var(--code-bg);
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }

    .markdown-body pre code {
      background: transparent;
      padding: 0;
      font-size: 13.6px;
    }

    .markdown-body blockquote {
      border-left: 4px solid var(--border-color);
      padding: 0 1em;
      margin: 0 0 16px 0;
      color: var(--text-color);
      opacity: 0.7;
    }

    .markdown-body table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
    }

    .markdown-body table th,
    .markdown-body table td {
      padding: 6px 13px;
      border: 1px solid var(--border-color);
    }

    .markdown-body table tr:nth-child(2n) {
      background: var(--code-bg);
    }

    .markdown-body img {
      max-width: 100%;
      height: auto;
    }

    .markdown-body hr {
      border: 0;
      height: 2px;
      background: var(--border-color);
      margin: 24px 0;
    }

    .markdown-body ul,
    .markdown-body ol {
      padding-left: 2em;
      margin-bottom: 16px;
    }

    .toc {
      background: var(--code-bg);
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 24px;
    }

    .toc h2 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 1.25em;
    }

    .toc ul {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }

    .toc li {
      margin: 4px 0;
    }

    .toc a {
      color: var(--link-color);
    }

    .title {
      text-align: center;
      margin-bottom: 8px;
    }

    .author {
      text-align: center;
      color: var(--text-color);
      opacity: 0.7;
      margin-bottom: 32px;
    }

    @media print {
      body {
        padding: 0;
        max-width: none;
      }

      .markdown-body {
        font-size: 12pt;
      }

      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }
  </style>`;
}

/**
 * 计算字数
 */
function calculateWordCount(content: string): number {
  const chineseMatches = content.match(/[\u4e00-\u9fa5]/g) || [];
  const englishMatches = content.match(/[a-zA-Z]+/g) || [];
  return chineseMatches.length + englishMatches.length;
}

/**
 * 下载 Blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 批量导出
 */
export async function batchExport(
  content: string,
  formats: Array<'md' | 'html' | 'pdf' | 'word' | 'txt' | 'json'>,
  options: ExportOptions
): Promise<void> {
  const exporters: Record<string, (content: string, options: ExportOptions) => Promise<void> | void> = {
    md: exportAsMarkdown,
    html: exportAsHtml,
    pdf: exportAsPdf,
    word: exportAsWord,
    txt: exportAsText,
    json: exportAsJson,
  };

  for (const format of formats) {
    const exporter = exporters[format];
    if (exporter) {
      await exporter(content, options);
      // 添加短暂延迟避免浏览器阻止多次下载
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
