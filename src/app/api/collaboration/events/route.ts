/**
 * 实时事件流 API (Server-Sent Events)
 * GET /api/collaboration/events?roomId=xxx
 */

import { NextRequest } from 'next/server';
import { getRoom, getCollaborators, getUserIdByToken } from '@/lib/collaboration/server';
import { withApiHandler, rateLimiterHigh } from '@/lib/api-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const token = searchParams.get('token');

  if (!roomId) {
    return new Response('Missing roomId', { status: 400 });
  }

  // 鉴权：SSE 订阅必须携带有效访问令牌，且用户属于该房间（P1-3）
  const userId = token ? getUserIdByToken(token) : null;
  const room = getRoom(roomId);
  if (!userId || !room || !room.collaborators.has(userId)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      // 发送初始状态
      const currentRoom = getRoom(roomId);
      if (currentRoom) {
        const initialData = {
          type: 'init',
          room: {
            id: currentRoom.id,
            documentId: currentRoom.documentId,
            documentTitle: currentRoom.documentTitle,
            documentContent: currentRoom.documentContent,
            documentVersion: currentRoom.documentVersion,
          },
          collaborators: getCollaborators(roomId),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));
      }

      // 定期发送心跳和状态更新
      intervalId = setInterval(() => {
        const latestRoom = getRoom(roomId);
        if (!latestRoom) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'room_closed' })}\n\n`));
          controller.close();
          clearInterval(intervalId);
          return;
        }

        // 发送协作者状态
        const heartbeat = {
          type: 'heartbeat',
          timestamp: Date.now(),
          collaborators: getCollaborators(roomId),
          documentVersion: latestRoom.documentVersion,
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));
      }, 30000); // 每 30 秒发送一次心跳（降低服务器负载）
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// 接入统一限流与错误处理（P1-8）
export const GET = withApiHandler(getHandler, rateLimiterHigh);
