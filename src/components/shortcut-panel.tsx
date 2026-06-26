'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Keyboard,
  FileText,
  Edit3,
  Navigation,
  Search,
  Wrench,
  Command,
} from 'lucide-react';

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: '文件操作',
    icon: <FileText className="h-4 w-4" />,
    shortcuts: [
      { keys: ['Ctrl/Cmd', 'S'], description: '保存文档' },
      { keys: ['Ctrl/Cmd', 'Shift', 'S'], description: '保存版本' },
      { keys: ['Ctrl/Cmd', 'N'], description: '新建文档' },
      { keys: ['Ctrl/Cmd', 'O'], description: '打开文档' },
    ],
  },
  {
    title: '编辑操作',
    icon: <Edit3 className="h-4 w-4" />,
    shortcuts: [
      { keys: ['Ctrl/Cmd', 'Z'], description: '撤销' },
      { keys: ['Ctrl/Cmd', 'Shift', 'Z'], description: '重做' },
      { keys: ['Ctrl/Cmd', 'Y'], description: '重做（备选）' },
      { keys: ['Ctrl/Cmd', 'X'], description: '剪切' },
      { keys: ['Ctrl/Cmd', 'C'], description: '复制' },
      { keys: ['Ctrl/Cmd', 'V'], description: '粘贴' },
      { keys: ['Ctrl/Cmd', 'A'], description: '全选' },
    ],
  },
  {
    title: '文本格式',
    icon: <Wrench className="h-4 w-4" />,
    shortcuts: [
      { keys: ['Ctrl/Cmd', 'B'], description: '加粗' },
      { keys: ['Ctrl/Cmd', 'I'], description: '斜体' },
      { keys: ['Ctrl/Cmd', 'U'], description: '下划线' },
      { keys: ['Ctrl/Cmd', 'Shift', 'X'], description: '删除线' },
      { keys: ['Ctrl/Cmd', 'K'], description: '插入链接' },
      { keys: ['Ctrl/Cmd', 'Shift', 'C'], description: '插入代码块' },
      { keys: ['Ctrl/Cmd', 'Shift', 'I'], description: '插入图片' },
      { keys: ['Ctrl/Cmd', '`'], description: '行内代码' },
    ],
  },
  {
    title: '导航与搜索',
    icon: <Navigation className="h-4 w-4" />,
    shortcuts: [
      { keys: ['Ctrl/Cmd', 'F'], description: '查找' },
      { keys: ['Ctrl/Cmd', 'H'], description: '查找替换' },
      { keys: ['Ctrl/Cmd', 'G'], description: '查找下一个' },
      { keys: ['Ctrl/Cmd', 'Shift', 'G'], description: '查找上一个' },
      { keys: ['Ctrl/Cmd', 'Home'], description: '跳到文档开头' },
      { keys: ['Ctrl/Cmd', 'End'], description: '跳到文档结尾' },
    ],
  },
  {
    title: '工具与视图',
    icon: <Search className="h-4 w-4" />,
    shortcuts: [
      { keys: ['Ctrl/Cmd', '/'], description: '切换预览' },
      { keys: ['Ctrl/Cmd', 'Shift', '/'], description: '显示快捷键' },
      { keys: ['Ctrl/Cmd', 'P'], description: '命令面板' },
      { keys: ['F11'], description: '全屏模式' },
      { keys: ['Esc'], description: '退出全屏/关闭对话框' },
    ],
  },
];

export function ShortcutPanel() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          快捷键
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            快捷键指南
          </DialogTitle>
          <DialogDescription>
            使用快捷键提升编辑效率
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="edit">编辑</TabsTrigger>
            <TabsTrigger value="format">格式</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-4">
            {shortcutGroups.map((group, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  {group.icon}
                  {group.title}
                </h3>
                <div className="grid gap-2">
                  {group.shortcuts.map((shortcut, sIndex) => (
                    <div
                      key={sIndex}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, kIndex) => (
                          <div key={kIndex} className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs px-2 py-1 bg-background"
                            >
                              {key}
                            </Badge>
                            {kIndex < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="edit" className="mt-4 space-y-4">
            {shortcutGroups
              .filter(g => g.title === '文件操作' || g.title === '编辑操作')
              .map((group, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    {group.icon}
                    {group.title}
                  </h3>
                  <div className="grid gap-2">
                    {group.shortcuts.map((shortcut, sIndex) => (
                      <div
                        key={sIndex}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, kIndex) => (
                            <div key={kIndex} className="flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className="font-mono text-xs px-2 py-1 bg-background"
                              >
                                {key}
                              </Badge>
                              {kIndex < shortcut.keys.length - 1 && (
                                <span className="text-muted-foreground text-xs">+</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </TabsContent>

          <TabsContent value="format" className="mt-4 space-y-4">
            {shortcutGroups
              .filter(g => g.title === '文本格式')
              .map((group, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    {group.icon}
                    {group.title}
                  </h3>
                  <div className="grid gap-2">
                    {group.shortcuts.map((shortcut, sIndex) => (
                      <div
                        key={sIndex}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, kIndex) => (
                            <div key={kIndex} className="flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className="font-mono text-xs px-2 py-1 bg-background"
                              >
                                {key}
                              </Badge>
                              {kIndex < shortcut.keys.length - 1 && (
                                <span className="text-muted-foreground text-xs">+</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            <Command className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">提示</p>
              <p className="text-xs text-muted-foreground">
                在 Mac 系统中使用 ⌘ (Command) 键，在 Windows/Linux 系统中使用 Ctrl 键
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
