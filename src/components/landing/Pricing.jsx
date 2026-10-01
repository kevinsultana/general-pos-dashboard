'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, Zap, ArrowRight } from 'lucide-react';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const tiers = [
    {
      name: 'FREE',
      planId: 'free',
      tagline: 'Cocok untuk kedai rintisan & pop-up booth baru mulai',
      priceMonthly: 0,
      priceAnnual: 0,
      popular: false,
      badge: 'Bebas Biaya Selamanya',
      features: [
        '1 Toko / 1 Cabang Utama',
        '1 User Kasir / Owner',
        'Kasir Cepat & Struk Thermal Bluetooth',
        'Ringkasan Laporan Penjualan Harian',
        'Katalog Hingga 100 Produk Menu',
        'Offline-First Local Sync',
      ],
      ctaText: 'Mulai Gratis',
      ctaStyle:
        'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/80 font-bold',
    },
    {
      name: 'PLUS',
      planId: 'plus',
      tagline: 'Paling diminati kafe & resto mandiri yang bertumbuh pesat',
      priceMonthly: 149000,
      priceAnnual: 119000,
      popular: true,
      badge: 'Paling Diminati',
      features: [
        '1 Cabang Utama Bebas Batasan Omzet',
        'Multi-User dengan Dynamic RBAC (Owner, Kasir, Spv)',
        'Manajemen Shift & Rekonsiliasi Cash Drawer',
        'Opname Stok Inventaris & Alert Bahan Menipis',
        'Analitik Penjualan Mendalam & Ekspor Excel',
        'Split Bill & Custom Pajak PB1 / Service Charge',
        'Dukungan Prioritas CS WhatsApp 24/7',
      ],
      ctaText: 'Pilih Paket Plus',
      ctaStyle:
        'bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-md shadow-slate-900/15',
    },
    {
      name: 'PRO',
      planId: 'pro',
      tagline: 'Standar emas untuk waralaba dan jaringan multi-outlet',
      priceMonthly: 399000,
      priceAnnual: 319000,
      popular: false,
      badge: 'Skala Multi-Cabang',
      features: [
        'Semua fitur pada Paket Plus',
        'Multi-Cabang (Multi-Outlet) Tak Terbatas',
        'Transfer & Distribusi Stok Antar Cabang',
        'Laporan Konsolidasi Laba Rugi Semua Outlet',
        'Integrasi API Webhook & Custom ERP Accounting',
        'Audit Log Aktivitas Sensitif (Void/Diskon)',
        'Dedicated Technical Account Manager',
      ],
      ctaText: 'Pilih Paket Pro',
      ctaStyle:
        'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold shadow-2xs',
    },
  ];

  return (
    <section id="harga" className="relative py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/75 border border-white/90 text-amber-700 text-xs font-semibold shadow-xs mb-4">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Investasi Transparan</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Pilihan Paket Sesuai Fase Skala Usahamu
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            Mulai dari paket gratis selamanya tanpa kartu kredit. Upgrade kapan saja saat tokomu membuka cabang baru.
          </p>

          {/* Annual / Monthly Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span
              className={`text-xs sm:text-sm font-semibold ${
                !isAnnual ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              Tagihan Bulanan
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 rounded-full bg-slate-200/80 border border-slate-300/80 p-1 transition-colors focus:outline-none"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-5 h-5 rounded-full bg-amber-500 shadow-sm transform transition-transform duration-300 ${
                  isAnnual ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  isAnnual ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                Tagihan Tahunan
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Hemat 20%
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => {
            const price = isAnnual ? tier.priceAnnual : tier.priceMonthly;
            return (
              <div
                key={tier.name}
                className={`relative rounded-3xl p-8 backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between ${
                  tier.popular
                    ? 'bg-white/85 border-2 border-amber-400/60 ring-2 ring-amber-400/40 shadow-[0_20px_50px_rgba(245,158,11,0.12)] lg:-translate-y-2'
                    : 'bg-white/65 hover:bg-white/85 border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] ring-1 ring-inset ring-white/60'
                }`}
              >
                {/* Popular Pill */}
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{tier.badge}</span>
                  </div>
                )}

                <div>
                  {/* Tier Title & Tagline */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 tracking-wide">{tier.name}</h3>
                    {!tier.popular && (
                      <span className="text-[11px] font-semibold text-slate-500 px-2.5 py-0.5 rounded-full bg-slate-100">
                        {tier.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 min-h-9">{tier.tagline}</p>

                  {/* Price */}
                  <div className="mt-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-500">Rp</span>
                      <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                        {price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">/ bulan</span>
                    </div>
                    {isAnnual && price > 0 && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        Ditagih tahunan (hemat Rp {(tier.priceMonthly - tier.priceAnnual) * 12}/thn)
                      </p>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="py-6 space-y-3.5">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Semua yang kamu dapatkan:
                    </p>
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mt-0.5 shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div className="pt-4">
                  <Link
                    href={`/register?plan=${tier.planId}`}
                    className={`w-full py-3.5 rounded-full text-xs sm:text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 ${tier.ctaStyle}`}
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
