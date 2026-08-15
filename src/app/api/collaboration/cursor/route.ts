/**
 * 更新光标/选区 API
 * POST /api/collaboration/cursor
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateCursor, updateSelection, updateTypingStatus, verifyRoomToken } from '@/lib/collaboration/server';
import { withApiHandler, rateLimiterHigh } from '@/lib/api-utils';

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId, cursor, selection, isTyping, roomToken } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 鉴权：必须携带有效的房间访问令牌（P1-3）
    if (!verifyRoomToken(roomId, userId, roomToken)) {
      return NextResponse.json(
        { error: '未授权，请先加入房间' },
        { status: 401 }
      );
    }

    if (cursor) {
      updateCursor(roomId, userId, cursor);
    }

    if (selection !== undefined) {
      updateSelection(roomId, userId, selection);
    }

    if (isTyping !== undefined) {
      updateTypingStatus(roomId, userId, isTyping);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update cursor error:', error);
    return NextResponse.json(
      { error: '更新失败' },
      { status: 500 }
    );
  }
}

// 接入统一限流与错误处理（P1-8）
export const POST = withApiHandler(postHandler, rateLimiterHigh);
