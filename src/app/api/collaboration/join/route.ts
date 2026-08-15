/**
 * 加入协作房间 API
 * POST /api/collaboration/join
 */

import { NextRequest, NextResponse } from 'next/server';
import { joinRoom, exportRoom, getUserToken } from '@/lib/collaboration/server';
import { withApiHandler, rateLimiterHigh } from '@/lib/api-utils';

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userName } = body;

    if (!roomId || !userName) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const result = joinRoom(roomId, userName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // 返回新用户的访问令牌（P1-3）
    const roomToken = result.user ? getUserToken(result.user.id) : null;

    return NextResponse.json({
      success: true,
      room: exportRoom(roomId),
      user: result.user,
      roomToken,
    });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json(
      { error: '加入房间失败' },
      { status: 500 }
    );
  }
}

// 接入统一限流与错误处理（P1-8）
export const POST = withApiHandler(postHandler, rateLimiterHigh);
