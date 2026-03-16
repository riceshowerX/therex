# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
