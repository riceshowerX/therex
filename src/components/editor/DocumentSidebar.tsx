/**
 * 文档侧边栏组件
 * 负责文档列表和文件夹的显示与操作
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  Folder,
  FolderOpen,
  FolderTree,
  FolderPlus,
  Star,
  StarOff,
  Copy,
  Trash2,
  MoreHorizontal,
  FilePlus,
  Layout,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { Document, Folder as FolderType } from '@/types';

// ==================== 类型定义 ====================

export interface DocumentSidebarProps {
  // 数据
  documents: Document[];
  folders: FolderType[];
  currentDoc: Document | null;
  currentFolderId: string | null;
  expandedFolders: Set<string>;
  
  // 回调
  onCreateDocument: (templateId?: string, folderId?: string | null) => void;
  onSwitchDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onDuplicateDocument: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onMoveDocument: (docId: string, folderId: string | null) => void;
  
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onToggleFolderExpand: (id: string) => void;
  
  onShowTemplates: () => void;
}

// ==================== 辅助函数 ====================

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

  return date.toLocaleDateString('zh-CN');
}

// ==================== 子组件 ====================

interface DocumentItemProps {
  document: Document;
  isActive: boolean;
  isFavorite?: boolean;
  folders: FolderType[];
  onSwitch: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onMove: (folderId: string | null) => void;
}

function DocumentItem({
  document: doc,
  isActive,
  isFavorite = false,
  folders,
  onSwitch,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onMove,
}: DocumentItemProps) {
  return (
    <div
      className={`group flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50'
      }`}
      onClick={onSwitch}
    >
      <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium truncate">{doc.title}</span>
          {isFavorite && (
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTime(doc.updatedAt)}</span>
          <span>·</span>
          <span>{doc.wordCount} 词</span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onToggleFavorite}>
            {isFavorite ? (
              <>
                <StarOff className="h-4 w-4 mr-2" /> 取消收藏
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" /> 收藏
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" /> 复制
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Folder className="h-4 w-4 mr-2" /> 移动到文件夹
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onMove(null)}>
                <FileText className="h-4 w-4 mr-2" /> 根目录
              </DropdownMenuItem>
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => onMove(folder.id)}
                >
                  <FolderOpen className="h-4 w-4 mr-2" /> {folder.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> 删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface FolderItemProps {
  folder: FolderType;
  isExpanded: boolean;
  documents: Document[];
  currentDocId: string | null;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onCreateDocument: () => void;
  onSelectDocument: (id: string) => void;
}

function FolderItem({
  folder,
  isExpanded,
  documents,
  currentDocId,
  onToggle,
  onDelete,
  onRename,
  onCreateDocument,
  onSelectDocument,
}: FolderItemProps) {
  const folderDocs = documents.filter((doc) => doc.folderId === folder.id);

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 cursor-pointer group"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="text-sm font-medium flex-1 truncate">{folder.name}</span>
        <Badge variant="secondary" className="text-xs">
          {folderDocs.length}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCreateDocument}>
              <FilePlus className="h-4 w-4 mr-2" /> 新建文档
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> 删除文件夹
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isExpanded && folderDocs.length > 0 && (
        <div className="ml-4 space-y-1">
          {folderDocs.map((doc) => (
            <div
              key={doc.id}
              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                currentDocId === doc.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => onSelectDocument(doc.id)}
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm truncate">{doc.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

export function DocumentSidebar({
  documents,
  folders,
  currentDoc,
  currentFolderId,
  expandedFolders,
  onCreateDocument,
  onSwitchDocument,
  onDeleteDocument,
  onDuplicateDocument,
  onToggleFavorite,
  onMoveDocument,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onToggleFolderExpand,
  onShowTemplates,
}: DocumentSidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<'documents' | 'folders'>('documents');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // 分组文档
  const { favoriteDocs, regularDocs, rootDocs } = useMemo(() => {
    const favoriteDocs = documents.filter((doc) => doc.isFavorite);
    const regularDocs = documents.filter((doc) => !doc.isFavorite);
    const rootDocs = documents.filter((doc) => !doc.folderId && !doc.isFavorite);
    return { favoriteDocs, regularDocs, rootDocs };
  }, [documents]);

  // 创建文件夹
  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderDialog(false);
  }, [newFolderName, onCreateFolder]);

  // 确认删除文档
  const handleConfirmDeleteDoc = useCallback(() => {
    if (docToDelete) {
      onDeleteDocument(docToDelete);
      setDocToDelete(null);
      setShowDeleteDialog(false);
    }
  }, [docToDelete, onDeleteDocument]);

  // 确认删除文件夹
  const handleConfirmDeleteFolder = useCallback(() => {
    if (folderToDelete) {
      onDeleteFolder(folderToDelete);
      setFolderToDelete(null);
      setShowDeleteDialog(false);
    }
  }, [folderToDelete, onDeleteFolder]);

  return (
    <div className="w-64 border-r bg-card flex flex-col">
      {/* 标签切换 */}
      <div className="p-3 border-b flex items-center justify-between">
        <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as typeof sidebarTab)} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="documents" className="flex-1 text-xs">
              <FileText className="h-3 w-3 mr-1" />
              文档
            </TabsTrigger>
            <TabsTrigger value="folders" className="flex-1 text-xs">
              <FolderTree className="h-3 w-3 mr-1" />
              文件夹
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 文档列表 */}
      {sidebarTab === 'documents' && (
        <>
          <div className="p-2 border-b flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              onClick={onShowTemplates}
            >
              <Layout className="h-4 w-4 mr-2" />
              从模板新建
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onCreateDocument()}
              title="新建文档"
            >
              <FilePlus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {/* 收藏的文档 */}
              {favoriteDocs.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Star className="h-3 w-3" />
                    收藏
                  </div>
                  {favoriteDocs.map((doc) => (
                    <DocumentItem
                      key={doc.id}
                      document={doc}
                      isActive={currentDoc?.id === doc.id}
                      isFavorite
                      folders={folders}
                      onSwitch={() => onSwitchDocument(doc.id)}
                      onDelete={() => {
                        setDocToDelete(doc.id);
                        setShowDeleteDialog(true);
                      }}
                      onDuplicate={() => onDuplicateDocument(doc.id)}
                      onToggleFavorite={() => onToggleFavorite(doc.id)}
                      onMove={(folderId) => onMoveDocument(doc.id, folderId)}
                    />
                  ))}
                </div>
              )}

              {/* 根目录文档 */}
              {rootDocs.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    文档
                  </div>
                  {rootDocs.map((doc) => (
                    <DocumentItem
                      key={doc.id}
                      document={doc}
                      isActive={currentDoc?.id === doc.id}
                      folders={folders}
                      onSwitch={() => onSwitchDocument(doc.id)}
                      onDelete={() => {
                        setDocToDelete(doc.id);
                        setShowDeleteDialog(true);
                      }}
                      onDuplicate={() => onDuplicateDocument(doc.id)}
                      onToggleFavorite={() => onToggleFavorite(doc.id)}
                      onMove={(folderId) => onMoveDocument(doc.id, folderId)}
                    />
                  ))}
                </div>
              )}

              {/* 文件夹中的文档 */}
              {folders.map((folder) => {
                const folderDocs = regularDocs.filter((doc) => doc.folderId === folder.id);
                if (folderDocs.length === 0) return null;

                return (
                  <div key={folder.id} className="mb-3">
                    <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                      <Folder className="h-3 w-3" />
                      {folder.name}
                    </div>
                    {folderDocs.map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        document={doc}
                        isActive={currentDoc?.id === doc.id}
                        folders={folders}
                        onSwitch={() => onSwitchDocument(doc.id)}
                        onDelete={() => {
                          setDocToDelete(doc.id);
                          setShowDeleteDialog(true);
                        }}
                        onDuplicate={() => onDuplicateDocument(doc.id)}
                        onToggleFavorite={() => onToggleFavorite(doc.id)}
                        onMove={(folderId) => onMoveDocument(doc.id, folderId)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </>
      )}

      {/* 文件夹列表 */}
      {sidebarTab === 'folders' && (
        <>
          <div className="p-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowNewFolderDialog(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              新建文件夹
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isExpanded={expandedFolders.has(folder.id)}
                  documents={documents}
                  currentDocId={currentDoc?.id || null}
                  onToggle={() => onToggleFolderExpand(folder.id)}
                  onDelete={() => {
                    setFolderToDelete(folder.id);
                    setShowDeleteDialog(true);
                  }}
                  onRename={(name) => onRenameFolder(folder.id, name)}
                  onCreateDocument={() => onCreateDocument(undefined, folder.id)}
                  onSelectDocument={onSwitchDocument}
                />
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {/* 新建文件夹对话框 */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewFolderDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFolder}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {docToDelete
              ? '确定要删除这个文档吗？此操作无法撤销。'
              : '确定要删除这个文件夹吗？文件夹内的文档将移到根目录。'}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={docToDelete ? handleConfirmDeleteDoc : handleConfirmDeleteFolder}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
