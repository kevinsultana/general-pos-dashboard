'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dictionaries } from '../lib/dictionaries';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('id');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('omnipos_lang');
      if (stored === 'id' || stored === 'en') {
        setLanguageState(stored);
      }
    } catch {
      // localStorage mungkin tidak tersedia di environment tertentu
    }
  }, []);

  const setLanguage = useCallback((lang) => {
    if (lang === 'id' || lang === 'en') {
      setLanguageState(lang);
      try {
        localStorage.setItem('omnipos_lang', lang);
      } catch {
        // Abaikan jika storage error
      }
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'id' ? 'en' : 'id');
  }, [language, setLanguage]);

  /**
   * Helper Terjemahan
   * @param {string} path - dot notation, misal: 'navbar.login'
   * @param {object} [params] - parameter interpolasi, misal: { name: 'Kevin' }
   */
  const t = useCallback(
    (path, params = {}) => {
      if (!path) return '';

      const keys = path.split('.');
      let result = dictionaries[language];

      for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
          result = result[key];
        } else {
          result = null;
          break;
        }
      }

      // Fallback ke Bahasa Indonesia jika key belum ada di Bahasa Inggris
      if (result === null || result === undefined) {
        let fallback = dictionaries['id'];
        for (const key of keys) {
          if (fallback && typeof fallback === 'object' && key in fallback) {
            fallback = fallback[key];
          } else {
            fallback = null;
            break;
          }
        }
        result = fallback !== null && fallback !== undefined ? fallback : path;
      }

      // Interpolasi placeholder {paramName}
      if (typeof result === 'string' && params && typeof params === 'object') {
        return Object.entries(params).reduce((str, [pKey, pVal]) => {
          return str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
        }, result);
      }

      return result;
    },
    [language]
  );

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isIndonesian: language === 'id',
    isEnglish: language === 'en',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage harus digunakan di dalam komponen yang dibungkus <LanguageProvider>');
  }
  return context;
}

export default LanguageContext;
