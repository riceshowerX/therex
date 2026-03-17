/**
 * Markdown 编辑器 E2E 测试
 * 测试核心功能：文档管理、编辑、保存
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Markdown 编辑器', () => {
  test.beforeEach(async ({ page }) => {
    // 访问主页
    await page.goto('/');
    
    // 等待编辑器加载完成
    await page.waitForSelector('[data-testid="markdown-editor"]', { timeout: 10000 });
  });

  test('应该成功加载编辑器', async ({ page }) => {
    // 检查编辑器是否存在
    const editor = page.locator('[data-testid="markdown-editor"]');
    await expect(editor).toBeVisible();
    
    // 检查工具栏是否存在
    const toolbar = page.locator('[data-testid="editor-toolbar"]');
    await expect(toolbar).toBeVisible();
    
    // 检查侧边栏是否存在
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
  });

  test('应该能够创建新文档', async ({ page }) => {
    // 点击新建文档按钮
    await page.click('[data-testid="new-document-btn"]');
    
    // 等待文档创建
    await page.waitForTimeout(500);
    
    // 检查是否有新文档
    const documentTitle = page.locator('[data-testid="document-title-input"]');
    await expect(documentTitle).toHaveValue(/未命名文档|无标题文档/);
  });

  test('应该能够编辑文档内容', async ({ page }) => {
    // 在编辑器中输入内容
    const editorTextarea = page.locator('.w-md-editor-text-input');
    await editorTextarea.fill('# 测试标题\n\n这是一个测试内容。');
    
    // 等待内容更新
    await page.waitForTimeout(500);
    
    // 检查内容是否更新
    const content = await editorTextarea.inputValue();
    expect(content).toContain('测试标题');
    expect(content).toContain('测试内容');
  });

  test('应该能够切换编辑模式', async ({ page }) => {
    // 切换到预览模式
    await page.click('[data-testid="mode-preview"]');
    await page.waitForTimeout(300);
    
    // 检查预览区域是否可见
    const preview = page.locator('.w-md-editor-preview');
    await expect(preview).toBeVisible();
    
    // 切换到编辑模式
    await page.click('[data-testid="mode-edit"]');
    await page.waitForTimeout(300);
    
    // 检查编辑器是否可见
    const editor = page.locator('.w-md-editor-text');
    await expect(editor).toBeVisible();
  });

  test('应该能够保存文档', async ({ page }) => {
    // 编辑内容
    const editorTextarea = page.locator('.w-md-editor-text-input');
    await editorTextarea.fill('# 测试保存功能\n\n测试内容');
    
    // 等待自动保存
    await page.waitForTimeout(1000);
    
    // 刷新页面
    await page.reload();
    
    // 等待编辑器加载
    await page.waitForSelector('[data-testid="markdown-editor"]');
    
    // 检查内容是否保留
    const content = await editorTextarea.inputValue();
    expect(content).toContain('测试保存功能');
  });

  test('应该能够使用模板创建文档', async ({ page }) => {
    // 打开模板对话框
    await page.click('[data-testid="templates-btn"]');
    
    // 等待对话框出现
    const templateDialog = page.locator('[data-testid="template-dialog"]');
    await expect(templateDialog).toBeVisible();
    
    // 选择一个模板
    await page.click('[data-testid="template-item"]:first-child');
    
    // 等待内容更新
    await page.waitForTimeout(500);
    
    // 检查编辑器是否有内容
    const editorTextarea = page.locator('.w-md-editor-text-input');
    const content = await editorTextarea.inputValue();
    expect(content.length).toBeGreaterThan(0);
  });

  test('应该能够切换主题', async ({ page }) => {
    // 获取当前主题
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('class');
    
    // 点击主题切换按钮
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(300);
    
    // 检查主题是否改变
    const newTheme = await html.getAttribute('class');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('应该能够调整字体大小', async ({ page }) => {
    // 获取当前字体大小
    const editorArea = page.locator('.w-md-editor');
    const initialFontSize = await editorArea.evaluate((el) => 
      window.getComputedStyle(el).fontSize
    );
    
    // 点击放大按钮
    await page.click('[data-testid="zoom-in-btn"]');
    await page.waitForTimeout(300);
    
    // 检查字体是否变大
    const newFontSize = await editorArea.evaluate((el) => 
      window.getComputedStyle(el).fontSize
    );
    expect(parseFloat(newFontSize)).toBeGreaterThan(parseFloat(initialFontSize));
  });

  test('应该能够导出文档', async ({ page }) => {
    // 编辑内容
    const editorTextarea = page.locator('.w-md-editor-text-input');
    await editorTextarea.fill('# 导出测试\n\n这是导出测试内容。');
    
    // 点击导出按钮
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-btn"]');
    const download = await downloadPromise;
    
    // 检查下载文件
    expect(download.suggestedFilename()).toContain('.md');
  });

  test('应该能够导入文档', async ({ page }) => {
    // 准备测试文件
    const testContent = '# 导入测试\n\n这是导入测试内容。';
    const file = {
      name: 'test-import.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from(testContent),
    };
    
    // 上传文件
    await page.setInputFiles('[data-testid="import-input"]', file);
    
    // 等待内容更新
    await page.waitForTimeout(500);
    
    // 检查内容是否正确导入
    const editorTextarea = page.locator('.w-md-editor-text-input');
    const content = await editorTextarea.inputValue();
    expect(content).toContain('导入测试');
  });
});

test.describe('文档管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="markdown-editor"]', { timeout: 10000 });
  });

  test('应该能够在文档列表中显示文档', async ({ page }) => {
    // 检查文档列表
    const documentList = page.locator('[data-testid="document-list"]');
    await expect(documentList).toBeVisible();
    
    // 检查是否有文档项
    const documentItems = page.locator('[data-testid="document-item"]');
    const count = await documentItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('应该能够切换文档', async ({ page }) => {
    // 创建两个文档
    await page.click('[data-testid="new-document-btn"]');
    await page.waitForTimeout(500);
    
    const editorTextarea = page.locator('.w-md-editor-text-input');
    await editorTextarea.fill('第一个文档');
    
    await page.click('[data-testid="new-document-btn"]');
    await page.waitForTimeout(500);
    
    await editorTextarea.fill('第二个文档');
    
    // 点击第一个文档
    await page.click('[data-testid="document-item"]:first-child');
    await page.waitForTimeout(500);
    
    // 检查内容是否切换
    const content = await editorTextarea.inputValue();
    expect(content).toBe('第一个文档');
  });

  test('应该能够删除文档', async ({ page }) => {
    // 创建一个新文档
    await page.click('[data-testid="new-document-btn"]');
    await page.waitForTimeout(500);
    
    // 获取文档数量
    const documentItems = page.locator('[data-testid="document-item"]');
    const initialCount = await documentItems.count();
    
    // 点击删除按钮
    await page.click('[data-testid="document-item"]:first-child [data-testid="delete-btn"]');
    
    // 确认删除
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // 等待删除完成
    await page.waitForTimeout(500);
    
    // 检查文档数量是否减少
    const newCount = await documentItems.count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('应该能够收藏文档', async ({ page }) => {
    // 点击收藏按钮
    await page.click('[data-testid="document-item"]:first-child [data-testid="favorite-btn"]');
    
    // 等待更新
    await page.waitForTimeout(300);
    
    // 检查收藏图标
    const favoriteIcon = page.locator('[data-testid="document-item"]:first-child [data-testid="favorite-icon"]');
    await expect(favoriteIcon).toBeVisible();
    
    // 检查是否在收藏列表中
    const favoriteSection = page.locator('[data-testid="favorite-documents"]');
    await expect(favoriteSection).toBeVisible();
  });

  test('应该能够创建文件夹', async ({ page }) => {
    // 切换到文件夹标签
    await page.click('[data-testid="folders-tab"]');
    
    // 点击新建文件夹按钮
    await page.click('[data-testid="new-folder-btn"]');
    
    // 输入文件夹名称
    await page.fill('[data-testid="folder-name-input"]', '测试文件夹');
    
    // 确认创建
    await page.click('[data-testid="confirm-create-folder-btn"]');
    
    // 等待创建完成
    await page.waitForTimeout(300);
    
    // 检查文件夹是否创建
    const folderItem = page.locator('[data-testid="folder-item"]');
    await expect(folderItem).toHaveText('测试文件夹');
  });
});

test.describe('AI 功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="markdown-editor"]', { timeout: 10000 });
  });

  test('应该能够打开 AI 助手面板', async ({ page }) => {
    // 点击 AI 助手按钮
    await page.click('[data-testid="ai-assistant-btn"]');
    
    // 等待面板打开
    const aiPanel = page.locator('[data-testid="ai-panel"]');
    await expect(aiPanel).toBeVisible();
  });

  test('应该能够发送 AI 对话', async ({ page }) => {
    // 打开 AI 面板
    await page.click('[data-testid="ai-assistant-btn"]');
    
    // 输入消息
    await page.fill('[data-testid="ai-chat-input"]', '帮我写一段介绍');
    
    // 发送消息
    await page.click('[data-testid="ai-send-btn"]');
    
    // 等待响应
    await page.waitForTimeout(2000);
    
    // 检查是否有 AI 响应
    const aiMessage = page.locator('[data-testid="ai-message"]');
    await expect(aiMessage).toBeVisible();
  });
});

test.describe('撤销/重做功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="markdown-editor"]', { timeout: 10000 });
  });

  test('应该能够撤销操作', async ({ page }) => {
    const editorTextarea = page.locator('.w-md-editor-text-input');
    
    // 输入内容
    await editorTextarea.fill('初始内容');
    await page.waitForTimeout(300);
    
    // 修改内容
    await editorTextarea.fill('修改后的内容');
    await page.waitForTimeout(300);
    
    // 撤销
    await page.click('[data-testid="undo-btn"]');
    await page.waitForTimeout(300);
    
    // 检查内容是否恢复
    const content = await editorTextarea.inputValue();
    expect(content).toBe('初始内容');
  });

  test('应该能够重做操作', async ({ page }) => {
    const editorTextarea = page.locator('.w-md-editor-text-input');
    
    // 输入内容
    await editorTextarea.fill('初始内容');
    await page.waitForTimeout(300);
    
    // 修改内容
    await editorTextarea.fill('修改后的内容');
    await page.waitForTimeout(300);
    
    // 撤销
    await page.click('[data-testid="undo-btn"]');
    await page.waitForTimeout(300);
    
    // 重做
    await page.click('[data-testid="redo-btn"]');
    await page.waitForTimeout(300);
    
    // 检查内容是否恢复
    const content = await editorTextarea.inputValue();
    expect(content).toBe('修改后的内容');
  });
});

test.describe('响应式设计', () => {
  test('在移动设备上应该正确显示', async ({ page }) => {
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 访问页面
    await page.goto('/');
    await page.waitForSelector('[data-testid="markdown-editor"]', { timeout: 10000 });
    
    // 检查编辑器是否可见
    const editor = page.locator('[data-testid="markdown-editor"]');
    await expect(editor).toBeVisible();
    
    // 检查侧边栏是否隐藏（移动端默认隐藏）
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).not.toBeVisible();
    
    // 点击菜单按钮应该显示侧边栏
    await page.click('[data-testid="menu-toggle-btn"]');
    await expect(sidebar).toBeVisible();
  });

  test('在平板设备上应该正确显示', async ({ page }) => {
    // 设置平板设备视口
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // 访问页面
    await page.goto('/');
    await page.waitForSelector('[data-testid="markdown-editor"]', { timeout: 10000 });
    
    // 检查编辑器和侧边栏
    const editor = page.locator('[data-testid="markdown-editor"]');
    await expect(editor).toBeVisible();
    
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
  });
});

test.describe('性能测试', () => {
  test('大文件编辑性能', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="markdown-editor"]', { timeout: 10000 });
    
    // 生成大文件内容
    const largeContent = Array(1000).fill('# 标题\n\n这是一段测试内容。').join('\n');
    
    const editorTextarea = page.locator('.w-md-editor-text-input');
    
    // 测量输入时间
    const startTime = Date.now();
    await editorTextarea.fill(largeContent);
    const endTime = Date.now();
    
    // 检查输入时间是否合理（小于 2 秒）
    expect(endTime - startTime).toBeLessThan(2000);
    
    // 检查编辑器是否响应
    const content = await editorTextarea.inputValue();
    expect(content.length).toBe(largeContent.length);
  });

  test('快速切换文档性能', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="markdown-editor"]', { timeout: 10000 });
    
    // 创建多个文档
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="new-document-btn"]');
      await page.waitForTimeout(200);
      
      const editorTextarea = page.locator('.w-md-editor-text-input');
      await editorTextarea.fill(`文档 ${i + 1} 的内容`);
      await page.waitForTimeout(200);
    }
    
    // 快速切换文档并测量时间
    const documentItems = page.locator('[data-testid="document-item"]');
    const startTime = Date.now();
    
    for (let i = 0; i < 5; i++) {
      await documentItems.nth(i).click();
      await page.waitForTimeout(100);
    }
    
    const endTime = Date.now();
    
    // 检查切换时间是否合理（每次小于 200ms）
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
