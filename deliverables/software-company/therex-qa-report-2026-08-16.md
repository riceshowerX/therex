# Therex 独立回归验证报告（QA 视角）

- **验证日期**: 2026-08-16（第 1 轮）+ 2026-08-16（第 2 轮回归，F3 修复后）
- **验证人**: 严过关（Edward，QA 工程师）
- **验证对象**: `C:\Users\huaizhu\Desktop\therex-main`
- **依据**: 架构师审查报告（32 项问题基线）`therex-audit-report-2026-08-16.md`；工程师修复说明 `therex-fixes-2026-08-16.md`；项目规范 `AGENTS.md`
- **验证方式**: 独立读码核实 + 本机实际执行 `npx tsc --noEmit` / `npx vitest run` + 新增 53 个测试用例（第 1 轮）+ 7 个 F3 独立边界用例（第 2 轮）
- **原则**: 以新鲜视角逐项核实修复是否真正生效、有无回归，非橡皮图章式确认

---

## 1. 环境与基线

| 项目 | 结果 |
|---|---|
| node_modules | 已由工程师安装（938 包），本机可执行命令 |
| `npx tsc --noEmit`（第 1/2 轮） | **通过（无类型错误）**；唯一输出 TS5033（无法写 tsconfig.tsbuildinfo，宿主沙箱 EPERM），非类型错误 |
| `npx vitest run`（第 1 轮原始基线） | 46 passed / 15 skipped（api.test.ts 集成套件跳过） |
| `npx vitest run`（第 2 轮最终） | 单元套件 **107 passed / 0 failed**；api.test.ts 集成 13 failed 为环境问题（见 §5 问题 2），非源码回归 |

## 2. 新增测试清单（QA 补充，共 60 个）

### 第 1 轮（53 个）

| 文件 | 数量 | 覆盖 |
|---|---|---|
| `src/__tests__/security-routes.test.ts` | 21 | F1/F2/F3 路由层：无鉴权 401、非法 token 401、非 UUID documentId 400、缺参 400、超限 413/400、Supabase 未配置 503、user_id 隔离过滤（eq 断言）、版本冲突 conflict、configId 归属校验（eq('user_id') 断言）、imageUrl http/内网 400 |
| `src/lib/__tests__/echarts-sanitize.test.ts` | 10 | S5：tooltip.formatter/axisLabel.formatter/renderItem/rich/backgroundColor/on* 剥离、`<`/`javascript:` 值剔除、`__proto__` 不透传、正常 option 保留、非法 JSON 返回空 |
| `src/lib/__tests__/export-sanitize.test.ts` | 5 | S6：导出 HTML 无 `<script>`/`onerror`/`javascript:`、title 转义、Markdown 被渲染而非原样透传 |
| `src/lib/__tests__/url-safety.test.ts` | 12 | F3 纯函数：isSafeExternalUrl/isPrivateIp（https 放行、http/localhost/10.x/172.16-31/192.168/169.254/100.64/::1/fe80/非法 URL 拒绝）+ getAuthenticatedUserId 生产/开发行为 |
| `src/lib/storage/__tests__/qa-fixes.test.ts` | 6 | S8：migrateTo 非 local 抛错、local→local 保数据；L3：级联删除后代文件夹文档无孤儿；M9：generatePassword 长度/字符集/随机性 |

### 第 2 轮（7 个，F3 修复独立边界验证）

| 文件 | 新增 | 覆盖 |
|---|---|---|
| `src/lib/__tests__/url-safety.test.ts` | 7 | F3 修复回归：`https://[::1]/`、`[::]`、`[fe80::1]`/`[fe90::1]`、`[fec0::1]` 拒绝；IPv4-mapped IPv6 点分/十六进制（`[::ffff:7f00:1]`、`[::ffff:c0a8:0101]`）拒绝；公网 IPv6（2001:4860:4860::8888、2606:4700:4700::1111）放行；尾点 IP（127.0.0.1.）与数字/十六进制/简写形式（2130706433、0x7f000001、127.1）经 URL 规范化后拒绝；IPv4 原行为不回退；isPrivateIp 十六进制映射直接判定 |

> 注：工程师修复说明中声称的 S5/S6/S8/M9/L3 单测**实际未交付**（测试树中仅有 xss-sanitize 5 个与 storage 基础 19 个）。上述 60 个测试为 QA 补齐。

## 3. 测试执行结果（第 2 轮）

- **单元套件**（排除集成 api.test.ts）：**8 个文件全部通过，107 passed / 0 failed**。
- 其中 `url-safety.test.ts` **19 tests 全绿**（含第 2 轮新增 7 个 F3 边界用例）——F3 IPv6 修复验证通过。
- `api.test.ts`（集成，15 tests）：13 failed / 2 passed，根因为 :5000 陈旧服务（§5 问题 2），与 F3 修复无关。
- `npx tsc --noEmit`：无类型错误（仅 TS5033 tsbuildinfo 沙箱 EPERN，与第 1 轮一致）。

