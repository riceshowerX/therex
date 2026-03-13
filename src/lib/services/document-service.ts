/**
 * 文档服务层
 *
 * 使用 Supabase SDK 进行数据库操作
 * 提供 CRUD 操作和版本历史管理
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { documents, folders, documentVersions } from '@/storage/database/schema';
import type { Document, Folder, DocumentVersion } from '@/storage/database/schema';

// 优化的字数计算函数
function calculateWordCount(content: string): number {
  if (!content || !content.trim()) return 0;
  
  // 使用正则表达式匹配单词，比 split 更准确
  const words = content.trim().match(/[\w\u4e00-\u9fa5]+/g);
  return words ? words.length : 0;
}

// ==================== 文档操作 ====================

/**
 * 创建新文档
 */
export async function createDocument(
  title: string = 'Untitled',
  content: string = '',
  folderId: string | null = null
): Promise<Document> {
  const client = getSupabaseClient();
  const wordCount = calculateWordCount(content);

  const { data, error } = await client
    .from('documents')
    .insert({
      title,
      content,
      folder_id: folderId,
      word_count: wordCount,
    })
    .select()
    .single();

  if (error) {
    console.error('创建文档失败:', error);
    throw new Error('创建文档失败');
  }

  return data;
}

/**
 * 获取文档
 */
export async function getDocument(id: string): Promise<Document | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('deleted_at', null) // 排除已删除的文档
    .single();

  if (error) {
    console.error('获取文档失败:', error);
    return null;
  }

  return data;
}

/**
 * 更新文档
 */
export async function updateDocument(
  id: string,
  updates: Partial<Pick<Document, 'title' | 'content' | 'folderId' | 'isFavorite' | 'tags'>>
): Promise<Document | null> {
  const client = getSupabaseClient();

  // 计算字数
  const wordCount = updates.content !== undefined
    ? calculateWordCount(updates.content)
    : undefined;

  const { data, error } = await client
    .from('documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      ...(wordCount !== undefined ? { word_count: wordCount } : {}),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新文档失败:', error);
    return null;
  }

  return data;
}

/**
 * 删除文档（软删除）
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('删除文档失败:', error);
    return false;
  }

  return true;
}

/**
 * 获取所有文档
 */
export async function getAllDocuments(folderId: string | null = null): Promise<Document[]> {
  const client = getSupabaseClient();

  let query = client
    .from('documents')
    .select('*')
    .eq('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (folderId !== null) {
    query = query.eq('folder_id', folderId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('获取文档列表失败:', error);
    return [];
  }

  return data || [];
}

/**
 * 搜索文档
 */
export async function searchDocuments(query: string): Promise<Document[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('documents')
    .select('*')
    .eq('deleted_at', null)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('搜索文档失败:', error);
    return [];
  }

  return data || [];
}

/**
 * 切换文档收藏状态
 */
export async function toggleDocumentFavorite(id: string): Promise<Document | null> {
  const client = getSupabaseClient();

  // 先获取当前状态
  const { data: currentDoc } = await client
    .from('documents')
    .select('is_favorite')
    .eq('id', id)
    .single();

  if (!currentDoc) {
    return null;
  }

  // 切换状态
  const { data, error } = await client
    .from('documents')
    .update({ is_favorite: !currentDoc.is_favorite })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('切换收藏状态失败:', error);
    return null;
  }

  return data;
}

// ==================== 文件夹操作 ====================

/**
 * 创建文件夹
 */
export async function createFolder(
  name: string,
  parentId: string | null = null,
  color?: string
): Promise<Folder> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('folders')
    .insert({
      name,
      parent_id: parentId,
      color,
    })
    .select()
    .single();

  if (error) {
    console.error('创建文件夹失败:', error);
    throw new Error('创建文件夹失败');
  }

  return data;
}

/**
 * 获取文件夹
 */
export async function getFolder(id: string): Promise<Folder | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('folders')
    .select('*')
    .eq('id', id)
    .eq('deleted_at', null)
    .single();

  if (error) {
    console.error('获取文件夹失败:', error);
    return null;
  }

  return data;
}

/**
 * 获取所有文件夹
 */
export async function getAllFolders(): Promise<Folder[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('folders')
    .select('*')
    .eq('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取文件夹列表失败:', error);
    return [];
  }

  return data || [];
}

/**
 * 更新文件夹
 */
export async function updateFolder(
  id: string,
  updates: Partial<Pick<Folder, 'name' | 'parentId' | 'color' | 'icon'>>
): Promise<Folder | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('folders')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新文件夹失败:', error);
    return null;
  }

  return data;
}

/**
 * 删除文件夹（软删除）
 */
export async function deleteFolder(id: string): Promise<boolean> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('folders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('删除文件夹失败:', error);
    return false;
  }

  return true;
}

// ==================== 版本历史操作 ====================

/**
 * 保存文档版本
 */
export async function saveDocumentVersion(
  documentId: string,
  content: string,
  title: string,
  description?: string
): Promise<DocumentVersion> {
  const client = getSupabaseClient();

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // 检查版本数量，如果超过 20 个，删除最旧的
  const { data: existingVersions } = await client
    .from('document_versions')
    .select('id')
    .eq('document_id', documentId)
    .order('saved_at', { ascending: false });

  if (existingVersions && existingVersions.length >= 20) {
    const versionsToDelete = existingVersions.slice(20);
    for (const version of versionsToDelete) {
      await client
        .from('document_versions')
        .delete()
        .eq('id', version.id);
    }
  }

  const { data, error } = await client
    .from('document_versions')
    .insert({
      document_id: documentId,
      content,
      title,
      description,
      word_count: wordCount,
    })
    .select()
    .single();

  if (error) {
    console.error('保存版本失败:', error);
    throw new Error('保存版本失败');
  }

  return data;
}

/**
 * 获取文档的所有版本
 */
export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('获取版本历史失败:', error);
    return [];
  }

  return data || [];
}

/**
 * 删除文档版本
 */
export async function deleteDocumentVersion(versionId: string): Promise<boolean> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('document_versions')
    .delete()
    .eq('id', versionId);

  if (error) {
    console.error('删除版本失败:', error);
    return false;
  }

  return true;
}
