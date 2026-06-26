/**
 * 全文搜索功能
 * 支持文档内容搜索、高级过滤、搜索历史
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  X, 
  Clock, 
  FileText, 
  Calendar,
  Tag,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchResult {
  documentId: string;
  documentTitle: string;
  snippet: string;
  highlights: string[];
  score: number;
  tags: string[];
  updatedAt: number;
  wordCount: number;
}

export interface SearchFilters {
  tags?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  wordCountRange?: {
    min?: number;
    max?: number;
  };
  sortBy?: 'relevance' | 'date' | 'title';
}

interface FullTextSearchProps {
  open: boolean;
  onClose: () => void;
  documents: Array<{
    id: string;
    title: string;
    content: string;
    tags: string[];
    updatedAt: number;
    wordCount: number;
  }>;
  onSelect: (documentId: string) => void;
  searchHistory?: string[];
  onClearHistory?: () => void;
}

export function FullTextSearch({
  open,
  onClose,
  documents,
  onSelect,
  searchHistory = [],
  onClearHistory,
}: FullTextSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance',
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // 可用的标签列表
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach(doc => doc.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [documents]);
  
  // 执行搜索
  const performSearch = useCallback((searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const queryLower = searchQuery.toLowerCase();
      const queryTerms = queryLower.split(/\s+/).filter(Boolean);
      
      // 搜索文档
      let searchResults: SearchResult[] = documents
        .map(doc => {
          const titleLower = doc.title.toLowerCase();
          const contentLower = doc.content.toLowerCase();
          
          // 计算相关度分数
          let score = 0;
          const highlights: string[] = [];
          
          // 标题匹配（权重更高）
          if (titleLower.includes(queryLower)) {
            score += 50;
            highlights.push(doc.title);
          }
          
          // 内容匹配
          for (const term of queryTerms) {
            const regex = new RegExp(`.{0,50}${term}.{0,50}`, 'gi');
            const matches = doc.content.match(regex);
            if (matches) {
              score += matches.length * 10;
              highlights.push(...matches.slice(0, 3));
            }
          }
          
          // 标签匹配
          for (const tag of doc.tags) {
            if (tag.toLowerCase().includes(queryLower)) {
              score += 20;
            }
          }
          
          if (score === 0) return null;
          
          // 生成摘要
          const firstHighlight = highlights[0] || doc.content.slice(0, 150);
          const snippet = firstHighlight.length > 150 
            ? firstHighlight.slice(0, 150) + '...'
            : firstHighlight;
          
          return {
            documentId: doc.id,
            documentTitle: doc.title,
            snippet,
            highlights: [...new Set(highlights)].slice(0, 5),
            score,
            tags: doc.tags,
            updatedAt: doc.updatedAt,
            wordCount: doc.wordCount,
          };
        })
        .filter((result): result is SearchResult => result !== null);
      
      // 应用过滤器
      if (searchFilters.tags && searchFilters.tags.length > 0) {
        searchResults = searchResults.filter(r => 
          searchFilters.tags!.some(tag => r.tags.includes(tag))
        );
      }
      
      if (searchFilters.dateRange) {
        searchResults = searchResults.filter(r => 
          r.updatedAt >= searchFilters.dateRange!.start &&
          r.updatedAt <= searchFilters.dateRange!.end
        );
      }
      
      if (searchFilters.wordCountRange) {
        searchResults = searchResults.filter(r => {
          const { min, max } = searchFilters.wordCountRange!;
          if (min && r.wordCount < min) return false;
          if (max && r.wordCount > max) return false;
          return true;
        });
      }
      
      // 排序
      switch (searchFilters.sortBy) {
        case 'date':
          searchResults.sort((a, b) => b.updatedAt - a.updatedAt);
          break;
        case 'title':
          searchResults.sort((a, b) => a.documentTitle.localeCompare(b.documentTitle));
          break;
        default:
          searchResults.sort((a, b) => b.score - a.score);
      }
      
      setResults(searchResults);
    } finally {
      setIsSearching(false);
    }
  }, [documents]);
  
  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, filters);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, filters, performSearch]);
  
  // 高亮文本
  const highlightText = useCallback((text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-primary/30 text-foreground px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  }, []);
  
  // 格式化日期
  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);
  
  const handleSelect = useCallback((documentId: string) => {
    onSelect(documentId);
    onClose();
  }, [onSelect, onClose]);
  
  const handleHistoryClick = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
  }, []);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            全文搜索
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          {/* 搜索输入 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索文档内容..."
                className="pl-9"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-primary/10")}
            >
              过滤
            </Button>
          </div>
          
          {/* 过滤器 */}
          {showFilters && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">排序方式</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters(f => ({ ...f, sortBy: value as SearchFilters['sortBy'] }))}
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">相关度</SelectItem>
                    <SelectItem value="date">修改时间</SelectItem>
                    <SelectItem value="title">标题</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {availableTags.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">标签过滤</label>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 5).map(tag => (
                      <Badge
                        key={tag}
                        variant={filters.tags?.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          setFilters(f => ({
                            ...f,
                            tags: f.tags?.includes(tag)
                              ? f.tags.filter(t => t !== tag)
                              : [...(f.tags || []), tag]
                          }));
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 搜索结果或历史 */}
          <ScrollArea className="h-[400px]">
            {query ? (
              // 搜索结果
              <div className="space-y-2">
                {isSearching ? (
                  <div className="text-center py-8 text-muted-foreground">
                    搜索中...
                  </div>
                ) : results.length > 0 ? (
                  results.map((result) => (
                    <button
                      key={result.documentId}
                      onClick={() => handleSelect(result.documentId)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate group-hover:text-primary transition-colors">
                            {result.documentTitle}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {highlightText(result.snippet, query)}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(result.updatedAt)}
                            </span>
                            <span>{result.wordCount} 字</span>
                            <span className="text-primary">相关度: {result.score}</span>
                          </div>
                          {result.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {result.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    未找到匹配的文档
                  </div>
                )}
              </div>
            ) : (
              // 搜索历史
              <div className="space-y-3">
                {searchHistory.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between px-3">
                      <span className="text-sm font-medium text-muted-foreground">搜索历史</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearHistory}
                        className="h-auto p-1 text-xs text-muted-foreground"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        清除
                      </Button>
                    </div>
                    {searchHistory.map((historyItem, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryClick(historyItem)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{historyItem}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    输入关键词开始搜索
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* 快捷键提示 */}
        <div className="px-4 py-2 border-t text-xs text-muted-foreground">
          <span className="font-medium">提示：</span>
          支持搜索文档标题、内容和标签
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 搜索按钮组件
interface SearchButtonProps {
  onClick: () => void;
  shortcut?: string;
}

export function SearchButton({ onClick, shortcut = 'Ctrl+K' }: SearchButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">搜索</span>
      <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
        {shortcut}
      </kbd>
    </Button>
  );
}

export default FullTextSearch;
