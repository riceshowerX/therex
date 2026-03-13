'use client';

/**
 * 错误边界组件
 *
 * 捕获子组件中的 JavaScript 错误，并显示友好的错误界面
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 在生产环境中，可以发送错误日志到监控服务
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  /**
   * 将错误日志发送到监控服务（示例）
   */
  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // 这里可以集成 Sentry、LogRocket 等错误监控服务
    // 例如：Sentry.captureException(error);
    console.log('Error logged to monitoring service:', error);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义的 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误界面
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="max-w-lg w-full p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-12 h-12 text-destructive" />
              </div>
              <div className="flex-1 space-y-3">
                <h2 className="text-xl font-semibold">出错了</h2>
                <p className="text-muted-foreground">
                  应用遇到了意外错误。请尝试刷新页面或联系技术支持。
                </p>

                {this.state.error && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-mono text-destructive">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      错误详情（仅开发环境显示）
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button onClick={this.handleReset} variant="default">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重试
                  </Button>
                  <Button onClick={this.handleReload} variant="outline">
                    刷新页面
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 高阶组件版本，用于包装函数式组件
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * 简单的错误页面组件
 */
export function ErrorFallback({
  error,
  onReset,
}: {
  error?: Error;
  onReset?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-lg w-full p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <div className="flex-1 space-y-3">
            <h2 className="text-xl font-semibold">出错了</h2>
            <p className="text-muted-foreground">
              应用遇到了意外错误。
            </p>
            {error && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-mono text-destructive">
                  {error.message}
                </p>
              </div>
            )}
            {onReset && (
              <Button onClick={onReset} variant="default" className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                重试
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
