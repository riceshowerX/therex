/**
 * API 工具函数
 * 提供统一的请求验证、错误处理和日志记录
 */

import { NextRequest, NextResponse } from 'next/server';

// 请求大小限制
export const MAX_REQUEST_SIZE = 1 * 1024 * 1024; // 1MB

// 内容长度限制
export const MAX_CONTENT_LENGTH = 100000; // 100,000 字符

// 简单的内存 Rate Limiter
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private isDestroyed: boolean = false;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // 定期清理过期记录（仅在非测试环境）
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupTimer = setInterval(() => this.cleanup(), windowMs);
    }
  }

  /**
   * 销毁 RateLimiter，清理资源
   */
  destroy(): void {
    this.isDestroyed = true;
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.requests.clear();
  }

  private cleanup() {
    if (this.isDestroyed) return;
    
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    if (this.isDestroyed) {
      return { allowed: true, remaining: this.maxRequests, resetTime: Date.now() + this.windowMs };
    }

    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validTimestamps);
      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestRequest + this.windowMs,
      };
    }

    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);

    return {
      allowed: this.maxRequests - validTimestamps.length > 0,
      remaining: Math.max(0, this.maxRequests - validTimestamps.length),
      resetTime: now + this.windowMs,
    };
  }
}

// 全局 Rate Limiter 实例
export const rateLimiter = new RateLimiter(60000, 100); // 每分钟 100 次请求（AI/配置等敏感接口）
// 高频接口（协作光标/同步等）使用更宽松的限制
export const rateLimiterHigh = new RateLimiter(60000, 600); // 每分钟 600 次请求

/**
 * 获取客户端标识符
 *
 * 安全说明（P1-8）：X-Forwarded-For 可由客户端伪造，一律不信任。
 * 优先级：request.ip（Next 16 平台填充）→ x-real-ip（反向代理填充）→
 * x-vercel-forwarded-for（Vercel 等平台的真实代理头）→ 'unknown'。
 * 生产环境应确保反向代理/部署平台填充了可信的 x-real-ip 或 request.ip。
 */
export function getClientIdentifier(request: NextRequest): string {
  // Next 16 的 NextRequest 暴露 ip 属性（部署平台填充）
  const requestIp = (request as NextRequest & { ip?: string }).ip;
  if (requestIp) return requestIp;

  // 优先使用反向代理填充的真实 IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Vercel 等平台的真实代理头（仅信任平台注入，不信任客户端 XFF）
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) {
    return vercelForwarded.split(',')[0].trim();
  }

  // 无可用来源时返回 'unknown'，不再回退到可伪造的 X-Forwarded-For 或 User-Agent
  return 'unknown';
}

/**
 * API 响应包装器
 */
export class ApiResponse {
  static success(data: unknown, status: number = 200): NextResponse {
    return NextResponse.json({ success: true, data }, { status });
  }

  static error(message: string, status: number = 400, code?: string): NextResponse {
    return NextResponse.json(
      { success: false, error: message, code },
      { status }
    );
  }

  static badRequest(message: string = '请求参数错误'): NextResponse {
    return this.error(message, 400, 'BAD_REQUEST');
  }

  static unauthorized(message: string = '未授权'): NextResponse {
    return this.error(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = '禁止访问'): NextResponse {
    return this.error(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = '资源未找到'): NextResponse {
    return this.error(message, 404, 'NOT_FOUND');
  }

  static tooManyRequests(message: string = '请求过于频繁，请稍后再试'): NextResponse {
    return this.error(message, 429, 'TOO_MANY_REQUESTS');
  }

  static internalError(message: string = '服务器内部错误'): NextResponse {
    return this.error(message, 500, 'INTERNAL_ERROR');
  }
}

/**
 * 验证请求大小
 */
export function validateRequestSize(request: NextRequest): NextResponse | null {
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (contentLength > MAX_REQUEST_SIZE) {
    return ApiResponse.error('请求体过大，请减少内容', 413, 'PAYLOAD_TOO_LARGE');
  }
  return null;
}

/**
 * 验证内容长度
 */
export function validateContentLength(content: string, maxLength: number = MAX_CONTENT_LENGTH): boolean {
  return content.length <= maxLength;
}

/**
 * 日志记录器
 */
export class ApiLogger {
  private static formatMessage(level: string, message: string, data?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  static info(message: string, data?: Record<string, unknown>): void {
    console.log(this.formatMessage('INFO', message, data));
  }

  static warn(message: string, data?: Record<string, unknown>): void {
    console.warn(this.formatMessage('WARN', message, data));
  }

  static error(message: string, error?: unknown, data?: Record<string, unknown>): void {
    const errorData = error instanceof Error 
      ? { ...data, error: error.message, stack: error.stack }
      : { ...data, error };
    console.error(this.formatMessage('ERROR', message, errorData));
  }
}

/**
 * 包装 API 处理函数，提供统一的错误处理、限流和日志记录
 * @param handler 处理函数（可接收 Next.js 动态路由上下文作为第二个参数）
 * @param limiter 使用的限流器（默认 rateLimiter，高频接口可传 rateLimiterHigh）
 */
export function withApiHandler(
  handler: (request: NextRequest, context?: unknown) => Promise<Response>,
  limiter: RateLimiter = rateLimiter
) {
  return async (request: NextRequest, context?: unknown): Promise<Response> => {
    const startTime = Date.now();
    const clientIp = getClientIdentifier(request);
    const path = new URL(request.url).pathname;

    try {
      // Rate limiting
      const rateLimitResult = limiter.check(clientIp);
      if (!rateLimitResult.allowed) {
        ApiLogger.warn('Rate limit exceeded', { clientIp, path });
        return ApiResponse.tooManyRequests();
      }

      // 执行处理函数
      const response = await handler(request, context);

      // 记录请求日志
      const duration = Date.now() - startTime;
      ApiLogger.info('API request completed', {
        method: request.method,
        path,
        status: response.status,
        duration: `${duration}ms`,
        clientIp,
      });

      return response;
    } catch (error) {
      // 记录错误日志
      const duration = Date.now() - startTime;
      ApiLogger.error('API request failed', error, {
        method: request.method,
        path,
        duration: `${duration}ms`,
        clientIp,
      });

      // 返回统一错误响应
      if (error instanceof SyntaxError) {
        return ApiResponse.badRequest('请求格式错误');
      }

      return ApiResponse.internalError('服务暂时不可用，请稍后重试');
    }
  };
}

/**
 * 验证必要字段
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  fields: string[]
): { valid: boolean; missing: string[] } {
  const missing = fields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * 安全的 JSON 解析
 */
export async function safeParseJson<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * 清理敏感信息（用于日志记录）
 */
export function sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['apiKey', 'api_key', 'password', 'token', 'secret', 'authorization'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}
