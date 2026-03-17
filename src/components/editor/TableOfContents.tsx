/**
 * 目录组件
 * 显示文档的标题大纲，支持点击跳转
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  ListTree,
  ChevronRight,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TocItem {
  level: number;
  text: string;
  id: string;
}

export interface TableOfContentsProps {
  content: string;
  className?: string;
  maxHeight?: number;
  onHeadingClick?: (id: string) => void;
}

export function TableOfContents({
  content,
  className,
  maxHeight = 400,
  onHeadingClick,
}: TableOfContentsProps) {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1, 2, 3]));
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // 解析目录
  useEffect(() => {
    const headings = content.match(/^#{1,6}\s+.+$/gm);
    if (headings) {
      const tocItems = headings.map((heading) => {
        const level = heading.match(/^#+/)?.[0].length || 1;
        const text = heading.replace(/^#+\s+/, '');
        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
        return { level, text, id };
      });
      setToc(tocItems);
    } else {
      setToc([]);
    }
  }, [content]);
  
  // 切换层级展开
  const toggleLevel = useCallback((level: number) => {
    setExpandedLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  }, []);
  
  // 点击标题
  const handleHeadingClick = useCallback((id: string) => {
    setActiveId(id);
    onHeadingClick?.(id);
  }, [onHeadingClick]);
  
  // 获取缩进
  const getIndent = (level: number) => {
    return (level - 1) * 12;
  };
  
  if (toc.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground p-4', className)}>
        <div className="flex items-center gap-2 mb-2">
          <ListTree className="h-4 w-4" />
          <span className="font-medium">目录</span>
        </div>
        <p className="text-xs">暂无标题</p>
      </div>
    );
  }
  
  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <ListTree className="h-4 w-4" />
          <span className="font-medium text-sm">目录</span>
        </div>
        <span className="text-xs text-muted-foreground">{toc.length} 个标题</span>
      </div>
      
      <ScrollArea style={{ maxHeight }}>
        <div className="p-2">
          {toc.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="group"
            >
              <button
                onClick={() => handleHeadingClick(item.id)}
                className={cn(
                  'w-full text-left text-sm py-1 px-2 rounded transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  activeId === item.id && 'bg-accent text-accent-foreground'
                )}
                style={{ paddingLeft: getIndent(item.level) + 8 }}
              >
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">
                    {'#'.repeat(item.level)}
                  </span>
                  <span className="truncate">{item.text}</span>
                </span>
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * 目录侧边栏组件
 * 带有折叠功能的目录
 */
export interface TocSidebarProps extends TableOfContentsProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function TocSidebar({
  content,
  isCollapsed = false,
  onToggle,
  ...props
}: TocSidebarProps) {
  const [toc, setToc] = useState<TocItem[]>([]);
  
  useEffect(() => {
    const headings = content.match(/^#{1,6}\s+.+$/gm);
    if (headings) {
      const tocItems = headings.map((heading) => {
        const level = heading.match(/^#+/)?.[0].length || 1;
        const text = heading.replace(/^#+\s+/, '');
        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
        return { level, text, id };
      });
      setToc(tocItems);
    } else {
      setToc([]);
    }
  }, [content]);
  
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 border-l bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggle}
          title="展开目录"
        >
          <ListTree className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground mt-1">{toc.length}</span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col border-l bg-card min-w-48">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <ListTree className="h-4 w-4" />
          <span className="font-medium text-sm">目录</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggle}
          title="收起目录"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <TableOfContents content={content} {...props} />
    </div>
  );
}
