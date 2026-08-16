/**
 * 文档分享管理器
 * 处理分享链接创建、访问统计、云端存储
 */

'use client';

import { createLogger } from '@/lib/logger';

const logger = createLogger('share-manager');

// 分享记录
export interface ShareRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  documentContent: string;
  isPublic: boolean;
  password?: string; // 密码的 SHA-256 摘要（P1-5：不再存明文；注意该方案仅适用于本机演示，服务端化后应改用 bcrypt/argon2）
  expiresAt?: number;
  viewCount: number;
  createdAt: number;
  createdBy: string;
  allowDownload: boolean;
  allowCopy: boolean;
  lastViewedAt?: number;
  // viewerIPs 仅通过后端 API 记录，前端不可获取真实 IP
}

// 访问记录
export interface ViewRecord {
  id: string;
  shareId: string;
  viewedAt: number;
  duration?: number; // 停留时长（秒）
  isPasswordProtected: boolean;
  referrer?: string;
}

// 分享统计
export interface ShareStats {
  totalShares: number;
  totalViews: number;
  activeShares: number;
  expiredShares: number;
  topShares: Array<{
    id: string;
    title: string;
    viewCount: number;
  }>;
  viewsByDay: Array<{
    date: string;
    count: number;
  }>;
}

// 存储键
const SHARES_KEY = 'markdown-editor-shares';
const VIEWS_KEY = 'markdown-editor-share-views';

// 分享管理器
export class ShareManager {
  private static instance: ShareManager;

  private constructor() {}

  static getInstance(): ShareManager {
    if (!ShareManager.instance) {
      ShareManager.instance = new ShareManager();
    }
    return ShareManager.instance;
  }

  // 创建分享
  async createShare(options: {
    documentId: string;
    documentTitle: string;
    documentContent: string;
    isPublic: boolean;
    password?: string;
    expiresIn?: number; // 小时
    allowDownload?: boolean;
    allowCopy?: boolean;
  }): Promise<ShareRecord> {
    const share: ShareRecord = {
      id: this.generateId(),
      documentId: options.documentId,
      documentTitle: options.documentTitle,
      documentContent: options.documentContent,
      isPublic: options.isPublic,
      password: options.password ? await hashPassword(options.password) : undefined,
      expiresAt: options.expiresIn ? Date.now() + options.expiresIn * 60 * 60 * 1000 : undefined,
      viewCount: 0,
      createdAt: Date.now(),
      createdBy: 'user', // 可以后续关联用户系统
      allowDownload: options.allowDownload ?? true,
      allowCopy: options.allowCopy ?? true,
    };

    this.saveShare(share);
    return share;
  }

  // 更新分享
  async updateShare(id: string, updates: Partial<ShareRecord>): Promise<ShareRecord | null> {
    const share = this.getShare(id);
    if (!share) return null;

    // 若更新了密码字段，则先哈希再存储（P1-5）；未提供 password 字段则保持原密码
    const next: Partial<ShareRecord> = { ...updates };
    if (typeof updates.password === 'string') {
      next.password = await hashPassword(updates.password);
    } else {
      delete next.password;
    }

    const updated = { ...share, ...next };
    this.saveShare(updated);
    return updated;
  }

  // 删除分享
  deleteShare(id: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const shares = this.getAllShares();
      const filtered = shares.filter(s => s.id !== id);
      localStorage.setItem(SHARES_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      logger.error('Failed to delete share', error instanceof Error ? error : undefined);
      return false;
    }
  }

  // 获取分享
  getShare(id: string): ShareRecord | null {
    const shares = this.getAllShares();
    return shares.find(s => s.id === id) || null;
  }

  // 获取文档的所有分享
  getSharesByDocument(documentId: string): ShareRecord[] {
    return this.getAllShares().filter(s => s.documentId === documentId);
  }

