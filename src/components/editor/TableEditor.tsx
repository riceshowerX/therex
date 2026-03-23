/**
 * Markdown 表格编辑器组件
 * 支持可视化编辑、行列操作、单元格合并等功能
 */

'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoveUp,
  MoveDown,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableData {
  headers: string[];
  rows: string[][];
  alignments: ('left' | 'center' | 'right')[];
}

interface MarkdownTableEditorProps {
  initialMarkdown?: string;
  onChange: (markdown: string) => void;
  onClose?: () => void;
}

// 解析 Markdown 表格
function parseMarkdownTable(markdown: string): TableData {
  const lines = markdown.trim().split('\n').filter(l => l.trim());
  
  if (lines.length < 2) {
    return {
      headers: ['列 1', '列 2', '列 3'],
      rows: [['', '', ''], ['', '', '']],
      alignments: ['left', 'left', 'left'],
    };
  }
  
  // 解析表头
  const headerLine = lines[0];
  const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
  
  // 解析分隔符和对齐方式
  const separatorLine = lines[1];
  const separators = separatorLine.split('|').map(s => s.trim()).filter(s => s);
  const alignments: ('left' | 'center' | 'right')[] = separators.map(sep => {
    if (sep.startsWith(':') && sep.endsWith(':')) return 'center';
    if (sep.endsWith(':')) return 'right';
    return 'left';
  });
  
  // 解析数据行
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 ? true : false);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return { headers, rows, alignments };
}

// 生成 Markdown 表格
function generateMarkdownFromData(data: TableData): string {
  const { headers, rows, alignments } = data;
  
  // 表头行
  const headerLine = '| ' + headers.join(' | ') + ' |';
  
  // 分隔行
  const separatorLine = '| ' + alignments.map((align) => {
    const base = '---';
    if (align === 'center') return ':' + base + ':';
    if (align === 'right') return base + ':';
    return ':' + base;
  }).join(' | ') + ' |';
  
  // 数据行
  const dataLines = rows.map(row => {
    // 确保每行的列数与表头一致
    const paddedRow = [...row];
    while (paddedRow.length < headers.length) {
      paddedRow.push('');
    }
    return '| ' + paddedRow.slice(0, headers.length).join(' | ') + ' |';
  });
  
  return [headerLine, separatorLine, ...dataLines].join('\n');
}

