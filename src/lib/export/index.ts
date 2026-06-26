/**
 * 增强的导出功能
 * 支持多种格式导出：Markdown、HTML、PDF、Word、图片等
 */

import { toast } from 'sonner';

// 导出格式类型
export type ExportFormat = 
  | 'markdown' 
  | 'html' 
  | 'pdf' 
  | 'word' 
  | 'txt'
  | 'png'
  | 'jpeg'
  | 'svg';

// 导出选项
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
  includeTableOfContents?: boolean;
  includeStyles?: boolean;
  imageQuality?: number;
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  customCss?: string;
  header?: string;
  footer?: string;
}

// 导出结果
export interface ExportResult {
  success: boolean;
  data?: Blob;
  filename?: string;
  error?: string;
}

// Markdown 导出器
class MarkdownExporter {
  export(content: string, title: string, options: ExportOptions): ExportResult {
    try {
      let output = '';

      // 添加元数据
      if (options.includeMetadata) {
        output += `---\n`;
        output += `title: ${title}\n`;
        output += `date: ${new Date().toISOString()}\n`;
        output += `generated-by: Therex\n`;
        output += `---\n\n`;
      }

      // 添加目录
      if (options.includeTableOfContents) {
        const toc = this.generateTableOfContents(content);
        if (toc) {
          output += `## 目录\n\n${toc}\n\n---\n\n`;
        }
      }

      output += content;

      const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
      
      return {
        success: true,
        data: blob,
        filename: `${title}.md`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '导出失败',
      };
    }
  }

