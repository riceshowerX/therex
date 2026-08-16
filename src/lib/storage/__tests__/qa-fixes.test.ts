/**
 * QA 回归验证：S8 存储迁移诚实化 + L3 级联删除 + M9 无偏密码生成
 *
 * - S8：migrateTo 对非 local 后端必须明确抛错（禁止"假迁移"空转）；
 *       local → local 保持配置且数据不丢失。
 * - L3：deleteFolder('cascade') 递归收集所有后代文件夹并删除其中文档，无孤儿。
 * - M9：generatePassword 使用 crypto.getRandomValues 拒绝采样，长度/字符集正确。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStorageManager, resetStorageManager } from '@/lib/storage/manager';
import { generatePassword } from '@/lib/secure-storage';

// 与既有 manager.test.ts 一致的 localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('S8 migrateTo 诚实化', () => {
  let storageManager: ReturnType<typeof getStorageManager>;

  beforeEach(() => {
    localStorageMock.clear();
    resetStorageManager();
    storageManager = getStorageManager();
    storageManager.initialize();
  });

  it('migrateTo("supabase") 应明确抛错（禁止假迁移）', async () => {
    await expect(storageManager.migrateTo('supabase')).rejects.toThrow(/尚未接入真实迁移能力/);
  });

  it('migrateTo("indexeddb") 应明确抛错', async () => {
    await expect(storageManager.migrateTo('indexeddb')).rejects.toThrow(/尚未接入真实迁移能力/);
  });

  it('migrateTo("local") 应成功且数据不丢失', async () => {
    const doc = storageManager.createDocument({ title: '数据', content: '# 内容' });
    const result = await storageManager.migrateTo('local', { provider: 'local', prefix: 'therex' });
    expect(result.success).toBeGreaterThan(0);
    expect(storageManager.getDocument(doc.id)?.title).toBe('数据');
  });
});

describe('L3 deleteFolder cascade 级联删除', () => {
  let storageManager: ReturnType<typeof getStorageManager>;

  beforeEach(() => {
    localStorageMock.clear();
    resetStorageManager();
    storageManager = getStorageManager();
    storageManager.initialize();
  });

  it('cascade 应删除所有后代文件夹中的文档，不产生孤儿', () => {
    const root = storageManager.createFolder({ name: '根' });
    const child = storageManager.createFolder({ name: '子', parentId: root.id });
    const grandchild = storageManager.createFolder({ name: '孙', parentId: child.id });

    const docRoot = storageManager.createDocument({ title: '根文档', folderId: root.id });
    const docChild = storageManager.createDocument({ title: '子文档', folderId: child.id });
    const docGrand = storageManager.createDocument({ title: '孙文档', folderId: grandchild.id });
    const docStandalone = storageManager.createDocument({ title: '独立文档', folderId: null });

    expect(storageManager.deleteFolder(root.id, 'cascade')).toBe(true);

    // 自身与后代文件夹全部删除
    expect(storageManager.getFolder(root.id)).toBeUndefined();
    expect(storageManager.getFolder(child.id)).toBeUndefined();
    expect(storageManager.getFolder(grandchild.id)).toBeUndefined();

    // 后代文件夹中的文档一并删除（无孤儿）
    expect(storageManager.getDocument(docRoot.id)).toBeUndefined();
    expect(storageManager.getDocument(docChild.id)).toBeUndefined();
    expect(storageManager.getDocument(docGrand.id)).toBeUndefined();

    // 根目录文档不受影响
    expect(storageManager.getDocument(docStandalone.id)).toBeDefined();
  });
});

describe('M9 generatePassword 无偏采样', () => {
  it('生成的密码长度正确且包含各类字符', () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generatePassword(24);
      expect(pwd.length).toBe(24);
      expect(pwd).toMatch(/[a-z]/);
      expect(pwd).toMatch(/[A-Z]/);
      expect(pwd).toMatch(/[0-9]/);
      expect(pwd).toMatch(/[^a-zA-Z0-9]/);
    }
  });

  it('多次生成不应出现明显重复（随机性冒烟）', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) set.add(generatePassword(16));
    expect(set.size).toBeGreaterThan(45);
  });
});
