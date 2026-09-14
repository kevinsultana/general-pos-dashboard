'use client';

import React, { useState } from 'react';
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  Smartphone,
  Globe,
  BarChart,
  RefreshCw,
} from 'lucide-react';
import { Topbar } from '../../../components/Topbar';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

export default function SubscriptionPage() {
  const { store, subscription, refreshSubscription } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentPlan = store?.subscriptionPlan || subscription?.plan || 'PRO';

  const handleSwitchPlan = async (targetPlan: 'FREE' | 'PAID' | 'PRO') => {
    setIsUpdating(true);
    setMessage(null);
    try {
      await api.upgradeSubscription(targetPlan);
      await refreshSubscription();
      setMessage(`Berhasil beralih ke paket ${targetPlan}!`);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah paket');
    } finally {
      setIsUpdating(false);
    }
  };

  const PLANS = [
    {
      id: 'FREE',
      name: 'Free (Gratis)',
      price: 'Rp 0',
      period: 'Selamanya',
      description: 'Untuk UMKM pemula yang hanya butuh kasir kasir offline tunggal.',
      icon: Smartphone,
      color: 'slate',
      features: [
        { text: 'Aplikasi POS Mobile Offline', included: true },
        { text: 'Cetak Struk Thermal (58/80mm)', included: true },
        { text: 'Manajemen Produk & Kategori Lokal', included: true },
        { text: 'Sinkronisasi Cloud Multi-Perangkat', included: false },
        { text: 'Hak Akses Staf / Multi-User', included: false },
        { text: 'Web Dashboard Pro', included: false },
        { text: 'Laporan Finansial Real-time', included: false },
      ],
    },
    {
      id: 'PAID',
      name: 'Paid (Bisnis)',
      price: 'Rp 49.000',
      period: 'per bulan',
      description: 'Untuk toko dengan beberapa kasir cabang dan pelacakan inventori cloud.',
      icon: Zap,
      color: 'indigo',
      features: [
        { text: 'Semua Fitur Paket Free', included: true },
        { text: 'Sinkronisasi Cloud Multi-Perangkat', included: true },
        { text: 'Penyimpanan Database Cloud Aman', included: true },
        { text: 'Buku Mutasi Stok & Penyesuaian', included: true },
        { text: 'Hak Akses Staf (Owner, Admin, Kasir)', included: true },
        { text: 'Web Dashboard Pro', included: false },
        { text: 'Laporan Finansial Lanjutan (CSV)', included: false },
      ],
    },
    {
      id: 'PRO',
      name: 'Pro (Enterprise)',
      price: 'Rp 149.000',
      period: 'per bulan',
      description: 'Akses tanpa batas ke Web Dashboard, analitik laba-rugi, dan kendali penuh bisnis.',
      icon: Crown,
      color: 'amber',
      isPopular: true,
      features: [
        { text: 'Semua Fitur Paket Paid', included: true },
        { text: 'Akses Penuh Web Dashboard Pro', included: true },
        { text: 'Laporan Laba Rugi & Analitik Penjualan', included: true },
        { text: 'Ekspor Data Laporan (CSV / Excel)', included: true },
        { text: 'Pusat Kontrol Diskon & Promosi', included: true },
        { text: 'Bypass Limit Perangkat POS', included: true },
        { text: 'Prioritas Sinkronisasi Cloud', included: true },
      ],
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Topbar
        title="Paket Langganan & Hak Akses (Entitlement)"
        description="Pilih dan kelola tingkatan fitur sesuai skala dan kebutuhan pertumbuhan usaha Anda"
      />

      <main className="p-6 space-y-6 flex-1">
        {/* Active Plan Banner */}
        <div className="glass-card p-6 border border-indigo-500/30 bg-linear-to-r from-indigo-950/30 to-[#121829] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">
                  Paket Toko Anda:{' '}
                  <span className="text-amber-400 font-mono">[{currentPlan}]</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AKTIF
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Toko: <strong>{store?.name}</strong> • Seluruh hak akses fitur otomatis disesuaikan
                dengan tier ini.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Status Server:</span>
            <span className="font-semibold text-emerald-400">Tersinkronisasi</span>
          </div>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
            <span>✓ {message}</span>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-200">
              ✕
            </button>
          </div>
        )}

        {/* Plan Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p) => {
            const isCurrent = currentPlan === p.id;
            const Icon = p.icon;

            return (
              <div
                key={p.id}
                className={`glass-card p-6 flex flex-col justify-between relative transition duration-200 ${
                  p.isPopular
                    ? 'border-amber-500/40 shadow-xl shadow-amber-500/5'
                    : 'border-slate-800'
                }`}
              >
                {p.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-linear-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-[10px] shadow-md uppercase tracking-wider">
                    Paling Direkomendasikan
                  </div>
                )}

                <div>
                  <div className="flex items-center space-x-2.5 mb-2">
                    <div
                      className={`p-2 rounded-xl ${
                        p.id === 'PRO'
                          ? 'bg-amber-500/10 text-amber-400'
                          : p.id === 'PAID'
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-slate-100">{p.name}</h4>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 min-h-9">{p.description}</p>

                  <div className="mt-4 pb-4 border-b border-slate-800">
                    <span className="text-2xl font-extrabold text-slate-100 font-mono">
                      {p.price}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">/ {p.period}</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-4 space-y-2.5">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs">
                        {f.included ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        )}
                        <span className={f.included ? 'text-slate-300' : 'text-slate-600'}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    disabled={isCurrent || isUpdating}
                    onClick={() => handleSwitchPlan(p.id as any)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-400 cursor-default border border-slate-700'
                        : p.id === 'PRO'
                        ? 'bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    {isCurrent ? (
                      <span>Paket Aktif Saat Ini</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Beralih ke {p.id} (Uji Coba)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
