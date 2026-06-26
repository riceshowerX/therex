/**
 * 环境变量配置
 *
 * 分为 server-only 和 public 两部分：
 * - serverEnv: 包含敏感信息，仅在服务端可用
 * - publicEnv: 仅包含 NEXT_PUBLIC_ 前缀的变量，可安全暴露给客户端
 *
 * 使用方式：
 * - 服务端：import { serverEnv } from '@/lib/env'
 * - 客户端：import { publicEnv } from '@/lib/env'
 */

import { z } from 'zod';

// 仅服务端可用的环境变量 schema
const serverEnvSchema = z.object({
  // Supabase 服务端密钥
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // AI API Key
  AI_API_KEY: z.string().min(1).optional(),
  // Sentry 服务端 token
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  // 对象存储密钥
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
});

// 公共环境变量 schema（仅 NEXT_PUBLIC_ 前缀）
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:5000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Therex'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

// 共享的可选配置
const sharedEnvSchema = z.object({
  AI_DEFAULT_MODEL: z.string().default('doubao'),
  AI_API_ENDPOINT: z.string().url().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

/**
 * 解析公共环境变量（客户端安全）
 */
export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

/**
 * 解析服务端环境变量（仅服务端使用）
 * 客户端 import 时这些值为 undefined
 */
export const serverEnv = (() => {
  // 在客户端不解析敏感变量
  if (typeof window !== 'undefined') {
    return {} as z.infer<typeof serverEnvSchema>;
  }
  try {
    return serverEnvSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      AI_API_KEY: process.env.AI_API_KEY,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 服务端环境变量验证失败:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw error;
  }
})();

/**
 * 解析共享环境变量
 */
export const sharedEnv = sharedEnvSchema.parse({
  AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL,
  AI_API_ENDPOINT: process.env.AI_API_ENDPOINT,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
});

/**
 * 向后兼容：统一 env 对象（仅服务端使用）
 * 优先使用 serverEnv / publicEnv / sharedEnv 替代
 */
export const env = {
  ...publicEnv,
  ...serverEnv,
  ...sharedEnv,
};

/**
 * 检查 Supabase 是否已配置
 */
export function isSupabaseConfigured(): boolean {
  return !!(publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * 检查 AI 是否已配置
 */
export function isAIConfigured(): boolean {
  return !!(sharedEnv.AI_API_ENDPOINT && serverEnv.AI_API_KEY);
}

/**
 * 检查对象存储是否已配置
 */
export function isStorageConfigured(): boolean {
  return !!(
    sharedEnv.AWS_REGION &&
    serverEnv.AWS_ACCESS_KEY_ID &&
    serverEnv.AWS_SECRET_ACCESS_KEY &&
    sharedEnv.AWS_S3_BUCKET
  );
}
