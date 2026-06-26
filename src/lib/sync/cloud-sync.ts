/**
 * 云端同步增强
 * 支持离线存储、冲突解决、增量同步
 */

'use client';

import { createLogger } from '@/lib/logger';

const logger = createLogger('cloud-sync');

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

// 同步记录
export interface SyncRecord {
  id: string;
  documentId: string;
  version: number;
  content: string;
  checksum: string;
  updatedAt: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  lastSyncedAt?: number;
  localChanges: boolean;
}

// 冲突记录
export interface ConflictRecord {
  id: string;
  documentId: string;
  localVersion: number;
  remoteVersion: number;
  localContent: string;
  remoteContent: string;
  detectedAt: number;
  resolvedAt?: number;
  resolution?: 'local' | 'remote' | 'merged';
  mergedContent?: string;
}

// 同步配置
export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // 毫秒
  offlineMode: boolean;
  conflictResolution: 'local' | 'remote' | 'manual';
  maxRetries: number;
  retryDelay: number;
}

// 默认配置
const defaultSyncConfig: SyncConfig = {
  autoSync: true,
  syncInterval: 30000, // 30 秒
  offlineMode: false,
  conflictResolution: 'manual',
  maxRetries: 3,
  retryDelay: 1000,
};

// 云端同步管理器
export class CloudSyncManager {
  private config: SyncConfig;
  private syncQueue: Map<string, SyncRecord> = new Map();
  private conflicts: Map<string, ConflictRecord> = new Map();
  private status: SyncStatus = 'idle';
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(status: SyncStatus, data?: unknown) => void> = new Set();
  private static instance: CloudSyncManager;
  private boundHandleOnline: () => void;
  private boundHandleOffline: () => void;

  private constructor(config?: Partial<SyncConfig>) {
    this.config = { ...defaultSyncConfig, ...config };
    // 绑定事件处理器，确保可以在销毁时正确移除
    this.boundHandleOnline = this.handleOnline.bind(this);
    this.boundHandleOffline = this.handleOffline.bind(this);
    this.init();
  }

  static getInstance(config?: Partial<SyncConfig>): CloudSyncManager {
    if (!CloudSyncManager.instance) {
      CloudSyncManager.instance = new CloudSyncManager(config);
    }
    return CloudSyncManager.instance;
  }

  // 初始化
  private init(): void {
    // 检查在线状态
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.boundHandleOnline);
      window.addEventListener('offline', this.boundHandleOffline);

      // 启动自动同步
      if (this.config.autoSync) {
        this.startAutoSync();
      }

