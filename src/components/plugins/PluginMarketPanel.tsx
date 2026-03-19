/**
 * 插件管理面板组件
 * 提供插件浏览、安装、启用/禁用功能
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Puzzle,
  Search,
  Download,
  Trash2,
  Settings2,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Power,
  PowerOff,
  Info,
  Shield,
  Sparkles,
  FileText,
  Code,
  Image,
  Music,
  Database,
  Globe,
} from 'lucide-react';
import { pluginManager, type PluginInstance, type PluginManifest } from '@/lib/plugins/manager';
import { toast } from 'sonner';

interface PluginMarketPanelProps {
  open: boolean;
  onClose: () => void;
}

// 示例插件列表（实际应从插件市场 API 获取）
const SAMPLE_PLUGINS: PluginManifest[] = [
  {
    id: 'word-counter',
    name: '字数统计',
    version: '1.0.0',
    description: '实时统计文档字数、字符数、段落数',
    author: 'Therex Team',
    main: 'word-counter.js',
    icon: 'FileText',
    permissions: ['editor'],
    keywords: ['统计', '字数', 'counter'],
  },
  {
    id: 'code-highlight',
    name: '代码高亮增强',
    version: '1.2.0',
    description: '为代码块提供更丰富的语法高亮和行号显示',
    author: 'Therex Team',
    main: 'code-highlight.js',
    icon: 'Code',
    permissions: ['editor', 'storage'],
    keywords: ['代码', '高亮', 'syntax'],
  },
  {
    id: 'image-compressor',
    name: '图片压缩',
    version: '1.0.0',
    description: '自动压缩上传的图片，减少存储空间占用',
    author: 'Therex Team',
    main: 'image-compressor.js',
    icon: 'Image',
    permissions: ['storage', 'files'],
    keywords: ['图片', '压缩', '优化'],
  },
  {
    id: 'mermaid-renderer',
    name: 'Mermaid 图表',
    version: '2.0.0',
    description: '支持 Mermaid 语法渲染流程图、时序图等',
    author: 'Therex Team',
    main: 'mermaid-renderer.js',
    icon: 'Sparkles',
    permissions: ['editor', 'network'],
    keywords: ['mermaid', '图表', '流程图'],
  },
  {
    id: 'ai-translator',
    name: 'AI 翻译助手',
    version: '1.5.0',
    description: '使用 AI 自动翻译选中文本到多种语言',
    author: 'Therex Team',
    main: 'ai-translator.js',
    icon: 'Globe',
    permissions: ['ai', 'editor', 'clipboard'],
    keywords: ['翻译', 'AI', '多语言'],
  },
  {
    id: 'focus-mode',
    name: '专注模式',
    version: '1.0.0',
    description: '隐藏界面干扰元素，提供沉浸式写作体验',
    author: 'Therex Team',
    main: 'focus-mode.js',
    icon: 'Shield',
    permissions: ['editor'],
    keywords: ['专注', '沉浸', '写作'],
  },
];

// 图标映射
const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  Code,
  Image,
  Music,
  Database,
  Globe,
  Sparkles,
  Shield,
};

export function PluginMarketPanel({ open, onClose }: PluginMarketPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('installed');
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载已安装插件
  useEffect(() => {
    if (open) {
      loadPlugins();
    }
  }, [open]);

  const loadPlugins = useCallback(() => {
    const installed = pluginManager.getPlugins();
    setPlugins(installed);
  }, []);

  // 切换插件状态
  const handleTogglePlugin = async (pluginId: string, currentStatus: string) => {
    setLoading(true);
    try {
      if (currentStatus === 'active') {
        await pluginManager.deactivate(pluginId);
        toast.success('插件已停用');
      } else {
        await pluginManager.activate(pluginId);
        toast.success('插件已启用');
      }
      loadPlugins();
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 安装插件
  const handleInstallPlugin = async (manifest: PluginManifest) => {
    setLoading(true);
    try {
      const success = await pluginManager.register(manifest);
      if (success) {
        await pluginManager.activate(manifest.id);
        toast.success(`已安装 ${manifest.name}`);
        loadPlugins();
        setActiveTab('installed');
      } else {
        toast.error('安装失败');
      }
    } catch (error) {
      toast.error('安装失败');
    } finally {
      setLoading(false);
    }
  };

  // 卸载插件
  const handleUninstallPlugin = async (pluginId: string) => {
    setLoading(true);
    try {
      await pluginManager.uninstall(pluginId);
      toast.success('插件已卸载');
      loadPlugins();
    } catch (error) {
      toast.error('卸载失败');
    } finally {
      setLoading(false);
    }
  };

  // 过滤插件列表
  const filteredMarketPlugins = SAMPLE_PLUGINS.filter(
    (p) =>
      !plugins.find((installed) => installed.manifest.id === p.id) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredInstalledPlugins = plugins.filter(
    (p) =>
      p.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manifest.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border';
      case 'error':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '已启用';
      case 'inactive':
        return '已停用';
      case 'error':
        return '错误';
      case 'activating':
        return '启用中';
      case 'deactivating':
        return '停用中';
      default:
        return status;
    }
  };

  // 获取图标组件
  const getIconComponent = (iconName?: string) => {
    if (iconName && ICON_MAP[iconName]) {
      return ICON_MAP[iconName];
    }
    return Puzzle;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Puzzle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">插件管理</DialogTitle>
              <DialogDescription className="text-sm mt-0.5">
                浏览、安装和管理编辑器插件
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 搜索栏 */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索插件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* 选项卡 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="installed" className="gap-2">
              <Puzzle className="h-4 w-4" />
              已安装 ({plugins.length})
            </TabsTrigger>
            <TabsTrigger value="market" className="gap-2">
              <Sparkles className="h-4 w-4" />
              插件市场
            </TabsTrigger>
          </TabsList>

          {/* 已安装插件 */}
          <TabsContent value="installed" className="flex-1 m-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 pt-4 space-y-4">
                {filteredInstalledPlugins.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Puzzle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无已安装的插件</p>
                    <p className="text-sm mt-1">前往插件市场浏览可用插件</p>
                  </div>
                ) : (
                  filteredInstalledPlugins.map((plugin) => {
                    const IconComponent = getIconComponent(plugin.manifest.icon);
                    return (
                      <div
                        key={plugin.manifest.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{plugin.manifest.name}</h4>
                            <Badge variant="outline" className={cn('text-xs', getStatusColor(plugin.status))}>
                              {getStatusText(plugin.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">v{plugin.manifest.version}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {plugin.manifest.description}
                          </p>
                          {plugin.manifest.permissions && plugin.manifest.permissions.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Shield className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                权限: {plugin.manifest.permissions.join(', ')}
                              </span>
                            </div>
                          )}
                          {plugin.error && (
                            <div className="flex items-center gap-1 mt-2 text-red-500">
                              <AlertCircle className="h-3 w-3" />
                              <span className="text-xs">{plugin.error}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={plugin.status === 'active'}
                            onCheckedChange={() => handleTogglePlugin(plugin.manifest.id, plugin.status)}
                            disabled={loading}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUninstallPlugin(plugin.manifest.id)}
                            disabled={loading}
                            title="卸载"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 插件市场 */}
          <TabsContent value="market" className="flex-1 m-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 pt-4 space-y-4">
                {filteredMarketPlugins.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>未找到匹配的插件</p>
                  </div>
                ) : (
                  filteredMarketPlugins.map((plugin) => {
                    const IconComponent = getIconComponent(plugin.icon);
                    return (
                      <div
                        key={plugin.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{plugin.name}</h4>
                            <span className="text-xs text-muted-foreground">v{plugin.version}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {plugin.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">作者: {plugin.author}</span>
                            {plugin.permissions && plugin.permissions.length > 0 && (
                              <>
                                <Separator orientation="vertical" className="h-3" />
                                <div className="flex items-center gap-1">
                                  <Shield className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {plugin.permissions.join(', ')}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInstallPlugin(plugin)}
                          disabled={loading}
                          className="gap-1 shrink-0"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          安装
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-4 border-t border-border">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">
              插件运行在沙箱环境中，请放心使用
            </p>
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
