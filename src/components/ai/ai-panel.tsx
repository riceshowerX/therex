'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  Wand2,
  MessageSquare,
  FileText,
  Languages,
  PenLine,
  Brain,
  Map,
  Image as ImageIcon,
  Lightbulb,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  Send,
  StopCircle,
  RefreshCw,
  Settings,
  Zap,
  BookOpen,
  Target,
  TrendingUp,
  X,
  Maximize2,
  Minimize2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useAI, useAIChat, AIAction } from '@/hooks/use-ai';
import { cn } from '@/lib/utils';

// AI 功能类型定义
type AIFunction = {
  id: AIAction;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'writing' | 'analysis' | 'generation' | 'translation' | 'assistant';
};

// AI 功能列表
const aiFunctions: AIFunction[] = [
  // 写作助手
  { id: 'continue', name: '智能续写', description: '根据上下文自动续写内容', icon: <PenLine className="h-4 w-4" />, category: 'writing' },
  { id: 'polish', name: '文本润色', description: '优化文本表达，使其更专业', icon: <Sparkles className="h-4 w-4" />, category: 'writing' },
  { id: 'expand', name: '内容扩展', description: '扩展选中文本，添加更多细节', icon: <TrendingUp className="h-4 w-4" />, category: 'writing' },
  { id: 'summarize', name: '智能摘要', description: '提取文档核心要点', icon: <FileText className="h-4 w-4" />, category: 'writing' },
  { id: 'complete', name: '智能补全', description: '预测并补全后续内容', icon: <Zap className="h-4 w-4" />, category: 'writing' },
  
  // 分析工具
  { id: 'analyze-style', name: '风格分析', description: '分析写作风格特点', icon: <Target className="h-4 w-4" />, category: 'analysis' },
  { id: 'optimize', name: '优化建议', description: '获取文本优化建议', icon: <Lightbulb className="h-4 w-4" />, category: 'analysis' },
  { id: 'deep-analysis', name: '深度分析', description: '深度分析内容逻辑和结构', icon: <Brain className="h-4 w-4" />, category: 'analysis' },
  
  // 生成工具
  { id: 'outline', name: '大纲生成', description: '根据主题生成写作大纲', icon: <BookOpen className="h-4 w-4" />, category: 'generation' },
  { id: 'generate-by-topic', name: '文档生成', description: '根据主题生成完整文档', icon: <FileText className="h-4 w-4" />, category: 'generation' },
  { id: 'mindmap', name: '思维导图', description: '生成思维导图（Mermaid 格式）', icon: <Map className="h-4 w-4" />, category: 'generation' },
  
  // 翻译
  { id: 'translate', name: '智能翻译', description: '翻译文本到目标语言', icon: <Languages className="h-4 w-4" />, category: 'translation' },
  
  // 智能助手
  { id: 'ask', name: '文档问答', description: '针对文档内容提问', icon: <MessageSquare className="h-4 w-4" />, category: 'assistant' },
  { id: 'chat', name: 'AI 对话', description: '与 AI 进行自由对话', icon: <MessageSquare className="h-4 w-4" />, category: 'assistant' },
  { id: 'analyze-image', name: '图像理解', description: '分析图像内容并生成描述', icon: <ImageIcon className="h-4 w-4" />, category: 'assistant' },
];

// 组件属性
interface AIPanelProps {
  content: string;
  selection?: string;
  onInsert?: (text: string) => void;
  onReplace?: (text: string) => void;
  className?: string;
}

