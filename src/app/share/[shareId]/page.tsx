/**
 * 分享文档查看页面
 * /share/[shareId]
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MarkdownPreview } from '@/components/markdown-preview';
import {
  Lock,
  Eye,
  Clock,
  Download,
  Copy,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { shareManager, type ShareRecord } from '@/lib/share/manager';
import { toast } from 'sonner';

export default function ShareViewPage() {
  const params = useParams();
  const shareId = params.shareId as string;

  const [share, setShare] = useState<ShareRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 加载分享记录
  useEffect(() => {
    const record = shareManager.getShare(shareId);
    if (!record) {
      setError('分享链接不存在或已过期');
      setLoading(false);
      return;
    }

    // 检查是否过期
    if (record.expiresAt && record.expiresAt < Date.now()) {
      setError('分享链接已过期');
      setLoading(false);
      return;
    }

    setShare(record);

    // 如果有密码，需要验证
    if (record.password) {
      setNeedsPassword(true);
    } else {
      setIsAuthenticated(true);
      // 记录访问
      shareManager.recordView(shareId, {
        referrer: document.referrer,
      });
    }

    setLoading(false);
  }, [shareId]);

  // 验证密码
  const handlePasswordSubmit = () => {
    if (!share || !share.password) return;

    if (passwordInput === share.password) {
      setIsAuthenticated(true);
      setNeedsPassword(false);
      shareManager.recordView(shareId, {
        referrer: document.referrer,
      });
    } else {
      toast.error('密码错误');
    }
  };

  // 复制内容
  const handleCopy = () => {
    if (!share) return;
    navigator.clipboard.writeText(share.documentContent);
    toast.success('内容已复制');
  };

  // 下载文档
  const handleDownload = () => {
    if (!share) return;
    const blob = new Blob([share.documentContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${share.documentTitle || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-lg font-semibold">{error}</h2>
              <p className="text-sm text-muted-foreground">
                请联系分享者获取新的分享链接
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsPassword && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              受密码保护的文档
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                此文档需要密码才能查看，请输入密码：
              </p>
              <Input
                type="password"
                placeholder="输入密码"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              <Button onClick={handlePasswordSubmit} className="w-full">
                验证密码
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!share || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部信息栏 */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between px-6 max-w-4xl">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="font-semibold truncate">{share.documentTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
              <Eye className="h-3 w-3" />
              {share.viewCount} 次查看
            </div>
            {share.allowCopy && (
              <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1">
                <Copy className="h-4 w-4" />
                复制
              </Button>
            )}
            {share.allowDownload && (
              <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1">
                <Download className="h-4 w-4" />
                下载
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 文档内容 */}
      <main className="container px-6 py-8 max-w-4xl">
        {share.expiresAt && (
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              此分享链接将于 {new Date(share.expiresAt).toLocaleDateString()} 过期
            </AlertDescription>
          </Alert>
        )}
        <div className="rounded-lg border border-border bg-card p-6">
          <MarkdownPreview markdown={share.documentContent} />
        </div>
      </main>
    </div>
  );
}
