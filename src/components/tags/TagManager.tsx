/**
 * 标签管理系统
 * 支持标签创建、编辑、删除、颜色自定义
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tag as TagIcon, 
  Plus, 
  X, 
  Check, 
  Pencil,
  Trash2,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  count?: number;
  createdAt: number;
}

// 预设颜色
const PRESET_COLORS = [
  { name: '红色', value: '#ef4444' },
  { name: '橙色', value: '#f97316' },
  { name: '黄色', value: '#eab308' },
  { name: '绿色', value: '#22c55e' },
  { name: '青色', value: '#06b6d4' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '紫色', value: '#8b5cf6' },
  { name: '粉色', value: '#ec4899' },
  { name: '灰色', value: '#6b7280' },
];

interface TagManagerProps {
  availableTags: Tag[];
  selectedTags: string[];
  onTagSelect: (tagId: string) => void;
  onTagDeselect: (tagId: string) => void;
  onTagCreate: (tag: Omit<Tag, 'id' | 'createdAt'>) => Promise<Tag>;
  onTagUpdate: (tagId: string, updates: Partial<Tag>) => Promise<void>;
  onTagDelete: (tagId: string) => Promise<void>;
  maxTags?: number;
  allowCreate?: boolean;
}

export function TagManager({
  availableTags,
  selectedTags,
  onTagSelect,
  onTagDeselect,
  onTagCreate,
  onTagUpdate,
  onTagDelete,
  maxTags = 10,
  allowCreate = true,
}: TagManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0].value);
  const [newTagDescription, setNewTagDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // 已选标签
  const selectedTagObjects = useMemo(() => {
    return availableTags.filter(tag => selectedTags.includes(tag.id));
  }, [availableTags, selectedTags]);
  
  // 创建新标签
  const handleCreateTag = useCallback(async () => {
    if (!newTagName.trim()) return;
    
    setIsCreating(true);
    try {
      await onTagCreate({
        name: newTagName.trim(),
        color: newTagColor,
        description: newTagDescription.trim() || undefined,
      });
      setNewTagName('');
      setNewTagColor(PRESET_COLORS[0].value);
      setNewTagDescription('');
    } finally {
      setIsCreating(false);
    }
  }, [newTagName, newTagColor, newTagDescription, onTagCreate]);
  
  // 更新标签
  const handleUpdateTag = useCallback(async () => {
    if (!editTag) return;
    
    await onTagUpdate(editTag.id, {
      name: editTag.name,
      color: editTag.color,
      description: editTag.description,
    });
    setEditTag(null);
  }, [editTag, onTagUpdate]);
  
  // 删除标签
  const handleDeleteTag = useCallback(async (tagId: string) => {
    await onTagDelete(tagId);
  }, [onTagDelete]);
  
  // 切换标签选择
  const toggleTag = useCallback((tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagDeselect(tagId);
    } else if (selectedTags.length < maxTags) {
      onTagSelect(tagId);
    }
  }, [selectedTags, maxTags, onTagSelect, onTagDeselect]);
  
  return (
    <div className="space-y-3">
      {/* 已选标签显示 */}
      <div className="flex flex-wrap gap-2">
        {selectedTagObjects.map(tag => (
          <Badge
            key={tag.id}
            variant="outline"
            className="gap-1 pr-1"
            style={{ borderColor: tag.color }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => onTagDeselect(tag.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        {/* 添加标签按钮 */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              disabled={selectedTags.length >= maxTags}
            >
              <Plus className="h-3 w-3" />
              添加标签
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder="搜索标签..." />
              <CommandList>
                <CommandEmpty>
                  {allowCreate ? '按 Enter 创建新标签' : '未找到标签'}
                </CommandEmpty>
                <CommandGroup heading="可用标签">
                  {availableTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => toggleTag(tag.id)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span>{tag.name}</span>
                          {tag.count !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              ({tag.count})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditTag(tag);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
            
            {/* 创建新标签 */}
            {allowCreate && (
              <div className="border-t p-3 space-y-3">
                <div className="text-xs font-medium text-muted-foreground">创建新标签</div>
                <div className="flex gap-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="标签名称"
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTagName.trim()) {
                        handleCreateTag();
                      }
                    }}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        style={{ backgroundColor: newTagColor }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2">
                      <div className="grid grid-cols-3 gap-2">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color.value}
                            className="w-8 h-8 rounded-md border-2 transition-transform hover:scale-110"
                            style={{ 
                              backgroundColor: color.value,
                              borderColor: newTagColor === color.value ? 'currentColor' : 'transparent'
                            }}
                            onClick={() => setNewTagColor(color.value)}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!newTagName.trim() || isCreating}
                  onClick={handleCreateTag}
                >
                  {isCreating ? '创建中...' : '创建标签'}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
      
      {/* 标签编辑对话框 */}
      <Dialog open={!!editTag} onOpenChange={(open: boolean) => !open && setEditTag(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
            <DialogDescription>
              修改标签的名称、颜色和描述
            </DialogDescription>
          </DialogHeader>
          
          {editTag && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input
                  value={editTag.name}
                  onChange={(e) => setEditTag({ ...editTag, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>颜色</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color.value}
                      className={cn(
                        "w-8 h-8 rounded-md border-2 transition-transform hover:scale-110",
                        editTag.color === color.value && "ring-2 ring-offset-2"
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setEditTag({ ...editTag, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>描述 (可选)</Label>
                <Input
                  value={editTag.description || ''}
                  onChange={(e) => setEditTag({ ...editTag, description: e.target.value })}
                  placeholder="标签描述..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={() => {
                if (editTag) {
                  handleDeleteTag(editTag.id);
                  setEditTag(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
            <Button variant="outline" onClick={() => setEditTag(null)}>
              取消
            </Button>
            <Button onClick={handleUpdateTag}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {selectedTags.length > 0 && (
        <p className="text-xs text-muted-foreground">
          已选择 {selectedTags.length}/{maxTags} 个标签
        </p>
      )}
    </div>
  );
}

// 简化版标签选择器
interface TagSelectorProps {
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
  className?: string;
}

export function TagSelector({ tags, selectedTags, onTagToggle, className }: TagSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map(tag => {
        const isSelected = selectedTags.includes(tag.id);
        return (
          <Badge
            key={tag.id}
            variant={isSelected ? "default" : "outline"}
            className="cursor-pointer gap-1"
            style={isSelected ? { backgroundColor: tag.color } : { borderColor: tag.color }}
            onClick={() => onTagToggle(tag.id)}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
          </Badge>
        );
      })}
    </div>
  );
}

export default TagManager;
