# MarkFlow 架构文档

## 项目概述

MarkFlow 是一个现代化的 Markdown 编辑器，基于 Next.js 16、React 19 和 TypeScript 构建。采用 Supabase 作为后端数据库，支持 AI 写作助手、多文档管理、实时预览等功能。

## 技术栈

### 前端
- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **组件库**: shadcn/ui (基于 Radix UI)
- **主题管理**: next-themes

### 后端
- **数据库**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM (用于 Schema 定义)
- **API**: Next.js API Routes

### AI 集成
- **AI SDK**: coze-coding-dev-sdk
- **支持模型**: 豆包、DeepSeek、OpenAI、Kimi、自定义

### 其他
- **图标**: Lucide React
- **通知**: Sonner
- **文件下载**: file-saver
- **验证**: Zod

## 项目结构

```
markflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── ai-assist/     # AI 辅助 API
│   │   │   └── ai-config/     # AI 配置 API
│   │   ├── settings/          # 设置页面
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 主页
│   │   └── globals.css        # 全局样式
│   │
│   ├── components/            # React 组件
│   │   ├── ui/                # UI 组件（shadcn/ui）
│   │   ├── markdown-editor.tsx # 主编辑器组件
│   │   ├── theme-provider.tsx # 主题提供者
│   │   ├── pwa-installer.tsx  # PWA 安装器
│   │   └── error-boundary.tsx # 错误边界
│   │
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── use-document-manager.ts  # 文档管理
│   │   ├── use-folder-manager.ts    # 文件夹管理
│   │   ├── use-version-history.ts   # 版本历史
│   │   └── use-ai-config.ts         # AI 配置
│   │
│   ├── lib/                   # 工具库
│   │   ├── services/          # 服务层
│   │   │   └── document-service.ts  # 文档服务
│   │   ├── utils/             # 工具函数
│   │   │   └── performance.ts # 性能优化
│   │   ├── ai-config.ts       # AI 配置
│   │   ├── document-manager.ts # 文档管理器（已废弃，使用服务层）
│   │   ├── templates.ts       # 模板
│   │   ├── env.ts             # 环境变量
│   │   └── error-handler.ts   # 错误处理
│   │
│   └── storage/
│       └── database/          # 数据库相关
│           ├── schema.ts      # 数据库 Schema
│           └── supabase-client.ts # Supabase 客户端
│
├── docs/                      # 文档
│   ├── ARCHITECTURE.md        # 架构文档
│   ├── DEPLOYMENT.md          # 部署指南
│   └── DEPENDENCY_CLEANUP.md  # 依赖清理说明
│
├── public/                    # 静态资源
├── drizzle/                   # 数据库迁移文件
├── .env.example              # 环境变量示例
├── drizzle.config.ts         # Drizzle 配置
├── next.config.ts            # Next.js 配置
├── package.json              # 项目配置
└── tsconfig.json             # TypeScript 配置
```

## 核心架构设计

### 1. 分层架构

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (React Components + Custom Hooks)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│          Service Layer              │
│    (Business Logic + Data Access)   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         Data Layer                  │
│  (Supabase Client + PostgreSQL)     │
└─────────────────────────────────────┘
```

### 2. 数据流

**客户端 → 服务端 → 数据库**

```
Component
    ↓ (Event)
Custom Hook
    ↓ (Service Call)
Service Layer
    ↓ (Supabase SDK)
Supabase Client
    ↓ (HTTP Request)
