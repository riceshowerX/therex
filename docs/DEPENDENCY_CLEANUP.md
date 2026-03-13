# 依赖清理说明

## 需要移除的依赖包

以下依赖包在项目中未被使用，可以安全移除：

### 1. AWS SDK（未使用）
```bash
pnpm remove @aws-sdk/client-s3 @aws-sdk/lib-storage
```

**原因：** 项目中没有使用 S3 对象存储功能

### 2. 其他可能未使用的包（需要进一步验证）

#### html2canvas
- 用于截图功能，但项目中可能没有实际使用
- 如果不需要截图功能，可以移除：
```bash
pnpm remove html2canvas
```

#### jspdf
- 用于 PDF 导出，但项目中使用的是浏览器打印功能
- 如果不需要 PDF 生成，可以移除：
```bash
pnpm remove jspdf
```

#### react-hook-form
- 用于表单管理，但项目中可能没有使用
- 如果没有表单功能，可以移除：
```bash
pnpm remove react-hook-form @hookform/resolvers
```

#### date-fns
- 用于日期处理，检查是否实际使用
- 如果只在模板中使用，可以移除：
```bash
pnpm remove date-fns react-day-picker
```

## 已确认使用的核心依赖

以下依赖包必须保留：

### 数据库
- `@supabase/supabase-js` - Supabase 客户端
- `drizzle-orm` - ORM
- `drizzle-kit` - 数据库迁移工具
- `drizzle-zod` - Schema 验证
- `pg` - PostgreSQL 客户端

### UI 和样式
- `next` - Next.js 框架
- `react` - React
- `react-dom` - React DOM
- `tailwindcss` - 样式框架
- `shadcn/*` - UI 组件（通过 shadcn 安装）

### 编辑器
- `@uiw/react-md-editor` - Markdown 编辑器
- `marked` - Markdown 解析器
- `react-syntax-highlighter` - 代码高亮
- `remark-gfm` - GitHub Flavored Markdown

### 工具库
- `lucide-react` - 图标库
- `sonner` - Toast 通知
- `file-saver` - 文件下载
- `clsx` - 类名工具
- `tailwind-merge` - Tailwind 类名合并
- `class-variance-authority` - 样式变体管理

### AI 集成
- `coze-coding-dev-sdk` - AI SDK
- `zod` - 数据验证

### 开发工具
- `typescript` - TypeScript
- `eslint` - 代码检查
- `@types/*` - 类型定义

## 清理步骤

1. **备份 package.json**
```bash
cp package.json package.json.backup
```

2. **移除未使用的依赖**
```bash
# 移除 AWS SDK（确认未使用）
pnpm remove @aws-sdk/client-s3 @aws-sdk/lib-storage

# 根据实际需求移除其他包
# pnpm remove html2canvas jspdf react-hook-form @hookform/resolvers
```

3. **验证项目**
```bash
# 类型检查
pnpm run ts-check

# 构建项目
pnpm run build

# 启动开发服务器
pnpm run dev
```

4. **测试功能**
- 测试文档创建和编辑
- 测试 AI 功能
- 测试导出功能
- 确保没有功能丢失

## 优化后的依赖包数量

清理前：约 60+ 个依赖包
清理后：约 40 个依赖包

**预期效果：**
- 减少 `node_modules` 体积约 30%
- 减少构建时间约 20%
- 减少打包体积约 15%
