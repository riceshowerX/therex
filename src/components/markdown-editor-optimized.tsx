/**
 * 优化的 Markdown 编辑器组件
 * 使用 useEditorCore Hook 统一管理状态
 */

'use client';

import React, { memo, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Eye,
  SplitSquareHorizontal,
  Maximize2,
  Moon,
  Sun,
  Trash2,
  Save,
  FolderOpen,
  Copy,
  Star,
  StarOff,
  FilePlus,
  Search,
  Undo,
  Redo,
  Settings,
  ChevronLeft,
  Clock,
  Sparkles,
  MoreHorizontal,
  Folder,
  Layout,
  Wand2,
  ListTree,
  X,
  Check,
  Loader2,
  FolderPlus,
  FolderTree,
  Minus,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { useEditorCore } from '@/hooks';
import { templates, templateCategories, getTemplatesByCategory, getTemplateById } from '@/lib/templates';
import { MarkdownPreview } from '@/components/markdown-preview';
import { DocumentStats } from '@/components/document-stats';
import { AutoSaveStatus } from '@/components/auto-save-status';
import { EditorToolbar } from '@/components/editor-toolbar';
import { SearchReplace, TableOfContents } from '@/components/editor';

// 动态导入编辑器组件
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        加载编辑器...
      </div>
    ) 
  }
);

// ==================== 子组件（使用 memo 优化）====================

/**
 * 侧边栏头部组件
 */
