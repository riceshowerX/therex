/**
 * AI 知识库 API 路由
 * 提供文档导入和语义搜索功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/lib/ai/service';
import { HeaderUtils } from 'coze-coding-dev-sdk';

// 添加文档到知识库
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, tableName } = body;

    if (!content) {
      return NextResponse.json({ error: '请提供文档内容' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const aiService = createAIService({}, customHeaders);

    const result = await aiService.addToKnowledgeBase(content, tableName || 'therex_knowledge');

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        docId: result.docId,
        message: '文档已添加到知识库'
      });
    } else {
      return NextResponse.json({ 
        error: result.error || '添加失败' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Knowledge add error:', error);
    return NextResponse.json({ error: '添加文档失败' }, { status: 500 });
  }
}

// 搜索知识库
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const topK = parseInt(searchParams.get('topK') || '5');
    const minScore = parseFloat(searchParams.get('minScore') || '0.5');

    if (!query) {
      return NextResponse.json({ error: '请提供搜索查询' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const aiService = createAIService({}, customHeaders);

    const results = await aiService.searchKnowledge(query, topK, minScore);

    return NextResponse.json({ 
      success: true, 
      results,
      count: results.length
    });
  } catch (error) {
    console.error('Knowledge search error:', error);
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}
