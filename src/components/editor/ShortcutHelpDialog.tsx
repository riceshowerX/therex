/**
 * 快捷键帮助对话框
 * 显示所有可用快捷键及其描述
 */

'use client';

import React, { memo, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Keyboard as KeyboardIcon } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';

// 快捷键定义
export interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

// 预定义快捷键
const SHORTCUTS: ShortcutItem[] = [
  // 文件操作
  { keys: ['Ctrl', 'S'], description: '保存文档', category: '文件' },
  { keys: ['Ctrl', 'Shift', 'S'], description: '另存为', category: '文件' },
  { keys: ['Ctrl', 'N'], description: '新建文档', category: '文件' },
  { keys: ['Ctrl', 'O'], description: '打开文档', category: '文件' },
  { keys: ['Ctrl', 'W'], description: '关闭文档', category: '文件' },

  // 编辑操作
  { keys: ['Ctrl', 'Z'], description: '撤销', category: '编辑' },
  { keys: ['Ctrl', 'Y'], description: '重做', category: '编辑' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: '重做', category: '编辑' },
  { keys: ['Ctrl', 'X'], description: '剪切', category: '编辑' },
  { keys: ['Ctrl', 'C'], description: '复制', category: '编辑' },
  { keys: ['Ctrl', 'V'], description: '粘贴', category: '编辑' },
  { keys: ['Ctrl', 'A'], description: '全选', category: '编辑' },
  { keys: ['Ctrl', 'F'], description: '查找', category: '编辑' },
  { keys: ['Ctrl', 'H'], description: '替换', category: '编辑' },

  // 格式化
  { keys: ['Ctrl', 'B'], description: '加粗', category: '格式' },
  { keys: ['Ctrl', 'I'], description: '斜体', category: '格式' },
  { keys: ['Ctrl', 'Shift', 'X'], description: '删除线', category: '格式' },
  { keys: ['Ctrl', '`'], description: '行内代码', category: '格式' },
  { keys: ['Ctrl', 'K'], description: '插入链接', category: '格式' },
  { keys: ['Ctrl', 'Shift', 'I'], description: '插入图片', category: '格式' },

  // 标题
  { keys: ['Ctrl', '1'], description: '一级标题', category: '标题' },
  { keys: ['Ctrl', '2'], description: '二级标题', category: '标题' },
  { keys: ['Ctrl', '3'], description: '三级标题', category: '标题' },
  { keys: ['Ctrl', '4'], description: '四级标题', category: '标题' },
  { keys: ['Ctrl', '5'], description: '五级标题', category: '标题' },
  { keys: ['Ctrl', '6'], description: '六级标题', category: '标题' },

  // 列表
  { keys: ['Ctrl', 'Shift', '.'], description: '无序列表', category: '列表' },
  { keys: ['Ctrl', 'Shift', '/'], description: '有序列表', category: '列表' },
  { keys: ['Ctrl', 'Shift', 'C'], description: '任务列表', category: '列表' },

  // 视图
  { keys: ['Ctrl', '\\'], description: '切换预览模式', category: '视图' },
  { keys: ['Ctrl', 'Shift', '\\'], description: '切换实时预览', category: '视图' },
  { keys: ['F11'], description: '全屏模式', category: '视图' },
  { keys: ['Ctrl', 'Plus'], description: '放大字体', category: '视图' },
  { keys: ['Ctrl', 'Minus'], description: '缩小字体', category: '视图' },
  { keys: ['Ctrl', '0'], description: '重置字体大小', category: '视图' },

  // AI 功能
  { keys: ['Ctrl', 'K'], description: '打开 AI 助手', category: 'AI' },
  { keys: ['Ctrl', 'Enter'], description: 'AI 续写', category: 'AI' },
  { keys: ['Ctrl', 'Shift', 'P'], description: 'AI 润色', category: 'AI' },
  { keys: ['Ctrl', 'Shift', 'T'], description: 'AI 翻译', category: 'AI' },

  // 工具
  { keys: ['Ctrl', '/'], description: '快捷键帮助', category: '工具' },
  { keys: ['Ctrl', ','], description: '打开设置', category: '工具' },
  { keys: ['Ctrl', 'E'], description: '导出文档', category: '工具' },
  { keys: ['Ctrl', 'P'], description: '打印文档', category: '工具' },
];

// 获取所有分类
const CATEGORIES = Array.from(new Set(SHORTCUTS.map((s) => s.category)));

// 快捷键项组件
interface ShortcutItemProps {
  shortcut: ShortcutItem;
}

const ShortcutItemRow = memo(function ShortcutItemRow({ shortcut }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors">
      <span className="text-sm">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, index) => (
          <React.Fragment key={key + index}>
            <Kbd>{key}</Kbd>
            {index < shortcut.keys.length - 1 && (
              <span className="text-muted-foreground text-xs">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

// 分类面板组件
interface CategoryPanelProps {
  shortcuts: ShortcutItem[];
}

const CategoryPanel = memo(function CategoryPanel({ shortcuts }: CategoryPanelProps) {
  return (
    <div className="space-y-1">
      {shortcuts.map((shortcut, index) => (
        <ShortcutItemRow key={index} shortcut={shortcut} />
      ))}
    </div>
  );
});

// 属性类型
export interface ShortcutHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 主组件
export function ShortcutHelpDialog({
  open,
  onOpenChange,
}: ShortcutHelpDialogProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  // 过滤快捷键
  const filteredShortcuts = useMemo(() => {
    if (!search) return SHORTCUTS;
    const query = search.toLowerCase();
    return SHORTCUTS.filter(
      (s) =>
        s.description.toLowerCase().includes(query) ||
        s.keys.some((k) => k.toLowerCase().includes(query))
    );
  }, [search]);

  // 按分类分组
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, ShortcutItem[]> = {};
    for (const shortcut of filteredShortcuts) {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    }
    return groups;
  }, [filteredShortcuts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyboardIcon className="h-5 w-5" />
            键盘快捷键
          </DialogTitle>
          <DialogDescription>
            使用快捷键提高编辑效率
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索快捷键..."
              className="pl-10"
            />
          </div>

          {/* 分类标签 */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCategory === '全部' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setActiveCategory('全部')}
            >
              全部 ({SHORTCUTS.length})
            </Badge>
            {CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveCategory(category)}
              >
                {category} ({groupedShortcuts[category]?.length || 0})
              </Badge>
            ))}
          </div>

          {/* 快捷键列表 */}
          <ScrollArea className="h-[400px] pr-4">
            {activeCategory === '全部' ? (
              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                      {category}
                    </h4>
                    <CategoryPanel shortcuts={shortcuts} />
                  </div>
                ))}
              </div>
            ) : (
              <CategoryPanel shortcuts={groupedShortcuts[activeCategory] || []} />
            )}
          </ScrollArea>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          按 <Kbd>Ctrl</Kbd> + <Kbd>/</Kbd> 随时打开此帮助
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShortcutHelpDialog;
