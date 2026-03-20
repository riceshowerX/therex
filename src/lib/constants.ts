/**
 * 应用配置常量
 * 集中管理所有配置值，避免魔法值散落各处
 */

// ==================== 存储配置 ====================

/** 存储键前缀 */
export const STORAGE_PREFIX = 'therex';

/** 存储配置键 */
export const STORAGE_CONFIG_KEY = `${STORAGE_PREFIX}-storage-config`;

/** AI 配置存储键 */
export const AI_CONFIG_STORAGE_KEY = `${STORAGE_PREFIX}-ai-config`;

/** 最大版本历史数量 */
export const MAX_VERSION_HISTORY = 20;

/** 自动保存间隔（毫秒） */
export const AUTO_SAVE_INTERVAL_MS = 5 * 60 * 1000; // 5 分钟

/** 版本保存防抖间隔（毫秒） */
export const VERSION_SAVE_DEBOUNCE_MS = 5 * 60 * 1000; // 5 分钟

// ==================== 编辑器配置 ====================

/** 默认字体大小 */
export const DEFAULT_FONT_SIZE = 14;

/** 最小字体大小 */
export const MIN_FONT_SIZE = 10;

/** 最大字体大小 */
export const MAX_FONT_SIZE = 24;

/** 撤销历史最大条数 */
export const MAX_UNDO_HISTORY = 50;

/** 内容保存防抖（毫秒） */
export const CONTENT_SAVE_DEBOUNCE_MS = 500;

/** 文档列表刷新防抖（毫秒） */
export const DOCUMENT_LIST_REFRESH_DEBOUNCE_MS = 300;

// ==================== AI 配置 ====================

/** 默认温度参数 */
export const DEFAULT_AI_TEMPERATURE = 0.7;

/** 默认最大 Token 数 */
export const DEFAULT_MAX_TOKENS = 2048;

/** AI 请求超时（毫秒） */
export const AI_REQUEST_TIMEOUT_MS = 60 * 1000; // 60 秒

/** AI 流式响应缓冲大小 */
export const AI_STREAM_BUFFER_SIZE = 1024;

// ==================== API 配置 ====================

/** 最大请求体大小（字节） */
export const MAX_REQUEST_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

/** 最大内容长度（字符） */
export const MAX_CONTENT_LENGTH = 100000; // 100,000 字符

/** Rate Limit 窗口时间（毫秒） */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 分钟

/** Rate Limit 最大请求数 */
export const RATE_LIMIT_MAX_REQUESTS = 100;

// ==================== 阅读统计配置 ====================

/** 每分钟阅读字数（用于计算阅读时间） */
export const WORDS_PER_MINUTE = 200;

// ==================== UI 配置 ====================

/** 侧边栏宽度 */
export const SIDEBAR_WIDTH = 256; // 16rem = 256px

/** 侧边栏最小宽度 */
export const SIDEBAR_MIN_WIDTH = 200;

/** 侧边栏最大宽度 */
export const SIDEBAR_MAX_WIDTH = 400;

/** Toast 默认持续时间（毫秒） */
export const TOAST_DURATION_MS = 3000;

// ==================== 安全配置 ====================

/** 敏感字段列表（用于日志脱敏） */
export const SENSITIVE_FIELDS = [
  'password',
  'apiKey',
  'api_key',
  'token',
  'secret',
  'authorization',
  'credential',
  'privateKey',
  'private_key',
] as const;

// ==================== 版本信息 ====================

/** 应用版本 */
export const APP_VERSION = '1.6.0';

/** 数据格式版本 */
export const DATA_FORMAT_VERSION = '1.0.0';
