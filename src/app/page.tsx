import type { Metadata } from 'next';
import MarkdownEditor from '@/components/markdown-editor';

export const metadata: Metadata = {
  title: 'Markdown 编辑器',
  description: '功能丰富的在线 Markdown 编辑器',
};

export default function Home() {
  return <MarkdownEditor />;
}
