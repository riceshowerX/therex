# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2025-03-20

### 🚀 功能扩展

#### 🤖 AI 功能增强
- 新增 AI 使用统计追踪器（Token 统计、成本计算）
- 新增 AI 对话历史管理器（会话持久化、历史搜索）
- 新增 AI 提示词模板库（20+ 内置模板、自定义模板支持）
- 支持多模型定价计算（OpenAI、Claude、DeepSeek、Kimi、豆包）

#### 📝 编辑器优化
- 新增可视化表格编辑器（行列操作、对齐方式调整）
- 新增图片上传组件（拖拽上传、URL 导入、粘贴上传）
- 新增 Vim 模式支持（常用 Vim 命令、模式指示器）

#### 📱 移动端适配
- 新增移动端响应式导航组件
- 新增移动端底部工具栏
- 新增手势操作支持（滑动、双击、长按）

#### 🔗 协作与分享
- 新增文档分享功能（公开/私密分享、密码保护）
- 支持分享有效期设置
- 支持访客权限控制（下载、复制）

#### 🔍 高级功能
- 新增全文搜索组件（内容搜索、高级过滤、搜索历史）
- 新增标签管理系统（标签创建、颜色自定义、标签统计）
- 新增仪表盘组件（统计数据、活动热力图、字数排行）

#### 🔒 数据安全
- 新增密码保护功能（Web Crypto API 加密）
- 新增加密存储支持（AES-GCM 加密算法）
- 新增密码强度检测
- 新增随机密码生成器

#### 📤 导出扩展
- 新增多格式导出支持（Markdown、HTML、TXT）
- 新增文档格式导出（DOCX、EPUB、PDF）
- 新增图片导出（PNG、JPG）
- 支持导出选项配置（页面设置、字体大小、图片质量）

### 📦 新增组件

- `src/lib/ai-usage-tracker.ts` - AI 使用统计
- `src/lib/ai-chat-history.ts` - AI 对话历史
- `src/lib/ai-prompt-templates.ts` - AI 提示词模板
- `src/lib/vim-mode.ts` - Vim 模式支持
- `src/lib/secure-storage.ts` - 加密存储
- `src/components/editor/TableEditor.tsx` - 表格编辑器
- `src/components/editor/ImageUploader.tsx` - 图片上传
- `src/components/mobile/MobileNav.tsx` - 移动端导航
- `src/components/share/ShareDialog.tsx` - 文档分享
- `src/components/search/FullTextSearch.tsx` - 全文搜索
- `src/components/tags/TagManager.tsx` - 标签管理
- `src/components/dashboard/Dashboard.tsx` - 仪表盘
- `src/components/export/DocumentExporter.tsx` - 文档导出
- `src/components/ui/popover.tsx` - Popover 组件
- `src/components/ui/table.tsx` - Table 组件
- `src/components/ui/command.tsx` - Command 组件

## [1.4.0] - 2025-03-19

### 🎨 UI 设计优化

#### 🎨 主题重构
- 重新设计主题色彩，采用温暖翠绿色作为主色调
- 优化浅色/深色模式配色方案
- 添加自定义滚动条样式
- 增强文本选择高亮效果

#### 📐 布局优化
- 优化侧边栏布局：添加品牌标识、改进文档列表样式
- 改进顶部工具栏：添加毛玻璃效果、优化按钮分组
- 优化底部状态栏：重新设计统计数据展示
- 增强目录侧边栏样式
- 优化设置页面布局和卡片样式

#### 💬 组件优化
- 改进 AI 面板消息气泡样式
- 优化头像样式和渐变背景
- 添加全局过渡动画效果

### 🔒 安全修复

#### 依赖安全更新
- 添加 40+ 依赖安全覆盖（overrides）修复已知漏洞
- 修复严重（Critical）和高危（High）漏洞
- 更新 semver, path-to-regexp, tough-cookie 等关键依赖
- 更新 undici, follow-redirects, cross-spawn 等网络依赖
- 更新 dompurify, prismjs 等前端安全相关依赖

