/**
 * 插件系统
 * 支持插件加载、生命周期管理、API 暴露
 */

'use client';

import { createLogger } from '@/lib/logger';

const logger = createLogger('plugin-system');

// 插件元数据
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  main: string;
  icon?: string;
  keywords?: string[];
  license?: string;
  minAppVersion?: string;
  permissions?: PluginPermission[];
  contributes?: {
    commands?: PluginCommand[];
    menus?: PluginMenu[];
    themes?: PluginTheme[];
    settings?: PluginSetting[];
  };
}

// 插件权限
export type PluginPermission = 
  | 'storage'
  | 'network'
  | 'clipboard'
  | 'notifications'
  | 'editor'
  | 'files'
  | 'ai';

// 插件命令
export interface PluginCommand {
  id: string;
  title: string;
  category?: string;
  icon?: string;
  keybinding?: string;
  when?: string;
  handler: string; // 函数名
}

// 插件菜单
export interface PluginMenu {
  id: string;
  title: string;
  location: 'editor-toolbar' | 'sidebar' | 'context-menu' | 'status-bar';
  icon?: string;
  order?: number;
  action: string;
}

// 插件主题
export interface PluginTheme {
  id: string;
  label: string;
  description?: string;
  colors: Record<string, string>;
}

// 插件设置
export interface PluginSetting {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color';
  label: string;
  description?: string;
  default: unknown;
  options?: Array<{ label: string; value: unknown }>;
}

// 插件状态
export type PluginStatus = 'inactive' | 'activating' | 'active' | 'deactivating' | 'error';

// 插件实例
export interface PluginInstance {
  manifest: PluginManifest;
  status: PluginStatus;
  error?: string;
  settings: Record<string, unknown>;
  activatedAt?: number;
}

// 插件 API（暴露给插件使用）
export interface PluginAPI {
  // 存储
  storage: {
    get: <T>(key: string) => Promise<T | null>;
    set: <T>(key: string, value: T) => Promise<void>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  
  // 编辑器
  editor: {
    getContent: () => string;
    setContent: (content: string) => void;
    getSelection: () => { start: number; end: number; text: string };
    setSelection: (start: number, end: number) => void;
    insertText: (text: string) => void;
    onContentChange: (callback: (content: string) => void) => () => void;
  };
  
  // 命令
  commands: {
    register: (command: PluginCommand, handler: () => void) => () => void;
    execute: (commandId: string) => void;
  };
  
  // 通知
  notifications: {
    show: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  };
  
  // AI
  ai: {
    complete: (prompt: string, options?: { systemPrompt?: string }) => Promise<string>;
    streamComplete: (prompt: string, onChunk: (chunk: string) => void, options?: { systemPrompt?: string }) => Promise<void>;
  };
  
  // 网络
  network: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
  };
  
  // 剪贴板
  clipboard: {
    read: () => Promise<string>;
    write: (text: string) => Promise<void>;
  };
  
  // 日志
  logger: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
}

// 插件生命周期钩子
export interface PluginHooks {
  activate?: (api: PluginAPI) => Promise<void> | void;
  deactivate?: () => Promise<void> | void;
  onSettingsChange?: (settings: Record<string, unknown>) => void;
}

// 插件模块类型
export type PluginModule = PluginManifest & PluginHooks;

