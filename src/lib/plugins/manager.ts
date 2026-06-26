/**
 * 插件系统
 * 支持插件注册、生命周期管理、API 暴露
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

// 编辑器上下文 - 由外部注入
export interface EditorContext {
  getContent: () => string;
  setContent: (content: string) => void;
  getSelection: () => { start: number; end: number; text: string };
  setSelection: (start: number, end: number) => void;
  insertText: (text: string) => void;
  onContentChange: (callback: (content: string) => void) => () => void;
}

// AI 上下文 - 由外部注入
export interface AIContext {
  complete: (prompt: string, options?: { systemPrompt?: string }) => Promise<string>;
  streamComplete: (prompt: string, onChunk: (chunk: string) => void, options?: { systemPrompt?: string }) => Promise<void>;
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
  editor: EditorContext;
  
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
  ai: AIContext;
  
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

// 插件定义（用于注册内置插件）
export interface PluginDefinition {
  manifest: PluginManifest;
  activate: (api: PluginAPI) => Promise<void> | void;
  deactivate?: () => Promise<void> | void;
}

// 权限请求回调
export type PermissionRequestCallback = (
  pluginId: string,
  pluginName: string,
  permissions: PluginPermission[]
) => Promise<boolean>;

// 通知回调
export type NotificationCallback = (
  message: string,
  type: 'info' | 'success' | 'warning' | 'error'
) => void;

// 插件管理器配置
export interface PluginManagerConfig {
  editorContext?: EditorContext;
  aiContext?: AIContext;
  onPermissionRequest?: PermissionRequestCallback;
  onNotification?: NotificationCallback;
}

// 插件管理器
export class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private modules: Map<string, PluginModule> = new Map();
  private apis: Map<string, PluginAPI> = new Map();
  private commandHandlers: Map<string, () => void> = new Map();
  private config: PluginManagerConfig;
  private static instance: PluginManager;

  private constructor(config: PluginManagerConfig = {}) {
    this.config = config;
  }

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  // 配置管理器
  configure(config: PluginManagerConfig): void {
    this.config = { ...this.config, ...config };
  }

  // 注册内置插件
  registerBuiltIn(definition: PluginDefinition): boolean {
    const { manifest, activate, deactivate } = definition;

    if (this.plugins.has(manifest.id)) {
      logger.warn(`Plugin ${manifest.id} is already registered`);
      return false;
    }

    this.plugins.set(manifest.id, {
      manifest,
      status: 'inactive',
      settings: this.loadDefaultSettings(manifest),
    });

    // 存储模块
    this.modules.set(manifest.id, {
      ...manifest,
      activate,
      deactivate,
    });

    logger.info(`Built-in plugin ${manifest.id} registered`);
    return true;
  }

  // 注册插件（从 manifest）
  async register(manifest: PluginManifest): Promise<boolean> {
    if (this.plugins.has(manifest.id)) {
      logger.warn(`Plugin ${manifest.id} is already registered`);
      return false;
    }

    // 验证权限
    if (manifest.permissions?.length) {
      const granted = await this.requestPermissions(manifest.id, manifest.name, manifest.permissions);
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

    // 创建空模块（外部插件需要通过 registerBuiltIn 注册实际代码）
    this.modules.set(manifest.id, manifest);

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

      // 获取模块
      const module = this.modules.get(pluginId);
      
      if (module?.activate) {
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
      const module = this.modules.get(pluginId);
      
      if (module?.deactivate) {
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
    this.modules.delete(pluginId);
    
    // 清理存储
    const prefix = `plugin:${pluginId}:`;
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => localStorage.removeItem(k));

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
    const module = this.modules.get(pluginId);
    if (module?.onSettingsChange) {
      module.onSettingsChange(instance.settings);
    }
  }

  // 获取命令列表
  getCommands(): PluginCommand[] {
    const commands: PluginCommand[] = [];
    for (const instance of this.plugins.values()) {
      if (instance.status === 'active' && instance.manifest.contributes?.commands) {
        commands.push(...instance.manifest.contributes.commands);
      }
    }
    return commands;
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
        getContent: () => this.config.editorContext?.getContent() ?? '',
        setContent: (content) => this.config.editorContext?.setContent(content),
        getSelection: () => this.config.editorContext?.getSelection() ?? { start: 0, end: 0, text: '' },
        setSelection: (start, end) => this.config.editorContext?.setSelection(start, end),
        insertText: (text) => this.config.editorContext?.insertText(text),
        onContentChange: (callback) => this.config.editorContext?.onContentChange(callback) ?? (() => {}),
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
          if (this.config.onNotification) {
            this.config.onNotification(message, type);
          } else {
            pluginLogger.info(`[${type}] ${message}`);
          }
        },
      },

      ai: {
        complete: async (prompt, options) => {
          if (this.config.aiContext) {
            return this.config.aiContext.complete(prompt, options);
          }
          throw new Error('AI context not configured');
        },
        streamComplete: async (prompt, onChunk, options) => {
          if (this.config.aiContext) {
            return this.config.aiContext.streamComplete(prompt, onChunk, options);
          }
          throw new Error('AI context not configured');
        },
      },

      network: {
        fetch: async (url, options) => {
          // 防止 SSRF：仅允许 https 协议，禁止访问内网/保留地址
          const ALLOWED_DOMAINS: string[] = [];
          try {
            const parsed = new URL(url);
            if (parsed.protocol !== 'https:') {
              throw new Error(`Plugin network access denied: only HTTPS protocol is allowed (got ${parsed.protocol})`);
            }
            const hostname = parsed.hostname;
            // 阻止内网/保留地址
            if (
              hostname === 'localhost' ||
              hostname === '127.0.0.1' ||
              hostname === '0.0.0.0' ||
              hostname.startsWith('192.168.') ||
              hostname.startsWith('10.') ||
              hostname.startsWith('172.16.') ||
              hostname.endsWith('.internal') ||
              hostname.endsWith('.local') ||
              // 云元数据端点
              hostname === '169.254.169.254' ||
              hostname.startsWith('169.254.') ||
              hostname.startsWith('fc00:') ||
              hostname.startsWith('fe80:')
            ) {
              throw new Error(`Plugin network access denied: private/reserved IP addresses are not allowed (${hostname})`);
            }
            // 如果配置了白名单，则仅允许白名单内的域名
            if (ALLOWED_DOMAINS.length > 0 && !ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
              throw new Error(`Plugin network access denied: ${hostname} is not in the allowed domain list`);
            }
          } catch (e) {
            if (e instanceof TypeError) {
              throw new Error(`Plugin network access denied: invalid URL`);
            }
            throw e;
          }
          return fetch(url, options);
        },
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

  private async requestPermissions(
    pluginId: string,
    pluginName: string,
    permissions: PluginPermission[]
  ): Promise<boolean> {
    if (this.config.onPermissionRequest) {
      return this.config.onPermissionRequest(pluginId, pluginName, permissions);
    }
    // 默认授权
    return true;
  }

  private loadDefaultSettings(manifest: PluginManifest): Record<string, unknown> {
    const settings: Record<string, unknown> = {};
    if (manifest.contributes?.settings) {
      for (const setting of manifest.contributes.settings) {
        settings[setting.key] = setting.default;
      }
    }
    
    // 尝试从 localStorage 加载已保存的设置
    const savedSettings = localStorage.getItem(`plugin:${manifest.id}:settings`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        Object.assign(settings, parsed);
      } catch {
        // 忽略解析错误
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
