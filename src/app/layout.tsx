import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: {
    default: 'Markdown 编辑器 | 在线文档编辑工具',
    template: '%s | Markdown 编辑器',
  },
  description:
    '功能丰富的在线 Markdown 编辑器，支持实时预览、语法高亮、多种导出格式、历史记录等功能',
  keywords: [
    'Markdown 编辑器',
    '在线编辑器',
    'Markdown',
    '文档编辑',
    '实时预览',
    '语法高亮',
    '导出',
  ],
  authors: [{ name: 'Markdown Editor Team' }],
  generator: 'Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isDev && <Inspector />}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
