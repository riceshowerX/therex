# AGENTS.md

## 项目概览

Therex 是一个现代化的 Markdown 编辑器，深度集成了 AI 功能，提供智能写作辅助、文档分析、多语言翻译等高级功能。

### 技术栈
- **框架**: Next.js 16.1.7 (App Router)
- **UI 库**: React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **组件库**: shadcn/ui
- **AI SDK**: coze-coding-dev-sdk
- **测试框架**: Vitest
- **E2E 测试**: Playwright

### 项目结构

```
.
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── api/               # API 路由
│   │   │   ├── ai/            # AI 相关 API
│   │   │   │   ├── service/   # AI 服务核心 API
│   │   │   │   └── knowledge/ # 知识库 API
│   │   │   ├── ai-assist/     # AI 辅助 API
│   │   │   ├── ai-config/     # AI 配置 API
│   │   │   └── collaboration/ # 实时协作 API
│   │   ├── collab/            # 协作页面
│   │   └── settings/          # 设置页面
│   ├── components/            # React 组件
│   │   ├── ai/               # AI 功能组件
│   │   │   ├── ai-panel.tsx  # AI 面板
│   │   │   └── ai-toolbar.tsx # AI 工具栏
│   │   ├── ui/               # shadcn/ui 组件
│   │   └── markdown-editor.tsx # 主编辑器组件
│   ├── hooks/                 # React Hooks
│   │   └── use-ai.ts         # AI 功能 Hooks
│   ├── lib/                   # 核心库
│   │   ├── ai/               # AI 服务模块
│   │   │   ├── service.ts    # AI 服务核心
│   │   │   └── user-profile.ts # 用户画像
│   │   ├── collaboration/    # 实时协作
│   │   ├── storage/          # 存储管理
│   │   ├── sync/             # 云同步
│   │   └── themes/           # 主题管理
│   └── types/                 # TypeScript 类型定义
├── docs/                      # 文档
├── public/                    # 静态资源
└── .coze                      # Coze 配置文件
```

## 核心功能

### AI 智能写作助手
- **智能续写**: 根据上下文自动续写内容
- **文本润色**: 优化文本表达，支持多种风格
- **内容扩展**: 添加细节、例子或解释
- **智能摘要**: 提取文档核心要点
- **智能补全**: 预测并补全后续内容

### AI 文档分析
- **风格分析**: 分析写作风格特点
- **优化建议**: 获取文本优化建议
- **深度分析**: 深度分析内容逻辑和结构

### AI 文档生成
- **大纲生成**: 根据主题生成写作大纲
- **文档生成**: 根据主题生成完整文档
- **思维导图**: 生成思维导图（Mermaid 格式）

### 多语言翻译
- 支持中文、英文、日文、韩文、法文、德文、西班牙文等
- 自动检测源语言
- 保持 Markdown 格式

### 知识库 (RAG)
- 文档导入到知识库
- 语义搜索
- 基于知识库的智能问答

### 图像理解
- 图像内容分析
- 自动生成图像描述

### 个性化学习
- 学习用户写作习惯
- 提供个性化建议
- 记录功能使用偏好

## API 接口

### AI 服务 API (`/api/ai/service`)

#### POST - 执行 AI 功能
```typescript
// 请求体
{
  action: AIAction;        // 操作类型
  content?: string;        // 文档内容
  selection?: string;      // 选中文本
  targetLanguage?: string; // 目标语言（翻译）
  style?: string;          // 写作风格
  // ... 其他参数
}

// 响应（流式）
data: {"content": "..."}  // 内容块
data: [DONE]              // 完成
```

#### GET - 语言检测
```
GET /api/ai/service?text=xxx
// 响应: { language: "中文" }
```

### 知识库 API (`/api/ai/knowledge`)

#### POST - 添加文档
```typescript
{
  content: string;
  tableName?: string;
}
```

#### GET - 搜索知识库
```
GET /api/ai/knowledge?query=xxx&topK=5&minScore=0.5
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务
coze dev

# 运行测试
pnpm test

# 类型检查
npx tsc --noEmit

# 构建生产版本
pnpm build
```

## 代码风格指南

### TypeScript
- 使用严格的类型检查
- 优先使用 `interface` 定义类型
- 避免使用 `any`，使用 `unknown` 代替

### React
- 使用函数组件和 Hooks
- 组件名使用 PascalCase
- 文件名使用 kebab-case
- 使用 `useCallback` 和 `useMemo` 优化性能

### 样式
- 使用 Tailwind CSS
- 遵循 shadcn/ui 设计规范
- 使用语义化颜色变量

### AI 服务
- 使用 `coze-coding-dev-sdk` 进行 AI 调用
- 所有 AI 调用必须通过后端 API
- 使用流式响应提升用户体验

## 安全注意事项

1. **API Key 管理**: 所有 API Key 必须存储在后端，不得暴露给前端
2. **请求验证**: 对所有 API 请求进行参数验证
3. **内容过滤**: 对用户输入进行安全过滤
4. **错误处理**: 不在前端显示敏感错误信息

## 测试说明

### 单元测试
- 使用 Vitest 框架
- 测试文件放在 `__tests__` 目录
- 测试文件命名: `*.test.ts`

### E2E 测试
- 使用 Playwright 框架
- 测试文件放在 `e2e` 目录

## 常见问题

### Q: AI 服务调用失败？
A: 检查 `COZE_WORKLOAD_IDENTITY_API_KEY` 环境变量是否正确设置

### Q: 类型检查报错？
A: 运行 `pnpm install` 确保依赖正确安装

### Q: 服务启动失败？
A: 检查端口 5000 是否被占用，运行 `coze dev` 启动服务

## 更新日志

### v2.0.0 (AI 深度融合升级)
- 新增 AI 智能写作助手核心模块
- 新增知识库 (RAG) 功能
- 新增智能补全与建议系统
- 新增文档生成功能
- 新增多语言翻译功能
- 新增写作风格分析与优化建议
- 新增思维导图生成功能
- 新增图像理解功能
- 新增个性化学习系统
- 升级前端 AI 功能界面