export function AIPanel({
  content,
  selection,
  onInsert,
  onReplace,
  className,
}: AIPanelProps) {
  const [activeFunction, setActiveFunction] = useState<AIFunction | null>(null);
  const [activeTab, setActiveTab] = useState<string>('writing');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // AI Hook
  const { response, execute, stop, reset } = useAI();
  
  // AI 对话 Hook
  const {
    history,
    currentResponse,
    isLoading: chatLoading,
    sendMessage,
    stop: stopChat,
    clearHistory,
  } = useAIChat();
  
  // 附加选项
  const [targetLanguage, setTargetLanguage] = useState('中文');
  const [style, setStyle] = useState<'professional' | 'casual' | 'academic' | 'creative'>('professional');
  const [topic, setTopic] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  // 滚动区域引用
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response.content, currentResponse]);

  // 执行 AI 功能
  const handleExecute = useCallback(() => {
    if (!activeFunction) return;
    
    const baseParams = {
      action: activeFunction.id,
      content,
      selection,
      targetLanguage,
      style,
      topic,
      imageUrl,
    };
    
    execute(baseParams);
  }, [activeFunction, content, selection, targetLanguage, style, topic, imageUrl, execute]);

  // 发送对话消息
  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput, content);
    setChatInput('');
  }, [chatInput, content, sendMessage]);

  // 复制结果
  const handleCopy = useCallback(async () => {
    const textToCopy = response.content || currentResponse;
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [response.content, currentResponse]);

  // 插入结果
  const handleInsert = useCallback(() => {
    const textToInsert = response.content || currentResponse;
    if (textToInsert && onInsert) {
      onInsert(textToInsert);
    }
  }, [response.content, currentResponse, onInsert]);

  // 替换选中内容
  const handleReplace = useCallback(() => {
    const textToInsert = response.content || currentResponse;
    if (textToInsert && onReplace) {
      onReplace(textToInsert);
    }
  }, [response.content, currentResponse, onReplace]);

  // 按类别分组功能
  const categories = [
    { id: 'writing', name: '写作助手', icon: <PenLine className="h-4 w-4" /> },
    { id: 'analysis', name: '分析工具', icon: <Target className="h-4 w-4" /> },
    { id: 'generation', name: '生成工具', icon: <Wand2 className="h-4 w-4" /> },
    { id: 'translation', name: '翻译', icon: <Languages className="h-4 w-4" /> },
    { id: 'assistant', name: '智能助手', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  const filteredFunctions = aiFunctions.filter(f => f.category === activeTab);

  return (
    <div className={cn(
      'flex flex-col bg-background border rounded-lg',
      isExpanded ? 'fixed inset-4 z-50' : 'h-full',
      className
    )}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI 助手</span>
          <Badge variant="secondary" className="text-xs">Pro</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 功能标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-2">
          <TabsList className="h-10 w-full justify-start gap-1 bg-transparent">
            {categories.map(cat => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-primary/10 gap-1 text-xs px-2"
              >
                {cat.icon}
                <span className="hidden sm:inline">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* 功能选择 */}
          <div className="p-3 border-b">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredFunctions.map(func => (
                <Button
                  key={func.id}
                  variant={activeFunction?.id === func.id ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start h-auto py-2"
                  onClick={() => {
                    setActiveFunction(func);
                    reset();
                  }}
                >
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1">
                      {func.icon}
                      <span className="text-xs font-medium">{func.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {func.description}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* AI 对话模式 */}
          {activeFunction?.id === 'chat' ? (
            <div className="flex-1 flex flex-col">
              {/* 对话历史 */}
              <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                <div className="space-y-4">
                  {history.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {currentResponse && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted">
                        <div className="whitespace-pre-wrap">{currentResponse}</div>
                      </div>
                    </div>
                  )}
                  {chatLoading && !currentResponse && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* 输入区域 */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="输入消息..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    className="flex-1"
                  />
                  {chatLoading ? (
                    <Button variant="destructive" size="icon" onClick={stopChat}>
                      <StopCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="icon" onClick={handleSendChat} disabled={!chatInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex justify-between mt-2">
                  <Button variant="ghost" size="sm" onClick={clearHistory}>
                    清空对话
                  </Button>
                </div>
              </div>
            </div>
          ) : activeFunction ? (
            <div className="flex-1 flex flex-col">
              {/* 选项区域 */}
              <div className="p-3 border-b space-y-2">
                {/* 翻译目标语言 */}
                {activeFunction.id === 'translate' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">目标语言：</span>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="中文">中文</SelectItem>
                        <SelectItem value="英文">英文</SelectItem>
                        <SelectItem value="日文">日文</SelectItem>
                        <SelectItem value="韩文">韩文</SelectItem>
                        <SelectItem value="法文">法文</SelectItem>
                        <SelectItem value="德文">德文</SelectItem>
                        <SelectItem value="西班牙文">西班牙文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 风格选择 */}
                {['polish', 'generate-by-topic', 'outline'].includes(activeFunction.id) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">风格：</span>
                    <Select value={style} onValueChange={(v) => setStyle(v as typeof style)}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">专业</SelectItem>
                        <SelectItem value="casual">轻松</SelectItem>
                        <SelectItem value="academic">学术</SelectItem>
                        <SelectItem value="creative">创意</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 主题输入 */}
                {['outline', 'generate-by-topic'].includes(activeFunction.id) && (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="输入主题..."
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      className="flex-1 h-8"
                    />
                  </div>
                )}

                {/* 图片URL */}
                {['analyze-image', 'image-description'].includes(activeFunction.id) && (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="输入图片 URL..."
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      className="flex-1 h-8"
                    />
                  </div>
                )}

                {/* 执行按钮 */}
                <div className="flex gap-2">
                  {response.isLoading ? (
                    <Button variant="destructive" className="flex-1" onClick={stop}>
                      <StopCircle className="h-4 w-4 mr-2" />
                      停止生成
                    </Button>
                  ) : (
                    <Button className="flex-1" onClick={handleExecute}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      生成
                    </Button>
                  )}
                </div>
              </div>

              {/* 结果区域 */}
              <ScrollArea className="flex-1 p-3">
                {response.error && (
                  <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                    {response.error}
                  </div>
                )}
                
                {response.content ? (
                  <div className="space-y-3">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm">{response.content}</div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        复制
                      </Button>
                      {onInsert && (
                        <Button variant="outline" size="sm" onClick={handleInsert}>
                          插入
                        </Button>
                      )}
                      {selection && onReplace && (
                        <Button variant="outline" size="sm" onClick={handleReplace}>
                          替换选中
                        </Button>
                      )}
                      <div className="flex-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : response.isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">AI 正在生成...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">选择功能后点击生成</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center p-4">
                <Wand2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">选择一个 AI 功能</p>
                <p className="text-sm mt-1">开始智能写作之旅</p>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

// 导出简化版本
export default AIPanel;
