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
- **数据库存储** - 使用 Supabase 存储，数据持久化
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
| Supabase | 数据库和认证 |
| Drizzle ORM | 数据库 Schema 管理 |
| @uiw/react-md-editor | Markdown 编辑器 |
| marked | Markdown 解析 |
| next-themes | 主题管理 |
| coze-coding-dev-sdk | AI 集成 |
| Lucide React | 图标库 |

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 9.0+
- Supabase 账号

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/riceshowerX/markflow.git
cd markflow

# 安装依赖
pnpm install

# 复制环境变量文件
cp .env.example .env.local

# 配置环境变量（编辑 .env.local 文件）
# 必需配置：
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# 运行数据库迁移
pnpm run db:generate
pnpm run db:push

# 启动开发服务器
pnpm dev
```

打开浏览器访问 [http://localhost:5000](http://localhost:5000)

### 生产构建

```bash
pnpm build
pnpm start
```

## 📚 文档

- [架构文档](docs/ARCHITECTURE.md) - 项目架构和技术设计
- [部署指南](docs/DEPLOYMENT.md) - 部署到生产环境
- [依赖清理说明](docs/DEPENDENCY_CLEANUP.md) - 依赖包优化说明

## ⚙️ 配置

### 数据库配置

项目使用 Supabase 作为后端数据库。首次运行需要：

1. 创建 Supabase 项目
2. 获取连接信息（URL、API Key）
3. 配置环境变量
4. 运行数据库迁移

详细步骤请参考 [部署指南](docs/DEPLOYMENT.md)。

### AI 配置

1. 点击工具栏中的设置图标 ⚙️
2. 选择 AI 提供商
3. 输入 API Key
4. 选择模型
5. 点击「测试连接」验证配置
6. 保存配置

> **注意**：API Key 会加密存储在数据库中，不会暴露给前端。

## 📁 项目结构

```
markflow/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx            # 主编辑器页面
│   │   ├── settings/           # 设置页面
│   │   ├── api/                # API 路由
│   │   │   ├── ai-assist/      # AI 助手 API
│   │   │   └── ai-config/      # AI 配置 API
│   │   └── layout.tsx          # 根布局（含错误边界）
│   ├── components/
│   │   ├── markdown-editor.tsx # 主编辑器组件
│   │   ├── error-boundary.tsx  # 错误边界组件
│   │   └── ui/                 # UI 组件
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── use-document-manager.ts  # 文档管理
│   │   ├── use-folder-manager.ts    # 文件夹管理
│   │   ├── use-version-history.ts   # 版本历史
│   │   └── use-ai-config.ts         # AI 配置
│   ├── lib/
│   │   ├── services/           # 服务层
│   │   │   └── document-service.ts  # 文档服务
│   │   ├── utils/              # 工具函数
│   │   │   └── performance.ts # 性能优化
│   │   ├── ai-config.ts        # AI 配置
│   │   ├── env.ts              # 环境变量
│   │   └── error-handler.ts    # 错误处理
│   └── storage/
│       └── database/           # 数据库
│           ├── schema.ts       # 数据库 Schema
│           └── supabase-client.ts # Supabase 客户端
├── docs/                       # 文档
├── public/                     # 静态资源
└── package.json
```

## 🔧 开发命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 数据库
pnpm run db:generate  # 生成迁移文件
pnpm run db:push      # 推送到数据库
pnpm run db:studio    # 打开数据库管理界面

# 代码检查
pnpm run lint         # ESLint 检查
pnpm run lint:fix     # 自动修复 ESLint 错误
pnpm run ts-check     # TypeScript 类型检查
```

## ✨ 新增功能（v2.0）

### 🎯 安全增强
- ✅ API Key 加密存储在数据库
- ✅ 服务端代理 AI 请求
- ✅ 全局错误边界捕获
- ✅ 统一错误处理和用户通知

### 💾 数据持久化
- ✅ Supabase 数据库存储
- ✅ 支持多文档和文件夹管理
- ✅ 版本历史持久化
- ✅ 软删除保护

### 🏗️ 架构优化
- ✅ 分层架构（展示层、服务层、数据层）
- ✅ 自定义 Hooks 封装业务逻辑
- ✅ 性能优化工具（防抖、节流、虚拟滚动）
- ✅ 清理未使用的依赖包

### 📚 文档完善
- ✅ 详细的架构文档
- ✅ 完整的部署指南
- ✅ 依赖清理说明

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用函数式组件 + Hooks
- 添加必要的注释和文档

## 📝 更新日志

### v2.0.0 (2024-03-13)
- 🎉 重构项目架构，添加数据库支持
- 🔒 增强 API Key 安全性
- 🏗️ 拆分大组件，创建自定义 Hooks
- 🚀 添加性能优化工具
- 📚 完善项目文档
- 🧹 清理未使用的依赖

### v1.0.0
- 🎉 首次发布
- ✨ 核心编辑器功能
- 🤖 AI 写作助手
- 📁 文档和文件夹管理
- 📜 版本历史
- 📋 模板系统

## 🐛 已知问题

- 部分浏览器可能不支持所有 Markdown 语法
- AI 功能需要配置有效的 API Key
- 实时协作功能尚未实现（计划中）

## 🔮 未来规划

- [ ] 添加单元测试和集成测试
- [ ] 多用户支持和权限管理
- [ ] 实时协作功能
- [ ] 插件系统
- [ ] 移动端 App
- [ ] 语音输入
- [ ] OCR 识别

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👥 作者

MarkFlow Team

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [Lucide Icons](https://lucide.dev/)

## 📮 联系方式

- GitHub Issues: [https://github.com/riceshowerX/markflow/issues](https://github.com/riceshowerX/markflow/issues)
- Email: support@markflow.dev

---

<div align="center">
  <p>如果觉得这个项目对你有帮助，请给个 ⭐️ Star 支持一下！</p>
</div>
