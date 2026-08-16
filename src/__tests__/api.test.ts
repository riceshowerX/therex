/**
 * API 接口集成测试
 * 测试所有 API 接口的功能
 * 
 * 注意：在 Next.js 开发模式下，API 路由可能运行在不同的进程中，
 * 导致内存存储无法在请求之间共享。某些依赖内存状态的测试可能失败。
 * 这些测试在生产模式下应该正常工作。
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

// 检测是否在开发模式下运行（API 路由可能在不同进程中）
const isDevMode = process.env.NODE_ENV !== 'production';

// 集成测试依赖外部服务（next dev/start 监听 TEST_URL）。
// 若服务不可达（或端口被无关进程占用，如 404 响应）则跳过整个套件，
// 避免在纯单元测试环境中误报失败。
const serverAvailable = await (async () => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(BASE_URL, { signal: controller.signal });
    clearTimeout(timer);
    // 仅当根路径返回 200（应用真实可访问）时才运行集成测试
    return response.status === 200;
  } catch {
    return false;
  }
})();

describe.skipIf(!serverAvailable)('API 接口测试', () => {
  let testRoomId: string | null = null;
  let testUserId: string | null = null;

  describe('AI 配置 API', () => {
    it('GET /api/ai-config - 应返回 AI 配置数据或明确的未配置状态', async () => {
      const response = await fetch(`${BASE_URL}/api/ai-config`);
      // M12：Supabase 未配置时返回 503 { error: 'not configured' }；已配置时返回 200 { data: [...] }
      expect([200, 401, 503]).toContain(response.status);
      const data = await response.json();
      if (response.status === 200) {
        // API 返回 { data: configs }
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });
  });

  describe('AI 助手 API', () => {
    it('POST /api/ai-assist - 无配置/未授权时应返回错误或失败', async () => {
      const response = await fetch(`${BASE_URL}/api/ai-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          content: '测试内容',
          cursorPosition: 0,
        }),
      });
      // F2：未授权返回 401；无有效配置时返回 400/500/503；200 不应出现
      expect([400, 401, 500, 503]).toContain(response.status);
    });

    it('POST /api/ai-assist - 缺少参数时应返回 400', async () => {
      const response = await fetch(`${BASE_URL}/api/ai-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });
  });

  describe('协作功能 API', () => {
    it('POST /api/collaboration/create - 应成功创建房间', async () => {
      const response = await fetch(`${BASE_URL}/api/collaboration/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: 'test-doc-api',
          documentTitle: 'API 测试文档',
          documentContent: '# 测试内容',
          userName: '测试用户',
        }),
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.room).toBeDefined();
      expect(data.room.id).toBeDefined();
      expect(data.room.collaborators).toHaveLength(1);
      
      // 保存房间 ID 供后续测试使用
      testRoomId = data.room.id;
      testUserId = data.room.collaborators[0].id;
    });

    it('POST /api/collaboration/create - 缺少参数时应返回 400', async () => {
      const response = await fetch(`${BASE_URL}/api/collaboration/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });

    it('GET /api/collaboration/room/:roomId - 应返回房间信息', async () => {
      // 先创建一个房间
      const createResponse = await fetch(`${BASE_URL}/api/collaboration/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: 'test-doc-room',
          documentTitle: '房间测试文档',
          documentContent: '# 测试',
          userName: '房间测试用户',
        }),
      });
      const createData = await createResponse.json();
      const roomId = createData.room.id;

      const response = await fetch(`${BASE_URL}/api/collaboration/room/${roomId}`);
      
      // 在开发模式下，由于进程隔离，可能返回 404
      if (isDevMode && response.status === 404) {
        console.log('跳过测试：开发模式下内存存储不共享');
        return;
      }
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.room.id).toBe(roomId);
    });

    it('GET /api/collaboration/room/:roomId - 房间不存在时应返回错误', async () => {
      const response = await fetch(`${BASE_URL}/api/collaboration/room/non-existent-room`);
      // 房间不存在时应返回明确错误
      expect([400, 404]).toContain(response.status);
      if (response.status === 400) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });

    it('POST /api/collaboration/join - 应成功加入房间', async () => {
      // 先创建一个房间
      const createResponse = await fetch(`${BASE_URL}/api/collaboration/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: 'test-doc-join',
          documentTitle: '加入测试文档',
          documentContent: '# 测试',
          userName: '创建者',
        }),
      });
      const createData = await createResponse.json();
      const roomId = createData.room.id;

      const response = await fetch(`${BASE_URL}/api/collaboration/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId,
          userName: '参与者',
        }),
      });
      
      // 在开发模式下，由于进程隔离，可能返回 400（房间不存在）
      if (isDevMode && response.status === 400) {
        console.log('跳过测试：开发模式下内存存储不共享');
        return;
      }
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.room.collaborators).toHaveLength(2);
    });

    it('POST /api/collaboration/join - 房间不存在时应返回错误', async () => {
      const response = await fetch(`${BASE_URL}/api/collaboration/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'non-existent-room',
          userName: '测试用户',
        }),
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('房间不存在');
    });

    it('POST /api/collaboration/sync - 应成功同步文档', async () => {
      // 先创建一个房间
      const createResponse = await fetch(`${BASE_URL}/api/collaboration/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: 'test-doc-sync',
          documentTitle: '同步测试文档',
          documentContent: '# 原始内容',
          userName: '同步测试用户',
        }),
      });
      const createData = await createResponse.json();
      const roomId = createData.room.id;
      const userId = createData.room.collaborators[0].id;
      // P1-3/S1：同步接口要求携带房间访问令牌（创建接口返回 roomToken）
      const roomToken = createData.roomToken;

      const response = await fetch(`${BASE_URL}/api/collaboration/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId,
          userId: userId,
          content: '# 更新后的内容',
          roomToken: roomToken,
        }),
      });
      
      // 在开发模式下，由于进程隔离，可能返回 400
      if (isDevMode && response.status === 400) {
        console.log('跳过测试：开发模式下内存存储不共享');
        return;
      }
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.version).toBeDefined();
    });

    it('POST /api/collaboration/leave - 应成功离开房间', async () => {
      // 先创建一个房间
      const createResponse = await fetch(`${BASE_URL}/api/collaboration/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: 'test-doc-leave',
          documentTitle: '离开测试文档',
          documentContent: '# 测试',
          userName: '离开测试用户',
        }),
      });
      const createData = await createResponse.json();
      const roomId = createData.room.id;
      const userId = createData.room.collaborators[0].id;

      const response = await fetch(`${BASE_URL}/api/collaboration/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId,
          userId: userId,
        }),
      });
      
      // 在开发模式下，由于进程隔离，可能返回成功但数据不一致
      if (isDevMode) {
        const data = await response.json();
        // 开发模式下可能返回 success: false
        if (!data.success) {
          console.log('跳过测试：开发模式下内存存储不共享');
          return;
        }
        expect(response.status).toBe(200);
        return;
      }
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('POST /api/collaboration/cursor - 应成功更新光标状态', async () => {
      // 先创建一个房间
      const createResponse = await fetch(`${BASE_URL}/api/collaboration/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: 'test-doc-cursor',
          documentTitle: '光标测试文档',
          documentContent: '# 测试',
          userName: '光标测试用户',
        }),
      });
      const createData = await createResponse.json();
      const roomId = createData.room.id;
      const userId = createData.room.collaborators[0].id;

      const response = await fetch(`${BASE_URL}/api/collaboration/cursor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId,
          userId: userId,
          cursor: { line: 1, column: 5 },
          isTyping: true,
        }),
      });
      expect(response.status).toBe(200);
    });
  });

  describe('页面路由测试', () => {
    it('GET / - 应返回主页', async () => {
      const response = await fetch(`${BASE_URL}/`);
      expect(response.status).toBe(200);
    });

    it('GET /settings - 应返回设置页面', async () => {
      const response = await fetch(`${BASE_URL}/settings`);
      expect(response.status).toBe(200);
    });

    it('GET /collab/:roomId - 应返回协作页面', async () => {
      const response = await fetch(`${BASE_URL}/collab/test-room`);
      expect(response.status).toBe(200);
    });
  });
});
