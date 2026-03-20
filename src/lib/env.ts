/**
 * 环境变量配置
 *
 * 确保所有环境变量在运行时都被正确定义
 */

import { z } from 'zod';

const envSchema = z.object({
  // Supabase 配置
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // AI 配置（可选）
  AI_DEFAULT_MODEL: z.string().default('doubao'),
  AI_API_ENDPOINT: z.string().url().optional(),
  AI_API_KEY: z.string().min(1).optional(),

  // 应用配置
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:5000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Therex'),

  // 错误监控（可选）
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),

  // 对象存储（可选）
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

/**
 * 解析并验证环境变量
 */
function parseEnv() {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL,
      AI_API_ENDPOINT: process.env.AI_API_ENDPOINT,
      AI_API_KEY: process.env.AI_API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 环境变量验证失败:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw error;
  }
}

export const env = parseEnv();

/**
 * 检查 Supabase 是否已配置
 */
export function isSupabaseConfigured(): boolean {
  return !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * 检查 AI 是否已配置
 */
export function isAIConfigured(): boolean {
  return !!(env.AI_API_ENDPOINT && env.AI_API_KEY);
}

/**
 * 检查对象存储是否已配置
 */
export function isStorageConfigured(): boolean {
  return !!(
    env.AWS_REGION &&
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY &&
    env.AWS_S3_BUCKET
  );
}
