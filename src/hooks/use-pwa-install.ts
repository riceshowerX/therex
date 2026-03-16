'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isSupported: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>({
    canInstall: false,
    isInstalled: false,
    isStandalone: false,
    isSupported: false,
    installPrompt: null,
  });

  useEffect(() => {
    // 检查是否已经安装（以 standalone 模式运行）
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - iOS Safari
      window.navigator.standalone === true;

    // 检查是否支持 PWA
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

    setState(prev => ({
      ...prev,
      isStandalone,
      isInstalled: isStandalone,
      isSupported,
    }));

    // 监听 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      
      setState(prev => ({
        ...prev,
        canInstall: true,
        installPrompt: promptEvent,
      }));
    };

    // 监听 appinstalled 事件
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        canInstall: false,
        isInstalled: true,
        installPrompt: null,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!state.installPrompt) {
      return false;
    }

    try {
      await state.installPrompt.prompt();
      const { outcome } = await state.installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          canInstall: false,
          isInstalled: true,
          installPrompt: null,
        }));
        return true;
      }
    } catch (error) {
      console.error('PWA install error:', error);
    }
    
    return false;
  }, [state.installPrompt]);

  return {
    ...state,
    install,
  };
}
