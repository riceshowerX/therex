/**
 * 权限请求对话框组件
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Shield,
  Database,
  Globe,
  Clipboard,
  Bell,
  Edit3,
  FileText,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { PluginPermission } from '@/lib/plugins/manager';

interface PermissionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pluginName: string;
  permissions: PluginPermission[];
  onAllow: () => void;
  onDeny: () => void;
}

// 权限图标映射
const PERMISSION_ICONS: Record<PluginPermission, React.ElementType> = {
  storage: Database,
  network: Globe,
  clipboard: Clipboard,
  notifications: Bell,
  editor: Edit3,
  files: FileText,
  ai: Sparkles,
};

// 权限名称映射
const PERMISSION_NAMES: Record<PluginPermission, string> = {
  storage: '存储',
  network: '网络',
  clipboard: '剪贴板',
  notifications: '通知',
  editor: '编辑器',
  files: '文件',
  ai: 'AI 服务',
};

// 权限描述映射
const PERMISSION_DESCRIPTIONS: Record<PluginPermission, string> = {
  storage: '访问本地存储，保存插件设置和数据',
  network: '发起网络请求，访问外部 API',
  clipboard: '读取和写入系统剪贴板',
  notifications: '显示桌面通知',
  editor: '访问和修改编辑器内容',
  files: '访问本地文件系统',
  ai: '使用 AI 服务进行文本处理',
};

export function PermissionRequestDialog({
  open,
  onOpenChange,
  pluginName,
  permissions,
  onAllow,
  onDeny,
}: PermissionRequestDialogProps) {
  const [rememberChoice, setRememberChoice] = useState(false);

  const handleAllow = useCallback(() => {
    onAllow();
    onOpenChange(false);
  }, [onAllow, onOpenChange]);

  const handleDeny = useCallback(() => {
    onDeny();
    onOpenChange(false);
  }, [onDeny, onOpenChange]);

  // 重置记住选择
  useEffect(() => {
    if (open) {
      setRememberChoice(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            权限请求
          </DialogTitle>
          <DialogDescription>
            插件 <span className="font-medium text-foreground">{pluginName}</span> 需要以下权限才能正常工作
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {permissions.map((permission) => {
            const Icon = PERMISSION_ICONS[permission];
            const name = PERMISSION_NAMES[permission];
            const description = PERMISSION_DESCRIPTIONS[permission];

            return (
              <div
                key={permission}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{name}</span>
                    <Badge variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {description}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              请仅授权给您信任的插件。恶意插件可能会滥用这些权限。
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleDeny}>
            拒绝
          </Button>
          <Button onClick={handleAllow}>
            允许
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PermissionRequestDialog;