const SidebarHeader = memo(function SidebarHeader({
  sidebarTab,
  setSidebarTab,
  onNewDocument,
  onShowTemplates,
}: {
  sidebarTab: 'documents' | 'folders';
  setSidebarTab: (tab: 'documents' | 'folders') => void;
  onNewDocument: () => void;
  onShowTemplates: () => void;
}) {
  return (
    <div className="p-3 border-b">
      <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as 'documents' | 'folders')} className="w-full">
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
      
      {sidebarTab === 'documents' && (
        <div className="flex items-center gap-1 mt-2">
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
            onClick={onNewDocument}
            title="新建文档"
          >
            <FilePlus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});

/**
 * 文档列表项组件
 */
const DocumentListItem = memo(function DocumentListItem({
  doc,
  isActive,
  onSelect,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onMove,
  folders,
}: {
  doc: any;
  isActive: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (folderId: string | null) => void;
  folders: any[];
}) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div
      className={`group flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50'
      }`}
      onClick={onSelect}
    >
      <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium truncate">{doc.title}</span>
          {doc.isFavorite && (
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTime(doc.updatedAt)} · {doc.wordCount || 0} 词
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
            {doc.isFavorite ? (
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
          <DropdownMenuItem 
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" /> 删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

/**
 * 工具栏组件
 */
const EditorToolbarSection = memo(function EditorToolbarSection({
  mode,
  onModeChange,
  fontSize,
  onFontSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveVersion,
  onToggleSearch,
  onOpenAI,
  onExport,
  onImport,
  theme,
  onThemeChange,
}: {
  mode: 'edit' | 'preview' | 'live';
  onModeChange: (mode: 'edit' | 'preview' | 'live') => void;
  fontSize: number;
  onFontSizeChange: (delta: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveVersion: () => void;
  onToggleSearch: () => void;
  onOpenAI: () => void;
  onExport: () => void;
  onImport: () => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b bg-card">
      {/* 模式切换 */}
      <div className="flex items-center border-r pr-2 mr-2">
        <Button
          variant={mode === 'edit' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('edit')}
          title="编辑模式"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button
          variant={mode === 'live' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('live')}
          title="实时预览"
        >
          <SplitSquareHorizontal className="h-4 w-4" />
        </Button>
        <Button
          variant={mode === 'preview' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('preview')}
          title="预览模式"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* 撤销/重做 */}
      <Button
        variant="ghost"
        size="sm"
        disabled={!canUndo}
        onClick={onUndo}
        title="撤销 (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canRedo}
        onClick={onRedo}
        title="重做 (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </Button>

      {/* 字体大小 */}
      <div className="flex items-center border-l pl-2 ml-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFontSizeChange(-1)}
          disabled={fontSize <= 10}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs w-8 text-center">{fontSize}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFontSizeChange(1)}
          disabled={fontSize >= 24}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center border-l pl-2 ml-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSaveVersion}
          title="保存版本"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSearch}
          title="查找替换 (Ctrl+F)"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenAI}
          title="AI 助手 (Ctrl+K)"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      {/* 导入/导出 */}
      <div className="flex items-center border-l pl-2 ml-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onImport}
          title="导入文件"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          title="导出文件"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* 主题切换 */}
      <div className="flex items-center border-l pl-2 ml-2 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          title="切换主题"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
});

// ==================== 主组件 ====================

export default function MarkdownEditorOptimized() {
  const { theme, setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 使用核心 Hook
  const editor = useEditorCore({
    autoSaveDelay: 500,
    autoSaveVersionInterval: 5 * 60 * 1000,
    maxHistorySize: 50,
  });
  
  // 额外的 UI 状态
  const [showNewFolderDialog, setShowNewFolderDialog] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [docToDelete, setDocToDelete] = React.useState<string | null>(null);
  
  // 文档操作
  const handleNewDocument = useCallback(() => {
    editor.createDocument();
  }, [editor]);
  
  const handleShowTemplates = useCallback(() => {
    editor.toggleTemplates();
  }, [editor]);
  
  const handleExport = useCallback(() => {
    const blob = new Blob([editor.content], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${editor.title || 'untitled'}.md`);
    toast.success('已导出文件');
  }, [editor.content, editor.title]);
  
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt,.markdown';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        editor.createDocument();
        editor.updateContent(text);
        editor.updateTitle(file.name.replace(/\.(md|txt|markdown)$/, ''));
        toast.success('文件导入成功');
      };
      reader.readAsText(file);
    };
    input.click();
  }, [editor]);
  
  const handleFontSizeChange = useCallback((delta: number) => {
    const newSize = editor.editorMode.fontSize + delta;
    if (newSize >= 10 && newSize <= 24) {
      editor.setFontSize(newSize);
    }
  }, [editor]);
  
  // 删除确认
  const confirmDelete = useCallback(() => {
    if (docToDelete) {
      editor.deleteDocument(docToDelete);
      setShowDeleteDialog(false);
      setDocToDelete(null);
    }
  }, [docToDelete, editor]);
  
  // 创建文件夹
  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) {
      toast.error('请输入文件夹名称');
      return;
    }
    editor.createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderDialog(false);
  }, [newFolderName, editor]);
  
  // 收藏文档
  const favoriteDocs = useMemo(() => 
    editor.documents.filter(doc => doc.isFavorite),
    [editor.documents]
  );
  
  const regularDocs = useMemo(() => 
    editor.documents.filter(doc => !doc.isFavorite),
    [editor.documents]
  );
  
  // 如果还没准备好，显示加载状态
  if (!editor.isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen flex bg-background print:bg-white">
      {/* 侧边栏 */}
      {editor.uiState.showSidebar && (
        <div className="w-64 border-r bg-card flex flex-col print:hidden">
          <SidebarHeader
            sidebarTab={editor.uiState.sidebarTab}
            setSidebarTab={editor.setSidebarTab}
            onNewDocument={handleNewDocument}
            onShowTemplates={handleShowTemplates}
          />
          
          <ScrollArea className="flex-1">
            {editor.uiState.sidebarTab === 'documents' ? (
              <div className="p-2 space-y-1">
                {/* 收藏的文档 */}
                {favoriteDocs.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                      <Star className="h-3 w-3" />
                      收藏
                    </div>
                    {favoriteDocs.map((doc) => (
                      <DocumentListItem
                        key={doc.id}
                        doc={doc}
                        isActive={editor.currentDoc?.id === doc.id}
                        onSelect={() => editor.switchDocument(doc.id)}
                        onToggleFavorite={() => editor.toggleFavorite(doc.id)}
                        onDuplicate={() => editor.duplicateDocument(doc.id)}
                        onDelete={() => {
                          setDocToDelete(doc.id);
                          setShowDeleteDialog(true);
                        }}
                        onMove={(folderId) => {
                          // TODO: 实现 moveDocumentToFolder
                          console.log('Move to folder:', folderId);
                        }}
                        folders={editor.folders}
                      />
                    ))}
                  </div>
                )}
                
                {/* 普通文档 */}
                {regularDocs.map((doc) => (
                  <DocumentListItem
                    key={doc.id}
                    doc={doc}
                    isActive={editor.currentDoc?.id === doc.id}
                    onSelect={() => editor.switchDocument(doc.id)}
                    onToggleFavorite={() => editor.toggleFavorite(doc.id)}
                    onDuplicate={() => editor.duplicateDocument(doc.id)}
                    onDelete={() => {
                      setDocToDelete(doc.id);
                      setShowDeleteDialog(true);
                    }}
                    onMove={(folderId) => {
                          // TODO: 实现 moveDocumentToFolder
                          console.log('Move to folder:', folderId);
                        }}
                    folders={editor.folders}
                  />
                ))}
              </div>
            ) : (
              <div className="p-2">
                {/* 文件夹列表 */}
                {editor.folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => editor.setCurrentFolder(folder.id)}
                  >
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{folder.name}</span>
                  </div>
                ))}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setShowNewFolderDialog(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  新建文件夹
                </Button>
              </div>
            )}
          </ScrollArea>
          
          {/* 底部状态 */}
          <div className="p-2 border-t">
            <AutoSaveStatus 
              status="saved"
              lastSaved={editor.currentDoc?.updatedAt ? new Date(editor.currentDoc.updatedAt) : null}
            />
          </div>
        </div>
      )}
      
      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 工具栏 */}
        <EditorToolbarSection
          mode={editor.editorMode.mode}
          onModeChange={editor.setEditorMode}
          fontSize={editor.editorMode.fontSize}
          onFontSizeChange={handleFontSizeChange}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onSaveVersion={() => editor.saveVersion()}
          onToggleSearch={editor.toggleSearchReplace}
          onOpenAI={editor.aiChat.toggle}
          onExport={handleExport}
          onImport={handleImport}
          theme={theme || 'light'}
          onThemeChange={setTheme}
        />
        
        {/* 标题输入 */}
        <div className="px-4 py-2 border-b">
          <input
            type="text"
            value={editor.title}
            onChange={(e) => editor.updateTitle(e.target.value)}
            placeholder="文档标题..."
            className="w-full text-lg font-medium bg-transparent border-none outline-none"
          />
        </div>
        
        {/* 编辑器区域 */}
        <div className="flex-1 relative">
          {/* 查找替换 */}
          <SearchReplace
            isOpen={editor.uiState.showSearchReplace}
            onClose={editor.toggleSearchReplace}
            content={editor.content}
            onReplace={editor.updateContent}
          />
          
          {/* Markdown 编辑器 */}
          <div className="h-full" style={{ fontSize: editor.editorMode.fontSize }}>
            <MDEditor
              value={editor.content}
              onChange={(val) => editor.updateContent(val || '')}
              preview={editor.editorMode.mode === 'edit' ? 'edit' : editor.editorMode.mode === 'preview' ? 'preview' : 'live'}
              height="100%"
              visibleDragbar={false}
              hideToolbar={true}
            />
          </div>
          
          {/* 目录 */}
          {editor.editorMode.mode === 'live' && editor.toc.length > 0 && (
            <div className="absolute right-4 top-4 w-48 bg-card border rounded-lg shadow-sm">
              <TableOfContents
                content={editor.content}
                maxHeight={300}
              />
            </div>
          )}
        </div>
        
        {/* 状态栏 */}
        <div className="px-4 py-1 border-t text-xs text-muted-foreground flex items-center justify-between">
          <DocumentStats content={editor.content} />
          <div className="flex items-center gap-4">
            <span>阅读时间: {editor.stats.readingTime} 分钟</span>
            {editor.currentDoc && (
              <span>
                最后修改: {new Date(editor.currentDoc.updatedAt).toLocaleString('zh-CN')}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            确定要删除这个文档吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewFolderDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFolder}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
