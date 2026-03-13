'use client';

/**
 * 增强的 Markdown 预览组件
 *
 * 支持数学公式、图表和数据可视化
 */

import { useEffect, useRef, useState } from 'react';
import { renderCompleteMarkdown, initMermaid, initECharts, cleanupECharts } from '@/lib/markdown-renderer';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

export function MarkdownPreview({ markdown, className = '' }: MarkdownPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isMermaidInitialized, setIsMermaidInitialized] = useState(false);
  const [isEChartsInitialized, setIsEChartsInitialized] = useState(false);

  // 渲染 Markdown 和图表
  useEffect(() => {
    if (previewRef.current) {
      // 清理旧的 ECharts 实例
      cleanupECharts();

      // 渲染 Markdown（包含数学公式）
      const html = renderCompleteMarkdown(markdown);
      previewRef.current.innerHTML = html;

      // 初始化 Mermaid 图表（仅初始化一次）
      if (!isMermaidInitialized) {
        initMermaid()
          .then(() => {
            setIsMermaidInitialized(true);
          })
          .catch((error) => {
            console.error('Mermaid 初始化失败:', error);
          });
      } else {
        // 如果已经初始化过，重新渲染新的 mermaid 图表
        const renderMermaid = async () => {
          const mermaid = (await import('mermaid')).default;
          const mermaidDivs = previewRef.current?.querySelectorAll('.mermaid');
          
          if (mermaidDivs && mermaidDivs.length > 0) {
            try {
              await mermaid.run({
                nodes: Array.from(mermaidDivs) as HTMLElement[],
              });
            } catch (error) {
              console.error('Mermaid 渲染失败:', error);
            }
          }
        };
        
        renderMermaid().catch(console.error);
      }

      // 初始化 ECharts 图表
      if (!isEChartsInitialized) {
        initECharts()
          .then(() => {
            setIsEChartsInitialized(true);
          })
          .catch((error) => {
            console.error('ECharts 初始化失败:', error);
          });
      } else {
        // 重新渲染 ECharts 图表
        initECharts().catch(console.error);
      }
    }

    // 清理函数
    return () => {
      cleanupECharts();
    };
  }, [markdown, isMermaidInitialized, isEChartsInitialized]);

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
