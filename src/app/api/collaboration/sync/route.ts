/**
 * 同步文档内容 API
 * POST /api/collaboration/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateDocument, verifyRoomToken, isContentWithinLimit } from '@/lib/collaboration/server';
import { withApiHandler, rateLimiterHigh } from '@/lib/api-utils';

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId, content, operation, roomToken, baseVersion } = body;

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

    // 内容大小限制（P1-3）
    if (typeof content === 'string' && !isContentWithinLimit(content)) {
      return NextResponse.json(
        { error: '文档内容过大' },
        { status: 413 }
      );
    }

    const result = updateDocument(
      roomId,
      userId,
      content,
      operation,
      typeof baseVersion === 'number' ? baseVersion : undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      version: result.version,
      // last-write-wins 保留，但向客户端报告冲突（P1-3）
      conflict: result.conflict === true,
      // M5：serverVersion 使用 updateDocument 返回值（更新后的版本），不再使用更新前读取的旧值
      serverVersion: result.version ?? 0,
    });
  } catch (error) {
    console.error('Sync document error:', error);
    return NextResponse.json(
      { error: '同步失败' },
      { status: 500 }
    );
  }
}

// 接入统一限流与错误处理（P1-8）
export const POST = withApiHandler(postHandler, rateLimiterHigh);
