import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 允许的开发来源
  allowedDevOrigins: ['*.dev.coze.site'],

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

  // 启用 Turbopack 配置以兼容 Next.js 16
  turbopack: {},

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

  // Webpack 配置
  webpack: (config, { isServer, dev }) => {
    // 服务端配置
    if (isServer) {
      config.externals = config.externals || [];
    }

    // 生产环境优化
    if (!dev) {
      // 启用 Tree Shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
      };
    }

    return config;
  },

  // 静态资源缓存头
  async headers() {
    return [
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
