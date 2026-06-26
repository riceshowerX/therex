/**
 * AI 配置 API
 *
 * 用于安全地管理 AI 配置，避免在前端存储敏感信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-client';
import { z } from 'zod';

// 验证 schema
const createAIConfigSchema = z.object({
  provider: z.enum(['doubao', 'deepseek', 'openai', 'kimi', 'custom']),
  apiKey: z.string().min(1),
  apiEndpoint: z.string().url(),
  model: z.string().min(1),
  temperature: z.number().min(0).max(1).optional().default(0.7),
  maxTokens: z.number().min(1).max(8192).optional().default(2048),
  enableSystemPrompt: z.boolean().optional().default(true),
  systemPrompt: z.string().optional().default('你是一个专业的写作助手。'),
  isDefault: z.boolean().optional().default(false),
});

const updateAIConfigSchema = z.object({
  apiKey: z.string().min(1).optional(),
  apiEndpoint: z.string().url().optional(),
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(1).max(8192).optional(),
  enableSystemPrompt: z.boolean().optional(),
  systemPrompt: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// GET - 获取所有 AI 配置
export async function GET(_request: NextRequest) {
  try {
    // 检查 Supabase 是否配置
    const client = getSupabaseAdminClient();
    if (!client) {
      return NextResponse.json(
        { data: [], message: 'Supabase 未配置，使用本地存储' },
        { status: 200 }
      );
    }
    
    const { data: configs, error } = await client
      .from('ai_configurations')
      .select('id, provider, apiEndpoint, model, temperature, maxTokens, enableSystemPrompt, systemPrompt, isDefault, createdAt, updatedAt')
      .eq('user_id', 'default_user')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取 AI 配置失败:', error);
      return NextResponse.json(
        { error: '获取 AI 配置失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: configs || [] });
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
    if (validatedData.isDefault) {
      await client
        .from('ai_configurations')
        .update({ is_default: false })
        .eq('user_id', 'default_user')
        .eq('is_default', true);
    }

    const { data: config, error } = await client
      .from('ai_configurations')
      .insert({
        user_id: 'default_user',
        provider: validatedData.provider,
        api_key: validatedData.apiKey,
        api_endpoint: validatedData.apiEndpoint,
        model: validatedData.model,
        temperature: Math.round(validatedData.temperature * 100),
        max_tokens: validatedData.maxTokens,
        enable_system_prompt: validatedData.enableSystemPrompt,
        system_prompt: validatedData.systemPrompt,
        is_default: validatedData.isDefault,
      })
      .select('id, provider, apiEndpoint, model, temperature, maxTokens, enableSystemPrompt, systemPrompt, isDefault, createdAt, updatedAt')
      .single();

    if (error) {
      console.error('创建 AI 配置失败:', error);
      return NextResponse.json(
        { error: '创建 AI 配置失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: config }, { status: 201 });
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
    if (validatedData.isDefault === true) {
      await client
        .from('ai_configurations')
        .update({ is_default: false })
        .eq('user_id', 'default_user')
        .eq('is_default', true);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.apiKey !== undefined) updateData.api_key = validatedData.apiKey;
    if (validatedData.apiEndpoint !== undefined) updateData.api_endpoint = validatedData.apiEndpoint;
    if (validatedData.model !== undefined) updateData.model = validatedData.model;
    if (validatedData.temperature !== undefined) updateData.temperature = Math.round(validatedData.temperature * 100);
    if (validatedData.maxTokens !== undefined) updateData.max_tokens = validatedData.maxTokens;
    if (validatedData.enableSystemPrompt !== undefined) updateData.enable_system_prompt = validatedData.enableSystemPrompt;
    if (validatedData.systemPrompt !== undefined) updateData.system_prompt = validatedData.systemPrompt;
    if (validatedData.isDefault !== undefined) updateData.is_default = validatedData.isDefault;

    const { data: config, error } = await client
      .from('ai_configurations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', 'default_user')
      .select('id, provider, apiEndpoint, model, temperature, maxTokens, enableSystemPrompt, systemPrompt, isDefault, createdAt, updatedAt')
      .single();

    if (error) {
      console.error('更新 AI 配置失败:', error);
      return NextResponse.json(
        { error: '更新 AI 配置失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: config });
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
      .eq('user_id', 'default_user');

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
