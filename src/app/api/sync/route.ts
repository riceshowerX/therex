/**
 * 云同步 API（P1-6）
 * POST /api/sync - 推送文档内容到远端
 * GET  /api/sync?documentId=xxx - 拉取远端文档版本
 *
 * 依赖 Supabase 配置；未配置时返回 503 { error: 'sync not configured' }，
 * 前端据此显示"同步未配置"，不得将记录标记为已同步。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-client';

const MAX_SYNC_CONTENT_LENGTH = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
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

  if (body.content.length > MAX_SYNC_CONTENT_LENGTH) {
    return NextResponse.json({ error: '内容过大' }, { status: 413 });
  }

  try {
    // upsert 到 documents 表（同步文档不绑定用户，暂用 default_user，后续接入认证再细化）
    const { data, error } = await client
      .from('documents')
      .upsert(
        {
          id: body.documentId,
          title: body.title || '同步文档',
          content: body.content,
          updated_at: new Date().toISOString(),
          user_id: 'default_user',
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

export async function GET(request: NextRequest) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: 'sync not configured' }, { status: 503 });
  }

  const documentId = new URL(request.url).searchParams.get('documentId');
  if (!documentId) {
    return NextResponse.json({ error: '缺少 documentId' }, { status: 400 });
  }

  try {
    const { data, error } = await client
      .from('documents')
      .select('id, content, updated_at')
      .eq('id', documentId)
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
