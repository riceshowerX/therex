/**
 * AI 服务 API 路由
 * 提供所有 AI 功能的后端接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAIService, AIServiceConfig } from '@/lib/ai/service';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { withApiHandler } from '@/lib/api-utils';

// 请求体接口
interface AIRequest {
  action: string;
  content?: string;
  text?: string;
  selection?: string;
  topic?: string;
  outline?: string;
  question?: string;
  imageUrl?: string;
  targetLanguage?: string;
  sourceLanguage?: string;
  style?: 'professional' | 'casual' | 'academic' | 'creative';
  format?: 'bullet' | 'paragraph' | 'outline';
  type?: 'article' | 'report' | 'essay' | 'tutorial';
  expandType?: 'detail' | 'example' | 'explanation';
  analysisType?: 'critical' | 'creative' | 'comparative' | 'structural';
  focusArea?: 'clarity' | 'conciseness' | 'engagement' | 'professionalism';
  cursorPosition?: number;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  config?: Partial<AIServiceConfig>;
}

async function postHandler(request: NextRequest) {
  try {
    const body: AIRequest = await request.json();
    const {
      action,
      content,
      text,
      selection,
      topic,
      outline,
      question,
      imageUrl,
      targetLanguage,
      sourceLanguage,
      style,
      format,
      type,
      expandType,
      analysisType,
      focusArea,
      cursorPosition,
      chatHistory,
      config
    } = body;

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 创建 AI 服务实例
    const aiService = createAIService(config, customHeaders);

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let generator: AsyncGenerator<string> | null = null;
        // ReadableStreamDefaultController 的 signal 在部分 TS DOM lib 中缺失，做类型收窄
        const streamSignal = (controller as unknown as { signal: AbortSignal }).signal;
        // 客户端断开时中止 AI 生成，避免资源与上游费用持续消耗（P1-12）
        const onAbort = () => {
          try {
            generator?.return?.(undefined);
          } catch {
            // 忽略中止错误
          }
        };
        streamSignal.addEventListener('abort', onAbort, { once: true });
        try {

          switch (action) {
            // 写作助手
            case 'continue':
              generator = aiService.continueWriting(content || '', config);
              break;

            case 'polish':
              generator = aiService.polishText(selection || text || '', style, config);
              break;

            case 'expand':
              generator = aiService.expandContent(selection || text || '', expandType, config);
              break;

            case 'summarize':
              generator = aiService.summarizeDocument(content || '', format, config);
              break;

            case 'outline':
              generator = aiService.generateOutline(topic || content || '', type, config);
              break;

            // 智能问答
            case 'ask':
              generator = aiService.askWithContext(question || '', content, config);
              break;

            // 智能补全
            case 'complete':
              generator = aiService.smartComplete(content || '', cursorPosition || 0, config);
              break;

            // 文档生成
            case 'generate-from-outline':
              generator = aiService.generateDocumentFromOutline(outline || '', style, config);
              break;

            case 'generate-by-topic':
              generator = aiService.generateDocumentByTopic(topic || '', type, config);
              break;

            // 翻译
            case 'translate':
              generator = aiService.translate(text || content || '', targetLanguage || '中文', sourceLanguage, config);
              break;

            // 风格分析
            case 'analyze-style':
              generator = aiService.analyzeWritingStyle(text || content || '', config);
              break;

            case 'optimize':
              generator = aiService.getOptimizationSuggestions(text || content || '', focusArea, config);
              break;

            // 思维导图
            case 'mindmap':
              generator = aiService.generateMindMap(content || '', config);
              break;

            // 图像理解
            case 'analyze-image':
              if (!imageUrl) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '请提供图片 URL' })}\n\n`));
                controller.close();
                return;
              }
              generator = aiService.analyzeImage(imageUrl, undefined, config);
              break;

            case 'image-description':
              if (!imageUrl) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '请提供图片 URL' })}\n\n`));
                controller.close();
                return;
              }
              generator = aiService.generateImageDescription(imageUrl, config);
              break;

            // 深度分析
            case 'deep-analysis':
              generator = aiService.deepAnalysis(content || '', analysisType || 'critical', config);
              break;

            // 对话
            case 'chat':
              generator = aiService.chat(question || '', content, chatHistory, config);
              break;

            default:
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '未知的操作类型' })}\n\n`));
              controller.close();
              return;
          }

          if (generator) {
            for await (const chunk of generator) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('AI stream error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'AI 服务暂时不可用' })}\n\n`)
          );
          controller.close();
        } finally {
          streamSignal.removeEventListener('abort', onAbort);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI API error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
    }

    return NextResponse.json({ error: 'AI 服务暂时不可用，请稍后重试' }, { status: 500 });
  }
}

// 语言检测接口
async function getHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');

  if (!text) {
    return NextResponse.json({ error: '请提供文本' }, { status: 400 });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const aiService = createAIService({}, customHeaders);
    const language = await aiService.detectLanguage(text);

    return NextResponse.json({ language });
  } catch (error) {
    console.error('Language detection error:', error);
    return NextResponse.json({ error: '语言检测失败' }, { status: 500 });
  }
}

// 接入统一限流与错误处理（P1-8）
export const POST = withApiHandler(postHandler);
export const GET = withApiHandler(getHandler);