// 插件管理器
export class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private apis: Map<string, PluginAPI> = new Map();
  private commandHandlers: Map<string, () => void> = new Map();
  private static instance: PluginManager;

  private constructor() {}

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  // 注册插件
  async register(manifest: PluginManifest): Promise<boolean> {
    if (this.plugins.has(manifest.id)) {
      logger.warn(`Plugin ${manifest.id} is already registered`);
      return false;
    }

    // 验证权限
    if (manifest.permissions?.length) {
      const granted = await this.requestPermissions(manifest.permissions);
      if (!granted) {
        logger.warn(`Permission denied for plugin ${manifest.id}`);
        return false;
      }
    }

    this.plugins.set(manifest.id, {
      manifest,
      status: 'inactive',
      settings: this.loadDefaultSettings(manifest),
    });

    logger.info(`Plugin ${manifest.id} registered`);
    return true;
  }

  // 激活插件
  async activate(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      logger.error(`Plugin ${pluginId} not found`);
      return false;
    }

    if (instance.status === 'active') {
      return true;
    }

    instance.status = 'activating';

    try {
      // 创建 API
      const api = this.createAPI(pluginId);
      this.apis.set(pluginId, api);

      // 加载插件模块
      const module = await this.loadPluginModule(instance.manifest);
      
      if (module.activate) {
        await module.activate(api);
      }

      // 注册命令
      if (instance.manifest.contributes?.commands) {
        for (const cmd of instance.manifest.contributes.commands) {
          const handler = (module as unknown as Record<string, () => void>)[cmd.handler];
          if (handler) {
            this.commandHandlers.set(cmd.id, handler);
          }
        }
      }

      instance.status = 'active';
      instance.activatedAt = Date.now();
      instance.error = undefined;

      logger.info(`Plugin ${pluginId} activated`);
      return true;
    } catch (error) {
      instance.status = 'error';
      instance.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to activate plugin ${pluginId}`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  // 停用插件
  async deactivate(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId);
    if (!instance || instance.status !== 'active') {
      return false;
    }

    instance.status = 'deactivating';

    try {
      const module = await this.loadPluginModule(instance.manifest);
      
      if (module.deactivate) {
        await module.deactivate();
      }

      // 清理命令
      if (instance.manifest.contributes?.commands) {
        for (const cmd of instance.manifest.contributes.commands) {
          this.commandHandlers.delete(cmd.id);
        }
      }

      this.apis.delete(pluginId);
      instance.status = 'inactive';

      logger.info(`Plugin ${pluginId} deactivated`);
      return true;
    } catch (error) {
      instance.status = 'error';
      instance.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to deactivate plugin ${pluginId}`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  // 卸载插件
  async uninstall(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      return false;
    }

    if (instance.status === 'active') {
      await this.deactivate(pluginId);
    }

    this.plugins.delete(pluginId);
    logger.info(`Plugin ${pluginId} uninstalled`);
    return true;
  }

  // 执行命令
  executeCommand(commandId: string): void {
    const handler = this.commandHandlers.get(commandId);
    if (handler) {
      handler();
    } else {
      logger.warn(`Command ${commandId} not found`);
    }
  }

  // 获取插件列表
  getPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  // 获取插件实例
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  // 更新插件设置
  updateSettings(pluginId: string, settings: Record<string, unknown>): void {
    const instance = this.plugins.get(pluginId);
    if (!instance) return;

    instance.settings = { ...instance.settings, ...settings };
    
    // 保存设置
    this.saveSettings(pluginId, instance.settings);

    // 触发设置变更
    const module = this.loadPluginModule(instance.manifest);
    module.then(m => {
      if (m.onSettingsChange) {
        m.onSettingsChange(instance.settings);
      }
    });
  }

  // 私有方法

  private createAPI(pluginId: string): PluginAPI {
    const pluginLogger = createLogger(`plugin:${pluginId}`);

    return {
      storage: {
        get: async <T>(key: string) => {
          const fullKey = `plugin:${pluginId}:${key}`;
          const value = localStorage.getItem(fullKey);
          return value ? JSON.parse(value) as T : null;
        },
        set: async <T>(key: string, value: T) => {
          const fullKey = `plugin:${pluginId}:${key}`;
          localStorage.setItem(fullKey, JSON.stringify(value));
        },
        remove: async (key: string) => {
          const fullKey = `plugin:${pluginId}:${key}`;
          localStorage.removeItem(fullKey);
        },
        clear: async () => {
          const prefix = `plugin:${pluginId}:`;
          Object.keys(localStorage)
            .filter(k => k.startsWith(prefix))
            .forEach(k => localStorage.removeItem(k));
        },
      },

      editor: {
        getContent: () => '',
        setContent: () => {},
        getSelection: () => ({ start: 0, end: 0, text: '' }),
        setSelection: () => {},
        insertText: () => {},
        onContentChange: () => () => {},
      },

      commands: {
        register: (command, handler) => {
          this.commandHandlers.set(command.id, handler);
          return () => this.commandHandlers.delete(command.id);
        },
        execute: (commandId) => this.executeCommand(commandId),
      },

      notifications: {
        show: (message, type = 'info') => {
          // 集成 toast
          console.log(`[${type}] ${message}`);
        },
      },

      ai: {
        complete: async () => '',
        streamComplete: async () => {},
      },

      network: {
        fetch: async (url, options) => fetch(url, options),
      },

      clipboard: {
        read: async () => navigator.clipboard.readText(),
        write: async (text) => navigator.clipboard.writeText(text),
      },

      logger: {
        debug: (msg) => pluginLogger.debug(msg),
        info: (msg) => pluginLogger.info(msg),
        warn: (msg) => pluginLogger.warn(msg),
        error: (msg) => pluginLogger.error(msg),
      },
    };
  }

  private async loadPluginModule(manifest: PluginManifest): Promise<PluginModule> {
    // 在实际实现中，这里应该动态加载插件代码
    // 当前返回一个空模块作为示例
    return manifest as PluginModule;
  }

  private async requestPermissions(permissions: PluginPermission[]): Promise<boolean> {
    // 在实际实现中，应该弹出权限请求对话框
    // 当前默认授权
    console.log('Requesting permissions:', permissions);
    return true;
  }

  private loadDefaultSettings(manifest: PluginManifest): Record<string, unknown> {
    const settings: Record<string, unknown> = {};
    if (manifest.contributes?.settings) {
      for (const setting of manifest.contributes.settings) {
        settings[setting.key] = setting.default;
      }
    }
    return settings;
  }

  private saveSettings(pluginId: string, settings: Record<string, unknown>): void {
    localStorage.setItem(`plugin:${pluginId}:settings`, JSON.stringify(settings));
  }
}

// 导出单例
export const pluginManager = PluginManager.getInstance();
