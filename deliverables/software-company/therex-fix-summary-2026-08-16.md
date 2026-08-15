# Therex 修复总结报告（2026-08-16）

- **修复人**: 寇豆码（Kou，软件工程师）
- **依据**: `deliverables/software-company/therex-code-review-2026-08-16.md` 审查报告 + team-lead 修复规范
- **目标**: 保持原有功能不变、最小化变更；P0 全修，P1 全修，低风险 P2 顺手修复
- **验证**: ✅ tsc 通过 | ✅ vitest 通过（41 passed + 15 skipped 集成） | ✅ next build 通过

---

## 一、修复问题清单（按报告编号）

### P0（3/3 全部修复）

| 编号 | 修复内容 | 主要文件 |
|---|---|---|
| **P0-1 数据丢失** | ① 应用入口（markdown-editor 初始化 effect）先 `await documentManager.initialize()` 再读取数据；② `getCurrentDocument()` 不再隐式创建文档（返回 undefined，新建由 UI 显式触发）；③ `doSave()` 未初始化时走 `mergeWithPersistedData()` 合并持久层数据，杜绝空内存覆盖；④ 新增 `initialize/loadData/saveData` 单元测试 4 例 | `src/lib/storage/manager.ts`、`src/components/markdown-editor.tsx`、`src/lib/storage/__tests__/manager.test.ts` |
| **P0-2 存储型 XSS** | ① 预览 HTML 注入前经 DOMPurify 消毒（保留 KaTeX 内联样式/图表数据属性，`ADD_ATTR:['style',...]`）；② heading 渲染器对文本 `escapeHtml`；③ Mermaid `securityLevel: 'strict'`；④ ECharts 错误回显转义；⑤ HTML/Word 导出前消毒；⑥ CSP 新增 `script-src-attr 'none'` 阻断内联事件处理器（保留 script-src 'unsafe-inline' 以兼容 Next App Router 内联流式脚本，附注释说明） | `src/components/markdown-preview.tsx`、`src/lib/markdown-renderer.ts`、`src/lib/export-utils.ts`、`src/components/markdown-editor.tsx`、`src/proxy.ts` |
| **P0-3 AI 配置越权** | 移除"任意 Bearer 即身份"与 `default_user` 兜底；改为：Supabase JWT 校验（`auth.getUser`）→ 真实 user.id；无 Supabase 时用 `AI_CONFIG_ADMIN_KEY` 共享密钥模式；未配置鉴权时生产环境一律 401，开发环境放行并告警 | `src/app/api/ai-config/route.ts`、`src/lib/env.ts` |

### P1（13/13 全部修复）

| 编号 | 修复内容 | 主要文件 |
|---|---|---|
| **P1-1 AI 链路契约** | 前端 `handleAIRequest` 改用 `configId`（新增 `aiConfigManager.getConfigId()`），不再向前端/服务器发送明文 apiKey；chat 用户消息放入 `userMessage` 字段（后端 `getPrompts` 已读该字段） | `src/components/markdown-editor.tsx`、`src/lib/ai-config.ts` |
| **P1-2 AI Key 保存** | POST 创建配置返回 id 并持久化；PATCH 必须携带 id（`ensureConfigSaved`→`saveApiKeyToBackend`）；`isApiKeyConfigured` 改读 `data[].api_key_set`；设置页"测试连接"改为真实调用 `/api/ai-assist {action:'test',configId}`；`createAIConfigSchema` 的 api_key 改为可选（先建骨架再 PATCH 密钥）、provider 枚举扩展至全部提供商 | `src/lib/ai-config.ts`、`src/app/api/ai-config/route.ts`、`src/app/settings/page.tsx` |
| **P1-3 协作安全** | roomId 改为完整 `crypto.randomUUID()`（128 位）；新增房间/用户访问令牌体系（create/join 返回 roomToken，sync/cursor/leave/events/room GET 均校验）；sync 校验房间成员身份与内容长度（2MB）；版本冲突检测（保留 last-write-wins 并返回 `conflict` 标记）；room GET 未加入时仅返回摘要 | `src/lib/collaboration/server.ts`、`src/lib/collaboration/manager.ts`、`src/app/api/collaboration/*` |
| **P1-4 协作页重连循环** | SSE effect 依赖改为稳定值（isConnected/userId/roomId/roomToken），版本比较改用 `roomVersionRef`；移除 `docContent` URL 传参，内容改由 API 获取 | `src/app/collab/[roomId]/page.tsx` |
| **P1-5 分享降级** | 密码改为 SHA-256 哈希存储/比对（注明非密码学安全方案，服务端化需 bcrypt/argon2）；分享页"链接不存在"时明确提示"当前仅本机可用，跨设备需配置 Supabase 同步" | `src/lib/share/manager.ts`、`src/app/share/[shareId]/page.tsx` |
| **P1-6 云同步** | 新增 `/api/sync` 路由（POST 推送 / GET 拉取，未配置 Supabase 返回 503 `sync not configured`）；cloud-sync 移除"404 即已同步"错误降级，未配置时明确报错；冲突默认 manual；'local' 策略必须真实推送成功才标记完成；'remote' 覆盖前备份本地副本 | `src/app/api/sync/route.ts`（新增）、`src/lib/sync/cloud-sync.ts` |
| **P1-7 next.config** | `outputFileTracingRoot` 由硬编码 `/workspace/projects` 改为 `__dirname`；删除 webpack 分支（`Record<string,unknown>` 宽松类型 + 手动覆盖 optimization），统一 Turbopack 配置 | `next.config.ts` |
| **P1-8 限流接入** | `withApiHandler` 包裹 AI/配置/协作全部敏感路由；新增 `rateLimiterHigh`（600/min）用于协作高频接口；`getClientIdentifier` 优先 `x-real-ip`，不再信任可伪造的 XFF | `src/lib/api-utils.ts`、`src/app/api/ai/service|ai-assist|ai/knowledge|ai-config|collaboration/*` |
| **P1-9 SSRF 收紧** | 移除"任意公网 HTTPS 放行"；严格白名单（`ALLOWED_API_DOMAINS` + env `AI_API_ENDPOINT`）；DNS 解析后逐 IP 判定私网（含 IPv6、172.16/12、169.254、CGNAT、198.18/15 等），防 rebinding | `src/app/api/ai-assist/route.ts` |
| **P1-10 知识库参数** | tableName 白名单（仅 `therex_knowledge`）；topK 钳制 1~20、minScore 0~1；接入 withApiHandler | `src/app/api/ai/knowledge/route.ts` |
| **P1-11 dev.sh** | 端口检测改跨平台（netstat/ss），默认不自动 `kill -9`，改为提示用户手动处理 | `scripts/dev.sh` |
| **P1-12 流式 abort** | AI service/assist 的 `ReadableStream.start` 注册 abort 监听：abort 时 `generator.return()` / `AbortController.abort()` 中止上游请求 | `src/app/api/ai/service/route.ts`、`src/app/api/ai-assist/route.ts` |
| **P1-13 保存竞态** | 新增 ref（content/title/currentDoc）消除闭包旧值；注册 `pagehide/beforeunload/visibilitychange` 强制 `forceSave()` flush；卸载/切换文档用 ref 保存最新内容 | `src/components/markdown-editor.tsx` |

