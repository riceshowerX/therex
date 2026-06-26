'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });

    // 调用自定义错误处理
    this.props.onError?.(error, errorInfo);

    // 可以在这里添加错误上报逻辑
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // 错误上报逻辑（可以集成 Sentry 等服务）
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    // 示例：发送到后端日志服务
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(console.error);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const bugReport = `
## 错误报告

**错误信息**: ${error?.message}

**错误堆栈**:
\`\`\`
${error?.stack}
\`\`\`

**组件堆栈**:
\`\`\`
${errorInfo?.componentStack}
\`\`\`

**时间**: ${new Date().toLocaleString()}

**页面**: ${window.location.href}
    `.trim();

    // 可以复制到剪贴板或打开 GitHub Issues
    navigator.clipboard.writeText(bugReport).then(() => {
      alert('错误报告已复制到剪贴板');
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>出现错误</CardTitle>
                  <CardDescription>
                    应用遇到了一个意外错误
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium text-destructive mb-2">
                  {this.state.error?.message || '未知错误'}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                    {this.state.error?.stack}
                  </pre>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleReportBug}
                className="w-full"
              >
                <Bug className="h-4 w-4 mr-2" />
                复制错误报告
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 函数组件错误处理 Hook
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  if (error) {
    throw error;
  }

  return { captureError, resetError };
}

// 异步错误处理 Hook
export function useAsyncError() {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
