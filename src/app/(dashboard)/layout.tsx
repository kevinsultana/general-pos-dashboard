'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Sparkles, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/Sidebar';
import { api } from '../../lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, store, subscription, isLoading, logout, refreshSubscription } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Memuat sesi dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const plan = store?.subscriptionPlan || subscription?.plan || 'PRO';

  // ── Plan Entitlement Lock: PRO only for Web Dashboard ──
  if (plan !== 'PRO') {
    const handleUpgradeToPro = async () => {
      try {
        await api.upgradeSubscription('PRO');
        await refreshSubscription();
      } catch (err: any) {
        alert(err.message || 'Gagal upgrade paket');
      }
    };

    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 text-center border border-amber-500/30 bg-[#121829]/90 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="inline-flex p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
            <Crown className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-bold text-slate-100">Fitur Eksklusif Paket PRO</h2>
          <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300">
            <span>Paket Anda Saat Ini:</span>
            <span className="font-bold text-amber-400">{plan}</span>
          </div>

          <p className="text-xs text-slate-300 mt-4 leading-relaxed">
            Web Dashboard dengan analitik keuangan real-time, manajemen produk terpusat, dan laporan laba-rugi
            eksklusif tersedia untuk pelanggan paket <strong>PRO</strong>.
          </p>

          <div className="mt-6 space-y-2.5">
            <button
              onClick={handleUpgradeToPro}
              className="w-full py-3 px-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Upgrade ke PRO Sekarang (Simulasi)</span>
            </button>

            <button
              onClick={logout}
              className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-700/60 flex items-center justify-center space-x-2 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0b0f19]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
