'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const LANGUAGES = [
    { code: 'id', label: 'Bahasa Indonesia', short: 'ID', flag: '🇮🇩' },
    { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  ];

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/70 hover:bg-white/95 border border-slate-200/70 text-slate-700 hover:text-slate-900 shadow-2xs text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Pilih Bahasa / Select Language"
      >
        <span className="text-xs leading-none">{currentLang.flag}</span>
        <span className="text-[11px] font-black">{currentLang.short}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-700' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/5 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Bahasa / Language
          </div>
          {LANGUAGES.map((item) => {
            const isSelected = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 text-amber-900 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none">{item.flag}</span>
                  <span>{item.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
