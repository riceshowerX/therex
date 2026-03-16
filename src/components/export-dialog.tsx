'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Download,
  FileText,
  FileCode,
  FileJson,
  File,
  FileType,
  FileImage,
  Loader2,
} from 'lucide-react';
import {
  exportAsMarkdown,
  exportAsHtml,
  exportAsPdf,
  exportAsWord,
  exportAsText,
  exportAsJson,
  type ExportOptions,
} from '@/lib/export-utils';

interface ExportDialogProps {
  content: string;
  defaultTitle?: string;
  trigger?: React.ReactNode;
}

type ExportFormat = 'md' | 'html' | 'pdf' | 'word' | 'txt' | 'json';

interface FormatConfig {
  label: string;
  description: string;
  icon: React.ReactNode;
  extension: string;
}

const formatConfigs: Record<ExportFormat, FormatConfig> = {
  md: {
    label: 'Markdown',
    description: 'Markdown 源文件，保留所有格式',
    icon: <FileText className="h-5 w-5" />,
    extension: '.md',
  },
  html: {
    label: 'HTML',
    description: 'HTML 文件，可在浏览器中查看',
    icon: <FileCode className="h-5 w-5" />,
    extension: '.html',
  },
  pdf: {
    label: 'PDF',
    description: 'PDF 文档，适合打印和分享',
    icon: <File className="h-5 w-5" />,
    extension: '.pdf',
  },
  word: {
    label: 'Word',
    description: 'Word 文档，可在 Microsoft Word 中编辑',
    icon: <FileType className="h-5 w-5" />,
    extension: '.doc',
  },
  txt: {
    label: '纯文本',
    description: '纯文本文件，移除所有格式',
    icon: <FileText className="h-5 w-5" />,
    extension: '.txt',
  },
  json: {
    label: 'JSON',
    description: 'JSON 格式，包含元数据',
    icon: <FileJson className="h-5 w-5" />,
    extension: '.json',
  },
};

export function ExportDialog({ content, defaultTitle = 'document', trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('md');
  const [filename, setFilename] = useState(defaultTitle);
  const [title, setTitle] = useState(defaultTitle);
  const [author, setAuthor] = useState('');
  const [includeToc, setIncludeToc] = useState(false);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const handleExport = async () => {
    if (!filename.trim()) {
      toast.error('请输入文件名');
      return;
    }

    setIsExporting(true);

    try {
      const options: ExportOptions = {
        filename: filename.trim(),
        title: title.trim() || undefined,
        author: author.trim() || undefined,
        includeToc,
        pageSize,
        orientation,
        includeStyles: true,
      };

      switch (selectedFormat) {
        case 'md':
          exportAsMarkdown(content, options);
          break;
        case 'html':
          await exportAsHtml(content, options);
          break;
        case 'pdf':
          await exportAsPdf(content, options);
          break;
        case 'word':
          await exportAsWord(content, options);
          break;
        case 'txt':
          exportAsText(content, options);
          break;
        case 'json':
          exportAsJson(content, options);
          break;
      }

      toast.success('导出成功');
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(error instanceof Error ? error.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const currentConfig = formatConfigs[selectedFormat];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            导出
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            导出文档
          </DialogTitle>
          <DialogDescription>
            选择导出格式并配置导出选项
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 格式选择 */}
          <div className="space-y-3">
            <Label>导出格式</Label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(formatConfigs) as [ExportFormat, FormatConfig][]).map(
                ([format, config]) => (
                  <Card
                    key={format}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedFormat === format ? 'border-primary ring-1 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedFormat(format)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-primary">{config.icon}</div>
                        <div>
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {config.extension}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentConfig.description}
            </p>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filename">文件名 *</Label>
              <div className="flex">
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="输入文件名"
                  className="rounded-r-none"
                />
                <div className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                  {currentConfig.extension}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">文档标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="可选"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">作者</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="可选"
            />
          </div>

          {/* 高级选项（仅 PDF 和 Word） */}
          {(selectedFormat === 'pdf' || selectedFormat === 'word' || selectedFormat === 'html') && (
            <div className="space-y-4">
              <Label>高级选项</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageSize">页面大小</Label>
                  <Select
                    value={pageSize}
                    onValueChange={(value: 'A4' | 'Letter') => setPageSize(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orientation">页面方向</Label>
                  <Select
                    value={orientation}
                    onValueChange={(value: 'portrait' | 'landscape') => setOrientation(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">纵向</SelectItem>
                      <SelectItem value="landscape">横向</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedFormat === 'html' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeToc"
                    checked={includeToc}
                    onCheckedChange={(checked) => setIncludeToc(checked as boolean)}
                  />
                  <Label htmlFor="includeToc" className="text-sm font-normal cursor-pointer">
                    包含目录（自动生成）
                  </Label>
                </div>
              )}
            </div>
          )}

          {/* JSON 选项 */}
          {selectedFormat === 'json' && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                JSON 导出将包含文档内容、标题、作者、导出时间、字数统计等元数据。
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                导出
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
