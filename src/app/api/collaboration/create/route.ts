/**
 * 创建协作房间 API
 * POST /api/collaboration/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRoom, exportRoom, getUserToken } from '@/lib/collaboration/server';
import { withApiHandler, rateLimiterHigh, getClientIdentifier } from '@/lib/api-utils';

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, documentTitle, documentContent, userName } = body;

    if (!documentId || !userName) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 限制文档内容大小（P1-3）
    if (typeof documentContent === 'string' && documentContent.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文档内容过大' },
        { status: 413 }
      );
    }

    // M7：创建房间限流键改用服务端身份（真实 IP），不再信任客户端自报 userName
    const clientIp = getClientIdentifier(request);

    const result = createRoom(
      documentId,
      documentTitle || '未命名文档',
      documentContent || '',
      userName,
      clientIp
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

    // 返回创建者的访问令牌（P1-3）
    const roomWithCollaborators = roomExport as { collaborators: Array<{ id: string }> };
    const creator = roomWithCollaborators.collaborators?.[0];
    const roomToken = creator ? getUserToken(creator.id) : null;

    return NextResponse.json({
      success: true,
      room: roomExport,
      roomToken,
    });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: '创建房间失败' },
      { status: 500 }
    );
  }
}

// 接入统一限流与错误处理（P1-8）
export const POST = withApiHandler(postHandler, rateLimiterHigh);
