import type { Metadata, Viewport } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { PWAInstaller } from '@/components/pwa-installer';
import { ErrorBoundary } from '@/components/error-boundary';

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
    default: 'Therex - Modern Markdown Editor with AI',
    template: '%s | Therex',
  },
  description:
    'Therex is a modern Markdown editor with AI-powered writing assistance, multi-document management, real-time preview, and extensive export options. Inspired by Theresa.',
  keywords: [
    'Therex',
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
  authors: [{ name: 'Therex Team' }],
  generator: 'Next.js',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Therex',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Therex - Modern Markdown Editor with AI',
    description: 'A modern Markdown editor with AI-powered writing assistance, multi-document management, and real-time preview. Inspired by Theresa.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Therex - Modern Markdown Editor with AI',
    description: 'A modern Markdown editor with AI-powered writing assistance, multi-document management, and real-time preview. Inspired by Theresa.',
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
          <ErrorBoundary>
            {isDev && <Inspector />}
            {children}
            <PWAInstaller />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
