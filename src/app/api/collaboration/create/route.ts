/**
 * 创建协作房间 API
 * POST /api/collaboration/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRoom, exportRoom } from '@/lib/collaboration/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, documentTitle, documentContent, userName } = body;

    if (!documentId || !userName) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const room = createRoom(
      documentId,
      documentTitle || '未命名文档',
      documentContent || '',
      userName
    );

    return NextResponse.json({
      success: true,
      room: exportRoom(room.id),
    });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: '创建房间失败' },
      { status: 500 }
    );
  }
}
