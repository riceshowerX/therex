/**
 * AI 辅助 API
 *
 * 支持从数据库读取 AI 配置，并在服务端代理请求，避免暴露 API Key
 * - 所有 AI 请求必须通过 configId 从数据库获取配置，不接受前端传入 apiKey
 * - F2：必须通过 getAuthenticatedUserId 鉴权；configId 按 user_id 校验归属，
 *   杜绝拿他人 configId 盗用其 API Key
 * - URL 白名单校验防止 SSRF 攻击
 * - S4：按 provider 分发请求适配器（claude/gemini 走各自协议；文心等暂不支持时明确报错）
 * - SSE 流式解析增加缓冲区处理，防止跨 chunk 数据丢失
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-client';
import { defaultSystemPrompts } from '@/lib/ai-config';
import { withApiHandler, getAuthenticatedUserId } from '@/lib/api-utils';
import { lookup } from 'dns/promises';

// 请求大小限制（1MB）
const MAX_REQUEST_SIZE = 1 * 1024 * 1024;

// 聊天历史限制：最多保留最近 20 轮，单条消息 4000 字符
const MAX_CHAT_HISTORY = 20;
const MAX_CHAT_MESSAGE_LENGTH = 4000;

// 允许的 API 端点域名白名单
const ALLOWED_API_DOMAINS = [
  'ark.cn-beijing.volces.com',
  'api.deepseek.com',
  'api.openai.com',
  'api.moonshot.cn',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'aip.baidubce.com',
  'dashscope.aliyuncs.com',
  'open.bigmodel.cn',
  'api.minimax.chat',
  'api.baichuan-ai.com',
];

/**
 * 判断 IP 是否属于私网/保留地址（P1-9）
 * 覆盖 IPv4 私网段、IPv6 回环/链路本地/ULA、IPv4-mapped IPv6 等
 */