## 4. 逐项验证结论（32 项）

| 编号 | 结论 | 验证依据 |
|---|---|---|
| F1 | ✅ 通过 | sync 路由 POST/GET 均调用真实 `getAuthenticatedUserId`；无 `default_user` 硬编码；documentId UUID 校验；`withApiHandler` 限流；按 `user_id` 隔离（测试断言 eq 真实下发）；版本冲突检测生效（9 项路由测试通过） |
| F2 | ✅ 通过 | ai-assist POST 鉴权 401；`getAIConfigFromDB(configId, userId)` 按 user_id 过滤；他人 configId → 400（测试断言 eq('user_id') 真实下发）；chatHistory/请求体限长（6 项测试通过） |
| F3 | ✅ 通过（第 2 轮修复验证） | 第 1 轮发现 IPv6 字面量绕过，工程师已修复（isSafeExternalUrl 剥离方括号、isPrivateIp 入口容错 + `::`/fe80::/10、fec0::/10、IPv4-mapped hex 转换）；第 2 轮独立边界用例（[::1]/[::]/[fe80::1]/[fec0::1]/[::ffff:7f00:1]/[::ffff:127.0.0.1]、尾点 IP、数字/十六进制 IP、公网 IPv6 放行）全部通过；鉴权 401、http/内网 IPv4 400、限长 413/400 不回退（21 项路由+URL 测试通过） |
| S5 | ✅ 通过 | sanitizeEChartsConfig 深度剥离 formatter/rich/backgroundColor/renderItem/on*；`<`/`javascript:` 值剔除；`__proto__` 不污染；正常 option 保留（10 项测试通过） |
| S6 | ✅ 通过 | convertToHTML 用 marked 渲染 + DOMPurify 消毒（失败整段转义兜底）；title 转义；旧 exportFile('html') 源码直出路径已删除、统一 documentExporter（5 项测试通过） |
| S1 | ✅ 通过 | connectSSE 拼接 `&token=${encodeURIComponent(roomToken)}`；createRoom/joinRoom 先存 token 再建连 |
| S2 | ✅ 通过 | checkAIConfig 改异步 `isApiKeyConfigured()`（后端 api_key_set）；全文件无 `getConfig().apiKey` 用法 |
| S3 | ✅ 通过 | handleAIAssist 四个缺失动作统一走 `/api/ai-assist`（携带 configId + 鉴权头）；菜单 10 项均可达 |
| S4 | ✅ 通过 | buildProviderRequest 按 provider 分发：Claude `/v1/messages` + x-api-key + anthropic-version；Gemini `streamGenerateContent` + x-goog-api-key；文心明确报错 |
| S7 | ✅ 通过 | generateId 用 `crypto.randomUUID`；ShareDialog 明示"仅限本机演示" |
| S8 | ✅ 通过 | migrateTo 非 local 明确抛错（测试验证）；storage-settings 不再收集 serviceRoleKey；假进度条移除（2 项测试通过） |
| M1 | ✅ 通过 | 温度滑杆 0~1 step 0.1；后端 schema max(1) 对齐 |
| M2 | ✅ 通过 | useAICompletion buffer + `decoder.decode(value,{stream:true})` |
| M3 | ✅ 通过 | recordUsage 移到流式读取结束后，用真实 outputText |
| M4 | ✅ 通过 | requestPermissions 无回调默认拒绝；editor configure 注入 onPermissionRequest + PermissionRequestDialog 接线 |
| M5 | ✅ 通过 | serverVersion 改用 updateDocument 返回值（更新后版本） |
| M6 | ✅ 通过 | 服务端版本冲突检测（route 返回 conflict:true，测试验证）；同步成功后清理 `offline-sync:*` |
| M7 | ✅ 通过 | 创建房间限流键改用 `getClientIdentifier`（真实 IP）；userRoomCreationLog 条数上限 100 |
| M8 | ✅ 通过 | getAuthHeaders 生产返回 {}；共享密钥仅非 production 或显式 ALLOW_SHARED_KEY_AUTH（2 项测试通过） |
| M9 | ✅ 通过 | generatePassword 用 getRandomValues 拒绝采样消除取模偏差（2 项测试通过） |
| M10 | ✅ 通过 | ensureClientLibsLoaded + preview 组件 libsReady 状态驱动 useMemo 重渲染 |
| M11 | ✅ 通过 | useAIChat 用 historyRef + 函数式更新 |
| M12 | ✅ 通过 | ai-config GET Supabase 未配置返回 503 {error:'not configured'} |
| M13 | ✅ 通过 | askWithContext 注释与实现对齐（仅搜索既有库，不自动入库） |
| L1/L2 | ✅ 通过 | src/components/ai/、src/lib/export-utils.ts、src/lib/vim-mode.ts 已删除；Grep 无残留引用（巨型组件 3187 行仍存在，属架构重构阶段事项，修复说明已声明） |
| L3 | ✅ 通过 | deleteFolder('cascade') 递归收集后代文件夹并删除其中文档（1 项测试通过） |
| L4 | ✅ 通过 | importFile 5MB 限制；设置导入 1MB + 手写 schema 校验后再覆盖 |
| L5 | ✅ 通过 | handleClearData 仅删 therex*/markdown-editor-*/offline-sync:*/conflict:*/plugin:*/secure-documents，不清整个 origin |
| L6 | ✅ 通过 | layout.tsx viewport 移除 userScalable/maximumScale |
| L7 | ✅ 通过 | echarts 改 echarts/core + 按需 use() 注册 |
| L8 | ✅ 通过 | proxy.ts 移除 X-XSS-Protection 头 |

