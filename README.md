<div align="center">

# ✨ Therex

**Modern Markdown Editor with AI - Inspired by Theresa**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[在线演示](#) | [功能特性](#-核心功能) | [快速开始](#-快速开始) | [部署指南](#-部署指南)

</div>

---

## 📖 项目简介

Therex 是一款功能丰富、界面现代的 Markdown 在线编辑器，基于 Next.js 16、React 19 和 TypeScript 构建。提供流畅的写作体验，集成 AI 智能写作助手、多文档管理、实时预览、版本历史等强大功能。



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
| 数学公式 | 支持 KaTeX 数学公式渲染 |
| 图表绘制 | 支持 Mermaid 流程图、时序图、ECharts 数据可视化 |

### 📁 文档管理

- **多文档支持** - 侧边栏文档列表，快速切换
- **数据库存储** - 使用 Supabase 存储，数据持久化
- **文档收藏** - 收藏重要文档，快速访问
- **搜索过滤** - 按标题或内容搜索文档
- **统计信息** - 字数、词数、行数、阅读时间、中英文比例

### 📂 文件夹管理

- **创建文件夹** - 将文档分类整理到文件夹
- **嵌套结构** - 支持多层级文件夹嵌套
- **移动文档** - 在文件夹间自由移动文档
- **文件夹颜色** - 自定义文件夹颜色标识
- **快速导航** - 按文件夹浏览文档

### 📜 版本历史

- **手动保存** - `Ctrl+Shift+S` 保存当前版本
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
- **安全配置** - API Key 加密存储，服务端代理

### 📐 数学公式与图表

#### 数学公式（KaTeX）

支持 LaTeX 数学公式语法：

- **行内公式**：`$E = mc^2$`
- **块级公式**：`$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$`

支持所有常用数学符号：分数、求和、积分、矩阵等。

#### 图表（Mermaid）

支持多种图表类型：

- 流程图、时序图、类图、状态图、甘特图、饼图、思维导图、ER 图

#### 数据可视化（ECharts）

支持强大的数据可视化功能：柱状图、折线图、饼图、散点图、雷达图、热力图等。

> 💡 查看 [数学公式与图表使用指南](docs/MATH_AND_CHARTS.md) 了解更多

### 📤 导出功能

支持多种格式导出：

| 格式 | 说明 |
|------|------|
| Markdown (.md) | 原始 Markdown 文件 |
| HTML | 带 GitHub CSS 样式的网页 |
| PDF | 通过浏览器打印导出 |
| Word (.doc) | 兼容 Microsoft Word |
| 纯文本 (.txt) | 仅文本内容 |
| JSON | 含元数据的数据格式 |

### ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + S` | 保存文档 |
| `Ctrl + Shift + S` | 保存版本快照 |
| `Ctrl + Z` | 撤销 |
| `Ctrl + Shift + Z` | 重做 |
| `Ctrl + F` | 查找替换 |
| `Ctrl + K` | 打开 AI 对话 |

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
| Tailwind CSS 4 | 原子化 CSS |
| shadcn/ui | UI 组件库 |
| Supabase | PostgreSQL 数据库 |
| Drizzle ORM | 数据库 ORM |
| KaTeX | 数学公式渲染 |
| Mermaid | 图表绘制 |
| ECharts | 数据可视化 |
| marked | Markdown 解析 |

## 📦 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- pnpm 8.0 或更高版本（推荐）
- Supabase 账户（用于数据持久化）

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/riceshowerX/therex.git
cd therex
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入必要的配置：

```env
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI 配置（可选）
AI_API_KEY=your_ai_api_key
AI_DEFAULT_MODEL=doubao
```

4. **初始化数据库**

```bash
pnpm db:push
```

5. **启动开发服务器**

```bash
pnpm dev
```

打开 [http://localhost:5000](http://localhost:5000) 查看应用。

## 🚀 部署指南

### Vercel 部署（推荐）

1. Fork 本项目到你的 GitHub 账户

2. 在 [Vercel](https://vercel.com) 导入项目

3. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AI_API_KEY`（可选）

4. 点击部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/riceshowerX/therex)

### Docker 部署

```bash
# 构建镜像
docker build -t therex .

# 运行容器
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  therex
```

### 自托管部署

1. **构建生产版本**

```bash
pnpm build
```

2. **启动服务**

```bash
pnpm start
```

默认运行在 `http://localhost:3000`，可通过 `PORT` 环境变量修改。

## 🔧 配置说明

### 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 |
| `AI_API_KEY` | ⭕ | AI 服务 API 密钥 |
| `AI_DEFAULT_MODEL` | ⭕ | 默认 AI 模型（默认：doubao） |
| `AI_API_ENDPOINT` | ⭕ | AI API 端点 |
| `NEXT_PUBLIC_APP_URL` | ⭕ | 应用 URL（用于生成链接） |
| `NEXT_PUBLIC_APP_NAME` | ⭕ | 应用名称（默认：Therex） |

### Supabase 配置

1. 在 [Supabase](https://supabase.com) 创建新项目

2. 获取项目 URL 和匿名密钥：
   - 进入 Settings > API
   - 复制 `URL` 和 `anon public` 密钥

3. 运行数据库迁移：
   ```bash
   pnpm db:push
   ```

### AI 模型配置

支持多种 AI 提供商，在设置页面配置：

1. **豆包（默认）**
   - 模型：doubao-pro-32k
   - 需要字节跳动 API Key

2. **DeepSeek**
   - 模型：deepseek-chat
   - 需要 DeepSeek API Key

3. **OpenAI**
   - 模型：gpt-4 / gpt-3.5-turbo
   - 需要 OpenAI API Key

4. **Kimi**
   - 模型：moonshot-v1
   - 需要月之暗面 API Key

5. **自定义**
   - 支持 OpenAI 兼容 API
   - 可配置自定义端点

## 📁 项目结构

```
therex/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API 路由
│   │   │   ├── ai-assist/      # AI 助手 API
│   │   │   └── ai-config/      # AI 配置 API
│   │   ├── settings/           # 设置页面
│   │   ├── layout.tsx          # 根布局
│   │   └── page.tsx            # 首页（编辑器）
│   ├── components/             # React 组件
│   │   ├── ui/                 # shadcn/ui 组件
│   │   ├── markdown-editor.tsx # 主编辑器
│   │   ├── markdown-preview.tsx# 预览组件
│   │   ├── document-stats.tsx  # 文档统计
│   │   ├── shortcut-panel.tsx  # 快捷键面板
│   │   ├── export-dialog.tsx   # 导出对话框
│   │   └── ...
│   ├── lib/                    # 工具库
│   │   ├── document-manager.ts # 文档管理
│   │   ├── markdown-renderer.ts# Markdown 渲染
│   │   ├── export-utils.ts     # 导出工具
│   │   ├── ai-config.ts        # AI 配置
│   │   └── ...
│   ├── hooks/                  # React Hooks
│   │   └── use-editor.ts       # 编辑器 Hooks
│   └── styles/                 # 样式文件
├── docs/                       # 文档
│   └── MATH_AND_CHARTS.md      # 数学公式与图表指南
├── public/                     # 静态资源
├── .env.example                # 环境变量示例
├── drizzle.config.ts           # Drizzle ORM 配置
├── next.config.ts              # Next.js 配置
├── tailwind.config.ts          # Tailwind CSS 配置
└── package.json                # 项目依赖
```

## 🧪 开发指南

### 可用脚本

```bash
# 开发
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 运行 ESLint
pnpm ts-check     # TypeScript 类型检查

# 数据库
pnpm db:push      # 推送数据库变更
pnpm db:generate  # 生成迁移文件
pnpm db:studio    # 打开 Drizzle Studio
```

### 代码规范

- 使用 ESLint + TypeScript 严格模式
- 遵循 Airbnb 代码风格
- 组件使用 PascalCase 命名
- 函数使用 camelCase 命名
- 常量使用 UPPER_SNAKE_CASE 命名

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关
```

## 🔒 安全性

- **API Key 安全**：所有敏感 API 调用通过服务端代理
- **输入验证**：所有用户输入进行严格验证
- **XSS 防护**：Markdown 渲染内容经过安全处理
- **CSRF 防护**：使用 Next.js 内置 CSRF 保护
- **Rate Limiting**：API 接口实现请求限流

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件
- [Supabase](https://supabase.com/) - 数据库服务
- [KaTeX](https://katex.org/) - 数学公式渲染
- [Mermaid](https://mermaid.js.org/) - 图表绘制
- [ECharts](https://echarts.apache.org/) - 数据可视化

---

<div align="center">

**[⬆ 返回顶部](#-therex)**

Made with ❤️ by Therex Team | Inspired by Theresa

</div>
