'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Language, Translations } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  mounted: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_KEY = 'therex_language';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');
  const [mounted, setMounted] = useState(false);

  // 初始化时从 localStorage 读取语言设置
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY) as Language | null;
    if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    } else {
      // 根据浏览器语言自动检测
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        setLanguageState('zh');
      } else {
        setLanguageState('en');
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    // 更新 HTML lang 属性
    document.documentElement.lang = lang;
  }, []);

  // 组件挂载前使用默认语言，避免水合不匹配
  const t = (mounted ? translations[language] : translations.zh) as Translations;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, mounted }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// 便捷 hook，直接返回翻译函数
export function useTranslation() {
  const { t, language } = useI18n();
  return { t, language };
}