  private generateTableOfContents(content: string): string {
    const headings = content.match(/^#{1,6}\s+.+$/gm);
    if (!headings) return '';

    return headings
      .map((heading) => {
        const level = heading.match(/^#+/)?.[0].length || 1;
        const text = heading.replace(/^#+\s+/, '');
        const indent = '  '.repeat(level - 1);
        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
        return `${indent}- [${text}](#${id})`;
      })
      .join('\n');
  }
}

// HTML 导出器
class HTMLExporter {
  export(content: string, title: string, options: ExportOptions): ExportResult {
    try {
      const html = this.convertToHTML(content, title, options);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });

      return {
        success: true,
        data: blob,
        filename: `${title}.html`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '导出失败',
      };
    }
  }

  convertToHTML(content: string, title: string, options: ExportOptions): string {
    // 基础 Markdown 到 HTML 转换
    let html = content;

    // 标题
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // 加粗和斜体
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // 删除线
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // 代码块
    html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    // 链接和图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // 列表
    html = html.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // 引用
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // 水平线
    html = html.replace(/^---$/gm, '<hr />');

    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p>\s*<(h[1-6]|ul|ol|pre|blockquote|hr)/g, '<$1');
    html = html.replace(/<\/(h[1-6]|ul|ol|pre|blockquote)>\s*<\/p>/g, '</$1>');

    // 生成完整的 HTML 文档
    const styles = options.includeStyles ? this.getStyles() : '';
    const header = options.header || '';
    const footer = options.footer || '';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${styles}
  ${options.customCss ? `<style>${options.customCss}</style>` : ''}
</head>
<body>
  ${header}
  <article class="markdown-body">
    ${options.includeTableOfContents ? this.generateTOC(content) : ''}
    ${html}
  </article>
  ${footer}
</body>
</html>`;
  }

  private getStyles(): string {
    return `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css">
<style>
  body {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
  }
  .markdown-body {
    background-color: transparent;
  }
  pre {
    background-color: #f6f8fa;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
  }
  code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }
  blockquote {
    border-left: 4px solid #dfe2e5;
    padding-left: 1rem;
    color: #6a737d;
  }
  img {
    max-width: 100%;
    height: auto;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th, td {
    border: 1px solid #dfe2e5;
    padding: 8px 12px;
  }
  th {
    background-color: #f6f8fa;
  }
</style>`;
  }

  private generateTOC(content: string): string {
    const headings = content.match(/^#{1,6}\s+.+$/gm);
    if (!headings) return '';

    const items = headings.map((heading) => {
      const level = heading.match(/^#+/)?.[0].length || 1;
      const text = heading.replace(/^#+\s+/, '');
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
      return `<li class="toc-level-${level}"><a href="#${id}">${text}</a></li>`;
    });

    return `<nav class="table-of-contents">
  <h2>目录</h2>
  <ul>${items.join('')}</ul>
</nav>`;
  }
}

// PDF 导出器
class PDFExporter {
  async export(content: string, title: string, options: ExportOptions): Promise<ExportResult> {
    try {
      // 使用浏览器打印功能生成 PDF
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        return {
          success: false,
          error: '无法打开打印窗口，请允许弹出窗口',
        };
      }

      const htmlExporter = new HTMLExporter();
      const html = htmlExporter.convertToHTML(content, title, {
        ...options,
        includeStyles: true,
      });

      printWindow.document.write(html);
      printWindow.document.close();

      // 等待内容加载完成后打印
      printWindow.onload = () => {
        printWindow.print();
      };

      return {
        success: true,
        filename: `${title}.pdf`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '导出失败',
      };
    }
  }
}

// 纯文本导出器
class TxtExporter {
  export(content: string, title: string, options: ExportOptions): ExportResult {
    try {
      // 移除 Markdown 语法
      let text = content;

      // 移除标题标记
      text = text.replace(/^#{1,6}\s+/gm, '');

      // 移除加粗和斜体
      text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

      // 移除删除线
      text = text.replace(/~~([^~]+)~~/g, '$1');

      // 移除链接，保留文本
      text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

      // 移除图片
      text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

      // 移除代码块标记
      text = text.replace(/```\w*\n?/g, '');
      text = text.replace(/`([^`]+)`/g, '$1');

      // 移除列表标记
      text = text.replace(/^\s*[-*+]\s+/gm, '• ');
      text = text.replace(/^\s*\d+\.\s+/gm, '');

      // 移除引用标记
      text = text.replace(/^>\s+/gm, '');

      // 移除水平线
      text = text.replace(/^---$/gm, '---');

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });

      return {
        success: true,
        data: blob,
        filename: `${title}.txt`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '导出失败',
      };
    }
  }
}

// 图片导出器
class ImageExporter {
  async export(
    element: HTMLElement,
    title: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // 动态导入 html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: options.format === 'jpeg' ? '#ffffff' : null,
      });

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                success: true,
                data: blob,
                filename: `${title}.${options.format === 'jpeg' ? 'jpg' : 'png'}`,
              });
            } else {
              resolve({
                success: false,
                error: '图片生成失败',
              });
            }
          },
          `image/${options.format === 'jpeg' ? 'jpeg' : 'png'}`,
          options.imageQuality || 0.9
        );
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '导出失败',
      };
    }
  }
}

// 统一导出器
class DocumentExporter {
  private markdownExporter = new MarkdownExporter();
  private htmlExporter = new HTMLExporter();
  private pdfExporter = new PDFExporter();
  private txtExporter = new TxtExporter();
  private imageExporter = new ImageExporter();

  async export(
    content: string,
    title: string,
    options: ExportOptions,
    element?: HTMLElement
  ): Promise<ExportResult> {
    let result: ExportResult;

    switch (options.format) {
      case 'markdown':
        result = this.markdownExporter.export(content, title, options);
        break;
      case 'html':
        result = this.htmlExporter.export(content, title, options);
        break;
      case 'pdf':
        result = await this.pdfExporter.export(content, title, options);
        break;
      case 'txt':
        result = this.txtExporter.export(content, title, options);
        break;
      case 'png':
      case 'jpeg':
        if (!element) {
          return {
            success: false,
            error: '导出图片需要提供 DOM 元素',
          };
        }
        result = await this.imageExporter.export(element, title, options);
        break;
      case 'word':
        // Word 导出实际上是 HTML 格式
        result = this.htmlExporter.export(content, title, options);
        if (result.success && result.filename) {
          result.filename = `${title}.doc`;
        }
        break;
      default:
        return {
          success: false,
          error: `不支持的导出格式: ${options.format}`,
        };
    }

    // 下载文件
    if (result.success && result.data && result.filename) {
      this.download(result.data, result.filename);
    }

    return result;
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// 导出单例
export const documentExporter = new DocumentExporter();

// 便捷导出函数
export async function exportDocument(
  content: string,
  title: string,
  format: ExportFormat,
  options?: Partial<ExportOptions>,
  element?: HTMLElement
): Promise<ExportResult> {
  const fullOptions: ExportOptions = {
    format,
    filename: title,
    includeMetadata: true,
    includeTableOfContents: false,
    includeStyles: true,
    imageQuality: 0.9,
    pageSize: 'a4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    ...options,
  };

  const result = await documentExporter.export(content, title, fullOptions, element);

  if (result.success) {
    toast.success(`已导出为 ${format.toUpperCase()} 文件`);
  } else {
    toast.error(result.error || '导出失败');
  }

  return result;
}
