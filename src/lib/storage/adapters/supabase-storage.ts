/**
 * Supabase 存储适配器
 *
 * 云数据库存储方案
 * 使用 Supabase (PostgreSQL) 存储数据
 *
 * 优点：
 * - 云端存储，数据安全
 * - 支持跨设备同步
 * - 容量大
 * - 支持多用户（未来扩展）
 *
 * 限制：
 * - 需要 Supabase 账号
 * - 需要网络连接
 * - 有免费额度限制
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  IStorageAdapter,
  StorageProvider,
  StorageDocument,
  StorageFolder,
  StorageDocumentVersion,
  SupabaseStorageConfig,
} from '../types';

export class SupabaseStorageAdapter implements IStorageAdapter {
  readonly provider: StorageProvider = 'supabase';
  
  private config: SupabaseStorageConfig;
  private client: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;
  private initialized: boolean = false;

  constructor(config: SupabaseStorageConfig) {
    this.config = config;
  }

  // ==================== 初始化 ====================

  async initialize(): Promise<boolean> {
    try {
      // 验证配置
      if (!this.config.url || !this.config.anonKey) {
        console.error('Supabase 配置不完整');
        return false;
      }

      // 创建客户端
      this.client = createClient(this.config.url, this.config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });

      // 创建管理员客户端（如果有 service role key）
      if (this.config.serviceRoleKey) {
        this.adminClient = createClient(this.config.url, this.config.serviceRoleKey, {
          auth: {
            persistSession: false,
          },
        });
      }

      // 测试连接
      const { error } = await this.client.from('documents').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        console.error('Supabase 连接测试失败:', error);
        return false;
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Supabase 初始化失败:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized && this.client !== null;
  }

  async close(): Promise<void> {
    this.client = null;
    this.adminClient = null;
    this.initialized = false;
  }

  // ==================== 私有方法 ====================

  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase 未初始化');
    }
    return this.client;
  }

  private generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : 
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateWordCount(content: string): number {
    if (!content || !content.trim()) return 0;
    const words = content.trim().match(/[\w\u4e00-\u9fa5]+/g);
    return words ? words.length : 0;
  }

  private transformDocumentFromDB(doc: any): StorageDocument {
    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
      isFavorite: doc.is_favorite,
      tags: doc.tags || [],
      wordCount: doc.word_count,
      folderId: doc.folder_id,
      deletedAt: doc.deleted_at ? new Date(doc.deleted_at) : null,
    };
  }

  private transformDocumentToDB(doc: Partial<StorageDocument>): any {
    const result: any = {};
    if (doc.title !== undefined) result.title = doc.title;
    if (doc.content !== undefined) result.content = doc.content;
    if (doc.isFavorite !== undefined) result.is_favorite = doc.isFavorite;
    if (doc.tags !== undefined) result.tags = doc.tags;
    if (doc.wordCount !== undefined) result.word_count = doc.wordCount;
    if (doc.folderId !== undefined) result.folder_id = doc.folderId;
    if (doc.deletedAt !== undefined) result.deleted_at = doc.deletedAt?.toISOString();
    result.updated_at = new Date().toISOString();
    return result;
  }

  private transformFolderFromDB(folder: any): StorageFolder {
    return {
      id: folder.id,
      name: folder.name,
      parentId: folder.parent_id,
      createdAt: new Date(folder.created_at),
      updatedAt: new Date(folder.updated_at),
      color: folder.color,
      icon: folder.icon,
      deletedAt: folder.deleted_at ? new Date(folder.deleted_at) : null,
    };
  }

  private transformVersionFromDB(version: any): StorageDocumentVersion {
    return {
      id: version.id,
      documentId: version.document_id,
      content: version.content,
      title: version.title,
      savedAt: new Date(version.saved_at),
      wordCount: version.word_count,
      description: version.description,
    };
  }

  // ==================== 文档操作 ====================

  async createDocument(doc: Omit<StorageDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageDocument> {
    const client = this.getClient();
    const now = new Date().toISOString();

    const { data, error } = await client
      .from('documents')
      .insert({
        title: doc.title,
        content: doc.content,
        is_favorite: doc.isFavorite,
        tags: doc.tags,
        word_count: this.calculateWordCount(doc.content),
        folder_id: doc.folderId,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformDocumentFromDB(data);
  }

  async getDocument(id: string): Promise<StorageDocument | null> {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.transformDocumentFromDB(data);
  }

  async updateDocument(id: string, updates: Partial<StorageDocument>): Promise<StorageDocument | null> {
    const client = this.getClient();
    
    const updateData = this.transformDocumentToDB(updates);
    if (updates.content !== undefined) {
      updateData.word_count = this.calculateWordCount(updates.content);
    }

    const { data, error } = await client
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.transformDocumentFromDB(data);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const client = this.getClient();
    
    const { error } = await client
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    return !error;
  }

  async getAllDocuments(folderId?: string | null): Promise<StorageDocument[]> {
    const client = this.getClient();
    
    let query = client
      .from('documents')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (folderId !== undefined) {
      query = folderId === null 
        ? query.is('folder_id', null)
        : query.eq('folder_id', folderId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(this.transformDocumentFromDB);
  }

  async searchDocuments(query: string): Promise<StorageDocument[]> {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('documents')
      .select('*')
      .is('deleted_at', null)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data.map(this.transformDocumentFromDB);
  }

  // ==================== 文件夹操作 ====================

  async createFolder(folder: Omit<StorageFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageFolder> {
    const client = this.getClient();
    const now = new Date().toISOString();

    const { data, error } = await client
      .from('folders')
      .insert({
        name: folder.name,
        parent_id: folder.parentId,
        color: folder.color,
        icon: folder.icon,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformFolderFromDB(data);
  }

  async getFolder(id: string): Promise<StorageFolder | null> {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('folders')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.transformFolderFromDB(data);
  }

  async updateFolder(id: string, updates: Partial<StorageFolder>): Promise<StorageFolder | null> {
    const client = this.getClient();
    
    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.icon !== undefined) updateData.icon = updates.icon;

    const { data, error } = await client
      .from('folders')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.transformFolderFromDB(data);
  }

  async deleteFolder(id: string): Promise<boolean> {
    const client = this.getClient();
    
    const { error } = await client
      .from('folders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    return !error;
  }

  async getAllFolders(): Promise<StorageFolder[]> {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('folders')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.transformFolderFromDB);
  }

  // ==================== 版本历史操作 ====================

  async saveDocumentVersion(version: Omit<StorageDocumentVersion, 'id' | 'savedAt'>): Promise<StorageDocumentVersion> {
    const client = this.getClient();
    
    // 检查版本数量
    const existingVersions = await this.getDocumentVersions(version.documentId);
    if (existingVersions.length >= 20) {
      // 删除最旧的版本
      const oldest = existingVersions[existingVersions.length - 1];
      await client.from('document_versions').delete().eq('id', oldest.id);
    }

    const { data, error } = await client
      .from('document_versions')
      .insert({
        document_id: version.documentId,
        content: version.content,
        title: version.title,
        description: version.description,
        word_count: this.calculateWordCount(version.content),
        saved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformVersionFromDB(data);
  }

  async getDocumentVersions(documentId: string): Promise<StorageDocumentVersion[]> {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('saved_at', { ascending: false });

    if (error) throw error;
    return data.map(this.transformVersionFromDB);
  }

  async deleteDocumentVersion(versionId: string): Promise<boolean> {
    const client = this.getClient();
    
    const { error } = await client
      .from('document_versions')
      .delete()
      .eq('id', versionId);

    return !error;
  }

  // ==================== 数据迁移 ====================

  async exportAllData(): Promise<{
    documents: StorageDocument[];
    folders: StorageFolder[];
    versions: StorageDocumentVersion[];
  }> {
    const [documents, folders] = await Promise.all([
      this.getAllDocuments(),
      this.getAllFolders(),
    ]);

    // 获取所有版本
    const client = this.getClient();
    const { data: versionsData } = await client
      .from('document_versions')
      .select('*')
      .order('saved_at', { ascending: false });

    const versions = (versionsData || []).map(this.transformVersionFromDB);

    return { documents, folders, versions };
  }

  async importData(data: {
    documents?: StorageDocument[];
    folders?: StorageFolder[];
    versions?: StorageDocumentVersion[];
  }): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    const client = this.getClient();

    // 导入文件夹
    if (data.folders) {
      for (const folder of data.folders) {
        try {
          await client.from('folders').insert({
            id: folder.id,
            name: folder.name,
            parent_id: folder.parentId,
            color: folder.color,
            icon: folder.icon,
            created_at: folder.createdAt.toISOString(),
            updated_at: folder.updatedAt.toISOString(),
          });
          success++;
        } catch {
          failed++;
        }
      }
    }

    // 导入文档
    if (data.documents) {
      for (const doc of data.documents) {
        try {
          await client.from('documents').insert({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            is_favorite: doc.isFavorite,
            tags: doc.tags,
            word_count: doc.wordCount,
            folder_id: doc.folderId,
            created_at: doc.createdAt.toISOString(),
            updated_at: doc.updatedAt.toISOString(),
          });
          success++;
        } catch {
          failed++;
        }
      }
    }

    // 导入版本历史
    if (data.versions) {
      for (const version of data.versions) {
        try {
          await client.from('document_versions').insert({
            id: version.id,
            document_id: version.documentId,
            content: version.content,
            title: version.title,
            description: version.description,
            word_count: version.wordCount,
            saved_at: version.savedAt.toISOString(),
          });
          success++;
        } catch {
          failed++;
        }
      }
    }

    return { success, failed };
  }
}
