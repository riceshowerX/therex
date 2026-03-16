'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Quote,
  Table,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Hash,
  Code2,
  Subscript,
  Superscript,
  Highlighter,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckSquare,
  Eye,
  EyeOff,
 Fullscreen,
  Columns,
  Grid,
  ImageDown,
  FileImage,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface EditorToolbarProps {
  onInsertText: (text: string, cursorOffset?: number) => void;
  onWrapText: (before: string, after: string) => void;
  onInsertLine: (text: string) => void;
  onTogglePreview?: () => void;
  onToggleFullscreen?: () => void;
  onToggleSplitView?: () => void;
  previewMode?: 'edit' | 'preview' | 'split';
  isFullscreen?: boolean;
  imageUploadFn?: (file: File) => Promise<string>;
}

export function EditorToolbar({
  onInsertText,
  onWrapText,
  onInsertLine,
  onTogglePreview,
  onToggleFullscreen,
  onToggleSplitView,
  previewMode = 'edit',
  isFullscreen = false,
  imageUploadFn,
}: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 插入标题
  const insertHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    onInsertLine(prefix);
  };

  // 插入链接
  const insertLink = () => {
    if (linkUrl) {
      const text = linkText || linkUrl;
      onInsertText(`[${text}](${linkUrl})`);
      setLinkDialogOpen(false);
      setLinkText('');
      setLinkUrl('');
    } else {
      toast.error('请输入链接地址');
    }
  };

  // 插入图片
  const insertImage = () => {
    if (imageUrl) {
      const alt = imageAlt || '图片';
      onInsertText(`![${alt}](${imageUrl})`);
      setImageDialogOpen(false);
      setImageUrl('');
      setImageAlt('');
    } else {
      toast.error('请输入图片地址');
    }
  };

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (!imageUploadFn) {
      toast.error('未配置图片上传功能');
      return;
    }

    setIsUploading(true);
    try {
      const url = await imageUploadFn(file);
      const alt = file.name.replace(/\.[^/.]+$/, '');
      onInsertText(`![${alt}](${url})`);
      toast.success('图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error('图片上传失败');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 插入表格
  const insertTable = () => {
    const header = '| ' + Array(tableCols).fill('标题').join(' | ') + ' |';
    const separator = '| ' + Array(tableCols).fill('---').join(' | ') + ' |';
    const rows = Array(tableRows - 1)
      .fill(null)
      .map(() => '| ' + Array(tableCols).fill('内容').join(' | ') + ' |')
      .join('\n');

    onInsertText(`${header}\n${separator}\n${rows}`);
    setTableDialogOpen(false);
    setTableRows(3);
    setTableCols(3);
  };

  // 插入代码块
  const insertCodeBlock = (language: string) => {
    onInsertText(`\`\`\`${language}\n代码\n\`\`\``, -4);
  };

  // 插入任务列表项
  const insertTaskItem = (checked: boolean) => {
    const prefix = checked ? '- [x] ' : '- [ ] ';
    onInsertLine(prefix);
  };

  // 插入脚注
  const insertFootnote = () => {
    onInsertText('[^1]', 0);
    onInsertText('\n\n[^1]: 脚注内容', 0);
  };

  // 插入高亮文本
  const insertHighlight = () => {
    onWrapText('==', '==');
  };

  // 插入下标/上标
  const insertSubscript = () => {
    onWrapText('~', '~');
  };

  const insertSuperscript = () => {
    onWrapText('^', '^');
  };

  // 插入emoji（常用）
  const insertEmoji = (emoji: string) => {
    onInsertText(emoji);
  };

  // 插入分割线
  const insertHorizontalRule = () => {
    onInsertLine('---');
  };

  return (
    <>
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
        {/* 标题 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="标题">
              <Type className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => insertHeading(1)}>
              <Heading1 className="h-4 w-4 mr-2" /> 一级标题
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertHeading(2)}>
              <Heading2 className="h-4 w-4 mr-2" /> 二级标题
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertHeading(3)}>
              <Heading3 className="h-4 w-4 mr-2" /> 三级标题
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => insertHeading(4)}>
              <Hash className="h-4 w-4 mr-2" /> 四级标题
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertHeading(5)}>
              <Hash className="h-4 w-4 mr-2" /> 五级标题
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertHeading(6)}>
              <Hash className="h-4 w-4 mr-2" /> 六级标题
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        {/* 文本格式 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onWrapText('**', '**')}
          title="加粗 (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onWrapText('*', '*')}
          title="斜体 (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onWrapText('~~', '~~')}
          title="删除线"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onWrapText('`', '`')}
          title="行内代码"
        >
          <Code className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="更多格式">
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={insertHighlight}>
              <Highlighter className="h-4 w-4 mr-2" /> 高亮
            </DropdownMenuItem>
            <DropdownMenuItem onClick={insertSubscript}>
              <Subscript className="h-4 w-4 mr-2" /> 下标
            </DropdownMenuItem>
            <DropdownMenuItem onClick={insertSuperscript}>
              <Superscript className="h-4 w-4 mr-2" /> 上标
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={insertFootnote}>
              <Hash className="h-4 w-4 mr-2" /> 脚注
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        {/* 链接和图片 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLinkDialogOpen(true)}
          title="插入链接 (Ctrl+K)"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="插入图片">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setImageDialogOpen(true)}>
              <LinkIcon className="h-4 w-4 mr-2" /> 图片链接
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileImage className="h-4 w-4 mr-2" /> 上传图片
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="w-px h-6 bg-border mx-1" />

        {/* 列表 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onInsertLine('- ')}
          title="无序列表"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onInsertLine('1. ')}
          title="有序列表"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="任务列表">
              <CheckSquare className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => insertTaskItem(false)}>
              <CheckSquare className="h-4 w-4 mr-2" /> 未完成
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertTaskItem(true)}>
              <CheckSquare className="h-4 w-4 mr-2 text-green-500" /> 已完成
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        {/* 代码块 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="代码块">
              <Code2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => insertCodeBlock('')}>
              <Code className="h-4 w-4 mr-2" /> 普通代码
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => insertCodeBlock('javascript')}>
              <Code className="h-4 w-4 mr-2" /> JavaScript
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('typescript')}>
              <Code className="h-4 w-4 mr-2" /> TypeScript
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('python')}>
              <Code className="h-4 w-4 mr-2" /> Python
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('java')}>
              <Code className="h-4 w-4 mr-2" /> Java
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('go')}>
              <Code className="h-4 w-4 mr-2" /> Go
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('rust')}>
              <Code className="h-4 w-4 mr-2" /> Rust
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('sql')}>
              <Code className="h-4 w-4 mr-2" /> SQL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('bash')}>
              <Code className="h-4 w-4 mr-2" /> Bash
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('json')}>
              <Code className="h-4 w-4 mr-2" /> JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('html')}>
              <Code className="h-4 w-4 mr-2" /> HTML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('css')}>
              <Code className="h-4 w-4 mr-2" /> CSS
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => insertCodeBlock('mermaid')}>
              <Grid className="h-4 w-4 mr-2" /> Mermaid 图表
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCodeBlock('echarts')}>
              <Grid className="h-4 w-4 mr-2" /> ECharts 图表
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onInsertLine('> ')}
          title="引用"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTableDialogOpen(true)}
          title="表格"
        >
          <Table className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={insertHorizontalRule}
          title="分割线"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* 视图控制 */}
        {onToggleSplitView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSplitView}
            title="分屏视图"
          >
            <Columns className="h-4 w-4" />
          </Button>
        )}
        {onTogglePreview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePreview}
            title={previewMode === 'preview' ? '显示编辑器' : '显示预览'}
          >
            {previewMode === 'preview' ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
        {onToggleFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            title={isFullscreen ? '退出全屏' : '全屏编辑'}
          >
            <Fullscreen className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 链接对话框 */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>插入链接</DialogTitle>
            <DialogDescription>输入链接文本和地址</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-text">链接文本</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="可选，默认为链接地址"
              />
            </div>
            <div>
              <Label htmlFor="link-url">链接地址 *</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={insertLink}>插入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 图片对话框 */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>插入图片</DialogTitle>
            <DialogDescription>输入图片地址和替代文本</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-url">图片地址 *</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
              />
            </div>
            <div>
              <Label htmlFor="image-alt">替代文本</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="图片描述"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={insertImage}>插入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 表格对话框 */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>插入表格</DialogTitle>
            <DialogDescription>设置表格的行数和列数</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="table-rows">行数</Label>
              <Input
                id="table-rows"
                type="number"
                min={1}
                max={20}
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="table-cols">列数</Label>
              <Input
                id="table-cols"
                type="number"
                min={1}
                max={10}
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={insertTable}>插入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 上传状态 */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>上传中...</span>
          </div>
        </div>
      )}
    </>
  );
}
