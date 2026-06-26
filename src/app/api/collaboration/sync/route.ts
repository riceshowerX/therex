/**
 * 同步文档内容 API
 * POST /api/collaboration/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateDocument, getRoom } from '@/lib/collaboration/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId, content, operation } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const result = updateDocument(roomId, userId, content, operation);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      version: result.version,
    });
  } catch (error) {
    console.error('Sync document error:', error);
    return NextResponse.json(
      { error: '同步失败' },
      { status: 500 }
    );
  }
}
