/**
 * QA 回归验证：F3 URL 安全校验纯函数 + 统一鉴权行为
 *
 * 1. isSafeExternalUrl：imageUrl 仅允许公网 https；http/localhost/内网/保留地址/云元数据拒绝。
 * 2. isPrivateIp：私网/保留地址判定。
 * 3. getAuthenticatedUserId 行为：
 *    - 生产模式（NODE_ENV=production）无任何鉴权凭据 → 返回 null（调用方返回 401）
 *    - 非生产模式未配置鉴权 → 按设计放行 dev-user（记录该兜底行为，供风险研判）
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { isSafeExternalUrl, isPrivateIp, getAuthenticatedUserId } from '@/lib/api-utils';

describe('F3 isSafeExternalUrl（imageUrl SSRF 防护）', () => {
  it('公网 https 应放行', () => {
    expect(isSafeExternalUrl('https://example.com/a.png')).toBe(true);
    expect(isSafeExternalUrl('https://cdn.example.com/a.png?x=1')).toBe(true);
  });

  it('http 协议应拒绝（仅允许 https）', () => {
    expect(isSafeExternalUrl('http://example.com/a.png')).toBe(false);
  });

  it('非 http(s) 协议应拒绝', () => {
    expect(isSafeExternalUrl('ftp://example.com/a.png')).toBe(false);
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
  });

  it('localhost / .local / .internal 主机应拒绝', () => {
    expect(isSafeExternalUrl('https://localhost/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://foo.local/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://db.internal/a.png')).toBe(false);
  });

  it('IPv4 私网/保留/云元数据字面量应拒绝', () => {
    expect(isSafeExternalUrl('https://127.0.0.1/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://10.0.0.5/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://172.16.0.1/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://172.31.255.255/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://192.168.1.10/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://169.254.169.254/latest/meta-data')).toBe(false); // 云元数据
    expect(isSafeExternalUrl('https://100.64.0.1/a.png')).toBe(false); // CGNAT
  });

  it('IPv6 回环/链路本地应拒绝', () => {
    expect(isSafeExternalUrl('https://[::1]/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://[fe80::1]/a.png')).toBe(false);
  });

  it('非法 URL 应拒绝', () => {
    expect(isSafeExternalUrl('not a url')).toBe(false);
    expect(isSafeExternalUrl('')).toBe(false);
  });
});

describe('F3 isPrivateIp', () => {
  it('私网地址应判定为 true', () => {
    expect(isPrivateIp('10.1.2.3')).toBe(true);
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('169.254.169.254')).toBe(true);
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('172.31.255.255')).toBe(true);
    expect(isPrivateIp('192.168.0.1')).toBe(true);
    expect(isPrivateIp('100.64.0.1')).toBe(true);
    expect(isPrivateIp('::1')).toBe(true);
    expect(isPrivateIp('fe80::1')).toBe(true);
    expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true); // IPv4-mapped
  });

  it('公网地址应判定为 false', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
    expect(isPrivateIp('114.114.114.114')).toBe(false);
  });
});

describe('getAuthenticatedUserId 行为', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('生产模式无鉴权凭据应返回 null（路由据此返回 401）', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = new NextRequest('http://localhost/api/sync');
    const userId = await getAuthenticatedUserId(req);
    expect(userId).toBeNull();
  });

  it('生产模式共享密钥未显式开启（无 ALLOW_SHARED_KEY_AUTH）时，密钥头不应放行', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    // 未设置 ALLOW_SHARED_KEY_AUTH；本环境未配置 SUPABASE，且 AI_CONFIG_ADMIN_KEY 为空
    const req = new NextRequest('http://localhost/api/sync', {
      headers: { 'x-ai-config-key': 'anything' },
    });
    const userId = await getAuthenticatedUserId(req);
    expect(userId).toBeNull();
  });

  it('非生产环境未配置鉴权时按设计放行 dev-user（记录兜底行为）', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const req = new NextRequest('http://localhost/api/sync');
    const userId = await getAuthenticatedUserId(req);
    // 注意：这是工程师在修复说明中声明的"便于本地开发"的兜底；
    // QA 判定其为文档化行为，但若以非 production 模式部署（如 staging）存在风险。
    expect(userId).toBe('dev-user');
  });
});

describe('F3 修复回归（第 2 轮，独立边界用例）', () => {
  it('IPv6 回环/未指定/链路本地/站点本地字面量均应拒绝', () => {
    expect(isSafeExternalUrl('https://[::1]/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://[::]/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://[fe80::1]/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://[fe90::1]/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://[fec0::1]/a.png')).toBe(false);
  });

  it('IPv4-mapped IPv6（点分与十六进制形式）均应拒绝', () => {
    // WHATWG URL 会把 [::ffff:127.0.0.1] 规范化为 [::ffff:7f00:1]，故十六进制转换路径必须有效
    expect(isSafeExternalUrl('https://[::ffff:7f00:1]/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://[::ffff:127.0.0.1]/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://[::ffff:c0a8:0101]/a.png')).toBe(false); // 192.168.1.1
    expect(isSafeExternalUrl('https://[::ffff:0a00:0001]/a.png')).toBe(false); // 10.0.0.1
  });

  it('公网 IPv6 仍应放行', () => {
    expect(isSafeExternalUrl('https://[2001:4860:4860::8888]/a.png')).toBe(true); // Google DNS
    expect(isSafeExternalUrl('https://[2606:4700:4700::1111]/a.png')).toBe(true); // Cloudflare DNS
  });

  it('hostname 带尾点（127.0.0.1.）经 URL 规范化后仍应拒绝', () => {
    // WHATWG URL 将尾点归一化为 127.0.0.1，随后进入私网判定
    expect(isSafeExternalUrl('https://127.0.0.1./a.png')).toBe(false);
    expect(isSafeExternalUrl('https://10.0.0.1./a.png')).toBe(false);
    expect(isSafeExternalUrl('https://8.8.8.8./a.png')).toBe(true);
  });

  it('数字/十六进制/简写 IP 形式经 URL 规范化后仍应拒绝', () => {
    expect(isSafeExternalUrl('https://2130706433/a.png')).toBe(false); // 127.0.0.1 整型
    expect(isSafeExternalUrl('https://0x7f000001/a.png')).toBe(false);  // 十六进制
    expect(isSafeExternalUrl('https://127.1/a.png')).toBe(false);       // 简写
  });

  it('IPv4 原行为不回退：私网拒绝、公网放行', () => {
    expect(isSafeExternalUrl('https://127.0.0.1/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://10.1.2.3/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://192.168.0.1/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://172.16.0.1/a.png')).toBe(false);
    expect(isSafeExternalUrl('https://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isSafeExternalUrl('https://8.8.8.8/a.png')).toBe(true);
    expect(isSafeExternalUrl('https://1.1.1.1/a.png')).toBe(true);
    expect(isSafeExternalUrl('https://example.com/a.png')).toBe(true);
  });

  it('isPrivateIp 对 IPv4-mapped 十六进制形式直接判定正确', () => {
    expect(isPrivateIp('::ffff:7f00:1')).toBe(true);       // 127.0.0.1
    expect(isPrivateIp('::ffff:c0a8:0101')).toBe(true);    // 192.168.1.1
    expect(isPrivateIp('::ffff:0a00:0001')).toBe(true);    // 10.0.0.1
    expect(isPrivateIp('::ffff:0808:0808')).toBe(false);   // 8.8.8.8
    expect(isPrivateIp('[::1]')).toBe(true);               // 带括号
    expect(isPrivateIp('[fe80::1]')).toBe(true);           // 带括号
  });
});
