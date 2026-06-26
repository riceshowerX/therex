/**
 * 文档导出扩展
 * 支持多种格式导出：DOCX、EPUB、PDF、图片等
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Download, 
  FileText, 
  FileImage, 
  BookOpen, 
  FileCode,
  Loader2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExportFormat = 'markdown' | 'html' | 'txt' | 'docx' | 'epub' | 'pdf' | 'png' | 'jpg' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  includeMetadata: boolean;
  includeTableOfContents: boolean;
  pageSize?: 'A4' | 'A5' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  fontSize?: number;
  lineSpacing?: number;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  imageQuality?: 'low' | 'medium' | 'high';
  imageScale?: number;
}

interface DocumentExporterProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onExport: (options: ExportOptions) => Promise<void>;
}

export function DocumentExporter({
  open,
  onClose,
  title,
  content,
  onExport,
}: DocumentExporterProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [filename, setFilename] = useState(title || 'document');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState(false);
  const [pageSize, setPageSize] = useState<'A4' | 'A5' | 'Letter'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fontSize, setFontSize] = useState(12);
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [imageScale, setImageScale] = useState(2);
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // 格式配置
  const formatConfig: Record<ExportFormat, { icon: React.ReactNode; label: string; extensions: string[] }> = {
    markdown: { icon: <FileText className="h-4 w-4" />, label: 'Markdown', extensions: ['.md'] },
    html: { icon: <FileCode className="h-4 w-4" />, label: 'HTML', extensions: ['.html'] },
    txt: { icon: <FileText className="h-4 w-4" />, label: '纯文本', extensions: ['.txt'] },
    docx: { icon: <FileText className="h-4 w-4" />, label: 'Word 文档', extensions: ['.docx'] },
    epub: { icon: <BookOpen className="h-4 w-4" />, label: 'EPUB 电子书', extensions: ['.epub'] },
    pdf: { icon: <FileText className="h-4 w-4" />, label: 'PDF', extensions: ['.pdf'] },
    png: { icon: <FileImage className="h-4 w-4" />, label: 'PNG 图片', extensions: ['.png'] },
    jpg: { icon: <FileImage className="h-4 w-4" />, label: 'JPG 图片', extensions: ['.jpg'] },
    json: { icon: <FileCode className="h-4 w-4" />, label: 'JSON', extensions: ['.json'] },
  };
  
  // 获取文件扩展名
  const getExtension = useCallback(() => {
    return formatConfig[format].extensions[0];
  }, [format]);
  
  // 执行导出
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setSuccess(false);
    
    try {
      const options: ExportOptions = {
        format,
        filename: filename + getExtension(),
        includeMetadata,
        includeTableOfContents,
        pageSize: ['pdf', 'docx'].includes(format) ? pageSize : undefined,
        orientation: ['pdf', 'docx'].includes(format) ? orientation : undefined,
        fontSize: ['pdf', 'docx', 'epub'].includes(format) ? fontSize : undefined,
        imageQuality: ['png', 'jpg'].includes(format) ? imageQuality : undefined,
        imageScale: ['png', 'jpg'].includes(format) ? imageScale : undefined,
      };
      
      await onExport(options);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [format, filename, getExtension, includeMetadata, includeTableOfContents, pageSize, orientation, fontSize, imageQuality, imageScale, onExport, onClose]);
  
  // 自动更新文件名
  React.useEffect(() => {
    setFilename(title || 'document');
  }, [title]);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            导出文档
          </DialogTitle>
          <DialogDescription>
            选择导出格式和选项
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 格式选择 */}
          <div className="space-y-2">
            <Label>导出格式</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(formatConfig) as ExportFormat[]).map((f) => {
                const config = formatConfig[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors",
                      format === f 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {config.icon}
                    <span className="text-xs">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* 文件名 */}
          <div className="space-y-2">
            <Label htmlFor="filename">文件名</Label>
            <div className="flex gap-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="flex-1"
              />
              <Input
                value={getExtension()}
                readOnly
                className="w-20 bg-muted"
              />
            </div>
          </div>
          
          {/* 通用选项 */}
          <div className="space-y-3">
            <Label>导出选项</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">包含元数据</span>
                <Switch
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
              </div>
              {['epub', 'pdf', 'docx'].includes(format) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">生成目录</span>
                  <Switch
                    checked={includeTableOfContents}
                    onCheckedChange={setIncludeTableOfContents}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* PDF/DOCX 特有选项 */}
          {['pdf', 'docx'].includes(format) && (
            <div className="space-y-3">
              <Label>页面设置</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">纸张大小</span>
                  <Select value={pageSize} onValueChange={(v) => setPageSize(v as typeof pageSize)}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A5">A5</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">方向</span>
                  <Select value={orientation} onValueChange={(v) => setOrientation(v as typeof orientation)}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">纵向</SelectItem>
                      <SelectItem value="landscape">横向</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          {/* 字体大小 */}
          {['pdf', 'docx', 'epub'].includes(format) && (
            <div className="space-y-2">
              <Label>字体大小: {fontSize}pt</Label>
              <input
                type="range"
                min="8"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          
          {/* 图片导出选项 */}
          {['png', 'jpg'].includes(format) && (
            <div className="space-y-3">
              <Label>图片设置</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">质量</span>
                  <Select value={imageQuality} onValueChange={(v) => setImageQuality(v as typeof imageQuality)}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">缩放: {imageScale}x</span>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.5"
                    value={imageScale}
                    onChange={(e) => setImageScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || !filename.trim()}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                导出中...
              </>
            ) : success ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-500" />
                导出成功
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

// 简单导出按钮
interface ExportButtonProps {
  onClick: () => void;
  format?: ExportFormat;
  disabled?: boolean;
}

export function ExportButton({ onClick, format, disabled }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {format ? format.toUpperCase() : '导出'}
    </Button>
  );
}

// 导出工具函数
export const exportUtils = {
  // Markdown 转 HTML
  markdownToHtml(markdown: string): string {
    // 简单转换，实际应用中应使用 marked 或类似库
    return markdown
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  },
  
  // 下载文件
  downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
    const blob = content instanceof Blob 
      ? content 
      : new Blob([content], { type: mimeType || 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
  
  // 复制到剪贴板
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  },
};

export default DocumentExporter;
