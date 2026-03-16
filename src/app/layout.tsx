import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { PWAInstaller } from '@/components/pwa-installer';
import { ErrorBoundary } from '@/components/error-boundary';
import { I18nProvider } from '@/lib/i18n';

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
  // 基础元数据
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
    'React',
    'TypeScript',
  ],
  authors: [{ name: 'Therex Team', url: 'https://github.com/riceshowerX' }],
  creator: 'Therex Team',
  publisher: 'Therex Team',
  generator: 'Next.js',
  
  // 应用信息
  applicationName: 'Therex',
  category: 'Productivity',
  
  // PWA 配置
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Therex',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  
  // 搜索引擎索引
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
    title: 'Therex - Modern Markdown Editor with AI',
    description: 'A modern Markdown editor with AI-powered writing assistance, multi-document management, and real-time preview.',
    siteName: 'Therex',
    images: [
      {
        url: '/icons/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Therex Logo',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Therex - Modern Markdown Editor with AI',
    description: 'A modern Markdown editor with AI-powered writing assistance, multi-document management, and real-time preview.',
    images: ['/icons/logo.png'],
    creator: '@therex',
  },
  
  // 其他元数据
  bookmarks: ['https://github.com/riceshowerX/therex'],
  icons: {
    icon: [
      { url: '/icons/logo.png', sizes: '1024x1024' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/logo.png', sizes: '1024x1024' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            <I18nProvider>
              {children}
              <PWAInstaller />
            </I18nProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