## 5. 发现的问题

### 问题 1（已解决 ✅，第 2 轮回归确认）— F3 IPv6 字面量绕过 SSRF 防护
- **初现**: `src/lib/api-utils.ts`（第 1 轮审查）isSafeExternalUrl 对带括号 IPv6 字面量（`https://[::1]/`、`https://[fe80::1]/`、`https://[::ffff:127.0.0.1]/`）判定为安全放行。
- **工程师修复**: ① isSafeExternalUrl 剥离 IPv6 方括号后再交 isPrivateIp；② isPrivateIp 入口统一剥 '['/']'；③ 补强 `::` 未指定地址、fe80::/10 与 fec0::/10、IPv4-mapped IPv6 hex（::ffff:7f00:1）按组补零取末 32 位转点分递归判定。
- **QA 独立复核（第 2 轮，7 个新边界用例 + 12 个原有用例全绿）**: `https://[::1]/`、`https://[::]/`、`https://[fe80::1]/`、`https://[fe90::1]/`、`https://[fec0::1]/`、`https://[::ffff:7f00:1]/`、`https://[::ffff:127.0.0.1]/`、`https://[::ffff:c0a8:0101]/`（192.168.1.1）、`https://[::ffff:0a00:0001]/`（10.0.0.1）均拒绝；公网 IPv6（2001:4860:4860::8888、2606:4700:4700::1111）放行；尾点 IP（127.0.0.1.）与数字/十六进制/简写 IP（2130706433、0x7f000001、127.1）经 WHATWG URL 规范化后均拒绝；IPv4 原行为不回退。
- **结论**: 修复真实生效，缺陷关闭。

### 问题 2（环境问题，非源码回归，仍存在）— :5000 端口存在陈旧服务，集成套件被误触发
- 检测到 PID 27408 监听 5000（Next.js 服务），根路径 200 但 `/api/ai-config`、`/api/sync`、`/api/collaboration/create` 等全部 404，且渲染的 layout 含 `maximum-scale=5`（与当前磁盘代码不一致）→ **为旧代码/旧构建的残留服务**。
- 后果: `src/__tests__/api.test.ts` 的 serverAvailable 探测（根路径 200）误判为"服务可用"→ 集成套件实际运行 → 13 项失败（404/HTML 响应）。第 1、2 轮均复现。
- **判定**: 非本次修复引入的回归；建议停止（PID 27408）或重启该服务后再跑集成测试。本次 QA 结论以单元测试为准。

### 问题 3（文档化行为，风险提示）— 非生产环境鉴权兜底 dev-user
- `getAuthenticatedUserId`（api-utils.ts:346-351）在非 production 且未配置 Supabase/共享密钥时放行 `dev-user`（修复说明 §2.1 已声明）。QA 测试验证该行为存在。
- 风险: 若以非 production 模式部署（staging 等）且未配置鉴权，则接口无真实鉴权。生产模式已验证返回 null → 401。建议部署前确认 `NODE_ENV=production` 或显式配置鉴权。

### 问题 4（报告准确性）— 工程师声称的单测未全部交付
- 修复说明中 S5/S6/S8/M9/L3 标注"验证方式: 单测"，但测试树中无对应测试文件。代码修复本身存在且有效；测试由 QA 补齐（60 个）。建议工程师后续如实区分"代码验证"与"已交付测试"。

## 6. 最终质量结论（第 2 轮）

- **32/32 全部通过**。核心安全项（F1/F2/F3/S5/S6）全部关闭：F3 IPv6 残余缺陷经工程师修复后，QA 独立边界用例全绿。
- 功能类（S1-S4/S7/S8）、质量类（M1-M13、L1-L8）抽样与全量核实：**修复真实生效，未发现回归**。
- 类型检查通过（无类型错误）；单元测试 **107 passed / 0 failed**；集成套件失败为环境问题（:5000 陈旧服务），与代码无关。
- **最终路由判定**: Engineer 修复有效，无需再返工。遗留仅环境项（问题 2，建议清理陈旧服务）与文档化风险提示（问题 3）。
- 整体质量评级：较审查基线显著提升，P0 5/5 完全关闭，可进入发布验证。
