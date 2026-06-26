/**
 * 插件管理面板组件
 * 提供插件浏览、安装、启用/禁用功能
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Check,
  AlertCircle,
  Loader2,
  Shield,
  Sparkles,
  FileText,
  Code,
  Image,
  Music,
  Database,
  Globe,
} from 'lucide-react';
import { pluginManager, type PluginInstance, type PluginManifest, type PluginPermission } from '@/lib/plugins/manager';
import { builtInPlugins, registerBuiltInPlugins } from '@/lib/plugins/built-in';
import { PermissionRequestDialog } from './PermissionRequestDialog';
import { toast } from 'sonner';

interface PluginMarketPanelProps {
  open: boolean;
  onClose: () => void;
}

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

// 获取图标组件
const getIconComponent = (iconName?: string): React.ElementType => {
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return Puzzle;
};

// 获取状态颜色
const getStatusColor = (status: string): string => {
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
const getStatusText = (status: string): string => {
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

export function PluginMarketPanel({ open, onClose }: PluginMarketPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('installed');
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPluginId, setLoadingPluginId] = useState<string | null>(null);

  // 权限请求对话框状态
  const [permissionDialog, setPermissionDialog] = useState<{
    open: boolean;
    pluginId: string;
    pluginName: string;
    permissions: PluginPermission[];
    resolve: (granted: boolean) => void;
  } | null>(null);

  // 初始化内置插件（仅首次）
  useEffect(() => {
    registerBuiltInPlugins();
  }, []);

  // 配置插件管理器
  useEffect(() => {
    pluginManager.configure({
      onPermissionRequest: async (pluginId, pluginName, permissions) => {
        return new Promise((resolve) => {
          setPermissionDialog({
            open: true,
            pluginId,
            pluginName,
            permissions,
            resolve,
          });
        });
      },
      onNotification: (message, type) => {
        toast[type](message);
      },
    });
  }, []);

  // 加载已安装插件
  const loadPlugins = useCallback(() => {
    const installed = pluginManager.getPlugins();
    setPlugins(installed);
  }, []);

  // 只在对话框打开时加载插件
  useEffect(() => {
    if (open) {
      loadPlugins();
    }
  }, [open, loadPlugins]);

  // 过滤插件列表 - 使用 useMemo 优化性能
  const filteredMarketPlugins = useMemo(() => {
    const installedIds = new Set(plugins.map(p => p.manifest.id));
    return builtInPlugins
      .map(p => p.manifest)
      .filter(
        (p) =>
          !installedIds.has(p.id) &&
          (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())))
      );
  }, [plugins, searchQuery]);

  const filteredInstalledPlugins = useMemo(() => {
    return plugins.filter(
      (p) =>
        p.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.manifest.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [plugins, searchQuery]);

  // 处理权限请求
  const handlePermissionAllow = useCallback(() => {
    if (permissionDialog) {
      permissionDialog.resolve(true);
      setPermissionDialog(null);
    }
  }, [permissionDialog]);

  const handlePermissionDeny = useCallback(() => {
    if (permissionDialog) {
      permissionDialog.resolve(false);
      setPermissionDialog(null);
    }
  }, [permissionDialog]);

  // 切换插件状态
  const handleTogglePlugin = useCallback(async (pluginId: string, currentStatus: string) => {
    setLoadingPluginId(pluginId);
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
      setLoadingPluginId(null);
    }
  }, [loadPlugins]);

  // 安装插件
  const handleInstallPlugin = useCallback(async (manifest: PluginManifest) => {
    setLoadingPluginId(manifest.id);
    try {
      // 查找对应的内置插件定义
      const builtInPlugin = builtInPlugins.find(p => p.manifest.id === manifest.id);
      
      if (builtInPlugin) {
        // 直接注册内置插件
        pluginManager.registerBuiltIn(builtInPlugin);
        await pluginManager.activate(manifest.id);
        toast.success(`已安装 ${manifest.name}`);
        loadPlugins();
        setActiveTab('installed');
      } else {
        // 外部插件通过 manifest 注册
        const success = await pluginManager.register(manifest);
        if (success) {
          await pluginManager.activate(manifest.id);
          toast.success(`已安装 ${manifest.name}`);
          loadPlugins();
          setActiveTab('installed');
        } else {
          toast.error('安装失败：权限被拒绝');
        }
      }
    } catch (error) {
      toast.error('安装失败');
    } finally {
      setLoadingPluginId(null);
    }
  }, [loadPlugins]);

  // 卸载插件
  const handleUninstallPlugin = useCallback(async (pluginId: string) => {
    setLoadingPluginId(pluginId);
    try {
      await pluginManager.uninstall(pluginId);
      toast.success('插件已卸载');
      loadPlugins();
    } catch (error) {
      toast.error('卸载失败');
    } finally {
      setLoadingPluginId(null);
    }
  }, [loadPlugins]);

  // 渲染插件卡片
  const renderInstalledPlugin = useCallback((plugin: PluginInstance) => {
    const IconComponent = getIconComponent(plugin.manifest.icon);
    const isLoading = loadingPluginId === plugin.manifest.id;
    
    return (
      <div
        key={plugin.manifest.id}
        className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
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
            disabled={isLoading}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleUninstallPlugin(plugin.manifest.id)}
            disabled={isLoading}
            title="卸载"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
    );
  }, [loadingPluginId, handleTogglePlugin, handleUninstallPlugin]);

  const renderMarketPlugin = useCallback((plugin: PluginManifest) => {
    const IconComponent = getIconComponent(plugin.icon);
    const isLoading = loadingPluginId === plugin.id;
    
    return (
      <div
        key={plugin.id}
        className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium truncate">{plugin.name}</h4>
            <span className="text-xs text-muted-foreground">v{plugin.version}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {plugin.description}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
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
          disabled={isLoading}
          className="gap-1 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          安装
        </Button>
      </div>
    );
  }, [loadingPluginId, handleInstallPlugin]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
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
          <div className="p-4 border-b border-border shrink-0">
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-6 mt-4 shrink-0">
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
            <TabsContent value="installed" className="flex-1 m-0 min-h-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-[350px]">
                <div className="p-6 pt-4 space-y-4">
                  {filteredInstalledPlugins.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Puzzle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>暂无已安装的插件</p>
                      <p className="text-sm mt-1">前往插件市场浏览可用插件</p>
                    </div>
                  ) : (
                    filteredInstalledPlugins.map(renderInstalledPlugin)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 插件市场 */}
            <TabsContent value="market" className="flex-1 m-0 min-h-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-[350px]">
                <div className="p-6 pt-4 space-y-4">
                  {filteredMarketPlugins.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>未找到匹配的插件</p>
                    </div>
                  ) : (
                    filteredMarketPlugins.map(renderMarketPlugin)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter className="p-4 border-t border-border shrink-0">
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-muted-foreground">
                {plugins.filter(p => p.status === 'active').length} 个插件已启用
              </p>
              <Button variant="outline" onClick={onClose}>
                关闭
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 权限请求对话框 */}
      <PermissionRequestDialog
        open={permissionDialog?.open ?? false}
        onOpenChange={(open) => {
          if (!open) {
            handlePermissionDeny();
          }
        }}
        pluginName={permissionDialog?.pluginName ?? ''}
        permissions={permissionDialog?.permissions ?? []}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />
    </>
  );
}