### 🐛 Bug 修复

- 修复设置按钮无法打开设置页面的问题
- 修复 Next.js middleware 弃用警告（重命名为 proxy）
- 修复 lockfile 检测警告（添加 outputFileTracingRoot 配置）

### 📦 其他更新

- 更新项目 logo 和 icon 为 GitHub 项目官方图标
- 更新依赖到最新兼容版本

## [1.3.0] - 2025-03-16

### 🚀 生产环境优化

#### 🔒 安全增强
- 添加安全响应头（CSP、HSTS、X-Frame-Options 等）
- 实现内容安全策略（Content Security Policy）
- 添加权限策略限制
- 配置引用策略

#### ⚡ 性能优化
- 配置图片优化（AVIF、WebP 格式）
- 启用静态资源长期缓存
- 配置包导入优化（lucide-react、marked 等）
- 启用 Tree Shaking 和代码压缩
- 移除生产环境 console.log

#### 🔍 SEO 优化
- 创建 sitemap.ts 自动生成站点地图
- 创建 robots.ts 配置搜索引擎爬虫
- 增强元数据配置（OpenGraph、Twitter Card）
- 添加搜索引擎索引配置

#### 📊 监控与日志
- 创建结构化日志系统（src/lib/logger.ts）
- 敏感信息自动脱敏
- 创建全局错误页面（global-error.tsx）
- 添加加载状态组件

#### 🐳 部署优化
- 创建 Dockerfile（多阶段构建）
- 创建 docker-compose.yml
- 创建 .dockerignore
- 配置 standalone 输出模式
- 移除 X-Powered-By 响应头

#### 📝 文档更新
- 更新 .env.example 配置示例
- 移除 react-dev-inspector 依赖

## [1.2.0] - 2025-03-16

### 🎨 美化与优化

#### 📖 README 全新改版
- 全新设计的 README 布局，更加美观专业
- 添加功能对比表格，突出项目优势
- 添加技术栈图标展示
- 添加详细的功能说明和快捷键表格
- 添加项目路线图和贡献指南

#### 🖼️ 新 Logo
- 生成特蕾西娅风格的魔王皇冠 Logo
- 深紫色与金色的优雅配色
- 极简风格，适合作为应用图标

#### 🔧 配置优化
- 更新 manifest.json 使用新 Logo
- 添加 Turbopack 配置以兼容 Next.js 16 部署

### 🐛 Bug 修复

- 修复 Vercel 部署时 Turbopack 配置冲突问题

## [1.1.0] - 2025-03-16

### ✨ 新功能

#### 🌐 国际化支持 (i18n)
- 支持中英文切换
- 自动检测浏览器语言
- 语言设置持久化到 localStorage
- 类型安全的翻译系统

#### 📱 PWA 安装功能增强
- 设置页面新增 PWA 安装卡片
- 显示安装状态（已安装/可安装/不支持）
- 一键安装按钮
- PWA 功能说明（离线可用、桌面快捷方式、推送通知）

### 🐛 Bug 修复

- **修复代码高亮功能** - 集成 highlight.js 替代 react-syntax-highlighter，解决代码高亮失效问题
- **修复目录跳转功能** - 为标题添加 id 属性，优化 ScrollArea 容器内的滚动逻辑
- **修复收藏功能重复显示** - 收藏文档仅在收藏区显示，避免重复出现在所有文档列表
- **修复 Hydration 不匹配问题** - 设置页面的主题和语言选择器在客户端挂载后才渲染

### 🔧 重构与优化

- **存储适配器模式** - 抽象存储层，支持多种存储后端（本地存储、IndexedDB、Supabase）
- **统一类型定义** - 创建 `src/types/index.ts` 作为唯一类型源
- **重构存储层** - 创建 `src/lib/storage/manager.ts` 统一存储管理器
- **拆分巨型组件** - 将 `markdown-editor.tsx` 的业务逻辑提取到自定义 Hooks
- **优化字数统计** - 使用正则表达式替代 split 方法，提升中英文混合统计准确性
- **代码清理** - 移除未使用的导入和函数

