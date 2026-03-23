/**
 * Supabase 客户端配置
 *
 * 提供了两个客户端：
 * 1. getSupabaseClient() - 客户端使用（使用 anon key）
 * 2. getSupabaseAdminClient() - 服务端使用（使用 service role key）
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * 获取客户端 Supabase 客户端
 *
 * 使用 ANON KEY，适合客户端操作
 * 注意：需要设置适当的 RLS（Row Level Security）策略
 */
export function getSupabaseClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase 环境变量未配置，请检查 .env.local 文件');
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}

/**
 * 获取服务端 Supabase 客户端（管理员）
 *
 * 使用 SERVICE ROLE KEY，可以绕过 RLS
 * ⚠️ 仅在服务端 API 路由中使用
 */
export function getSupabaseAdminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase 服务端环境变量未配置，将使用本地存储');
    return null;
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * 带认证的客户端（如果未来支持多用户）
 */
export function getSupabaseClientWithToken(token: string) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Supabase 环境变量未配置');
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, token);
}