export function MarkdownTableEditor({ initialMarkdown, onChange, onClose }: MarkdownTableEditorProps) {
  // 使用 useMemo 解析初始数据，避免重复解析
  const initialData = useMemo(() => {
    if (!initialMarkdown) {
      return {
        headers: ['列 1', '列 2', '列 3'],
        rows: [['', '', ''], ['', '', '']],
        alignments: ['left', 'left', 'left'] as ('left' | 'center' | 'right')[],
      };
    }
    return parseMarkdownTable(initialMarkdown);
  }, [initialMarkdown]);
  
  const [tableData, setTableData] = useState<TableData>(initialData);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  
  // 跟踪是否是用户主动编辑（非初始化）
  const isUserEditRef = useRef(false);
  
  // 当 initialMarkdown 变化时，重置表格数据
  useEffect(() => {
    setTableData(initialData);
    isUserEditRef.current = false;
  }, [initialData]);
  
  // 通知父组件数据变化
  const notifyChange = useCallback((data: TableData) => {
    const markdown = generateMarkdownFromData(data);
    onChange(markdown);
  }, [onChange]);
  
  // 更新表头
  const updateHeader = useCallback((colIndex: number, value: string) => {
    isUserEditRef.current = true;
    setTableData(prev => {
      const newHeaders = [...prev.headers];
      newHeaders[colIndex] = value;
      const newData = { ...prev, headers: newHeaders };
      // 使用 setTimeout 延迟调用，避免在渲染期间更新父组件
      setTimeout(() => notifyChange(newData), 0);
      return newData;
    });
  }, [notifyChange]);
  
  // 更新单元格
  const updateCell = useCallback((rowIndex: number, colIndex: number, value: string) => {
    isUserEditRef.current = true;
    setTableData(prev => {
      const newData = {
        ...prev,
        rows: prev.rows.map((row, rIdx) => 
          rIdx === rowIndex 
            ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
            : row
        ),
      };
      setTimeout(() => notifyChange(newData), 0);
      return newData;
    });
  }, [notifyChange]);
  
  // 添加列
  const addColumn = useCallback((position: 'left' | 'right' = 'right') => {
    isUserEditRef.current = true;
    setTableData(prev => {
      const colIndex = selectedCell?.col ?? prev.headers.length;
      const insertIndex = position === 'left' ? colIndex : colIndex + 1;
      
      const newHeaders = [...prev.headers];
      newHeaders.splice(insertIndex, 0, `列 ${prev.headers.length + 1}`);
      
      const newAlignments = [...prev.alignments];
      newAlignments.splice(insertIndex, 0, 'left' as const);
      
      const newRows = prev.rows.map(row => {
        const newRow = [...row];
        newRow.splice(insertIndex, 0, '');
        return newRow;
      });
      
      const newData = { ...prev, headers: newHeaders, alignments: newAlignments, rows: newRows };
      setTimeout(() => notifyChange(newData), 0);
      return newData;
    });
  }, [selectedCell, notifyChange]);
  
  // 删除列
  const deleteColumn = useCallback(() => {
    if (!selectedCell || tableData.headers.length <= 1) return;
    
    isUserEditRef.current = true;
    setTableData(prev => {
      const newHeaders = prev.headers.filter((_, i) => i !== selectedCell.col);
      const newAlignments = prev.alignments.filter((_, i) => i !== selectedCell.col);
      const newRows = prev.rows.map(row => row.filter((_, i) => i !== selectedCell.col));
      
      const newData = { ...prev, headers: newHeaders, alignments: newAlignments, rows: newRows };
      setTimeout(() => notifyChange(newData), 0);
      return newData;
    });
    setSelectedCell(null);
  }, [selectedCell, tableData.headers.length, notifyChange]);
  
  // 添加行
  const addRow = useCallback((position: 'above' | 'below' = 'below') => {
    isUserEditRef.current = true;
    setTableData(prev => {
      const rowIndex = selectedCell?.row ?? prev.rows.length;
      const insertIndex = position === 'above' ? rowIndex : rowIndex + 1;
      
      const newRow = Array(prev.headers.length).fill('');
      const newRows = [...prev.rows];
      newRows.splice(insertIndex, 0, newRow);
      
      const newData = { ...prev, rows: newRows };
      setTimeout(() => notifyChange(newData), 0);
      return newData;
    });
  }, [selectedCell, notifyChange]);
  
  // 删除行
  const deleteRow = useCallback(() => {
    if (!selectedCell || tableData.rows.length <= 1) return;
    
    isUserEditRef.current = true;
    setTableData(prev => {
      const newRows = prev.rows.filter((_, i) => i !== selectedCell.row);
      const newData = { ...prev, rows: newRows };
      setTimeout(() => notifyChange(newData), 0);
      return newData;
    });
    setSelectedCell(null);
  }, [selectedCell, tableData.rows.length, notifyChange]);
  
  // 设置对齐方式
  const setAlignment = useCallback((alignment: 'left' | 'center' | 'right') => {
    if (!selectedCell) return;
    
    isUserEditRef.current = true;
    const colIndex = selectedCell.col;
    
    setTableData(prev => {
      const newAlignments = [...prev.alignments];
      newAlignments[colIndex] = alignment;
      
      const newData = { ...prev, alignments: newAlignments };
      setTimeout(() => notifyChange(newData), 0);
      return newData;
    });
  }, [selectedCell, notifyChange]);
  
  // 移动行
  const moveRow = useCallback((direction: 'up' | 'down') => {
    if (!selectedCell) return;
    
    const rowIndex = selectedCell.row;
    const newIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    
    if (newIndex < 0 || newIndex >= tableData.rows.length) return;
    
    isUserEditRef.current = true;
    setTableData(prev => {
      const newRows = [...prev.rows];
      [newRows[rowIndex], newRows[newIndex]] = [newRows[newIndex], newRows[rowIndex]];
      
      const newData = { ...prev, rows: newRows };
      setTimeout(() => notifyChange(newData), 0);
      return newData;
    });
    
    setSelectedCell({ row: newIndex, col: selectedCell.col });
  }, [selectedCell, tableData.rows.length, notifyChange]);
  
  // 复制表格
  const copyTable = useCallback(() => {
    const markdown = generateMarkdownFromData(tableData);
    navigator.clipboard.writeText(markdown);
  }, [tableData]);
  
  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent, colIndex?: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextCol = e.shiftKey ? (colIndex || 0) - 1 : (colIndex || 0) + 1;
      
      if (nextCol >= 0 && nextCol < tableData.headers.length) {
        setSelectedCell(prev => prev ? { ...prev, col: nextCol } : null);
      }
    }
  }, [tableData.headers.length]);
  
  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-lg">
        {/* 行列操作 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              插入
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="grid gap-1">
              <Button variant="ghost" size="sm" onClick={() => addColumn('right')}>
                在右侧插入列
              </Button>
              <Button variant="ghost" size="sm" onClick={() => addColumn('left')}>
                在左侧插入列
              </Button>
              <Button variant="ghost" size="sm" onClick={() => addRow('below')}>
                在下方插入行
              </Button>
              <Button variant="ghost" size="sm" onClick={() => addRow('above')}>
                在上方插入行
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button variant="outline" size="sm" onClick={deleteRow} disabled={!selectedCell || tableData.rows.length <= 1}>
          <Trash2 className="h-4 w-4 mr-1" />
          删除行
        </Button>
        
        <Button variant="outline" size="sm" onClick={deleteColumn} disabled={!selectedCell || tableData.headers.length <= 1}>
          <Trash2 className="h-4 w-4 mr-1" />
          删除列
        </Button>
        
        <div className="h-4 w-px bg-border mx-1" />
        
        {/* 对齐方式 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" disabled={!selectedCell}>
              对齐方式
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40" align="start">
            <div className="grid gap-1">
              <Button variant="ghost" size="sm" onClick={() => setAlignment('left')} className="justify-start">
                <AlignLeft className="h-4 w-4 mr-2" />
                左对齐
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAlignment('center')} className="justify-start">
                <AlignCenter className="h-4 w-4 mr-2" />
                居中对齐
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAlignment('right')} className="justify-start">
                <AlignRight className="h-4 w-4 mr-2" />
                右对齐
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* 行移动 */}
        <Button variant="outline" size="sm" onClick={() => moveRow('up')} disabled={!selectedCell || selectedCell.row === 0}>
          <MoveUp className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="sm" onClick={() => moveRow('down')} disabled={!selectedCell || selectedCell.row === tableData.rows.length - 1}>
          <MoveDown className="h-4 w-4" />
        </Button>
        
        <div className="h-4 w-px bg-border mx-1" />
        
        <Button variant="outline" size="sm" onClick={copyTable}>
          <Copy className="h-4 w-4 mr-1" />
          复制
        </Button>
        
        {onClose && (
          <>
            <div className="flex-1" />
            <Button variant="default" size="sm" onClick={onClose}>
              完成
            </Button>
          </>
        )}
      </div>
      
      {/* 表格编辑区 */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {tableData.headers.map((header, colIndex) => (
                <TableHead 
                  key={colIndex}
                  className={cn(
                    "min-w-[120px] relative group",
                    selectedCell?.col === colIndex && "bg-primary/10"
                  )}
                  style={{ textAlign: tableData.alignments[colIndex] }}
                >
                  <Input
                    value={header}
                    onChange={(e) => updateHeader(colIndex, e.target.value)}
                    onFocus={() => setSelectedCell({ row: -1, col: colIndex })}
                    onKeyDown={(e) => handleKeyDown(e, colIndex)}
                    className="border-none bg-transparent focus:ring-1 focus:ring-primary font-semibold"
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <TableCell 
                    key={colIndex}
                    className={cn(
                      "min-w-[120px] relative",
                      selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "bg-primary/10"
                    )}
                    style={{ textAlign: tableData.alignments[colIndex] }}
                  >
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      onFocus={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                      onKeyDown={(e) => handleKeyDown(e, colIndex)}
                      className="border-none bg-transparent focus:ring-1 focus:ring-primary"
                      placeholder="..."
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* 状态栏 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
        <span>
          {tableData.headers.length} 列 × {tableData.rows.length} 行
        </span>
        <span>
          {selectedCell 
            ? `已选择: 第 ${selectedCell.row + 2} 行, 第 ${selectedCell.col + 1} 列`
            : '点击单元格进行编辑'
          }
        </span>
      </div>
    </div>
  );
}
