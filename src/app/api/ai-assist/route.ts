/**
 * AI 辅助 API
 *
 * 支持从数据库读取 AI 配置，并在服务端代理请求，避免暴露 API Key
 * - 所有 AI 请求必须通过 configId 从数据库获取配置，不接受前端传入 apiKey
 * - URL 白名单校验防止 SSRF 攻击
 * - SSE 流式解析增加缓冲区处理，防止跨 chunk 数据丢失
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/storage/database/supabase-client';
import { defaultSystemPrompts } from '@/lib/ai-config';

// 请求大小限制（1MB）
const MAX_REQUEST_SIZE = 1 * 1024 * 1024;

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

// 验证 URL 是否安全（防止 SSRF）
function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // 仅允许 HTTPS（开发环境可允许 HTTP）
    if (url.protocol !== 'https:' && process.env.NODE_ENV !== 'development') {
      return false;
    }
    // 检查是否为内网地址
    const hostname = url.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname === '169.254.169.254' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    // 检查域名白名单
    const isAllowed = ALLOWED_API_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    if (isAllowed) return true;
    // 自定义端点仅允许公网 HTTPS 域名
    return url.protocol === 'https:' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname);
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

export async function POST(request: NextRequest) {
  try {
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
      return handleTestConnection(configId);
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

    // 必须使用数据库中的配置（不再接受前端传入 apiKey）
    if (!configId) {
      return NextResponse.json(
        { error: '请先在设置中配置 AI' },
        { status: 400 }
      );
    }

    const dbConfig = await getAIConfigFromDB(configId);
    if (!dbConfig) {
      return NextResponse.json(
        { error: 'AI 配置不存在或已失效，请重新配置' },
        { status: 400 }
      );
    }

    return handleCustomAIRequest(action, content, selection, dbConfig, chatHistory, userMessage);
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
 */
async function getAIConfigFromDB(configId: string): Promise<AIRequestConfig | null> {
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
async function handleTestConnection(configId?: string) {
  if (!configId) {
    return NextResponse.json(
      { error: '请先保存 AI 配置后再测试连接' },
      { status: 400 }
    );
  }

  const config = await getAIConfigFromDB(configId);
  if (!config) {
    return NextResponse.json(
      { error: 'AI 配置不存在' },
      { status: 400 }
    );
  }

  if (!isUrlSafe(config.apiEndpoint)) {
    return NextResponse.json(
      { error: 'API 端点地址不安全，请检查配置' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${config.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
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

  // SSRF 防护：验证 API 端点
  if (!isUrlSafe(config.apiEndpoint)) {
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

  // 使用 OpenAI 兼容 API
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${config.apiEndpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages,
            temperature: 0.7,
            max_tokens: 2048,
            stream: true,
          }),
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
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
                    );
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }

          // 处理缓冲区剩余数据
          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              } else {
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
                    );
                  }
                } catch {
                  // 忽略
                }
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
