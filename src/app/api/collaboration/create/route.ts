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

    const result = createRoom(
      documentId,
      documentTitle || '未命名文档',
      documentContent || '',
      userName
    );

    // createRoom 可能返回错误对象
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 429 }
      );
    }

    const roomExport = exportRoom(result.id);
    if (!roomExport) {
      return NextResponse.json(
        { error: '创建房间失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      room: roomExport,
    });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: '创建房间失败' },
      { status: 500 }
    );
  }
}
