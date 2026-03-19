/**
 * Vim 模式支持
 * 实现 Vim 风格的键盘快捷键和编辑模式
 */

'use client';

export type VimMode = 'normal' | 'insert' | 'visual' | 'visual-line' | 'command';

export interface VimState {
  mode: VimMode;
  register: string;
  count: string;
  operator: string;
  motion: string;
  searchQuery: string;
  searchDirection: 'forward' | 'backward';
  lastCommand: string;
  macroRecording: string | null;
  marks: Map<string, { line: number; ch: number }>;
}

export interface VimCommand {
  keys: string;
  action: (state: VimState, editor: VimEditor, key?: string) => void | Partial<VimState>;
  description: string;
}

export interface VimEditor {
  getCursor(): { line: number; ch: number };
  setCursor(pos: { line: number; ch: number }): void;
  getSelection(): { from: { line: number; ch: number }; to: { line: number; ch: number } };
  setSelection(from: { line: number; ch: number }, to: { line: number; ch: number }): void;
  getLine(line: number): string;
  getLineCount(): number;
  insertText(text: string): void;
  replaceSelection(text: string): void;
  deleteSelection(): string;
  undo(): void;
  redo(): void;
  findNext(query: string): { from: { line: number; ch: number }; to: { line: number; ch: number } } | null;
  findPrevious(query: string): { from: { line: number; ch: number }; to: { line: number; ch: number } } | null;
}

