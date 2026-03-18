/**
 * 性能监控和优化工具
 * 提供性能指标收集、分析和优化建议
 */

// 性能指标类型
export interface PerformanceMetrics {
  // 首次内容绘制
  fcp: number;
  // 最大内容绘制
  lcp: number;
  // 首次输入延迟
  fid: number;
  // 累积布局偏移
  cls: number;
  // 交互时间
  tti: number;
  // 总阻塞时间
  tbt: number;
}

// 组件性能数据
export interface ComponentMetrics {
  name: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  lastUpdateTime: number;
}

// 性能观察者
type PerformanceCallback = (metrics: Partial<PerformanceMetrics>) => void;

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private observers: PerformanceCallback[] = [];
  private isMonitoring = false;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 开始性能监控
   */
  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;
    this.isMonitoring = true;

    // 观察 Core Web Vitals
    this.observeWebVitals();
    
    // 观察 Long Tasks
    this.observeLongTasks();
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers = [];
  }

  /**
   * 订阅性能指标更新
   */
  subscribe(callback: PerformanceCallback): () => void {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * 记录组件性能
   */
  recordComponentRender(name: string, renderTime: number): void {
    const existing = this.componentMetrics.get(name);
    
    if (existing) {
      existing.renderTime = renderTime;
      existing.updateCount++;
      existing.lastUpdateTime = Date.now();
    } else {
      this.componentMetrics.set(name, {
        name,
        renderTime,
        mountTime: Date.now(),
        updateCount: 1,
        lastUpdateTime: Date.now(),
      });
    }
  }

  /**
   * 获取组件性能数据
   */
  getComponentMetrics(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values());
  }

  /**
   * 获取慢组件列表
   */
  getSlowComponents(threshold: number = 16): ComponentMetrics[] {
    return this.getComponentMetrics().filter(m => m.renderTime > threshold);
  }

  /**
   * 生成性能报告
   */
  generateReport(): {
    webVitals: Partial<PerformanceMetrics>;
    components: ComponentMetrics[];
    recommendations: string[];
  } {
    const recommendations = this.generateRecommendations();
    
    return {
      webVitals: this.metrics,
      components: this.getComponentMetrics(),
      recommendations,
    };
  }

  /**
   * 清除所有指标
   */
  clearMetrics(): void {
    this.metrics = {};
    this.componentMetrics.clear();
  }

  // 私有方法

  private observeWebVitals(): void {
    // 使用 PerformanceObserver 观察 LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
          this.notifyObservers();
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP 不支持
      }

      // 观察 FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-input') {
              this.metrics.fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
              this.notifyObservers();
            }
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // FID 不支持
      }

      // 观察 CLS
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.metrics.cls = clsValue;
          this.notifyObservers();
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS 不支持
      }
    }

    // FCP - 从 paint entries 获取
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
      }
    }
  }

  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
          });
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch (e) {
        // Long Task API 不支持
      }
    }
  }

  private notifyObservers(): void {
    this.observers.forEach(callback => callback(this.metrics));
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const { lcp, fid, cls, fcp } = this.metrics;

    if (lcp && lcp > 2500) {
      recommendations.push('LCP 超过 2.5 秒，建议优化关键渲染路径，减少资源加载时间');
    }

    if (fid && fid > 100) {
      recommendations.push('FID 超过 100ms，建议减少 JavaScript 执行时间，使用代码分割');
    }

    if (cls && cls > 0.1) {
      recommendations.push('CLS 超过 0.1，建议为图片和动态内容预留空间');
    }

    if (fcp && fcp > 1800) {
      recommendations.push('FCP 超过 1.8 秒，建议优化服务器响应时间和关键 CSS');
    }

    const slowComponents = this.getSlowComponents();
    if (slowComponents.length > 0) {
      recommendations.push(`发现 ${slowComponents.length} 个渲染较慢的组件，建议使用 React.memo 或优化渲染逻辑`);
    }

    return recommendations;
  }
}

// 导出单例
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * 性能测量装饰器（用于类方法）
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const end = performance.now();
    
    performanceMonitor.recordComponentRender(`${target.constructor.name}.${propertyKey}`, end - start);
    
    return result;
  };

  return descriptor;
}

/**
 * 测量函数执行时间
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  performanceMonitor.recordComponentRender(name, duration);
  
  return { result, duration };
}

/**
 * 测量同步函数执行时间
 */
export function measureSync<T>(name: string, fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  performanceMonitor.recordComponentRender(name, duration);
  
  return { result, duration };
}

/**
 * 请求空闲回调的 polyfill
 */
export const requestIdleCallback =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);

export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : clearTimeout;

/**
 * 节流函数 - 用于滚动等高频事件
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * 防抖函数 - 用于搜索输入等场景
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(this, args);
      }
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    if (immediate && !timeout) {
      func.apply(this, args);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * 懒加载图片
 */
export function createLazyImageLoader(
  rootMargin: string = '50px',
  threshold: number = 0.1
): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
        }
      });
    },
    { rootMargin, threshold }
  );
}

/**
 * 预加载资源
 */
export function preloadResource(url: string, as: 'script' | 'style' | 'image' | 'font'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

/**
 * 检测设备性能等级
 */
export function getDevicePerformanceLevel(): 'low' | 'medium' | 'high' {
  if (typeof window === 'undefined') return 'medium';

  // 使用 navigator.hardwareConcurrency 检测 CPU 核心数
  const cores = navigator.hardwareConcurrency || 4;
  
  // 使用 navigator.deviceMemory 检测内存（如果可用）
  const memory = (navigator as any).deviceMemory || 4;
  
  // 使用 navigator.connection 检测网络（如果可用）
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';

  // 计算性能得分
  let score = 0;
  
  if (cores >= 8) score += 3;
  else if (cores >= 4) score += 2;
  else score += 1;
  
  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else score += 1;
  
  if (effectiveType === '4g') score += 2;
  else if (effectiveType === '3g') score += 1;

  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}
