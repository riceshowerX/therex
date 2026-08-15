/**
 * AI 知识库 API 路由
 * 提供文档导入和语义搜索功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/lib/ai/service';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { withApiHandler } from '@/lib/api-utils';

// 允许的知识库表名白名单（P1-10）
const ALLOWED_TABLES = ['therex_knowledge'];

function isTableAllowed(tableName: string): boolean {
  return ALLOWED_TABLES.includes(tableName);
}

// 添加文档到知识库
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, tableName } = body;

    if (!content) {
      return NextResponse.json({ error: '请提供文档内容' }, { status: 400 });
    }

    if (typeof content !== 'string' || content.length > 100000) {
      return NextResponse.json({ error: '文档内容过长' }, { status: 400 });
    }

    // tableName 白名单校验（P1-10）
    const requestedTable = tableName || 'therex_knowledge';
    if (typeof requestedTable !== 'string' || !isTableAllowed(requestedTable)) {
      return NextResponse.json({ error: '不允许的知识库表名' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const aiService = createAIService({}, customHeaders);

    const result = await aiService.addToKnowledgeBase(content, requestedTable);

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
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    // 限制 topK 1~20、minScore 0~1（P1-10）
    const rawTopK = parseInt(searchParams.get('topK') || '5');
    const topK = Number.isFinite(rawTopK) ? Math.min(20, Math.max(1, rawTopK)) : 5;
    const rawMinScore = parseFloat(searchParams.get('minScore') || '0.5');
    const minScore = Number.isFinite(rawMinScore) ? Math.min(1, Math.max(0, rawMinScore)) : 0.5;

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

// 接入统一限流与错误处理（P1-8/P1-10）
export const POST = withApiHandler(postHandler);
export const GET = withApiHandler(getHandler);
