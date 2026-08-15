/**
 * 协作房间页面
 * /collab/[roomId]
 */

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Users,
  Wifi,
  WifiOff,
  UserPlus,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
  Edit3,
  RefreshCw,
  Home,
} from 'lucide-react';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  lastActive: number;
  isTyping: boolean;
}

interface RoomData {
  id: string;
  documentId: string;
  documentTitle: string;
  documentContent: string;
  documentVersion: number;
}

export default function CollaborationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [userName, setUserName] = useState('');
  const [room, setRoom] = useState<RoomData | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 最近一次已知的文档版本（用于心跳时判断是否需要重新拉取，P1-4）
  const roomVersionRef = useRef(0);
  const roomTokenRef = useRef<string | null>(null);
  const [roomToken, setRoomToken] = useState<string | null>(null);

  // 从 URL 参数获取标题（文档内容不再通过 URL 传递，改由 API 获取，P1-4）
  const docTitle = searchParams.get('title') || '协作文档';

  useEffect(() => {
    const nameFromUrl = searchParams.get('name');
    if (nameFromUrl) {
      setUserName(decodeURIComponent(nameFromUrl));
    }
  }, [searchParams]);

  // 获取房间信息
  const fetchRoom = useCallback(async () => {
    try {
      const token = roomTokenRef.current;
      const url = token
        ? `/api/collaboration/room/${roomId}?token=${encodeURIComponent(token)}`
        : `/api/collaboration/room/${roomId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.success) {
        // 未加入时仅返回摘要（requiresJoin），不视为错误
        if (data.requiresJoin) {
          setRoom(data.room || null);
          setError(null);
          return;
        }
        setRoom(data.room);
        setDocumentContent(data.room.documentContent);
        roomVersionRef.current = data.room.documentVersion || 0;
        setError(null);
      } else if (response.status === 401) {
        // 未加入房间：显示加入表单而非错误
        setError(null);
      } else {
        setError(data.error || '房间不存在');
      }
    } catch {
      setError('无法连接到服务器');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 创建新房间（当房间不存在时）
  const handleCreateNewRoom = useCallback(async () => {
    if (!userName.trim()) {
      toast.error('请输入你的名字');
      return;
    }

    setJoining(true);
    try {
      const response = await fetch('/api/collaboration/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: `doc-${Date.now()}`,
          documentTitle: docTitle,
          documentContent: '# 开始协作\n\n这是一个新的协作文档。',
          userName: userName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 保存房间访问令牌（P1-3）
        roomTokenRef.current = data.roomToken || null;
        setRoomToken(data.roomToken || null);
        // 跳转到新房间
        router.push(`/collab/${data.room.id}?name=${encodeURIComponent(userName)}`);
      } else {
        toast.error(data.error || '创建房间失败');
      }
    } catch {
      toast.error('创建房间失败');
    } finally {
      setJoining(false);
    }
  }, [userName, docTitle, router]);

  // 加入房间
  const handleJoin = useCallback(async () => {
    if (!userName.trim()) {
      toast.error('请输入你的名字');
      return;
    }

    setJoining(true);
    try {
      const response = await fetch('/api/collaboration/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, userName: userName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setUserId(data.user.id);
        // 保存房间访问令牌（P1-3）
        roomTokenRef.current = data.roomToken || null;
        setRoomToken(data.roomToken || null);
        setIsConnected(true);
        setCollaborators(data.room.collaborators);
        if (data.room.documentContent) {
          setDocumentContent(data.room.documentContent);
        }
        if (data.room.documentVersion) {
          roomVersionRef.current = data.room.documentVersion;
        }
        toast.success('已加入协作');
      } else {
        toast.error(data.error || '加入失败');
      }
    } catch {
      toast.error('连接失败');
    } finally {
      setJoining(false);
    }
  }, [roomId, userName]);

  // 离开房间
  const handleLeave = useCallback(async () => {
    if (userId) {
      try {
        await fetch('/api/collaboration/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, userId, roomToken: roomTokenRef.current }),
        });
      } catch {
        // 忽略错误
      }
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    router.push('/');
  }, [roomId, userId, router]);

  // 复制邀请链接
  const handleCopyLink = useCallback(() => {
    const link = `${window.location.origin}/collab/${roomId}?name=${encodeURIComponent(userName)}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success('链接已复制');
    setTimeout(() => setLinkCopied(false), 2000);
  }, [roomId, userName]);

  // 连接 SSE 事件流（依赖稳定值，避免因 room 对象引用变化导致无限重连，P1-4）
  useEffect(() => {
    if (!isConnected || !userId || !roomToken) return;

    eventSourceRef.current = new EventSource(
      `/api/collaboration/events?roomId=${roomId}&token=${encodeURIComponent(roomToken)}`
    );

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'init':
            setRoom(data.room);
            setDocumentContent(data.room.documentContent);
            setCollaborators(data.collaborators);
            roomVersionRef.current = data.room.documentVersion || 0;
            break;

          case 'heartbeat':
            setCollaborators(data.collaborators);
            // 仅当远端版本高于本地已知版本时才重新拉取全文
            if (typeof data.documentVersion === 'number' && data.documentVersion > roomVersionRef.current) {
              roomVersionRef.current = data.documentVersion;
              fetchRoom();
            }
            break;

          case 'room_closed':
            toast.error('房间已关闭');
            handleLeave();
            break;
        }
      } catch {
        // 忽略解析错误
      }
    };

    eventSourceRef.current.onerror = () => {
      console.error('SSE connection error');
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isConnected, userId, roomId, roomToken, handleLeave, fetchRoom]);

  // 同步文档内容
  const syncContent = useCallback(async (content: string) => {
    if (!userId || !room) return;

    try {
      const response = await fetch('/api/collaboration/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          userId,
          content,
          roomToken: roomTokenRef.current,
          baseVersion: roomVersionRef.current,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (data.success && typeof data.version === 'number') {
        roomVersionRef.current = data.version;
        if (data.conflict) {
          toast.warning('检测到文档版本冲突，已以最近写入为准');
        }
      }
    } catch {
      // 忽略错误
    }
  }, [roomId, userId, room]);

  // 更新输入状态
  const updateTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!userId) return;

    try {
      await fetch('/api/collaboration/cursor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          userId,
          isTyping,
          roomToken: roomTokenRef.current,
        }),
      });
    } catch {
      // 忽略错误
    }
  }, [roomId, userId]);

  // 处理内容变化
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setDocumentContent(content);

    updateTypingStatus(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
      syncContent(content);
    }, 500);
  }, [syncContent, updateTypingStatus]);

  // 初始加载
  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // 格式化时间
  const formatLastActive = (lastActive: number) => {
    const diff = Date.now() - lastActive;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    return `${Math.floor(diff / 3600000)} 小时前`;
  };

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 房间不存在 - 显示创建新房间的选项
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-amber-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              房间不存在
            </CardTitle>
            <CardDescription>
              该协作房间可能已过期或从未创建。您可以创建一个新房间继续协作。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                协作房间在创建者关闭后会自动清理。如果房间已过期，请让创建者重新分享链接。
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">你的名字</label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="输入你的名字"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">文档标题（可选）</label>
              <Input
                value={docTitle}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('title', e.target.value);
                  window.history.replaceState({}, '', url.toString());
                }}
                placeholder="文档标题"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleCreateNewRoom} disabled={!userName.trim() || joining}>
                {joining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    创建新房间
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                <Home className="h-4 w-4 mr-2" />
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部工具栏 */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLeave}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              离开
            </Button>
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{room?.documentTitle || '协作文档'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 连接状态 */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">已连接</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">未连接</span>
                </>
              )}
            </div>

            {/* 协作者数量 */}
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {collaborators.length} 人在线
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!isConnected ? (
          /* 加入表单 */
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                加入协作
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                disabled={!userName.trim() || joining}
                className="w-full"
              >
                {joining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    加入中...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    加入协作
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* 编辑器和协作者面板 */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 编辑器 */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">文档编辑</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      {linkCopied ? (
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      复制邀请链接
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={documentContent}
                    onChange={handleContentChange}
                    className="min-h-[500px] font-mono text-sm resize-none"
                    placeholder="开始编写你的文档..."
                  />
                </CardContent>
              </Card>
            </div>

            {/* 协作者列表 */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    协作者
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {collaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                          style={{ backgroundColor: collaborator.color }}
                        >
                          {collaborator.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate text-sm">
                              {collaborator.name}
                            </span>
                            {collaborator.id === userId && (
                              <Badge variant="outline" className="text-xs">
                                你
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {collaborator.isTyping ? (
                              <span className="text-primary">正在输入...</span>
                            ) : (
                              <span>{formatLastActive(collaborator.lastActive)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 使用提示 */}
              <Alert className="mt-4">
                <AlertDescription className="text-xs">
                  协作者的光标位置和选区会实时同步显示。内容会自动保存。
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
