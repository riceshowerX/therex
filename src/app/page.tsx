import type { Metadata } from 'next';
import MarkdownEditor from '@/components/markdown-editor';

export const metadata: Metadata = {
  title: 'Editor',
  description: 'Write and edit Markdown documents with AI assistance, real-time preview, and powerful export options.',
};

export default function Home() {
  return <MarkdownEditor />;
}
