'use client';

/**
 * 虚拟滚动列表组件
 *
 * 用于优化长列表的渲染性能，只渲染可视区域内的元素
 */

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VirtualListProps<T> {
  /**
   * 数据列表
   */
  data: T[];
  /**
   * 每个列表项的高度（固定高度）
   */
  itemHeight: number;
  /**
   * 容器高度
   */
  containerHeight: number;
  /**
   * 渲染列表项的函数
   */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * 额外渲染的项目数量（用于缓冲）
   * @default 5
   */
  overscan?: number;
  /**
   * 列表项的 key 获取函数
   */
  getItemKey?: (item: T, index: number) => string | number;
  /**
   * 初始滚动位置
   * @default 0
   */
  initialScrollOffset?: number;
  /**
   * 滚动位置变化回调
   */
  onScroll?: (scrollTop: number) => void;
}

/**
 * 虚拟滚动列表组件
 */
export function VirtualList<T>({
  data,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  getItemKey,
  initialScrollOffset = 0,
  onScroll,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(initialScrollOffset);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 计算可视区域的起始和结束索引
  const { startIndex, endIndex, offsetY, totalHeight } = useMemo(() => {
    const totalCount = data.length;
    const totalHeight = totalCount * itemHeight;

    // 计算可视区域的项目索引
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      totalCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, offsetY, totalHeight };
  }, [data.length, itemHeight, scrollTop, containerHeight, overscan]);

  // 处理滚动事件
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      setScrollTop(scrollTop);
      onScroll?.(scrollTop);
    },
    [onScroll]
  );

  // 渲染可视区域的项目
  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const item = data[i];
      if (item) {
        const key = getItemKey ? getItemKey(item, i) : i;
        items.push(
          <div
            key={key}
            style={{
              position: 'absolute',
              top: i * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, i)}
          </div>
        );
      }
    }
    return items;
  }, [data, startIndex, endIndex, itemHeight, renderItem, getItemKey]);

  return (
    <ScrollArea
      ref={scrollContainerRef}
      className="relative"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        className="relative"
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          className="absolute"
          style={{
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems}
        </div>
      </div>
    </ScrollArea>
  );
}

/**
 * 动态高度虚拟列表（更复杂但更灵活）
 */
interface DynamicVirtualListProps<T> {
  data: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  measureItem?: (index: number, element: HTMLElement) => void;
}

export function DynamicVirtualList<T>({
  data,
  estimatedItemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  getItemKey,
  measureItem,
}: DynamicVirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemPositions, setItemPositions] = useState<Map<number, { top: number; height: number }>>(
    new Map()
  );

  // 更新项目位置
  const updateItemPosition = useCallback(
    (index: number, height: number) => {
      setItemPositions((prev) => {
        const next = new Map(prev);
        const prevIndex = index - 1;
        const prevPosition = prev.get(prevIndex);
        const top = prevPosition ? prevPosition.top + prevPosition.height : 0;

        next.set(index, { top, height });
        return next;
      });
    },
    []
  );

  // 计算总高度
  const { totalHeight, visibleItems, offsetY } = useMemo(() => {
    let totalHeight = 0;
    let offsetY = 0;

    const visibleItems: { item: T; index: number; top: number }[] = [];

    data.forEach((item, index) => {
      const position = itemPositions.get(index);
      const height = position?.height ?? estimatedItemHeight;
      const top = position?.top ?? totalHeight;

      totalHeight += height;

      // 判断是否在可视区域内
      if (
        top + height > scrollTop - overscan * estimatedItemHeight &&
        top < scrollTop + containerHeight + overscan * estimatedItemHeight
      ) {
        visibleItems.push({ item, index, top });
      }

      if (index === 0) {
        offsetY = top;
      }
    });

    return { totalHeight, visibleItems, offsetY };
  }, [data, itemPositions, scrollTop, containerHeight, overscan, estimatedItemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <ScrollArea
      className="relative"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        className="relative"
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems.map(({ item, index, top }) => {
          const key = getItemKey ? getItemKey(item, index) : index;
          return (
            <div
              key={key}
              ref={(element) => {
                if (element && !itemPositions.has(index)) {
                  measureItem?.(index, element);
                }
              }}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
