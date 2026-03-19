/**
 * 移动端增强组件
 * 提供手势操作、触摸反馈、响应式布局优化
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit3,
  Eye,
  Settings,
  Share2,
  Download,
  Wand2,
  Keyboard,
  X,
  Check,
} from 'lucide-react';

// 手势类型
export type GestureType = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'pinch' | 'double-tap' | 'long-press';

// 手势回调
export interface GestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

// 手势 Hook
export function useGestures(callbacks: GestureCallbacks, options?: {
  swipeThreshold?: number;
  swipeTimeout?: number;
  longPressDelay?: number;
  pinchThreshold?: number;
}) {
  const touchStartRef = useRef<{ x: number; y: number; time: number; scale?: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const config = {
    swipeThreshold: options?.swipeThreshold || 50,
    swipeTimeout: options?.swipeTimeout || 300,
    longPressDelay: options?.longPressDelay || 500,
    pinchThreshold: options?.pinchThreshold || 0.1,
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now,
      scale: e.touches.length === 2 ? 1 : undefined,
    };

    // 双击检测
    if (now - lastTapRef.current < 300) {
      callbacks.onDoubleTap?.();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // 长按检测
    longPressTimerRef.current = setTimeout(() => {
      callbacks.onLongPress?.();
    }, config.longPressDelay);
  }, [callbacks, config.longPressDelay]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // 取消长按
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // 双指缩放
    if (e.touches.length === 2 && touchStartRef.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const initialDistance = touchStartRef.current.scale || distance;
      const scale = distance / initialDistance;
      
      if (Math.abs(scale - 1) > config.pinchThreshold) {
        callbacks.onPinch?.(scale);
      }
    }
  }, [callbacks, config.pinchThreshold]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // 取消长按
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // 检测滑动
    if (deltaTime < config.swipeTimeout) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > config.swipeThreshold) {
          if (deltaX > 0) {
            callbacks.onSwipeRight?.();
          } else {
            callbacks.onSwipeLeft?.();
          }
        }
      } else {
        if (Math.abs(deltaY) > config.swipeThreshold) {
          if (deltaY > 0) {
            callbacks.onSwipeDown?.();
          } else {
            callbacks.onSwipeUp?.();
          }
        }
      }
    }

    touchStartRef.current = null;
  }, [callbacks, config.swipeThreshold, config.swipeTimeout]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

// 触摸反馈组件
interface TouchRippleProps {
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
  disabled?: boolean;
  onTap?: () => void;
}

export function TouchRipple({ 
  children, 
  className,
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  disabled,
  onTap 
}: TouchRippleProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setRipples(prev => [...prev, { id: Date.now(), x, y }]);
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    onTap?.();
    
    // 清除涟漪
    setTimeout(() => {
      setRipples(prev => prev.slice(1));
    }, 600);
  }, [disabled, onTap]);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ping"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
            backgroundColor: rippleColor,
            opacity: 0.3,
          }}
        />
      ))}
    </div>
  );
}

// 拖拽排序 Hook
export function useDragSort<T>(
  items: T[],
  onReorder: (newItems: T[]) => void,
  keyExtractor: (item: T) => string
) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggingIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    if (draggingIndex !== null && draggingIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggingIndex]);

  const handleDragEnd = useCallback(() => {
    if (draggingIndex !== null && dragOverIndex !== null) {
      const newItems = [...items];
      const [draggedItem] = newItems.splice(draggingIndex, 1);
      newItems.splice(dragOverIndex, 0, draggedItem);
      onReorder(newItems);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [draggingIndex, dragOverIndex, items, onReorder]);

  return {
    draggingIndex,
    dragOverIndex,
    handlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
    },
  };
}

// 移动端底部操作栏
interface MobileActionBarProps {
  className?: string;
  onEdit?: () => void;
  onPreview?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  onAI?: () => void;
  onSettings?: () => void;
  isEditing?: boolean;
}

export function MobileActionBar({
  className,
  onEdit,
  onPreview,
  onShare,
  onExport,
  onAI,
  onSettings,
  isEditing,
}: MobileActionBarProps) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t md:hidden z-50 safe-area-bottom",
      className
    )}>
      <div className="flex items-center justify-around h-14 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className={cn("flex-col gap-0.5 h-auto py-2", isEditing && "text-primary")}
        >
          <Edit3 className="h-5 w-5" />
          <span className="text-xs">编辑</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className={cn("flex-col gap-0.5 h-auto py-2", !isEditing && "text-primary")}
        >
          <Eye className="h-5 w-5" />
          <span className="text-xs">预览</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onAI}
          className="flex-col gap-0.5 h-auto py-2"
        >
          <Wand2 className="h-5 w-5" />
          <span className="text-xs">AI</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="flex-col gap-0.5 h-auto py-2"
        >
          <Share2 className="h-5 w-5" />
          <span className="text-xs">分享</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="flex-col gap-0.5 h-auto py-2"
        >
          <Download className="h-5 w-5" />
          <span className="text-xs">导出</span>
        </Button>
      </div>
    </div>
  );
}

// 移动端快捷键提示
interface MobileShortcutHintProps {
  shortcut: string;
  description: string;
  onClose?: () => void;
}

export function MobileShortcutHint({ shortcut, description, onClose }: MobileShortcutHintProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
      <Keyboard className="h-4 w-4" />
      <span className="font-mono text-sm">{shortcut}</span>
      <span className="text-sm opacity-80">{description}</span>
    </div>
  );
}

// 移动端滑动手势面板
interface SwipePanelProps {
  children: React.ReactNode;
  side: 'left' | 'right';
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  swipeThreshold?: number;
}

export function SwipePanel({
  children,
  side,
  isOpen,
  onClose,
  onOpen,
  swipeThreshold = 50,
}: SwipePanelProps) {
  const gestures = useGestures({
    onSwipeLeft: side === 'left' ? onOpen : onClose,
    onSwipeRight: side === 'right' ? onOpen : onClose,
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => open ? onOpen() : onClose()}>
      <SheetContent side={side} className="w-80 p-0" {...gestures}>
        {children}
      </SheetContent>
    </Sheet>
  );
}

// 响应式布局 Hook
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
  };
}

// 安全区域 Hook（支持 iPhone X 等刘海屏）
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const computeSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-top') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-left') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-right') || '0'),
      });
    };

    computeSafeArea();
    window.addEventListener('resize', computeSafeArea);
    return () => window.removeEventListener('resize', computeSafeArea);
  }, []);

  return safeArea;
}

export default {
  useGestures,
  TouchRipple,
  useDragSort,
  MobileActionBar,
  MobileShortcutHint,
  SwipePanel,
  useResponsive,
  useSafeArea,
};
