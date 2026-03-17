/**
 * 版本历史组件
 * 显示和管理文档版本历史
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  History,
  Clock,
  RotateCcw,
  Trash2,
  MoreHorizontal,
  Save,
  GitCommit,
  AlertCircle,
} from 'lucide-react';
import type { DocumentVersion } from '@/types';

// ==================== 类型定义 ====================

export interface VersionHistoryProps {
  // 状态
  isOpen: boolean;
  versions: DocumentVersion[];
  isLoading?: boolean;
  
  // 回调
  onClose: () => void;
  onSaveVersion: (description?: string) => void;
  onRestoreVersion: (versionId: string) => void;
  onDeleteVersion: (versionId: string) => void;
}

// ==================== 辅助函数 ====================

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==================== 子组件 ====================

interface VersionItemProps {
  version: DocumentVersion;
  isLatest?: boolean;
  onRestore: () => void;
  onDelete: () => void;
}

function VersionItem({ version, isLatest = false, onRestore, onDelete }: VersionItemProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <div className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="mt-0.5">
          <GitCommit className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {version.description || '自动保存'}
            </span>
            {isLatest && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                当前版本
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            <span>{formatTimestamp(version.savedAt)}</span>
            <span>·</span>
            <span>{version.wordCount} 词</span>
          </div>
          {/* 内容预览 */}
          <button
            className="text-xs text-primary hover:underline mt-1"
            onClick={() => setShowPreview(true)}
          >
            预览内容
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              恢复此版本
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={onDelete}
              disabled={isLatest}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除此版本
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {version.description || '自动保存'} - {formatTimestamp(version.savedAt)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <pre className="text-sm whitespace-pre-wrap p-4 bg-muted rounded-lg">
              {version.content}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPreview(false)}>
              关闭
            </Button>
            <Button onClick={() => {
              onRestore();
              setShowPreview(false);
            }}>
              <RotateCcw className="h-4 w-4 mr-2" />
              恢复此版本
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== 主组件 ====================

export function VersionHistory({
  isOpen,
  versions,
  isLoading = false,
  onClose,
  onSaveVersion,
  onRestoreVersion,
  onDeleteVersion,
}: VersionHistoryProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [versionDescription, setVersionDescription] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);

  // 保存版本
  const handleSaveVersion = useCallback(() => {
    onSaveVersion(versionDescription || undefined);
    setVersionDescription('');
    setShowSaveDialog(false);
  }, [versionDescription, onSaveVersion]);

  // 确认恢复
  const handleConfirmRestore = useCallback((versionId: string) => {
    onRestoreVersion(versionId);
    setShowRestoreConfirm(null);
  }, [onRestoreVersion]);

  // 删除版本
  const handleDeleteVersion = useCallback((versionId: string) => {
    onDeleteVersion(versionId);
  }, [onDeleteVersion]);

  if (!isOpen) return null;

  return (
    <div className="w-72 border-l bg-card flex flex-col">
      {/* 头部 */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">版本历史</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          ×
        </Button>
      </div>

      {/* 手动保存 */}
      <div className="p-3 border-b">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowSaveDialog(true)}
        >
          <Save className="h-4 w-4 mr-2" />
          保存当前版本
        </Button>
      </div>

      {/* 版本列表 */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">暂无版本历史</p>
            <p className="text-xs text-muted-foreground mt-1">
              系统会自动保存版本，也可以手动保存
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {versions.map((version, index) => (
              <VersionItem
                key={version.id}
                version={version}
                isLatest={index === 0}
                onRestore={() => setShowRestoreConfirm(version.id)}
                onDelete={() => handleDeleteVersion(version.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 保存版本对话框 */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存版本</DialogTitle>
            <DialogDescription>
              为这个版本添加描述（可选）
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            placeholder="例如：完成了初稿"
            value={versionDescription}
            onChange={(e) => setVersionDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSaveVersion}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 恢复确认对话框 */}
      <Dialog open={!!showRestoreConfirm} onOpenChange={() => setShowRestoreConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>恢复版本</DialogTitle>
            <DialogDescription>
              确定要恢复到此版本吗？当前内容会被覆盖，但会先保存一个新版本。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRestoreConfirm(null)}>
              取消
            </Button>
            <Button onClick={() => showRestoreConfirm && handleConfirmRestore(showRestoreConfirm)}>
              恢复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
