import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  // 启用 Turbopack 配置以兼容 Next.js 16
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 标记某些包为外部依赖，避免服务端打包问题
      config.externals = config.externals || [];
    }
    return config;
  },
};

export default nextConfig;
