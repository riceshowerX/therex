/**
 * 移动端响应式导航组件
 * 处理移动端的菜单、抽屉、手势操作等
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  Settings, 
  HelpCircle,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface MobileNavProps {
  className?: string;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  children?: React.ReactNode;
}

export function MobileNav({ className, currentPath, onNavigate, children }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const menuItems = [
    { icon: Home, label: '首页', path: '/' },
    { icon: FileText, label: '文档', path: '/documents' },
    { icon: Settings, label: '设置', path: '/settings' },
    { icon: HelpCircle, label: '帮助', path: '/help' },
  ];
  
  const handleNavigate = useCallback((path: string) => {
    onNavigate?.(path);
    setOpen(false);
  }, [onNavigate]);
  
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Therex</span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex flex-col py-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors",
                currentPath === item.path && "bg-primary/10 text-primary font-medium"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
          
          <div className="h-px bg-border my-2" />
          
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>{theme === 'dark' ? '浅色模式' : '深色模式'}</span>
          </button>
        </nav>
        
        {/* 自定义内容 */}
        {children && (
          <div className="border-t p-4">
            {children}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// 移动端底部工具栏
interface MobileToolbarProps {
  className?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  isDirty?: boolean;
}

export function MobileToolbar({
  className,
  onUndo,
  onRedo,
  onSave,
  onToggleFullscreen,
  isFullscreen,
  canUndo,
  canRedo,
  isDirty,
}: MobileToolbarProps) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t md:hidden z-40",
      className
    )}>
      <div className="flex items-center justify-around h-14 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="重做"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={!isDirty}
          title="保存"
        >
          <span className={cn(isDirty && "text-primary font-medium")}>保存</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "退出全屏" : "全屏"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

// 移动端手势处理器
interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
}

export function useGestures(handlers: GestureHandlers) {
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = React.useRef<number>(0);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    
    // 双击检测
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handlers.onDoubleTap?.();
    }
    lastTapRef.current = now;
  }, [handlers]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;
    
    if (deltaTime < maxSwipeTime) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        // 水平滑动
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (Math.abs(deltaY) > minSwipeDistance) {
        // 垂直滑动
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    }
    
    touchStartRef.current = null;
  }, [handlers]);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

// 响应式容器
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileBreakpoint?: number;
}

export function ResponsiveContainer({ 
  children, 
  className,
  mobileBreakpoint = 768 
}: ResponsiveContainerProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);
  
  return (
    <div className={cn(isMobile && "pb-14", className)}>
      {children}
    </div>
  );
}

// 移动端触摸反馈组件
interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

export function TouchFeedback({ 
  children, 
  className,
  onTap,
  onLongPress,
  disabled 
}: TouchFeedbackProps) {
  const [isActive, setIsActive] = useState(false);
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    setIsActive(true);
    
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
        setIsActive(false);
      }, 500);
    }
  }, [disabled, onLongPress]);
  
  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    setIsActive(false);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    if (onTap) {
      onTap();
    }
  }, [disabled, onTap]);
  
  return (
    <div
      className={cn(
        "transition-transform active:scale-95",
        isActive && "bg-muted",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

export default MobileNav;
