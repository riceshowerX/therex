/**
 * Markdown 渲染配置
 *
 * 支持：
 * - 数学公式（KaTeX）
 * - 图表（Mermaid）
 * - 数据可视化（ECharts）
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

// ECharts 实例管理器
interface EChartsInstance {
  chart: any;
  resizeObserver: ResizeObserver;
  container: HTMLElement;
}

const echartsInstances = new Map<HTMLElement, EChartsInstance>();

/**
 * 清理 ECharts 实例
 */
export function cleanupECharts(): void {
  if (typeof window === 'undefined') return;

  echartsInstances.forEach((instance, container) => {
    try {
      instance.resizeObserver.disconnect();
      instance.chart.dispose();
      echartsInstances.delete(container);
    } catch (error) {
      console.error('Failed to cleanup ECharts instance:', error);
    }
  });
}

/**
 * 清理指定的 ECharts 实例
 */
export function cleanupEChartsInstance(container: HTMLElement): void {
  const instance = echartsInstances.get(container);
  if (instance) {
    try {
      instance.resizeObserver.disconnect();
      instance.chart.dispose();
      echartsInstances.delete(container);
    } catch (error) {
      console.error('Failed to cleanup ECharts instance:', error);
    }
  }
}

/**
 * 自定义 Markdown 渲染器
 * 支持 KaTeX 数学公式、Mermaid 图表和 ECharts 数据可视化
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  // 渲染 Markdown
  const html = marked.parse(markdown, {
    breaks: true,
    gfm: true,
  }) as string;

  // 处理 Mermaid 代码块
  let processedHtml = processMermaidBlocks(html);

  // 处理 ECharts 代码块
  processedHtml = processEChartsBlocks(processedHtml);

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
 * 处理 ECharts 代码块
 * 将 ```echarts``` 转换为可渲染的 ECharts 容器
 */
function processEChartsBlocks(html: string): string {
  // 匹配 ```echarts 代码块
  const echartsRegex = /<pre><code class="language-echarts">([\s\S]*?)<\/code><\/pre>/g;

  return html.replace(echartsRegex, (match, code) => {
    // 移除可能的 HTML 实体转义
    const unescapedCode = code
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'");

    const trimmedCode = unescapedCode.trim();

    // 验证 JSON 格式
    try {
      JSON.parse(trimmedCode);
    } catch (error) {
      console.error('Invalid ECharts JSON:', trimmedCode, error);
      return `<div class="echarts-container error">
        <div class="text-red-500 p-4">
          <strong>ECharts 配置错误：</strong>
          <pre class="mt-2">${error}</pre>
          <details class="mt-2">
            <summary>查看原始代码</summary>
            <pre>${trimmedCode}</pre>
          </details>
        </div>
      </div>`;
    }

    // 将 JSON 字符串转换为 data 属性
    const encodedCode = encodeURIComponent(trimmedCode);
    return `<div class="echarts-container" data-chart-config="${encodedCode}"><div class="echarts-chart"></div></div>`;
  });
}

/**
 * 渲染行内数学公式
 * 支持 $...$ 和 \(...\) 语法
 */
export function renderInlineMath(text: string): string {
  if (!text) return text;

  // $...$ 语法
  text = text.replace(/\$([^$\n]+)\$/g, (match, math) => {
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
  text = text.replace(/\\\(([^)\n]+)\\\)/g, (match, math) => {
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
  if (!text) return text;

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
  if (!text) return text;

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

  // 只初始化一次
  if ((mermaid as any).isInitialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });

  (mermaid as any).isInitialized = true;

  // 渲染所有 Mermaid 图表
  const mermaidDivs = document.querySelectorAll('.mermaid');
  if (mermaidDivs.length > 0) {
    try {
      await mermaid.run({
        nodes: Array.from(mermaidDivs) as HTMLElement[],
      });
    } catch (error) {
      console.error('Mermaid 渲染失败:', error);
    }
  }
}

/**
 * 初始化 ECharts 图表
 * 在客户端调用，渲染所有 ECharts 图表
 */
export async function initECharts(): Promise<void> {
  if (typeof window === 'undefined') return;

  const echarts = await import('echarts');

  // 查找所有 ECharts 容器
  const echartsContainers = document.querySelectorAll('.echarts-container');

  echartsContainers.forEach((container) => {
    const chartDiv = container.querySelector('.echarts-chart') as HTMLElement;
    const configData = (container as HTMLElement).getAttribute('data-chart-config');

    if (!chartDiv || !configData) {
      console.warn('ECharts container missing chartDiv or configData');
      return;
    }

    // 清理旧实例（如果存在）
    cleanupEChartsInstance(container as HTMLElement);

    try {
      // 解码并解析 JSON 配置
      const decodedConfig = decodeURIComponent(configData);
      const config = JSON.parse(decodedConfig);

      // 创建图表实例
      const chart = echarts.init(chartDiv);

      // 设置配置并渲染
      chart.setOption(config);

      // 创建响应式观察器
      const resizeObserver = new ResizeObserver(() => {
        chart.resize();
      });
      resizeObserver.observe(container);

      // 存储实例以便后续清理
      echartsInstances.set(container as HTMLElement, {
        chart,
        resizeObserver,
        container: container as HTMLElement,
      });
    } catch (error) {
      console.error('ECharts 渲染失败:', error);
      if (chartDiv) {
        chartDiv.innerHTML = `<div class="text-red-500 p-4">
          <strong>ECharts 渲染失败：</strong>
          <pre class="mt-2 text-sm">${error instanceof Error ? error.message : String(error)}</pre>
          <details class="mt-2">
            <summary>查看配置数据</summary>
            <pre class="mt-2 text-xs overflow-auto max-h-40">${configData}</pre>
          </details>
        </div>`;
      }
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
  echarts: {
    description: '使用 ECharts 创建交互式数据可视化图表',
    example: `\`\`\`echarts
{
  "title": {
    "text": "柱状图示例"
  },
  "tooltip": {},
  "xAxis": {
    "data": ["A", "B", "C", "D", "E"]
  },
  "yAxis": {},
  "series": [{
    "type": "bar",
    "data": [10, 20, 30, 40, 50]
  }]
}
\`\`\``,
  },
};