PostgreSQL Database
```

### 3. 状态管理

- **本地状态**: React useState/useReducer
- **服务端状态**: Supabase 实时查询（未来可考虑 TanStack Query）
- **全局状态**: React Context（主题、用户设置等）

## 数据库设计

### 表结构

#### documents（文档表）
- `id`: 主键（UUID）
- `user_id`: 用户 ID（未来扩展）
- `folder_id`: 所属文件夹（外键）
- `title`: 文档标题
- `content`: Markdown 内容
- `is_favorite`: 是否收藏
- `tags`: 标签（JSONB）
- `word_count`: 字数
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `deleted_at`: 删除时间（软删除）

#### folders（文件夹表）
- `id`: 主键（UUID）
- `user_id`: 用户 ID
- `parent_id`: 父文件夹（自引用外键）
- `name`: 文件夹名称
- `color`: 颜色
- `icon`: 图标
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `deleted_at`: 删除时间（软删除）

#### document_versions（版本历史表）
- `id`: 主键（UUID）
- `document_id`: 文档 ID（外键）
- `content`: 内容
- `title`: 标题
- `description`: 版本描述
- `word_count`: 字数
- `saved_at`: 保存时间

#### ai_configurations（AI 配置表）
- `id`: 主键（UUID）
- `user_id`: 用户 ID
- `provider`: 提供商
- `api_key`: API Key
- `api_endpoint`: API 端点
- `model`: 模型名称
- `temperature`: 温度参数
- `max_tokens`: 最大 token 数
- `enable_system_prompt`: 是否启用系统提示词
- `system_prompt`: 系统提示词
- `is_default`: 是否默认配置
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 安全设计

### 1. API Key 安全
- **存储**: 数据库加密存储（不直接暴露给前端）
- **传输**: HTTPS + JWT 认证
- **使用**: 服务端代理，前端只传配置 ID

### 2. 数据验证
- **输入验证**: Zod schema 验证
- **输出验证**: 类型安全的 TypeScript
- **SQL 注入防护**: 使用参数化查询（Supabase SDK）

### 3. 错误处理
- **全局错误边界**: 捕获渲染错误
- **错误处理器**: 统一错误处理和用户通知
- **错误日志**: 记录错误详情（生产环境发送到监控服务）

## 性能优化

### 1. 前端优化
- **组件懒加载**: React.lazy + Suspense
- **虚拟滚动**: 只渲染可视区域
- **防抖节流**: 减少不必要的渲染和 API 调用
- **代码分割**: Next.js 自动代码分割

### 2. 数据库优化
- **索引**: 关键字段添加索引
- **软删除**: 避免频繁的删除操作
- **版本限制**: 每个文档最多保留 20 个版本
- **查询优化**: 只查询需要的字段

### 3. 网络优化
- **流式响应**: AI 对话使用 SSE 流式传输
- **缓存策略**: 合理使用浏览器缓存
- **CDN 加速**: 静态资源 CDN 分发

## 扩展性设计

### 1. 多用户支持
- 数据库已预留 `user_id` 字段
- API 已支持用户隔离
- 未来可添加认证系统（Supabase Auth）

### 2. 协作功能
- Supabase Realtime 支持实时协作
- WebSocket 连接实现多人编辑
- 操作转换（OT）或 CRDT 算法

### 3. 插件系统
- 设计插件接口
- 支持自定义 Markdown 解析器
- 支持自定义 AI 提示词

## 开发规范

### 1. 代码风格
- 使用 ESLint + Prettier
- 遵循 TypeScript 严格模式
- 使用函数式组件 + Hooks

### 2. 命名规范
- **组件**: PascalCase（如 `MarkdownEditor`）
- **函数/变量**: camelCase（如 `createDocument`）
- **常量**: UPPER_SNAKE_CASE（如 `API_URL`）
- **文件名**: kebab-case（如 `markdown-editor.tsx`）

### 3. Git 提交规范
```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链相关
```

## 未来规划

### 短期（1-2 个月）
- [ ] 添加单元测试
- [ ] 添加集成测试
- [ ] 性能监控集成（Sentry）
- [ ] SEO 优化

### 中期（3-6 个月）
- [ ] 多用户支持
- [ ] 实时协作
- [ ] 插件系统
- [ ] 移动端优化

### 长期（6-12 个月）
- [ ] AI 模型微调
- [ ] 语音输入
- [ ] OCR 识别
- [ ] 团队协作功能
