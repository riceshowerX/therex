'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertCircle,
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
  CheckSquare,
  Minus,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Star,
  StarOff,
  FilePlus,
  Search,
  Replace,
  Undo,
  Redo,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  FileSearch,
  Tags,
  MoreHorizontal,
  Folder,
  Layout,
  Wand2,
  File,
  BookOpen,
  X,
  Check,
  Loader2,
  PenLine,
  FileEdit,
  FileType,
  MessageSquare,
  ListTree,
  Heading,
  HelpCircle,
  RefreshCw,
  FolderPlus,
  FolderTree,
  FolderCog,
  ArrowRight,
  GitBranch,
  RotateCcw as Restore,
  Keyboard,
  Send,
  Plus,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { documentManager, type Document, type Folder as FolderType, type DocumentVersion } from '@/lib/document-manager';
import { templates, templateCategories, getTemplatesByCategory, getTemplateById } from '@/lib/templates';
import { aiConfigManager } from '@/lib/ai-config';

// 动态导入编辑器组件
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full">加载编辑器...</div> }
);

// 历史记录接口
interface HistoryState {
  content: string;
  timestamp: number;
}

// 快捷键定义
const SHORTCUTS = [
  { key: 'Ctrl/Cmd + S', description: '保存文档' },
  { key: 'Ctrl/Cmd + Z', description: '撤销' },
  { key: 'Ctrl/Cmd + Shift + Z', description: '重做' },
  { key: 'Ctrl/Cmd + F', description: '查找替换' },
  { key: 'Ctrl/Cmd + B', description: '加粗' },
  { key: 'Ctrl/Cmd + I', description: '斜体' },
  { key: 'Ctrl/Cmd + K', description: '插入链接' },
  { key: 'Ctrl/Cmd + Shift + C', description: '插入代码块' },
  { key: 'Ctrl/Cmd + /', description: '插入注释' },
  { key: 'Ctrl/Cmd + Shift + S', description: '保存版本' },
];

