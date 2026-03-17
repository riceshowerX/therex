/**
 * AI 助手面板组件
 * 提供 AI 写作辅助功能
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Send,
  Wand2,
  FileText,
  List,
  Type,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  X,
  PenLine,
  FileSearch,
  GitBranch,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AIConfig } from '@/types';

// ==================== 类型定义 ====================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIPanelProps {
  // 状态
  isOpen: boolean;
  content: string;
  selection?: string;
  aiConfig: AIConfig | null;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  aiResult: string;
  aiLoading: boolean;
  aiAction: string;
  
  // 回调
  onClose: () => void;
  onChat: (message: string) => Promise<void>;
  onAIAction: (action: string, selection?: string) => Promise<void>;
  onApplyResult: (result: string, action: string) => void;
  onOpenSettings: () => void;
}

// ==================== AI 操作定义 ====================

interface AIAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  needsSelection?: boolean;
}

const AI_ACTIONS: AIAction[] = [
  {
    id: 'continue',
    label: '续写',
    icon: <PenLine className="h-4 w-4" />,
    description: '根据当前内容继续写作',
  },
  {
    id: 'polish',
    label: '润色',
    icon: <Sparkles className="h-4 w-4" />,
    description: '改进文本的表达和流畅度',
    needsSelection: true,
  },
  {
    id: 'expand',
    label: '扩展',
    icon: <GitBranch className="h-4 w-4" />,
    description: '添加更多细节和内容',
    needsSelection: true,
  },
  {
    id: 'summarize',
    label: '摘要',
    icon: <FileText className="h-4 w-4" />,
    description: '生成文档摘要',
  },
  {
    id: 'outline',
    label: '大纲',
    icon: <List className="h-4 w-4" />,
    description: '生成写作大纲',
  },
  {
    id: 'title',
    label: '标题',
    icon: <Type className="h-4 w-4" />,
    description: '生成标题建议',
  },
  {
    id: 'translate',
    label: '翻译',
    icon: <RefreshCw className="h-4 w-4" />,
    description: '翻译选中内容',
    needsSelection: true,
  },
  {
    id: 'rewrite',
    label: '改写',
    icon: <Wand2 className="h-4 w-4" />,
    description: '用不同方式表达相同内容',
    needsSelection: true,
  },
];

// ==================== 子组件 ====================

interface ActionButtonProps {
  action: AIAction;
  disabled: boolean;
  hasSelection: boolean;
  onClick: () => void;
}

function ActionButton({ action, disabled, hasSelection, onClick }: ActionButtonProps) {
  const isDisabled = disabled || (action.needsSelection && !hasSelection);
  
  return (
    <Button
      variant="outline"
      size="sm"
      className="justify-start h-auto py-2"
      disabled={isDisabled}
      onClick={onClick}
      title={action.needsSelection && !hasSelection ? '请先选中文本' : action.description}
    >
      {action.icon}
      <span className="ml-2">{action.label}</span>
    </Button>
  );
}

// ==================== 主组件 ====================

export function AIPanel({
  isOpen,
  content,
  selection,
  aiConfig,
  chatMessages,
  chatLoading,
  aiResult,
  aiLoading,
  aiAction,
  onClose,
  onChat,
  onAIAction,
  onApplyResult,
  onOpenSettings,
}: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<'actions' | 'chat'>('actions');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // 滚动到最新消息
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 发送消息
  const handleSend = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    const message = chatInput.trim();
    setChatInput('');
    await onChat(message);
  }, [chatInput, chatLoading, onChat]);

  // 复制结果
  const handleCopy = useCallback(async () => {
    if (!aiResult) return;
    await navigator.clipboard.writeText(aiResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('已复制到剪贴板');
  }, [aiResult]);

  // 应用结果
  const handleApply = useCallback(() => {
    if (!aiResult) return;
    onApplyResult(aiResult, aiAction);
  }, [aiResult, aiAction, onApplyResult]);

  if (!isOpen) return null;

  const hasSelection = !!selection && selection.length > 0;

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      {/* 头部 */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-medium">AI 助手</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 检查配置 */}
      {!aiConfig?.apiKey && (
        <div className="p-4 m-2 rounded-lg bg-muted text-sm">
          <p className="mb-2">请先配置 AI 服务</p>
          <Button size="sm" onClick={onOpenSettings}>
            前往设置
          </Button>
        </div>
      )}

      {aiConfig?.apiKey && (
        <>
          {/* 标签切换 */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <div className="px-3 pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="actions" className="flex-1 text-xs">
                  <Wand2 className="h-3 w-3 mr-1" />
                  快捷操作
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1 text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  对话
                </TabsTrigger>
              </TabsList>
            </div>

            {/* 快捷操作 */}
            <TabsContent value="actions" className="flex-1 flex flex-col mt-0">
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {/* 选中文本提示 */}
                  {hasSelection && (
                    <div className="p-2 rounded bg-muted text-xs">
                      <FileSearch className="h-3 w-3 inline mr-1" />
                      已选中 {selection.length} 个字符
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="grid grid-cols-2 gap-2">
                    {AI_ACTIONS.map((action) => (
                      <ActionButton
                        key={action.id}
                        action={action}
                        disabled={aiLoading}
                        hasSelection={hasSelection}
                        onClick={() => onAIAction(action.id, selection)}
                      />
                    ))}
                  </div>

                  {/* AI 结果 */}
                  {aiResult && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">结果</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleCopy}
                          >
                            {copied ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                        {aiResult}
                      </div>
                      <Button size="sm" className="w-full" onClick={handleApply}>
                        应用到文档
                      </Button>
                    </div>
                  )}

                  {/* 加载状态 */}
                  {aiLoading && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">
                        AI 正在处理...
                      </span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 对话模式 */}
            <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
              {/* 消息列表 */}
              <ScrollArea className="flex-1 p-3" ref={chatContainerRef}>
                <div className="space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>开始与 AI 对话</p>
                      <p className="text-xs mt-1">AI 可以帮你解答写作问题</p>
                    </div>
                  )}
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-2 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-2 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* 输入框 */}
              <div className="p-3 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={chatInputRef}
                    placeholder="输入消息..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!chatInput.trim() || chatLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