  // 获取所有分享
  getAllShares(): ShareRecord[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(SHARES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // 验证分享访问
  async validateAccess(id: string, password?: string): Promise<{
    valid: boolean;
    reason?: string;
    share?: ShareRecord;
  }> {
    const share = this.getShare(id);
    
    if (!share) {
      return { valid: false, reason: '分享不存在' };
    }

    if (share.expiresAt && Date.now() > share.expiresAt) {
      return { valid: false, reason: '分享已过期' };
    }

    if (!share.isPublic) {
      if (!password) {
        return { valid: false, reason: '需要密码' };
      }
      const passwordHash = await hashPassword(password);
      if (share.password !== passwordHash) {
        return { valid: false, reason: '密码错误' };
      }
    }

    return { valid: true, share };
  }

  // 记录访问
  recordView(shareId: string, metadata?: { referrer?: string }): void {
    const share = this.getShare(shareId);
    if (!share) return;

    // 更新访问计数
    share.viewCount++;
    share.lastViewedAt = Date.now();
    this.saveShare(share);

    // 记录访问详情
    const view: ViewRecord = {
      id: this.generateId(),
      shareId,
      viewedAt: Date.now(),
      isPasswordProtected: !share.isPublic,
      referrer: metadata?.referrer,
    };

    this.saveView(view);
  }

  // 获取分享统计
  getStats(): ShareStats {
    const shares = this.getAllShares();
    const views = this.getAllViews();
    const now = Date.now();

    const activeShares = shares.filter(s => !s.expiresAt || s.expiresAt > now);
    const expiredShares = shares.filter(s => s.expiresAt && s.expiresAt <= now);

    // 计算每日访问量
    const viewsByDay = this.calculateViewsByDay(views);

    // 最受欢迎的分享
    const topShares = [...shares]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        title: s.documentTitle,
        viewCount: s.viewCount,
      }));

    return {
      totalShares: shares.length,
      totalViews: shares.reduce((sum, s) => sum + s.viewCount, 0),
      activeShares: activeShares.length,
      expiredShares: expiredShares.length,
      topShares,
      viewsByDay,
    };
  }

  // 获取分享的访问记录
  getViewHistory(shareId: string): ViewRecord[] {
    return this.getAllViews().filter(v => v.shareId === shareId);
  }

  // 清理过期分享
  cleanupExpired(): number {
    const shares = this.getAllShares();
    const now = Date.now();
    const active = shares.filter(s => !s.expiresAt || s.expiresAt > now);
    const removed = shares.length - active.length;

    if (removed > 0) {
      localStorage.setItem(SHARES_KEY, JSON.stringify(active));
    }

    return removed;
  }

  // 私有方法

  private saveShare(share: ShareRecord): void {
    if (typeof window === 'undefined') return;

    try {
      const shares = this.getAllShares();
      const index = shares.findIndex(s => s.id === share.id);
      
      if (index >= 0) {
        shares[index] = share;
      } else {
        shares.push(share);
      }

      localStorage.setItem(SHARES_KEY, JSON.stringify(shares));
    } catch (error) {
      logger.error('Failed to save share', error instanceof Error ? error : undefined);
    }
  }

  private saveView(view: ViewRecord): void {
    if (typeof window === 'undefined') return;

    try {
      const views = this.getAllViews();
      views.push(view);
      
      // 只保留最近 1000 条访问记录
      const trimmed = views.slice(-1000);
      localStorage.setItem(VIEWS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      logger.error('Failed to save view', error instanceof Error ? error : undefined);
    }
  }

  private getAllViews(): ViewRecord[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(VIEWS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private calculateViewsByDay(views: ViewRecord[]): Array<{ date: string; count: number }> {
    const byDay: Record<string, number> = {};
    
    views.forEach(view => {
      const date = new Date(view.viewedAt).toISOString().split('T')[0];
      byDay[date] = (byDay[date] || 0) + 1;
    });

    return Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // 最近 30 天
  }

  private generateId(): string {
    // S7/M9：使用加密安全随机 UUID（crypto.randomUUID），替代可预测的 Math.random
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * 密码哈希（SHA-256）。
 * 注意：这是本机演示用的非密码学安全方案（未加盐），
 * 服务端化后必须改用 bcrypt/argon2 等专用 KDF（P1-5）。
 */
async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const data = new TextEncoder().encode(password);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // 回退到简单摘要
    }
  }
  // 极简降级（非安全环境）
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash + password.charCodeAt(i)) | 0;
  }
  return `fallback-${Math.abs(hash).toString(16)}`;
}

// 导出单例
export const shareManager = ShareManager.getInstance();