// Vim 命令定义
const VIM_COMMANDS: VimCommand[] = [
  // 移动命令
  { keys: 'h', action: (s, e) => e.setCursor({ ...e.getCursor(), ch: Math.max(0, e.getCursor().ch - 1) }), description: '左移' },
  { keys: 'j', action: (s, e) => e.setCursor({ ...e.getCursor(), line: Math.min(e.getLineCount() - 1, e.getCursor().line + 1) }), description: '下移' },
  { keys: 'k', action: (s, e) => e.setCursor({ ...e.getCursor(), line: Math.max(0, e.getCursor().line - 1) }), description: '上移' },
  { keys: 'l', action: (s, e) => e.setCursor({ ...e.getCursor(), ch: e.getCursor().ch + 1 }), description: '右移' },
  
  // 单词移动
  { keys: 'w', action: (s, e) => moveWordForward(e), description: '下一个单词开头' },
  { keys: 'W', action: (s, e) => moveWordForward(e, true), description: '下一个空格分隔单词' },
  { keys: 'b', action: (s, e) => moveWordBackward(e), description: '上一个单词开头' },
  { keys: 'B', action: (s, e) => moveWordBackward(e, true), description: '上一个空格分隔单词' },
  { keys: 'e', action: (s, e) => moveWordEnd(e), description: '当前/下一个单词结尾' },
  
  // 行移动
  { keys: '0', action: (s, e) => e.setCursor({ ...e.getCursor(), ch: 0 }), description: '行首' },
  { keys: '^', action: (s, e) => e.setCursor({ ...e.getCursor(), ch: getFirstNonWhitespace(e) }), description: '第一个非空字符' },
  { keys: '$', action: (s, e) => e.setCursor({ ...e.getCursor(), ch: e.getLine(e.getCursor().line).length }), description: '行尾' },
  
  // 文档移动
  { keys: 'gg', action: (s, e) => e.setCursor({ line: 0, ch: 0 }), description: '文档开头' },
  { keys: 'G', action: (s, e) => e.setCursor({ line: e.getLineCount() - 1, ch: 0 }), description: '文档结尾' },
  
  // 插入模式
  { keys: 'i', action: () => ({ mode: 'insert' as VimMode }), description: '插入模式' },
  { keys: 'I', action: (s, e) => { e.setCursor({ ...e.getCursor(), ch: getFirstNonWhitespace(e) }); return { mode: 'insert' as VimMode }; }, description: '行首插入' },
  { keys: 'a', action: (s, e) => { e.setCursor({ ...e.getCursor(), ch: e.getCursor().ch + 1 }); return { mode: 'insert' as VimMode }; }, description: '追加' },
  { keys: 'A', action: (s, e) => { e.setCursor({ ...e.getCursor(), ch: e.getLine(e.getCursor().line).length }); return { mode: 'insert' as VimMode }; }, description: '行尾追加' },
  { keys: 'o', action: (s, e) => { e.insertText('\n'); e.setCursor({ line: e.getCursor().line, ch: 0 }); return { mode: 'insert' as VimMode }; }, description: '下方新建行' },
  { keys: 'O', action: (s, e) => { e.setCursor({ ...e.getCursor(), ch: 0 }); e.insertText('\n'); e.setCursor({ line: e.getCursor().line - 1, ch: 0 }); return { mode: 'insert' as VimMode }; }, description: '上方新建行' },
  
  // 删除/修改
  { keys: 'x', action: (s, e) => { e.setCursor({ ...e.getCursor(), ch: e.getCursor().ch }); const sel = e.getSelection(); e.setSelection(e.getCursor(), { ...e.getCursor(), ch: e.getCursor().ch + 1 }); e.deleteSelection(); }, description: '删除字符' },
  { keys: 'dd', action: (s, e) => deleteLine(e), description: '删除行' },
  { keys: 'D', action: (s, e) => { const cursor = e.getCursor(); e.setSelection(cursor, { ...cursor, ch: e.getLine(cursor.line).length }); e.deleteSelection(); }, description: '删除到行尾' },
  { keys: 'cc', action: (s, e) => { deleteLine(e); return { mode: 'insert' as VimMode }; }, description: '修改行' },
  { keys: 'C', action: (s, e) => { const cursor = e.getCursor(); e.setSelection(cursor, { ...cursor, ch: e.getLine(cursor.line).length }); e.deleteSelection(); return { mode: 'insert' as VimMode }; }, description: '修改到行尾' },
  { keys: 's', action: (s, e) => { const cursor = e.getCursor(); e.setSelection(cursor, { ...cursor, ch: cursor.ch + 1 }); e.deleteSelection(); return { mode: 'insert' as VimMode }; }, description: '替换字符' },
  { keys: 'S', action: (s, e) => { deleteLine(e); return { mode: 'insert' as VimMode }; }, description: '替换行' },
  
  // 复制粘贴
  { keys: 'yy', action: (s, e) => ({ register: e.getLine(e.getCursor().line) }), description: '复制行' },
  { keys: 'yw', action: (s, e) => ({ register: getWordAtCursor(e) }), description: '复制单词' },
  { keys: 'p', action: (s, e) => { e.setCursor({ ...e.getCursor(), ch: e.getLine(e.getCursor().line).length }); e.insertText('\n' + (s.register || '')); }, description: '粘贴到下方' },
  { keys: 'P', action: (s, e) => { e.setCursor({ ...e.getCursor(), ch: 0 }); e.insertText((s.register || '') + '\n'); }, description: '粘贴到上方' },
  
  // 撤销重做
  { keys: 'u', action: (s, e) => e.undo(), description: '撤销' },
  { keys: 'Ctrl+r', action: (s, e) => e.redo(), description: '重做' },
  
  // 可视模式
  { keys: 'v', action: () => ({ mode: 'visual' as VimMode }), description: '可视模式' },
  { keys: 'V', action: () => ({ mode: 'visual-line' as VimMode }), description: '可视行模式' },
  
  // 搜索
  { keys: '/', action: () => ({ mode: 'command' as VimMode, searchDirection: 'forward' }), description: '向前搜索' },
  { keys: '?', action: () => ({ mode: 'command' as VimMode, searchDirection: 'backward' }), description: '向后搜索' },
  { keys: 'n', action: (s, e) => { const result = e.findNext(s.searchQuery); if (result) e.setCursor(result.from); }, description: '下一个匹配' },
  { keys: 'N', action: (s, e) => { const result = e.findPrevious(s.searchQuery); if (result) e.setCursor(result.from); }, description: '上一个匹配' },
  
  // 标记
  { keys: 'm{a-z}', action: (s, e, key) => { if (key) { const mark = key.slice(1); s.marks.set(mark, e.getCursor()); } }, description: '设置标记' },
  { keys: "'{a-z}", action: (s, e, key) => { if (key) { const mark = key.slice(1); const pos = s.marks.get(mark); if (pos) e.setCursor(pos); } }, description: '跳转到标记' },
  
  // 退出
  { keys: 'Escape', action: () => ({ mode: 'normal' as VimMode }), description: '返回普通模式' },
  { keys: 'Ctrl+[', action: () => ({ mode: 'normal' as VimMode }), description: '返回普通模式' },
  
  // 保存退出
  { keys: ':w', action: (s, e) => { /* 触发保存事件 */ }, description: '保存' },
  { keys: ':q', action: () => { /* 触发退出事件 */ }, description: '退出' },
  { keys: ':wq', action: (s, e) => { /* 保存并退出 */ }, description: '保存并退出' },
  { keys: ':q!', action: () => { /* 强制退出 */ }, description: '强制退出' },
];

// 辅助函数
function moveWordForward(editor: VimEditor, bigWord: boolean = false): void {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  const pattern = bigWord ? /\S/ : /\w/;
  
  let pos = cursor.ch;
  // 跳过当前单词
  while (pos < line.length && (bigWord ? line[pos] !== ' ' : pattern.test(line[pos]))) {
    pos++;
  }
  // 跳过空白
  while (pos < line.length && (bigWord ? line[pos] === ' ' : !pattern.test(line[pos]))) {
    pos++;
  }
  
  editor.setCursor({ ...cursor, ch: pos });
}

function moveWordBackward(editor: VimEditor, bigWord: boolean = false): void {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  const pattern = bigWord ? /\S/ : /\w/;
  
  let pos = cursor.ch - 1;
  // 跳过空白
  while (pos >= 0 && (bigWord ? line[pos] === ' ' : !pattern.test(line[pos]))) {
    pos--;
  }
  // 跳到单词开头
  while (pos >= 0 && (bigWord ? line[pos] !== ' ' : pattern.test(line[pos]))) {
    pos--;
  }
  
  editor.setCursor({ ...cursor, ch: pos + 1 });
}

