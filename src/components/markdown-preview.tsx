'use client';

/**
 * 增强的 Markdown 预览组件
 *
 * 支持数学公式、图表和数据可视化
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { renderCompleteMarkdown, initMermaid, initECharts, cleanupECharts, ensureClientLibsLoaded } from '@/lib/markdown-renderer';

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
  // M10：katex/hljs 动态加载完成后驱动重渲染，修复首屏公式/高亮缺失
  const [libsReady, setLibsReady] = useState(false);

  // M10：等待 katex/hljs 加载完成
  useEffect(() => {
    let cancelled = false;
    ensureClientLibsLoaded()
      .then(() => {
        if (!cancelled) setLibsReady(true);
      })
      .catch(() => {
        if (!cancelled) setLibsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 使用 useMemo 缓存处理后的 HTML（libsReady 变化后重新计算）
  const htmlContent = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return renderCompleteMarkdown(markdown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown, libsReady]);

  // 渲染 Markdown 和图表
  useEffect(() => {
    // SSR 安全：仅在客户端执行
    if (typeof window === 'undefined' || !previewRef.current) return;

    let disposed = false;

    // 清理旧的 ECharts 实例
    cleanupECharts();

    // 设置 HTML 内容（先经 DOMPurify 消毒，防止文档中的原始 HTML 造成 XSS，P0-2）
    const applyContent = async (): Promise<void> => {
      let safeHtml = htmlContent;
      try {
        const { default: DOMPurify } = await import('dompurify');
        // 保留 KaTeX 内联样式、ECharts 数据属性、Mermaid SVG 等渲染输出
        safeHtml = DOMPurify.sanitize(htmlContent, {
          ADD_ATTR: ['style', 'data-chart-config', 'data-heading'],
          ALLOW_DATA_ATTR: true,
          USE_PROFILES: { html: true },
        });
      } catch (error) {
        console.error('DOMPurify 加载失败，跳过消毒（安全风险）:', error);
      }
      if (!disposed && previewRef.current) {
        previewRef.current.innerHTML = safeHtml;
      }
    };

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

    (async () => {
      // 先注入（已消毒的）HTML，再渲染图表，避免图表节点尚未挂载
      await applyContent();
      await Promise.all([renderMermaid(), renderECharts()]);
      if (!disposed) setIsReady(true);
    })().catch(console.error);

    // 清理函数
    return () => {
      disposed = true;
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
