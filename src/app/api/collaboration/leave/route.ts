/**
 * 离开协作房间 API
 * POST /api/collaboration/leave
 */

import { NextRequest, NextResponse } from 'next/server';
import { leaveRoom, verifyRoomToken } from '@/lib/collaboration/server';
import { withApiHandler, rateLimiterHigh } from '@/lib/api-utils';

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId, roomToken } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 鉴权：必须携带有效的房间访问令牌（P1-3）
    if (!verifyRoomToken(roomId, userId, roomToken)) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const result = leaveRoom(roomId, userId);

    return NextResponse.json({ 
      success: result.success,
      isEmpty: result.isEmpty 
    });
  } catch (error) {
    console.error('Leave room error:', error);
    return NextResponse.json(
      { error: '离开房间失败' },
      { status: 500 }
    );
  }
}

// 接入统一限流与错误处理（P1-8）
export const POST = withApiHandler(postHandler, rateLimiterHigh);
