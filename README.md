<div align="center">

# ✨ MarkFlow

**现代化 Markdown 编辑器，AI 驱动的智能写作助手**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📖 项目简介

MarkFlow 是一款功能丰富、界面现代的 Markdown 在线编辑器，基于 Next.js 16、React 19 和 TypeScript 构建。提供流畅的写作体验，集成 AI 智能写作助手、多文档管理、实时预览、版本历史等强大功能。

## ✨ 核心功能

### 📝 编辑器核心

| 功能 | 说明 |
|------|------|
| 实时预览 | 支持 GitHub 风格 Markdown，所见即所得 |
| 语法高亮 | 代码块支持多种编程语言高亮显示 |
| 多视图模式 | 编辑模式、预览模式、分屏模式自由切换 |
| 字体调节 | 编辑器字体大小可调节（10-24px） |
| 深色主题 | 支持浅色/深色主题，自动跟随系统 |
| 目录导航 | 自动生成文档目录，快速跳转 |

### 📁 文档管理

- **多文档支持** - 侧边栏文档列表，快速切换
- **自动保存** - 内容自动保存到本地存储
- **文档收藏** - 收藏重要文档，快速访问
- **搜索过滤** - 按标题或内容搜索文档
- **统计信息** - 字数、词数、行数、阅读时间

### 📂 文件夹管理

- **创建文件夹** - 将文档分类整理到文件夹
- **嵌套结构** - 支持多层级文件夹嵌套
- **移动文档** - 在文件夹间自由移动文档
- **文件夹颜色** - 自定义文件夹颜色标识
- **快速导航** - 按文件夹浏览文档

### 📜 版本历史

- **手动保存** - `Ctrl+Shift+S` 保存当前版本
- **自动快照** - 每 5 分钟自动保存版本快照
- **版本列表** - 查看所有历史版本及时间戳
- **一键恢复** - 快速恢复到任意历史版本
- **版本限制** - 每个文档最多保存 20 个版本

### 🤖 AI 写作助手

集成多种 AI 大模型，让写作更高效：

| 功能 | 说明 |
|------|------|
| 续写内容 | AI 自然续写后续内容 |
| 润色文本 | 提升文字流畅度和专业性 |
| 扩展内容 | 添加更多细节和示例 |
| 改写内容 | 换种方式表达相同意思 |
| 生成摘要 | 提取文档核心要点 |
| 生成大纲 | 创建结构化写作大纲 |
| 生成标题 | 获取吸引人的标题建议 |
| 翻译文本 | 中英文互译 |
| 修正错误 | 语法和拼写纠错 |
| 解释内容 | 简单易懂的内容解释 |

**支持的 AI 提供商：**

| 提供商 | 说明 |
|--------|------|
| 🤖 豆包 | 字节跳动旗下大模型 |
| 🧠 DeepSeek | 深度求索大模型 |
| 💚 OpenAI | GPT 系列模型 |
| 🌙 Kimi | 月之暗面大模型 |
| ⚙️ 自定义 | OpenAI 兼容 API |

### 💬 AI 对话模式

- **多轮对话** - 与 AI 进行连续对话交流
- **上下文理解** - AI 理解当前文档内容
- **流式响应** - 实时显示 AI 回复内容
- **添加到文档** - 一键将 AI 回复插入文档
- **历史记录** - 会话期间保留对话历史

### 📋 模板系统

提供 10 个内置模板，快速开始创作：

| 分类 | 模板 |
|------|------|
| 基础 | 空白文档 |
| 开发 | README、技术设计文档、API 文档、更新日志 |
| 写作 | 博客文章 |
| 商务 | 会议纪要、周报 |
| 个人 | 简历（详细版）、简历（简洁版） |

### 📤 导出功能

- **Markdown (.md)** - 原始 Markdown 文件
- **HTML** - 带 GitHub CSS 样式的网页
- **纯文本 (.txt)** - 仅文本内容
- **PDF** - 通过浏览器打印导出

### ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + S` | 保存文档 |
| `Ctrl + Shift + S` | 保存版本快照 |
| `Ctrl + Z` | 撤销 |
| `Ctrl + Shift + Z` | 重做 |
| `Ctrl + Y` | 重做 |
| `Ctrl + F` | 查找替换 |
| `Ctrl + K` | 打开 AI 对话 |
| `Ctrl + /` | 显示快捷键面板 |

### 📱 PWA 支持

- **安装应用** - 添加到桌面，像原生应用一样使用
- **离线访问** - Service Worker 支持离线使用
- **流畅体验** - 独立窗口运行，加载快速

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 | 全栈框架（App Router） |
| React 19 | UI 组件库 |
| TypeScript 5 | 类型安全 |
| Tailwind CSS 4 | 样式框架 |
| shadcn/ui | UI 组件库 |
| @uiw/react-md-editor | Markdown 编辑器 |
| marked | Markdown 解析 |
| next-themes | 主题管理 |
| coze-coding-dev-sdk | AI 集成 |
| Lucide React | 图标库 |

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 9.0+

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/riceshowerX/markflow.git
cd markflow

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

打开浏览器访问 [http://localhost:5000](http://localhost:5000)

### 生产构建

```bash
pnpm build
pnpm start
```

## ⚙️ 配置

### AI 配置

1. 点击工具栏中的设置图标 ⚙️
2. 选择 AI 提供商
3. 输入 API Key
4. 选择模型
5. 点击「测试连接」验证配置
6. 保存配置

> **提示：** 未配置 AI 时使用相关功能，会弹出友好的提示引导您前往设置页面。

## 📁 项目结构

```
markflow/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx            # 主编辑器页面
│   │   ├── settings/           # 设置页面
│   │   ├── api/                # API 路由
│   │   │   └── ai-assist/      # AI 助手 API
│   │   └── layout.tsx          # 根布局
│   ├── components/
│   │   ├── markdown-editor.tsx # 主编辑器组件
│   │   ├── pwa-installer.tsx   # PWA 安装提示
│   │   ├── theme-provider.tsx  # 主题上下文
│   │   └── ui/                 # shadcn/ui 组件
│   ├── lib/
│   │   ├── document-manager.ts # 文档与文件夹管理
│   │   ├── templates.ts        # 内置模板
│   │   ├── ai-config.ts        # AI 配置管理
│   │   └── utils.ts            # 工具函数
│   └── hooks/                  # 自定义 Hooks
├── public/
│   ├── manifest.json           # PWA 配置
│   ├── sw.js                   # Service Worker
│   └── icons/                  # 应用图标
└── package.json
```

## 🤝 参与贡献

欢迎提交 Pull Request 参与贡献！

```bash
# Fork 后克隆仓库
git clone https://github.com/your-username/markflow.git

# 创建功能分支
git checkout -b feature/AmazingFeature

# 提交更改
git commit -m 'Add some AmazingFeature'

# 推送到分支
git push origin feature/AmazingFeature

# 创建 Pull Request
```

## 🗺️ 开发路线

- [ ] 文档云端同步
- [ ] 多人协作编辑
- [ ] 更多 AI 提供商
- [ ] 移动端 App
- [ ] 插件系统
- [ ] 自定义主题

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

## 🙏 致谢

- [shadcn/ui](https://ui.shadcn.com/) - 精美的 UI 组件库
- [uiw-react-md-editor](https://github.com/uiwjs/react-md-editor) - Markdown 编辑器
- [Lucide](https://lucide.dev/) - 图标库
- 各 AI 提供商让智能写作成为可能

---

<div align="center">

**Made with ❤️ by [riceshowerX](https://github.com/riceshowerX)**

如果觉得不错，给个 ⭐ Star 支持一下吧！

</div>
