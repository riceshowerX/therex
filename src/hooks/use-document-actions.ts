/**
 * Document Actions Hook
 * Handles document-level operations (save, load, export, etc.)
 */

import { useState, useCallback } from 'react';
import { getStorageManager } from '@/lib/storage/manager';
import type { Document } from '@/types';

export interface UseDocumentActionsReturn {
  isLoading: boolean;
  error: string | null;
  saveDocument: (document: Document) => Promise<void>;
  loadDocument: (id: string) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<void>;
  exportDocument: (document: Document, format: 'markdown' | 'html' | 'pdf') => Promise<void>;
  duplicateDocument: (document: Document) => Promise<Document>;
}

export function useDocumentActions(): UseDocumentActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveDocument = useCallback(async (document: Document): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const storageManager = getStorageManager();
      // Use updateDocument for existing documents
      const existingDoc = storageManager.getDocument(document.id);
      if (existingDoc) {
        storageManager.updateDocument(document.id, {
          title: document.title,
          content: document.content,
          folderId: document.folderId,
          isFavorite: document.isFavorite,
          tags: document.tags,
        });
      } else {
        // Create new document (without id and isFavorite)
        const newDoc = storageManager.createDocument({
          title: document.title,
          content: document.content,
          folderId: document.folderId,
        });
        // Set additional properties after creation
        if (document.isFavorite || document.tags?.length) {
          storageManager.updateDocument(newDoc.id, {
            isFavorite: document.isFavorite,
            tags: document.tags,
          });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save document';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDocument = useCallback(async (id: string): Promise<Document | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const storageManager = getStorageManager();
      const document = storageManager.getDocument(id);
      return document || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const storageManager = getStorageManager();
      storageManager.deleteDocument(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportDocument = useCallback(async (
    document: Document,
    format: 'markdown' | 'html' | 'pdf'
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      switch (format) {
        case 'markdown':
          content = document.content;
          mimeType = 'text/markdown';
          extension = 'md';
          break;
        case 'html':
          // Basic markdown to HTML conversion
          content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${document.title}</title>
</head>
<body>
  <h1>${document.title}</h1>
  <div class="content">
    <pre>${document.content}</pre>
  </div>
</body>
</html>`;
          mimeType = 'text/html';
          extension = 'html';
          break;
        case 'pdf':
          // Note: PDF export would require additional libraries like puppeteer
          throw new Error('PDF export is not yet implemented');
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Create download using global document object
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = globalThis.document.createElement('a');
      anchor.href = url;
      anchor.download = `${document.title}.${extension}`;
      globalThis.document.body.appendChild(anchor);
      anchor.click();
      globalThis.document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export document';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const duplicateDocument = useCallback(async (document: Document): Promise<Document> => {
    const storageManager = getStorageManager();
    const duplicated = storageManager.createDocument({
      title: `${document.title} (Copy)`,
      content: document.content,
      folderId: document.folderId,
    });

    // Set additional properties after creation
    if (document.tags?.length) {
      storageManager.updateDocument(duplicated.id, {
        tags: document.tags,
      });
    }

    return duplicated;
  }, []);

  return {
    isLoading,
    error,
    saveDocument,
    loadDocument,
    deleteDocument,
    exportDocument,
    duplicateDocument,
  };
}
