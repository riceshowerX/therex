import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 安全头配置
const securityHeaders = [
  // 防止点击劫持
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // 防止 MIME 类型嗅探
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // XSS 保护
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // 引用策略
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // 权限策略
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // 内容安全策略
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https: wss:",
      "worker-src 'self' blob:",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
  // 严格传输安全 (HSTS)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 添加安全头
  securityHeaders.forEach(({ key, value }) => {
    response.headers.set(key, value);
  });

  // API 请求速率限制检查 (简单实现)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 添加 API 缓存控制
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  // 静态资源缓存
  if (
    request.nextUrl.pathname.startsWith('/_next/static/') ||
    request.nextUrl.pathname.startsWith('/icons/') ||
    request.nextUrl.pathname.endsWith('.png') ||
    request.nextUrl.pathname.endsWith('.jpg') ||
    request.nextUrl.pathname.endsWith('.svg') ||
    request.nextUrl.pathname.endsWith('.woff') ||
    request.nextUrl.pathname.endsWith('.woff2')
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