      // 加载离线数据
      this.loadOfflineData();
    }
  }

  // 处理上线
  private handleOnline(): void {
    logger.info('Network is online');
    this.setStatus('idle');
    this.syncPending();
  }

  // 处理离线
  private handleOffline(): void {
    logger.info('Network is offline');
    this.setStatus('offline');
    this.stopAutoSync();
  }

  // 启动自动同步
  private startAutoSync(): void {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      if (navigator.onLine && this.syncQueue.size > 0) {
        this.syncPending();
      }
    }, this.config.syncInterval);
  }

  // 停止自动同步
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // 设置状态
  private setStatus(status: SyncStatus, data?: unknown): void {
    this.status = status;
    this.listeners.forEach(listener => listener(status, data));
  }

  // 同步文档
  async syncDocument(documentId: string, content: string, version: number): Promise<boolean> {
    const checksum = this.calculateChecksum(content);

    // 创建同步记录
    const record: SyncRecord = {
      id: `${documentId}-${Date.now()}`,
      documentId,
      version,
      content,
      checksum,
      updatedAt: Date.now(),
      syncStatus: 'pending',
      localChanges: true,
    };

    // 添加到队列
    this.syncQueue.set(documentId, record);

    // 保存到离线存储
    this.saveToOfflineStorage(record);

    // 如果在线，立即同步
    if (navigator.onLine && !this.config.offlineMode) {
      return this.syncPending();
    }

    return false;
  }

  // 同步待处理项
  private async syncPending(): Promise<boolean> {
    if (this.syncQueue.size === 0) return true;

    this.setStatus('syncing');

    let success = true;

    for (const [documentId, record] of this.syncQueue) {
      try {
        // 模拟同步请求
        const synced = await this.syncWithServer(record);

        if (synced.conflict) {
          // 处理冲突
          await this.handleConflict(record, synced.remoteRecord!);
        } else {
          // 更新状态
          record.syncStatus = 'synced';
          record.lastSyncedAt = Date.now();
          record.localChanges = false;
          this.syncQueue.delete(documentId);
        }
      } catch (error) {
        logger.error(`Failed to sync document ${documentId}`, error instanceof Error ? error : undefined);
        success = false;
      }
    }

    this.setStatus(success ? 'success' : 'error');
    return success;
  }

  // 与服务器同步
  private async syncWithServer(record: SyncRecord): Promise<{
    success: boolean;
    conflict?: boolean;
    remoteRecord?: SyncRecord;
  }> {
    // 在实际实现中，这里应该调用后端 API
    // 当前模拟实现
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟 90% 成功率
        if (Math.random() > 0.1) {
          resolve({ success: true });
        } else {
          // 模拟冲突
          resolve({
            success: false,
            conflict: true,
            remoteRecord: {
              ...record,
              version: record.version + 1,
              content: record.content + '\n\n# 远程更新',
            },
          });
        }
      }, 500);
    });
  }

  // 处理冲突
  private async handleConflict(local: SyncRecord, remote: SyncRecord): Promise<void> {
    const conflict: ConflictRecord = {
      id: `${local.documentId}-conflict-${Date.now()}`,
      documentId: local.documentId,
      localVersion: local.version,
      remoteVersion: remote.version,
      localContent: local.content,
      remoteContent: remote.content,
      detectedAt: Date.now(),
    };

    // 自动解决策略
    if (this.config.conflictResolution !== 'manual') {
      if (this.config.conflictResolution === 'local') {
        conflict.resolution = 'local';
        conflict.resolvedAt = Date.now();
        local.syncStatus = 'synced';
        this.syncQueue.delete(local.documentId);
      } else if (this.config.conflictResolution === 'remote') {
        conflict.resolution = 'remote';
        conflict.resolvedAt = Date.now();
        conflict.mergedContent = remote.content;
        local.content = remote.content;
        local.version = remote.version;
        local.syncStatus = 'synced';
        this.syncQueue.delete(local.documentId);
      }
    } else {
      // 手动解决 - 保存冲突记录
      this.conflicts.set(conflict.id, conflict);
      local.syncStatus = 'conflict';
      this.saveConflict(conflict);
    }

    // 触发事件
    this.setStatus('error', { type: 'conflict', conflict });
  }

  // 解决冲突
  resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedContent?: string): void {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return;

    conflict.resolution = resolution;
    conflict.resolvedAt = Date.now();

    if (resolution === 'merged' && mergedContent) {
      conflict.mergedContent = mergedContent;
    }

    // 更新同步记录
    const record = this.syncQueue.get(conflict.documentId);
    if (record) {
      if (resolution === 'local') {
        record.syncStatus = 'synced';
      } else if (resolution === 'remote') {
        record.content = conflict.remoteContent;
        record.version = conflict.remoteVersion;
        record.syncStatus = 'synced';
      } else if (resolution === 'merged' && mergedContent) {
        record.content = mergedContent;
        record.version = Math.max(conflict.localVersion, conflict.remoteVersion) + 1;
        record.syncStatus = 'synced';
      }
      this.syncQueue.delete(conflict.documentId);
    }

    // 保存解决结果
    this.saveConflictResolution(conflict);

    // 移除冲突
    this.conflicts.delete(conflictId);

    this.setStatus('success');
  }

  // 计算校验和
  private calculateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  // 离线存储
  private saveToOfflineStorage(record: SyncRecord): void {
    if (typeof window === 'undefined') return;

    try {
      const key = `offline-sync:${record.documentId}`;
      localStorage.setItem(key, JSON.stringify(record));
    } catch (error) {
      logger.error('Failed to save offline data', error instanceof Error ? error : undefined);
    }
  }

  // 加载离线数据
  private loadOfflineData(): void {
    if (typeof window === 'undefined') return;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('offline-sync:')) {
          const data = localStorage.getItem(key);
          if (data) {
            const record = JSON.parse(data) as SyncRecord;
            this.syncQueue.set(record.documentId, record);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to load offline data', error instanceof Error ? error : undefined);
    }
  }

  // 保存冲突
  private saveConflict(conflict: ConflictRecord): void {
    if (typeof window === 'undefined') return;

    try {
      const key = `conflict:${conflict.id}`;
      localStorage.setItem(key, JSON.stringify(conflict));
    } catch (error) {
      logger.error('Failed to save conflict', error instanceof Error ? error : undefined);
    }
  }

  // 保存冲突解决
  private saveConflictResolution(conflict: ConflictRecord): void {
    if (typeof window === 'undefined') return;

    try {
      const key = `conflict:${conflict.id}`;
      localStorage.setItem(key, JSON.stringify(conflict));
    } catch (error) {
      logger.error('Failed to save conflict resolution', error instanceof Error ? error : undefined);
    }
  }

  // 公共 API

  // 获取状态
  getStatus(): SyncStatus {
    return this.status;
  }

  // 获取待同步数量
  getPendingCount(): number {
    return this.syncQueue.size;
  }

  // 获取冲突列表
  getConflicts(): ConflictRecord[] {
    return Array.from(this.conflicts.values());
  }

  // 监听状态变化
  onStatusChange(listener: (status: SyncStatus, data?: unknown) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 强制同步
  async forceSync(): Promise<boolean> {
    return this.syncPending();
  }

  // 更新配置
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.autoSync !== undefined) {
      if (config.autoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  // 清理
  destroy(): void {
    this.stopAutoSync();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.boundHandleOnline);
      window.removeEventListener('offline', this.boundHandleOffline);
    }
    this.listeners.clear();
    this.syncQueue.clear();
    this.conflicts.clear();
  }
}

// 导出单例
export const cloudSyncManager = CloudSyncManager.getInstance();
