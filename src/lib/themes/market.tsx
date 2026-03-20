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

// 内置主题预设 - 使用温暖的色调，避免"数字感"的高饱和色
export const builtInThemes: ThemePreset[] = [
  // 浅色主题
  {
    id: 'light-default',
    name: '默认浅色',
    description: '温暖舒适的默认主题',
    author: 'Therex',
    category: 'light',
    colors: {
      background: '#fbfaf8',
      foreground: '#2a2824',
      primary: '#5a6b52',
      secondary: '#f2f0ec',
      accent: '#e8e4dc',
      muted: '#6b6860',
      card: '#fffefb',
      border: '#e8e4dc',
    },
    isOfficial: true,
    tags: ['warm', 'natural'],
  },
  {
    id: 'warm-paper',
    name: '暖纸',
    description: '温暖舒适的纸张质感',
    author: 'Therex',
    category: 'light',
    colors: {
      background: '#f8f6f0',
      foreground: '#3d3a34',
      primary: '#7a8b6a',
      secondary: '#f0ece4',
      accent: '#e4ddd0',
      muted: '#8a857a',
      card: '#fdfcf8',
      border: '#e4ddd0',
    },
    isOfficial: true,
    tags: ['warm', 'comfortable'],
  },
  {
    id: 'cream-note',
    name: '奶油笔记',
    description: '柔和的奶油色调',
    author: 'Therex',
    category: 'light',
    colors: {
      background: '#fdf8f0',
      foreground: '#3a3632',
      primary: '#8a7a5a',
      secondary: '#f5efe5',
      accent: '#ebe3d5',
      muted: '#9a9285',
      card: '#fffcf5',
      border: '#ebe3d5',
    },
    isOfficial: true,
    tags: ['soft', 'elegant'],
  },
  
  // 深色主题
  {
    id: 'dark-default',
    name: '默认深色',
    description: '温暖的深色主题',
    author: 'Therex',
    category: 'dark',
    colors: {
      background: '#1a1c18',
      foreground: '#e8e6e0',
      primary: '#9aaa8a',
      secondary: '#262a22',
      accent: '#323830',
      muted: '#9a988c',
      card: '#222518',
      border: '#323830',
    },
    isOfficial: true,
    tags: ['dark', 'eye-care'],
  },
  {
    id: 'forest-night',
    name: '森林夜语',
    description: '宁静的森林绿色主题',
    author: 'Therex',
    category: 'dark',
    colors: {
      background: '#161814',
      foreground: '#d4d0c8',
      primary: '#7a9a6a',
      secondary: '#1e201a',
      accent: '#2a2e24',
      muted: '#8a8880',
      card: '#1a1c16',
      border: '#2a2e24',
    },
    isOfficial: true,
    tags: ['green', 'nature'],
  },
  {
    id: 'warm-night',
    name: '暖夜',
    description: '温暖的深棕色调',
    author: 'Therex',
    category: 'dark',
    colors: {
      background: '#1c1a18',
      foreground: '#e8e4dc',
      primary: '#c4a86a',
      secondary: '#282420',
      accent: '#383430',
      muted: '#a09888',
      card: '#222018',
      border: '#383430',
    },
    isOfficial: true,
    tags: ['warm', 'cozy'],
  },
  
  // 彩色主题 - 保持温暖的色调
  {
    id: 'autumn-gold',
    name: '秋日金',
    description: '温暖的秋日金色调',
    author: 'Therex',
    category: 'colorful',
    colors: {
      background: '#fbf8f0',
      foreground: '#3a3428',
      primary: '#a08050',
      secondary: '#f5ece0',
      accent: '#e8dcc8',
      muted: '#8a8270',
      card: '#fffaf0',
      border: '#e8dcc8',
    },
    isOfficial: true,
    tags: ['warm', 'elegant'],
  },
  {
    id: 'sage-green',
    name: '鼠尾草绿',
    description: '清新的鼠尾草绿色调',
    author: 'Therex',
    category: 'colorful',
    colors: {
      background: '#f5f8f2',
      foreground: '#2a3428',
      primary: '#6a8a5a',
      secondary: '#e8f0e4',
      accent: '#d8e4d0',
      muted: '#7a8a70',
      card: '#fafcf8',
      border: '#d8e4d0',
    },
    isOfficial: true,
    tags: ['fresh', 'calm'],
  },
  {
    id: 'terracotta',
    name: '陶土红',
    description: '朴实的陶土红棕色调',
    author: 'Therex',
    category: 'colorful',
    colors: {
      background: '#faf6f2',
      foreground: '#3a302a',
      primary: '#a0684a',
      secondary: '#f2ece4',
      accent: '#e4d8cc',
      muted: '#8a7870',
      card: '#fffaf6',
      border: '#e4d8cc',
    },
    isOfficial: true,
    tags: ['earth', 'warm'],
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
      foreground: '#1a1a1a',
      primary: '#4a4a4a',
      secondary: '#fafafa',
      accent: '#f0f0f0',
      muted: '#7a7a7a',
      card: '#ffffff',
      border: '#e8e8e8',
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
      background: '#0a0a0a',
      foreground: '#f0f0f0',
      primary: '#d0d0d0',
      secondary: '#141414',
      accent: '#1e1e1e',
      muted: '#808080',
      card: '#101010',
      border: '#1e1e1e',
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
