/**
 * 增强版编辑器工具栏
 * 支持分组、下拉菜单、快捷键提示和响应式设计
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Table,
  Code2,
  Minus,
  CheckSquare,
  Subscript,
  Superscript,
  Highlighter,
  MoreHorizontal,
  ChevronDown,
  Sparkles,
  Wand2,
  FileText,
  Download,
  Upload,
  Settings,
  HelpCircle,
  Keyboard,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  IndentIncrease,
  IndentDecrease,
  Eraser,
  Copy,
  ClipboardPaste,
  Scissors,
  Undo2,
  Redo2,
} from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';

// 工具栏按钮定义
export interface ToolbarButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export interface ToolbarGroup {
  id: string;
  label: string;
  buttons: ToolbarButton[];
  dropdown?: boolean;
}

export interface ToolbarDivider {
  type: 'divider';
}

export type ToolbarItem = ToolbarButton | ToolbarGroup | ToolbarDivider;

// 格式化按钮组件
interface FormatButtonProps {
  button: ToolbarButton;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  showTooltip?: boolean;
  showLabel?: boolean;
}

const FormatButton = memo(function FormatButton({
  button,
  size = 'icon',
  showTooltip = true,
  showLabel = false,
}: FormatButtonProps) {
  const content = (
    <Button
      variant={button.active ? 'secondary' : 'ghost'}
      size={size}
      onClick={button.action}
      disabled={button.disabled}
      className={showLabel ? 'gap-2' : ''}
    >
      {button.icon}
      {showLabel && <span>{button.label}</span>}
    </Button>
  );

  if (!showTooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{button.tooltip || button.label}</span>
        {button.shortcut && <Kbd>{button.shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
});

// 下拉菜单按钮组件
interface DropdownButtonProps {
  label: string;
  icon?: React.ReactNode;
  items: ToolbarButton[];
  shortcut?: string;
}

const DropdownButton = memo(function DropdownButton({
  label,
  icon,
  items,
  shortcut,
}: DropdownButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          {icon}
          <span>{label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && item.disabled && !items[index - 1].disabled && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuItem
              onClick={item.action}
              disabled={item.disabled}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// 工具栏组件属性
export interface EnhancedToolbarProps {
  groups: ToolbarGroup[];
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EnhancedToolbar({
  groups,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  children,
  className = '',
  compact = false,
}: EnhancedToolbarProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const renderGroup = useCallback(
    (group: ToolbarGroup) => {
      if (group.dropdown && compact) {
        return (
          <DropdownButton
            key={group.id}
            label={group.label}
            items={group.buttons}
          />
        );
      }

      return (
        <div key={group.id} className="flex items-center gap-0.5">
          {group.buttons.map((button) => (
            <FormatButton
              key={button.id}
              button={button}
              size={compact ? 'sm' : 'icon'}
              showLabel={!compact && expandedGroup === group.id}
            />
          ))}
        </div>
      );
    },
    [compact, expandedGroup]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`flex items-center gap-1 p-1 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
        {/* 撤销/重做 */}
        {(onUndo || onRedo) && (
          <div className="flex items-center gap-0.5">
            {onUndo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={compact ? 'sm' : 'icon'}
                    onClick={onUndo}
                    disabled={!canUndo}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  撤销 <Kbd>Ctrl+Z</Kbd>
                </TooltipContent>
              </Tooltip>
            )}
            {onRedo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={compact ? 'sm' : 'icon'}
                    onClick={onRedo}
                    disabled={!canRedo}
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  重做 <Kbd>Ctrl+Shift+Z</Kbd>
                </TooltipContent>
              </Tooltip>
            )}
            <Separator orientation="vertical" className="h-6 mx-1" />
          </div>
        )}

        {/* 格式化分组 */}
        {groups.map((group, index) => (
          <React.Fragment key={group.id}>
            {renderGroup(group)}
            {index < groups.length - 1 && (
              <Separator orientation="vertical" className="h-6 mx-1" />
            )}
          </React.Fragment>
        ))}

        {/* 自定义内容 */}
        {children && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            {children}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

// 预定义的格式化工具栏
export function createFormatToolbar(
  actions: {
    bold?: () => void;
    italic?: () => void;
    strikethrough?: () => void;
    code?: () => void;
    heading1?: () => void;
    heading2?: () => void;
    heading3?: () => void;
    bulletList?: () => void;
    numberedList?: () => void;
    quote?: () => void;
    link?: () => void;
    image?: () => void;
    table?: () => void;
    codeBlock?: () => void;
    hr?: () => void;
    checkbox?: () => void;
    highlight?: () => void;
    subscript?: () => void;
    superscript?: () => void;
  }
): ToolbarGroup[] {
  return [
    {
      id: 'text-style',
      label: '文本样式',
      buttons: [
        {
          id: 'bold',
          icon: <Bold className="h-4 w-4" />,
          label: '加粗',
          tooltip: '加粗',
          shortcut: 'Ctrl+B',
          action: actions.bold || (() => {}),
        },
        {
          id: 'italic',
          icon: <Italic className="h-4 w-4" />,
          label: '斜体',
          tooltip: '斜体',
          shortcut: 'Ctrl+I',
          action: actions.italic || (() => {}),
        },
        {
          id: 'strikethrough',
          icon: <Strikethrough className="h-4 w-4" />,
          label: '删除线',
          tooltip: '删除线',
          action: actions.strikethrough || (() => {}),
        },
      ],
    },
    {
      id: 'headings',
      label: '标题',
      buttons: [
        {
          id: 'h1',
          icon: <Heading1 className="h-4 w-4" />,
          label: '标题 1',
          tooltip: '标题 1',
          action: actions.heading1 || (() => {}),
        },
        {
          id: 'h2',
          icon: <Heading2 className="h-4 w-4" />,
          label: '标题 2',
          tooltip: '标题 2',
          action: actions.heading2 || (() => {}),
        },
        {
          id: 'h3',
          icon: <Heading3 className="h-4 w-4" />,
          label: '标题 3',
          tooltip: '标题 3',
          action: actions.heading3 || (() => {}),
        },
      ],
    },
    {
      id: 'lists',
      label: '列表',
      buttons: [
        {
          id: 'bullet-list',
          icon: <List className="h-4 w-4" />,
          label: '无序列表',
          tooltip: '无序列表',
          action: actions.bulletList || (() => {}),
        },
        {
          id: 'numbered-list',
          icon: <ListOrdered className="h-4 w-4" />,
          label: '有序列表',
          tooltip: '有序列表',
          action: actions.numberedList || (() => {}),
        },
        {
          id: 'checkbox',
          icon: <CheckSquare className="h-4 w-4" />,
          label: '待办事项',
          tooltip: '待办事项',
          action: actions.checkbox || (() => {}),
        },
      ],
    },
    {
      id: 'insert',
      label: '插入',
      buttons: [
        {
          id: 'link',
          icon: <Link className="h-4 w-4" />,
          label: '链接',
          tooltip: '链接',
          shortcut: 'Ctrl+K',
          action: actions.link || (() => {}),
        },
        {
          id: 'image',
          icon: <Image className="h-4 w-4" />,
          label: '图片',
          tooltip: '图片',
          action: actions.image || (() => {}),
        },
        {
          id: 'table',
          icon: <Table className="h-4 w-4" />,
          label: '表格',
          tooltip: '表格',
          action: actions.table || (() => {}),
        },
        {
          id: 'code-block',
          icon: <Code2 className="h-4 w-4" />,
          label: '代码块',
          tooltip: '代码块',
          action: actions.codeBlock || (() => {}),
        },
        {
          id: 'hr',
          icon: <Minus className="h-4 w-4" />,
          label: '分隔线',
          tooltip: '分隔线',
          action: actions.hr || (() => {}),
        },
      ],
    },
    {
      id: 'code',
      label: '代码',
      dropdown: true,
      buttons: [
        {
          id: 'inline-code',
          icon: <Code className="h-4 w-4" />,
          label: '行内代码',
          tooltip: '行内代码',
          shortcut: 'Ctrl+`',
          action: actions.code || (() => {}),
        },
        {
          id: 'code-block',
          icon: <Code2 className="h-4 w-4" />,
          label: '代码块',
          tooltip: '代码块',
          action: actions.codeBlock || (() => {}),
        },
      ],
    },
  ];
}

// 导出
export default EnhancedToolbar;
