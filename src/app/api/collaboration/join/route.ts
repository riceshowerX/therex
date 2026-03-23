/**
 * 加入协作房间 API
 * POST /api/collaboration/join
 */

import { NextRequest, NextResponse } from 'next/server';
import { joinRoom, exportRoom } from '@/lib/collaboration/server';

export async function POST(request: NextRequest) {
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

    return NextResponse.json({
      success: true,
      room: exportRoom(roomId),
      user: result.user,
    });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json(
      { error: '加入房间失败' },
      { status: 500 }
    );
  }
}