### 🔒 安全性

- 更新依赖包修复安全漏洞

## [1.0.0] - 2025-03-16

### 🎉 First Release

Therex 是一款功能丰富、界面现代的 Markdown 在线编辑器，集成 AI 智能写作助手。

> 名字来源于明日方舟中的特蕾西亚，象征着优雅与力量。

### ✨ 核心功能

#### 📝 编辑器
- **实时预览** - 支持 GitHub 风格 Markdown，所见即所得
- **语法高亮** - 代码块支持多种编程语言高亮显示
- **多视图模式** - 编辑模式、预览模式、分屏模式自由切换
- **字体调节** - 编辑器字体大小可调节（10-24px）
- **深色主题** - 支持浅色/深色主题，自动跟随系统
- **目录导航** - 自动生成文档目录，快速跳转

#### 📐 数学公式与图表
- **KaTeX** - 支持 LaTeX 数学公式渲染
- **Mermaid** - 支持流程图、时序图、类图、甘特图等
- **ECharts** - 支持柱状图、折线图、饼图、散点图等数据可视化

#### 📁 文档管理
- **多文档支持** - 侧边栏文档列表，快速切换
- **数据库存储** - 使用 Supabase 存储，数据持久化
- **文档收藏** - 收藏重要文档，快速访问
- **搜索过滤** - 按标题或内容搜索文档
- **统计信息** - 字数、词数、行数、阅读时间、中英文比例

#### 📂 文件夹管理
- 创建文件夹分类整理文档
- 支持多层级文件夹嵌套
- 自定义文件夹颜色标识

#### 📜 版本历史
- 手动保存版本快照
- 查看所有历史版本
- 一键恢复到任意版本

#### 🤖 AI 写作助手
- **续写内容** - AI 自然续写后续内容
- **润色文本** - 提升文字流畅度和专业性
- **扩展内容** - 添加更多细节和示例
- **改写内容** - 换种方式表达相同意思
- **生成摘要** - 提取文档核心要点
- **生成大纲** - 创建结构化写作大纲
- **生成标题** - 获取吸引人的标题建议
- **翻译文本** - 中英文互译
- **修正错误** - 语法和拼写纠错
- **解释内容** - 简单易懂的内容解释

#### 💬 AI 对话模式
- 多轮对话交流
- 上下文理解
- 流式响应实时显示
- 一键将 AI 回复插入文档

#### 📤 导出功能
- **Markdown (.md)** - 原始 Markdown 文件
- **HTML** - 带 GitHub CSS 样式的网页
- **PDF** - 通过浏览器打印导出
- **Word (.doc)** - 兼容 Microsoft Word
- **纯文本 (.txt)** - 仅文本内容
- **JSON** - 含元数据的数据格式

#### 📋 模板系统
提供 10 个内置模板：空白文档、README、技术设计文档、API 文档、更新日志、博客文章、会议纪要、周报、简历（详细版）、简历（简洁版）

#### 📱 PWA 支持
- 添加到桌面，像原生应用一样使用
- Service Worker 支持离线使用
- 独立窗口运行，加载快速

### 🛠️ 技术栈
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui
- Supabase (PostgreSQL)
- Drizzle ORM
- KaTeX / Mermaid / ECharts

### 🔒 安全性
- API Key 安全存储，服务端代理
- 请求验证和大小限制
- Rate Limiting 防止滥用
- XSS 防护

### 📝 文档
- 完整的 README 文档
- 环境变量配置说明
- 数学公式与图表使用指南

---

## Upcoming Features

- [ ] 实时协作编辑
- [ ] 文档分享功能
- [ ] 更多 AI 模型支持
- [ ] 移动端优化
- [ ] 插件系统
