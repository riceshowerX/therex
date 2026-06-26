'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  FileText,
  Hash,
  Type,
  AlignLeft,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Zap,
  Languages,
  Percent,
} from 'lucide-react';

interface DocumentStatsProps {
  content: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Stats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  chineseWords: number;
  englishWords: number;
  lines: number;
  paragraphs: number;
  sentences: number;
  readingTime: number;
  speakingTime: number;
  codeBlocks: number;
  images: number;
  links: number;
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  lists: {
    ordered: number;
    unordered: number;
  };
  tables: number;
  blockquotes: number;
}

function calculateStats(content: string): Stats {
  // 基础统计
  const characters = content.length;
  const charactersNoSpaces = content.replace(/\s/g, '').length;

  // 中文和英文单词统计
  const chineseMatches = content.match(/[\u4e00-\u9fa5]/g) || [];
  const englishMatches = content.match(/[a-zA-Z]+/g) || [];
  const chineseWords = chineseMatches.length;
  const englishWords = englishMatches.length;
  const words = chineseWords + englishWords;

  // 行数统计
  const lines = content.split('\n').length;

  // 段落统计（非空行）
  const paragraphs = content.split('\n').filter(line => line.trim().length > 0).length;

  // 句子统计
  const sentences = (content.match(/[。！？.!?]+/g) || []).length;

  // 阅读时间（中文约 300 字/分钟，英文约 200 词/分钟）
  const readingTime = Math.ceil((chineseWords / 300) + (englishWords / 200));

  // 演讲时间（约为阅读时间的 1.5 倍）
  const speakingTime = Math.ceil(readingTime * 1.5);

  // Markdown 元素统计
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
  const images = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
  const links = (content.match(/\[.*?\]\(.*?\)/g) || []).length - images;

  // 标题统计
  const headings = {
    h1: (content.match(/^# .+/gm) || []).length,
    h2: (content.match(/^## .+/gm) || []).length,
    h3: (content.match(/^### .+/gm) || []).length,
    h4: (content.match(/^#### .+/gm) || []).length,
    h5: (content.match(/^##### .+/gm) || []).length,
    h6: (content.match(/^###### .+/gm) || []).length,
  };

  // 列表统计
  const lists = {
    ordered: (content.match(/^\s*\d+\.\s/gm) || []).length,
    unordered: (content.match(/^\s*[-*+]\s/gm) || []).length,
  };

  // 表格统计
  const tables = (content.match(/^\|.+\|$/gm) || []).length > 0 ?
    (content.match(/^\|.+\|$/gm) || []).length : 0;

  // 引用块统计
  const blockquotes = (content.match(/^>\s/gm) || []).length;

  return {
    characters,
    charactersNoSpaces,
    words,
    chineseWords,
    englishWords,
    lines,
    paragraphs,
    sentences,
    readingTime,
    speakingTime,
    codeBlocks,
    images,
    links,
    headings,
    lists,
    tables,
    blockquotes,
  };
}

export function DocumentStats({ content, isOpen, onOpenChange }: DocumentStatsProps) {
  const [open, setOpen] = useState(isOpen || false);

  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  const stats = useMemo(() => calculateStats(content), [content]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  // 计算中英文比例
  const chineseRatio = stats.words > 0 ? (stats.chineseWords / stats.words * 100).toFixed(1) : '0';
  const englishRatio = stats.words > 0 ? (stats.englishWords / stats.words * 100).toFixed(1) : '0';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          统计
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            文档统计
          </SheetTitle>
          <SheetDescription>
            实时分析文档内容，提供详细的统计信息
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* 基础统计 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                基础统计
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats.characters.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">总字符数</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats.charactersNoSpaces.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">字符数(不含空格)</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats.words.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">总词数</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats.lines}</div>
                  <div className="text-xs text-muted-foreground">总行数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 语言统计 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Languages className="h-4 w-4" />
                语言统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>中文</span>
                  <span className="text-muted-foreground">{stats.chineseWords} 字 ({chineseRatio}%)</span>
                </div>
                <Progress value={parseFloat(chineseRatio)} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>英文</span>
                  <span className="text-muted-foreground">{stats.englishWords} 词 ({englishRatio}%)</span>
                </div>
                <Progress value={parseFloat(englishRatio)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* 时间估算 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                时间估算
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats.readingTime}</div>
                  <div className="text-xs text-muted-foreground">阅读(分钟)</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats.speakingTime}</div>
                  <div className="text-xs text-muted-foreground">演讲(分钟)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 结构统计 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                结构统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">段落数</span>
                  <Badge variant="secondary">{stats.paragraphs}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">句子数</span>
                  <Badge variant="secondary">{stats.sentences}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">代码块</span>
                  <Badge variant="secondary">{stats.codeBlocks}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">图片</span>
                  <Badge variant="secondary">{stats.images}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">链接</span>
                  <Badge variant="secondary">{stats.links}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">表格</span>
                  <Badge variant="secondary">{stats.tables}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 标题统计 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                标题统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(level => (
                  <div key={level} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-medium">H{level}</span>
                    <Badge variant="outline">{stats.headings[`h${level}` as keyof typeof stats.headings]}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 列表统计 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4" />
                列表统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">有序列表</span>
                  <Badge variant="outline">{stats.lists.ordered}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">无序列表</span>
                  <Badge variant="outline">{stats.lists.unordered}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