export default function MarkdownEditor() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // 文档状态
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  
  // 文件夹状态
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // 版本历史状态
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  
  // AI 对话状态
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // 快捷键面板
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // AI 配置提示
  const [showAIConfigAlert, setShowAIConfigAlert] = useState(false);
  const [aiConfigAlertAction, setAIConfigAlertAction] = useState<string>('');
  
  // 编辑器状态
  const [mode, setMode] = useState<'edit' | 'preview' | 'live'>('live');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  
  // UI 状态
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'documents' | 'folders'>('documents');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  
  // 撤销/重做
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  
  // 统计
  const [wordCount, setWordCount] = useState({ chars: 0, words: 0, lines: 0 });
  const [readingTime, setReadingTime] = useState(0);
  
  // 目录
  const [toc, setToc] = useState<{ level: number; text: string; id: string }[]>([]);
  
  // AI 助手
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiAction, setAiAction] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 初始化
  useEffect(() => {
    const docs = documentManager.getAllDocuments();
    setDocuments(docs);
    
    const foldersData = documentManager.getAllFolders();
    setFolders(foldersData);
    
    const current = documentManager.getCurrentDocument();
    if (current) {
      setCurrentDoc(current);
      setContent(current.content);
      setTitle(current.title);
      setCurrentFolderId(current.folderId);
      setVersions(current.versions || []);
    } else {
      handleCreateDocument();
    }
  }, []);

  // 自动保存版本（每 5 分钟）
  useEffect(() => {
    if (!currentDoc) return;
    
    const interval = setInterval(() => {
      const savedVersion = documentManager.autoSaveVersion(currentDoc.id);
      if (savedVersion) {
        setVersions(documentManager.getVersionHistory(currentDoc.id));
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentDoc]);

  // 保存当前文档
  useEffect(() => {
    if (!currentDoc || isUndoRedo) return;
    
    const timer = setTimeout(() => {
      documentManager.updateDocument(currentDoc.id, { title, content });
      setDocuments(documentManager.getAllDocuments());
    }, 500);
    
    return () => clearTimeout(timer);
  }, [title, content, currentDoc, isUndoRedo]);

  // 记录撤销历史
  useEffect(() => {
    if (isUndoRedo) {
      setIsUndoRedo(false);
      return;
    }
    
    if (content) {
      setUndoStack(prev => {
        const newStack = [...prev, { content, timestamp: Date.now() }];
        return newStack.slice(-50); // 保留最近 50 条
      });
      setRedoStack([]); // 清空重做栈
    }
  }, [content, isUndoRedo]);

  // 统计
  useEffect(() => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    setWordCount({ chars, words, lines });
    
    // 阅读时间（按 200 字/分钟计算）
    setReadingTime(Math.ceil(words / 200));
  }, [content]);

  // 目录
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

  // 创建新文档
  const handleCreateDocument = useCallback((templateId?: string, _folderId?: string | null, specificFolderId?: string | null) => {
    const template = templateId ? getTemplateById(templateId) : null;
    const folderId = specificFolderId !== undefined ? specificFolderId : currentFolderId;
    const doc = documentManager.createDocument(
      template?.name || 'Untitled',
      template?.content || '',
      folderId
    );
    setCurrentDoc(doc);
    setContent(doc.content);
    setTitle(doc.title);
    setCurrentFolderId(folderId);
    setDocuments(documentManager.getAllDocuments());
    setUndoStack([]);
    setRedoStack([]);
    setShowTemplates(false);
    toast.success('已创建新文档');
  }, [currentFolderId]);

  // 切换文档
  const handleSwitchDocument = useCallback((docId: string) => {
    const doc = documentManager.setCurrentDocument(docId);
    if (doc) {
      setCurrentDoc(doc);
      setContent(doc.content);
      setTitle(doc.title);
      setCurrentFolderId(doc.folderId);
      setVersions(doc.versions || []);
      setUndoStack([]);
      setRedoStack([]);
      setDocuments(documentManager.getAllDocuments());
    }
  }, []);

  // 删除文档
  const handleDeleteDocument = useCallback(() => {
    if (!docToDelete) return;
    
    documentManager.deleteDocument(docToDelete);
    const docs = documentManager.getAllDocuments();
    setDocuments(docs);
    
    if (currentDoc?.id === docToDelete) {
      if (docs.length > 0) {
        handleSwitchDocument(docs[0].id);
      } else {
        handleCreateDocument();
      }
    }
    
    setShowDeleteDialog(false);
    setDocToDelete(null);
    toast.success('文档已删除');
  }, [docToDelete, currentDoc, handleSwitchDocument, handleCreateDocument]);

  // 复制文档
  const handleDuplicateDocument = useCallback((docId: string) => {
    const newDoc = documentManager.duplicateDocument(docId);
    if (newDoc) {
      setDocuments(documentManager.getAllDocuments());
      handleSwitchDocument(newDoc.id);
      toast.success('文档已复制');
    }
  }, [handleSwitchDocument]);

  // 切换收藏
  const handleToggleFavorite = useCallback((docId: string) => {
    documentManager.toggleFavorite(docId);
    setDocuments(documentManager.getAllDocuments());
    if (currentDoc?.id === docId) {
      setCurrentDoc(documentManager.getDocument(docId) || null);
    }
  }, [currentDoc]);

  // ==================== 文件夹操作 ====================

  // 创建文件夹
  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) {
      toast.error('请输入文件夹名称');
      return;
    }
    
    const folder = documentManager.createFolder(newFolderName.trim(), currentFolderId);
    setFolders(documentManager.getAllFolders());
    setNewFolderName('');
    setShowNewFolderDialog(false);
    toast.success('文件夹创建成功');
  }, [newFolderName, currentFolderId]);

  // 删除文件夹
  const handleDeleteFolder = useCallback((folderId: string) => {
    documentManager.deleteFolder(folderId, 'root');
    setFolders(documentManager.getAllFolders());
    setDocuments(documentManager.getAllDocuments());
    if (currentFolderId === folderId) {
      setCurrentFolderId(null);
    }
    toast.success('文件夹已删除');
  }, [currentFolderId]);

  // 重命名文件夹
  const handleRenameFolder = useCallback((folderId: string, newName: string) => {
    documentManager.updateFolder(folderId, { name: newName });
    setFolders(documentManager.getAllFolders());
    toast.success('文件夹已重命名');
  }, []);

  // 切换文件夹展开状态
  const toggleFolderExpand = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  // 移动文档到文件夹
  const handleMoveDocument = useCallback((docId: string, folderId: string | null) => {
    documentManager.moveDocumentToFolder(docId, folderId);
    setDocuments(documentManager.getAllDocuments());
    if (currentDoc?.id === docId) {
      setCurrentDoc(documentManager.getDocument(docId) || null);
      setCurrentFolderId(folderId);
    }
    toast.success('文档已移动');
  }, [currentDoc]);

  // 获取文件夹中的文档
  const getDocumentsInFolder = useCallback((folderId: string | null) => {
    return documents.filter(doc => doc.folderId === folderId);
  }, [documents]);

  // ==================== 版本历史操作 ====================

  // 保存当前版本
  const handleSaveVersion = useCallback(() => {
    if (!currentDoc) return;
    
    const version = documentManager.saveVersion(currentDoc.id, 'Manual save');
    if (version) {
      setVersions(documentManager.getVersionHistory(currentDoc.id));
      toast.success('版本已保存');
    }
  }, [currentDoc]);

  // 恢复到指定版本
  const handleRestoreVersion = useCallback((versionId: string) => {
    if (!currentDoc) return;
    
    const restored = documentManager.restoreVersion(currentDoc.id, versionId);
    if (restored) {
      setContent(restored.content);
      setTitle(restored.title);
      setVersions(documentManager.getVersionHistory(currentDoc.id));
      setShowVersionHistory(false);
      toast.success('已恢复到指定版本');
    }
  }, [currentDoc]);

  // 删除版本
  const handleDeleteVersion = useCallback((versionId: string) => {
    if (!currentDoc) return;
    
    documentManager.deleteVersion(currentDoc.id, versionId);
    setVersions(documentManager.getVersionHistory(currentDoc.id));
    toast.success('版本已删除');
  }, [currentDoc]);

  // ==================== AI 对话模式 ====================

  // 检查 AI 配置
  const checkAIConfig = useCallback((action: string): boolean => {
    const config = aiConfigManager.getConfig();
    if (!config.apiKey) {
      setAIConfigAlertAction(action);
      setShowAIConfigAlert(true);
      return false;
    }
    return true;
  }, []);

  // 打开 AI 对话时检查配置
  const handleOpenAIChat = useCallback(() => {
    if (!checkAIConfig('chat')) return;
    setShowAIChat(true);
  }, [checkAIConfig]);

  // 发送对话消息
  const handleSendChatMessage = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    // 检查 AI 配置
    if (!checkAIConfig('chat')) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    const config = aiConfigManager.getConfig();

    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          content,
          selection: '',
          chatHistory: chatMessages,
          userMessage,
          config: config.apiKey ? {
            provider: config.provider,
            apiKey: config.apiKey,
            apiEndpoint: config.apiEndpoint,
            model: config.model,
          } : undefined,
        }),
      });

      if (!response.ok) throw new Error('AI 服务请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantMessage += parsed.content;
                  // 实时更新最后一条消息
                  setChatMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages[newMessages.length - 1]?.role === 'assistant') {
                      newMessages[newMessages.length - 1].content = assistantMessage;
                    } else {
                      newMessages.push({ role: 'assistant', content: assistantMessage });
                    }
                    return newMessages;
                  });
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI 服务暂时不可用。' }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, content, chatMessages]);

  // 应用对话结果
  const applyChatResult = useCallback((messageContent: string) => {
    setContent(content + '\n\n' + messageContent);
    toast.success('已应用 AI 回复');
  }, [content]);

  // 滚动到聊天底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // AI 写作助手
  const handleAIAssist = useCallback(async (action: string, selection?: string) => {
    // 检查 AI 配置
    if (!checkAIConfig(action)) return;
    
    setAiLoading(true);
    setAiResult('');
    setAiAction(action);
    setShowAIPanel(true);

    // 获取最新的 AI 配置
    const config = aiConfigManager.getConfig();

    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          content,
          selection: selection || '',
          config: config.apiKey ? {
            provider: config.provider,
            apiKey: config.apiKey,
            apiEndpoint: config.apiEndpoint,
            model: config.model,
          } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('AI 服务请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  setAiResult(prev => prev + parsed.content);
                }
                if (parsed.error) {
                  toast.error(parsed.error);
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('AI assist error:', error);
      toast.error('AI 服务暂时不可用');
    } finally {
      setAiLoading(false);
    }
  }, [content]);

  // 应用 AI 结果
  const applyAIResult = useCallback(() => {
    if (!aiResult) return;
    
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      // 如果有选中文本，替换选中内容
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + aiResult + content.substring(end);
      setContent(newContent);
    } else {
      // 否则追加到光标位置或文档末尾
      if (aiAction === 'continue') {
        setContent(content + '\n\n' + aiResult);
      } else if (aiAction === 'outline' || aiAction === 'summarize' || aiAction === 'title') {
        // 对于生成大纲/摘要/标题，添加到文档开头
        setContent(aiResult + '\n\n---\n\n' + content);
      } else {
        setContent(content + aiResult);
      }
    }
    
    setShowAIPanel(false);
    setAiResult('');
    toast.success('已应用 AI 生成内容');
  }, [aiResult, content, aiAction]);

  // 撤销
  const handleUndo = useCallback(() => {
    if (undoStack.length <= 1) return;
    
    const currentState = undoStack[undoStack.length - 1];
    const previousState = undoStack[undoStack.length - 2];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    setIsUndoRedo(true);
    setContent(previousState.content);
  }, [undoStack]);

  // 重做
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, nextState]);
    setIsUndoRedo(true);
    setContent(nextState.content);
  }, [redoStack]);

  // 查找替换
  const handleReplace = useCallback(() => {
    if (!searchQuery) return;
    
    // 转义正则表达式特殊字符
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'g');
    const matches = content.match(regex);
    const count = matches ? matches.length : 0;
    
    if (count === 0) {
      toast.info('未找到匹配内容');
      return;
    }
    
    const newContent = content.replace(regex, replaceQuery);
    setContent(newContent);
    toast.success(`已替换 ${count} 处`);
  }, [content, searchQuery, replaceQuery]);

  // 查找下一个
  const handleFindNext = useCallback(() => {
    if (!searchQuery) return;
    
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
    if (!textarea) {
      toast.info('请先聚焦编辑器');
      return;
    }
    
    const text = textarea.value;
    const start = textarea.selectionEnd;
    // 使用普通字符串查找，而不是正则
    const index = text.indexOf(searchQuery, start);
    
    if (index !== -1) {
      textarea.focus();
      textarea.setSelectionRange(index, index + searchQuery.length);
    } else {
      // 从头开始查找
      const indexFromStart = text.indexOf(searchQuery);
      if (indexFromStart !== -1) {
        textarea.focus();
        textarea.setSelectionRange(indexFromStart, indexFromStart + searchQuery.length);
      } else {
        toast.info('未找到匹配内容');
      }
    }
  }, [searchQuery]);

  // 导出功能
  const exportFile = useCallback(
    (format: 'md' | 'html' | 'txt' | 'pdf') => {
      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'md':
          blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
          filename = `${title}.md`;
          saveAs(blob, filename);
          break;
        case 'html':
          const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css">
  <style>
    body { box-sizing: border-box; max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    .markdown-body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body class="markdown-body">
${content}
</body>
</html>`;
          blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          filename = `${title}.html`;
          saveAs(blob, filename);
          break;
        case 'txt':
          blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
          filename = `${title}.txt`;
          saveAs(blob, filename);
          break;
        case 'pdf':
          // PDF 导出通过打印实现
          window.print();
          return;
      }

      toast.success(`已导出为 ${format.toUpperCase()} 文件`);
    },
    [content, title]
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
        handleCreateDocument();
        setContent(text);
        setTitle(file.name.replace(/\.(md|txt|markdown)$/, ''));
        toast.success('文件导入成功');
      };
      reader.readAsText(file);
    };
    input.click();
  }, [handleCreateDocument]);

  // 字体调整
  const adjustFontSize = useCallback((delta: number) => {
    setFontSize((prev) => Math.max(10, Math.min(24, prev + delta)));
  }, []);

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

  // 复制内容
  const copyContent = useCallback(() => {
    navigator.clipboard.writeText(content);
    toast.success('已复制到剪贴板');
  }, [content]);

  // 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'f') {
          e.preventDefault();
          setShowSearchReplace(prev => !prev);
        } else if (e.key === 's') {
          e.preventDefault();
          if (e.shiftKey) {
            handleSaveVersion();
          } else {
            toast.success('文档已自动保存');
          }
        } else if (e.key === 'h') {
          e.preventDefault();
          setShowShortcuts(prev => !prev);
        } else if (e.key === 'k') {
          e.preventDefault();
          // 如果当前是关闭状态，需要检查配置后再打开
          if (!showAIChat) {
            handleOpenAIChat();
          } else {
            setShowAIChat(false);
          }
        } else if (e.key === '/') {
          e.preventDefault();
          setShowShortcuts(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleSaveVersion, showAIChat, handleOpenAIChat]);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div ref={containerRef} className="h-screen flex bg-background print:bg-white">
      {/* 侧边栏 - 文档列表 */}
      {showSidebar && (
        <div className="w-64 border-r bg-card flex flex-col print:hidden">
          {/* 侧边栏头部 */}
          <div className="p-3 border-b flex items-center justify-between">
            <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as 'documents' | 'folders')} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="documents" className="flex-1 text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  文档
                </TabsTrigger>
                <TabsTrigger value="folders" className="flex-1 text-xs">
                  <FolderTree className="h-3 w-3 mr-1" />
                  文件夹
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* 文档列表 */}
          {sidebarTab === 'documents' && (
            <>
              <div className="p-2 border-b flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start"
                  onClick={() => setShowTemplates(true)}
                >
                  <Layout className="h-4 w-4 mr-2" />
                  从模板新建
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCreateDocument()}
                  title="新建文档"
                >
                  <FilePlus className="h-4 w-4" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {/* 收藏的文档 */}
                  {documentManager.getFavoriteDocuments().length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                        <Star className="h-3 w-3" />
                        收藏
                      </div>
                      {documentManager.getFavoriteDocuments().map((doc) => (
                        <div
                          key={doc.id}
                          className={`group flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                            currentDoc?.id === doc.id
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/50'
                          }`}
                          onClick={() => handleSwitchDocument(doc.id)}
                        >
                          <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium truncate">{doc.title}</span>
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(doc.updatedAt)} · {doc.wordCount} 词
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 所有文档 */}
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`group flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        currentDoc?.id === doc.id
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleSwitchDocument(doc.id)}
                    >
                      <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate">{doc.title}</span>
                          {doc.isFavorite && (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatTime(doc.updatedAt)}</span>
                          <span>·</span>
                          <span>{doc.wordCount} 词</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleToggleFavorite(doc.id)}>
                            {doc.isFavorite ? (
                              <>
                                <StarOff className="h-4 w-4 mr-2" /> 取消收藏
                              </>
                            ) : (
                              <>
                                <Star className="h-4 w-4 mr-2" /> 收藏
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateDocument(doc.id)}>
                            <Copy className="h-4 w-4 mr-2" /> 复制
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Folder className="h-4 w-4 mr-2" /> 移动到文件夹
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleMoveDocument(doc.id, null)}>
                                <FileText className="h-4 w-4 mr-2" /> 根目录
                              </DropdownMenuItem>
                              {folders.map((folder) => (
                                <DropdownMenuItem 
                                  key={folder.id}
                                  onClick={() => handleMoveDocument(doc.id, folder.id)}
                                >
                                  <FolderOpen className="h-4 w-4 mr-2" /> {folder.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDocToDelete(doc.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> 删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
          
          {/* 文件夹视图 */}
          {sidebarTab === 'folders' && (
            <>
              <div className="p-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowNewFolderDialog(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  新建文件夹
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {/* 根目录 */}
                  <div
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                      currentFolderId === null
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => {
                      setCurrentFolderId(null);
                      // 显示根目录下的文档
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">所有文档</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {documents.length}
                    </Badge>
                  </div>
                  
                  {/* 文件夹列表 */}
                  {folders.map((folder) => {
                    const docsInFolder = getDocumentsInFolder(folder.id);
                    return (
                      <div key={folder.id} className="space-y-1">
                        <div
                          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                            currentFolderId === folder.id
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/50'
                          }`}
                          onClick={() => {
                            setCurrentFolderId(folder.id);
                            toggleFolderExpand(folder.id);
                          }}
                        >
                          <FolderOpen className="h-4 w-4" style={{ color: folder.color }} />
                          <span className="text-sm flex-1 truncate">{folder.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {docsInFolder.length}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCreateDocument(undefined, undefined, folder.id)}>
                                <FilePlus className="h-4 w-4 mr-2" /> 新建文档
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FolderCog className="h-4 w-4 mr-2" /> 重命名
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteFolder(folder.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> 删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* 展开显示文件夹内的文档 */}
                        {expandedFolders.has(folder.id) && docsInFolder.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {docsInFolder.map((doc) => (
                              <div
                                key={doc.id}
                                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                  currentDoc?.id === doc.id
                                    ? 'bg-accent text-accent-foreground'
                                    : 'hover:bg-accent/50'
                                }`}
                                onClick={() => handleSwitchDocument(doc.id)}
                              >
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs truncate">{doc.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
          
          {/* 侧边栏底部 */}
          <div className="p-3 border-t space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{documents.length} 个文档</span>
              <span>
                {documents.reduce((sum, doc) => sum + doc.wordCount, 0).toLocaleString()} 词
              </span>
            </div>
            
            {/* 版本历史按钮 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowVersionHistory(true)}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              版本历史
              {versions.length > 0 && (
                <Badge variant="secondary" className="ml-auto">{versions.length}</Badge>
              )}
            </Button>
            
            {/* AI 对话按钮 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleOpenAIChat}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              AI 对话
            </Button>
            
            {/* 快捷键按钮 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowShortcuts(true)}
            >
              <Keyboard className="h-4 w-4 mr-2" />
              快捷键
            </Button>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="border-b bg-card px-4 py-2 print:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* 侧边栏切换 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                title="切换侧边栏"
              >
                {showSidebar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              {/* 文档标题 */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-none shadow-none text-lg font-semibold w-48 focus-visible:ring-0"
                placeholder="文档标题"
              />
              
              {/* 收藏按钮 */}
              {currentDoc && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleFavorite(currentDoc.id)}
                  title={currentDoc.isFavorite ? '取消收藏' : '收藏'}
                >
                  {currentDoc.isFavorite ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {/* 撤销/重做 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={undoStack.length <= 1}
                title="撤销 (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="重做 (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* 查找替换 */}
              <Button
                variant={showSearchReplace ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setShowSearchReplace(!showSearchReplace)}
                title="查找替换 (Ctrl+F)"
              >
                <Search className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* AI 写作助手 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="AI 写作助手">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI 写作助手
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAIAssist('continue')}>
                    <PenLine className="h-4 w-4 mr-2" />
                    续写内容
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAssist('polish')}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    润色文本
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAssist('expand')}>
                    <FileEdit className="h-4 w-4 mr-2" />
                    扩展内容
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAssist('rewrite')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    改写内容
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAIAssist('summarize')}>
                    <FileText className="h-4 w-4 mr-2" />
                    生成摘要
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAssist('outline')}>
                    <ListTree className="h-4 w-4 mr-2" />
                    生成大纲
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAssist('title')}>
                    <Heading className="h-4 w-4 mr-2" />
                    生成标题
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAIAssist('translate')}>
                    <FileType className="h-4 w-4 mr-2" />
                    翻译文本
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAssist('fix')}>
                    <Check className="h-4 w-4 mr-2" />
                    修正错误
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAssist('explain')}>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    解释内容
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                variant={mode === 'live' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setMode('live')}
                title="实时预览"
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

              {/* 字体大小 */}
              <Button variant="ghost" size="icon" onClick={() => adjustFontSize(-1)} title="缩小字体">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs w-8 text-center">{fontSize}</span>
              <Button variant="ghost" size="icon" onClick={() => adjustFontSize(1)} title="放大字体">
                <ZoomIn className="h-4 w-4" />
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportFile('pdf')}>
                    <FileDown className="h-4 w-4 mr-2" /> 导出为 PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 主题切换 */}
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

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* 其他功能 */}
              <Button variant="ghost" size="icon" onClick={copyContent} title="复制内容">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => window.print()} title="打印">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="全屏">
                <Maximize2 className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              {/* 设置 */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/settings')} 
                title="设置"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* 查找替换栏 */}
          {showSearchReplace && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="查找..."
                className="w-48 h-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFindNext();
                  if (e.key === 'Escape') setShowSearchReplace(false);
                }}
              />
              <Button variant="ghost" size="sm" onClick={handleFindNext}>
                查找下一个
              </Button>
              <Replace className="h-4 w-4 text-muted-foreground ml-4" />
              <Input
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="替换为..."
                className="w-48 h-8"
              />
              <Button variant="ghost" size="sm" onClick={handleReplace}>
                全部替换
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowSearchReplace(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 主编辑区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 目录侧边栏 */}
          {toc.length > 0 && mode !== 'edit' && (
            <div className="w-52 border-r bg-card overflow-y-auto p-4 hidden lg:block print:hidden">
              <h3 className="font-semibold mb-3 flex items-center gap-2 sticky top-0 bg-card pb-2 border-b">
                <BookOpen className="h-4 w-4" />
                目录
              </h3>
              <div className="space-y-1">
                {toc.map((item, index) => (
                  <button
                    key={index}
                    className="block w-full text-left text-sm hover:bg-accent px-2 py-1 rounded transition-colors truncate"
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                    onClick={() => {
                      const element = document.querySelector(`[data-heading="${item.id}"]`);
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
          <div className="flex-1 overflow-hidden" style={{ fontSize: `${fontSize}px` }}>
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || '')}
              preview={mode}
              height="100%"
              visibleDragbar={false}
              hideToolbar={true}
              enableScroll={true}
              style={{
                fontSize: `${fontSize}px`,
              }}
            />
          </div>
        </div>

        {/* 底部状态栏 */}
        <div className="border-t bg-card px-4 py-1.5 flex items-center justify-between text-xs text-muted-foreground print:hidden">
          <div className="flex items-center gap-4">
            <span>字符: {wordCount.chars.toLocaleString()}</span>
            <span>词数: {wordCount.words.toLocaleString()}</span>
            <span>行数: {wordCount.lines.toLocaleString()}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              阅读约 {readingTime} 分钟
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              已保存
            </span>
            <span>Markdown</span>
            {currentDoc && (
              <span>
                最后编辑: {formatTime(currentDoc.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 模板选择对话框 */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>选择模板</DialogTitle>
            <DialogDescription>
              从以下模板开始创建新文档
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {templateCategories.map((category) => {
              const categoryTemplates = getTemplatesByCategory(category.id);
              if (categoryTemplates.length === 0) return null;
              
              return (
                <div key={category.id} className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categoryTemplates.map((template) => (
                      <button
                        key={template.id}
                        className="flex flex-col items-start p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors text-left"
                        onClick={() => handleCreateDocument(template.id)}
                      >
                        <span className="text-2xl mb-2">{template.icon}</span>
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTemplates(false)}>
              取消
            </Button>
            <Button onClick={() => handleCreateDocument()}>
              创建空白文档
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI 写作助手面板 */}
      <Dialog open={showAIPanel} onOpenChange={setShowAIPanel}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 写作助手
              {aiLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </DialogTitle>
            <DialogDescription>
              {aiAction === 'continue' && '正在续写内容...'}
              {aiAction === 'polish' && '正在润色文本...'}
              {aiAction === 'expand' && '正在扩展内容...'}
              {aiAction === 'rewrite' && '正在改写内容...'}
              {aiAction === 'summarize' && '正在生成摘要...'}
              {aiAction === 'outline' && '正在生成大纲...'}
              {aiAction === 'title' && '正在生成标题...'}
              {aiAction === 'translate' && '正在翻译文本...'}
              {aiAction === 'fix' && '正在修正错误...'}
              {aiAction === 'explain' && '正在解释内容...'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-md border p-4 bg-muted/50">
            {aiLoading && !aiResult ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                正在生成...
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{aiResult}</div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAIPanel(false)}>
              取消
            </Button>
            <Button 
              onClick={applyAIResult} 
              disabled={aiLoading || !aiResult}
            >
              <Check className="h-4 w-4 mr-2" />
              应用到文档
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除此文档吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 版本历史对话框 */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              版本历史
            </DialogTitle>
            <DialogDescription>
              查看和恢复文档的历史版本
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>暂无版本历史</p>
                <p className="text-sm mt-1">按 Ctrl+Shift+S 手动保存版本</p>
              </div>
            ) : (
              versions.map((version, index) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">{versions.length - index}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {version.description || '自动保存'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(version.savedAt).toLocaleString('zh-CN')} · {version.wordCount} 词
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreVersion(version.id)}
                    >
                      <Restore className="h-4 w-4 mr-1" />
                      恢复
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteVersion(version.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowVersionHistory(false)}>
              关闭
            </Button>
            <Button onClick={handleSaveVersion}>
              <Save className="h-4 w-4 mr-2" />
              保存当前版本
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI 对话对话框 */}
      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI 对话模式
            </DialogTitle>
            <DialogDescription>
              与 AI 进行对话，获取写作建议和帮助
            </DialogDescription>
          </DialogHeader>
          
          <div 
            ref={chatContainerRef}
            className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto space-y-3 p-4 border rounded-lg bg-muted/30"
          >
            {chatMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>开始与 AI 对话</p>
                <p className="text-sm mt-1">询问关于文档的问题或请求帮助</p>
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7"
                        onClick={() => applyChatResult(message.content)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        添加到文档
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-card border rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="输入消息..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChatMessage();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSendChatMessage} disabled={chatLoading || !chatInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新建文件夹对话框 */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              新建文件夹
            </DialogTitle>
            <DialogDescription>
              创建新的文件夹来组织你的文档
            </DialogDescription>
          </DialogHeader>
          
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="文件夹名称"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
            }}
          />
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewFolderDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFolder}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 快捷键面板 */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              快捷键
            </DialogTitle>
            <DialogDescription>
              使用快捷键提高编辑效率
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            {SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowShortcuts(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI 配置提示对话框 */}
      <Dialog open={showAIConfigAlert} onOpenChange={setShowAIConfigAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertCircle className="h-5 w-5" />
              需要配置 AI API
            </DialogTitle>
            <DialogDescription>
              使用 AI 功能需要先配置 API Key
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">尚未配置 AI API Key</p>
                <p className="text-xs opacity-80">
                  请前往设置页面配置您的 AI 提供商和 API Key，然后即可使用所有 AI 写作助手功能。
                </p>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">支持的 AI 提供商：</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded border">
                  <span>🤖</span> 豆包
                </div>
                <div className="flex items-center gap-2 p-2 rounded border">
                  <span>🧠</span> DeepSeek
                </div>
                <div className="flex items-center gap-2 p-2 rounded border">
                  <span>💚</span> OpenAI
                </div>
                <div className="flex items-center gap-2 p-2 rounded border">
                  <span>🌙</span> Kimi
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAIConfigAlert(false)}>
              稍后再说
            </Button>
            <Button onClick={() => {
              setShowAIConfigAlert(false);
              router.push('/settings');
            }}>
              <Settings className="h-4 w-4 mr-2" />
              前往设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
