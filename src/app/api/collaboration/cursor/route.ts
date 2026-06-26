/**
 * 更新光标/选区 API
 * POST /api/collaboration/cursor
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateCursor, updateSelection, updateTypingStatus } from '@/lib/collaboration/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId, cursor, selection, isTyping } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
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
