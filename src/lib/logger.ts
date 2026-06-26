/**
 * 生产环境日志工具
 * 在生产环境中过滤敏感信息，并支持结构化日志输出
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// 敏感字段列表，这些字段的值会被脱敏
const SENSITIVE_FIELDS = [
  'password',
  'apiKey',
  'api_key',
  'token',
  'secret',
  'authorization',
  'credential',
];

// 脱敏处理
function sanitize(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitize(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

// 格式化日志条目
function formatLog(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境使用 JSON 格式，便于日志收集和分析
    return JSON.stringify(entry);
  }
  // 开发环境使用可读格式
  const contextStr = entry.context 
    ? ` ${JSON.stringify(sanitize(entry.context))}` 
    : '';
  const errorStr = entry.error 
    ? `\n  Error: ${entry.error.name}: ${entry.error.message}${entry.error.stack ? `\n  ${entry.error.stack}` : ''}` 
    : '';
  return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${errorStr}`;
}

// 日志器类
class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message: `[${this.context}] ${message}`,
      timestamp: new Date().toISOString(),
      context: context ? (sanitize(context) as Record<string, unknown>) : undefined,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    const formatted = formatLog(entry);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        if (process.env.NODE_ENV !== 'production') {
          console.log(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }
}

// 创建日志器实例
export function createLogger(context: string): Logger {
  return new Logger(context);
}

// 默认日志器
export const logger = createLogger('app');
