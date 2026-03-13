import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { defaultSystemPrompts } from '@/lib/ai-config';

// AI 配置接口
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
  config?: AIRequestConfig;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AIRequestBody = await request.json();
    const { action, content, selection, config: customConfig, chatHistory, userMessage } = body;

    // 测试连接
    if (action === 'test') {
      return handleTestConnection(customConfig);
    }
    
    if (!content && !selection && action !== 'chat') {
      return NextResponse.json(
        { error: '请提供内容' },
        { status: 400 }
      );
    }

    // 如果有自定义配置，使用自定义配置调用
    if (customConfig?.apiKey) {
      return handleCustomAIRequest(action, content, selection, customConfig, chatHistory, userMessage);
    }

    // 否则使用默认的 Coze SDK
    return handleDefaultAIRequest(request, action, content, selection, chatHistory, userMessage);
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'AI 服务暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
}

// 处理测试连接
async function handleTestConnection(config?: AIRequestConfig) {
  if (!config?.apiKey) {
    return NextResponse.json(
      { error: '请提供 API Key' },
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
  } catch (error) {
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

  const { systemPrompt, userPrompt, messages: additionalMessages } = getPrompts(action, content, selection, chatHistory, userMessage);

  // 构建消息列表
  const messages = [
    { role: 'system', content: systemPrompt },
    ...additionalMessages,
    { role: 'user', content: userPrompt },
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
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                    );
                  }
                } catch {
                  // 忽略解析错误
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

// 处理默认 AI 请求（使用 Coze SDK）
async function handleDefaultAIRequest(
  request: NextRequest,
  action: string,
  content: string,
  selection?: string,
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage?: string
) {
  const { systemPrompt, userPrompt, messages: additionalMessages } = getPrompts(action, content, selection, chatHistory, userMessage);

  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...additionalMessages,
    { role: 'user' as const, content: userPrompt },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const llmStream = client.stream(messages, {
          temperature: 0.7,
          model: 'doubao-seed-1-6-flash-250615',
        });

        for await (const chunk of llmStream) {
          if (chunk.content) {
            const text = chunk.content.toString();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'AI 服务暂时不可用' })}\n\n`));
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
      systemPrompt = defaultSystemPrompts.continue;
      userPrompt = `请续写以下内容：\n\n${content}`;
      break;

    case 'polish':
      systemPrompt = defaultSystemPrompts.polish;
      userPrompt = `请润色以下文本：\n\n${textToProcess}`;
      break;

    case 'expand':
      systemPrompt = defaultSystemPrompts.expand;
      userPrompt = `请扩展以下内容：\n\n${textToProcess}`;
      break;

    case 'summarize':
      systemPrompt = defaultSystemPrompts.summarize;
      userPrompt = `请总结以下文档的主要内容：\n\n${content}`;
      break;

    case 'translate':
      systemPrompt = defaultSystemPrompts.translate;
      userPrompt = `请翻译以下内容：\n\n${textToProcess}`;
      break;

    case 'fix':
      systemPrompt = defaultSystemPrompts.fix;
      userPrompt = `请修正以下文本中的错误：\n\n${textToProcess}`;
      break;

    case 'outline':
      systemPrompt = defaultSystemPrompts.outline;
      userPrompt = `请为以下主题生成写作大纲：\n\n${content}`;
      break;

    case 'title':
      systemPrompt = defaultSystemPrompts.title;
      userPrompt = `请为以下内容生成标题建议：\n\n${content}`;
      break;

    case 'explain':
      systemPrompt = defaultSystemPrompts.explain;
      userPrompt = `请解释以下内容：\n\n${textToProcess}`;
      break;

    case 'rewrite':
      systemPrompt = defaultSystemPrompts.rewrite;
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
