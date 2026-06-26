/**
 * 实时协作面板组件
 * 显示协作者列表、状态指示器和协作控制
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Users,
  User,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Eye,
  MousePointer,
  UserPlus,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { getCollaborationManager, type CollaborationManager } from '@/lib/collaboration/manager';
import type { Collaborator, CursorPosition, SelectionRange } from '@/lib/collaboration/types';
import { toast } from 'sonner';

interface CollaborationPanelProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  documentContent: string;
  onCollaboratorCursor?: (userId: string, cursor: CursorPosition) => void;
  onCollaboratorSelection?: (userId: string, selection: SelectionRange | null) => void;
  onOperationReceived?: (operation: unknown) => void;
}

export function CollaborationPanel({
  open,
  onClose,
  documentId,
  documentTitle,
  documentContent,
  onCollaboratorCursor,
  onCollaboratorSelection,
  onOperationReceived,
}: CollaborationPanelProps) {
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [manager] = useState<CollaborationManager>(() => getCollaborationManager());

  // 生成邀请链接
  const inviteLink = useMemo(() => {
    if (!roomId) return '';
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/collab/${roomId}`;
  }, [roomId]);

  // 创建并加入房间
  const handleCreateRoom = useCallback(async () => {
    if (!userName.trim()) {
      toast.error('请输入你的名字');
      return;
    }

    setIsJoining(true);
    try {
      const result = await manager.createRoom(
        documentId,
        documentTitle,
        documentContent,
        userName.trim()
      );

      setRoomId(result.roomId);
      setIsConnected(true);
      toast.success('已创建协作房间');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建房间失败');
    } finally {
      setIsJoining(false);
    }
  }, [manager, documentId, documentTitle, documentContent, userName]);

  // 离开协作
  const handleLeave = useCallback(async () => {
    await manager.leaveRoom();
    setIsConnected(false);
    setCollaborators([]);
    setRoomId(null);
    onClose();
  }, [manager, onClose]);

  // 复制邀请链接
  const handleCopyInvite = useCallback(() => {
    const fullLink = `${inviteLink}?name=${encodeURIComponent(userName)}`;
    navigator.clipboard.writeText(fullLink);
    setInviteCopied(true);
    toast.success('链接已复制');
    setTimeout(() => setInviteCopied(false), 2000);
  }, [inviteLink, userName]);

  // 打开协作页面
  const handleOpenCollabPage = useCallback(() => {
    if (roomId) {
      const url = `/collab/${roomId}?name=${encodeURIComponent(userName)}`;
      window.open(url, '_blank');
    }
  }, [roomId, userName]);

  // 设置事件监听
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      manager.on('connected', () => {
        setIsConnected(true);
        setCollaborators(manager.getCollaborators());
      })
    );

    unsubscribers.push(
      manager.on('disconnected', () => {
        setIsConnected(false);
      })
    );

    unsubscribers.push(
      manager.on('collaborator_joined', (data) => {
        const { collaborator } = data as { collaborator: Collaborator };
        setCollaborators(prev => [...prev, collaborator]);
      })
    );

    unsubscribers.push(
      manager.on('collaborator_left', (data) => {
        const { collaborator } = data as { collaborator: Collaborator };
        setCollaborators(prev => prev.filter(c => c.id !== collaborator.id));
      })
    );

    unsubscribers.push(
      manager.on('cursor_moved', (data) => {
        const { userId, cursor } = data as { userId: string; cursor: CursorPosition };
        onCollaboratorCursor?.(userId, cursor);
      })
    );

    unsubscribers.push(
      manager.on('selection_changed', (data) => {
        const { userId, selection } = data as { userId: string; selection: SelectionRange | null };
        onCollaboratorSelection?.(userId, selection);
      })
    );

    unsubscribers.push(
      manager.on('operation_applied', (data) => {
        onOperationReceived?.(data);
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [manager, onCollaboratorCursor, onCollaboratorSelection, onOperationReceived]);

  // 格式化时间
  const formatLastActive = (lastActive: number) => {
    const diff = Date.now() - lastActive;
    if (diff < 60000) return '刚刚活跃';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    return `${Math.floor(diff / 3600000)} 小时前`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            实时协作
          </DialogTitle>
          <DialogDescription>
            与他人实时协作编辑此文档
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 连接状态 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm">已连接</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">未连接</span>
                </>
              )}
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {collaborators.length} 人在线
            </Badge>
          </div>

          {/* 未连接时显示创建表单 */}
          {!isConnected && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">你的名字</label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="输入你的名字"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                />
              </div>
              <Button 
                onClick={handleCreateRoom} 
                disabled={!userName.trim() || isJoining}
                className="w-full"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    创建房间中...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    创建协作房间
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 已连接时显示协作者列表 */}
          {isConnected && (
            <>
              {/* 邀请链接 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">邀请链接</label>
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly className="font-mono text-xs" />
                  <Button variant="outline" onClick={handleCopyInvite}>
                    {inviteCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  复制链接分享给其他人，他们可以加入协作
                </p>
              </div>

              {/* 协作者列表 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">协作者 ({collaborators.length})</label>
                <ScrollArea className="h-[200px] rounded-lg border">
                  <div className="p-2 space-y-1">
                    {collaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: collaborator.color }}
                        >
                          {collaborator.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{collaborator.name}</span>
                            {collaborator.isTyping && (
                              <Badge variant="secondary" className="text-xs">
                                正在输入...
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatLastActive(collaborator.lastActive)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {collaborator.cursor && (
                            <MousePointer className="h-3 w-3 text-muted-foreground" />
                          )}
                          {collaborator.selection && (
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* 打开完整协作页面 */}
              <Button variant="outline" onClick={handleOpenCollabPage} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                打开协作页面
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          {isConnected && (
            <Button variant="outline" onClick={handleLeave} className="text-destructive">
              离开协作
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 协作者光标指示器组件
interface CollaboratorCursorProps {
  collaborator: Collaborator;
  position: { top: number; left: number };
}

export function CollaboratorCursor({ collaborator, position }: CollaboratorCursorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-75"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div
        className="w-0.5 h-5 animate-pulse"
        style={{ backgroundColor: collaborator.color }}
      />
      <div
        className="absolute top-0 left-0.5 px-1.5 py-0.5 rounded text-xs text-white whitespace-nowrap"
        style={{ backgroundColor: collaborator.color }}
      >
        {collaborator.name}
      </div>
    </div>
  );
}

// 协作状态指示器组件
interface CollaborationIndicatorProps {
  isConnected: boolean;
  collaboratorCount: number;
  onClick: () => void;
}

export function CollaborationIndicator({
  isConnected,
  collaboratorCount,
  onClick,
}: CollaborationIndicatorProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-2",
        isConnected && "text-primary"
      )}
    >
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="hidden sm:inline">{collaboratorCount} 人协作</span>
          <span className="sm:hidden">{collaboratorCount}</span>
        </>
      ) : (
        <>
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">协作</span>
        </>
      )}
    </Button>
  );
}

export default CollaborationPanel;