function isPrivateIp(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^::ffff:/, '');
  if (normalized === '::1' || normalized === '127.0.0.1' || normalized === '0.0.0.0') return true;
  if (normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')) {
    // 链路本地 / IPv6 ULA
    return true;
  }
  if (normalized.includes(':')) {
    // 其他 IPv6 地址（无法简单判定为公网时保守拒绝内网段）
    return false;
  }
  const parts = normalized.split('.');
  if (parts.length !== 4) return true;
  const nums = parts.map(Number);
  if (nums.some(n => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = nums;
  if (a === 10) return true;                 // 10.0.0.0/8
  if (a === 127) return true;                // 127.0.0.0/8
  if (a === 169 && b === 254) return true;   // 169.254.0.0/16（云元数据）
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true;   // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 基准测试
  return false;
}

// 验证 URL 是否安全（防止 SSRF，P1-9）
// 严格白名单：仅允许 ALLOWED_API_DOMAINS 或 AI_API_ENDPOINT 环境变量主机；
// DNS 解析后对每个 IP 做私网判定，防止 DNS rebinding。
async function isUrlSafe(urlString: string): Promise<boolean> {
  try {
    const url = new URL(urlString);
    // 仅允许 HTTPS（开发环境可允许 HTTP）
    if (url.protocol !== 'https:' && process.env.NODE_ENV !== 'development') {
      return false;
    }
    const hostname = url.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    // 严格白名单（不再放行任意公网 HTTPS，P1-9）
    const isAllowed = ALLOWED_API_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    // 允许通过 AI_API_ENDPOINT 环境变量配置的自定义端点
    let envHost: string | null = null;
    const envEndpoint = process.env.AI_API_ENDPOINT;
    if (envEndpoint) {
      try {
        envHost = new URL(envEndpoint).hostname;
      } catch {
        envHost = null;
      }
    }
    const isEnvAllowed = envHost !== null && (hostname === envHost || hostname.endsWith(`.${envHost}`));
    if (!isAllowed && !isEnvAllowed) {
      return false;
    }

    // DNS 解析后对 IP 做二次校验（防 DNS rebinding / 私网映射）
    const addresses = await lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return false;
    }
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// AI 配置接口（仅服务端使用）
interface AIRequestConfig {
  provider: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
}

// 请求体接口
interface AIRequestBody {
  action: string;
  content: string;
  selection?: string;
  configId?: string; // 使用数据库中的配置 ID（推荐）
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage?: string;
}

async function postHandler(request: NextRequest) {
  try {
    // F2：调用者鉴权
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: '未授权，请提供有效的认证信息' },
        { status: 401 }
      );
    }

    // 验证请求大小
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: '请求体过大，请减少内容' },
        { status: 413 }
      );
    }

    const body: AIRequestBody = await request.json();
    const { action, content, selection, chatHistory, userMessage, configId } = body;

    // 验证必要参数
    if (!action) {
      return NextResponse.json(
        { error: '缺少 action 参数' },
        { status: 400 }
      );
    }

    // 测试连接（需要 configId 从数据库读取配置）
    if (action === 'test') {
      return handleTestConnection(configId, userId);
    }

    if (!content && !selection && action !== 'chat') {
      return NextResponse.json(
        { error: '请提供内容' },
        { status: 400 }
      );
    }

    // 验证 content 长度
    if (content && content.length > 100000) {
      return NextResponse.json(
        { error: '内容过长，请分段处理' },
        { status: 400 }
      );
    }

    // 限制 chatHistory 长度，防止滥用（F2/F3）
    const safeChatHistory = Array.isArray(chatHistory)
      ? chatHistory.slice(-MAX_CHAT_HISTORY).map(msg => ({
          role: msg.role,
          content: msg.content.slice(0, MAX_CHAT_MESSAGE_LENGTH),
        }))
      : undefined;

    // 必须使用数据库中的配置（不再接受前端传入 apiKey）
    if (!configId) {
      return NextResponse.json(
        { error: '请先在设置中配置 AI' },
        { status: 400 }
      );
    }

    const dbConfig = await getAIConfigFromDB(configId, userId);
    if (!dbConfig) {
      return NextResponse.json(
        { error: 'AI 配置不存在或已失效，请重新配置' },
        { status: 400 }
      );
    }

    return handleCustomAIRequest(action, content, selection, dbConfig, safeChatHistory, userMessage);
  } catch (error) {
    console.error('AI API error:', error);

    // 处理 JSON 解析错误
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '请求格式错误' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'AI 服务暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 从数据库获取 AI 配置（snake_case 列名）
 * F2：必须按 user_id 过滤，校验 configId 归属
 */
async function getAIConfigFromDB(configId: string, userId: string): Promise<AIRequestConfig | null> {
  try {
    const client = getSupabaseAdminClient();
    if (!client) {
      console.warn('Supabase 未配置，无法从数据库获取 AI 配置');
      return null;
    }

    const { data: config, error } = await client
      .from('ai_configurations')
      .select('provider, api_key, api_endpoint, model')
      .eq('id', configId)
      .eq('user_id', userId)
      .single();

    if (error || !config) {
      console.error('获取 AI 配置失败:', error);
      return null;
    }

    return {
      provider: config.provider,
      apiKey: config.api_key,
      apiEndpoint: config.api_endpoint,
      model: config.model,
    };
  } catch (error) {
    console.error('从数据库获取 AI 配置错误:', error);
    return null;
  }
}

// 处理测试连接
async function handleTestConnection(configId?: string, userId?: string) {
  if (!configId || !userId) {
    return NextResponse.json(
      { error: '请先保存 AI 配置后再测试连接' },
      { status: 400 }
    );
  }

  const config = await getAIConfigFromDB(configId, userId);
  if (!config) {
    return NextResponse.json(
      { error: 'AI 配置不存在' },
      { status: 400 }
    );
  }

  if (!(await isUrlSafe(config.apiEndpoint))) {
    return NextResponse.json(
      { error: 'API 端点地址不安全，请检查配置' },
      { status: 400 }
    );
  }

  try {
    const req = buildProviderRequest(config.provider, config, [
      { role: 'user', content: 'Hi' },
    ]);
    if ('error' in req) {
      return NextResponse.json({ error: req.error }, { status: 400 });
    }

    const response = await fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: '连接成功' });
    } else {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error?.message || '连接失败，请检查 API Key 和端点' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: '连接失败，请检查网络或端点地址' },
      { status: 400 }
    );
  }
}

