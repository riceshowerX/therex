'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误到日志服务
    console.error('Global error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle>发生严重错误</CardTitle>
                <CardDescription>
                  应用遇到了一个严重错误，需要重新加载
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-destructive mb-2">
                {error.message || '未知错误'}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground">
                  错误 ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={reset} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
