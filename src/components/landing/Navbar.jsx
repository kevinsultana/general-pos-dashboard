'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { name: t('navbar.features'), href: '#fitur' },
    { name: t('navbar.solutions'), href: '#solusi' },
    { name: t('navbar.pricing'), href: '#harga' },
    { name: t('navbar.security'), href: '#keamanan' },
  ];

  return (
    <header className="sticky top-4 z-50 max-w-6xl mx-auto px-4 sm:px-6 w-full">
      {/* Floating Liquid Capsule Bar */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] ring-1 ring-inset ring-white/60 rounded-full px-4 sm:px-6 py-2.5 transition-all duration-300">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-500 to-amber-600 p-0.5 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <Layers className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Omni<span className="text-amber-600">POS</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 tracking-wide">
                {t('navbar.multiTenantBadge')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100/70 transition-all duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Language Switcher & CTA Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <LanguageSwitcher />

            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-full transition-colors"
            >
              {t('navbar.login')}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('navbar.register')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggler & Language Switcher */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-full bg-slate-100/80 border border-white text-slate-700 hover:text-slate-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Capsule */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/90 shadow-xl space-y-2">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-amber-600 hover:bg-amber-50/60 rounded-xl transition-colors"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 text-center text-xs font-semibold text-slate-700 rounded-xl bg-slate-100/80 border border-slate-200/50"
            >
              {t('navbar.dashboardRedirect')}
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 text-center text-xs font-semibold text-white rounded-xl bg-slate-900 shadow-sm"
            >
              {t('navbar.freeRegisterCta')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
