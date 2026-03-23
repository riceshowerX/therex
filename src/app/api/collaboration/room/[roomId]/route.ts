/**
 * 获取房间信息 API
 * GET /api/collaboration/room/[roomId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportRoom } from '@/lib/collaboration/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = exportRoom(roomId);

    if (!room) {
      return NextResponse.json(
        { error: '房间不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json(
      { error: '获取房间信息失败' },
      { status: 500 }
    );
  }
}
