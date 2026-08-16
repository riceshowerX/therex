/**
 * 云同步 API（P1-6 / F1）
 * POST /api/sync - 推送文档内容到远端
 * GET  /api/sync?documentId=xxx - 拉取远端文档版本
 *
 * 安全要求（F1）：
 * - 必须通过 getAuthenticatedUserId 鉴权（Supabase JWT 或共享密钥）
 * - 所有读写按 user_id 隔离，禁止 default_user 兜底
 * - documentId 必须为 UUID 格式，防止枚举
 * - 版本冲突检测（M6）：客户端携带 version 小于远端版本时返回 conflict
 *
 * 依赖 Supabase 配置；未配置时返回 503 { error: 'sync not configured' }，
 * 前端据此显示"同步未配置"，不得将记录标记为已同步。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-client';
import { withApiHandler, getAuthenticatedUserId } from '@/lib/api-utils';

const MAX_SYNC_CONTENT_LENGTH = 2 * 1024 * 1024; // 2MB

// UUID 格式校验（v1-v8 均接受，防止枚举/注入）
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function postHandler(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: '未授权，请提供有效的认证信息' }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: 'sync not configured' }, { status: 503 });
  }

  let body: {
    documentId?: string;
    content?: string;
    version?: number;
    checksum?: string;
    title?: string;
  } | null = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  if (!body?.documentId || typeof body.content !== 'string') {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  // F1：documentId 必须是 UUID 格式
  if (!UUID_RE.test(body.documentId)) {
    return NextResponse.json({ error: 'documentId 格式非法' }, { status: 400 });
  }

  if (body.content.length > MAX_SYNC_CONTENT_LENGTH) {
    return NextResponse.json({ error: '内容过大' }, { status: 413 });
  }

  try {
    // M6：版本冲突检测——客户端版本小于远端版本时返回 conflict
    const { data: existing } = await client
      .from('documents')
      .select('id, updated_at')
      .eq('id', body.documentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing && typeof body.version === 'number') {
      const existingVersion = new Date(existing.updated_at).getTime();
      if (body.version < existingVersion) {
        const { data: remoteDoc } = await client
          .from('documents')
          .select('id, content, updated_at')
          .eq('id', body.documentId)
          .eq('user_id', userId)
          .maybeSingle();

        return NextResponse.json({
          success: false,
          conflict: true,
          remoteRecord: remoteDoc
            ? {
                documentId: body.documentId,
                version: new Date(remoteDoc.updated_at).getTime(),
                content: remoteDoc.content,
                checksum: '',
              }
            : null,
        });
      }
    }

    // F1：按登录用户隔离写入，禁止 default_user
    const { data, error } = await client
      .from('documents')
      .upsert(
        {
          id: body.documentId,
          title: body.title || '同步文档',
          content: body.content,
          updated_at: new Date().toISOString(),
          user_id: userId,
        },
        { onConflict: 'id' }
      )
      .select('updated_at')
      .single();

    if (error) {
      console.error('Sync upsert error:', error);
      return NextResponse.json({ error: '同步失败' }, { status: 500 });
    }

    const updatedAt = data?.updated_at ? new Date(data.updated_at).getTime() : Date.now();
    return NextResponse.json({
      success: true,
      version: updatedAt,
      remoteRecord: {
        documentId: body.documentId,
        version: updatedAt,
        content: body.content,
        checksum: body.checksum || '',
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: '同步失败' }, { status: 500 });
  }
}

async function getHandler(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: '未授权，请提供有效的认证信息' }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: 'sync not configured' }, { status: 503 });
  }

  const documentId = new URL(request.url).searchParams.get('documentId');
  if (!documentId) {
    return NextResponse.json({ error: '缺少 documentId' }, { status: 400 });
  }

  // F1：documentId 必须是 UUID 格式
  if (!UUID_RE.test(documentId)) {
    return NextResponse.json({ error: 'documentId 格式非法' }, { status: 400 });
  }

  try {
    // F1：按 user_id 过滤，禁止越权读取他人文档
    const { data, error } = await client
      .from('documents')
      .select('id, content, updated_at')
      .eq('id', documentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Sync fetch error:', error);
      return NextResponse.json({ error: '获取远端版本失败' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: true, remoteRecord: null });
    }

    return NextResponse.json({
      success: true,
      remoteRecord: {
        documentId,
        version: new Date(data.updated_at).getTime(),
        content: data.content,
      },
    });
  } catch (error) {
    console.error('Sync fetch error:', error);
    return NextResponse.json({ error: '获取远端版本失败' }, { status: 500 });
  }
}

// 接入统一限流与错误处理
export const POST = withApiHandler(postHandler);
export const GET = withApiHandler(getHandler);
