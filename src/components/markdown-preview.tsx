'use client';

/**
 * 增强的 Markdown 预览组件
 *
 * 支持数学公式、图表和数据可视化
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { renderCompleteMarkdown, initMermaid, initECharts, cleanupECharts } from '@/lib/markdown-renderer';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

// 全局初始化状态，避免多次初始化
let globalMermaidInitialized = false;
let globalEChartsInitialized = false;

export function MarkdownPreview({ markdown, className = '' }: MarkdownPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // 使用 useMemo 缓存处理后的 HTML
  const htmlContent = useMemo(() => {
    return renderCompleteMarkdown(markdown);
  }, [markdown]);

  // 渲染 Markdown 和图表
  useEffect(() => {
    if (!previewRef.current) return;

    // 清理旧的 ECharts 实例
    cleanupECharts();

    // 设置 HTML 内容
    previewRef.current.innerHTML = htmlContent;

    // 初始化 Mermaid 图表（全局只初始化一次）
    const renderMermaid = async () => {
      try {
        if (!globalMermaidInitialized) {
          await initMermaid();
          globalMermaidInitialized = true;
        } else {
          // 已初始化，只渲染新的图表
          const mermaid = (await import('mermaid')).default;
          const mermaidDivs = previewRef.current?.querySelectorAll('.mermaid');
          
          if (mermaidDivs && mermaidDivs.length > 0) {
            await mermaid.run({
              nodes: Array.from(mermaidDivs) as HTMLElement[],
            });
          }
        }
      } catch (error) {
        console.error('Mermaid 渲染失败:', error);
      }
    };

    // 初始化 ECharts 图表（全局只初始化一次）
    const renderECharts = async () => {
      try {
        if (!globalEChartsInitialized) {
          await initECharts();
          globalEChartsInitialized = true;
        } else {
          // 已初始化，只渲染新的图表
          await initECharts();
        }
      } catch (error) {
        console.error('ECharts 渲染失败:', error);
      }
    };

    // 并行渲染图表
    Promise.all([
      renderMermaid(),
      renderECharts(),
    ])
      .then(() => setIsReady(true))
      .catch(console.error);

    // 清理函数
    return () => {
      cleanupECharts();
    };
  }, [htmlContent]);

  return (
    <div
      ref={previewRef}
      className={`markdown-preview prose prose-sm dark:prose-invert max-w-none ${className}`}
      style={{
        minHeight: '200px',
      }}
    />
  );
}
