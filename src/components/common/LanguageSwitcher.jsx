'use client';

import { useLanguage } from '../../contexts/LanguageContext';

export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 shadow-2xs ring-1 ring-inset ring-white/60 transition-all ${className}`}
      role="group"
      aria-label="Pilih Bahasa / Select Language"
    >
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
          language === 'id'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
        }`}
        title="Bahasa Indonesia"
      >
        <span className="text-xs leading-none">🇮🇩</span>
        <span>ID</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
          language === 'en'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
        }`}
        title="English"
      >
        <span className="text-xs leading-none">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
