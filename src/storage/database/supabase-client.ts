/**
 * Supabase 客户端配置
 *
 * 提供了三个客户端：
 * 1. getSupabaseClient() - 客户端使用（使用 anon key）
 * 2. getSupabaseAdminClient() - 服务端使用（使用 service role key）
 * 3. getSupabaseClientWithToken() - 带用户认证 token 的客户端
 */

import { createClient } from '@supabase/supabase-js';
import { publicEnv, serverEnv } from '@/lib/env';

/**
 * 获取客户端 Supabase 客户端
 *
 * 使用 ANON KEY，适合客户端操作
 * 注意：需要设置适当的 RLS（Row Level Security）策略
 */
export function getSupabaseClient() {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase 环境变量未配置，请检查 .env.local 文件');
  }

  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase 服务端环境变量未配置，将使用本地存储');
    return null;
  }

  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * 带认证的客户端（用于已登录用户的请求）
 *
 * 使用 anon key + 用户 access token，遵循 RLS 策略
 * token 应为 Supabase Auth 返回的 access_token
 */
export function getSupabaseClientWithToken(token: string) {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase 环境变量未配置');
  }

  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
