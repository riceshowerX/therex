# Therex 全维度代码审查报告（架构师视角）

- **审查日期**: 2026-08-16
- **审查人**: 高见远（Bob，软件架构师）
- **审查对象**: `C:\Users\huaizhu\Desktop\therex-main`
- **项目简介**: Therex —— 现代化 Markdown 编辑器，深度集成 AI（智能写作、RAG、翻译、图像理解、个性化学习、实时协作）。Next.js 16.1.7 (App Router) + React 19.2.3 + TypeScript 5.9 + Tailwind CSS 4 + shadcn/ui + coze-coding-dev-sdk + Supabase/Drizzle + Vitest + Playwright
- **审查方式**: 阅读 AGENTS.md / package.json / next.config.ts / tsconfig.json / vitest.config.ts / playwright.config.ts / .env.example 等全局配置；Glob 列出全部 src 下 139 个 .ts/.tsx 文件，Grep/Read 逐文件覆盖；重点通读 src/lib（AI/协作/存储/同步/分享/插件/导出）、src/app/api（全部 API 路由）、src/hooks、src/components/markdown-editor.tsx（3125 行）与各功能组件；对关键安全模式（innerHTML/eval/any/localStorage 敏感数据/fetch 目标）做定向检索。
- **工具验证**: 本环境未安装 node_modules（`npx tsc` 无法执行、`pnpm test` 无法运行），类型检查与测试执行留待工程师环境；本次为纯静态审查，未修改任何代码。

---

## 1. 审查概览

| 维度 | 结论 |
|---|---|
| 扫描文件 | src 下全部 139 个 .ts/.tsx + 根配置 + scripts |
| 发现问题总数 | **32** |
| 致命（Critical） | 3 |
| 严重（High） | 8 |
| 中等（Medium） | 13 |
| 轻微（Low） | 8 |
| 核心结论 | 当前版本存在 3 个可被未授权访问直接利用的**后端接口鉴权缺失**问题（云同步任意读写文档、AI 接口可被匿名滥用/盗用 API Key）；前端存在 **2 条断裂的 AI 功能链路**（旧 AI 对话/写作助手入口被 `checkAIConfig` 永久拦截、编辑器内协作 SSE 不携带令牌导致实时协作失效）；**存储迁移/云分享为"假功能"**；导出 HTML 存在存储型 XSS 隐患。架构上存在"三套 AI 路径、三套导出实现、单文件巨型组件"等结构性问题，值得一次收敛性重构。 |

> 说明：本报告全部问题均基于**当前磁盘代码快照**逐行核实（文件:行号），与仓库内已存在的其他审查文档（针对较早版本）结论有出入处，以本报告为准。

---

## 2. 问题清单（按严重级别排序）

