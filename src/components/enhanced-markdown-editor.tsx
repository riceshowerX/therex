/**
 * 增强版 Markdown 编辑器包装器
 * 整合所有新功能：性能优化、AI 助手、导出、设置等
 */

'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Sparkles,
  Settings,
  Download,
  Keyboard,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// 动态导入主编辑器组件
const MarkdownEditor = dynamic(
  () => import('@/components/markdown-editor').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
  }
);

// 懒加载增强组件
const EnhancedAIPanel = dynamic(
  () =>
    import('@/components/editor/EnhancedAIPanel').then((mod) => mod.EnhancedAIPanel),
  { ssr: false }
);

const SettingsPanel = dynamic(
  () =>
    import('@/components/editor/SettingsPanel').then((mod) => mod.SettingsPanel),
  { ssr: false }
);

const ShortcutHelpDialog = dynamic(
  () =>
    import('@/components/editor/ShortcutHelpDialog').then((mod) => mod.ShortcutHelpDialog),
  { ssr: false }
);

// 类型导入
import type {
  AppSettings,
} from '@/components/editor/SettingsPanel';

import type {
  AIFeature,
} from '@/components/editor/EnhancedAIPanel';

import type {
  AIRequestOptions,
} from '@/components/editor/EnhancedAIPanel';

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  editor: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, monospace',
    lineHeight: 1.6,
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    minimap: false,
    autoSave: true,
    autoSaveDelay: 500,
    spellCheck: true,
    highlightActiveLine: true,
    showInvisibles: false,
    indentWithTabs: false,
  },
  theme: {
    mode: 'system',
    accentColor: '#3b82f6',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 8,
    animations: true,
    compactMode: false,
  },
  ai: [],
  storage: {
    provider: 'local',
    autoSync: false,
    syncInterval: 30000,
    maxVersions: 20,
    compressionEnabled: false,
  },
  notifications: {
    soundEnabled: false,
    desktopNotifications: false,
    emailNotifications: false,
    autoSaveNotifications: true,
  },
  language: 'zh-CN',
  shortcuts: {},
};

// 设置存储键
const SETTINGS_KEY = 'therex-settings';

// 加载设置
function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

// 保存设置
function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// AI 请求处理
async function handleAIRequest(
  feature: AIFeature,
  content: string,
  selection?: string,
  options?: AIRequestOptions
): Promise<string | AsyncGenerator<string, void, unknown>> {
  // 这里应该调用实际的 AI 服务
  // 目前返回模拟响应
  const prompt = selection || content;
  
  async function* generator() {
    const responses: Record<string, string> = {
      chat: `这是一条针对 "${prompt.slice(0, 50)}..." 的 AI 响应。`,
      polish: `润色后的文本：${selection || '（请选择需要润色的文本）'}`,
      continue: `继续写作的内容...`,
      summarize: `文档摘要：共 ${content.length} 字，${content.split('\n').length} 行。`,
      translate: `Translated text: ${selection || '（请选择需要翻译的文本）'}`,
    };

    const response = responses[feature] || 'AI 功能正在处理中...';
    
    // 模拟流式输出
    for (const char of response) {
      yield char;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  return generator();
}

// 主组件
export function EnhancedMarkdownEditor() {
  // 状态
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorSelection, setEditorSelection] = useState('');
  const [activeAIFeature, setActiveAIFeature] = useState<AIFeature>('chat');

  // 加载设置
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // 保存设置
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // 处理设置变更
  const handleSettingsChange = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    toast.success('设置已保存');
  }, []);

  // 导出设置
  const handleExportSettings = useCallback(() => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `therex-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('设置已导出');
  }, [settings]);

  // 导入设置
  const handleImportSettings = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const imported = JSON.parse(text);
          setSettings({ ...DEFAULT_SETTINGS, ...imported });
          toast.success('设置已导入');
        } catch {
          toast.error('导入失败：无效的设置文件');
        }
      }
    };
    input.click();
  }, []);

  // 重置设置
  const handleResetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    toast.success('设置已恢复默认');
  }, []);

  // 清除数据
  const handleClearData = useCallback(() => {
    localStorage.clear();
    toast.success('所有数据已清除');
    window.location.reload();
  }, []);

  // 应用 AI 结果
  const handleApplyAIResult = useCallback((result: string, _feature: AIFeature) => {
    setEditorContent((prev) => prev + '\n\n' + result);
    toast.success('已应用到文档');
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: 打开 AI 面板
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowAIPanel((prev) => !prev);
      }
      // Ctrl/Cmd + /: 显示快捷键帮助
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
      // Ctrl/Cmd + ,: 打开设置
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // AI 面板状态切换
  const toggleAIPanel = useCallback(() => {
    setShowAIPanel((prev) => !prev);
  }, []);

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* 顶部工具栏 */}
        <header className="h-12 border-b flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              设置
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(true)}
            >
              <Keyboard className="h-4 w-4 mr-2" />
              快捷键
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showAIPanel ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleAIPanel}
                >
                  {showAIPanel ? (
                    <PanelRightClose className="h-4 w-4 mr-2" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4 mr-2" />
                  )}
                  AI 助手
                  <span className="ml-2 text-xs opacity-60">Ctrl+K</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>切换 AI 助手面板</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* 主内容区 */}
        <div className="flex-1 flex overflow-hidden">
          <ErrorBoundary>
            <div className="flex-1 relative">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                }
              >
                <MarkdownEditor />
              </Suspense>
            </div>
          </ErrorBoundary>

          {/* AI 面板 */}
          {showAIPanel && (
            <Suspense
              fallback={
                <div className="w-80 border-l flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              }
            >
              <EnhancedAIPanel
                isOpen={showAIPanel}
                onClose={() => setShowAIPanel(false)}
                activeFeature={activeAIFeature}
                content={editorContent}
                selection={editorSelection}
                onApply={handleApplyAIResult}
                onFeatureChange={setActiveAIFeature}
                onAIRequest={handleAIRequest}
                position="sidebar"
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* 设置面板 */}
      <Suspense fallback={null}>
        <SettingsPanel
          open={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onExportSettings={handleExportSettings}
          onImportSettings={handleImportSettings}
          onResetSettings={handleResetSettings}
          onClearData={handleClearData}
        />
      </Suspense>

      {/* 快捷键帮助 */}
      <Suspense fallback={null}>
        <ShortcutHelpDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
      </Suspense>
    </TooltipProvider>
  );
}

export default EnhancedMarkdownEditor;
