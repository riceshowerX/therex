import type { Metadata, Viewport } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { PWAInstaller } from '@/components/pwa-installer';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'MarkFlow - Modern Markdown Editor with AI',
    template: '%s | MarkFlow',
  },
  description:
    'MarkFlow is a modern Markdown editor with AI-powered writing assistance, multi-document management, real-time preview, and extensive export options.',
  keywords: [
    'MarkFlow',
    'Markdown Editor',
    'AI Writing',
    'Online Editor',
    'Markdown',
    'Document Editor',
    'Real-time Preview',
    'Syntax Highlighting',
    'Export',
    'Next.js',
  ],
  authors: [{ name: 'MarkFlow Team' }],
  generator: 'Next.js',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MarkFlow',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'MarkFlow - Modern Markdown Editor with AI',
    description: 'A modern Markdown editor with AI-powered writing assistance, multi-document management, and real-time preview.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarkFlow - Modern Markdown Editor with AI',
    description: 'A modern Markdown editor with AI-powered writing assistance, multi-document management, and real-time preview.',
  },
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
          <PWAInstaller />
        </ThemeProvider>
      </body>
    </html>
  );
}
