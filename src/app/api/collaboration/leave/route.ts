/**
 * 离开协作房间 API
 * POST /api/collaboration/leave
 */

import { NextRequest, NextResponse } from 'next/server';
import { leaveRoom } from '@/lib/collaboration/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const success = leaveRoom(roomId, userId);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Leave room error:', error);
    return NextResponse.json(
      { error: '离开房间失败' },
      { status: 500 }
    );
  }
}
