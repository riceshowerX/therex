/**
 * AI 配置 API
 *
 * 用于安全地管理 AI 配置，避免在前端存储敏感信息
 * - API Key 仅通过后端存储和读取，GET 接口仅返回是否已设置标志
 * - 使用 snake_case 列名匹配 Supabase 数据库 schema
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-client';
import { z } from 'zod';

// 从请求头中提取用户 ID（临时方案，后续接入正式鉴权）
function getUserId(request: NextRequest): string {
  // 优先从 Authorization header 获取
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // 回退到自定义 header
  const userId = request.headers.get('x-user-id');
  if (userId) return userId;
  // 兜底：使用默认用户（未鉴权场景）
  return 'default_user';
}

// 数据库返回的 snake_case 字段映射为 camelCase
interface DBAIConfig {
  id: string;
  provider: string;
  api_key?: string;
  api_endpoint: string;
  model: string;
  temperature: number;
  max_tokens: number;
  enable_system_prompt: boolean;
  system_prompt: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

function toClientConfig(dbConfig: DBAIConfig) {
  return {
    id: dbConfig.id,
    provider: dbConfig.provider,
    api_key_set: !!dbConfig.api_key,
    apiEndpoint: dbConfig.api_endpoint,
    model: dbConfig.model,
    temperature: dbConfig.temperature / 100,
    maxTokens: dbConfig.max_tokens,
    enableSystemPrompt: dbConfig.enable_system_prompt,
    systemPrompt: dbConfig.system_prompt,
    isDefault: dbConfig.is_default,
    createdAt: dbConfig.created_at,
    updatedAt: dbConfig.updated_at,
  };
}

// 验证 schema - 接受前端 camelCase 参数
const createAIConfigSchema = z.object({
  provider: z.enum(['doubao', 'deepseek', 'openai', 'kimi', 'custom']),
  api_key: z.string().min(1),
  api_endpoint: z.string().url(),
  model: z.string().min(1),
  temperature: z.number().min(0).max(1).optional().default(0.7),
  max_tokens: z.number().min(1).max(8192).optional().default(2048),
  enable_system_prompt: z.boolean().optional().default(true),
  system_prompt: z.string().optional().default('你是一个专业的写作助手。'),
  is_default: z.boolean().optional().default(false),
});

const updateAIConfigSchema = z.object({
  api_key: z.string().min(1).optional(),
  api_endpoint: z.string().url().optional(),
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(1).optional(),
  max_tokens: z.number().min(1).max(8192).optional(),
  enable_system_prompt: z.boolean().optional(),
  system_prompt: z.string().optional(),
  is_default: z.boolean().optional(),
});

// GET - 获取所有 AI 配置（不返回 api_key 明文）
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const client = getSupabaseAdminClient();
    if (!client) {
      return NextResponse.json(
        { data: [], message: 'Supabase 未配置，使用本地存储' },
        { status: 200 }
      );
    }
    
    const { data: configs, error } = await client
      .from('ai_configurations')
      .select('id, provider, api_key, api_endpoint, model, temperature, max_tokens, enable_system_prompt, system_prompt, is_default, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取 AI 配置失败:', error);
      return NextResponse.json(
        { error: '获取 AI 配置失败' },
        { status: 500 }
      );
    }

    // 将 snake_case 转为 camelCase，并隐藏 api_key 明文
    const safeConfigs = (configs as DBAIConfig[] || []).map(toClientConfig);

    return NextResponse.json({ data: safeConfigs });
  } catch (error) {
    console.error('AI 配置 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST - 创建 AI 配置
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const validatedData = createAIConfigSchema.parse(body);

    const client = getSupabaseAdminClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Supabase 未配置，无法保存 AI 配置到云端' },
        { status: 503 }
      );
    }

    // 如果设置为默认配置，取消其他默认配置
    if (validatedData.is_default) {
      await client
        .from('ai_configurations')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    const { data: config, error } = await client
      .from('ai_configurations')
      .insert({
        user_id: userId,
        provider: validatedData.provider,
        api_key: validatedData.api_key,
        api_endpoint: validatedData.api_endpoint,
        model: validatedData.model,
        temperature: Math.round(validatedData.temperature * 100),
        max_tokens: validatedData.max_tokens,
        enable_system_prompt: validatedData.enable_system_prompt,
        system_prompt: validatedData.system_prompt,
        is_default: validatedData.is_default,
      })
      .select('id, provider, api_key, api_endpoint, model, temperature, max_tokens, enable_system_prompt, system_prompt, is_default, created_at, updated_at')
      .single();

    if (error) {
      console.error('创建 AI 配置失败:', error);
      return NextResponse.json(
        { error: '创建 AI 配置失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: toClientConfig(config as DBAIConfig) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '参数验证失败', details: error.issues },
        { status: 400 }
      );
    }

    console.error('AI 配置 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// PATCH - 更新 AI 配置
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: '缺少配置 ID' },
        { status: 400 }
      );
    }

    const validatedData = updateAIConfigSchema.parse(updates);

    const client = getSupabaseAdminClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Supabase 未配置，无法更新 AI 配置' },
        { status: 503 }
      );
    }

    // 如果设置为默认配置，取消其他默认配置
    if (validatedData.is_default === true) {
      await client
        .from('ai_configurations')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.api_key !== undefined) updateData.api_key = validatedData.api_key;
    if (validatedData.api_endpoint !== undefined) updateData.api_endpoint = validatedData.api_endpoint;
    if (validatedData.model !== undefined) updateData.model = validatedData.model;
    if (validatedData.temperature !== undefined) updateData.temperature = Math.round(validatedData.temperature * 100);
    if (validatedData.max_tokens !== undefined) updateData.max_tokens = validatedData.max_tokens;
    if (validatedData.enable_system_prompt !== undefined) updateData.enable_system_prompt = validatedData.enable_system_prompt;
    if (validatedData.system_prompt !== undefined) updateData.system_prompt = validatedData.system_prompt;
    if (validatedData.is_default !== undefined) updateData.is_default = validatedData.is_default;

    const { data: config, error } = await client
      .from('ai_configurations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, provider, api_key, api_endpoint, model, temperature, max_tokens, enable_system_prompt, system_prompt, is_default, created_at, updated_at')
      .single();

    if (error) {
      console.error('更新 AI 配置失败:', error);
      return NextResponse.json(
        { error: '更新 AI 配置失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: toClientConfig(config as DBAIConfig) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '参数验证失败', details: error.issues },
        { status: 400 }
      );
    }

    console.error('AI 配置 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除 AI 配置
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少配置 ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseAdminClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Supabase 未配置，无法删除 AI 配置' },
        { status: 503 }
      );
    }

    const { error } = await client
      .from('ai_configurations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('删除 AI 配置失败:', error);
      return NextResponse.json(
        { error: '删除 AI 配置失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI 配置 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
