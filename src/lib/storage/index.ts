/**
 * 存储管理器
 *
 * 统一管理存储适配器，支持：
 * - 自动选择默认存储
 * - 切换存储后端
 * - 数据迁移
 */

import type {
  IStorageAdapter,
  IStorageManager,
  StorageConfig,
  StorageProvider,
  StorageDocument,
  StorageFolder,
  StorageDocumentVersion,
  LocalStorageConfig,
  IndexedDBStorageConfig,
  SupabaseStorageConfig,
} from './types';
import { LocalStorageAdapter } from './adapters/local-storage';
import { IndexedDBStorageAdapter } from './adapters/indexeddb-storage';
import { SupabaseStorageAdapter } from './adapters/supabase-storage';

// 存储配置的 localStorage 键名
const STORAGE_CONFIG_KEY = 'therex-storage-config';

// 默认配置
const DEFAULT_CONFIG: LocalStorageConfig = {
  provider: 'local',
  prefix: 'therex',
};

/**
 * 存储管理器实现
 */
class StorageManager implements IStorageManager {
  private adapter: IStorageAdapter | null = null;
  private config: StorageConfig | null = null;
  private initializing: boolean = false;

  /**
   * 获取当前存储适配器
   */
  getAdapter(): IStorageAdapter {
    if (!this.adapter) {
      throw new Error('存储适配器未初始化，请先调用 initialize()');
    }
    return this.adapter;
  }

  /**
   * 获取当前存储配置
   */
  getConfig(): StorageConfig | null {
    return this.config;
  }

  /**
   * 初始化存储
   * - 如果有保存的配置，使用保存的配置
   * - 否则使用默认的 localStorage
   */
  async initialize(): Promise<boolean> {
    if (this.adapter?.isInitialized()) {
      return true;
    }

    if (this.initializing) {
      // 等待初始化完成
      while (this.initializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.adapter?.isInitialized() || false;
    }

    this.initializing = true;

    try {
      // 尝试加载保存的配置
      const savedConfig = this.loadConfig();
      
      if (savedConfig) {
        const success = await this.createAdapter(savedConfig);
        if (success) {
          this.config = savedConfig;
          return true;
        }
        // 如果配置的适配器初始化失败，回退到默认
        console.warn('保存的存储配置初始化失败，使用默认本地存储');
      }

      // 使用默认的 localStorage
      const defaultAdapter = new LocalStorageAdapter(DEFAULT_CONFIG);
      const success = await defaultAdapter.initialize();
      
      if (success) {
        this.adapter = defaultAdapter;
        this.config = DEFAULT_CONFIG;
        this.saveConfig(DEFAULT_CONFIG);
      }
      
      return success;
    } finally {
      this.initializing = false;
    }
  }

  /**
   * 切换存储适配器
   */
  async switchAdapter(config: StorageConfig): Promise<boolean> {
    // 创建新适配器
    const newAdapter = await this.createAdapterInstance(config);
    if (!newAdapter) {
      return false;
    }

    // 初始化新适配器
    const success = await newAdapter.initialize();
    if (!success) {
      return false;
    }

    // 关闭旧适配器
    if (this.adapter) {
      await this.adapter.close();
    }

    this.adapter = newAdapter;
    this.config = config;
    this.saveConfig(config);

    return true;
  }

  /**
   * 检查存储是否可用
   */
  async isAvailable(): Promise<boolean> {
    if (!this.adapter) {
      return false;
    }
    return this.adapter.isInitialized();
  }

  /**
   * 迁移数据到新存储
   */
  async migrateTo(newConfig: StorageConfig): Promise<{ success: number; failed: number }> {
    if (!this.adapter) {
      throw new Error('当前存储未初始化');
    }

    // 导出当前数据
    const data = await this.adapter.exportAllData();

    // 切换到新存储
    const success = await this.switchAdapter(newConfig);
    if (!success) {
      throw new Error('切换到新存储失败');
    }

    // 导入数据到新存储
    return this.adapter.importData(data);
  }

  // ==================== 私有方法 ====================

  private loadConfig(): StorageConfig | null {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) {
        return JSON.parse(saved) as StorageConfig;
      }
    } catch (e) {
      console.error('加载存储配置失败:', e);
    }
    return null;
  }

  private saveConfig(config: StorageConfig): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('保存存储配置失败:', e);
    }
  }

  private async createAdapter(config: StorageConfig): Promise<boolean> {
    const adapter = await this.createAdapterInstance(config);
    if (!adapter) return false;

    const success = await adapter.initialize();
    if (success) {
      this.adapter = adapter;
    }
    return success;
  }

  private async createAdapterInstance(config: StorageConfig): Promise<IStorageAdapter | null> {
    switch (config.provider) {
      case 'local':
        return new LocalStorageAdapter(config as LocalStorageConfig);
      
      case 'indexeddb':
        return new IndexedDBStorageAdapter(config as IndexedDBStorageConfig);
      
      case 'supabase':
        return new SupabaseStorageAdapter(config as SupabaseStorageConfig);
      
      case 'postgresql':
      case 'mongodb':
        // 这些需要在服务端实现
        console.error(`${config.provider} 适配器暂未实现`);
        return null;
      
      default:
        console.error(`未知的存储提供商: ${(config as any).provider}`);
        return null;
    }
  }
}

// 单例实例
let storageManagerInstance: StorageManager | null = null;

/**
 * 获取存储管理器单例
 */
export function getStorageManager(): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager();
  }
  return storageManagerInstance;
}

/**
 * 初始化存储（便捷方法）
 */
export async function initializeStorage(): Promise<IStorageAdapter> {
  const manager = getStorageManager();
  await manager.initialize();
  return manager.getAdapter();
}

/**
 * 获取当前存储适配器（便捷方法）
 */
export function getStorage(): IStorageAdapter {
  return getStorageManager().getAdapter();
}

// 导出类型
export type {
  IStorageAdapter,
  IStorageManager,
  StorageConfig,
  StorageProvider,
  StorageDocument,
  StorageFolder,
  StorageDocumentVersion,
  LocalStorageConfig,
  IndexedDBStorageConfig,
  SupabaseStorageConfig,
};
