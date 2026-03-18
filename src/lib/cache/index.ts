/**
 * 智能缓存系统
 * 支持内存缓存、持久化缓存和自动过期
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
};

type CacheOptions = {
  ttl?: number; // 生存时间（毫秒）
  maxSize?: number; // 最大缓存条目数
  persist?: boolean; // 是否持久化到 localStorage
  namespace?: string; // 缓存命名空间
};

const DEFAULT_TTL = 5 * 60 * 1000; // 5 分钟
const DEFAULT_MAX_SIZE = 100;

/**
 * 内存缓存类
 */
class MemoryCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? DEFAULT_TTL,
      maxSize: options.maxSize ?? DEFAULT_MAX_SIZE,
      persist: options.persist ?? false,
      namespace: options.namespace ?? 'default',
    };

    if (this.options.persist && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl ?? this.options.ttl);

    // 检查是否需要清理
    if (this.cache.size >= this.options.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      accessCount: 0,
      lastAccessed: now,
    });

    if (this.options.persist) {
      this.saveToStorage();
    }
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // 更新访问统计
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result && this.options.persist) {
      this.saveToStorage();
    }
    return result;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    if (this.options.persist) {
      this.saveToStorage();
    }
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    size: number;
    hitRate: number;
    totalAccesses: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let totalAccesses = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    this.cache.forEach((entry) => {
      totalAccesses += entry.accessCount;
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      if (entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    });

    return {
      size: this.cache.size,
      hitRate: 0, // 需要跟踪 hits 和 misses
      totalAccesses,
      oldestEntry: oldestTimestamp === Infinity ? 0 : oldestTimestamp,
      newestEntry: newestTimestamp,
    };
  }

  /**
   * 清理过期条目
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0 && this.options.persist) {
      this.saveToStorage();
    }

    return cleaned;
  }

  /**
   * 清理策略 - LFU (Least Frequently Used)
   */
  private evict(): void {
    let minAccessCount = Infinity;
    let oldestAccess = Infinity;
    let evictKey = '';

    this.cache.forEach((entry, key) => {
      // 优先删除访问次数少的，其次删除最久未访问的
      if (
        entry.accessCount < minAccessCount ||
        (entry.accessCount === minAccessCount && entry.lastAccessed < oldestAccess)
      ) {
        minAccessCount = entry.accessCount;
        oldestAccess = entry.lastAccessed;
        evictKey = key;
      }
    });

    if (evictKey) {
      this.cache.delete(evictKey);
    }
  }

  /**
   * 持久化到 localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem(`cache_${this.options.namespace}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  /**
   * 从 localStorage 加载
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(`cache_${this.options.namespace}`);
      if (stored) {
        const data = JSON.parse(stored) as [string, CacheEntry<T>][];
        const now = Date.now();

        data.forEach(([key, entry]) => {
          // 只加载未过期的条目
          if (now <= entry.expiresAt) {
            this.cache.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }
}

/**
 * 请求缓存 - 用于缓存 API 响应
 */
class RequestCache {
  private cache: MemoryCache<Response>;
  private pendingRequests: Map<string, Promise<Response>> = new Map();

  constructor() {
    this.cache = new MemoryCache<Response>({
      ttl: 60 * 1000, // 1 分钟
      maxSize: 50,
      namespace: 'requests',
    });
  }

  /**
   * 带缓存的 fetch
   */
  async fetch(
    url: string,
    options?: RequestInit,
    cacheOptions?: { ttl?: number; forceRefresh?: boolean }
  ): Promise<Response> {
    const cacheKey = `${options?.method || 'GET'}:${url}`;
    
    // 强制刷新时不使用缓存
    if (!cacheOptions?.forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached.clone();
      }
    }

    // 防止重复请求
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    const requestPromise = fetch(url, options).then((response) => {
      // 只缓存成功的响应
      if (response.ok) {
        this.cache.set(cacheKey, response.clone(), cacheOptions?.ttl);
      }
      this.pendingRequests.delete(cacheKey);
      return response;
    });

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

/**
 * 数据缓存 Hook 的工具函数
 */
export function createDataCache<T>(
  fetcher: (key: string) => Promise<T>,
  options?: CacheOptions
) {
  const cache = new MemoryCache<T>(options);

  return {
    async get(key: string, forceRefresh?: boolean): Promise<T> {
      if (!forceRefresh) {
        const cached = cache.get(key);
        if (cached !== null) {
          return cached;
        }
      }

      const data = await fetcher(key);
      cache.set(key, data);
      return data;
    },

    set(key: string, data: T, ttl?: number): void {
      cache.set(key, data, ttl);
    },

    has(key: string): boolean {
      return cache.has(key);
    },

    delete(key: string): boolean {
      return cache.delete(key);
    },

    clear(): void {
      cache.clear();
    },

    getStats() {
      return cache.getStats();
    },
  };
}

// 导出单例实例
export const memoryCache = new MemoryCache();
export const requestCache = new RequestCache();

// 导出类
export { MemoryCache, RequestCache };
