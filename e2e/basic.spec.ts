/**
 * 基础交互测试
 * 测试编辑器的基础功能
 */

import { test, expect } from '@playwright/test';

test.describe('基础交互', () => {
  test('页面加载', async ({ page }) => {
    await page.goto('/');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/Therex|Markdown Editor/);
    
    // 检查关键元素
    await expect(page.locator('main')).toBeVisible();
  });

  test('键盘导航', async ({ page }) => {
    await page.goto('/');
    
    // 测试 Tab 键导航
    await page.keyboard.press('Tab');
    
    // 检查焦点
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('快捷键测试', async ({ page }) => {
    await page.goto('/');
    
    // 等待编辑器加载
    await page.waitForSelector('.w-md-editor', { timeout: 10000 });
    
    // 测试 Ctrl+S 保存
    await page.keyboard.press('Control+s');
    
    // 应该显示保存提示
    await page.waitForTimeout(500);
    
    // 测试 Ctrl+N 新建
    await page.keyboard.press('Control+n');
    await page.waitForTimeout(500);
  });
});

test.describe('Markdown 渲染', () => {
  test('标题渲染', async ({ page }) => {
    await page.goto('/');
    
    // 等待编辑器
    const editor = page.locator('.w-md-editor-text-input');
    await editor.waitFor({ timeout: 10000 });
    
    // 输入标题
    await editor.fill('# 一级标题\n## 二级标题\n### 三级标题');
    
    // 切换到预览模式
    await page.click('[data-testid="mode-preview"], button:has-text("预览")');
    await page.waitForTimeout(500);
    
    // 检查渲染结果
    const preview = page.locator('.w-md-editor-preview');
    await expect(preview.locator('h1')).toHaveText('一级标题');
    await expect(preview.locator('h2')).toHaveText('二级标题');
    await expect(preview.locator('h3')).toHaveText('三级标题');
  });

  test('列表渲染', async ({ page }) => {
    await page.goto('/');
    
    const editor = page.locator('.w-md-editor-text-input');
    await editor.waitFor({ timeout: 10000 });
    
    // 输入列表
    await editor.fill('- 项目 1\n- 项目 2\n- 项目 3');
    
    // 切换到预览
    await page.click('[data-testid="mode-preview"], button:has-text("预览")');
    await page.waitForTimeout(500);
    
    // 检查列表
    const preview = page.locator('.w-md-editor-preview');
    const items = preview.locator('ul li');
    await expect(items).toHaveCount(3);
  });

  test('代码块渲染', async ({ page }) => {
    await page.goto('/');
    
    const editor = page.locator('.w-md-editor-text-input');
    await editor.waitFor({ timeout: 10000 });
    
    // 输入代码块
    await editor.fill('```javascript\nconst hello = "world";\nconsole.log(hello);\n```');
    
    // 切换到预览
    await page.click('[data-testid="mode-preview"], button:has-text("预览")');
    await page.waitForTimeout(500);
    
    // 检查代码块
    const preview = page.locator('.w-md-editor-preview');
    await expect(preview.locator('pre code')).toBeVisible();
  });

  test('链接渲染', async ({ page }) => {
    await page.goto('/');
    
    const editor = page.locator('.w-md-editor-text-input');
    await editor.waitFor({ timeout: 10000 });
    
    // 输入链接
    await editor.fill('[测试链接](https://example.com)');
    
    // 切换到预览
    await page.click('[data-testid="mode-preview"], button:has-text("预览")');
    await page.waitForTimeout(500);
    
    // 检查链接
    const preview = page.locator('.w-md-editor-preview');
    const link = preview.locator('a');
    await expect(link).toHaveAttribute('href', 'https://example.com');
    await expect(link).toHaveText('测试链接');
  });
});

test.describe('自动保存', () => {
  test('内容变更触发自动保存', async ({ page }) => {
    await page.goto('/');
    
    const editor = page.locator('.w-md-editor-text-input');
    await editor.waitFor({ timeout: 10000 });
    
    // 输入内容
    await editor.fill('自动保存测试内容');
    
    // 等待自动保存（默认 500ms 延迟）
    await page.waitForTimeout(1000);
    
    // 刷新页面验证保存
    await page.reload();
    await editor.waitFor({ timeout: 10000 });
    
    // 检查内容是否保留
    const content = await editor.inputValue();
    expect(content).toContain('自动保存测试内容');
  });
});
