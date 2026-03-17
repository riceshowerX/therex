/**
 * 查找替换组件
 * 提供文档内容的查找和替换功能
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Replace,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
  CaseSensitive,
  Regex,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface SearchReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onReplace: (newContent: string) => void;
  editorSelector?: string;
}

export function SearchReplace({
  isOpen,
  onClose,
  content,
  onReplace,
  editorSelector = '.w-md-editor-text-input',
}: SearchReplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // 获取编辑器 textarea
  const getEditor = useCallback(() => {
    return document.querySelector(editorSelector) as HTMLTextAreaElement | null;
  }, [editorSelector]);
  
  // 计算匹配数量
  useEffect(() => {
    if (!searchQuery) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }
    
    try {
      let regex: RegExp;
      if (useRegex) {
        regex = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
      }
      
      const matches = content.match(regex);
      setMatchCount(matches ? matches.length : 0);
      setCurrentMatch(0);
    } catch {
      // 正则表达式无效
      setMatchCount(0);
      setCurrentMatch(0);
    }
  }, [searchQuery, content, caseSensitive, useRegex]);
  
  // 聚焦搜索框
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  // 查找下一个
  const findNext = useCallback(() => {
    if (!searchQuery) return;
    
    const textarea = getEditor();
    if (!textarea) {
      toast.info('请先聚焦编辑器');
      return;
    }
    
    const text = textarea.value;
    const start = textarea.selectionEnd;
    
    try {
      let regex: RegExp;
      if (useRegex) {
        regex = new RegExp(searchQuery, caseSensitive ? '' : 'i');
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, caseSensitive ? '' : 'i');
      }
      
      // 从当前位置开始查找
      const remainingText = text.substring(start);
      const match = remainingText.match(regex);
      
      if (match && match.index !== undefined) {
        const matchStart = start + match.index;
        textarea.focus();
        textarea.setSelectionRange(matchStart, matchStart + match[0].length);
        setCurrentMatch(prev => Math.min(prev + 1, matchCount));
      } else {
        // 从头开始查找
        const matchFromStart = text.match(regex);
        if (matchFromStart && matchFromStart.index !== undefined) {
          textarea.focus();
          textarea.setSelectionRange(matchFromStart.index, matchFromStart.index + matchFromStart[0].length);
          setCurrentMatch(1);
        } else {
          toast.info('未找到匹配内容');
        }
      }
    } catch {
      toast.error('无效的搜索表达式');
    }
  }, [searchQuery, caseSensitive, useRegex, getEditor, matchCount]);
  
  // 查找上一个
  const findPrevious = useCallback(() => {
    if (!searchQuery) return;
    
    const textarea = getEditor();
    if (!textarea) {
      toast.info('请先聚焦编辑器');
      return;
    }
    
    const text = textarea.value;
    const start = textarea.selectionStart;
    
    try {
      let regex: RegExp;
      if (useRegex) {
        regex = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
      }
      
      // 找到所有匹配
      const matches = [...text.matchAll(regex)];
      if (matches.length === 0) {
        toast.info('未找到匹配内容');
        return;
      }
      
      // 找到当前位置之前的最后一个匹配
      let targetMatch = matches[matches.length - 1];
      for (let i = matches.length - 1; i >= 0; i--) {
        if (matches[i].index !== undefined && matches[i].index < start) {
          targetMatch = matches[i];
          break;
        }
      }
      
      if (targetMatch.index !== undefined) {
        textarea.focus();
        textarea.setSelectionRange(targetMatch.index, targetMatch.index + targetMatch[0].length);
        setCurrentMatch(prev => Math.max(prev - 1, 1));
      }
    } catch {
      toast.error('无效的搜索表达式');
    }
  }, [searchQuery, caseSensitive, useRegex, getEditor]);
  
  // 替换当前
  const replaceCurrent = useCallback(() => {
    if (!searchQuery) return;
    
    const textarea = getEditor();
    if (!textarea) {
      toast.info('请先聚焦编辑器');
      return;
    }
    
    const text = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) {
      toast.info('请先选择要替换的内容');
      return;
    }
    
    const selectedText = text.substring(start, end);
    
    try {
      let regex: RegExp;
      if (useRegex) {
        regex = new RegExp(`^${searchQuery}$`, caseSensitive ? '' : 'i');
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(`^${escaped}$`, caseSensitive ? '' : 'i');
      }
      
      if (regex.test(selectedText)) {
        const newText = text.substring(0, start) + replaceQuery + text.substring(end);
        onReplace(newText);
        toast.success('已替换');
      } else {
        toast.info('选中的内容不匹配搜索条件');
      }
    } catch {
      toast.error('无效的搜索表达式');
    }
  }, [searchQuery, replaceQuery, caseSensitive, useRegex, getEditor, onReplace]);
  
  // 替换全部
  const replaceAll = useCallback(() => {
    if (!searchQuery) return;
    
    try {
      let regex: RegExp;
      if (useRegex) {
        regex = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
      }
      
      const matches = content.match(regex);
      const count = matches ? matches.length : 0;
      
      if (count === 0) {
        toast.info('未找到匹配内容');
        return;
      }
      
      const newContent = content.replace(regex, replaceQuery);
      onReplace(newContent);
      toast.success(`已替换 ${count} 处`);
    } catch {
      toast.error('无效的搜索表达式');
    }
  }, [searchQuery, replaceQuery, content, caseSensitive, useRegex, onReplace]);
  
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-2 right-2 z-50 bg-card border rounded-lg shadow-lg p-2 min-w-80">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="查找..."
            className="pl-8 pr-16 h-8"
          />
          {matchCount > 0 && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {currentMatch}/{matchCount}
            </span>
          )}
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={caseSensitive ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setCaseSensitive(!caseSensitive)}
              >
                <CaseSensitive className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>区分大小写</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={useRegex ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setUseRegex(!useRegex)}
              >
                <Regex className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>正则表达式</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Replace className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="替换为..."
            className="pl-8 h-8"
          />
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={findPrevious}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>上一个</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={findNext}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>下一个</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={replaceCurrent}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>替换</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={replaceAll}>
                全部
              </Button>
            </TooltipTrigger>
            <TooltipContent>替换全部</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
