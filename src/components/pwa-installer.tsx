'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // 注册 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    }

    // 监听 install 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 检查是否已安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA is installed');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // 显示安装提示
    (deferredPrompt as BeforeInstallPromptEvent).prompt();

    // 等待用户响应
    const { outcome } = await (deferredPrompt as BeforeInstallPromptEvent).userChoice;

    if (outcome === 'accepted') {
      toast.success('MarkFlow has been installed!');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install MarkFlow</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Install MarkFlow for offline access and a better experience.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setShowInstallPrompt(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={handleInstall} className="flex-1">
          Install
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInstallPrompt(false)}
        >
          Not now
        </Button>
      </div>
    </div>
  );
}

// BeforeInstallPromptEvent 类型定义
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