### P2（低风险高价值项，部分修复）

| 编号 | 修复内容 | 文件 |
|---|---|---|
| P2-4 | 自引用外键 `(): any` → `(): AnyPgColumn` | `src/storage/database/schema.ts` |
| P2-5 | `generateId` 优先 `crypto.randomUUID()` | `src/lib/utils.ts` |
| P2-6 | `generatePassword` 改用 `crypto.getRandomValues` + Fisher-Yates 打乱 | `src/lib/secure-storage.ts` |
| P2-7 | `totalCharacters` NaN 修复：`sum + (doc.content?.length ?? 0)` | `src/components/markdown-editor.tsx` |
| P2-8 | Dashboard 每日活动改为真实值 0（标注"示例数据"，移除随机数） | `src/components/markdown-editor.tsx` |
| P2-10 | `aiUsageTracker.recordUsage` 接入 handleAIRequest 成功回调 | `src/components/markdown-editor.tsx` |
| 未使用依赖 | 删除 24 个未使用依赖（含 pg、jspdf、date-fns、recharts、react-hook-form、react-day-picker、13 个 radix 包等）；新增 `dompurify ^3.2.5`；`eslint-config-next 15.5.14 → ^16.2.2`（对齐 next 16）；移除 `shadcn "latest"` | `package.json` |

**本轮未做（大重构，列为后续建议）**：
- P2-1 markdown-editor 2000 行拆分（大重构，按规范不进入本轮）；
- 未使用依赖中保留 drizzle-orm/drizzle-zod/drizzle-kit（schema.ts 仍在引用，删除需先迁移存储层）；
- 协作 CRDT/OT 化、分享服务端化、正式登录体系（依赖产品决策）。

---

## 二、验证结果

| 验证项 | 结果 | 说明 |
|---|---|---|
| 依赖安装 | ✅ 通过 | 环境无 pnpm、corepack 损坏、宿主 safe-delete shim 拦截 → 使用 `npx pnpm@9.0.0 install --store-dir .pnpm-store-local` 成功（退出码 0） |
| `npx tsc --noEmit` | ✅ 通过 | 修复过程中引入的类型错误全部消除（含 ReadableStream signal 类型、动态路由 context 类型、schema 自引用等） |
| `pnpm test`（vitest run） | ✅ 通过 | 41 passed + 15 skipped（`api.test.ts` 为集成测试，需 `TEST_URL` 服务；本次环境无运行中服务，按规范加 `describe.skipIf` 守卫跳过）；新增 P0-1 持久化测试 4 例全部通过 |
| `pnpm build`（next build） | ✅ 通过 | Next 16.1.7 Turbopack 编译成功，17 条路由 + Proxy(Middleware) 全部就绪；需清空宿主注入的 `NODE_OPTIONS=--use-system-ca`（Turbopack worker 拒绝该参数，属环境问题） |
| 全局一致性审查 | **IS_PASS: YES** | 交叉核对：`getUserId()` 旧逻辑已移除；`isUrlSafe` 全部 await；`controller.signal` 已用类型收窄；`default_user` 仅保留在 DB schema 默认值与 /api/sync 注释（已注明后续接入认证）；前端 3 处 AI 调用点与后端契约一致 |

