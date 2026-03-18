/**
 * 增强 AI 面板组件
 * 支持多种 AI 功能：聊天、续写、润色、翻译等
 */

'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  FileText,
  Languages,
  PenLine,
  Expand,
  MessageSquare,
  Bot,
  User,
  ChevronDown,
  Settings2,
  Trash2,
  Volume2,
  StopCircle,
  Loader2,
  Zap,
  Target,
  BookOpen,
  Lightbulb,
  X,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { Kbd } from '@/components/ui/kbd';

// AI 功能类型
export type AIFeature = 
  | 'chat' 
  | 'continue' 
  | 'polish' 
  | 'expand' 
  | 'summarize' 
  | 'translate' 
  | 'rewrite'
  | 'fix'
  | 'outline'
  | 'title'
  | 'explain';

// AI 模型类型
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

// 聊天消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

// AI 功能定义
export interface AIFeatureDefinition {
  id: AIFeature;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresSelection?: boolean;
  supportsStreaming?: boolean;
  shortcut?: string;
}

// 预定义的 AI 功能
export const AI_FEATURES: AIFeatureDefinition[] = [
  {
    id: 'chat',
    name: 'AI 对话',
    description: '与 AI 讨论文档内容',
    icon: <MessageSquare className="h-4 w-4" />,
    supportsStreaming: true,
    shortcut: 'Ctrl+K',
  },
  {
    id: 'continue',
    name: '续写',
    description: 'AI 帮你继续写作',
    icon: <PenLine className="h-4 w-4" />,
    supportsStreaming: true,
    shortcut: 'Ctrl+Enter',
  },
  {
    id: 'polish',
    name: '润色',
    description: '优化文字表达',
    icon: <Sparkles className="h-4 w-4" />,
    requiresSelection: true,
    supportsStreaming: true,
  },
  {
    id: 'expand',
    name: '扩展',
    description: '扩展段落内容',
    icon: <Expand className="h-4 w-4" />,
    requiresSelection: true,
    supportsStreaming: true,
  },
  {
    id: 'summarize',
    name: '总结',
    description: '生成内容摘要',
    icon: <BookOpen className="h-4 w-4" />,
    supportsStreaming: true,
  },
  {
    id: 'translate',
    name: '翻译',
    description: '翻译选中文本',
    icon: <Languages className="h-4 w-4" />,
    requiresSelection: true,
    supportsStreaming: true,
  },
  {
    id: 'rewrite',
    name: '改写',
    description: '重新组织语言',
    icon: <Wand2 className="h-4 w-4" />,
    requiresSelection: true,
    supportsStreaming: true,
  },
  {
    id: 'fix',
    name: '修正',
    description: '修正语法错误',
    icon: <Target className="h-4 w-4" />,
    requiresSelection: true,
    supportsStreaming: true,
  },
  {
    id: 'outline',
    name: '大纲',
    description: '生成写作大纲',
    icon: <FileText className="h-4 w-4" />,
    supportsStreaming: true,
  },
  {
    id: 'title',
    name: '标题',
    description: '生成标题建议',
    icon: <Lightbulb className="h-4 w-4" />,
    supportsStreaming: true,
  },
  {
    id: 'explain',
    name: '解释',
    description: '解释选中的内容',
    icon: <BookOpen className="h-4 w-4" />,
    requiresSelection: true,
    supportsStreaming: true,
  },
];

// AI 面板属性
export interface EnhancedAIPanelProps {
  // 状态
  isOpen: boolean;
  onClose: () => void;
  activeFeature?: AIFeature;
  
  // 内容
  content: string;
  selection?: string;
  
  // 操作
  onApply: (result: string, feature: AIFeature) => void;
  onFeatureChange?: (feature: AIFeature) => void;
  
  // AI 调用
  onAIRequest: (
    feature: AIFeature,
    content: string,
    selection?: string,
    options?: AIRequestOptions
  ) => Promise<string | AsyncGenerator<string, void, unknown>>;
  
  // 配置
  models?: AIModel[];
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  
  // 样式
  position?: 'sidebar' | 'modal' | 'floating';
  width?: number;
}

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  language?: string;
}

// 流式文本渲染组件
interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  speed?: number;
}

const StreamingText = memo(function StreamingText({
  text,
  isStreaming,
}: StreamingTextProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <div className="whitespace-pre-wrap">{text}</div>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
      )}
    </div>
  );
});

// 聊天消息组件
interface ChatMessageItemProps {
  message: ChatMessage;
  onCopy: () => void;
  onApply?: () => void;
}

