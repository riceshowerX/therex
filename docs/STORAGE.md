# Therex 存储选项

Therex 支持多种存储后端，让用户可以根据自己的需求选择最适合的方案。

## 存储选项概览

| 存储类型 | 适用场景 | 需要配置 | 跨设备同步 | 容量 |
|---------|---------|---------|-----------|------|
| localStorage | 快速开始，无需配置 | 否 | 否 | ~5MB |
| IndexedDB | 大量本地文档 | 否 | 否 | 数百MB-GB |
| Supabase | 跨设备同步，团队协作 | 是 | 是 | 取决于套餐 |
| PostgreSQL | 自建服务，完全控制 | 是 | 是 | 无限制 |
| MongoDB | 文档存储，灵活模式 | 是 | 是 | 无限制 |

## 1. localStorage（默认）

**特点**：
- 无需任何配置，开箱即用
- 完全离线可用
- 零服务器成本

**适用场景**：
- 个人使用
- 快速尝试 Therex
- 离线写作

**限制**：
- 容量约 5-10MB
- 仅限当前浏览器
- 清除浏览器数据会丢失数据

**使用方式**：
默认启用，无需配置。

## 2. IndexedDB

**特点**：
- 大容量本地存储
- 完全离线可用
- 零服务器成本
- 支持索引和高效查询

**适用场景**：
- 大量文档（数百篇以上）
- 离线优先使用
- 不需要跨设备同步

**配置步骤**：
1. 进入 设置 → 存储后端
2. 选择 "本地数据库 (IndexedDB)"
3. 输入数据库名称（可选）
4. 点击 "切换并迁移数据"

## 3. Supabase（推荐用于跨设备同步）

**特点**：
- 云端 PostgreSQL 数据库
- 支持跨设备同步
- 免费套餐可用
- 支持未来多用户扩展

**适用场景**：
- 多设备使用
- 团队协作（未来）
- 数据备份需求

**配置步骤**：

1. **创建 Supabase 项目**：
   - 访问 [supabase.com](https://supabase.com)
   - 创建新项目
   - 等待项目初始化完成

2. **获取配置信息**：
   - 进入 Settings → API
   - 复制 `Project URL` 和 `anon public` key

3. **创建数据表**：
   
   在 SQL Editor 中运行：
   ```sql
   -- 文档表
   CREATE TABLE documents (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
     content TEXT NOT NULL DEFAULT '',
     is_favorite BOOLEAN NOT NULL DEFAULT false,
     tags JSONB DEFAULT '[]'::jsonb,
     word_count INTEGER NOT NULL DEFAULT 0,
     folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     deleted_at TIMESTAMPTZ
   );

   -- 文件夹表
   CREATE TABLE folders (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     parent_id UUID,
     color VARCHAR(7),
     icon VARCHAR(50),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     deleted_at TIMESTAMPTZ
   );

   -- 版本历史表
   CREATE TABLE document_versions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     title VARCHAR(255) NOT NULL,
     description VARCHAR(500),
     word_count INTEGER NOT NULL DEFAULT 0,
     saved_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- 索引
   CREATE INDEX documents_updated_at_idx ON documents(updated_at);
   CREATE INDEX documents_folder_id_idx ON documents(folder_id);
   CREATE INDEX document_versions_document_id_idx ON document_versions(document_id);
   ```

4. **在 Therex 中配置**：
   - 进入 设置 → 存储后端
   - 选择 "Supabase 云数据库"
   - 填入 URL 和 Key
   - 点击 "测试连接"
   - 点击 "切换并迁移数据"

## 4. PostgreSQL（自建）

**特点**：
- 完全控制
- 无容量限制
- 可自托管

**适用场景**：
- 有自建数据库服务
- 企业部署
- 隐私敏感场景

**状态**：即将推出

## 5. MongoDB

**特点**：
- 文档存储
- 灵活模式
- 高性能

**适用场景**：
- 已有 MongoDB 环境
- 需要灵活数据结构

**状态**：即将推出

## 数据迁移

切换存储后端时，Therex 会自动将数据迁移到新存储：

1. 导出当前所有数据
2. 初始化新存储适配器
3. 将数据导入新存储
4. 保存新配置

**注意**：
- 迁移过程中请勿关闭页面
- 原存储数据会保留，不会删除
- 建议在迁移前先导出备份

## 最佳实践

1. **个人使用**：使用 localStorage 或 IndexedDB 即可
2. **跨设备同步**：推荐使用 Supabase
3. **大量文档**：使用 IndexedDB 或 Supabase
4. **定期备份**：无论使用哪种存储，都建议定期导出备份

## 常见问题

### Q: 如何备份我的数据？
A: 使用导出功能，可以导出为 Markdown、JSON 等格式。

### Q: 切换存储会丢失数据吗？
A: 不会。迁移会复制数据到新存储，原数据保持不变。

### Q: Supabase 免费套餐够用吗？
A: 免费套餐包含 500MB 数据库空间，对于个人文档使用绰绰有余。

### Q: 可以在不同设备使用不同存储吗？
A: 可以。每个设备可以独立配置存储。但要同步数据，需要使用云存储（如 Supabase）。
