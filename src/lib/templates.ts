// Markdown 模板定义
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  content: string;
}

// 内置模板
export const templates: Template[] = [
  {
    id: 'blank',
    name: '空白文档',
    description: '从零开始创建文档',
    category: 'basic',
    icon: '📄',
    content: '',
  },
  {
    id: 'readme',
    name: 'README 文档',
    description: '项目说明文档模板',
    category: 'development',
    icon: '📖',
    content: `# 项目名称

简短的项目描述

## 功能特性

- 特性 1
- 特性 2
- 特性 3

## 快速开始

### 安装

\`\`\`bash
npm install project-name
# 或
yarn add project-name
\`\`\`

### 使用

\`\`\`javascript
import { something } from 'project-name';

// 使用示例
something.doSomething();
\`\`\`

## API 文档

### 方法名称

\`\`\`typescript
function methodName(param: Type): ReturnType
\`\`\`

参数说明：
- \`param\` - 参数描述

返回值：返回值描述

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| option1 | string | 'default' | 选项1描述 |
| option2 | number | 0 | 选项2描述 |

## 贡献指南

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md)

## 许可证

[MIT](LICENSE)
`,
  },
  {
    id: 'blog',
    name: '博客文章',
    description: '技术博客文章模板',
    category: 'writing',
    icon: '✍️',
    content: `# 文章标题

> 文章简介，用一两句话概括文章内容

## 前言

文章背景介绍，为什么要写这篇文章...

## 正文

### 第一个小节

正文内容...

### 第二个小节

正文内容...

## 代码示例

\`\`\`javascript
// 代码示例
const example = "Hello World";
console.log(example);
\`\`\`

## 总结

文章总结...

## 参考资料

- [参考链接1](https://example.com)
- [参考链接2](https://example.com)

---

> 作者：[作者名称](https://github.com/author)  
> 发布日期：${new Date().toLocaleDateString('zh-CN')}
`,
  },
  {
    id: 'meeting-notes',
    name: '会议记录',
    description: '会议记录模板',
    category: 'business',
    icon: '📝',
    content: `# 会议记录

**会议主题**：会议主题  
**会议日期**：${new Date().toLocaleDateString('zh-CN')}  
**会议时间**：开始时间 - 结束时间  
**会议地点**：会议地点  
**记录人**：记录人姓名  

## 参会人员

- 人员1
- 人员2
- 人员3

## 会议议程

1. 议程一
2. 议程二
3. 议程三

## 会议内容

### 议题一：议题名称

**讨论要点**：
- 要点1
- 要点2

**决议**：
- 决议内容

### 议题二：议题名称

**讨论要点**：
- 要点1
- 要点2

**决议**：
- 决议内容

## 待办事项

| 序号 | 任务 | 负责人 | 截止日期 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | 任务描述 | 负责人 | 日期 | 待处理 |
| 2 | 任务描述 | 负责人 | 日期 | 待处理 |

## 下次会议

- **时间**：待定
- **议题**：待定

---

**备注**：其他需要说明的事项
`,
  },
  {
    id: 'technical-design',
    name: '技术设计文档',
    description: '技术方案设计文档',
    category: 'development',
    icon: '🏗️',
    content: `# 技术设计文档

## 文档信息

| 项目 | 内容 |
| --- | --- |
| 文档名称 | 技术设计文档 |
| 版本 | v1.0 |
| 作者 | 作者姓名 |
| 日期 | ${new Date().toLocaleDateString('zh-CN')} |

## 1. 概述

### 1.1 背景

描述项目背景和需求来源...

### 1.2 目标

- 目标1
- 目标2
- 目标3

### 1.3 范围

明确项目范围和边界...

## 2. 架构设计

### 2.1 整体架构

\`\`\`
┌─────────────────────────────────────┐
│           表现层 (UI)               │
├─────────────────────────────────────┤
│           业务逻辑层                │
├─────────────────────────────────────┤
│           数据访问层                │
├─────────────────────────────────────┤
│           数据存储层                │
└─────────────────────────────────────┘
\`\`\`

### 2.2 技术选型

| 层级 | 技术栈 | 说明 |
| --- | --- | --- |
| 前端 | React + TypeScript | UI框架 |
| 后端 | Node.js + Express | 服务端框架 |
| 数据库 | PostgreSQL | 关系型数据库 |
| 缓存 | Redis | 缓存中间件 |

## 3. 数据设计

### 3.1 数据模型

\`\`\`sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### 3.2 数据字典

| 字段名 | 类型 | 说明 | 备注 |
| --- | --- | --- | --- |
| id | INT | 主键 | 自增 |
| username | VARCHAR | 用户名 | 非空 |
| email | VARCHAR | 邮箱 | 唯一 |

## 4. 接口设计

### 4.1 接口列表

| 接口 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| 获取用户列表 | GET | /api/users | 返回用户列表 |
| 创建用户 | POST | /api/users | 创建新用户 |
| 获取用户详情 | GET | /api/users/:id | 返回用户详情 |

### 4.2 接口详情

#### GET /api/users

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 否 | 页码，默认1 |
| size | number | 否 | 每页数量，默认10 |

**响应示例**：

\`\`\`json
{
  "code": 200,
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "size": 10
  }
}
\`\`\`

## 5. 非功能设计

### 5.1 性能要求

- 响应时间 < 200ms
- 并发用户数 > 1000
- 系统可用性 > 99.9%

### 5.2 安全设计

- 身份认证：JWT
- 数据传输：HTTPS
- 敏感数据：加密存储

## 6. 部署方案

### 6.1 环境要求

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### 6.2 部署架构

描述生产环境部署架构...

## 7. 风险评估

| 风险 | 影响 | 概率 | 应对措施 |
| --- | --- | --- | --- |
| 技术风险 | 高 | 中 | 技术预研 |
| 进度风险 | 中 | 低 | 预留缓冲 |
`,
  },
  {
    id: 'api-docs',
    name: 'API 文档',
    description: 'RESTful API 文档模板',
    category: 'development',
    icon: '🔌',
    content: `# API 文档

## 概述

- **Base URL**: \`https://api.example.com/v1\`
- **认证方式**: Bearer Token
- **数据格式**: JSON

## 认证

所有 API 请求需要在 Header 中携带 Token：

\`\`\`
Authorization: Bearer <your_token>
\`\`\`

## 通用响应

### 成功响应

\`\`\`json
{
  "code": 200,
  "message": "success",
  "data": {}
}
\`\`\`

### 错误响应

\`\`\`json
{
  "code": 400,
  "message": "错误描述",
  "error": "ERROR_CODE"
}
\`\`\`

## 接口列表

---

### 用户相关

#### 获取用户列表

\`\`\`http
GET /users
\`\`\`

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | integer | 否 | 页码，默认 1 |
| limit | integer | 否 | 每页数量，默认 20，最大 100 |
| keyword | string | 否 | 搜索关键词 |

**响应示例**

\`\`\`json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "username": "john",
        "email": "john@example.com",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20
    }
  }
}
\`\`\`

---

#### 获取用户详情

\`\`\`http
GET /users/:id
\`\`\`

**路径参数**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| id | integer | 用户 ID |

**响应示例**

\`\`\`json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "profile": {
      "avatar": "https://example.com/avatar.jpg",
      "bio": "Developer"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
\`\`\`

---

#### 创建用户

\`\`\`http
POST /users
\`\`\`

**请求体**

\`\`\`json
{
  "username": "john",
  "email": "john@example.com",
  "password": "secure_password"
}
\`\`\`

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| username | string | 是 | 用户名，3-20字符 |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码，至少8位 |

**响应示例**

\`\`\`json
{
  "code": 201,
  "data": {
    "id": 1,
    "username": "john",
    "email": "john@example.com"
  }
}
\`\`\`

---

#### 更新用户

\`\`\`http
PUT /users/:id
\`\`\`

**请求体**

\`\`\`json
{
  "username": "john_updated",
  "profile": {
    "bio": "New bio"
  }
}
\`\`\`

---

#### 删除用户

\`\`\`http
DELETE /users/:id
\`\`\`

**响应**

\`\`\`json
{
  "code": 200,
  "message": "删除成功"
}
\`\`\`

---

## 错误码说明

| 错误码 | 说明 |
| --- | --- |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 限流规则

- 每分钟最多 60 次请求
- 超出限制返回 429 状态码
`,
  },
  {
    id: 'weekly-report',
    name: '周报模板',
    description: '工作周报模板',
    category: 'business',
    icon: '📊',
    content: `# 工作周报

**报告周期**：${new Date().toLocaleDateString('zh-CN')} ~ ${new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}  
**报告人**：姓名  
**部门**：部门名称  

## 本周工作总结

### 已完成工作

| 序号 | 任务名称 | 完成度 | 说明 |
| --- | --- | --- | --- |
| 1 | 任务描述 | 100% | 详细说明 |
| 2 | 任务描述 | 80% | 详细说明 |

### 进行中工作

| 序号 | 任务名称 | 进度 | 预计完成时间 |
| --- | --- | --- | --- |
| 1 | 任务描述 | 50% | 日期 |
| 2 | 任务描述 | 30% | 日期 |

### 工作亮点

- 亮点1描述
- 亮点2描述

### 遇到的问题

1. **问题描述**
   - 问题详情
   - 解决方案/需要的支持

## 下周工作计划

| 序号 | 任务名称 | 优先级 | 预计工时 |
| --- | --- | --- | --- |
| 1 | 任务描述 | 高 | 2天 |
| 2 | 任务描述 | 中 | 1天 |

## 需要的支持

- 资源需求
- 协作需求
- 其他需求

## 个人成长

### 本周学习

- 学习内容1
- 学习内容2

### 心得体会

总结本周工作心得...

---

**备注**：其他需要说明的事项
`,
  },
  {
    id: 'changelog',
    name: '更新日志',
    description: '项目版本更新日志',
    category: 'development',
    icon: '📋',
    content: `# 更新日志

本项目的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增 (Added)
- 待发布的新功能

### 变更 (Changed)
- 待发布的变更

### 修复 (Fixed)
- 待发布的修复

---

## [1.0.0] - ${new Date().toLocaleDateString('zh-CN')}

### 新增 (Added)
- 初始版本发布
- 核心功能实现
- 基础文档完善

### 变更 (Changed)
- 优化性能
- 改进用户体验

### 修复 (Fixed)
- 修复已知问题

---

## [0.9.0] - ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}

### 新增 (Added)
- Beta 版本功能

### 已知问题
- 问题1描述

---

## 版本说明

- **[Unreleased]**: 开发中的功能
- **[Major.Minor.Patch]**: 已发布版本
  - **Major**: 不兼容的 API 变更
  - **Minor**: 向后兼容的功能新增
  - **Patch**: 向后兼容的问题修复
`,
  },
  {
    id: 'resume',
    name: '简历模板',
    description: '技术简历模板',
    category: 'personal',
    icon: '👤',
    content: `# 个人简历

## 基本信息

| 项目 | 内容 |
| --- | --- |
| 姓名 | 张三 |
| 电话 | 138-0000-0000 |
| 邮箱 | email@example.com |
| 所在地 | 北京市 |
| GitHub | [github.com/username](https://github.com/username) |
| 博客 | [blog.example.com](https://blog.example.com) |

## 求职意向

- **期望职位**：前端开发工程师
- **期望薪资**：面议
- **期望城市**：北京/上海

## 个人简介

3年前端开发经验，熟悉 React、Vue 等主流框架，有大型项目开发经验。热爱技术，善于学习，注重代码质量和用户体验。

## 专业技能

- 熟练掌握 JavaScript/TypeScript，深入理解 ES6+ 特性
- 精通 React 生态系统，包括 Redux、React Router、Next.js 等
- 熟悉 Vue.js 及其生态，有实际项目经验
- 熟练使用 Webpack、Vite 等构建工具
- 了解 Node.js，能开发简单的后端服务
- 熟悉 Git 工作流，有团队协作经验
- 英语 CET-6，能阅读英文技术文档

## 工作经历

### ABC科技有限公司 | 前端开发工程师

*2022.03 - 至今*

**主要职责**：
- 负责公司核心产品的前端开发
- 参与技术方案设计和代码评审
- 指导初级开发人员

**主要成果**：
- 主导完成 XX 项目重构，性能提升 50%
- 开发 XX 组件库，提升团队开发效率
- 优化构建流程，部署时间缩短 60%

### XYZ互联网公司 | 前端开发工程师

*2020.07 - 2022.02*

**主要职责**：
- 负责移动端 H5 页面开发
- 参与需求评审和技术调研

**主要成果**：
- 完成 XX 活动页面开发，PV 达到 XX
- 优化首屏加载速度，从 3s 降至 1.5s

## 项目经历

### 电商管理后台

*2023.01 - 2023.06*

**技术栈**：React + TypeScript + Ant Design + Redux Toolkit

**项目描述**：
企业级电商管理后台，包含商品管理、订单管理、数据分析等模块。

**主要工作**：
- 负责商品模块开发，实现商品 CRUD、规格管理等功能
- 封装通用表格组件，支持复杂筛选和批量操作
- 实现 RBAC 权限控制，细粒度到按钮级别
- 优化大数据表格渲染，使用虚拟滚动提升性能

### 移动端商城小程序

*2022.06 - 2022.12*

**技术栈**：Taro + React + Redux

**项目描述**：
跨平台小程序商城，支持微信、支付宝多端运行。

**主要工作**：
- 搭建项目基础架构，配置多端构建
- 实现首页、商品详情、购物车等核心页面
- 封装支付、登录等通用能力
- 解决多端兼容性问题

## 教育经历

### XX大学 | 计算机科学与技术 | 本科

*2016.09 - 2020.06*

- GPA：3.8/4.0
- 主修课程：数据结构、算法、操作系统、计算机网络等
- 获得奖学金 XX 次

## 荣誉奖项

- 2023 年度优秀员工
- XX 技术竞赛二等奖
- XX 开源项目贡献者

## 自我评价

对前端技术有浓厚兴趣，保持持续学习。注重代码规范和工程质量，善于解决复杂问题。有良好的沟通能力和团队协作精神，能够独立承担项目开发任务。
`,
  },
  {
    id: 'resume-simple',
    name: '简约简历',
    description: '简洁风格的个人简历',
    category: 'personal',
    icon: '📝',
    content: `# 张三

前端开发工程师 | 北京 | 138xxxx0000 | email@example.com

## 技能

React · Vue · TypeScript · Node.js · Webpack · Git

## 经历

### ABC科技 · 前端开发工程师
*2022.03 - 至今*

- 主导 XX 项目开发，服务 10w+ 用户
- 重构核心模块，性能提升 50%
- 开发组件库，提升团队效率 30%

### XYZ公司 · 前端开发工程师
*2020.07 - 2022.02*

- 负责移动端 H5 开发
- 优化首屏加载，从 3s 降至 1.5s

## 教育

**XX大学** · 计算机科学 · 本科 · 2016-2020

## 项目

**电商后台** - React + TypeScript + Ant Design
> 企业级管理系统，负责商品模块、权限系统开发

**小程序商城** - Taro + React
> 跨平台小程序，实现多端一套代码

## 其他

- GitHub: github.com/username
- 博客: blog.example.com
- 英语 CET-6
`,
  },
];

// 按分类获取模板
export function getTemplatesByCategory(category: string): Template[] {
  return templates.filter(t => t.category === category);
}

// 获取模板分类
export const templateCategories = [
  { id: 'basic', name: '基础', icon: '📄' },
  { id: 'development', name: '开发', icon: '💻' },
  { id: 'writing', name: '写作', icon: '✍️' },
  { id: 'business', name: '商务', icon: '📊' },
  { id: 'personal', name: '个人', icon: '👤' },
];

// 根据 ID 获取模板
export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}
