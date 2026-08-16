/**
 * QA 回归验证：F1/F2/F3 安全修复（路由层）
 *
 * 验证要点（架构师审查报告 32 项中的 P0 安全项）：
 * - F1 /api/sync：无鉴权 → 401；documentId 非 UUID → 400；内容超限 → 413；
 *   Supabase 未配置 → 503；写入按 user_id 隔离（eq('user_id', ...) 真实下发）；
 *   版本冲突检测返回 conflict。
 * - F2 /api/ai-assist：无鉴权 → 401；configId 按 user_id 归属过滤
 *   （他人 configId 无法命中 → 400）；缺少 action → 400；请求体超限 → 413。
 * - F3 /api/ai/service：无鉴权 → 401；imageUrl 非 https/内网 → 400；
 *   文本字段超长 → 400；请求体超限 → 413。
 *
 * 环境说明：真实执行 getAuthenticatedUserId（不 mock 鉴权函数），
 * 通过 vi.stubEnv('NODE_ENV','production') 验证生产模式的 401 语义；
 * 通过 mock supabase 管理客户端提供可控的 DB 返回与 JWT 校验结果。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase 管理客户端（getSupabaseAdminClient 返回可控的假客户端）
vi.mock('@/storage/database/supabase-client', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

import { getSupabaseAdminClient } from '@/storage/database/supabase-client';
import { POST as SyncPOST, GET as SyncGET } from '@/app/api/sync/route';
import { POST as AiAssistPOST } from '@/app/api/ai-assist/route';
import { POST as AiServicePOST, GET as AiServiceGET } from '@/app/api/ai/service/route';

const mockedAdminClient = vi.mocked(getSupabaseAdminClient);

// 假 Supabase 查询构建器：select/eq/upsert 可链式调用，
// maybeSingle/single 依次消费 results 队列。
function createFakeAdminClient(results: Array<{ data: unknown; error: unknown }> = []) {
  let cursor = 0;
  const builder = {
    select: vi.fn((_cols: string) => builder),
    eq: vi.fn((_col: string, _val: unknown) => builder),
    upsert: vi.fn((_row: unknown) => builder),
    insert: vi.fn((_row: unknown) => builder),
    update: vi.fn((_row: unknown) => builder),
    delete: vi.fn(() => builder),
    order: vi.fn((_col: string, _opts?: unknown) => builder),
    maybeSingle: vi.fn(async () => results[cursor] ?? { data: null, error: null }),
    single: vi.fn(async () => results[cursor] ?? { data: null, error: null }),
  };
  // 终端方法消费队列
  builder.maybeSingle = vi.fn(async () => {
    const r = results[cursor] ?? { data: null, error: null };
    cursor += 1;
    return r;
  });
  builder.single = vi.fn(async () => {
    const r = results[cursor] ?? { data: null, error: null };
    cursor += 1;
    return r;
  });
  const client = {
    auth: {
      getUser: vi.fn<() => Promise<{ data: { user: { id: string } | null }; error: unknown }>>(
        async () => ({ data: { user: { id: 'user-1' } }, error: null })
      ),
    },
    from: vi.fn((_table: string) => builder),
  };
  return { client, builder };
}

const VALID_UUID = '11111111-2222-4333-8444-555555555555';

describe('F1 云同步接口安全（/api/sync）', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('POST 无鉴权（无 Authorization）应返回 401', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ documentId: VALID_UUID, content: 'hello', version: 1 }),
    });
    const res = await SyncPOST(req);
    expect(res.status).toBe(401);
  });

  it('POST 携带非法 token（getUser 报错）应返回 401', async () => {
    const { client } = createFakeAdminClient();
    client.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('invalid') });
    mockedAdminClient.mockReturnValue(client as never);
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer bad-token' },
      body: JSON.stringify({ documentId: VALID_UUID, content: 'hello', version: 1 }),
    });
    const res = await SyncPOST(req);
    expect(res.status).toBe(401);
  });

  it('POST 鉴权通过后 documentId 非 UUID 应返回 400', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ documentId: 'not-a-uuid', content: 'hello', version: 1 }),
    });
    const res = await SyncPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('documentId');
  });

  it('POST 缺少必要参数应返回 400', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ documentId: VALID_UUID }),
    });
    const res = await SyncPOST(req);
    expect(res.status).toBe(400);
  });

  it('POST 内容超过 2MB 应返回 413', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ documentId: VALID_UUID, content: 'a'.repeat(2 * 1024 * 1024 + 1), version: 1 }),
    });
    const res = await SyncPOST(req);
    expect(res.status).toBe(413);
  });

  it('POST Supabase 未配置应返回 503', async () => {
    // 生产模式下鉴权先失败（401）；503 语义在开发兜底（dev-user）下可达：
    // 已鉴权但 Supabase 未配置 → 503 "sync not configured"。
    vi.stubEnv('NODE_ENV', 'test');
    mockedAdminClient.mockReturnValue(null as never);
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ documentId: VALID_UUID, content: 'hello', version: 1 }),
    });
    const res = await SyncPOST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('sync not configured');
  });

  it('POST 成功写入应按 user_id 过滤查询并隔离写入', async () => {
    const { client, builder } = createFakeAdminClient([
      { data: null, error: null }, // 首次查询：不存在现有文档
      { data: { updated_at: '2026-01-01T00:00:00.000Z' }, error: null }, // upsert 返回
    ]);
    mockedAdminClient.mockReturnValue(client as never);
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ documentId: VALID_UUID, content: 'hello', version: 1 }),
    });
    const res = await SyncPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // 用户隔离：所有文档查询都必须带 user_id = user-1
    const userIdEqCalls = builder.eq.mock.calls.filter(c => c[0] === 'user_id');
    expect(userIdEqCalls.length).toBeGreaterThan(0);
    expect(userIdEqCalls[0][1]).toBe('user-1');
    // JWT token 确实被用于 getUser
    expect(client.auth.getUser).toHaveBeenCalledWith('tok');
  });

  it('POST 客户端版本小于远端版本时应返回 conflict:true', async () => {
    const { client } = createFakeAdminClient([
      { data: { id: VALID_UUID, updated_at: '2030-01-01T00:00:00.000Z' }, error: null },
      { data: { id: VALID_UUID, content: '远端内容', updated_at: '2030-01-01T00:00:00.000Z' }, error: null },
    ]);
    mockedAdminClient.mockReturnValue(client as never);
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ documentId: VALID_UUID, content: '本地内容', version: 100 }),
    });
    const res = await SyncPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.conflict).toBe(true);
    expect(body.remoteRecord.content).toBe('远端内容');
  });

  it('GET 无鉴权应返回 401', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest(`http://localhost/api/sync?documentId=${VALID_UUID}`);
    const res = await SyncGET(req);
    expect(res.status).toBe(401);
  });

  it('GET documentId 非 UUID 应返回 400', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/sync?documentId=bad-id', {
      headers: { authorization: 'Bearer tok' },
    });
    const res = await SyncGET(req);
    expect(res.status).toBe(400);
  });
});

describe('F2 AI 辅助接口安全（/api/ai-assist）', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('POST 无鉴权应返回 401', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/ai-assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'polish', content: 'hello' }),
    });
    const res = await AiAssistPOST(req);
    expect(res.status).toBe(401);
  });

  it('POST 缺少 action 应返回 400', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/ai-assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ content: 'hello' }),
    });
    const res = await AiAssistPOST(req);
    expect(res.status).toBe(400);
  });

  it('POST 请求体超过 1MB 应返回 413', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/ai-assist', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer tok',
        'content-length': String(2 * 1024 * 1024),
      },
      body: JSON.stringify({ action: 'polish', content: 'hello' }),
    });
    const res = await AiAssistPOST(req);
    expect(res.status).toBe(413);
  });

  it('POST 他人 configId（DB 按 user_id 过滤后查不到）应返回 400', async () => {
    const { client, builder } = createFakeAdminClient([
      { data: null, error: { message: 'row not found' } },
    ]);
    mockedAdminClient.mockReturnValue(client as never);
    const req = new NextRequest('http://localhost/api/ai-assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ action: 'polish', content: 'hello', configId: 'other-user-config-id' }),
    });
    const res = await AiAssistPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('AI 配置不存在');
    // 归属校验：查询 ai_configurations 时必须同时带 id 与 user_id 过滤
    const tableCalls = client.from.mock.calls;
    expect(tableCalls.some(c => c[0] === 'ai_configurations')).toBe(true);
    const idEqCalls = builder.eq.mock.calls.filter(c => c[0] === 'id');
    const userIdEqCalls = builder.eq.mock.calls.filter(c => c[0] === 'user_id');
    expect(idEqCalls.some(c => c[1] === 'other-user-config-id')).toBe(true);
    expect(userIdEqCalls.some(c => c[1] === 'user-1')).toBe(true);
  });

  it('POST 内容超过 10 万字符应返回 400', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/ai-assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ action: 'polish', content: 'a'.repeat(100001), configId: 'cfg-1' }),
    });
    const res = await AiAssistPOST(req);
    expect(res.status).toBe(400);
  });
});

describe('F3 AI 服务接口安全（/api/ai/service）', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('POST 无鉴权应返回 401', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/ai/service', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'polish', content: 'hello' }),
    });
    const res = await AiServicePOST(req);
    expect(res.status).toBe(401);
  });

  it('GET 无鉴权应返回 401', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/ai/service?text=hello');
    const res = await AiServiceGET(req);
    expect(res.status).toBe(401);
  });

  it('POST imageUrl 使用 http（非 https）应返回 400', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/ai/service', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ action: 'analyze-image', imageUrl: 'http://example.com/a.png' }),
    });
    const res = await AiServicePOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('图片 URL 不安全');
  });

  it('POST imageUrl 指向内网地址应返回 400', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/ai/service', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ action: 'analyze-image', imageUrl: 'https://127.0.0.1/x.png' }),
    });
    const res = await AiServicePOST(req);
    expect(res.status).toBe(400);
  });

  it('POST 文本字段超过 10 万字符应返回 400', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/ai/service', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
      body: JSON.stringify({ action: 'polish', content: 'a'.repeat(100001) }),
    });
    const res = await AiServicePOST(req);
    expect(res.status).toBe(400);
  });

  it('POST 请求体超过 1MB 应返回 413', async () => {
    mockedAdminClient.mockReturnValue(createFakeAdminClient().client as never);
    const req = new NextRequest('http://localhost/api/ai/service', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer tok',
        'content-length': String(2 * 1024 * 1024),
      },
      body: JSON.stringify({ action: 'polish', content: 'hello' }),
    });
    const res = await AiServicePOST(req);
    expect(res.status).toBe(413);
  });
});
