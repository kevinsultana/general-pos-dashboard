'use client';

import { useLanguage } from '../../contexts/LanguageContext';

export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`relative inline-flex items-center bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-white/50 rounded-full p-1 select-none transition-all ${className}`}
      role="group"
      aria-label="Pilih Bahasa / Select Language"
    >
      {/* Sliding Pill Indicator */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white/95 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-all duration-300 ease-out pointer-events-none ${
          language === 'id' ? 'left-1' : 'left-[calc(50%)]'
        }`}
      />

      {/* Button: ID */}
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider transition-colors duration-200 cursor-pointer ${
          language === 'id'
            ? 'text-slate-900'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="Bahasa Indonesia"
      >
        <span className="text-xs leading-none">🇮🇩</span>
        <span>ID</span>
        {language === 'id' && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse" />
        )}
      </button>

      {/* Button: EN */}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider transition-colors duration-200 cursor-pointer ${
          language === 'en'
            ? 'text-slate-900'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="English"
      >
        <span className="text-xs leading-none">🇬🇧</span>
        <span>EN</span>
        {language === 'en' && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.9)] animate-pulse" />
        )}
      </button>
    </div>
  );
}