const ChatMessageItem = memo(function ChatMessageItem({
  message,
  onCopy,
  onApply,
}: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  }, [message.content, onCopy]);

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg ${
        message.role === 'user'
          ? 'bg-primary/10 ml-8'
          : 'bg-muted/50 mr-8'
      }`}
    >
      <div className="shrink-0">
        {message.role === 'user' ? (
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <StreamingText text={message.content} isStreaming={message.isStreaming || false} />
        {!message.isStreaming && (
          <div className="flex items-center gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
            {onApply && message.role === 'assistant' && (
              <Button variant="ghost" size="sm" onClick={onApply}>
                应用到文档
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// 主组件
export function EnhancedAIPanel({
  isOpen,
  onClose,
  activeFeature = 'chat',
  content,
  selection,
  onApply,
  onFeatureChange,
  onAIRequest,
  models = [],
  selectedModel,
  onModelChange,
  position = 'sidebar',
}: EnhancedAIPanelProps) {
  const [feature, setFeature] = useState<AIFeature>(activeFeature);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, result]);

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setFeature(activeFeature);
      setResult('');
      setIsStreaming(false);
    }
  }, [isOpen, activeFeature]);

  // 处理功能切换
  const handleFeatureChange = useCallback((newFeature: AIFeature) => {
    setFeature(newFeature);
    setResult('');
    setMessages([]);
    onFeatureChange?.(newFeature);
  }, [onFeatureChange]);

  // 发送聊天消息
  const handleSendChat = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await onAIRequest('chat', content, input.trim());
      
      if (typeof response === 'string') {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
          },
        ]);
      } else {
        // 流式响应
        let assistantContent = '';
        const assistantId = (Date.now() + 1).toString();
        
        setMessages(prev => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            isStreaming: true,
          },
        ]);

        for await (const chunk of response) {
          assistantContent += chunk;
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: assistantContent }
                : m
            )
          );
        }

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
      }
    } catch (error) {
      toast.error('AI 请求失败');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, content, onAIRequest]);

  // 执行 AI 功能
  const handleExecuteFeature = useCallback(async () => {
    if (isLoading) return;

    const featureDef = AI_FEATURES.find(f => f.id === feature);
    if (!featureDef) return;

    if (featureDef.requiresSelection && !selection) {
      toast.error('请先选中需要处理的文本');
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setResult('');

    try {
      const response = await onAIRequest(
        feature,
        content,
        selection,
        feature === 'translate' ? { language: targetLanguage } : undefined
      );

      if (typeof response === 'string') {
        setResult(response);
      } else {
        // 流式响应
        let fullResult = '';
        for await (const chunk of response) {
          fullResult += chunk;
          setResult(fullResult);
        }
      }
    } catch (error) {
      toast.error('AI 请求失败');
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [feature, content, selection, targetLanguage, isLoading, onAIRequest]);

  // 应用结果
  const handleApplyResult = useCallback(() => {
    if (result) {
      onApply(result, feature);
      toast.success('已应用到文档');
    }
  }, [result, feature, onApply]);

  // 渲染侧边栏模式
  if (position === 'sidebar') {
    return (
      <div
        className={`flex flex-col h-full border-l bg-background transition-all duration-300 ${
          isOpen ? 'w-80' : 'w-0'
        }`}
      >
        {isOpen && (
          <>
            {/* 头部 */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">AI 助手</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* 功能选择 */}
            <div className="p-3 border-b">
              <Select value={feature} onValueChange={(v) => handleFeatureChange(v as AIFeature)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_FEATURES.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex items-center gap-2">
                        {f.icon}
                        <span>{f.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 内容区 */}
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
              {feature === 'chat' ? (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      onCopy={() => {}}
                      onApply={() => onApply(msg.content, 'chat')}
                    />
                  ))}
                  {isLoading && messages.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {result ? (
                    <>
                      <StreamingText text={result} isStreaming={isStreaming} />
                      {!isStreaming && (
                        <div className="flex gap-2">
                          <Button onClick={handleApplyResult} className="flex-1">
                            <Check className="h-4 w-4 mr-2" />
                            应用
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleExecuteFeature}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>点击下方按钮开始</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* 输入区 */}
            <div className="p-3 border-t">
              {feature === 'chat' ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入消息..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Button
                  onClick={handleExecuteFeature}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  执行
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // 浮动模式
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 助手
          </DialogTitle>
          <DialogDescription>
            选择功能并执行 AI 操作
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* 功能选择 */}
          <div className="flex flex-wrap gap-2 pb-3 border-b">
            {AI_FEATURES.slice(0, 6).map((f) => (
              <Button
                key={f.id}
                variant={feature === f.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFeatureChange(f.id)}
                className="gap-2"
              >
                {f.icon}
                {f.name}
              </Button>
            ))}
          </div>

          {/* 内容 */}
          <ScrollArea className="flex-1 py-3">
            {feature === 'chat' ? (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    onCopy={() => {}}
                    onApply={() => onApply(msg.content, 'chat')}
                  />
                ))}
              </div>
            ) : (
              result && (
                <StreamingText text={result} isStreaming={isStreaming} />
              )
            )}
          </ScrollArea>

          {/* 输入 */}
          <div className="pt-3 border-t">
            {feature === 'chat' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入消息..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleExecuteFeature}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  执行
                </Button>
                {result && (
                  <Button onClick={handleApplyResult}>
                    <Check className="h-4 w-4 mr-2" />
                    应用
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EnhancedAIPanel;
