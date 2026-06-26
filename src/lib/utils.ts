import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 生成唯一 ID
 * @param prefix ID 前缀，默认为 'id'
 * @returns 唯一 ID 字符串
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 计算字数（支持中英文）
 * @param content 文本内容
 * @returns 字数
 */
export function calculateWordCount(content: string): number {
  if (!content || !content.trim()) return 0;
  const words = content.trim().match(/[\w\u4e00-\u9fa5]+/g);
  return words ? words.length : 0;
}

/**
 * 获取当前时间戳
 * @returns 时间戳（毫秒）
 */
export function now(): number {
  return Date.now();
}
