<p align="center">
  <a href="README.md">简体中文</a> | <a href="README.en.md">English</a>
</p>

<div align="center">

<img src="public/icons/logo.png" alt="Therex Logo" width="128" height="128">

# ✨ Therex

**Modern Markdown Editor with AI - Inspired by Theresa**

*A powerful, elegant markdown editor with AI-powered writing assistance*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/riceshowerX/therex?style=flat-square)](https://github.com/riceshowerX/therex/releases)

[📖 Features](#-core-features) · [🚀 Quick Start](#-quick-start) · [📦 Deployment](#-deployment) · [🌐 中文版](README.md)

</div>

---

## 📖 Introduction

Therex is a feature-rich, modern **Markdown online editor** built with Next.js 16, React 19, and TypeScript. It provides a smooth writing experience with AI-powered writing assistance, multi-document management, real-time preview, version history, real-time collaboration, and more.

> 💡 **Name Origin**: Inspired by Theresa from Arknights, symbolizing elegance and power.

### 🎯 Why Choose Therex?

| Feature | Therex | Traditional Editors |
|---------|--------|---------------------|
| AI Writing Assistant | ✅ Built-in multiple AI features | ❌ None |
| Multi-language Support | ✅ Chinese/English toggle | ❌ English only |
| Multiple Storage Backends | ✅ Local/Cloud options | ❌ Single storage |
| Math Formulas | ✅ KaTeX rendering | ⚠️ Partial support |
| Chart Drawing | ✅ Mermaid + ECharts | ❌ None |
| Version History | ✅ Local snapshots | ❌ None |
| PWA Support | ✅ Installable for offline use | ❌ None |
| Real-time Collaboration | ✅ Multi-user editing | ❌ None |
| Plugin System | ✅ Extensible architecture | ❌ None |
| Theme Market | ✅ Custom themes | ⚠️ Presets only |
| Cloud Sync | ✅ Multi-device sync | ❌ None |

---

## ✨ Core Features

### 📝 Editor Core

| Feature | Description |
|---------|-------------|
| 🔄 **Real-time Preview** | GitHub-flavored Markdown support, WYSIWYG |
| 🎨 **Syntax Highlighting** | Code blocks with multi-language highlighting |
| 📐 **Multiple View Modes** | Edit mode, preview mode, split view |
| 🔤 **Font Adjustment** | Editor font size adjustable (10-24px) |
| 🌙 **Dark Theme** | Light/Dark themes with system auto-follow |
| 📑 **Table of Contents** | Auto-generated document outline |
| 📐 **Math Formulas** | KaTeX math formula rendering |
| 📊 **Chart Drawing** | Mermaid flowcharts, sequence diagrams, ECharts visualization |

### 📁 Document Management

```
📁 Flexible Storage Options
├── 💾 LocalStorage  - Lightweight local storage
├── 🗄️ IndexedDB     - Large-capacity local database
└── ☁️ Supabase      - Cloud sync storage

📊 Smart Statistics
├── Word count (Chinese/English recognition)
├── Reading time estimation
└── Chinese/English ratio analysis
```

### 🤖 AI Writing Assistant

Integrated with multiple AI models for efficient writing:

<table>
<tr>
<td width="50%">

**📝 Writing Enhancement**
- Continue Writing - Natural AI continuation
- Polish Text - Improve text fluency
- Expand Content - Add details and examples
- Rewrite Content - Express differently

</td>
<td width="50%">

**🎯 Smart Generation**
- Generate Summary - Extract key points
- Generate Outline - Create structured framework
- Generate Title - Get attractive titles
- Translate Text - Chinese/English translation

</td>
</tr>
</table>

**Supported AI Providers:**

| Provider | Description | Recommended Model |
|----------|-------------|-------------------|
| 🤖 [Doubao](https://www.volcengine.com/product/doubao) | ByteDance AI model | doubao-pro-256k |
| 🧠 [DeepSeek](https://www.deepseek.com/) | DeepSeek AI model | deepseek-chat |
| 💚 [OpenAI](https://openai.com/) | GPT series models | gpt-4o |
| 🌙 [Kimi](https://kimi.moonshot.cn/) | Moonshot AI model | moonshot-v1-128k |
| ⚙️ Custom | OpenAI compatible API | - |

### 📐 Math Formulas & Charts

<details>
<summary><b>🔬 Math Formulas (KaTeX)</b></summary>

Supports LaTeX math formula syntax:

- **Inline formulas**: `$E = mc^2$`
- **Block formulas**:
```latex
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```

</details>

<details>
<summary><b>📊 Chart Drawing</b></summary>

**Mermaid Charts:** Flowcharts, sequence diagrams, class diagrams, state diagrams, Gantt charts, pie charts, mind maps, ER diagrams

**ECharts Visualization:** Bar charts, line charts, pie charts, scatter plots, radar charts, heat maps

</details>

### 📤 Export Features

| Format | Description | Use Case |
|--------|-------------|----------|
| `.md` | Raw Markdown file | Cross-platform use |
| `.html` | With GitHub CSS styles | Web publishing |
| `.pdf` | Via browser print | Document sharing |
| `.doc` | Microsoft Word format | Collaborative editing |
| `.txt` | Plain text content | Simple archiving |
| `.json` | Data format with metadata | Data backup |

### 👥 Real-time Collaboration

Multi-user real-time collaborative editing:

| Feature | Description |
|---------|-------------|
| 🔄 **Real-time Sync** | WebSocket real-time content sync |
| 👁️ **Cursor Display** | Show collaborators' cursor positions |
| 🎯 **Selection Highlight** | Highlight collaborators' selections |
| 👤 **User Identification** | Different colors for collaborators |
| 🔌 **Auto Reconnect** | Automatic reconnection mechanism |

### 🔌 Plugin System

Extensible plugin architecture with custom features:

- 🧩 **Plugin Market** - Browse and install community plugins
- ⚡ **Hot Loading** - Enable plugins without restart
- 🔒 **Sandbox Isolation** - Secure plugin runtime environment
- 📝 **Plugin API** - Rich extension interfaces

### 🎨 Theme Market

Personalize editor appearance:

- 🌈 **Multiple Themes** - Preset beautiful themes
- 🎨 **Custom Themes** - Adjust colors, fonts freely
- 💾 **Theme Import/Export** - Share your theme configurations
- 🌙 **Dark Mode** - Auto-follow system settings

### ☁️ Cloud Sync

Multi-device data synchronization:

- 📱 **Cross-device Sync** - Seamless switching between devices
- 🔐 **Data Encryption** - End-to-end encryption for privacy
- 📦 **Incremental Sync** - Sync only changes, save bandwidth
- ⏱️ **Conflict Resolution** - Automatic sync conflict handling

### 🔍 Full-text Search

Quickly locate document content:

- 🔎 **Real-time Search** - Instant search, millisecond response
- 📊 **Search Highlight** - Highlight matching results
- 🏷️ **Tag Filtering** - Filter documents by tags
- 📅 **Time Range** - Filter by creation/modification time

### ⌨️ Keyboard Shortcuts

| Shortcut | Function | Description |
|----------|----------|-------------|
| `Ctrl + S` | Save document | Save current content |
| `Ctrl + Shift + S` | Save version snapshot | Create historical version |
| `Ctrl + Z` | Undo | Undo last operation |
| `Ctrl + Shift + Z` | Redo | Redo operation |
| `Ctrl + F` | Find & Replace | Search and replace text |
| `Ctrl + K` | Open AI dialog | Quick AI access |

---

## 🛠️ Tech Stack

<table>
<tr>
<th>Technology</th>
<th>Version</th>
<th>Purpose</th>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/nextdotjs/000000" width="20"> Next.js</td>
<td>16</td>
<td>Full-stack framework (App Router)</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/react/61DAFB" width="20"> React</td>
<td>19</td>
<td>UI component library</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/typescript/3178C6" width="20"> TypeScript</td>
<td>5</td>
<td>Type safety</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/tailwindcss/06B6D4" width="20"> Tailwind CSS</td>
<td>4</td>
<td>Atomic CSS</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/supabase/3FCF8E" width="20"> Supabase</td>
<td>-</td>
<td>PostgreSQL database</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/katex/000000" width="20"> KaTeX</td>
<td>-</td>
<td>Math formula rendering</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/mermaid/FF3670" width="20"> Mermaid</td>
<td>-</td>
<td>Chart drawing</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/apacheecharts/AA344D" width="20"> ECharts</td>
<td>-</td>
<td>Data visualization</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/vitest/6E9F18" width="20"> Vitest</td>
<td>-</td>
<td>Unit testing</td>
</tr>
<tr>
<td><img src="https://cdn.simpleicons.org/playwright/2EAD33" width="20"> Playwright</td>
<td>-</td>
<td>E2E testing</td>
</tr>
</table>

---

## 📦 Quick Start

### Requirements

- Node.js `>= 18.0`
- pnpm `>= 8.0` (recommended) or npm / yarn

### Installation

```bash
# 1. Clone the project
git clone https://github.com/riceshowerX/therex.git
cd therex

# 2. Install dependencies
pnpm install

# 3. Configure environment variables (optional)
cp .env.example .env.local

# 4. Start development server
pnpm dev
```

Open [http://localhost:5000](http://localhost:5000) to view the application.

### Environment Variables

```env
# Supabase configuration (optional, for cloud sync)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📦 Deployment

### Vercel Deployment (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/riceshowerX/therex)

1. Click the button above to clone the project to Vercel
2. Configure environment variables (optional)
3. Click Deploy to complete deployment

### Docker Deployment

```bash
# Build image
docker build -t therex .

# Run container
docker run -p 3000:3000 therex
```

---

## 🗺️ Roadmap

### ✅ Completed

- [x] Basic Markdown editor
- [x] AI writing assistant
- [x] Multi-document management
- [x] Version history
- [x] Math formulas and charts
- [x] Multiple storage backend support
- [x] Internationalization (Chinese/English)
- [x] PWA installation support
- [x] Real-time collaborative editing
- [x] Document sharing
- [x] Mobile optimization
- [x] Plugin system
- [x] Theme market
- [x] Enhanced cloud sync
- [x] Full-text search
- [x] Tag management

### 🚧 In Progress

- [ ] More AI model support
- [ ] Performance optimization
- [ ] Test coverage improvement

### 📋 Planned

- [ ] Offline collaboration support
- [ ] More export formats
- [ ] Team workspaces

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!

```bash
# 1. Fork the project
# 2. Create a branch
git checkout -b feature/your-feature

# 3. Commit changes
git commit -m 'feat: add some feature'

# 4. Push branch
git push origin feature/your-feature

# 5. Create Pull Request
```

---

## 📄 License

This project is licensed under the [MIT](LICENSE) License.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [marked](https://marked.js.org/) - Markdown parsing
- [KaTeX](https://katex.org/) - Math formulas
- [Mermaid](https://mermaid.js.org/) - Charts
- [ECharts](https://echarts.apache.org/) - Data visualization

---

## ⚠️ Disclaimer

This project is for learning and research purposes only. No warranties are provided.

### Usage Notice

1. **AI Services**: The AI writing assistant feature requires users to configure their own API Keys. Users are responsible for costs incurred from AI services and must comply with each provider's terms and pricing.

2. **Data Security**: User data is stored locally in the browser or in cloud services configured by users. Developers are not responsible for data loss or breaches resulting from using this software.

3. **Intellectual Property**: Content created by users using this software belongs to the users. This project claims no rights over user-created content.

4. **Trademark Notice**: Third-party trademarks, service marks, and product names mentioned in this project are the property of their respective owners.

5. **No Warranty**: This software is provided "as is" without any express or implied warranties, including but not limited to merchantability and fitness for a particular purpose.

6. **Limitation of Liability**: In no event shall the developers be liable for any damages arising from the use or inability to use this software.

### Open Source License

This project is open-sourced under the MIT License. You are free to use, modify, and distribute it, but please retain the original author's copyright notice.

---

<div align="center">

**[⬆ Back to Top](#-therex)**

Made with ❤️ by [Therex Team](https://github.com/riceshowerX)

If this project helps you, please give it a ⭐️ Star!

</div>