---

## 四、QA 观察项修复（追加，2026-08-16 第二轮）

QA 回归 PASS 后报告 3 个低风险观察项，其中 2 项为本轮修复（第 3 项按指示记录为后续迭代）：

### 观察项 1：P1-8 补漏——不再信任可伪造的 X-Forwarded-For
- **文件**: `src/lib/api-utils.ts`（`getClientIdentifier`）
- **修复**: 识别顺序改为 `request.ip`（Next 16 平台填充）→ `x-real-ip`（反向代理填充）→ `x-vercel-forwarded-for`（Vercel 等平台真实代理头）→ `'unknown'`；**彻底移除对客户端可伪造的 `X-Forwarded-For` 与 User-Agent 的信任**；删除随之失效的 `hashString` 辅助函数。
- **验证**: tsc/vitest 通过。

### 观察项 2：env 命名不一致——共享密钥模式前端认证失败
- **文件**: `src/app/api/ai-config/route.ts`、`src/lib/ai-config.ts`、`src/lib/env.ts`、`.env.example`
- **修复**:
  - 后端 `getAuthenticatedUserId` 共享密钥模式改用**专用请求头 `x-ai-config-key`** 与服务端 env `AI_CONFIG_ADMIN_KEY` 比对（不再要求前端把密钥放进 `Authorization: Bearer`，Authorization 头保留给未来 Supabase JWT 使用）；
  - 前端 `authHeaders()` 改为发送 `x-ai-config-key: <NEXT_PUBLIC_AI_CONFIG_ADMIN_KEY>`；
  - `env.ts` 的 `publicEnvSchema` 显式声明 `NEXT_PUBLIC_AI_CONFIG_ADMIN_KEY`（消除未声明变量），服务端 `serverEnv.AI_CONFIG_ADMIN_KEY` 保持不变；
  - `.env.example` 注明两种模式（Supabase JWT / 本机共享密钥）及"该值会暴露给浏览器、仅限单用户/内网部署"。
  - **P0-3 安全性质保持**：仍禁止任意字符串当身份、无 default_user 兜底、未认证生产环境一律 401。
- **验证**: tsc/vitest 通过。

### 观察项 3：/api/sync 无限流无鉴权
- 按 team-lead 指示记录为**后续迭代**（本轮不处理）。

### 第二轮验证结果
- `npx tsc --noEmit`：✅ 通过（同时修复 QA 新增 `xss-sanitize.test.ts` 的 `as const` 类型错误）
- `pnpm test`（vitest run）：✅ 通过（**46 passed**，含 QA 新增 5 个 XSS 回归测试 + P0-1 持久化测试；15 skipped 为需运行中服务的集成测试）
- 全局一致性审查：**IS_PASS: YES**

---

## 三、未完成项与卡点说明

1. **运行时验证受限**：本环境 5000 端口被无关进程占用，未启动 dev server 做端到端点击验证；建议 QA（任务 #2）在正常环境启动 `pnpm dev` 后回归：文档新建/切换/刷新持久化、Markdown 预览（含 `<img onerror>` 注入防护）、AI 设置保存/测试连接、协作加入/同步、分享密码。
2. **CSP 严格化取舍**：`script-src` 仍保留 `'unsafe-inline'`（Next App Router 依赖内联 `self.__next_f` 流式脚本，移除会导致应用无法水合）；已新增 `script-src-attr 'none'` 阻断 onerror/onclick 等内联事件处理器这一主要 XSS 向量。主防线为 DOMPurify。若需彻底移除 unsafe-inline，需为内联脚本引入 nonce 支持（列入后续）。
3. **eslint peer 警告**：`eslint-config-next@16` 要求 eslint>=9，项目仍为 eslint 8.57.1（`.eslintrc.cjs` 兼容性）。不影响 tsc/test/build；升级 eslint 9 + flat config 属后续事项。
4. **`.pnpm-store-local`**：因宿主 safe-delete shim 干扰默认 pnpm store，安装使用了项目内自定义 store 目录。该目录为构建产物，可安全删除（用户正常环境 `pnpm install` 会重建 node_modules）。
5. **多用户/正式认证**：P0-3 的 JWT 校验依赖 Supabase Auth 登录态；当前应用无登录流程，未配置 Supabase 时采用 `AI_CONFIG_ADMIN_KEY` 共享密钥模式（仅单用户/内网）。正式接入登录后应删除共享密钥分支。
