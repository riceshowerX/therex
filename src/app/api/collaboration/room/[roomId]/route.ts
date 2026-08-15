/**
 * 获取房间信息 API
 * GET /api/collaboration/room/[roomId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportRoom, getRoom, getUserIdByToken } from '@/lib/collaboration/server';
import { withApiHandler, rateLimiterHigh } from '@/lib/api-utils';

async function getHandler(request: NextRequest, context?: unknown) {
  try {
    const params = context as { params: Promise<{ roomId: string }> };
    const { roomId } = await params.params;
    const room = getRoom(roomId);

    if (!room) {
      return NextResponse.json(
        { error: '房间不存在' },
        { status: 404 }
      );
    }

    // 鉴权：携带有效令牌且属于该房间时才返回完整内容（P1-3）
    const token = new URL(request.url).searchParams.get('token');
    const userId = token ? getUserIdByToken(token) : null;
    const isMember = userId ? room.collaborators.has(userId) : false;

    if (isMember) {
      return NextResponse.json({ success: true, room: exportRoom(roomId) });
    }

    // 非成员仅返回摘要信息（不含文档内容与操作记录）
    return NextResponse.json({
      success: true,
      requiresJoin: true,
      room: {
        id: room.id,
        documentId: room.documentId,
        documentTitle: room.documentTitle,
        documentVersion: room.documentVersion,
        collaboratorCount: room.collaborators.size,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json(
      { error: '获取房间信息失败' },
      { status: 500 }
    );
  }
}

// 接入统一限流与错误处理（P1-8）
export const GET = withApiHandler(getHandler, rateLimiterHigh);
