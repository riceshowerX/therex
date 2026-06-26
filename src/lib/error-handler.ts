/**
 * 全局错误处理工具
 *
 * 提供统一的错误处理、日志记录和用户通知
 */

import { toast } from 'sonner';

/**
 * 错误类型
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  type: ErrorType;
  code?: string;
  originalError?: Error;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.originalError = originalError;

    // 保持正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 错误处理器类
 */
class ErrorHandler {
  /**
   * 处理错误
   */
  handle(error: Error | AppError | unknown, context?: string): void {
    let appError: AppError;

    // 如果已经是 AppError，直接使用
    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      // 将普通 Error 转换为 AppError
      appError = new AppError(
        error.message,
        this.errorToType(error),
        undefined,
        error
      );
    } else {
      // 未知错误类型
      appError = new AppError(
        '发生了未知错误',
        ErrorType.UNKNOWN
      );
    }

    // 记录错误
    this.logError(appError, context);

    // 显示用户友好的错误提示
    this.showUserNotification(appError);
  }

  /**
   * 将普通 Error 转换为 AppError 类型
   */
  private errorToType(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('authentication') || message.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes('authorization') || message.includes('forbidden')) {
      return ErrorType.AUTHORIZATION;
    }
    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }
    if (message.includes('server') || message.includes('500')) {
      return ErrorType.SERVER;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * 记录错误到日志
   */
  private logError(error: AppError, context?: string): void {
    const logData = {
      timestamp: new Date().toISOString(),
      type: error.type,
      code: error.code,
      message: error.message,
      context: context || 'unknown',
      stack: error.stack,
      originalError: error.originalError?.stack,
    };

    console.error('[ErrorHandler]', logData);

    // 在生产环境中，可以将错误发送到监控服务
    // 例如：Sentry.captureException(error);
  }

  /**
   * 显示用户友好的错误通知
   */
  private showUserNotification(error: AppError): void {
    const userMessage = this.getUserMessage(error);

    switch (error.type) {
      case ErrorType.NETWORK:
        toast.error(userMessage, {
          description: '请检查网络连接后重试',
          action: {
            label: '重试',
            onClick: () => window.location.reload(),
          },
        });
        break;

      case ErrorType.VALIDATION:
        toast.error(userMessage, {
          description: '请检查输入内容',
        });
        break;

      case ErrorType.AUTHENTICATION:
        toast.error(userMessage, {
          description: '请重新登录',
        });
        break;

      case ErrorType.AUTHORIZATION:
        toast.error(userMessage, {
          description: '您没有权限执行此操作',
        });
        break;

      case ErrorType.NOT_FOUND:
        toast.error(userMessage);
        break;

      case ErrorType.SERVER:
        toast.error(userMessage, {
          description: '请稍后重试或联系技术支持',
        });
        break;

      default:
        toast.error(userMessage);
    }
  }

  /**
   * 获取用户友好的错误消息
   */
  private getUserMessage(error: AppError): string {
    // 如果错误消息已经是用户友好的，直接使用
    if (error.message && !error.message.includes('Error:')) {
      return error.message;
    }

    // 根据错误类型返回默认消息
    switch (error.type) {
      case ErrorType.NETWORK:
        return '网络连接失败';
      case ErrorType.VALIDATION:
        return '输入数据无效';
      case ErrorType.AUTHENTICATION:
        return '身份验证失败';
      case ErrorType.AUTHORIZATION:
        return '没有操作权限';
      case ErrorType.NOT_FOUND:
        return '资源未找到';
      case ErrorType.SERVER:
        return '服务器错误';
      default:
        return '操作失败';
    }
  }
}

// 导出单例
export const errorHandler = new ErrorHandler();

/**
 * 快捷函数：处理错误
 */
export function handleError(error: Error | AppError | unknown, context?: string): void {
  errorHandler.handle(error, context);
}

/**
 * 快捷函数：创建 AppError
 */
export function createAppError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  code?: string,
  originalError?: Error
): AppError {
  return new AppError(message, type, code, originalError);
}

/**
 * 快捷函数：异步错误处理包装器
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}

/**
 * 快捷函数：同步错误处理包装器
 */
export function trySync<T>(
  fn: () => T,
  context?: string
): T | null {
  try {
    return fn();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}
