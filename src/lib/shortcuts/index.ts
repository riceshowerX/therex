/**
 * 全局快捷键管理器
 * 支持组合键、作用域、冲突检测和自定义处理
 */

export interface ShortcutDefinition {
  id: string;
  key: string;
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  description: string;
  category?: string;
  action: () => void | boolean; // 返回 false 阻止默认行为
  scope?: string; // 快捷键作用域
  enabled?: boolean | (() => boolean);
  preventDefault?: boolean;
  stopPropagation?: boolean;
  when?: () => boolean; // 条件执行
}

interface RegisteredShortcut extends ShortcutDefinition {
  isRegistered: boolean;
}

type ShortcutMap = Map<string, RegisteredShortcut[]>;
type ScopeChangeListener = (scope: string) => void;

class ShortcutManager {
  private static instance: ShortcutManager;
  private shortcuts: ShortcutMap = new Map();
  private currentScope: string = 'global';
  private scopeListeners: ScopeChangeListener[] = [];
  private isPaused: boolean = false;
  private lastKeyTime: number = 0;
  private keySequence: string[] = [];
  private sequenceTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.attachListeners();
    }
  }

  static getInstance(): ShortcutManager {
    if (!ShortcutManager.instance) {
      ShortcutManager.instance = new ShortcutManager();
    }
    return ShortcutManager.instance;
  }

  /**
   * 注册快捷键
   */
  register(definition: ShortcutDefinition): () => void {
    const key = this.normalizeKey(definition.key);
    const existing = this.shortcuts.get(key) || [];

    const shortcut: RegisteredShortcut = {
      ...definition,
      isRegistered: true,
    };

    existing.push(shortcut);
    this.shortcuts.set(key, existing);

    // 返回取消注册函数
    return () => this.unregister(definition.id);
  }

  /**
   * 批量注册快捷键
   */
  registerAll(definitions: ShortcutDefinition[]): () => void {
    const unregisterFns = definitions.map(def => this.register(def));
    return () => unregisterFns.forEach(fn => fn());
  }

  /**
   * 取消注册快捷键
   */
  unregister(id: string): boolean {
    for (const [key, shortcuts] of this.shortcuts) {
      const index = shortcuts.findIndex(s => s.id === id);
      if (index !== -1) {
        shortcuts.splice(index, 1);
        if (shortcuts.length === 0) {
          this.shortcuts.delete(key);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * 设置当前作用域
   */
  setScope(scope: string): void {
    if (this.currentScope !== scope) {
      this.currentScope = scope;
      this.scopeListeners.forEach(listener => listener(scope));
    }
  }

  /**
   * 获取当前作用域
   */
  getScope(): string {
    return this.currentScope;
  }

  /**
   * 订阅作用域变化
   */
  onScopeChange(listener: ScopeChangeListener): () => void {
    this.scopeListeners.push(listener);
    return () => {
      this.scopeListeners = this.scopeListeners.filter(l => l !== listener);
    };
  }

  /**
   * 暂停快捷键处理
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * 恢复快捷键处理
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * 检查快捷键是否已注册
   */
  isRegistered(id: string): boolean {
    for (const shortcuts of this.shortcuts.values()) {
      if (shortcuts.some(s => s.id === id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取所有已注册的快捷键
   */
  getAllShortcuts(): RegisteredShortcut[] {
    const all: RegisteredShortcut[] = [];
    for (const shortcuts of this.shortcuts.values()) {
      all.push(...shortcuts);
    }
    return all;
  }

  /**
   * 按分类获取快捷键
   */
  getShortcutsByCategory(): Map<string, RegisteredShortcut[]> {
    const categories = new Map<string, RegisteredShortcut[]>();
    
    for (const shortcut of this.getAllShortcuts()) {
      const category = shortcut.category || 'general';
      const existing = categories.get(category) || [];
      existing.push(shortcut);
      categories.set(category, existing);
    }

    return categories;
  }

  /**
   * 触发快捷键（编程方式）
   */
  trigger(id: string): boolean {
    for (const shortcuts of this.shortcuts.values()) {
      const shortcut = shortcuts.find(s => s.id === id);
      if (shortcut && this.isShortcutEnabled(shortcut)) {
        const result = shortcut.action();
        return result !== false;
      }
    }
    return false;
  }

  /**
   * 导出快捷键配置
   */
  exportConfig(): Omit<ShortcutDefinition, 'action'>[] {
    return this.getAllShortcuts().map(s => ({
      id: s.id,
      key: s.key,
      modifiers: s.modifiers,
      description: s.description,
      category: s.category,
      scope: s.scope,
      preventDefault: s.preventDefault,
    }));
  }

  // 私有方法

  private attachListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this) as EventListener);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.isPaused) return;

    // 忽略在输入框中的按键（除非明确指定）
    const target = event.target as HTMLElement;
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
      target.isContentEditable;

    const key = this.normalizeKey(event.key);
    const shortcuts = this.shortcuts.get(key);

    if (!shortcuts) {
      // 检查是否是按键序列
      this.handleKeySequence(key);
      return;
    }

    // 找到匹配的快捷键
    for (const shortcut of shortcuts) {
      if (!this.isShortcutEnabled(shortcut)) continue;
      if (!this.matchesModifiers(event, shortcut)) continue;
      if (!this.matchesScope(shortcut)) continue;
      if (!this.checkCondition(shortcut)) continue;

      // 如果是输入框，只执行明确标记为在输入框中有效的快捷键
      if (isInputFocused && shortcut.scope !== 'input') {
        continue;
      }

      // 执行快捷键
      try {
        const result = shortcut.action();

        if (shortcut.preventDefault !== false && result !== false) {
          event.preventDefault();
        }

        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }
      } catch (error) {
        console.error(`Shortcut "${shortcut.id}" execution failed:`, error);
      }

      break;
    }

    // 处理按键序列
    this.handleKeySequence(key);
  }

  private normalizeKey(key: string): string {
    return key.toLowerCase();
  }

  private matchesModifiers(event: KeyboardEvent, shortcut: RegisteredShortcut): boolean {
    const mods = shortcut.modifiers || {};

    // Ctrl 或 Meta (Mac)
    const needsCtrl = mods.ctrl === true;
    const hasCtrl = event.ctrlKey || event.metaKey;

    if (needsCtrl && !hasCtrl) return false;
    if (!needsCtrl && hasCtrl && !mods.meta) return false;

    // Alt
    if (mods.alt === true && !event.altKey) return false;
    if (mods.alt === false && event.altKey) return false;

    // Shift
    if (mods.shift === true && !event.shiftKey) return false;
    if (mods.shift === false && event.shiftKey) return false;

    // Meta
    if (mods.meta === true && !event.metaKey) return false;

    return true;
  }

  private matchesScope(shortcut: RegisteredShortcut): boolean {
    if (!shortcut.scope) return true;
    return shortcut.scope === this.currentScope || shortcut.scope === 'global';
  }

  private isShortcutEnabled(shortcut: RegisteredShortcut): boolean {
    if (shortcut.enabled === undefined) return true;
    if (typeof shortcut.enabled === 'function') {
      return shortcut.enabled();
    }
    return shortcut.enabled;
  }

  private checkCondition(shortcut: RegisteredShortcut): boolean {
    if (!shortcut.when) return true;
    return shortcut.when();
  }

  private handleKeySequence(key: string): void {
    const now = Date.now();

    // 如果超过 500ms 没按键，重置序列
    if (now - this.lastKeyTime > 500) {
      this.keySequence = [];
    }

    this.lastKeyTime = now;
    this.keySequence.push(key);

    // 只保留最近 5 个按键
    if (this.keySequence.length > 5) {
      this.keySequence.shift();
    }

    // 清除之前的超时
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
    }

    // 设置超时以重置序列
    this.sequenceTimeout = setTimeout(() => {
      this.keySequence = [];
    }, 1000);
  }
}

// 预定义的编辑器快捷键
export const EDITOR_SHORTCUTS: ShortcutDefinition[] = [
  // 文档操作
  {
    id: 'document.new',
    key: 'n',
    modifiers: { ctrl: true },
    description: '新建文档',
    category: '文档',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'document.save',
    key: 's',
    modifiers: { ctrl: true },
    description: '保存文档',
    category: '文档',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'document.saveVersion',
    key: 's',
    modifiers: { ctrl: true, shift: true },
    description: '保存版本',
    category: '文档',
    action: () => {
      // 由组件提供实现
    },
  },

  // 编辑操作
  {
    id: 'edit.undo',
    key: 'z',
    modifiers: { ctrl: true },
    description: '撤销',
    category: '编辑',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'edit.redo',
    key: 'z',
    modifiers: { ctrl: true, shift: true },
    description: '重做',
    category: '编辑',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'edit.redo.alt',
    key: 'y',
    modifiers: { ctrl: true },
    description: '重做（备用）',
    category: '编辑',
    action: () => {
      // 由组件提供实现
    },
  },

  // 查找替换
  {
    id: 'search.find',
    key: 'f',
    modifiers: { ctrl: true },
    description: '查找',
    category: '搜索',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'search.replace',
    key: 'h',
    modifiers: { ctrl: true },
    description: '替换',
    category: '搜索',
    action: () => {
      // 由组件提供实现
    },
  },

  // 视图
  {
    id: 'view.toggleSidebar',
    key: 'b',
    modifiers: { ctrl: true },
    description: '切换侧边栏',
    category: '视图',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'view.togglePreview',
    key: 'p',
    modifiers: { ctrl: true },
    description: '切换预览模式',
    category: '视图',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'view.fullscreen',
    key: 'F11',
    description: '全屏',
    category: '视图',
    action: () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    },
  },

  // AI 功能
  {
    id: 'ai.chat',
    key: 'k',
    modifiers: { ctrl: true },
    description: '打开 AI 对话',
    category: 'AI',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'ai.continue',
    key: 'Enter',
    modifiers: { ctrl: true },
    description: 'AI 续写',
    category: 'AI',
    action: () => {
      // 由组件提供实现
    },
  },

  // 格式化
  {
    id: 'format.bold',
    key: 'b',
    modifiers: { ctrl: true },
    description: '加粗',
    category: '格式',
    scope: 'input',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'format.italic',
    key: 'i',
    modifiers: { ctrl: true },
    description: '斜体',
    category: '格式',
    scope: 'input',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'format.code',
    key: '`',
    modifiers: { ctrl: true },
    description: '代码',
    category: '格式',
    scope: 'input',
    action: () => {
      // 由组件提供实现
    },
  },
  {
    id: 'format.link',
    key: 'k',
    modifiers: { ctrl: true },
    description: '链接',
    category: '格式',
    scope: 'input',
    action: () => {
      // 由组件提供实现
    },
  },

  // 导出
  {
    id: 'export.markdown',
    key: 'e',
    modifiers: { ctrl: true, shift: true },
    description: '导出为 Markdown',
    category: '导出',
    action: () => {
      // 由组件提供实现
    },
  },

  // 帮助
  {
    id: 'help.shortcuts',
    key: '/',
    modifiers: { ctrl: true },
    description: '显示快捷键列表',
    category: '帮助',
    action: () => {
      // 由组件提供实现
    },
  },
];

// 导出单例
export const shortcutManager = ShortcutManager.getInstance();

// 导出类
export { ShortcutManager };
