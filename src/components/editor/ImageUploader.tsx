/**
 * 图片上传组件
 * 支持拖拽上传、粘贴上传、URL 导入
 */

'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  X, 
  Loader2,
  Clipboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageUploadResult {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

interface ImageUploaderProps {
  open: boolean;
  onClose: () => void;
  onInsert: (result: ImageUploadResult) => void;
  onUpload?: (file: File) => Promise<string>; // 自定义上传函数
  maxWidth?: number;
  maxHeight?: number;
  maxSizeMB?: number;
}

export function ImageUploader({
  open,
  onClose,
  onInsert,
  onUpload,
  maxWidth = 2048,
  maxHeight = 2048,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // 验证图片
  const validateImage = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width > maxWidth || img.height > maxHeight) {
          reject(new Error(`图片尺寸超出限制 (最大 ${maxWidth}×${maxHeight}px)`));
        } else {
          resolve({ width: img.width, height: img.height });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法加载图片'));
      };
      
      img.src = url;
    });
  }, [maxWidth, maxHeight]);
  
  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    
    // 检查文件大小
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`文件大小超出限制 (最大 ${maxSizeMB}MB)`);
      return;
    }
    
    setIsUploading(true);
    
    try {
      // 验证图片尺寸
      const dimensions = await validateImage(file);
      
      // 创建预览
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      
      let finalUrl: string;
      
      if (onUpload) {
        // 使用自定义上传函数
        finalUrl = await onUpload(file);
      } else {
        // 转换为 base64 (作为后备方案)
        finalUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      
      // 插入图片
      onInsert({
        url: finalUrl,
        alt: altText || file.name.replace(/\.[^/.]+$/, ''),
        width: dimensions.width,
        height: dimensions.height,
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  }, [maxSizeMB, validateImage, onUpload, altText, onInsert, onClose]);
  
  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);
  
  // 处理粘贴
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          await handleFileUpload(file);
          break;
        }
      }
    }
  }, [handleFileUpload]);
  
  // 处理 URL 导入
  const handleUrlImport = useCallback(async () => {
    if (!imageUrl.trim()) {
      setError('请输入图片 URL');
      return;
    }
    
    setError(null);
    setIsUploading(true);
    
    try {
      // 验证 URL 是否为有效图片
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('无法加载图片，请检查 URL'));
        img.src = imageUrl;
      });
      
      setPreviewUrl(imageUrl);
      
      onInsert({
        url: imageUrl,
        alt: altText || 'image',
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setIsUploading(false);
    }
  }, [imageUrl, altText, onInsert, onClose]);
  
  // 清理预览 URL
  const cleanupPreview = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);
  
  // 重置状态
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      cleanupPreview();
      setImageUrl('');
      setAltText('');
      setError(null);
      onClose();
    }
  }, [cleanupPreview, onClose]);
  
  // 监听粘贴事件
  React.useEffect(() => {
    if (open && activeTab === 'upload') {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
    return undefined;
  }, [open, activeTab, handlePaste]);
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>插入图片</DialogTitle>
          <DialogDescription>
            上传图片或通过 URL 导入
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              上传图片
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              URL 导入
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            {/* 拖拽区域 */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50",
                previewUrl && "border-primary"
              )}
            >
              {previewUrl ? (
                <div className="space-y-2">
                  <img 
                    src={previewUrl} 
                    alt="预览" 
                    className="max-h-48 mx-auto rounded-lg shadow-sm"
                  />
                  <p className="text-sm text-muted-foreground">点击更换图片</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">拖拽图片到此处</p>
                    <p className="text-sm text-muted-foreground">或点击选择文件</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    支持 JPG、PNG、GIF、WebP，最大 {maxSizeMB}MB
                  </p>
                </div>
              )}
            </div>
            
            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            
            {/* 提示信息 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clipboard className="h-4 w-4" />
              <span>也可以直接粘贴图片 (Ctrl+V)</span>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">图片 URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            
            {previewUrl && (
              <div className="border rounded-lg p-2">
                <img 
                  src={previewUrl} 
                  alt="预览" 
                  className="max-h-32 mx-auto rounded"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Alt 文本 */}
        <div className="space-y-2">
          <Label htmlFor="alt-text">替代文本 (可选)</Label>
          <Input
            id="alt-text"
            placeholder="描述图片内容"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <X className="h-4 w-4" />
            {error}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          {activeTab === 'url' && (
            <Button onClick={handleUrlImport} disabled={isUploading || !imageUrl.trim()}>
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              插入图片
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 简化版的图片按钮组件
interface ImageButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ImageButton({ onClick, disabled }: ImageButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title="插入图片"
    >
      <ImageIcon className="h-4 w-4" />
    </Button>
  );
}
