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
  Link2,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Crown,
  MessageSquare,
  Eye,
  MousePointer,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { getCollaborationManager, type CollaborationManager } from '@/lib/collaboration/manager';
import type { Collaborator, CursorPosition, SelectionRange } from '@/lib/collaboration/types';

interface CollaborationPanelProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  onCollaboratorCursor?: (userId: string, cursor: CursorPosition) => void;
  onCollaboratorSelection?: (userId: string, selection: SelectionRange | null) => void;
  onOperationReceived?: (operation: unknown) => void;
}

export function CollaborationPanel({
  open,
  onClose,
  documentId,
  documentTitle,
  onCollaboratorCursor,
  onCollaboratorSelection,
  onOperationReceived,
}: CollaborationPanelProps) {
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [manager] = useState<CollaborationManager>(() => getCollaborationManager());

  // 生成邀请链接
  const inviteLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const roomId = `${documentId}-${Date.now().toString(36)}`;
    return `${window.location.origin}/collab/${roomId}`;
  }, [documentId]);

  // 加入协作
  const handleJoin = useCallback(async () => {
    if (!userName.trim()) return;
    
    setIsJoining(true);
    try {
      await manager.joinRoom(`${documentId}-room`, documentId, userName.trim());
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to join collaboration:', error);
    } finally {
      setIsJoining(false);
    }
  }, [manager, documentId, userName]);

  // 离开协作
  const handleLeave = useCallback(async () => {
    await manager.leaveRoom();
    setIsConnected(false);
    setCollaborators([]);
    onClose();
  }, [manager, onClose]);

  // 复制邀请链接
  const handleCopyInvite = useCallback(() => {
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }, [inviteLink]);

  // 设置事件监听
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      manager.on('connected', () => {
        setIsConnected(true);
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

  // 获取活跃状态
  const getActiveStatus = (lastActive: number) => {
    const diff = Date.now() - lastActive;
    if (diff < 60000) return 'active';
    if (diff < 300000) return 'idle';
    return 'away';
  };

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

          {/* 未连接时显示加入表单 */}
          {!isConnected && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">你的名字</label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="输入你的名字"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>
              <Button 
                onClick={handleJoin} 
                disabled={!userName.trim() || isJoining}
                className="w-full"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    连接中...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    加入协作
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
