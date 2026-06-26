/**
 * 实时事件流 API (Server-Sent Events)
 * GET /api/collaboration/events?roomId=xxx
 */

import { NextRequest } from 'next/server';
import { getRoom, getCollaborators } from '@/lib/collaboration/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return new Response('Missing roomId', { status: 400 });
  }

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      // 发送初始状态
      const room = getRoom(roomId);
      if (room) {
        const initialData = {
          type: 'init',
          room: {
            id: room.id,
            documentId: room.documentId,
            documentTitle: room.documentTitle,
            documentContent: room.documentContent,
            documentVersion: room.documentVersion,
          },
          collaborators: getCollaborators(roomId),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));
      }

      // 定期发送心跳和状态更新
      intervalId = setInterval(() => {
        const currentRoom = getRoom(roomId);
        if (!currentRoom) {
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
          documentVersion: currentRoom.documentVersion,
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));
      }, 3000); // 每 3 秒发送一次心跳
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
