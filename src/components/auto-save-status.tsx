'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Save,
  Cloud,
  CloudOff,
} from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';

interface AutoSaveStatusProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  error?: string | null;
  onRetry?: () => void;
  showDetails?: boolean;
}

export function AutoSaveStatus({
  status,
  lastSaved,
  error,
  onRetry,
  showDetails = true,
}: AutoSaveStatusProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // 更新"上次保存"的时间显示
  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = now.getTime() - lastSaved.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 60) {
        setTimeAgo('刚刚');
      } else if (minutes < 60) {
        setTimeAgo(`${minutes} 分钟前`);
      } else if (hours < 24) {
        setTimeAgo(`${hours} 小时前`);
      } else {
        setTimeAgo(lastSaved.toLocaleDateString());
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // 每30秒更新一次

    return () => clearInterval(interval);
  }, [lastSaved]);

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          text: '保存中...',
          color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          tooltip: '正在保存文档...',
        };
      case 'saved':
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          text: '已保存',
          color: 'bg-green-500/10 text-green-500 border-green-500/20',
          tooltip: `上次保存: ${timeAgo}`,
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          text: '保存失败',
          color: 'bg-red-500/10 text-red-500 border-red-500/20',
          tooltip: error || '保存失败，点击重试',
        };
      case 'unsaved':
        return {
          icon: <Clock className="h-3.5 w-3.5" />,
          text: '未保存',
          color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          tooltip: '有未保存的更改',
        };
      default:
        return {
          icon: <Save className="h-3.5 w-3.5" />,
          text: '自动保存',
          color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
          tooltip: '自动保存已启用',
        };
    }
  };

  const config = getStatusConfig();

  const content = (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={`${config.color} cursor-pointer transition-all hover:opacity-80`}
        onClick={status === 'error' ? onRetry : undefined}
      >
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </Badge>
      {showDetails && status === 'saved' && lastSaved && (
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      )}
      {showDetails && status === 'saving' && (
        <span className="text-xs text-muted-foreground">请稍候...</span>
      )}
    </div>
  );

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1"
              onClick={status === 'error' ? onRetry : undefined}
            >
              {config.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
          {status === 'error' && onRetry && (
            <p className="text-xs text-muted-foreground mt-1">点击重试</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// 同步状态指示器
interface SyncStatusProps {
  isOnline: boolean;
  isSyncing?: boolean;
  pendingChanges?: number;
}

export function SyncStatus({ isOnline, isSyncing, pendingChanges = 0 }: SyncStatusProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
              ) : (
                <Cloud className="h-3.5 w-3.5 text-green-500" />
              )
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {pendingChanges > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {pendingChanges}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isOnline
              ? isSyncing
                ? '正在同步...'
                : '已连接'
              : '离线模式'}
          </p>
          {pendingChanges > 0 && (
            <p className="text-xs text-muted-foreground">
              {pendingChanges} 个更改待同步
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
