/**
 * 文档分享功能
 * 支持公开分享、密码保护、有效期设置
 */

'use client';

import React, { useState, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Share2, 
  Copy, 
  Link as LinkIcon, 
  Lock, 
  Clock,
  Check,
  Eye,
  EyeOff,
  Users,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ShareSettings {
  id: string;
  documentId: string;
  documentTitle: string;
  isPublic: boolean;
  password?: string;
  expiresAt?: number;
  viewCount: number;
  createdAt: number;
  createdBy: string;
  allowDownload: boolean;
  allowCopy: boolean;
}

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  existingShare?: ShareSettings;
  onCreateShare: (settings: Omit<ShareSettings, 'id' | 'viewCount' | 'createdAt' | 'createdBy'>) => Promise<void>;
  onUpdateShare: (id: string, settings: Partial<ShareSettings>) => Promise<void>;
  onDeleteShare: (id: string) => Promise<void>;
}

export function ShareDialog({
  open,
  onClose,
  documentId,
  documentTitle,
  existingShare,
  onCreateShare,
  onUpdateShare,
  onDeleteShare,
}: ShareDialogProps) {
  const [isPublic, setIsPublic] = useState(existingShare?.isPublic ?? true);
  const [password, setPassword] = useState(existingShare?.password ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [expiration, setExpiration] = useState<string>(
    existingShare?.expiresAt 
      ? Math.max(1, Math.ceil((existingShare.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))).toString()
      : 'never'
  );
  const [allowDownload, setAllowDownload] = useState(existingShare?.allowDownload ?? true);
  const [allowCopy, setAllowCopy] = useState(existingShare?.allowCopy ?? true);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const shareUrl = existingShare 
    ? `${window.location.origin}/share/${existingShare.id}`
    : '';
  
  const handleCreateShare = useCallback(async () => {
    setIsLoading(true);
    try {
      const expiresAt = expiration === 'never' 
        ? undefined 
        : Date.now() + parseInt(expiration) * 24 * 60 * 60 * 1000;
      
      await onCreateShare({
        documentId,
        documentTitle,
        isPublic,
        password: password || undefined,
        expiresAt,
        allowDownload,
        allowCopy,
      });
    } finally {
      setIsLoading(false);
    }
  }, [documentId, documentTitle, isPublic, password, expiration, allowDownload, allowCopy, onCreateShare]);
  
  const handleUpdateShare = useCallback(async () => {
    if (!existingShare) return;
    
    setIsLoading(true);
    try {
      const expiresAt = expiration === 'never' 
        ? undefined 
        : Date.now() + parseInt(expiration) * 24 * 60 * 60 * 1000;
      
      await onUpdateShare(existingShare.id, {
        isPublic,
        password: password || undefined,
        expiresAt,
        allowDownload,
        allowCopy,
      });
    } finally {
      setIsLoading(false);
    }
  }, [existingShare, isPublic, password, expiration, allowDownload, allowCopy, onUpdateShare]);
  
  const handleDeleteShare = useCallback(async () => {
    if (!existingShare) return;
    
    setIsLoading(true);
    try {
      await onDeleteShare(existingShare.id);
    } finally {
      setIsLoading(false);
    }
  }, [existingShare, onDeleteShare]);
  
  const handleCopyLink = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);
  
  const expirationOptions = [
    { value: 'never', label: '永不过期' },
    { value: '1', label: '1 天后' },
    { value: '7', label: '7 天后' },
    { value: '30', label: '30 天后' },
    { value: '90', label: '90 天后' },
  ];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            分享文档
          </DialogTitle>
          <DialogDescription>
            创建分享链接，与他人共享你的文档
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 分享链接 */}
          {existingShare && (
            <div className="space-y-2">
              <Label>分享链接</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                已被查看 {existingShare.viewCount} 次
              </p>
            </div>
          )}
          
          {/* 公开/私密 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                公开分享
              </Label>
              <p className="text-xs text-muted-foreground">
                {isPublic ? '任何人都可以访问' : '需要密码才能访问'}
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          
          {/* 密码保护 */}
          {!isPublic && (
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                访问密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入访问密码"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* 有效期 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              有效期
            </Label>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger>
                <SelectValue placeholder="选择有效期" />
              </SelectTrigger>
              <SelectContent>
                {expirationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 权限设置 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              访客权限
            </Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">允许下载</span>
                <Switch
                  checked={allowDownload}
                  onCheckedChange={setAllowDownload}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">允许复制内容</span>
                <Switch
                  checked={allowCopy}
                  onCheckedChange={setAllowCopy}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          {existingShare && (
            <Button
              variant="destructive"
              onClick={handleDeleteShare}
              disabled={isLoading}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              取消分享
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={existingShare ? handleUpdateShare : handleCreateShare}
            disabled={isLoading || (!isPublic && !password)}
          >
            {existingShare ? '更新分享' : '创建分享'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 分享按钮组件
interface ShareButtonProps {
  onClick: () => void;
  hasShare?: boolean;
  disabled?: boolean;
}

export function ShareButton({ onClick, hasShare, disabled }: ShareButtonProps) {
  return (
    <Button
      variant={hasShare ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      {hasShare ? '已分享' : '分享'}
    </Button>
  );
}

export default ShareDialog;
