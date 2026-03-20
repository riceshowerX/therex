/**
 * 主题市场
 * 支持主题预览、一键切换、自定义主题
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Palette,
  Check,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Eye,
  Download,
  Heart,
} from 'lucide-react';

// 预设主题
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  author: string;
  category: 'light' | 'dark' | 'colorful' | 'minimal' | 'custom';
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
    card: string;
    border: string;
  };
  preview?: string;
  downloads?: number;
  likes?: number;
  isOfficial?: boolean;
  tags?: string[];
}

// 内置主题预设
export const builtInThemes: ThemePreset[] = [
  // 浅色主题
  {
    id: 'light-default',
    name: '默认浅色',
    description: '清爽简洁的默认浅色主题',
    author: 'Therex',
    category: 'light',
    colors: {
      background: '#ffffff',
      foreground: '#0a0a0a',
      primary: '#171717',
      secondary: '#f5f5f5',
      accent: '#e5e5e5',
      muted: '#737373',
      card: '#ffffff',
      border: '#e5e5e5',
    },
    isOfficial: true,
    tags: ['clean', 'minimal'],
  },
  {
    id: 'warm-paper',
    name: '暖纸',
    description: '温暖舒适的纸张质感',
    author: 'Therex',
    category: 'light',
    colors: {
      background: '#faf8f5',
      foreground: '#3d3d3d',
      primary: '#8b7355',
      secondary: '#f5f0e6',
      accent: '#e8dcc8',
      muted: '#8b8b8b',
      card: '#fffdf9',
      border: '#e8dcc8',
    },
    isOfficial: true,
    tags: ['warm', 'comfortable'],
  },
  
  // 深色主题
  {
    id: 'dark-default',
    name: '默认深色',
    description: '护眼舒适的深色主题',
    author: 'Therex',
    category: 'dark',
    colors: {
      background: '#0a0a0a',
      foreground: '#fafafa',
      primary: '#ffffff',
      secondary: '#171717',
      accent: '#262626',
      muted: '#a3a3a3',
      card: '#171717',
      border: '#262626',
    },
    isOfficial: true,
    tags: ['dark', 'eye-care'],
  },
  {
    id: 'midnight-blue',
    name: '午夜蓝',
    description: '深邃的午夜蓝色调',
    author: 'Therex',
    category: 'dark',
    colors: {
      background: '#0f172a',
      foreground: '#f1f5f9',
      primary: '#60a5fa',
      secondary: '#1e293b',
      accent: '#334155',
      muted: '#94a3b8',
      card: '#1e293b',
      border: '#334155',
    },
    isOfficial: true,
    tags: ['blue', 'professional'],
  },
  {
    id: 'forest-night',
    name: '森林夜语',
    description: '宁静的森林绿色主题',
    author: 'Therex',
    category: 'dark',
    colors: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      primary: '#3fb950',
      secondary: '#161b22',
      accent: '#21262d',
      muted: '#8b949e',
      card: '#161b22',
      border: '#30363d',
    },
    isOfficial: true,
    tags: ['green', 'nature'],
  },
  
  // 彩色主题
  {
    id: 'sunset-orange',
    name: '日落橙',
    description: '温暖的日落橙色调',
    author: 'Therex',
    category: 'colorful',
    colors: {
      background: '#fef7ed',
      foreground: '#431407',
      primary: '#f97316',
      secondary: '#ffedd5',
      accent: '#fed7aa',
      muted: '#9a3412',
      card: '#ffffff',
      border: '#fed7aa',
    },
    isOfficial: true,
    tags: ['warm', 'energetic'],
  },
  {
    id: 'ocean-teal',
    name: '海洋青',
    description: '清新的海洋青色调',
    author: 'Therex',
    category: 'colorful',
    colors: {
      background: '#f0fdfa',
      foreground: '#134e4a',
      primary: '#14b8a6',
      secondary: '#ccfbf1',
      accent: '#99f6e4',
      muted: '#0f766e',
      card: '#ffffff',
      border: '#99f6e4',
    },
    isOfficial: true,
    tags: ['fresh', 'calm'],
  },
  {
    id: 'lavender-dream',
    name: '薰衣草梦境',
    description: '梦幻的薰衣草紫色',
    author: 'Therex',
    category: 'colorful',
    colors: {
      background: '#faf5ff',
      foreground: '#3b0764',
      primary: '#a855f7',
      secondary: '#f3e8ff',
      accent: '#e9d5ff',
      muted: '#7e22ce',
      card: '#ffffff',
      border: '#e9d5ff',
    },
    isOfficial: true,
    tags: ['dreamy', 'creative'],
  },
  
  // 极简主题
  {
    id: 'pure-white',
    name: '纯白',
    description: '极简主义纯白主题',
    author: 'Therex',
    category: 'minimal',
    colors: {
      background: '#ffffff',
      foreground: '#000000',
      primary: '#000000',
      secondary: '#fafafa',
      accent: '#f5f5f5',
      muted: '#737373',
      card: '#ffffff',
      border: '#e5e5e5',
    },
    isOfficial: true,
    tags: ['minimal', 'pure'],
  },
  {
    id: 'mono-dark',
    name: '单色黑',
    description: '纯黑白极简主题',
    author: 'Therex',
    category: 'minimal',
    colors: {
      background: '#000000',
      foreground: '#ffffff',
      primary: '#ffffff',
      secondary: '#0a0a0a',
      accent: '#171717',
      muted: '#a3a3a3',
      card: '#0a0a0a',
      border: '#171717',
    },
    isOfficial: true,
    tags: ['minimal', 'mono'],
  },
];

// 主题管理器
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemePreset | null = null;
  private listeners: Set<(theme: ThemePreset | null) => void> = new Set();

  private constructor() {
    // 从存储加载当前主题
    this.loadCurrentTheme();
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // 获取当前主题
  getCurrentTheme(): ThemePreset | null {
    return this.currentTheme;
  }

  // 应用主题
  applyTheme(theme: ThemePreset): void {
    this.currentTheme = theme;
    
    // 应用 CSS 变量
    const root = document.documentElement;
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--card', theme.colors.card);
    root.style.setProperty('--border', theme.colors.border);

    // 保存到存储
    this.saveCurrentTheme(theme);

    // 通知监听器
    this.listeners.forEach(listener => listener(theme));
  }

  // 重置为默认主题
  resetToDefault(): void {
    this.currentTheme = null;
    
    // 清除自定义 CSS 变量
    const root = document.documentElement;
    root.style.removeProperty('--background');
    root.style.removeProperty('--foreground');
    root.style.removeProperty('--primary');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--muted');
    root.style.removeProperty('--card');
    root.style.removeProperty('--border');

    localStorage.removeItem('therex-theme');

    this.listeners.forEach(listener => listener(null));
  }

  // 监听主题变化
  onThemeChange(listener: (theme: ThemePreset | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 私有方法
  private loadCurrentTheme(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('therex-theme');
      if (stored) {
        const theme = JSON.parse(stored) as ThemePreset;
        this.applyTheme(theme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  }

  private saveCurrentTheme(theme: ThemePreset): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('therex-theme', JSON.stringify(theme));
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }
}

// 主题市场对话框组件
interface ThemeMarketProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeMarket({ open, onClose }: ThemeMarketProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);
  const [manager] = useState(() => ThemeManager.getInstance());

  // 监听主题变化
  useEffect(() => {
    const unsub = manager.onThemeChange((theme) => {
      setCurrentThemeId(theme?.id || null);
    });
    return unsub;
  }, [manager]);

  // 过滤主题
  const filteredThemes = selectedCategory === 'all'
    ? builtInThemes
    : builtInThemes.filter(t => t.category === selectedCategory);

  // 应用主题
  const handleApplyTheme = useCallback((theme: ThemePreset) => {
    manager.applyTheme(theme);
  }, [manager]);

  // 分类选项
  const categories = [
    { id: 'all', label: '全部', icon: Sparkles },
    { id: 'light', label: '浅色', icon: Sun },
    { id: 'dark', label: '深色', icon: Moon },
    { id: 'colorful', label: '彩色', icon: Palette },
    { id: 'minimal', label: '极简', icon: Monitor },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            主题市场
          </DialogTitle>
          <DialogDescription>
            选择一个主题来个性化你的编辑器
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 py-4 flex-1 overflow-hidden">
          {/* 分类侧边栏 */}
          <div className="w-48 shrink-0 space-y-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* 主题网格 */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
              {filteredThemes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={currentThemeId === theme.id}
                  onApply={() => handleApplyTheme(theme)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 主题卡片组件
interface ThemeCardProps {
  theme: ThemePreset;
  isActive: boolean;
  onApply: () => void;
}

function ThemeCard({ theme, isActive, onApply }: ThemeCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border-2 overflow-hidden transition-all cursor-pointer",
        isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      )}
      onClick={onApply}
    >
      {/* 预览区域 */}
      <div
        className="h-24 p-3 flex items-end gap-1"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div
          className="w-8 h-8 rounded"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div
          className="flex-1 h-6 rounded"
          style={{ backgroundColor: theme.colors.secondary }}
        />
        <div
          className="w-6 h-6 rounded"
          style={{ backgroundColor: theme.colors.accent }}
        />
      </div>

      {/* 信息区域 */}
      <div className="p-3 bg-card">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm">{theme.name}</span>
          {isActive && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {theme.description}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {theme.isOfficial && (
            <Badge variant="secondary" className="text-xs">
              官方
            </Badge>
          )}
          {theme.tags?.slice(0, 1).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* 悬停操作 */}
      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button size="sm" variant="secondary" className="gap-1">
          <Eye className="h-3 w-3" />
          预览
        </Button>
        <Button size="sm" className="gap-1">
          {isActive ? (
            <>
              <Check className="h-3 w-3" />
              已应用
            </>
          ) : (
            <>
              <Palette className="h-3 w-3" />
              应用
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// 导出主题管理器实例
export const themeManager = ThemeManager.getInstance();
