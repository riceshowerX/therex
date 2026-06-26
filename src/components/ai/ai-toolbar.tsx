'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  PenLine,
  FileText,
  Languages,
  Brain,
  Map,
  Image as ImageIcon,
  Lightbulb,
  Wand2,
  MessageSquare,
  Zap,
  Target,
  TrendingUp,
  BookOpen,
  Copy,
  Settings,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useAI, AIAction } from '@/hooks/use-ai';
import { AIPanel } from './ai-panel';
import { cn } from '@/lib/utils';

// 快捷 AI 功能
const quickActions = [
  { id: 'continue', name: '续写', icon: <PenLine className="h-4 w-4" /> },
  { id: 'polish', name: '润色', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'summarize', name: '摘要', icon: <FileText className="h-4 w-4" /> },
  { id: 'translate', name: '翻译', icon: <Languages className="h-4 w-4" /> },
];

// 所有 AI 功能
const allActions = {
  writing: {
    name: '写作助手',
    items: [
      { id: 'continue', name: '智能续写', icon: <PenLine className="h-4 w-4" /> },
      { id: 'polish', name: '文本润色', icon: <Sparkles className="h-4 w-4" /> },
      { id: 'expand', name: '内容扩展', icon: <TrendingUp className="h-4 w-4" /> },
      { id: 'summarize', name: '智能摘要', icon: <FileText className="h-4 w-4" /> },
      { id: 'complete', name: '智能补全', icon: <Zap className="h-4 w-4" /> },
    ],
  },
  analysis: {
    name: '分析工具',
    items: [
      { id: 'analyze-style', name: '风格分析', icon: <Target className="h-4 w-4" /> },
      { id: 'optimize', name: '优化建议', icon: <Lightbulb className="h-4 w-4" /> },
      { id: 'deep-analysis', name: '深度分析', icon: <Brain className="h-4 w-4" /> },
    ],
  },
  generation: {
    name: '生成工具',
    items: [
      { id: 'outline', name: '大纲生成', icon: <BookOpen className="h-4 w-4" /> },
      { id: 'generate-by-topic', name: '文档生成', icon: <FileText className="h-4 w-4" /> },
      { id: 'mindmap', name: '思维导图', icon: <Map className="h-4 w-4" /> },
    ],
  },
  assistant: {
    name: '智能助手',
    items: [
      { id: 'ask', name: '文档问答', icon: <MessageSquare className="h-4 w-4" /> },
      { id: 'chat', name: 'AI 对话', icon: <MessageSquare className="h-4 w-4" /> },
      { id: 'analyze-image', name: '图像理解', icon: <ImageIcon className="h-4 w-4" /> },
    ],
  },
};

// 组件属性
interface AIToolbarProps {
  content: string;
  selection?: string;
  onInsert?: (text: string) => void;
  onReplace?: (text: string) => void;
  className?: string;
  compact?: boolean;
}

export function AIToolbar({
  content,
  selection,
  onInsert,
  onReplace,
  className,
  compact = false,
}: AIToolbarProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  
  // AI Hook
  const { response, execute, stop, reset } = useAI();

  // 执行快捷操作
  const handleQuickAction = useCallback((actionId: AIAction) => {
    setActiveAction(actionId);
    execute({
      action: actionId,
      content,
      selection,
    });
  }, [content, selection, execute]);

  // 插入结果
  const handleInsert = useCallback(() => {
    if (response.content && onInsert) {
      onInsert(response.content);
      reset();
    }
  }, [response.content, onInsert, reset]);

  // 替换选中内容
  const handleReplace = useCallback(() => {
    if (response.content && onReplace) {
      onReplace(response.content);
      reset();
    }
  }, [response.content, onReplace, reset]);

  if (compact) {
    return (
      <>
        <div className={cn('flex items-center gap-1', className)}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {Object.entries(allActions).map(([key, category]) => (
                <DropdownMenuSub key={key}>
                  <DropdownMenuSubTrigger>
                    {category.items[0].icon}
                    <span className="ml-2">{category.name}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {category.items.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => handleQuickAction(item.id as AIAction)}
                      >
                        {item.icon}
                        <span className="ml-2">{item.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowPanel(true)}>
                <Wand2 className="h-4 w-4" />
                <span className="ml-2">打开 AI 面板</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* AI 面板弹窗 */}
        <Dialog open={showPanel} onOpenChange={setShowPanel}>
          <DialogContent className="max-w-2xl h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI 助手
              </DialogTitle>
            </DialogHeader>
            <AIPanel
              content={content}
              selection={selection}
              onInsert={onInsert}
              onReplace={onReplace}
              className="h-full"
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        {/* 快捷按钮 */}
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => handleQuickAction(action.id as AIAction)}
            disabled={response.isLoading}
          >
            {action.icon}
            <span className="hidden md:inline">{action.name}</span>
          </Button>
        ))}

        {/* 更多功能 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Wand2 className="h-4 w-4" />
              <span className="hidden md:inline">更多</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {Object.entries(allActions).map(([key, category]) => (
              <DropdownMenuSub key={key}>
                <DropdownMenuSubTrigger>
                  {category.items[0].icon}
                  <span className="ml-2">{category.name}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {category.items.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleQuickAction(item.id as AIAction)}
                    >
                      {item.icon}
                      <span className="ml-2">{item.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowPanel(true)}>
              <Settings className="h-4 w-4" />
              <span className="ml-2">打开 AI 面板</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 面板按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPanel(true)}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      {/* 结果预览弹窗 */}
      {(response.isLoading || response.content || response.error) && activeAction && (
        <Dialog open onOpenChange={() => { reset(); setActiveAction(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {quickActions.find(a => a.id === activeAction)?.icon || <Sparkles className="h-5 w-5" />}
                {quickActions.find(a => a.id === activeAction)?.name || 'AI 处理'}
              </DialogTitle>
            </DialogHeader>
            
            {response.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">AI 正在处理...</span>
                </div>
              </div>
            ) : response.error ? (
              <div className="bg-destructive/10 text-destructive rounded-lg p-4">
                {response.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{response.content}</div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(response.content || '')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    复制
                  </Button>
                  {onInsert && (
                    <Button size="sm" onClick={handleInsert}>
                      插入
                    </Button>
                  )}
                  {selection && onReplace && (
                    <Button size="sm" onClick={handleReplace}>
                      替换选中
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {response.isLoading && (
              <Button
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={stop}
              >
                停止生成
              </Button>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* AI 面板弹窗 */}
      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="max-w-2xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 助手
            </DialogTitle>
          </DialogHeader>
          <AIPanel
            content={content}
            selection={selection}
            onInsert={onInsert}
            onReplace={onReplace}
            className="h-full"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AIToolbar;
