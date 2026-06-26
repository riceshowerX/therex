<p align="center">
  <a href="README.md">简体中文</a> | <a href="README.en.md">English</a>
</p>

<div align="center">

<img src="public/icons/logo.png" alt="Therex Logo" width="128" height="128">

# ✨ Therex

**现代化 Markdown 编辑器 - 灵感来自 Theresa**

*功能强大、界面优雅的 Markdown 编辑器，内置 AI 智能写作助手*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/riceshowerX/therex?style=flat-square)](https://github.com/riceshowerX/therex/releases)

[📖 功能特性](#-核心功能) · [🚀 快速开始](#-快速开始) · [📦 部署](#-部署指南) · [🌐 English](README.en.md)

</div>

---

## 📖 项目简介

Therex 是一款功能丰富、界面现代的 **Markdown 在线编辑器**，基于 Next.js 16、React 19 和 TypeScript 构建。提供流畅的写作体验，集成 AI 智能写作助手、多文档管理、实时预览、版本历史、实时协作等强大功能。

> 💡 **名字来源**：灵感来自明日方舟中的特蕾西娅（Theresa），象征着优雅与力量。

### 🎯 为什么选择 Therex？

| 特性 | Therex | 传统编辑器 |
|------|--------|-----------|
| AI 写作辅助 | ✅ 内置多种 AI 功能 | ❌ 无 |
| 多语言支持 | ✅ 中英文切换 | ❌ 仅英文 |
| 多存储后端 | ✅ 本地/云端可选 | ❌ 单一存储 |
| 数学公式 | ✅ KaTeX 渲染 | ⚠️ 部分支持 |
| 图表绘制 | ✅ Mermaid + ECharts | ❌ 无 |
| 版本历史 | ✅ 本地快照 | ❌ 无 |
| PWA 支持 | ✅ 可安装离线使用 | ❌ 无 |
| 实时协作 | ✅ 多人协同编辑 | ❌ 无 |
| 插件系统 | ✅ 可扩展架构 | ❌ 无 |
| 主题市场 | ✅ 自定义主题 | ⚠️ 仅预设 |
| 云端同步 | ✅ 多设备同步 | ❌ 无 |

---

## ✨ 核心功能

### 📝 编辑器核心

| 功能 | 说明 |
|------|------|
| 🔄 **实时预览** | 支持 GitHub 风格 Markdown，所见即所得 |
| 🎨 **语法高亮** | 代码块支持多种编程语言高亮显示 |
| 📐 **多视图模式** | 编辑模式、预览模式、分屏模式自由切换 |
| 🔤 **字体调节** | 编辑器字体大小可调节（10-24px） |
| 🌙 **深色主题** | 支持浅色/深色主题，自动跟随系统 |
| 📑 **目录导航** | 自动生成文档目录，快速跳转 |
| 📐 **数学公式** | 支持 KaTeX 数学公式渲染 |
| 📊 **图表绘制** | 支持 Mermaid 流程图、时序图、ECharts 数据可视化 |

### 📁 文档管理

```
📁 灵活的存储方案
├── 💾 LocalStorage  - 轻量级本地存储
├── 🗄️ IndexedDB     - 大容量本地数据库
└── ☁️ Supabase      - 云端同步存储

📊 智能统计
├── 字数统计（中英文精准识别）
├── 阅读时间估算
└── 中英文比例分析
```

### 🤖 AI 写作助手

集成多种 AI 大模型，让写作更高效：

<table>
<tr>
<td width="50%">

**📝 写作增强**
- 续写内容 - AI 自然续写
- 润色文本 - 提升文字流畅度
- 扩展内容 - 添加细节和示例
- 改写内容 - 换种方式表达

</td>
<td width="50%">

**🎯 智能生成**
- 生成摘要 - 提取核心要点
- 生成大纲 - 创建结构化框架
- 生成标题 - 获取吸引人的标题
- 翻译文本 - 中英文互译

</td>
</tr>
</table>

**支持的 AI 提供商：**

| 提供商 | 说明 | 推荐模型 |
|--------|------|----------|
| 🤖 [豆包](https://www.volcengine.com/product/doubao) | 字节跳动旗下大模型 | doubao-pro-256k |
| 🧠 [DeepSeek](https://www.deepseek.com/) | 深度求索大模型 | deepseek-chat |
| 💚 [OpenAI](https://openai.com/) | GPT 系列模型 | gpt-4o |
| 🌙 [Kimi](https://kimi.moonshot.cn/) | 月之暗面大模型 | moonshot-v1-128k |
| ⚙️ 自定义 | OpenAI 兼容 API | - |

### 📐 数学公式与图表

<details>
<summary><b>🔬 数学公式（KaTeX）</b></summary>

支持 LaTeX 数学公式语法：

- **行内公式**：`$E = mc^2$`
- **块级公式**：
```latex
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```

</details>

<details>
<summary><b>📊 图表绘制</b></summary>

**Mermaid 图表：** 流程图、时序图、类图、状态图、甘特图、饼图、思维导图、ER 图

**ECharts 可视化：** 柱状图、折线图、饼图、散点图、雷达图、热力图

</details>

### 📤 导出功能

| 格式 | 说明 | 适用场景 |
|------|------|----------|
| `.md` | 原始 Markdown 文件 | 跨平台使用 |
| `.html` | 带 GitHub CSS 样式 | 网页发布 |
| `.pdf` | 通过浏览器打印 | 文档分享 |
| `.doc` | Microsoft Word 格式 | 协作编辑 |
| `.txt` | 纯文本内容 | 简单存档 |
| `.json` | 含元数据的数据格式 | 数据备份 |

### 👥 实时协作

支持多人实时协作编辑同一文档：

| 功能 | 说明 |
|------|------|
| 🔄 **实时同步** | WebSocket 实时同步编辑内容 |
| 👁️ **光标显示** | 显示协作者的光标位置 |
| 🎯 **选区高亮** | 高亮显示协作者的选区 |
| 👤 **用户标识** | 不同颜色区分协作者 |
| 🔌 **断线重连** | 自动重连机制 |

### 🔌 插件系统

可扩展的插件架构，支持自定义功能：

- 🧩 **插件市场** - 浏览和安装社区插件
- ⚡ **热加载** - 无需重启即可启用插件
- 🔒 **沙箱隔离** - 安全的插件运行环境
- 📝 **插件 API** - 丰富的扩展接口

### 🎨 主题市场

个性化定制编辑器外观：

- 🌈 **多种主题** - 预设多款精美主题
- 🎨 **自定义主题** - 自由调整颜色、字体
- 💾 **主题导入导出** - 分享你的主题配置
- 🌙 **深色模式** - 自动跟随系统设置

### ☁️ 云端同步

多设备数据同步：

- 📱 **跨设备同步** - 在不同设备间无缝切换
- 🔐 **数据加密** - 端到端加密保护隐私
- 📦 **增量同步** - 仅同步变更部分，节省流量
- ⏱️ **冲突解决** - 自动处理同步冲突

### 🔍 全文搜索

快速定位文档内容：

- 🔎 **实时搜索** - 输入即搜，毫秒级响应
- 📊 **搜索高亮** - 高亮显示匹配结果
- 🏷️ **标签筛选** - 按标签过滤文档
- 📅 **时间范围** - 按创建/修改时间筛选

### ⌨️ 快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl + S` | 保存文档 | 保存当前内容 |
| `Ctrl + Shift + S` | 保存版本快照 | 创建历史版本 |
| `Ctrl + Z` | 撤销 | 撤销上一步操作 |
| `Ctrl + Shift + Z` | 重做 | 重做操作 |
| `Ctrl + F` | 查找替换 | 搜索和替换文本 |
| `Ctrl + K` | 打开 AI 对话 | 快速调用 AI |

---

## 🛠️ 技术栈

<table>
<tr>
<th>技术</th>
<th>版本</th>
<th>用途</th>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/nextdotjs/000000" width="20"> Next.js</td>
<td>16</td>
<td>全栈框架（App Router）</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/react/61DAFB" width="20"> React</td>
<td>19</td>
<td>UI 组件库</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/typescript/3178C6" width="20"> TypeScript</td>
<td>5</td>
<td>类型安全</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/tailwindcss/06B6D4" width="20"> Tailwind CSS</td>
<td>4</td>
<td>原子化 CSS</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/supabase/3FCF8E" width="20"> Supabase</td>
<td>-</td>
<td>PostgreSQL 数据库</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/katex/000000" width="20"> KaTeX</td>
<td>-</td>
<td>数学公式渲染</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/mermaid/FF3670" width="20"> Mermaid</td>
<td>-</td>
<td>图表绘制</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/apacheecharts/AA344D" width="20"> ECharts</td>
<td>-</td>
<td>数据可视化</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/vitest/6E9F18" width="20"> Vitest</td>
<td>-</td>
<td>单元测试</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/playwright/2EAD33" width="20"> Playwright</td>
<td>-</td>
<td>E2E 测试</td>
</tr>
</table>

---

## 📦 快速开始

### 环境要求

- Node.js `>= 18.0`
- pnpm `>= 8.0`（推荐）或 npm / yarn

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/riceshowerX/therex.git
cd therex

# 2. 安装依赖
pnpm install

# 3. 配置环境变量（可选）
cp .env.example .env.local

# 4. 启动开发服务器
pnpm dev
```

打开 [http://localhost:5000](http://localhost:5000) 查看应用。

### 环境变量配置

```env
# Supabase 配置（可选，用于云同步）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📦 部署指南

### Vercel 部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/riceshowerX/therex)

1. 点击上方按钮，克隆项目到 Vercel
2. 配置环境变量（可选）
3. 点击 Deploy 完成部署

### Docker 部署

```bash
# 构建镜像
docker build -t therex .

# 运行容器
docker run -p 3000:3000 therex
```

---

## 🗺️ 路线图

### ✅ 已完成

- [x] 基础 Markdown 编辑器
- [x] AI 写作助手
- [x] 多文档管理
- [x] 版本历史
- [x] 数学公式与图表
- [x] 多存储后端支持
- [x] 国际化支持（中英文）
- [x] PWA 安装支持
- [x] 实时协作编辑
- [x] 文档分享功能
- [x] 移动端优化
- [x] 插件系统
- [x] 主题市场
- [x] 云端同步增强
- [x] 全文搜索
- [x] 标签管理

### 🚧 进行中

- [ ] 更多 AI 模型支持
- [ ] 性能优化
- [ ] 测试覆盖率提升

### 📋 计划中

- [ ] 离线协作支持
- [ ] 更多导出格式
- [ ] 团队空间

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

```bash
# 1. Fork 项目
# 2. 创建分支
git checkout -b feature/your-feature

# 3. 提交更改
git commit -m 'feat: add some feature'

# 4. 推送分支
git push origin feature/your-feature

# 5. 创建 Pull Request
```

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件
- [marked](https://marked.js.org/) - Markdown 解析
- [KaTeX](https://katex.org/) - 数学公式
- [Mermaid](https://mermaid.js.org/) - 图表
- [ECharts](https://echarts.apache.org/) - 数据可视化

---

## ⚠️ 免责声明

本项目仅供学习和研究使用，不提供任何形式的担保。

### 使用须知

1. **AI 服务**：本项目集成的 AI 写作助手功能需要用户自行配置 API Key。使用 AI 服务产生的费用由用户自行承担，请遵守各 AI 服务提供商的使用条款和计费规则。

2. **数据安全**：用户数据存储在本地浏览器或用户自行配置的云服务中。开发者不对因使用本软件导致的数据丢失、泄露等问题负责。

3. **知识产权**：用户使用本软件创作的内容归用户所有。本项目不主张对用户创作内容的任何权利。

4. **商标声明**：本项目中提及的第三方商标、服务标志及产品名称均为其各自所有者的财产。

5. **无担保**：本软件按"现状"提供，不提供任何明示或暗示的担保，包括但不限于适销性和特定用途适用性的担保。

6. **责任限制**：在任何情况下，开发者均不对因使用或无法使用本软件而产生的任何损害负责。

### 开源许可

本项目采用 MIT 许可证开源，欢迎自由使用、修改和分发，但请保留原作者版权声明。

---

<div align="center">

**[⬆ 返回顶部](#-therex)**

Made with ❤️ by [Therex Team](https://github.com/riceshowerX)

如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！

</div>
