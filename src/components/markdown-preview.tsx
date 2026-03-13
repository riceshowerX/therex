'use client';

/**
 * 增强的 Markdown 预览组件
 *
 * 支持数学公式和图表渲染
 */

import { useEffect, useRef, useState } from 'react';
import { renderCompleteMarkdown, initMermaid } from '@/lib/markdown-renderer';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

export function MarkdownPreview({ markdown, className = '' }: MarkdownPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isMermaidInitialized, setIsMermaidInitialized] = useState(false);

  // 渲染 Markdown 和图表
  useEffect(() => {
    if (previewRef.current) {
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
    }
  }, [markdown, isMermaidInitialized]);

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
