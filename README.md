<div align="center">

<img src="public/icons/logo.png" alt="Therex Logo" width="120" height="120">

# Therex

**现代化的 AI 驱动 Markdown 编辑器**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/riceshowerX/therex?style=flat-square)](https://github.com/riceshowerX/therex)
[![GitHub Issues](https://img.shields.io/github/issues/riceshowerX/therex?style=flat-square)](https://github.com/riceshowerX/therex/issues)
[![Test](https://img.shields.io/badge/test-107%20passed-brightgreen?style=flat-square)](https://github.com/riceshowerX/therex)

[English](README.en.md) · [功能特性](#-功能特性) · [快速开始](#-快速开始) · [部署](#-部署) · [安全](#-安全) · [贡献](#-贡献)

</div>

---

## 👀 项目简介

**Therex** 是一款功能丰富、界面现代的 **Markdown 在线编辑器**，基于 Next.js 16、React 19 与 TypeScript 构建。内置 **AI 智能写作助手**，支持多文档管理、实时预览、数学公式、数据可视化、实时协作等能力，并可作为 PWA 安装到本地离线使用。

### 核心亮点

| | 能力 | 说明 |
|---|------|------|
| 🤖 | **AI 写作助手** | 续写、润色、扩写、摘要、大纲、翻译，支持多提供商 |
| 🧮 | **数学公式** | KaTeX 行内/块级公式渲染 |
| 📊 | **数据可视化** | Mermaid 图表 + ECharts 交互图表（配置白名单消毒） |
| 👥 | **实时协作** | 基于 SSE 的多人在线协同编辑 |
| 📝 | **多文档管理** | 标签、全文搜索、版本快照、文档统计 |
| 📱 | **PWA 支持** | 可安装、离线可用 |
| 🌙 | **深色模式** | 自动跟随系统，多主题可选 |

---

## ✨ 功能特性

### 📝 编辑器核心

| 功能 | 说明 |
|------|------|
| 🔄 **实时预览** | GitHub 风格 Markdown，所见即所得 |
| 🎨 **语法高亮** | 基于 highlight.js，支持多种编程语言 |
| 📐 **多视图模式** | 编辑 / 预览 / 分屏自由切换 |
| 📑 **目录导航** | 自动生成文档目录，快速跳转 |
| 🔤 **字体调节** | 编辑器字号 10–24px 可调 |
| 🧮 **数学公式** | KaTeX 支持 `$...$` 与 `$$...$$` |
| 📊 **图表绘制** | Mermaid（流程图/时序图/类图/甘特图…）+ ECharts（柱状/折线/饼图…） |

### 🤖 AI 写作助手

| 类别 | 能力 |
|------|------|
| ✍️ 写作增强 | 智能续写 · 文本润色 · 内容扩展 · 改写 |
| 🎯 智能生成 | 生成摘要 · 生成大纲 · 生成标题 · 翻译（多语言） |
| 🧠 文档分析 | 风格分析 · 优化建议 · 深度分析 |

**支持的 AI 提供商**：

| 提供商 | 接入方式 | 状态 |
|--------|---------|------|
| 🧠 DeepSeek | OpenAI 兼容 | ✅ 支持 |
| 💚 OpenAI | OpenAI 兼容 | ✅ 支持 |
| 🌙 Kimi (Moonshot) | OpenAI 兼容 | ✅ 支持 |
| 🤖 豆包 (Doubao) | OpenAI 兼容 | ✅ 支持 |
| 🟣 Claude (Anthropic) | 专用 adapter | ✅ 支持 |
| 🌐 Gemini | 专用 adapter | ✅ 支持 |
| ⚙️ 自定义 | OpenAI 兼容 API | ✅ 支持 |
| 文心一言 | — | 🚧 规划中 |

> AI 调用统一经由后端路由（`/api/ai-assist`、`/api/ai/service`），API Key 仅存储于服务端数据库，不暴露给浏览器。

### 👥 实时协作

基于 **SSE（Server-Sent Events）** 实现多人在线协同编辑：

- 🔄 实时内容同步
- 👁️ 协作者光标与选区显示
- 🎨 多用户颜色标识
- 🔌 断线重连
- 🏷️ 协作房间机制（创建 / 加入 / 心跳）

### 📁 文档管理

- 🗂️ 多文档 + 文件夹组织（支持级联删除）
- 🏷️ 标签系统
- 🔍 全文搜索（实时高亮）
- 📊 文档统计（字数 / 阅读时间 / 中英文比例）
- 📸 版本快照（历史版本恢复）
- 💾 自动保存 + 离线缓存

### 📤 导出功能

| 格式 | 说明 |
|------|------|
| `.md` | 原始 Markdown |
| `.html` | 消毒后的独立 HTML（内嵌样式） |
| `.pdf` | 浏览器打印导出 |
| `.doc` | Word 兼容格式 |
| `.txt` | 纯文本 |
| `.json` | 含元数据备份 |

> HTML 导出经 **marked + DOMPurify** 双重处理，防止脚本注入。

### 🧩 插件与扩展

- 🧩 插件市场（浏览 / 安装社区插件）
- ⚡ 热加载
- 🔒 权限沙箱（storage / network / clipboard / editor 逐项授权，默认拒绝）
- 🎨 主题市场（预设 + 自定义主题导入导出）

### ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 保存文档 |
| `Ctrl+Shift+S` | 保存版本快照 |
| `Ctrl+Z` / `Ctrl+Shift+Z` | 撤销 / 重做 |
| `Ctrl+F` | 查找替换 |
| `Ctrl+K` | 打开 AI 对话 |

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Next.js](https://nextjs.org/) | 16.1.7 | 全栈框架（App Router） |
| [React](https://react.dev/) | 19.2.3 | UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 5.9 | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | 样式 |
| [shadcn/ui](https://ui.shadcn.com/) | — | 组件库 |
| [Supabase](https://supabase.com/) | 2.95.3 | PostgreSQL 后端（可选） |
| [Drizzle ORM](https://orm.drizzle.team/) | 0.45 | 数据库访问 |
| [marked](https://marked.js.org/) | 17 | Markdown 解析 |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.2 | HTML 消毒 |
| [KaTeX](https://katex.org/) | 0.16 | 数学公式 |
| [Mermaid](https://mermaid.js.org/) | 11 | 图表 |
| [ECharts](https://echarts.apache.org/) | 6 | 数据可视化 |
| [coze-coding-dev-sdk](https://www.npmjs.com/package/coze-coding-dev-sdk) | 0.7 | AI 服务 |
| [Vitest](https://vitest.dev/) | 4 | 单元测试 |
| [Playwright](https://playwright.dev/) | 1.58 | E2E 测试 |

---

## 🚀 快速开始

### 环境要求

- Node.js `>= 18`（推荐 20+）
- pnpm `>= 9`（项目固定 `packageManager: pnpm@9.0.0`）

### 安装与启动

```bash
# 1. 克隆项目
git clone https://github.com/riceshowerX/therex.git
cd therex

# 2. 安装依赖
pnpm install

# 3. 配置环境变量（可选，未配置时以本地模式运行）
cp .env.example .env.local

# 4. 启动开发服务器
pnpm dev
```

打开 **http://localhost:5000** 即可使用。

### 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（端口 5000） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务 |
| `pnpm test` | 运行单元测试（Vitest） |
| `pnpm test:e2e` | 运行 E2E 测试（Playwright） |
| `pnpm test:all` | 单元 + E2E 全量测试 |
| `pnpm ts-check` | TypeScript 类型检查 |
| `pnpm lint` | ESLint 检查 |
| `pnpm db:push` / `pnpm db:migrate` | 数据库迁移（Drizzle） |

---

## ⚙️ 环境变量

复制 `.env.example` 为 `.env.local`，按需填写：

| 变量 | 必填 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 可选 | Supabase 项目 URL（云端同步） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 可选 | Supabase 匿名 Key |
| `SUPABASE_SERVICE_ROLE_KEY` | 可选 | 服务端密钥（**仅服务端使用**） |
| `AI_CONFIG_ADMIN_KEY` | 可选 | 无 Supabase 时的单用户/内网兜底鉴权（服务端校验） |
| `NEXT_PUBLIC_AI_CONFIG_ADMIN_KEY` | 可选 | 配套前端共享密钥（⚠️ 会暴露给浏览器，仅限单用户/内网） |
| `ALLOW_SHARED_KEY_AUTH` | 否 | 生产环境共享密钥模式的显式开关（默认 `false`，生产强制 JWT 鉴权） |
| `AI_DEFAULT_MODEL` | 可选 | 默认 AI 提供商（doubao / deepseek / openai / kimi / custom） |
| `AI_API_ENDPOINT` | 可选 | AI API 端点 |

> **安全提示**：`SUPABASE_SERVICE_ROLE_KEY` 与 `AI_CONFIG_ADMIN_KEY` 仅在服务端读取；`NEXT_PUBLIC_*` 前缀变量会进入浏览器 bundle，切勿存放真实密钥。

---

## 📦 部署

### Vercel（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/riceshowerX/therex)

1. 点击上方按钮克隆项目到 Vercel
2. 配置环境变量
3. 点击 Deploy

### Docker

```bash
docker build -t therex .
docker run -p 3000:3000 therex
```

或使用项目自带的 `docker-compose.yml`：

```bash
docker compose up -d
```

> 生产环境请确保 `NODE_ENV=production`，并优先配置 Supabase JWT 鉴权模式。

---

## 🛡️ 安全

本项目将安全作为一等公民，近期完成了一次全维度安全加固（32 项问题修复，QA 回归 107 项测试全部通过）：

- 🔐 **后端统一鉴权**：`/api/sync`、`/api/ai-assist`、`/api/ai/service` 均接入用户鉴权与归属校验，杜绝匿名读写与 API Key 盗用
- 🛡️ **SSRF 防护**：AI 图片 URL 仅允许 HTTPS，并拦截内网 / IPv4-mapped / IPv6 保留地址
- 🧹 **XSS 双面防御**：ECharts 配置白名单消毒（预览侧）+ marked + DOMPurify（导出侧）
- 🔑 **密钥管理**：AI API Key 仅存服务端数据库；`NEXT_PUBLIC` 前缀变量不含真实密钥；生产环境默认强制 JWT 鉴权
- 🧩 **插件沙箱**：插件权限逐项申请，未获授权默认拒绝

---

## 🧱 项目结构

```
therex/
├── src/
│   ├── app/                # Next.js App Router 页面与 API 路由
│   │   ├── api/            # 后端 API（ai / ai-assist / ai-config / sync / collaboration）
│   │   ├── settings/       # 设置页面
│   │   ├── collab/         # 协作页面
│   │   └── share/          # 分享页面
│   ├── components/         # UI 组件（editor / export / share / plugins / ui）
│   ├── hooks/              # React Hooks（use-ai 等）
│   ├── lib/                # 核心库（ai / collaboration / storage / sync / export / plugins）
│   ├── storage/            # 数据库 schema 与 Supabase 客户端
│   ├── types/              # TypeScript 类型
│   └── test/               # 测试配置
├── e2e/                    # Playwright E2E 测试
├── scripts/                # 开发/构建脚本
├── docs/                   # 文档
└── public/                 # 静态资源（PWA / 图标）
```

---

## 🧪 测试

```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e

# 全量
pnpm test:all

# 覆盖率
pnpm test:coverage
```

当前状态：**107 项单元测试通过**，覆盖安全路由鉴权、XSS 消毒、SSRF 防护、存储逻辑等关键路径。

---

## 🗺️ 路线图

### ✅ 已完成

- [x] Markdown 编辑 / 预览 / 分屏
- [x] AI 写作助手（续写 / 润色 / 摘要 / 翻译）
- [x] 多提供商 AI 接入（OpenAI 兼容 + Claude + Gemini）
- [x] KaTeX 数学公式、Mermaid / ECharts 图表
- [x] 实时协作（SSE）
- [x] 全文搜索、标签管理、版本快照
- [x] PWA 离线支持、深色模式、主题
- [x] 插件系统（权限沙箱）、插件市场
- [x] 全维度安全加固（鉴权 / XSS / SSRF）

### 🚧 进行中 / 规划中

- [ ] 存储后端切换（IndexedDB / Supabase adapter 接线）
- [ ] 分享跨设备（当前为本机演示级）
- [ ] 文心一言 / 更多 AI 提供商
- [ ] 离线协作
- [ ] 团队空间

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. **Fork** 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 **Pull Request**（main 分支受保护，需 PR 审查后合并）

开发前请阅读 [AGENTS.md](AGENTS.md) 了解代码规范。

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证开源。

### 免责声明

1. **AI 服务**：AI 功能需自行配置 API Key，产生的费用由使用者承担，请遵守各服务商条款。
2. **数据安全**：用户数据存储于本地浏览器或自配置的云服务，开发者不对数据丢失/泄露负责。
3. **知识产权**：用户创作内容归用户所有。
4. **无担保**：本软件按"现状"提供，不提供任何明示或暗示担保。

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) · [shadcn/ui](https://ui.shadcn.com/) · [marked](https://marked.js.org/) · [KaTeX](https://katex.org/) · [Mermaid](https://mermaid.js.org/) · [ECharts](https://echarts.apache.org/)

---

<div align="center">

**[⬆ 返回顶部](#therex)**

Made with ❤️ by [Therex Team](https://github.com/riceshowerX)

如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！

</div>
