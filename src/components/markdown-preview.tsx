'use client';

/**
 * 增强的 Markdown 预览组件
 *
 * 支持数学公式和图表渲染
 */

import { useEffect, useRef } from 'react';
import { renderCompleteMarkdown, initMermaid } from '@/lib/markdown-renderer';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

export function MarkdownPreview({ markdown, className = '' }: MarkdownPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  // 渲染 Markdown 和图表
  useEffect(() => {
    if (previewRef.current) {
      // 渲染 Markdown（包含数学公式）
      const html = renderCompleteMarkdown(markdown);
      previewRef.current.innerHTML = html;

      // 初始化 Mermaid 图表
      initMermaid().catch((error) => {
        console.error('Mermaid 初始化失败:', error);
      });
    }
  }, [markdown]);

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
