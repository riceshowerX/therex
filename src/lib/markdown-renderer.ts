/**
 * Markdown 渲染配置
 *
 * 支持：
 * - 数学公式（KaTeX）
 * - 图表（Mermaid）
 * - GitHub Flavored Markdown（GFM）
 * - 代码高亮
 */

import { marked } from 'marked';
import remarkGfm from 'remark-gfm';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// 配置 marked
marked.use({
  gfm: true,
  breaks: true,
});

/**
 * 自定义 Markdown 渲染器
 * 支持 KaTeX 数学公式和 Mermaid 图表
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  // 渲染 Markdown
  const html = marked.parse(markdown, {
    breaks: true,
    gfm: true,
  }) as string;

  // 处理 Mermaid 代码块
  const processedHtml = processMermaidBlocks(html);

  return processedHtml;
}

/**
 * 处理 Mermaid 图表块
 * 将 ```mermaid``` 转换为可渲染的 Mermaid 容器
 */
function processMermaidBlocks(html: string): string {
  // 匹配 ```mermaid 代码块
  const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
  
  return html.replace(mermaidRegex, (match, code) => {
    const trimmedCode = code.trim();
    return `<div class="mermaid-container"><pre class="mermaid">${trimmedCode}</pre></div>`;
  });
}

/**
 * 渲染行内数学公式
 * 支持 $...$ 和 \(...\) 语法
 */
export function renderInlineMath(text: string): string {
  // $...$ 语法
  text = text.replace(/\$([^$]+)\$/g, (match, math) => {
    try {
      return katex.renderToString(math, {
        displayMode: false,
        throwOnError: false,
      });
    } catch (error) {
      return match;
    }
  });

  // \(...\) 语法
  text = text.replace(/\\\(([^)]+)\\\)/g, (match, math) => {
    try {
      return katex.renderToString(math, {
        displayMode: false,
        throwOnError: false,
      });
    } catch (error) {
      return match;
    }
  });

  return text;
}

/**
 * 渲染块级数学公式
 * 支持 $$...$$ 和 \[...\] 语法
 */
export function renderBlockMath(text: string): string {
  // $$...$$ 语法
  text = text.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math, {
        displayMode: true,
        throwOnError: false,
      });
    } catch (error) {
      return match;
    }
  });

  // \[...\] 语法
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    } catch (error) {
      return match;
    }
  });

  return text;
}

/**
 * 渲染所有数学公式
 * 先处理块级公式，再处理行内公式
 */
export function renderAllMath(text: string): string {
  text = renderBlockMath(text);
  text = renderInlineMath(text);
  return text;
}

/**
 * 完整的 Markdown 渲染（包含数学公式和图表）
 */
export function renderCompleteMarkdown(markdown: string): string {
  if (!markdown) return '';

  // 先处理数学公式
  let processed = renderAllMath(markdown);

  // 再渲染 Markdown
  const html = renderMarkdown(processed);

  return html;
}

/**
 * 初始化 Mermaid
 * 在客户端调用，初始化 Mermaid 渲染
 */
export async function initMermaid(): Promise<void> {
  if (typeof window === 'undefined') return;

  const { default: mermaid } = await import('mermaid');

  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });

  // 渲染所有 Mermaid 图表
  const mermaidDivs = document.querySelectorAll('.mermaid');
  mermaidDivs.forEach(async (div) => {
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    
    const graphDefinition = div.textContent || '';
    
    try {
      const { svg } = await mermaid.render(id, graphDefinition);
      div.innerHTML = svg;
    } catch (error) {
      console.error('Mermaid 渲染失败:', error);
      div.innerHTML = `<div class="text-red-500">图表渲染失败：${error}</div>`;
    }
  });
}

/**
 * 获取支持的语法列表
 */
export const supportedSyntax = {
  math: {
    inline: ['$...$', '\\(...\\)'],
    block: ['$$...$$', '\\[...\\]'],
    examples: [
      '行内公式: $E = mc^2$',
      '块级公式: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$',
    ],
  },
  mermaid: {
    types: ['flowchart', 'sequence', 'class', 'state', 'er', 'gantt', 'pie', 'mindmap'],
    example: `\`\`\`mermaid
graph TD
    A[开始] --> B{判断}
    B -->|是| C[执行]
    B -->|否| D[跳过]
    C --> E[结束]
    D --> E
\`\`\``,
  },
};
