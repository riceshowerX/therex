import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 允许的开发来源
  allowedDevOrigins: ['*.dev.coze.site'],

  // 设置项目根目录，消除 lockfile 检测警告。
  // 修复：原硬编码 '/workspace/projects'（Coze 云环境路径）在 Windows 本机构建会出错（P1-7），
  // 改用当前目录（与 turbopack.root 一致）。
  outputFileTracingRoot: __dirname,

  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
    // 图片格式优化
    formats: ['image/avif', 'image/webp'],
    // 图片尺寸配置
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 最小缓存时间
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 天
  },

  // 磁盘缓存大小限制（修复 CVE-2026-27980）
  // 设置为 100MB，防止无限制增长导致磁盘空间耗尽
  cacheHandler: undefined,
  cacheMaxMemorySize: 100 * 1024 * 1024,

  // 启用 Turbopack 配置（Next 16 默认使用 Turbopack 打包，P1-7）
  // 修复：移除原 webpack 分支（使用 Record<string, unknown> 宽松类型且手动覆盖 optimization，
  // 与 Next 内部配置冲突）；Next 16 的默认优化已包含 tree-shaking 等能力。
  turbopack: {
    root: __dirname,
  },

  // 实验性功能
  experimental: {
    // 启用优化包导入
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'marked',
      'katex',
      'echarts',
    ],
    // 启用服务端 Actions
    serverActions: {
      allowedOrigins: ['*.vercel.app', 'localhost:5000'],
    },
  },

  // 压缩配置
  compress: true,

  // 生产环境优化
  poweredByHeader: false, // 移除 X-Powered-By 头

  // 严格模式
  reactStrictMode: true,

  // 输出配置
  output: 'standalone', // 适合 Docker 部署

  // 编译器优化
  compiler: {
    // 生产环境移除 console.log
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] } 
      : false,
  },

  // 静态资源缓存头和安全策略
  async headers() {
    return [
      // 静态资源缓存
      {
        source: '/:all*(svg|jpg|png|webp|avif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*fonts/:all*(woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 重定向配置
  async redirects() {
    return [
      // 旧路径重定向
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
