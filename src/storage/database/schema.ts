/**
 * MarkFlow 数据库 Schema
 *
 * 包含以下表：
 * - documents: 文档表
 * - folders: 文件夹表
 * - document_versions: 文档版本历史表
 * - ai_configurations: AI 配置表（可选，如果需要后端存储）
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod';

// ==================== Documents 表 ====================

export const documents = pgTable(
  'documents',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .default('default_user'), // 未来支持多用户时使用
    folderId: varchar('folder_id', { length: 36 })
      .references(() => folders.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull().default('Untitled'),
    content: text('content').notNull().default(''),
    isFavorite: boolean('is_favorite').notNull().default(false),
    tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`),
    wordCount: integer('word_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }), // 软删除
  },
  (table) => [
    index('documents_user_id_idx').on(table.userId),
    index('documents_folder_id_idx').on(table.folderId),
    index('documents_created_at_idx').on(table.createdAt),
    index('documents_updated_at_idx').on(table.updatedAt),
    index('documents_deleted_at_idx').on(table.deletedAt),
  ]
);

// ==================== Folders 表 ====================

export const folders = pgTable(
  'folders',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .default('default_user'),
    parentId: varchar('parent_id', { length: 36 }), // 自引用外键，在数据库中手动创建
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 7 }), // 十六进制颜色代码，如 #FF5733
    icon: varchar('icon', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }), // 软删除
  },
  (table) => [
    index('folders_user_id_idx').on(table.userId),
    index('folders_parent_id_idx').on(table.parentId),
    index('folders_created_at_idx').on(table.createdAt),
    index('folders_deleted_at_idx').on(table.deletedAt),
  ]
);

// ==================== Document Versions 表 ====================

export const documentVersions = pgTable(
  'document_versions',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    documentId: varchar('document_id', { length: 36 })
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: varchar('description', { length: 500 }), // 版本描述
    wordCount: integer('word_count').notNull().default(0),
    savedAt: timestamp('saved_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('document_versions_document_id_idx').on(table.documentId),
    index('document_versions_saved_at_idx').on(table.savedAt),
  ]
);

// ==================== AI Configurations 表（可选）====================

export const aiConfigurations = pgTable(
  'ai_configurations',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .default('default_user'),
    provider: varchar('provider', { length: 50 }).notNull(), // doubao, deepseek, openai, kimi, custom
    apiKey: text('api_key').notNull(),
    apiEndpoint: varchar('api_endpoint', { length: 500 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    temperature: integer('temperature').notNull().default(70), // 0-100, 对应 0.0-1.0
    maxTokens: integer('max_tokens').notNull().default(2048),
    enableSystemPrompt: boolean('enable_system_prompt').notNull().default(true),
    systemPrompt: text('system_prompt').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('ai_configurations_user_id_idx').on(table.userId),
    index('ai_configurations_provider_idx').on(table.provider),
    index('ai_configurations_is_default_idx').on(table.isDefault),
  ]
);

// ==================== Zod Schemas ====================

const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Document schemas
export const insertDocumentSchema = createCoercedInsertSchema(documents).pick({
  title: true,
  content: true,
  folderId: true,
  isFavorite: true,
  tags: true,
});

export const updateDocumentSchema = createCoercedInsertSchema(documents)
  .pick({
    title: true,
    content: true,
    folderId: true,
    isFavorite: true,
    tags: true,
  })
  .partial();

// Folder schemas
export const insertFolderSchema = createCoercedInsertSchema(folders).pick({
  name: true,
  parentId: true,
  color: true,
  icon: true,
});

export const updateFolderSchema = createCoercedInsertSchema(folders)
  .pick({
    name: true,
    parentId: true,
    color: true,
    icon: true,
  })
  .partial();

// Document Version schemas
export const insertDocumentVersionSchema = createCoercedInsertSchema(documentVersions).pick({
  documentId: true,
  content: true,
  title: true,
  description: true,
  wordCount: true,
});

// AI Configuration schemas
export const insertAIConfigurationSchema = createCoercedInsertSchema(aiConfigurations).pick({
  provider: true,
  apiKey: true,
  apiEndpoint: true,
  model: true,
  temperature: true,
  maxTokens: true,
  enableSystemPrompt: true,
  systemPrompt: true,
  isDefault: true,
});

export const updateAIConfigurationSchema = createCoercedInsertSchema(aiConfigurations)
  .pick({
    apiKey: true,
    apiEndpoint: true,
    model: true,
    temperature: true,
    maxTokens: true,
    enableSystemPrompt: true,
    systemPrompt: true,
    isDefault: true,
  })
  .partial();

// ==================== TypeScript Types ====================

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type UpdateFolder = z.infer<typeof updateFolderSchema>;

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

export type AIConfiguration = typeof aiConfigurations.$inferSelect;
export type InsertAIConfiguration = z.infer<typeof insertAIConfigurationSchema>;
export type UpdateAIConfiguration = z.infer<typeof updateAIConfigurationSchema>;
