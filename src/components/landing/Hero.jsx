'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Store, ChevronRight } from 'lucide-react';
import PosMockup from './PosMockup';

export default function Hero() {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Pill */}
        <div className="flex justify-center mb-6">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/75 border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl hover:border-amber-300 transition-all cursor-pointer group"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">
              Cloud POS Multi-Tenant Generasi Terbaru
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Hero Headline & Subheadline */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Dari Kedai Pertama Hingga{' '}
            <span className="bg-linear-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent">
              Ratusan Cabang
            </span>{' '}
            Tanpa Hambatan.
          </h1>

          <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Omni POS menghadirkan kecepatan transaksi kasir offline-first, isolasi tenant database yang aman, serta konsolidasi analitik multi-outlet secara real-time dalam balutan antarmuka kaca yang jernih.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm sm:text-base font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-[0_8px_25px_rgba(15,23,42,0.18)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.25)] transition-all duration-300 active:scale-95"
            >
              <span>Mulai Gratis Sekarang</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>

            <a
              href="#fitur"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm sm:text-base font-semibold text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white border border-white/90 shadow-sm backdrop-blur-xl transition-all duration-200"
            >
              <span>Eksplorasi Fitur</span>
            </a>
          </div>

          {/* Micro badges below CTA */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Isolasi Data Row-Level Tenant</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Cetak Struk Thermal Sub-Detik</span>
            </div>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-500" />
              <span>Siap Multi-Outlet Tanpa Batas</span>
            </div>
          </div>
        </div>

        {/* Interactive POS Kasir Glass Mockup */}
        <div className="mt-10">
          <PosMockup />
        </div>
      </div>
    </section>
  );
}
