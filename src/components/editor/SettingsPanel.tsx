/**
 * 增强的设置面板
 * 支持编辑器设置、AI 配置、主题设置、存储管理等
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Palette,
  Bot,
  Database,
  Keyboard,
  Bell,
  Shield,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Check,
  Eye,
  EyeOff,
  Plus,
  Minus,
  RotateCcw,
  Info,
  Monitor,
  Sun,
  Moon,
  Languages,
  Type,
  AlignLeft,
  Save,
  FileText,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

// 设置类型定义
export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  spellCheck: boolean;
  highlightActiveLine: boolean;
  showInvisibles: boolean;
  indentWithTabs: boolean;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  accentColor: string;
  fontFamily: string;
  borderRadius: number;
  animations: boolean;
  compactMode: boolean;
}

export interface AIConfig {
  id?: string;
  provider: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  streamEnabled: boolean;
}

export interface StorageSettings {
  provider: 'local' | 'indexeddb' | 'supabase';
  autoSync: boolean;
  syncInterval: number;
  maxVersions: number;
  compressionEnabled: boolean;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  autoSaveNotifications: boolean;
}

export interface AppSettings {
  editor: EditorSettings;
  theme: ThemeSettings;
  ai: AIConfig[];
  storage: StorageSettings;
  notifications: NotificationSettings;
  language: string;
  shortcuts: Record<string, string>;
}

// 默认设置
export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
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
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'system',
  accentColor: '#3b82f6',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 8,
  animations: true,
  compactMode: false,
};

export const DEFAULT_STORAGE_SETTINGS: StorageSettings = {
  provider: 'local',
  autoSync: false,
  syncInterval: 30000,
  maxVersions: 20,
  compressionEnabled: false,
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  soundEnabled: false,
  desktopNotifications: false,
  emailNotifications: false,
  autoSaveNotifications: true,
};

// 设置面板属性
export interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onExportSettings: () => void;
  onImportSettings: () => void;
  onResetSettings: () => void;
  onClearData: () => void;
}

// 设置项组件
interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingItem = memo(function SettingItem({
  label,
  description,
  children,
}: SettingItemProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
});

// 设置组组件
interface SettingGroupProps {
  title: string;
  children: React.ReactNode;
}

const SettingGroup = memo(function SettingGroup({
  title,
  children,
}: SettingGroupProps) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
});

// 编辑器设置面板
interface EditorSettingsTabProps {
  settings: EditorSettings;
  onChange: (settings: EditorSettings) => void;
}

const EditorSettingsTab = memo(function EditorSettingsTab({
  settings,
  onChange,
}: EditorSettingsTabProps) {
  const handleChange = useCallback(
    <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
      onChange({ ...settings, [key]: value });
    },
    [settings, onChange]
  );

  return (
    <div className="space-y-6">
      <SettingGroup title="字体">
        <SettingItem label="字体大小" description="编辑器文字大小">
          <div className="flex items-center gap-2 w-32">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleChange('fontSize', Math.max(10, settings.fontSize - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center">{settings.fontSize}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleChange('fontSize', Math.min(24, settings.fontSize + 1))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </SettingItem>

        <SettingItem label="字体" description="编辑器字体">
          <Select
            value={settings.fontFamily}
            onValueChange={(v) => handleChange('fontFamily', v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JetBrains Mono, Fira Code, monospace">
                JetBrains Mono
              </SelectItem>
              <SelectItem value="Fira Code, monospace">Fira Code</SelectItem>
              <SelectItem value="Source Code Pro, monospace">
                Source Code Pro
              </SelectItem>
              <SelectItem value="Menlo, Monaco, monospace">
                Menlo / Monaco
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingItem>

        <SettingItem label="行高" description="文字行间距">
          <Slider
            value={[settings.lineHeight]}
            min={1}
            max={2}
            step={0.1}
            onValueChange={([v]) => handleChange('lineHeight', v)}
            className="w-32"
          />
        </SettingItem>
      </SettingGroup>

      <Separator />

      <SettingGroup title="缩进">
        <SettingItem label="Tab 大小" description="Tab 键缩进空格数">
          <Select
            value={settings.tabSize.toString()}
            onValueChange={(v) => handleChange('tabSize', parseInt(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="8">8</SelectItem>
            </SelectContent>
          </Select>
        </SettingItem>

        <SettingItem label="使用 Tab 缩进" description="使用 Tab 字符而非空格">
          <Switch
            checked={settings.indentWithTabs}
            onCheckedChange={(v) => handleChange('indentWithTabs', v)}
          />
        </SettingItem>
      </SettingGroup>

      <Separator />

      <SettingGroup title="显示">
        <SettingItem label="自动换行" description="长行自动换行显示">
          <Switch
            checked={settings.wordWrap}
            onCheckedChange={(v) => handleChange('wordWrap', v)}
          />
        </SettingItem>

        <SettingItem label="行号" description="显示行号">
          <Switch
            checked={settings.lineNumbers}
            onCheckedChange={(v) => handleChange('lineNumbers', v)}
          />
        </SettingItem>

        <SettingItem label="高亮当前行" description="高亮显示当前编辑行">
          <Switch
            checked={settings.highlightActiveLine}
            onCheckedChange={(v) => handleChange('highlightActiveLine', v)}
          />
        </SettingItem>

        <SettingItem label="显示不可见字符" description="显示空格、Tab 等字符">
          <Switch
            checked={settings.showInvisibles}
            onCheckedChange={(v) => handleChange('showInvisibles', v)}
          />
        </SettingItem>

        <SettingItem label="代码缩略图" description="显示代码缩略图">
          <Switch
            checked={settings.minimap}
            onCheckedChange={(v) => handleChange('minimap', v)}
          />
        </SettingItem>
      </SettingGroup>

      <Separator />

      <SettingGroup title="保存">
        <SettingItem label="自动保存" description="编辑后自动保存">
          <Switch
            checked={settings.autoSave}
            onCheckedChange={(v) => handleChange('autoSave', v)}
          />
        </SettingItem>

        {settings.autoSave && (
          <SettingItem label="保存间隔" description="自动保存延迟时间（毫秒）">
            <Input
              type="number"
              value={settings.autoSaveDelay}
              onChange={(e) =>
                handleChange('autoSaveDelay', parseInt(e.target.value) || 500)
              }
              className="w-24"
            />
          </SettingItem>
        )}

        <SettingItem label="拼写检查" description="启用拼写检查">
          <Switch
            checked={settings.spellCheck}
            onCheckedChange={(v) => handleChange('spellCheck', v)}
          />
        </SettingItem>
      </SettingGroup>
    </div>
  );
});

// 主题设置面板
interface ThemeSettingsTabProps {
  settings: ThemeSettings;
  onChange: (settings: ThemeSettings) => void;
}

const ThemeSettingsTab = memo(function ThemeSettingsTab({
  settings,
  onChange,
}: ThemeSettingsTabProps) {
  const handleChange = useCallback(
    <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
      onChange({ ...settings, [key]: value });
    },
    [settings, onChange]
  );

  const accentColors = [
    { value: '#3b82f6', label: '蓝色' },
    { value: '#10b981', label: '绿色' },
    { value: '#f59e0b', label: '橙色' },
    { value: '#ef4444', label: '红色' },
    { value: '#8b5cf6', label: '紫色' },
    { value: '#ec4899', label: '粉色' },
    { value: '#06b6d4', label: '青色' },
  ];

  return (
    <div className="space-y-6">
      <SettingGroup title="外观">
        <SettingItem label="主题模式" description="选择界面主题">
          <div className="flex gap-2">
            <Button
              variant={settings.mode === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChange('mode', 'light')}
            >
              <Sun className="h-4 w-4 mr-1" />
              浅色
            </Button>
            <Button
              variant={settings.mode === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChange('mode', 'dark')}
            >
              <Moon className="h-4 w-4 mr-1" />
              深色
            </Button>
            <Button
              variant={settings.mode === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChange('mode', 'system')}
            >
              <Monitor className="h-4 w-4 mr-1" />
              跟随系统
            </Button>
          </div>
        </SettingItem>

        <SettingItem label="强调色" description="界面主要强调颜色">
          <div className="flex gap-2">
            {accentColors.map((color) => (
              <button
                key={color.value}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  settings.accentColor === color.value
                    ? 'border-foreground scale-110'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleChange('accentColor', color.value)}
                title={color.label}
              />
            ))}
          </div>
        </SettingItem>

        <SettingItem label="圆角大小" description="界面元素圆角">
          <Slider
            value={[settings.borderRadius]}
            min={0}
            max={16}
            step={2}
            onValueChange={([v]) => handleChange('borderRadius', v)}
            className="w-32"
          />
        </SettingItem>
      </SettingGroup>

      <Separator />

      <SettingGroup title="行为">
        <SettingItem label="动画效果" description="启用界面动画">
          <Switch
            checked={settings.animations}
            onCheckedChange={(v) => handleChange('animations', v)}
          />
        </SettingItem>

        <SettingItem label="紧凑模式" description="减少界面间距">
          <Switch
            checked={settings.compactMode}
            onCheckedChange={(v) => handleChange('compactMode', v)}
          />
        </SettingItem>
      </SettingGroup>
    </div>
  );
});

// AI 设置面板
interface AISettingsTabProps {
  configs: AIConfig[];
  onChange: (configs: AIConfig[]) => void;
}

const AISettingsTab = memo(function AISettingsTab({
  configs,
  onChange,
}: AISettingsTabProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleAddConfig = useCallback(() => {
    onChange([
      ...configs,
      {
        provider: 'openai',
        apiKey: '',
        apiEndpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
        streamEnabled: true,
      },
    ]);
  }, [configs, onChange]);

  const handleRemoveConfig = useCallback(
    (index: number) => {
      onChange(configs.filter((_, i) => i !== index));
    },
    [configs, onChange]
  );

  const handleUpdateConfig = useCallback(
    (index: number, updates: Partial<AIConfig>) => {
      onChange(configs.map((c, i) => (i === index ? { ...c, ...updates } : c)));
    },
    [configs, onChange]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">AI 配置</h4>
          <p className="text-xs text-muted-foreground">
            配置 AI 服务以启用智能写作功能
          </p>
        </div>
        <Button onClick={handleAddConfig} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          添加配置
        </Button>
      </div>

      {configs.map((config, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">配置 {index + 1}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveConfig(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">提供商</Label>
                <Select
                  value={config.provider}
                  onValueChange={(v) => handleUpdateConfig(index, { provider: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="doubao">豆包</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                    <SelectItem value="kimi">Kimi</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">模型</Label>
                <Input
                  value={config.model}
                  onChange={(e) =>
                    handleUpdateConfig(index, { model: e.target.value })
                  }
                  placeholder="gpt-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">API Key</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) =>
                    handleUpdateConfig(index, { apiKey: e.target.value })
                  }
                  placeholder="sk-..."
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">API 端点</Label>
              <Input
                value={config.apiEndpoint}
                onChange={(e) =>
                  handleUpdateConfig(index, { apiEndpoint: e.target.value })
                }
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">温度 ({config.temperature})</Label>
                <Slider
                  value={[config.temperature]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([v]) =>
                    handleUpdateConfig(index, { temperature: v })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">最大 Token</Label>
                <Input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) =>
                    handleUpdateConfig(index, {
                      maxTokens: parseInt(e.target.value) || 2048,
                    })
                  }
                />
              </div>
            </div>

            <SettingItem label="启用流式输出">
              <Switch
                checked={config.streamEnabled}
                onCheckedChange={(v) =>
                  handleUpdateConfig(index, { streamEnabled: v })
                }
              />
            </SettingItem>
          </CardContent>
        </Card>
      ))}

      {configs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>暂无 AI 配置</p>
          <p className="text-xs mt-1">点击上方按钮添加配置</p>
        </div>
      )}
    </div>
  );
});

// 主设置面板
export function SettingsPanel({
  open,
  onClose,
  settings,
  onSettingsChange,
  onExportSettings,
  onImportSettings,
  onResetSettings,
  onClearData,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('editor');

  const handleEditorChange = useCallback(
    (editor: EditorSettings) => {
      onSettingsChange({ ...settings, editor });
    },
    [settings, onSettingsChange]
  );

  const handleThemeChange = useCallback(
    (theme: ThemeSettings) => {
      onSettingsChange({ ...settings, theme });
    },
    [settings, onSettingsChange]
  );

  const handleAIChange = useCallback(
    (ai: AIConfig[]) => {
      onSettingsChange({ ...settings, ai });
    },
    [settings, onSettingsChange]
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            设置
          </DialogTitle>
          <DialogDescription>
            自定义编辑器、主题、AI 和存储设置
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="editor" className="gap-1">
              <Type className="h-4 w-4" />
              编辑器
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-1">
              <Palette className="h-4 w-4" />
              主题
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1">
              <Bot className="h-4 w-4" />
              AI
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1">
              <Database className="h-4 w-4" />
              数据
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="py-4">
              <TabsContent value="editor" className="mt-0">
                <EditorSettingsTab
                  settings={settings.editor}
                  onChange={handleEditorChange}
                />
              </TabsContent>

              <TabsContent value="theme" className="mt-0">
                <ThemeSettingsTab
                  settings={settings.theme}
                  onChange={handleThemeChange}
                />
              </TabsContent>

              <TabsContent value="ai" className="mt-0">
                <AISettingsTab configs={settings.ai} onChange={handleAIChange} />
              </TabsContent>

              <TabsContent value="data" className="mt-0 space-y-6">
                <SettingGroup title="数据管理">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onExportSettings}>
                      <Download className="h-4 w-4 mr-2" />
                      导出设置
                    </Button>
                    <Button variant="outline" onClick={onImportSettings}>
                      <Upload className="h-4 w-4 mr-2" />
                      导入设置
                    </Button>
                  </div>
                </SettingGroup>

                <Separator />

                <SettingGroup title="重置">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onResetSettings}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      恢复默认设置
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          清除所有数据
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认清除数据？</AlertDialogTitle>
                          <AlertDialogDescription>
                            此操作将删除所有本地存储的文档和设置，且无法恢复。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={onClearData}>
                            确认清除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </SettingGroup>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          <Button onClick={onClose}>
            <Save className="h-4 w-4 mr-2" />
            保存设置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsPanel;
