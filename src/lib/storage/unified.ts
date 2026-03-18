/**
 * 统一存储访问层
 * 提供类型安全的存储访问，统一错误处理，支持降级
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('storage');

/**
 * 存储类型
 */
export type StorageType = 'local' | 'session';

/**
 * 存储配置
 */
interface StorageConfig {
  prefix: string;
  type: StorageType;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: StorageConfig = {
  prefix: 'therex',
  type: 'local',
};

/**
 * 检查存储是否可用
 */
function isStorageAvailable(type: StorageType): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取存储实例
 */
function getStorage(type: StorageType): Storage | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return type === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * 内存存储降级
 */
class MemoryStorage {
  private data: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  get length(): number {
    return this.data.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }
}

/**
 * 统一存储类
 */
export class UnifiedStorage {
  private config: StorageConfig;
  private storage: Storage | MemoryStorage;
  private available: boolean;
  private static instance: UnifiedStorage | null = null;

  private constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.available = isStorageAvailable(this.config.type);
    
    if (this.available) {
      this.storage = getStorage(this.config.type) ?? new MemoryStorage();
    } else {
      logger.warn('Storage not available, using memory fallback');
      this.storage = new MemoryStorage();
    }
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<StorageConfig>): UnifiedStorage {
    if (!UnifiedStorage.instance) {
      UnifiedStorage.instance = new UnifiedStorage(config);
    }
    return UnifiedStorage.instance;
  }

  /**
   * 生成带前缀的键
   */
  private getKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  /**
   * 获取值
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const fullKey = this.getKey(key);
      const value = this.storage.getItem(fullKey);
      
      if (value === null) {
        return defaultValue;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to get value for key: ${key}`, error instanceof Error ? error : undefined);
      return defaultValue;
    }
  }

  /**
   * 设置值
   */
  set<T>(key: string, value: T): boolean {
    try {
      const fullKey = this.getKey(key);
      this.storage.setItem(fullKey, JSON.stringify(value));
      return true;
    } catch (error) {
      // 处理存储已满的情况
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        logger.error('Storage quota exceeded');
        // 尝试清理旧数据
        this.cleanupOldData();
        // 重试
        try {
          const fullKey = this.getKey(key);
          this.storage.setItem(fullKey, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      }
      
      logger.error(`Failed to set value for key: ${key}`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  /**
   * 删除值
   */
  remove(key: string): boolean {
    try {
      const fullKey = this.getKey(key);
      this.storage.removeItem(fullKey);
      return true;
    } catch (error) {
      logger.error(`Failed to remove value for key: ${key}`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    const fullKey = this.getKey(key);
    return this.storage.getItem(fullKey) !== null;
  }

  /**
   * 清除所有带前缀的数据
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(this.config.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      logger.error('Failed to clear storage', error instanceof Error ? error : undefined);
    }
  }

  /**
   * 清理旧数据（当存储已满时）
   */
  private cleanupOldData(): void {
    try {
      // 获取所有键值对及其时间戳
      const entries: Array<{ key: string; timestamp: number }> = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(this.config.prefix)) {
          const value = this.storage.getItem(key);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              entries.push({
                key,
                timestamp: parsed.timestamp || parsed.updatedAt || 0,
              });
            } catch {
              // 无法解析的条目，直接删除
              this.storage.removeItem(key);
            }
          }
        }
      }
      
      // 按时间排序，删除最旧的 20%
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = Math.ceil(entries.length * 0.2);
      
      for (let i = 0; i < toRemove; i++) {
        this.storage.removeItem(entries[i].key);
      }
      
      logger.info(`Cleaned up ${toRemove} old entries`);
    } catch (error) {
      logger.error('Failed to cleanup old data', error instanceof Error ? error : undefined);
    }
  }

  /**
   * 获取存储使用情况
   */
  getUsage(): { used: number; quota: number; percent: number } {
    let used = 0;
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.config.prefix)) {
        const value = this.storage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }
    
    // localStorage 通常有 5-10MB 配额
    const quota = 5 * 1024 * 1024; // 5MB
    
    return {
      used,
      quota,
      percent: Math.round((used / quota) * 100),
    };
  }

  /**
   * 导出所有数据
   */
  export(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.config.prefix)) {
        const shortKey = key.slice(this.config.prefix.length + 1);
        const value = this.storage.getItem(key);
        if (value) {
          try {
            data[shortKey] = JSON.parse(value);
          } catch {
            data[shortKey] = value;
          }
        }
      }
    }
    
    return data;
  }

  /**
   * 导入数据
   */
  import(data: Record<string, unknown>, merge: boolean = true): void {
    if (!merge) {
      this.clear();
    }
    
    for (const [key, value] of Object.entries(data)) {
      this.set(key, value);
    }
  }
}

/**
 * 导出默认实例
 */
export const storage = UnifiedStorage.getInstance();

/**
 * 便捷方法
 */
export const storageGet = <T>(key: string, defaultValue?: T) => storage.get<T>(key, defaultValue);
export const storageSet = <T>(key: string, value: T) => storage.set(key, value);
export const storageRemove = (key: string) => storage.remove(key);
export const storageHas = (key: string) => storage.has(key);
export const storageClear = () => storage.clear();
