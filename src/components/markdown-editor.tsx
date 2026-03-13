'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { marked } from 'marked';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Table,
  Code2,
  Download,
  Upload,
  FileText,
  Eye,
  SplitSquareHorizontal,
  Maximize2,
  Moon,
  Sun,
  History,
  Trash2,
  Save,
  FolderOpen,
  Copy,
  FileCode,
  FileDown,
  Monitor,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface MarkdownEditorProps {
  initialContent?: string;
  initialTitle?: string;
}

interface HistoryItem {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export default function MarkdownEditor({
  initialContent = '',
  initialTitle = '无标题文档',
}: MarkdownEditorProps) {
  const { theme, setTheme } = useTheme();
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [wordCount, setWordCount] = useState({ chars: 0, words: 0, lines: 0 });
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [toc, setToc] = useState<{ level: number; text: string; id: string }[]>([]);

  // 配置 marked
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }, []);

  // 渲染 Markdown
  const renderedMarkdown = useMemo(() => {
    try {
      return marked.parse(content) as string;
    } catch (error) {
      console.error('Failed to parse markdown:', error);
      return content;
    }
  }, [content]);

  // 初始化
  useEffect(() => {
    // 从 localStorage 加载内容
    const savedContent = localStorage.getItem('markdown-content');
    const savedTitle = localStorage.getItem('markdown-title');
    const savedHistory = localStorage.getItem('markdown-history');

    if (savedContent) setContent(savedContent);
    if (savedTitle) setTitle(savedTitle);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  // 自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('markdown-content', content);
      localStorage.setItem('markdown-title', title);
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, title]);

  // 统计字数
  useEffect(() => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    setWordCount({ chars, words, lines });
  }, [content]);

  // 生成目录
  useEffect(() => {
    const headings = content.match(/^#{1,6}\s+.+$/gm);
    if (headings) {
      const tocItems = headings.map((heading) => {
        const level = heading.match(/^#+/)?.[0].length || 1;
        const text = heading.replace(/^#+\s+/, '');
        const id = text.toLowerCase().replace(/\s+/g, '-');
        return { level, text, id };
      });
      setToc(tocItems);
    } else {
      setToc([]);
    }
  }, [content]);

  // 插入文本
  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }, [content]);

  // 工具栏操作
  const actions = {
    bold: () => insertText('**', '**'),
    italic: () => insertText('*', '*'),
    strikethrough: () => insertText('~~', '~~'),
    code: () => insertText('`', '`'),
    codeBlock: () => insertText('```\n', '\n```'),
    h1: () => insertText('# '),
    h2: () => insertText('## '),
    h3: () => insertText('### '),
    ul: () => insertText('- '),
    ol: () => insertText('1. '),
    quote: () => insertText('> '),
    link: () => insertText('[', '](url)'),
    image: () => insertText('![alt](', ')'),
    table: () =>
      insertText(
        '| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |'
      ),
  };

  // 导出功能
  const exportFile = useCallback(
    (format: 'md' | 'html' | 'txt') => {
      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'md':
          blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
          filename = `${title}.md`;
          break;
        case 'html':
          const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    blockquote { border-left: 4px solid #ddd; padding-left: 20px; margin: 0; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  ${renderedMarkdown}
</body>
</html>`;
          blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          filename = `${title}.html`;
          break;
        case 'txt':
          blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
          filename = `${title}.txt`;
          break;
      }

      saveAs(blob, filename);
      toast.success(`已导出为 ${format.toUpperCase()} 文件`);
    },
    [content, title, renderedMarkdown]
  );

  // 导入文件
  const importFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt,.markdown';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
        setTitle(file.name.replace(/\.(md|txt|markdown)$/, ''));
        toast.success('文件导入成功');
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // 保存历史
  const saveToHistory = useCallback(() => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      title,
      content,
      timestamp: Date.now(),
    };
    const newHistory = [newItem, ...history].slice(0, 20); // 保留最近 20 条
    setHistory(newHistory);
    localStorage.setItem('markdown-history', JSON.stringify(newHistory));
    toast.success('已保存到历史记录');
  }, [title, content, history]);

  // 加载历史记录
  const loadFromHistory = useCallback((item: HistoryItem) => {
    setContent(item.content);
    setTitle(item.title);
    toast.success('已从历史记录加载');
  }, []);

  // 清空历史
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('markdown-history');
    toast.success('历史记录已清空');
  }, []);

  // 复制内容
  const copyContent = useCallback(() => {
    navigator.clipboard.writeText(content);
    toast.success('已复制到剪贴板');
  }, [content]);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            actions.bold();
            break;
          case 'i':
            e.preventDefault();
            actions.italic();
            break;
          case 's':
            e.preventDefault();
            saveToHistory();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, saveToHistory]);

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-background">
      {/* 顶部工具栏 */}
      <div className="border-b bg-card px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-none shadow-none text-lg font-semibold w-64"
              placeholder="文档标题"
            />
          </div>

          <div className="flex items-center gap-1">
            {/* 格式化按钮 */}
            <Button variant="ghost" size="icon" onClick={actions.bold} title="加粗 (Ctrl+B)">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={actions.italic} title="斜体 (Ctrl+I)">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={actions.strikethrough} title="删除线">
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={actions.code} title="行内代码">
              <Code className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* 标题按钮 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="标题">
                  <Heading1 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={actions.h1}>
                  <Heading1 className="h-4 w-4 mr-2" /> 一级标题
                </DropdownMenuItem>
                <DropdownMenuItem onClick={actions.h2}>
                  <Heading2 className="h-4 w-4 mr-2" /> 二级标题
                </DropdownMenuItem>
                <DropdownMenuItem onClick={actions.h3}>
                  <Heading3 className="h-4 w-4 mr-2" /> 三级标题
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 列表按钮 */}
            <Button variant="ghost" size="icon" onClick={actions.ul} title="无序列表">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={actions.ol} title="有序列表">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={actions.quote} title="引用">
              <Quote className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* 插入按钮 */}
            <Button variant="ghost" size="icon" onClick={actions.link} title="链接">
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={actions.image} title="图片">
              <Image className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={actions.codeBlock} title="代码块">
              <Code2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={actions.table} title="表格">
              <Table className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* 视图切换 */}
            <Button
              variant={mode === 'edit' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setMode('edit')}
              title="编辑模式"
            >
              <FileCode className="h-4 w-4" />
            </Button>
            <Button
              variant={mode === 'split' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setMode('split')}
              title="分屏模式"
            >
              <SplitSquareHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant={mode === 'preview' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setMode('preview')}
              title="预览模式"
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* 导入导出 */}
            <Button variant="ghost" size="icon" onClick={importFile} title="导入文件">
              <Upload className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="导出文件">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportFile('md')}>
                  <FileDown className="h-4 w-4 mr-2" /> 导出为 Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportFile('html')}>
                  <FileDown className="h-4 w-4 mr-2" /> 导出为 HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportFile('txt')}>
                  <FileDown className="h-4 w-4 mr-2" /> 导出为 TXT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 历史记录 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="历史记录">
                  <History className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="font-semibold">历史记录</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={saveToHistory}
                      className="h-7"
                    >
                      <Save className="h-3 w-3 mr-1" /> 保存
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearHistory}
                      className="h-7 text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> 清空
                    </Button>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {history.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    暂无历史记录
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    {history.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="flex flex-col items-start"
                      >
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 其他功能 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="切换主题">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="h-4 w-4 mr-2" /> 浅色模式
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="h-4 w-4 mr-2" /> 深色模式
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="h-4 w-4 mr-2" /> 跟随系统
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={copyContent} title="复制内容">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="全屏">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 主编辑区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 目录侧边栏 */}
        {toc.length > 0 && mode !== 'edit' && (
          <div className="w-64 border-r bg-card overflow-y-auto p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              目录
            </h3>
            <div className="space-y-1">
              {toc.map((item, index) => (
                <button
                  key={index}
                  className="block w-full text-left text-sm hover:bg-accent px-2 py-1 rounded transition-colors"
                  style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                  onClick={() => {
                    // 滚动到对应标题
                    const element = document.querySelector(
                      `[data-heading="${item.id}"]`
                    );
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 编辑器主体 */}
        <div className="flex-1 overflow-hidden">
          {mode === 'edit' && (
            <div className="h-full p-4">
              <Textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-full w-full resize-none border-0 focus-visible:ring-0 text-base leading-relaxed font-mono"
                placeholder="开始编写你的 Markdown 文档..."
              />
            </div>
          )}
          {mode === 'preview' && (
            <div className="h-full overflow-auto p-8 bg-card">
              <article 
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
              />
            </div>
          )}
          {mode === 'split' && (
            <div className="h-full grid grid-cols-2 gap-0">
              <div className="border-r p-4">
                <Textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="h-full w-full resize-none border-0 focus-visible:ring-0 text-base leading-relaxed font-mono"
                  placeholder="开始编写你的 Markdown 文档..."
                />
              </div>
              <div className="overflow-auto p-8 bg-card">
                <article 
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="border-t bg-card px-4 py-1 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>字符: {wordCount.chars}</span>
          <span>词数: {wordCount.words}</span>
          <span>行数: {wordCount.lines}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>自动保存已启用</span>
          <span>Markdown</span>
        </div>
      </div>
    </div>
  );
}