function moveWordEnd(editor: VimEditor): void {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  
  let pos = cursor.ch + 1;
  // 跳过空白
  while (pos < line.length && /\s/.test(line[pos])) {
    pos++;
  }
  // 跳到单词结尾
  while (pos < line.length && /\w/.test(line[pos])) {
    pos++;
  }
  
  editor.setCursor({ ...cursor, ch: Math.max(cursor.ch, pos - 1) });
}

function getFirstNonWhitespace(editor: VimEditor): number {
  const line = editor.getLine(editor.getCursor().line);
  const match = line.match(/^\s*/);
  return match ? match[0].length : 0;
}

function deleteLine(editor: VimEditor): void {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  
  // 选择整行
  editor.setSelection(
    { line: cursor.line, ch: 0 },
    { line: cursor.line, ch: line.length }
  );
  editor.deleteSelection();
  
  // 删除换行符
  if (editor.getLineCount() > cursor.line + 1) {
    editor.setSelection(
      { line: cursor.line, ch: 0 },
      { line: cursor.line + 1, ch: 0 }
    );
    editor.deleteSelection();
  }
}

function getWordAtCursor(editor: VimEditor): string {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  
  let start = cursor.ch;
  let end = cursor.ch;
  
  while (start > 0 && /\w/.test(line[start - 1])) start--;
  while (end < line.length && /\w/.test(line[end])) end++;
  
  return line.slice(start, end);
}

// Vim 模式状态管理器
export class VimModeManager {
  private state: VimState;
  private keyBuffer: string = '';
  private commands: Map<string, VimCommand['action']>;
  
  constructor() {
    this.state = {
      mode: 'normal',
      register: '',
      count: '',
      operator: '',
      motion: '',
      searchQuery: '',
      searchDirection: 'forward',
      lastCommand: '',
      macroRecording: null,
      marks: new Map(),
    };
    
    this.commands = new Map();
    VIM_COMMANDS.forEach(cmd => {
      this.commands.set(cmd.keys, cmd.action);
    });
  }
  
  getState(): VimState {
    return { ...this.state };
  }
  
  getMode(): VimMode {
    return this.state.mode;
  }
  
  setMode(mode: VimMode): void {
    this.state.mode = mode;
  }
  
  handleKey(key: string, editor: VimEditor): VimState | null {
    // 命令模式特殊处理
    if (this.state.mode === 'command') {
      if (key === 'Enter') {
        // 执行搜索
        this.state = { ...this.state, mode: 'normal' };
        return this.state;
      } else if (key === 'Escape') {
        this.state = { ...this.state, mode: 'normal', searchQuery: '' };
        return this.state;
      } else {
        this.state = { ...this.state, searchQuery: this.state.searchQuery + key };
        return this.state;
      }
    }
    
    // 插入模式直接返回
    if (this.state.mode === 'insert') {
      if (key === 'Escape' || key === 'Ctrl+[') {
        this.state = { ...this.state, mode: 'normal' };
        return this.state;
      }
      return null; // 不处理，让编辑器处理
    }
    
    // 数字计数
    if (/^[1-9]$/.test(key) && !this.state.count && !this.state.operator) {
      this.state = { ...this.state, count: key };
      return this.state;
    }
    if (/^\d$/.test(key) && this.state.count) {
      this.state = { ...this.state, count: this.state.count + key };
      return this.state;
    }
    
    // 累积按键
    this.keyBuffer += key;
    
    // 检查完整命令
    for (const [pattern, action] of this.commands) {
      // 处理带参数的命令 (如 m{a-z})
      if (pattern.includes('{')) {
        const prefix = pattern.slice(0, pattern.indexOf('{'));
        if (this.keyBuffer.startsWith(prefix) && this.keyBuffer.length === pattern.length - 2) {
          const newState = action(this.state, editor, this.keyBuffer);
          this.keyBuffer = '';
          if (newState) {
            this.state = { ...this.state, ...newState };
          }
          return this.state;
        }
      }
      
      // 精确匹配
      if (this.keyBuffer === pattern) {
        const newState = action(this.state, editor);
        this.keyBuffer = '';
        if (newState) {
          this.state = { ...this.state, ...newState };
        }
        return this.state;
      }
    }
    
    // 清除不匹配的缓冲区
    let hasMatch = false;
    for (const pattern of this.commands.keys()) {
      if (pattern.startsWith(this.keyBuffer)) {
        hasMatch = true;
        break;
      }
    }
    
    if (!hasMatch) {
      this.keyBuffer = '';
    }
    
    return this.state;
  }
  
  reset(): void {
    this.state = {
      mode: 'normal',
      register: '',
      count: '',
      operator: '',
      motion: '',
      searchQuery: '',
      searchDirection: 'forward',
      lastCommand: '',
      macroRecording: null,
      marks: new Map(),
    };
    this.keyBuffer = '';
  }
}

// 导出单例
export const vimModeManager = new VimModeManager();
