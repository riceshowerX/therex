/**
 * API 工具函数
 * 提供统一的请求验证、错误处理和日志记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-client';
import { serverEnv } from '@/lib/env';

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

/**
 * 统一鉴权：解析当前请求对应的用户身份（F1/F2/F3）。
 *
 * 策略（与 ai-config 原有实现对齐，收敛到共享工具）：
 * 1. 若配置了 SUPABASE_SERVICE_ROLE_KEY：
 *    - 校验 Authorization: Bearer <Supabase JWT>
 *    - 通过 supabase.auth.getUser(token) 换取真实 user.id
 *    - 无效/缺失 token 一律返回 null（调用方应返回 401）
 * 2. 共享密钥模式（x-ai-config-key === 服务端 env AI_CONFIG_ADMIN_KEY）：
 *    - 仅允许非 production 环境，或显式设置 ALLOW_SHARED_KEY_AUTH=true（M8）
 *    - 密钥只存在于服务端 env；Authorization 头保留给未来 Supabase JWT 使用
 * 3. 禁止把任意字符串直接当作身份；禁止 default_user 兜底。
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  // 方案 1：Supabase JWT 校验（Authorization 头）
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const adminClient = getSupabaseAdminClient();
      if (adminClient) {
        const { data, error } = await adminClient.auth.getUser(token);
        if (error || !data.user) return null;
        return data.user.id;
      }
    }
  }

  // 方案 2：共享密钥模式（专用请求头 x-ai-config-key，密钥仅存在于服务端 env）
  // M8：生产环境强制 Supabase JWT，共享密钥模式仅允许非 production 或显式开启。
  const sharedKeyAllowed =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_SHARED_KEY_AUTH === 'true';
  if (sharedKeyAllowed) {
    const adminKey = serverEnv.AI_CONFIG_ADMIN_KEY;
    if (adminKey) {
      const keyHeader = request.headers.get('x-ai-config-key');
      return keyHeader === adminKey ? 'local-admin' : null;
    }
  }

  // 未配置任何鉴权机制
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  console.warn('[api-utils] 未配置 SUPABASE_SERVICE_ROLE_KEY 或 AI_CONFIG_ADMIN_KEY，开发环境临时放行');
  return 'dev-user';
}

/**
 * 判断 IP 是否属于私网/保留地址（F3 imageUrl SSRF 防护）。
 * 覆盖 IPv4 私网段、IPv6 回环/未指定/链路本地/ULA/站点本地、IPv4-mapped IPv6 等。
 * 兼容带方括号的 IPv6 字面量（如 '[::1]'，来自 URL.hostname 的返回形式）。
 */
export function isPrivateIp(ip: string): boolean {
  const normalized = ip
    .toLowerCase()
    .replace(/^\[/, '')
    .replace(/\]$/, '');
  if (
    normalized === '::1' ||
    normalized === '::' ||
    normalized === '127.0.0.1' ||
    normalized === '0.0.0.0' ||
    normalized === 'localhost'
  ) {
    return true;
  }
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    // IPv6 ULA（fc00::/7）
    return true;
  }
  if (/^fe[89ab]/.test(normalized)) {
    // IPv6 链路本地（fe80::/10）
    return true;
  }
  if (/^fe[cdef]/.test(normalized)) {
    // IPv6 站点本地（fec0::/10，已废弃）
    return true;
  }
  // IPv4-mapped IPv6（::ffff:a.b.c.d 或 ::ffff:xxxx:xxxx，如 ::ffff:7f00:1 = 127.0.0.1）
  const v4Mapped = normalized.match(/^::ffff:(.+)$/);
  if (v4Mapped) {
    let v4 = v4Mapped[1];
    if (!v4.includes('.')) {
      // 十六进制形式：每组补零到 4 位后取最后 32 位转点分十进制（7f00:1 → 7f000001 → 127.0.0.1）
      const hex = v4
        .split(':')
        .map(g => g.padStart(4, '0'))
        .join('')
        .slice(-8);
      const nums: number[] = [];
      for (let i = 0; i < 8; i += 2) {
        nums.push(parseInt(hex.slice(i, i + 2), 16));
      }
      v4 = nums.join('.');
    }
    return isPrivateIp(v4);
  }
  if (normalized.includes(':')) {
    // 其他 IPv6 地址（无法简单判定为公网时保守拒绝内网段）
    return false;
  }
  const parts = normalized.split('.');
  if (parts.length !== 4) return true;
  const nums = parts.map(Number);
  if (nums.some(n => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = nums;
  if (a === 10) return true;                 // 10.0.0.0/8
  if (a === 127) return true;                // 127.0.0.0/8
  if (a === 169 && b === 254) return true;   // 169.254.0.0/16（云元数据）
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true;   // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 基准测试
  return false;
}

/**
 * 校验外部图片/资源 URL 是否安全（F3）。
 * 仅允许 https；拒绝 localhost/内网/保留地址主机名与形如 127.0.0.1 的字面量。
 */
export function isSafeExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') return false;
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return false;
    }
    // 剥离 IPv6 字面量方括号（URL.hostname 对 https://[::1]/ 返回 '[::1]'，否则私网判定失效）
    const bareHost = hostname.replace(/^\[|\]$/g, '');
    // 字面量 IP 直接做私网判定（防止 127.0.0.1、[::1]、[fe80::1] 等绕过）
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(bareHost) || bareHost.includes(':')) {
      return !isPrivateIp(bareHost);
    }
    return true;
  } catch {
    return false;
  }
}