/**
 * S4：按 provider 构建上游请求。
 * 不再"一律 OpenAI 格式"：Claude 走 /v1/messages + x-api-key + anthropic-version；
 * Gemini 走 streamGenerateContent + x-goog-api-key；文心等暂不支持时返回明确错误。
 */
function buildProviderRequest(
  provider: string,
  config: AIRequestConfig,
  messages: Array<{ role: string; content: string }>
): { url: string; headers: Record<string, string>; body: unknown } | { error: string } {
  const baseUrl = config.apiEndpoint.replace(/\/+$/, '');

  if (provider === 'claude') {
    const system = messages.find(m => m.role === 'system')?.content;
    const rest = messages.filter(m => m.role !== 'system');
    return {
      url: `${baseUrl}/messages`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model: config.model,
        max_tokens: 2048,
        system,
        messages: rest,
        stream: true,
      },
    };
  }

  if (provider === 'gemini') {
    const system = messages.find(m => m.role === 'system')?.content;
    const rest = messages.filter(m => m.role !== 'system');
    const contents = rest.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const body: Record<string, unknown> = { contents };
    if (system) {
      body.systemInstruction = { parts: [{ text: system }] };
    }
    return {
      url: `${baseUrl}/models/${encodeURIComponent(config.model)}:streamGenerateContent?alt=sse`,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.apiKey,
      },
      body,
    };
  }

  if (provider === 'wenxin') {
    return {
      error: '文心一言 (百度) 提供商暂不支持流式代理，请选择 OpenAI 兼容提供商（豆包/DeepSeek/OpenAI/Kimi/通义千问等）',
    };
  }

  // OpenAI 兼容格式
  return {
    url: `${baseUrl}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: {
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    },
  };
}

/**
 * 解析单个 SSE data 负载，按 provider 提取文本增量。
 */
function parseProviderData(provider: string, data: string): { text?: string; done?: boolean } {
  if (data === '[DONE]') return { done: true };
  try {
    const obj = JSON.parse(data);
    if (provider === 'claude') {
      if (obj.type === 'content_block_delta' && obj.delta?.text) {
        return { text: obj.delta.text as string };
      }
      if (obj.type === 'message_stop') {
        return { done: true };
      }
      return {};
    }
    if (provider === 'gemini') {
      const parts = obj.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        const text = parts.map((p: { text?: string }) => p.text || '').join('');
        if (text) return { text };
      }
      return {};
    }
    // OpenAI 兼容
    const delta = obj.choices?.[0]?.delta?.content;
    if (typeof delta === 'string' && delta) {
      return { text: delta };
    }
    if (obj.choices?.[0]?.finish_reason) {
      return { done: true };
    }
    return {};
  } catch {
    return {};
  }
}

// 处理自定义 AI 请求
async function handleCustomAIRequest(
  action: string,
  content: string,
  selection?: string,
  config?: AIRequestConfig,
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage?: string
) {
  if (!config) {
    return NextResponse.json(
      { error: '配置缺失' },
      { status: 400 }
    );
  }

  // SSRF 防护：验证 API 端点（P1-9）
  if (!(await isUrlSafe(config.apiEndpoint))) {
    return NextResponse.json(
      { error: 'API 端点地址不安全' },
      { status: 400 }
    );
  }

  const { systemPrompt, userPrompt, messages: additionalMessages } = getPrompts(action, content, selection, chatHistory, userMessage);

  // 构建消息列表
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...additionalMessages,
    { role: 'user' as const, content: userPrompt },
  ];

  // S4：按 provider 构建请求；不支持时直接返回明确错误（而非必然失败的 OpenAI 格式）
  const req = buildProviderRequest(config.provider, config, messages);
  if ('error' in req) {
    return NextResponse.json({ error: req.error }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 客户端断开时中止上游请求（P1-12）
      const streamSignal = (controller as unknown as { signal: AbortSignal }).signal;
      const abortController = new AbortController();
      const onAbort = () => abortController.abort();
      streamSignal.addEventListener('abort', onAbort, { once: true });
      try {
        const response = await fetch(req.url, {
          method: 'POST',
          headers: req.headers,
          body: JSON.stringify(req.body),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error.error?.message || 'API 请求失败' })}\n\n`
            )
          );
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let buffer = ''; // 缓冲区处理跨 chunk 的数据

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // 保留最后一个可能不完整的行
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6);
                const parsed = parseProviderData(config.provider, data);
                if (parsed.done) {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }
                if (parsed.text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: parsed.text })}\n\n`)
                  );
                }
              }
            }
          }

          // 处理缓冲区剩余数据
          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              const parsed = parseProviderData(config.provider, data);
              if (parsed.done) {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              } else if (parsed.text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: parsed.text })}\n\n`)
                );
              }
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('Custom AI stream error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'AI 服务暂时不可用' })}\n\n`)
        );
        controller.close();
      } finally {
        streamSignal.removeEventListener('abort', onAbort);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// 接入统一限流与错误处理（P1-8）
export const POST = withApiHandler(postHandler);

// 获取提示词
function getPrompts(
  action: string,
  content: string,
  selection?: string,
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage?: string
) {
  let systemPrompt = '';
  let userPrompt = '';
  let messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // 对于需要选中文本的操作，如果没有选中则使用全文
  const textToProcess = selection || content;

  switch (action) {
    case 'continue':
      systemPrompt = defaultSystemPrompts['continue'] || '';
      userPrompt = `请续写以下内容：\n\n${content}`;
      break;

    case 'polish':
      systemPrompt = defaultSystemPrompts['polish'] || '';
      userPrompt = `请润色以下文本：\n\n${textToProcess}`;
      break;

    case 'expand':
      systemPrompt = defaultSystemPrompts['expand'] || '';
      userPrompt = `请扩展以下内容：\n\n${textToProcess}`;
      break;

    case 'summarize':
      systemPrompt = defaultSystemPrompts['summarize'] || '';
      userPrompt = `请总结以下文档的主要内容：\n\n${content}`;
      break;

    case 'translate':
      systemPrompt = defaultSystemPrompts['translate'] || '';
      userPrompt = `请翻译以下内容：\n\n${textToProcess}`;
      break;

    case 'fix':
      systemPrompt = defaultSystemPrompts['fix'] || '';
      userPrompt = `请修正以下文本中的错误：\n\n${textToProcess}`;
      break;

    case 'outline':
      systemPrompt = defaultSystemPrompts['outline'] || '';
      userPrompt = `请为以下主题生成写作大纲：\n\n${content}`;
      break;

    case 'title':
      systemPrompt = defaultSystemPrompts['title'] || '';
      userPrompt = `请为以下内容生成标题建议：\n\n${content}`;
      break;

    case 'explain':
      systemPrompt = defaultSystemPrompts['explain'] || '';
      userPrompt = `请解释以下内容：\n\n${textToProcess}`;
      break;

    case 'rewrite':
      systemPrompt = defaultSystemPrompts['rewrite'] || '';
      userPrompt = `请改写以下内容：\n\n${textToProcess}`;
      break;

    case 'chat':
      systemPrompt = `你是一个专业的写作助手。你会根据用户的问题提供帮助，包括：
- 写作建议和技巧
- 文档内容分析
- 文本修改建议
- Markdown 格式帮助
- 其他与写作相关的问题

当前文档内容：
\`\`\`
${content}
\`\`\`

请用中文回答用户的问题。如果用户的问题是关于当前文档的，请结合文档内容给出回答。`;

      // 构建对话历史
      if (chatHistory && chatHistory.length > 0) {
        messages = chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
      }
      userPrompt = userMessage || '你好，请帮我看看这篇文档。';
      break;

    default:
      systemPrompt = `你是一个专业的写作助手。请根据用户的请求提供帮助。`;
      userPrompt = content || selection || '';
  }

  return { systemPrompt, userPrompt, messages };
}
