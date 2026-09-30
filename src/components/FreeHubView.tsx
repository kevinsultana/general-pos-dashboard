'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Smartphone,
  Download,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  CloudOff,
  Cloud,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UpgradeModal } from './UpgradeModal';

export function FreeHubView() {
  const { store, user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-2xl glass-card bg-linear-to-r from-slate-900/90 via-[#11192e]/90 to-slate-900/90 border border-slate-700/60 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Mode Kasir Mandiri (FREE)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Store ID: {store?.id?.substring(0, 8)}...
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Selamat Datang di <span className="text-indigo-400">{store?.name || 'Toko Anda'}</span>
            </h1>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Akun toko Anda telah terdaftar resmi. Pada <strong>Paket FREE</strong>, Anda dapat menjalankan seluruh operasional kasir penjualan, stok barang, diskon, dan cetak printer thermal secara <strong>100% Offline</strong> melalui aplikasi Android Mobile POS.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="py-3 px-5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade ke Cloud PRO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Download APK Section */}
      <div className="rounded-2xl glass-card bg-[#121829]/80 border border-indigo-500/30 p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  Download Aplikasi Android Mobile POS
                </h2>
                <p className="text-xs text-slate-400">
                  Khusus Smartphone & Tablet Android (Universal APK ARM64/x86_64)
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pasang aplikasi di HP kasir toko Anda. Setelah login menggunakan username dan password akun toko ini, aplikasi dapat digunakan secara mandiri tanpa memerlukan sambungan internet aktif.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="/downloads/general-pos-mobile.apk"
                download="general-pos-mobile.apk"
                className="py-3.5 px-6 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center space-x-2.5 transition transform active:scale-98"
              >
                <Download className="w-5 h-5" />
                <span>Download APK Android (42 MB)</span>
              </a>

              <span className="text-[11px] text-slate-400 font-mono bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800">
                Versi: 1.0.0 Stable
              </span>
            </div>
          </div>

          {/* Quick Installation Guide Card */}
          <div className="lg:w-96 rounded-xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 shrink-0">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Panduan Singkat Instalasi</span>
            </h3>

            <ol className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                  1
                </span>
                <span>
                  <strong>Unduh APK:</strong> Simpan file APK di smartphone Android Anda. Aktifkan izin <em>"Install Unknown Apps"</em> di Setelan Keamanan HP jika diminta.
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                  2
                </span>
                <span>
                  <strong>Masuk dengan Akun:</strong> Buka aplikasi dan masukkan Username <strong>({user?.username || 'owner'})</strong> beserta Password yang Anda daftarkan.
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                  3
                </span>
                <span>
                  <strong>Mulai Berjualan:</strong> Tambahkan produk, atur stok, sambungkan printer bluetooth, dan layani pelanggan secara 100% offline!
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Feature Comparison Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Komparasi Paket Layanan</h2>
          <p className="text-xs text-slate-400">
            Pilih paket yang paling sesuai dengan kebutuhan pertumbuhan usaha UMKM Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FREE Tier Card */}
          <div className="rounded-2xl glass-card bg-slate-900/50 border border-slate-700/60 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  PAKET AKTIF
                </span>
                <h3 className="text-xl font-bold text-slate-100 mt-2">FREE (Mode Lokal)</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-100">Rp 0</p>
                <p className="text-[10px] text-slate-400">Gratis Selamanya</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Cocok untuk toko mandiri, UMKM pemula, atau pedagang ritel yang mengutamakan operasional kasir offline tanpa ketergantungan internet.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Aplikasi Kasir Android Mobile POS Offline</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pencatatan Penjualan & Diskon Manual</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Manajemen Stok & Harga Pokok (HPP) Lokal</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cetak Struk Thermal Bluetooth (58mm & 80mm)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Backup & Restore Database Lokal</span>
              </li>
            </ul>

            <div className="pt-2">
              <span className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center">
                Paket Anda Saat Ini
              </span>
            </div>
          </div>

          {/* PRO Tier Card */}
          <div className="rounded-2xl glass-card bg-[#11172a] border-2 border-indigo-500/60 p-6 space-y-5 relative shadow-xl shadow-indigo-600/10">
            <div className="absolute top-0 right-6 -translate-y-1/2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-linear-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md">
                DIREKOMENDASIKAN
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PAKET PRO
                </span>
                <h3 className="text-xl font-bold text-slate-100 mt-2">PRO (Cloud & Web)</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-indigo-400">Rp 49.000</p>
                <p className="text-[10px] text-slate-400">/ bulan / toko</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Solusi lengkap untuk bisnis berkembang: sinkronisasi multi-kasir, akses web dashboard, dan analitik finansial laba rugi real-time.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-200">
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span><strong>Semua fitur Paket FREE</strong></span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span><strong>Sinkronisasi Cloud Otomatis</strong> antar perangkat kasir</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span><strong>Akses Penuh Web Dashboard</strong> dari Laptop / PC</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span><strong>Multi-Kasir & Role Staf</strong> (Admin, Kasir, Owner)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span><strong>Laporan Finansial Real-time:</strong> Omzet, Margin Laba, HPP</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span><strong>Manajemen Voucher & Promosi</strong> Lanjutan</span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Coba / Upgrade ke PRO (Simulasi)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
