/**
 * 性能优化工具
 *
 * 包含防抖、节流等性能优化函数
 */

import React from 'react';

/**
 * 防抖函数
 *
 * 在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时
 *
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 节流函数
 *
 * 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效
 *
 * @param fn 要执行的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 请求动画帧节流
 *
 * 使用 requestAnimationFrame 实现节流，适合动画和滚动场景
 *
 * @param fn 要执行的函数
 * @returns 节流后的函数
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      fn.apply(this, args);
      rafId = null;
    });
  };
}

/**
 * 批量更新
 *
 * 将多个更新合并到一次渲染周期中
 *
 * @param fn 要执行的函数
 */
export function batchUpdate(fn: () => void): void {
  // 使用 requestAnimationFrame 将更新推迟到下一帧
  requestAnimationFrame(() => {
    fn();
  });
}

/**
 * 异步防抖
 *
 * 返回 Promise 的防抖函数
 *
 * @param fn 要执行的异步函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的异步函数
 */
export function asyncDebounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn.apply(this, args);
          resolve(result as ReturnType<T>);
        } catch (error) {
          reject(error);
        }
        timeoutId = null;
      }, delay);
    });
  };
}

/**
 * 记忆化（Memoization）
 *
 * 缓存函数结果，避免重复计算
 *
 * @param fn 要缓存的函数
 * @returns 记忆化后的函数
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * 清除记忆化缓存
 *
 * @param memoizedFn 记忆化函数
 */
export function clearMemoizeCache<T extends (...args: any[]) => any>(
  memoizedFn: T
): void {
  // 注意：这需要 memoize 函数支持清除缓存
  // 当前实现是简单的版本，不支持清除缓存
  console.warn('Current memoize implementation does not support cache clearing');
}

/**
 * 懒加载组件
 *
 * 使用 React.lazy 和 Suspense 实现组件懒加载
 *
 * @param importFn 组件导入函数
 * @param fallback 加载中显示的内容
 * @returns 懒加载的组件
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): React.LazyExoticComponent<T> {
  const LazyComponent = React.lazy(importFn);

  if (fallback) {
    return LazyComponent;
  }

  return LazyComponent;
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * 开始计时
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * 结束计时并返回耗时
   */
  measure(name: string): number {
    const start = this.marks.get(name);
    if (!start) {
      console.warn(`Mark "${name}" not found`);
      return 0;
    }

    const end = performance.now();
    const duration = end - start;
    this.marks.delete(name);

    console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * 记录性能指标
   */
  log(name: string, duration: number): void {
    console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
  }
}

// 导出全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();
