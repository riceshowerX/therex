/**
 * 仪表盘组件
 * 显示统计数据、图表、最近文档等
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  Hash,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardStats {
  totalDocuments: number;
  totalWords: number;
  totalCharacters: number;
  averageWordsPerDoc: number;
  documentsThisWeek: number;
  wordsThisWeek: number;
  mostUsedTags: Array<{ name: string; count: number; color?: string }>;
  recentDocuments: Array<{
    id: string;
    title: string;
    updatedAt: number;
    wordCount: number;
    tags: string[];
  }>;
  activityByDay: Array<{ date: string; count: number }>;
  topDocuments: Array<{
    id: string;
    title: string;
    wordCount: number;
    viewCount?: number;
  }>;
}

interface DashboardProps {
  stats: DashboardStats;
  onDocumentSelect: (id: string) => void;
  onCreateNew: () => void;
  className?: string;
}

export function Dashboard({ stats, onDocumentSelect, onCreateNew, className }: DashboardProps) {
  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // 格式化日期
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };
  
  // 计算周增长率
  const weeklyGrowth = useMemo(() => {
    if (stats.activityByDay.length < 14) return 0;
    
    const thisWeek = stats.activityByDay.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const lastWeek = stats.activityByDay.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
    
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round((thisWeek - lastWeek) / lastWeek * 100);
  }, [stats.activityByDay]);
  
  // 活动热力图数据
  const maxActivity = Math.max(...stats.activityByDay.map(d => d.count), 1);
  
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground">你的写作数据概览</p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          新建文档
        </Button>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文档总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalDocuments)}</div>
            <p className="text-xs text-muted-foreground">
              本周新增 {stats.documentsThisWeek} 篇
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总字数</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalWords)}</div>
            <p className="text-xs text-muted-foreground">
              平均每篇 {formatNumber(stats.averageWordsPerDoc)} 字
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本周写作</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.wordsThisWeek)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {weeklyGrowth > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{weeklyGrowth}%</span>
                  <span>相比上周</span>
                </>
              ) : weeklyGrowth < 0 ? (
                <span className="text-red-500">{weeklyGrowth}% 相比上周</span>
              ) : (
                '与上周持平'
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总字符</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalCharacters)}</div>
            <p className="text-xs text-muted-foreground">
              包含标点和空格
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 活动热力图 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              写作活动
            </CardTitle>
            <CardDescription>最近 30 天的写作活动</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['日', '一', '二', '三', '四', '五', '六'].map((day, i) => (
                <div key={i} className="text-xs text-center text-muted-foreground pb-2">
                  {day}
                </div>
              ))}
              {stats.activityByDay.slice(-35).map((day, i) => {
                const intensity = day.count / maxActivity;
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-sm transition-colors"
                    style={{
                      backgroundColor: day.count > 0
                        ? `oklch(0.55 0.15 160 / ${Math.max(0.1, intensity)})`
                        : 'hsl(var(--muted))',
                    }}
                    title={`${day.date}: ${day.count} 字`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* 标签使用 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              标签分布
            </CardTitle>
            <CardDescription>最常使用的标签</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.mostUsedTags.length > 0 ? (
                stats.mostUsedTags.slice(0, 8).map((tag, i) => {
                  const maxCount = stats.mostUsedTags[0]?.count || 1;
                  const percentage = (tag.count / maxCount) * 100;
                  
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {tag.color && (
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                          )}
                          {tag.name}
                        </span>
                        <span className="text-muted-foreground">{tag.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无标签数据
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 最近文档和热门文档 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 最近文档 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              最近文档
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {stats.recentDocuments.length > 0 ? (
                  stats.recentDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => onDocumentSelect(doc.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate group-hover:text-primary transition-colors">
                          {doc.title || '无标题文档'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{formatDate(doc.updatedAt)}</span>
                          <span>•</span>
                          <span>{doc.wordCount} 字</span>
                        </div>
                        {doc.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {doc.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>暂无文档</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={onCreateNew}
                      className="mt-2"
                    >
                      创建第一篇文档
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* 最长文档 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              字数排行
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {stats.topDocuments.length > 0 ? (
                  stats.topDocuments.map((doc, index) => (
                    <button
                      key={doc.id}
                      onClick={() => onDocumentSelect(doc.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group text-left"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate group-hover:text-primary transition-colors">
                          {doc.title || '无标题文档'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(doc.wordCount)} 字
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无数据
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