| 编号 | 级别 | 类别 | 文件:行号 | 问题描述 | 影响 | 修复建议 |
|---|---|---|---|---|---|---|
| F1 | 致命 | 安全 | src/app/api/sync/route.ts:15-79, 81-120 | POST/GET 云同步接口**无任何鉴权**，且用 service role（绕过 RLS）直接读写 `documents` 表，`user_id` 硬编码 `default_user`，无用户隔离 | 任何匿名者可枚举/猜测 documentId 读取任意同步文档内容，或用 upsert 覆盖任意文档；数据泄露+篡改 | 接入与 ai-config 一致的鉴权（Supabase JWT 或管理密钥）；按 user_id 过滤；documentId 用不可枚举 UUID；至少启用 withApiHandler 限流 |
| F2 | 致命 | 安全 | src/app/api/ai-assist/route.ts:138-213, 218-247 | POST 处理器不校验调用者身份；`getAIConfigFromDB` 只按 configId 查库、**不校验 user_id 所有权**；配合共享密钥模式（NEXT_PUBLIC 前缀、任何人可 GET 全部 configId），匿名者可拿任意 configId 使用**受害者保存在数据库中的 API Key** 调用 AI | API Key 盗用、费用消耗、可将受害者 Key 打到任意白名单外/内网端点做代理 | ai-assist 同样执行 getAuthenticatedUserId，且按 `user_id` 过滤 configId；configId 校验归属；移除/收紧共享密钥模式 |
| F3 | 致命 | 安全 | src/app/api/ai/service/route.ts:34-213 | AI 流式接口仅限流、**无鉴权**，任何匿名者可无限调用（每分钟 100 次/IP，换 IP 即绕过）；`analyzeImage/imageUrl` 直接把用户 URL 交给 LLM 提供商拉取 | AI 费用被恶意耗尽；imageUrl 未校验协议/内网，存在 SSRF 面（由 AI 侧发起） | 增加鉴权与用量配额；imageUrl 校验 https 协议并做内网地址拦截；请求体限制、chatHistory 长度限制 |
| S1 | 严重 | 功能 | src/lib/collaboration/manager.ts:177 vs src/app/api/collaboration/events/route.ts:23-27 | 编辑器内 `CollaborationManager.connectSSE` 建立 `/api/collaboration/events?roomId=xxx` **不带 token**，而 events 路由强制要求 token 且校验在房成员 → 一律 401 | 编辑器侧实时协作（协作者列表/心跳）完全失效；仅独立 /collab 页面可用 | connectSSE 拼接 `&token=${this.roomToken}`；join/create 成功后先取得 token 再建连 |
| S2 | 严重 | 功能 | src/components/markdown-editor.tsx:740-748；src/lib/ai-config.ts:459-461 | `checkAIConfig` 检查 `getConfig().apiKey`，而 `getConfig()` 恒返回 `apiKey: ''`（Key 只存后端）→ 条件恒为假 → 旧版"AI 对话"对话框与工具栏"AI 写作助手"全部被拦截并弹配置提示 | 两个入口永远无法使用 AI（死功能）；只有 EnhancedAIPanel 可工作 | 改用 `isApiKeyConfigured()` 异步检查后端 `api_key_set`；或直接删除旧入口，统一走 EnhancedAIPanel |
| S3 | 严重 | 功能 | src/components/markdown-editor.tsx:2226-2267 vs src/app/api/ai/service/route.ts:83-176 | AI 助手菜单中 rewrite/title/fix/explain 四个动作在后端 `/api/ai/service` 的 switch 中**不存在** → 即使通过 S2 的检查也会返回"未知的操作类型" | 4 个菜单项 100% 失败 | 后端补充这 4 个 action，或前端改为调用 /api/ai-assist（其 getPrompts 已实现） |
| S4 | 严重 | 功能 | src/app/api/ai-assist/route.ts:347-361；src/lib/ai-providers.ts:330-377 | 所有提供商统一请求 `${endpoint}/chat/completions` + `Authorization: Bearer`（OpenAI 兼容格式）；Claude 需 `/v1/messages` + x-api-key + anthropic-version，Gemini 需 generateContent、文心等格式不同；lib 中已有 `claudeAdapter` 但从未使用 | 设置中选择 Claude/Gemini/文心等提供商后，AI 请求必然失败 | 按 provider 分发适配器（ai-providers.ts 中已具备雏形），路由侧实现 adapter 映射 |
| S5 | 严重 | 安全 | src/lib/markdown-renderer.ts:73-76, 315-373；src/components/markdown-preview.tsx:47-51 | echarts 代码块 JSON 被 `data-chart-config` 属性放行（DOMPurify ALLOW_DATA_ATTR），随后 `JSON.parse` 后直接 `chart.setOption(config)`；ECharts tooltip/formatter 等字段支持 HTML 字符串并内部 innerHTML 渲染 → 恶意文档可注入 tooltip HTML（如 `<img onerror>` / `javascript:` 链接） | 存储型 XSS 变体，预览即触发（CSP `script-src-attr 'none'` 可拦截部分，但 javascript: URL 仍可被点击执行） | 对 echarts 配置做 JSON schema 白名单校验，禁止 formatter 等 HTML 字段；或 renderer 输出时剥离危险键；文档级安全策略 |
| S6 | 严重 | 安全+功能 | src/lib/export/index.ts:124-195；src/components/markdown-editor.tsx:1035-1067 | ① `HTMLExporter.convertToHTML` 用正则转换 Markdown、**对内容完全不转义**，文档内 `<script>`/`onerror` 原样进入导出 HTML 并在浏览器执行；② 旧 `exportFile('html')` 把**未渲染的 Markdown 源码**直接包进 HTML 当"HTML 导出" | 导出文件打开即执行脚本（交付/分享场景 XSS）；HTML 导出功能语义错误 | 渲染用 marked+DOMPurify 后再导出；至少对正文 escapeHtml；删除旧 exportFile 或改为调用统一导出器 |
| S7 | 严重 | 功能 | src/lib/share/manager.ts:84-102, 323-325；src/app/share/[shareId]/page.tsx:39-45 | 分享记录整体存**创建者浏览器 localStorage**，他人打开 /share/[shareId] 时 `getShare` 必为 null → "分享链接不存在"；shareId 用 `Math.random()` 生成（可预测）；密码为无盐 SHA-256（文档自述，仅演示级） | "分享文档"功能跨用户/跨设备完全不可用；ID 可枚举 | 分享服务端化（Supabase 表 + API + 密码 bcrypt/argon2）；短期无法服务端化则 UI 明示"仅本机演示"并移除误导 |
| S8 | 严重 | 功能 | src/lib/storage/manager.ts:544-560；src/components/storage-settings.tsx:198-258 | `migrateTo` 忽略 `_config`、不清空/不切换配置、不写目标后端，仅"导出→清内存→重导入"空转；UI 却展示进度条并提示"迁移成功"；设置页还收集 `serviceRoleKey`（敏感）后丢弃 | 存储切换/云同步迁移是假功能，用户以为数据已上云实则仍在本地 | 实现各 provider 的真实 adapter（IndexedDB/Supabase adapter 已存在但未接入）；migrateTo 持久化新配置并执行迁移；删除或隐藏 serviceRoleKey 输入 |
| M1 | 中等 | 功能 | src/app/settings/page.tsx:415-423 vs src/app/api/ai-config/route.ts:97 | 设置页 temperature 滑杆允许 0~2，后端 schema 校验 `max(1)` → 保存时 400，`saveConfigAsync` 内部吞错、前端仍提示"已保存" | 温度>1 时配置保存静默失败，AI 行为与设置不符 | 统一温度范围（0~1）；saveConfigAsync 失败向上抛，设置页展示真实错误 |
| M2 | 中等 | 功能 | src/hooks/use-ai.ts:434-435 | `useAICompletion` 流式解析 `decoder.decode(value)`（无 stream:true）且 `chunk.split('\n')` 不保留不完整行 → SSE 事件跨网络 chunk 时 JSON.parse 失败、内容静默丢失 | 智能补全输出随机缺字 | 参照 useAI 的实现保留 buffer + `{stream:true}` |
| M3 | 中等 | 功能 | src/components/markdown-editor.tsx:1528-1540 | `aiUsageTracker.recordUsage` 在**拿到流式响应后、读取内容前**立即调用，`outputText` 恒为 '' → 统计的 token/费用严重失真 | 仪表盘 AI 用量统计无意义 | 流式读取结束后统一 recordUsage（或由后端返回真实 usage） |
| M4 | 中等 | 安全 | src/lib/plugins/manager.ts:561-571；src/components/markdown-editor.tsx:342-438 | `requestPermissions` 未配置回调时**默认授予全部权限**；editor 的 `pluginManager.configure` 未提供 `onPermissionRequest` → 任何注册插件静默获得 storage/network/clipboard/editor 全权限 | 第三方/恶意插件可读剪贴板、网络访问、篡改文档而无需用户确认 | configure 时注入 PermissionRequestDialog 回调（该组件已存在但未接线）；无回调时拒绝而非放行 |
| M5 | 中等 | 功能 | src/app/api/collaboration/sync/route.ts:59 | `serverVersion: currentRoom?.documentVersion` 在 updateDocument **之前**读取，返回的是更新前版本，客户端据此报冲突信息有误导 | 冲突提示版本号错误 | 用 updateDocument 返回值 `result.version` |
| M6 | 中等 | 功能 | src/lib/sync/cloud-sync.ts:176-257 | `/api/sync` 永不返回 `conflict: true` → `handleConflict` 实际不可达；`offline-sync:*` localStorage 记录在同步成功后不清理，随文档数无限增长 | 冲突处理死代码、离线队列冗余膨胀 | 服务端增加版本冲突检测；同步成功后删除对应 offline-sync 记录 |
| M7 | 中等 | 安全 | src/lib/collaboration/server.ts:127-134 | 创建房间限流按客户端自报 `creatorName` 计数，改名即绕过；`userRoomCreationLog` 无上限 | 可批量创建房间耗尽 MAX_ROOMS/内存 | 限流键改为服务端生成/校验的身份（join token、真实 IP 等）；加记录条数上限 |
| M8 | 中等 | 安全 | src/lib/ai-config.ts:359-365；.env.example:21-22 | `NEXT_PUBLIC_AI_CONFIG_ADMIN_KEY` 编译进前端 bundle，任何访问者可见；公网部署时 ai-config 的"共享密钥鉴权"形同虚设（虽注释声明仅限单用户/内网） | 公网部署下 AI 配置接口可被任意读写 | 生产环境强制 Supabase JWT 模式；共享密钥模式仅允许 NODE_ENV!=production 或显式开关 |
| M9 | 中等 | 安全 | src/lib/share/manager.ts:323-325；src/lib/secure-storage.ts:181-188 | `generateId`（分享 ID）用 `Math.random()` 非加密随机；`generatePassword` 用 `% max` 取模（有偏）且回退 `Math.random()` | ID 可预测、密码熵不足 | 统一使用 crypto.randomUUID/getRandomValues 并做无偏拒绝采样 |
| M10 | 中等 | 功能 | src/lib/markdown-renderer.ts:20-45；src/components/markdown-preview.tsx:26-29 | katex/hljs 通过动态 import 异步加载，`useMemo` 在加载完成前已执行 → 首次打开文档（未触发再渲染）时数学公式/高亮不显示 | 预览首屏公式缺失，需手动触发刷新 | 加载完成状态驱动重渲染（如 promise 完成后 setState）；或改为同步模块导入 |
| M11 | 中等 | 功能 | src/hooks/use-ai.ts:232-341 | `useAIChat.sendMessage` 依赖 `history` 闭包，连续快速发送时后发请求携带旧 history | 多轮对话上下文错乱 | 使用函数式更新 + ref 保存最新 history |
| M12 | 中等 | 质量 | src/app/api/ai-config/route.ts:125-131 | Supabase 未配置时 GET 返回 200 `{data:[]}` 而非 503，前端 isApiKeyConfigured 等分支语义混乱 | 配置状态判断不可靠 | 未配置时返回 503 { error: 'not configured' }，前端区分处理 |
| M13 | 中等 | 质量 | src/lib/ai/service.ts:340-348 | `askWithContext` 注释称"先添加到知识库"，实际从不添加，仅搜索现有库后回退文档截断 | RAG 文档问答与预期不符、知识库永不自动入库 | 对齐注释与实现（真正 addToKnowledgeBase 或改注释） |
| L1 | 轻微 | 架构 | src/components/markdown-editor.tsx（全文件 3125 行） | 巨型组件：约 60 个 state、300+ 行图标 import、三套导出（exportFile/DocumentExporter/export-utils）、两套 AI 路径（/api/ai/service 与 /api/ai-assist）、defaultSettings 对象重复定义两处 | 可维护性差、易回归 | 按域拆分（editor-shell/ai/documents/share/plugins）；收敛导出与 AI 为单一路径 |
| L2 | 轻微 | 质量 | src/lib/export-utils.ts（563 行）、src/lib/vim-mode.ts（350 行）、src/components/ai/*、src/lib/api-utils.ts:162-302 | 整模块死代码：export-utils/vim-mode/ai-panel/ai-toolbar 仅自引用；validateRequestSize/validateContentLength/validateRequiredFields/safeParseJson/sanitizeForLog 无任何调用方 | 体积与认知负担 | 删除或按需接线（vim-mode 若计划支持则接入编辑器） |
| L3 | 轻微 | 功能 | src/lib/storage/manager.ts:337-368 | `deleteFolder('cascade')` 只删除直属文档与一级子文件夹，**子文件夹内的文档**因 folderId 指向已删文件夹而成孤儿 | 级联删除不完整 | 递归收集所有后代文件夹后一并删除其中文档 |
| L4 | 轻微 | 功能 | src/components/markdown-editor.tsx:1085-1104 | importFile 无文件大小限制（FileReader 全量读入）；设置导入 `JSON.parse` 后不做 schema 校验直接覆盖 | 大文件卡顿/内存压力；畸形设置文件破坏运行 | 限制文件大小；用 zod 校验导入设置 |
| L5 | 轻微 | 功能 | src/components/markdown-editor.tsx:1477-1481 | `handleClearData` 直接 `localStorage.clear()` 清空**整个 origin**（含设置、分享、AI 配置、其他应用数据），且不清 IndexedDB | 误伤范围过大 | 仅删除 therex-* 前缀与 known keys，并二次确认 |
| L6 | 轻微 | 质量 | src/app/layout.tsx:8-17 | `userScalable: false` 禁止页面缩放，违反无障碍要求 | 弱视用户无法放大 | 移除或允许缩放 |
| L7 | 轻微 | 性能 | src/lib/markdown-renderer.ts:318 | `await import('echarts')` 全量引入 ECharts（~1MB+），未按需注册组件 | 预览 bundle 体积大、首屏慢 | 改用 echarts/core + 按需 use() 注册 |
| L8 | 轻微 | 质量 | src/lib/storage/manager.ts:666-673；src/proxy.ts:16-20 | 全部文档内容明文存 localStorage（5MB 配额风险）；响应头仍含已废弃的 `X-XSS-Protection` | 大文档写入失败被吞、配额耗尽；安全头陈旧 | 文档走 IndexedDB；移除 X-XSS-Protection 头 |

---

## 3. 架构评估

### 3.1 整体评分：**6.0 / 10**

| 维度 | 评分 | 说明 |
|---|---|---|
| 功能完整度 | 7 | 功能覆盖面广（编辑/预览/AI/协作/同步/分享/插件/主题/PWA），但多条链路存在"摆设"问题 |
| 安全架构 | 4 | 后端接口鉴权大面积缺失（F1/F2/F3），前端 XSS 面（S5/S6）与 Key 管理（M8）存在结构性风险 |
| 代码组织 | 5 | 单文件巨型组件、三套重复实现、大量死代码，模块边界模糊 |
| 可测试性 | 6 | 有 Vitest/Playwright 配置与少量测试，但核心 AI/协作/同步链路无有效单测覆盖 |
| 可扩展性 | 5 | 插件系统/适配器/存储抽象方向正确，但多数适配器未接线，形同空壳 |

### 3.2 根本性问题（值得重构）

1. **后端无统一认证层**。App Router 各 API 各自实现（或未实现）鉴权，出现 sync 裸奔、ai-service 裸奔、ai-assist 半裸奔、ai-config 双模式拼接的现状。重构应引入统一 `requireAuth(request)` 中间件（Supabase JWT 优先，共享密钥仅开发/内网），并让所有 /api/* 通过同一包装器。
2. **AI 调用存在三套互不兼容的通道**：
   - `/api/ai/service`（coze SDK + 转发请求头，依赖环境变量 Key，action 集合与前端菜单不一致）；
   - `/api/ai-assist`（Supabase 配置 + OpenAI 兼容 fetch，provider 适配缺失）；
   - 前端 `handleAIRequest` / 旧 `handleAIAssist` / `useAI*` / 插件 `aiContext` 四份流式解析逻辑重复。
   建议收敛为：**一条后端路由（ai-assist 升级版，按 provider 走 adapter）+ 一个前端流式解析 Hook + 插件复用该 Hook**。
3. **存储/同步/分享三者未打通**。StorageManager 只落 localStorage；Supabase adapter 存在但未接入；cloud-sync 走 /api/sync 的 default_user 无隔离；share 存 localStorage。建议确立唯一数据层（IndexedDB 本地 + Supabase 远端 + 版本号冲突），share/sync/collab 均基于同一文档服务。
4. **编辑器单组件过载**。3125 行的 markdown-editor.tsx 是典型的"上帝组件"。建议按功能域拆分：`EditorShell`（布局/工具栏）、`DocumentSidebar`、`AIChatDialog`、`ExportDialog`、`ShareDialog`、`CollaborationPanel` 等，状态用 Context/自定义 hook 收敛。

### 3.3 迁移步骤（如启动重构）

1. **阶段一（安全加固，1-2 周）**：统一认证包装器 + ai-assist 所有权校验 + sync 鉴权 + CSP 收紧 + ECharts 配置白名单。不改变 API 形状。
2. **阶段二（功能收敛，2-3 周）**：删旧 AI 入口与死代码；AI 统一走 ai-assist + adapter；协作 SSE 修 token；存储迁移接真实 adapter；分享服务端化。
3. **阶段三（组件拆分，3-4 周）**：按域拆分 markdown-editor；收敛导出实现；补 AI/协作/同步链路单测与 Playwright 冒烟用例。

风险提示：阶段二涉及前后端契约变更，需与测试/QA 同步回归；阶段三纯前端重构，风险可控但需保障数据格式兼容（DATA_FORMAT_VERSION）。

---

## 4. 修复优先级建议

### P0（必须立即修复，阻塞发布）
1. **F1** —— /api/sync 增加鉴权与用户隔离（数据泄露/篡改面最大）
2. **F2** —— /api/ai-assist 增加鉴权与 configId 归属校验（API Key 盗用）
3. **F3** —— /api/ai/service 增加鉴权/配额（费用耗尽）
4. **S5** —— ECharts 配置注入（存储型 XSS）
5. **S6** —— 导出 HTML 消毒与正确渲染（交付文件 XSS）

### P1（尽快修复，影响核心体验）
6. **S1** 协作 SSE 携带 token（编辑器实时协作恢复）
7. **S2/S3** AI 旧入口修复或删除、补齐 4 个缺失 action
8. **S4** 多提供商 adapter 接线（Claude/Gemini/文心）
9. **S7** 分享服务端化（或明确降级为"仅本机演示"）
10. **S8** 存储迁移真实实现或移除假 UI
11. **M2/M3/M11** 流式解析与用量统计正确性
12. **M4** 插件权限默认拒绝
13. **M8** 生产环境禁用共享密钥模式

### P2（可选，质量与体验优化）
14. M1/M5/M6/M7/M9/M10/M12/M13 及全部 L 级问题
15. L1/L2 巨型组件拆分与死代码清理（并入架构重构阶段）

---

*报告结束。全部 32 项均有具体文件:行号依据，修复建议以修改思路为主，具体实现由工程师阶段完成。*
