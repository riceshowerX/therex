# Therex 部署指南

本文档介绍如何将 Therex 部署到生产环境。

## 目录

- [环境要求](#环境要求)
- [环境配置](#环境配置)
- [数据库设置](#数据库设置)
- [构建项目](#构建项目)
- [部署选项](#部署选项)
- [后续维护](#后续维护)

## 环境要求

### 开发环境
- Node.js 18+
- pnpm 9.0+
- Git

### 生产环境
- Node.js 18+
- Supabase 账号（或其他 PostgreSQL 数据库）
- 域名（可选）
- HTTPS 证书（推荐）

## 环境配置

### 1. 克隆项目

```bash
git clone https://github.com/riceshowerX/therex.git
cd therex
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 文件并创建 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置以下变量：

```env
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI 配置（可选，如果不配置则无法使用 AI 功能）
AI_DEFAULT_MODEL=doubao
AI_API_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3
AI_API_KEY=your_ai_api_key

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Therex

# 错误监控（可选）
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

## 数据库设置

### 使用 Supabase

1. **创建 Supabase 项目**

   访问 [https://supabase.com](https://supabase.com) 并创建新项目。

2. **获取连接信息**

   在 Supabase 项目设置中获取：
   - Project URL
   - anon public key
   - service_role secret

3. **运行数据库迁移**

   ```bash
   # 生成迁移文件
   pnpm run db:generate

   # 推送到数据库
   pnpm run db:push
   ```

4. **配置 RLS（Row Level Security）**

   在 Supabase SQL Editor 中执行：

   ```sql
   -- 启用 RLS
   ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
   ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;

   -- 创建策略（允许匿名访问，可根据需要调整）
   CREATE POLICY "Public access to documents" ON documents
     FOR ALL USING (true)
     WITH CHECK (true);

   CREATE POLICY "Public access to folders" ON folders
     FOR ALL USING (true)
     WITH CHECK (true);

   CREATE POLICY "Public access to document_versions" ON document_versions
     FOR ALL USING (true)
     WITH CHECK (true);

   CREATE POLICY "Public access to ai_configurations" ON ai_configurations
     FOR ALL USING (true)
     WITH CHECK (true);
   ```

### 使用自建 PostgreSQL

如果使用自建 PostgreSQL 数据库，需要：

1. **创建数据库**

   ```sql
   CREATE DATABASE therex;
   ```

2. **配置连接字符串**

   在 `.env.local` 中设置：

   ```env
   DATABASE_URL=postgresql://user:password@host:5432/therex
   ```

3. **运行迁移**

   ```bash
   pnpm run db:push
   ```

## 构建项目

```bash
# 构建生产版本
pnpm run build

# 测试生产构建
pnpm run start
```

## 部署选项

### 选项 1: Vercel（推荐）

Vercel 是 Next.js 的官方托管平台，部署最简单。

#### 步骤：

1. **安装 Vercel CLI**

   ```bash
   pnpm add -g vercel
   ```

2. **部署到 Vercel**

   ```bash
   vercel
   ```

   按提示操作：
   - 选择部署范围
   - 链接到现有项目（可选）
   - 配置环境变量
   - 等待部署完成

3. **配置环境变量**

   在 Vercel Dashboard 中配置所有环境变量。

4. **自定义域名**

   在 Vercel Dashboard 中添加自定义域名并配置 DNS。

### 选项 2: Docker

#### 创建 Dockerfile

项目已包含 `.coze` 配置，可以直接使用：

```bash
# 构建镜像
docker build -t therex .

# 运行容器
docker run -p 5000:5000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_key \
  therex
```

#### 使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  therex:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_APP_URL=${APP_URL}
    restart: unless-stopped
```

运行：

```bash
docker-compose up -d
```

### 选项 3: 自建服务器（Node.js）

#### 使用 PM2（推荐）

1. **安装 PM2**

   ```bash
   pnpm add -g pm2
   ```

2. **构建项目**

   ```bash
   pnpm run build
   ```

3. **使用 PM2 启动**

   ```bash
   pm2 start pnpm --name "therex" -- start
   ```

4. **设置开机自启**

   ```bash
   pm2 startup
   pm2 save
   ```

#### 使用 Nginx 反向代理

配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

配置 HTTPS（使用 Let's Encrypt）：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 选项 4: 其他平台

- **Netlify**: 支持但需要额外配置
- **Railway**: 简单易用，一键部署
- **Render**: 免费额度，适合小项目
- **AWS/Azure/GCP**: 企业级部署，需要更多配置

## 后续维护

### 1. 数据库备份

**Supabase 自动备份**

Supabase 提供每日自动备份，可在控制台下载。

**手动备份**

```bash
# 使用 pg_dump
pg_dump postgresql://user:password@host:5432/therex > backup.sql

# 恢复
psql postgresql://user:password@host:5432/therex < backup.sql
```

### 2. 监控和日志

**应用监控**

- 集成 Sentry 错误监控
- 配置性能监控
- 设置告警规则

**日志管理**

```bash
# 使用 PM2 查看日志
pm2 logs therex

# 使用 systemd 查看日志
journalctl -u therex -f
```

### 3. 更新部署

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
pnpm install

# 构建项目
pnpm run build

# 重启服务
pm2 restart therex
```

### 4. 数据库迁移

如果有新的数据库变更：

```bash
# 生成迁移文件
pnpm run db:generate

# 推送到数据库（开发环境）
pnpm run db:push

# 或者生成 SQL 并手动执行（生产环境推荐）
pnpm run db:generate
# 然后手动审查 SQL 文件再执行
```

### 5. 性能优化

- **启用 CDN**: 配置静态资源 CDN
- **压缩资源**: 启用 gzip/brotli
- **缓存策略**: 配置合理的缓存头
- **数据库索引**: 定期检查和优化索引

## 故障排查

### 常见问题

**1. 数据库连接失败**

- 检查环境变量是否正确
- 确认数据库地址可访问
- 检查防火墙设置

**2. AI 功能无法使用**

- 确认 AI API Key 已配置
- 检查 API 端点是否正确
- 验证 API Key 是否有效

**3. 构建失败**

- 清理缓存：`rm -rf .next node_modules`
- 重新安装依赖：`pnpm install`
- 检查 Node.js 版本

**4. 页面 404**

- 确认 Next.js 配置正确
- 检查路由文件是否存在
- 验证部署配置

## 安全建议

1. **使用 HTTPS**: 强制使用 HTTPS 保护数据传输
2. **定期更新**: 及时更新依赖包和安全补丁
3. **限制访问**: 配置 IP 白名单或认证系统
4. **备份数据**: 定期备份数据库和配置文件
5. **监控日志**: 定期检查访问日志和错误日志

## 性能优化建议

1. **启用缓存**: 配置 CDN 和浏览器缓存
2. **压缩资源**: 启用 gzip/brotli 压缩
3. **数据库优化**: 添加索引，优化查询
4. **代码分割**: 利用 Next.js 自动代码分割
5. **图片优化**: 使用 next/image 优化图片

## 联系支持

如有问题，请：
- 查看 [GitHub Issues](https://github.com/riceshowerX/therex/issues)
- 阅读 [架构文档](./ARCHITECTURE.md)
- 提交新的 Issue 或 PR

---

**注意**: 首次部署前请务必测试所有功能，确保环境配置正确。
