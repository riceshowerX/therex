/**
 * 安全工具函数
 * 提供输入验证、清理和安全相关的工具函数
 */

/**
 * XSS 危险标签和属性
 */
const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'form', 'input'];
const DANGEROUS_ATTRS = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'];

/**
 * 清理 HTML 内容，移除危险标签和属性
 */
export function sanitizeHTML(html: string): string {
  let sanitized = html;
  
  // 移除危险标签
  DANGEROUS_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });
  
  // 移除危险属性
  DANGEROUS_ATTRS.forEach(attr => {
    const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  // 移除 javascript: 协议
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  
  // 移除 data: 协议中的脚本
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, '');
  
  return sanitized;
}

/**
 * 清理 Markdown 内容
 */
export function sanitizeMarkdown(markdown: string): string {
  // 移除潜在的 HTML 注入
  let sanitized = markdown.replace(/<[^>]+>/g, (match) => {
    // 允许安全的 HTML 标签
    const safeTags = ['b', 'i', 'strong', 'em', 'code', 'pre', 'br', 'p', 'span', 'div', 'a', 'img'];
    const tagMatch = match.match(/<\/?(\w+)/);
    if (tagMatch && safeTags.includes(tagMatch[1].toLowerCase())) {
      return match;
    }
    return '';
  });
  
  return sanitized;
}

/**
 * 转义 HTML 特殊字符
 */
export function escapeHTML(str: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
}

/**
 * 验证 URL 是否安全
 */
export function isSafeURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    // 只允许 http 和 https 协议
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * 清理 URL，移除潜在危险
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  // 移除空白字符
  const cleaned = url.trim();
  
  // 检查是否是安全协议
  if (cleaned.startsWith('javascript:') || cleaned.startsWith('data:')) {
    return '';
  }
  
  return cleaned;
}

/**
 * 验证字符串长度
 */
export function validateLength(
  value: string,
  min: number = 0,
  max: number = 100000
): { valid: boolean; error?: string } {
  if (value.length < min) {
    return { valid: false, error: `长度不能少于 ${min} 个字符` };
  }
  if (value.length > max) {
    return { valid: false, error: `长度不能超过 ${max} 个字符` };
  }
  return { valid: true };
}

/**
 * 验证文件名
 */
export function validateFilename(filename: string): { valid: boolean; error?: string } {
  // 检查空值
  if (!filename || !filename.trim()) {
    return { valid: false, error: '文件名不能为空' };
  }
  
  // 检查长度
  if (filename.length > 255) {
    return { valid: false, error: '文件名过长' };
  }
  
  // 检查非法字符
  const illegalChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (illegalChars.test(filename)) {
    return { valid: false, error: '文件名包含非法字符' };
  }
  
  // 检查保留名称 (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  if (reservedNames.test(filename)) {
    return { valid: false, error: '文件名使用了系统保留名称' };
  }
  
  return { valid: true };
}

/**
 * 验证 JSON 字符串
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * 安全的 JSON 解析
 */
export function safeJSONParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * 脱敏敏感信息
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const middle = '*'.repeat(Math.min(data.length - visibleChars * 2, 20));
  
  return `${start}${middle}${end}`;
}

/**
 * 检查是否是有效的 API Key 格式
 */
export function isValidAPIKey(key: string): boolean {
  // 基本格式检查：非空、长度合理、无特殊字符
  if (!key || key.length < 10 || key.length > 200) {
    return false;
  }
  
  // API Key 通常只包含字母、数字、连字符和下划线
  return /^[a-zA-Z0-9_-]+$/.test(key);
}

/**
 * 内容安全策略违规报告处理
 */
export function reportCSPViolation(violation: {
  blockedURI?: string;
  disposition?: string;
  documentURI?: string;
  effectiveDirective?: string;
  originalPolicy?: string;
  referrer?: string;
  sample?: string;
  statusCode?: number;
}): void {
  // 在生产环境中，应该发送到日志服务
  console.warn('CSP Violation:', {
    blocked: violation.blockedURI,
    directive: violation.effectiveDirective,
    document: violation.documentURI,
    sample: violation.sample,
  });
}

/**
 * Rate Limiter 类
 * 用于限制操作频率
 */
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  private destroyed = false;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * 检查是否可以执行请求
   */
  canProceed(): boolean {
    if (this.destroyed) return false;
    
    const now = Date.now();
    
    // 清理过期请求
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  /**
   * 获取剩余请求次数
   */
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * 获取重置时间（毫秒）
   */
  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }

  /**
   * 销毁实例，清理资源
   */
  destroy(): void {
    this.destroyed = true;
    this.requests = [];
  }
}

/**
 * 防抖函数（带取消功能）
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs);
      }
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}
