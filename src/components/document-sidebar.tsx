/**
 * 文档侧边栏组件
 *
 * 显示文档列表和文件夹结构
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
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
  FolderTree,
  FilePlus,
  FolderPlus,
  FolderOpen,
  Star,
  StarOff,
  Copy,
  Trash2,
  MoreHorizontal,
  Folder,
  Layout,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Document, Folder as FolderType } from '@/types';

interface DocumentSidebarProps {
  documents: Document[];
  folders: FolderType[];
  currentDoc: Document | null;
  currentFolderId: string | null;
  expandedFolders: Set<string>;

  // 操作回调
  onCreateDocument: (title?: string, content?: string, folderId?: string | null) => Document;
  onSwitchDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onDuplicateDocument: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onMoveDocument: (docId: string, folderId: string | null) => void;

  onCreateFolder: (name: string, parentId?: string | null) => FolderType;
  onDeleteFolder: (id: string) => void;
  onSetCurrentFolderId: (id: string | null) => void;
  onToggleFolderExpand: (id: string) => void;

  // 其他
  showTemplates: boolean;
  onShowTemplates: (show: boolean) => void;
}

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
  onSetCurrentFolderId,
  onToggleFolderExpand,
  showTemplates,
  onShowTemplates,
}: DocumentSidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<'documents' | 'folders'>('documents');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  // 格式化时间
  const formatTime = (timestamp: number | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    return date.toLocaleDateString('zh-CN');
  };

  // 获取收藏的文档
  const favoriteDocuments = documents.filter(doc => doc.isFavorite);

  // 获取文件夹中的文档
  const getDocumentsInFolder = (folderId: string | null) => {
    return documents.filter(doc => doc.folderId === folderId);
  };

  // 处理创建文件夹
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('请输入文件夹名称');
      return;
    }

    onCreateFolder(newFolderName.trim(), currentFolderId);
    setNewFolderName('');
    setShowNewFolderDialog(false);
    toast.success('文件夹创建成功');
  };

  // 处理删除文档
  const handleDeleteDocument = () => {
    if (!docToDelete) return;
    onDeleteDocument(docToDelete);
    setShowDeleteDialog(false);
    setDocToDelete(null);
    toast.success('文档已删除');
  };

  return (
    <>
      <div className="w-64 border-r bg-card flex flex-col print:hidden">
        {/* 标签页 */}
        <div className="p-3 border-b">
          <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as 'documents' | 'folders')}>
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
                onClick={() => onShowTemplates(true)}
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
                {favoriteDocuments.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                      <Star className="h-3 w-3" />
                      收藏
                    </div>
                    {favoriteDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className={`group flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                          currentDoc?.id === doc.id
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => onSwitchDocument(doc.id)}
                      >
                        <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium truncate">{doc.title}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(doc.updatedAt)} · {doc.wordCount} 词
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
                            <DropdownMenuItem onClick={() => onToggleFavorite(doc.id)}>
                              <StarOff className="h-4 w-4 mr-2" /> 取消收藏
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicateDocument(doc.id)}>
                              <Copy className="h-4 w-4 mr-2" /> 复制
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Folder className="h-4 w-4 mr-2" /> 移动到文件夹
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => onMoveDocument(doc.id, null)}>
                                  <FileText className="h-4 w-4 mr-2" /> 根目录
                                </DropdownMenuItem>
                                {folders.map((folder) => (
                                  <DropdownMenuItem
                                    key={folder.id}
                                    onClick={() => onMoveDocument(doc.id, folder.id)}
                                  >
                                    <FolderOpen className="h-4 w-4 mr-2" /> {folder.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDocToDelete(doc.id);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> 删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}

                {/* 所有文档（排除已收藏的） */}
                {documents.filter(doc => !doc.isFavorite).map((doc) => (
                  <div
                    key={doc.id}
                    className={`group flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                      currentDoc?.id === doc.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => onSwitchDocument(doc.id)}
                  >
                    <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium truncate">{doc.title}</span>
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
                        <DropdownMenuItem onClick={() => onToggleFavorite(doc.id)}>
                          <Star className="h-4 w-4 mr-2" /> 收藏
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicateDocument(doc.id)}>
                          <Copy className="h-4 w-4 mr-2" /> 复制
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Folder className="h-4 w-4 mr-2" /> 移动到文件夹
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => onMoveDocument(doc.id, null)}>
                              <FileText className="h-4 w-4 mr-2" /> 根目录
                            </DropdownMenuItem>
                            {folders.map((folder) => (
                              <DropdownMenuItem
                                key={folder.id}
                                onClick={() => onMoveDocument(doc.id, folder.id)}
                              >
                                <FolderOpen className="h-4 w-4 mr-2" /> {folder.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setDocToDelete(doc.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> 删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {/* 文件夹视图 */}
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
                {/* 根目录 */}
                <div
                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                    currentFolderId === null
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => onSetCurrentFolderId(null)}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">所有文档</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {documents.length}
                  </Badge>
                </div>

                {/* 文件夹列表 */}
                {folders.map((folder) => {
                  const docsInFolder = getDocumentsInFolder(folder.id);
                  return (
                    <div key={folder.id}>
                      <div
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                          currentFolderId === folder.id
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => {
                          onSetCurrentFolderId(folder.id);
                          onToggleFolderExpand(folder.id);
                        }}
                      >
                        <FolderOpen className="h-4 w-4" style={{ color: folder.color }} />
                        <span className="text-sm flex-1 truncate">{folder.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {docsInFolder.length}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onCreateDocument(undefined, undefined, folder.id)}>
                              <FilePlus className="h-4 w-4 mr-2" /> 新建文档
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDeleteFolder(folder.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> 删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* 展开显示文件夹内的文档 */}
                      {expandedFolders.has(folder.id) && docsInFolder.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {docsInFolder.map((doc) => (
                            <div
                              key={doc.id}
                              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                currentDoc?.id === doc.id
                                  ? 'bg-accent text-accent-foreground'
                                  : 'hover:bg-accent/50'
                              }`}
                              onClick={() => onSwitchDocument(doc.id)}
                            >
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs truncate">{doc.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        {/* 底部统计 */}
        <div className="p-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{documents.length} 个文档</span>
            <span>
              {documents.reduce((sum, doc) => sum + doc.wordCount, 0).toLocaleString()} 词
            </span>
          </div>
        </div>
      </div>

      {/* 新建文件夹对话框 */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="文件夹名称"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
            }}
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
            确定要删除这个文档吗？此操作无法撤销。
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
